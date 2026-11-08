import { useEffect, useState } from 'react'
import { createDefaultReleaseConfig } from '../model/defaults.ts'
import {
  applyKnownFields,
  parseConfigurationText,
  serializeConfiguration,
  toFormValues,
  type ReleaseConfigFormValues,
} from '../model/document.ts'
import type { ReleaseConfigDraft } from '../model/schema.ts'
import { validateReleaseConfig, validateReleaseConfigForExport, type ValidationIssue } from '../model/validation.ts'
import { downloadTextFile, readTextFile } from '../infrastructure/files/browser-files.ts'
import { loadDraftSession, saveDraftSession } from '../infrastructure/storage/draft-session.ts'
import { useConfigurationForm } from './useConfigurationForm.ts'

export const defaultConfigurationFileName = 'release-config.json'

export type ConfigurationNotice =
  | { kind: 'syntax'; message: string }
  | { kind: 'structure'; issues: ValidationIssue[] }
  | { kind: 'export'; issues: ValidationIssue[] }
  | { kind: 'downloaded' }

const initialDocument = () => createDefaultReleaseConfig()

const workingDocument = (
  source: ReleaseConfigDraft,
  values: ReleaseConfigFormValues,
  removeVdd: boolean,
) => applyKnownFields(source, values, { removeVdd })

export const useConfigurationSession = () => {
  const [restored] = useState(loadDraftSession)
  const form = useConfigurationForm(restored ? toFormValues(restored.document) : undefined)
  const [source, setSource] = useState<ReleaseConfigDraft>(() => restored?.document ?? initialDocument())
  const [cleanText, setCleanText] = useState(() => restored?.cleanText ?? serializeConfiguration(initialDocument()))
  const [fileName, setFileName] = useState<string | null>(() => restored?.fileName ?? null)
  const [removeVdd, setRemoveVdd] = useState(false)
  const [notice, setNotice] = useState<{ value: ConfigurationNotice; text: string } | null>(null)
  const [pendingFile, setPendingFile] = useState<{ name: string; document: ReleaseConfigDraft } | null>(null)
  const values = form.watch()
  const vddRemoved = removeVdd && values.vdd !== undefined
  const current = workingDocument(source, values, vddRemoved)
  const currentText = serializeConfiguration(current)
  const visibleNotice = notice?.text === currentText ? notice.value : null

  useEffect(() => {
    const validated = validateReleaseConfig(JSON.parse(currentText))
    if (!validated.success) {
      return
    }
    saveDraftSession({ document: validated.data, cleanText, fileName })
  }, [currentText, cleanText, fileName])

  useEffect(() => {
    if (currentText === cleanText) {
      return
    }
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [currentText, cleanText])

  const showNotice = (value: ConfigurationNotice) => setNotice({ value, text: currentText })

  const openDocument = (name: string, document: ReleaseConfigDraft) => {
    const formValues = toFormValues(document)
    const text = serializeConfiguration(workingDocument(document, formValues, false))
    setSource(document)
    setRemoveVdd(false)
    setFileName(name)
    setCleanText(text)
    form.reset(formValues)
    setPendingFile(null)
    setNotice(null)
  }

  const chooseFile = async (file: File) => {
    const text = await readTextFile(file)
    const parsed = parseConfigurationText(text)
    if (!parsed.success) {
      showNotice({ kind: 'syntax', message: parsed.message })
      return
    }

    const validated = validateReleaseConfig(parsed.data)
    if (!validated.success) {
      showNotice({ kind: 'structure', issues: validated.issues })
      return
    }

    if (currentText !== cleanText) {
      setNotice(null)
      setPendingFile({ name: file.name, document: validated.data })
      return
    }

    openDocument(file.name, validated.data)
  }

  const download = () => {
    const document = workingDocument(source, form.getValues(), vddRemoved)
    const validated = validateReleaseConfigForExport(document)
    if (!validated.success) {
      showNotice({ kind: 'export', issues: validated.issues })
      return
    }

    const text = serializeConfiguration(document)
    downloadTextFile(fileName ?? defaultConfigurationFileName, text)
    setCleanText(text)
    showNotice({ kind: 'downloaded' })
  }

  const removeVddBlock = () => {
    setSource((currentSource) => workingDocument(currentSource, form.getValues(), true))
    setRemoveVdd(true)
  }

  return {
    control: form.control,
    setValue: form.setValue,
    unregister: form.unregister,
    currentText,
    fileName: fileName ?? defaultConfigurationFileName,
    notice: visibleNotice,
    pendingFile,
    chooseFile,
    confirmOpen: () => {
      if (pendingFile) {
        openDocument(pendingFile.name, pendingFile.document)
      }
    },
    cancelOpen: () => setPendingFile(null),
    download,
    includeVdd: () => setRemoveVdd(false),
    removeVddBlock,
  }
}
