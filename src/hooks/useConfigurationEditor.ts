import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createDefaultReleaseConfig } from '../model/defaults.ts'
import {
  applyKnownFields,
  parseConfigurationText,
  serializeConfiguration,
  toFormValues,
} from '../model/convertConfiguration.ts'
import type { ReleaseConfigDraft } from '../model/schema.ts'
import type { ValidationIssue } from '../model/validationTypes.ts'
import { validateReleaseConfig, validateReleaseConfigForExport } from '../model/validation.ts'
import { downloadTextFile, readTextFile } from '../infrastructure/files/browser-files.ts'
import { useConfigurationForm } from './useConfigurationForm.ts'

export const defaultConfigurationFileName = 'release-config.json'

export type ConfigurationNotice =
  | { kind: 'syntax'; message: string }
  | { kind: 'structure'; issues: ValidationIssue[] }
  | { kind: 'read'; message: string }
  | { kind: 'downloaded' }

export const useConfigurationEditor = () => {
  const form = useConfigurationForm()
  const [source, setSource] = useState<ReleaseConfigDraft>(createDefaultReleaseConfig)
  const [cleanText, setCleanText] = useState(() => serializeConfiguration(createDefaultReleaseConfig()))
  const [fileName, setFileName] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ value: ConfigurationNotice; text: string } | null>(null)
  const [pendingFile, setPendingFile] = useState<{ name: string; document: ReleaseConfigDraft } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const importingRef = useRef(false)
  const latestText = useRef({ currentText: '', cleanText: '' })
  const values = form.watch()
  const current = applyKnownFields(source, values)
  const currentText = serializeConfiguration(current)
  const exportCheck = validateReleaseConfigForExport(current)
  const canDownload = exportCheck.success
  const downloadIssues = exportCheck.success ? [] : exportCheck.issues
  const visibleNotice = notice?.text === currentText ? notice.value : null

  useLayoutEffect(() => {
    latestText.current = { currentText, cleanText }
  }, [currentText, cleanText])

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

  const showNotice = (value: ConfigurationNotice) =>
    setNotice({ value, text: latestText.current.currentText })

  const openDocument = (name: string, document: ReleaseConfigDraft) => {
    const formValues = toFormValues(document)
    const text = serializeConfiguration(applyKnownFields(document, formValues))
    setSource(document)
    setFileName(name)
    setCleanText(text)
    form.reset(formValues)
    setPendingFile(null)
    setNotice(null)
  }

  const importFile = async (file: File) => {
    if (importingRef.current || pendingFile) {
      return
    }

    importingRef.current = true
    setIsImporting(true)
    try {
      let text: string
      try {
        text = await readTextFile(file)
      } catch {
        showNotice({ kind: 'read', message: 'Choose the file again.' })
        return
      }

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

      const latest = latestText.current
      if (latest.currentText !== latest.cleanText) {
        setNotice(null)
        setPendingFile({ name: file.name, document: validated.data })
        return
      }

      openDocument(file.name, validated.data)
    } finally {
      importingRef.current = false
      setIsImporting(false)
    }
  }

  const revealFieldErrors = useCallback(() => {
    void form.handleSubmit(() => undefined)()
  }, [form])

  const download = () => {
    const document = applyKnownFields(source, form.getValues())
    const validated = validateReleaseConfigForExport(document)
    if (!validated.success) {
      return
    }

    const text = serializeConfiguration(document)
    downloadTextFile(fileName ?? defaultConfigurationFileName, text)
    setCleanText(text)
    showNotice({ kind: 'downloaded' })
  }

  const includeVdd = () => {
    form.setValue('vdd', { versionNumber: '', releaseDate: '', recentFixes: [] }, { shouldDirty: true })
  }

  const removeVddBlock = () => {
    setSource((currentSource) => applyKnownFields(currentSource, form.getValues(), { removeVdd: true }))
    form.unregister('vdd')
  }

  return {
    control: form.control,
    setValue: form.setValue,
    currentText,
    canDownload,
    downloadIssues,
    fileName: fileName ?? defaultConfigurationFileName,
    notice: visibleNotice,
    pendingFile,
    isImporting,
    importFile,
    confirmOpen: () => {
      if (pendingFile) {
        openDocument(pendingFile.name, pendingFile.document)
      }
    },
    cancelOpen: () => setPendingFile(null),
    download,
    revealFieldErrors,
    includeVdd,
    removeVddBlock,
  }
}
