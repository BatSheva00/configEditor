import { validateReleaseConfig } from '../../model/validation.ts'
import type { ReleaseConfigDraft } from '../../model/schema.ts'

export const draftSessionKey = 'config-editor-draft'

export type DraftSession = {
  document: ReleaseConfigDraft
  cleanText: string
  fileName: string | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// The draft includes the password. sessionStorage keeps it for this tab only.
export const loadDraftSession = (): DraftSession | null => {
  try {
    const raw = sessionStorage.getItem(draftSessionKey)
    if (raw === null) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || typeof parsed.cleanText !== 'string') {
      return null
    }
    if (parsed.fileName !== null && typeof parsed.fileName !== 'string') {
      return null
    }

    const document = validateReleaseConfig(parsed.document)
    if (!document.success) {
      return null
    }

    return {
      document: document.data,
      cleanText: parsed.cleanText,
      fileName: parsed.fileName,
    }
  } catch {
    return null
  }
}

export const saveDraftSession = (session: DraftSession) => {
  sessionStorage.setItem(draftSessionKey, JSON.stringify(session))
}
