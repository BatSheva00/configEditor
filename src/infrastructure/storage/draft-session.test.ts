// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultReleaseConfig } from '../../model/defaults.ts'
import { serializeConfiguration } from '../../model/document.ts'
import { draftSessionKey, loadDraftSession, saveDraftSession } from './draft-session.ts'

describe('draft session', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('round-trips a document and ignores a broken session', () => {
    const document = createDefaultReleaseConfig()
    saveDraftSession({ document, cleanText: serializeConfiguration(document), fileName: 'customer.json' })

    expect(loadDraftSession()?.fileName).toBe('customer.json')
    expect(loadDraftSession()?.document.configurationManager.password).toBe('')

    sessionStorage.setItem(draftSessionKey, '{')
    expect(loadDraftSession()).toBeNull()
  })
})
