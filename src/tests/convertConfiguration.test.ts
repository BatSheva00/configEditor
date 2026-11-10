import { describe, expect, it } from 'vitest'
import {
  applyKnownFields,
  parseConfigurationText,
  serializeConfiguration,
  toFormValues,
} from '../model/convertConfiguration.ts'
import type { ReleaseConfigDraft } from '../model/schema.ts'
import { validateReleaseConfig } from '../model/validation.ts'

const document = {
  schemaVersion: 4,
  signedBy: 'qa-team',
  configurationManager: {
    url: 'http://config-manager.example.com',
    username: 'admin',
    password: 'password123',
    timeoutSeconds: 30,
    retry: { attempts: 3, backoffMs: 500 },
  },
  branchSelection: { defaultBranch: 'main' },
  build: {
    versionNumber: '1.0.0',
    command: 'npm run build',
    outputDirectory: 'build/',
  },
  copyToTarget: { targetDirectory: '/var/www/html/' },
  vdd: {
    versionNumber: '2.0.0',
    releaseDate: '2024-08-09',
    recentFixes: ['Fixed login issue'],
    owner: 'release-team',
  },
} satisfies ReleaseConfigDraft

describe('parseConfigurationText', () => {
  it('rejects broken JSON without exposing the file text', () => {
    const secret = 'hunter2-secret'
    const parsed = parseConfigurationText(`{"password":"${secret}"`)

    expect(parsed.success).toBe(false)
    if (parsed.success) {
      return
    }
    expect(parsed.message.length).toBeGreaterThan(0)
    expect(parsed.message).not.toContain(secret)
  })

  it('returns parsed JSON without checking the configuration schema', () => {
    const parsed = parseConfigurationText('[]')

    expect(parsed).toEqual({ success: true, data: [] })
    if (!parsed.success) {
      return
    }
    expect(validateReleaseConfig(parsed.data).success).toBe(false)
  })
})

describe('configuration documents', () => {
  it('round-trips text without dropping unknown fields or changing values', () => {
    const parsed = parseConfigurationText(serializeConfiguration(document))

    expect(parsed).toEqual({ success: true, data: document })
  })

  it('copies only known fields into the form', () => {
    const values = toFormValues(document)

    expect(values).toEqual({
      configurationManager: {
        url: 'http://config-manager.example.com',
        username: 'admin',
        password: 'password123',
      },
      branchSelection: { defaultBranch: 'main' },
      build: {
        versionNumber: '1.0.0',
        command: 'npm run build',
        outputDirectory: 'build/',
      },
      copyToTarget: { targetDirectory: '/var/www/html/' },
      vdd: {
        versionNumber: '2.0.0',
        releaseDate: '2024-08-09',
        recentFixes: ['Fixed login issue'],
      },
    })
    expect(values).not.toHaveProperty('schemaVersion')
    expect(values.configurationManager).not.toHaveProperty('timeoutSeconds')
    expect(values.vdd).not.toHaveProperty('owner')
  })

  it('keeps the form detached from the original document', () => {
    const values = toFormValues(document)
    values.configurationManager.url = 'http://changed.example.com'
    values.vdd?.recentFixes.push('Another fix')

    expect(document.configurationManager.url).toBe('http://config-manager.example.com')
    expect(document.vdd?.recentFixes).toEqual(['Fixed login issue'])
  })

  it('applies a known edit without losing unknown fields or mutating the original', () => {
    const values = toFormValues(document)
    values.configurationManager.url = 'http://changed.example.com'
    values.build.versionNumber = '1.0'
    if (values.vdd) {
      values.vdd.versionNumber = '9.0'
    }
    const snapshot = JSON.stringify(document)
    const updated = applyKnownFields(document, values)
    const serialized = serializeConfiguration(updated)

    expect(JSON.stringify(document)).toBe(snapshot)
    expect(updated.configurationManager.url).toBe('http://changed.example.com')
    expect(updated.build.versionNumber).toBe('1.0')
    expect(updated.configurationManager.password).toBe('password123')
    expect(updated.schemaVersion).toBe(4)
    expect(updated.signedBy).toBe('qa-team')
    expect(updated.configurationManager.timeoutSeconds).toBe(30)
    expect(updated.configurationManager.retry).toEqual({ attempts: 3, backoffMs: 500 })
    expect(updated.vdd?.owner).toBe('release-team')
    expect(updated.vdd?.versionNumber).toBe('9.0')
    expect(serialized).toContain('"schemaVersion": 4')
    expect(serialized).toContain('"timeoutSeconds": 30')
    expect(serialized).toContain('"owner": "release-team"')
    expect(serialized).toContain('http://changed.example.com')
    expect(serialized).toContain('"versionNumber": "9.0"')
    expect(parseConfigurationText(serialized)).toEqual({ success: true, data: updated })
  })

  it('leaves the original document unchanged', () => {
    const snapshot = JSON.stringify(document)
    const updated = applyKnownFields(document, toFormValues(document))

    expect(updated).not.toBe(document)
    expect(JSON.stringify(document)).toBe(snapshot)
    expect(updated).toEqual(document)
  })

  it('leaves out a blank fix and keeps a written one as typed', () => {
    const values = toFormValues(document)
    if (values.vdd) {
      values.vdd.recentFixes = ['  Fixed login  ', '   ', '']
    }
    const updated = applyKnownFields(document, values)

    expect(updated.vdd?.recentFixes).toEqual(['  Fixed login  '])
  })

  it('copies recentFixes instead of sharing the form array', () => {
    const values = toFormValues(document)
    const updated = applyKnownFields(document, values)
    values.vdd?.recentFixes.push('Another fix')

    expect(updated.vdd?.recentFixes).toEqual(['Fixed login issue'])
    expect(document.vdd?.recentFixes).toEqual(['Fixed login issue'])
  })

  it('deletes the VDD block, including unknown fields, only when removal is explicit', () => {
    const values = toFormValues(document)
    if (values.vdd) {
      values.vdd.versionNumber = '9.0'
    }
    const updated = applyKnownFields(document, values, { removeVdd: true })

    expect(updated.vdd).toBeUndefined()
    expect(updated.schemaVersion).toBe(4)
    expect(updated.configurationManager.password).toBe('password123')
    expect(document.vdd?.owner).toBe('release-team')
    expect(document.vdd?.versionNumber).toBe('2.0.0')
  })

  it('leaves a document without a VDD block unchanged when removal is requested', () => {
    const withoutVdd: ReleaseConfigDraft = { ...document }
    delete withoutVdd.vdd
    const updated = applyKnownFields(withoutVdd, toFormValues(withoutVdd), { removeVdd: true })

    expect(updated.vdd).toBeUndefined()
    expect(Object.hasOwn(updated, 'vdd')).toBe(false)
    expect(updated.schemaVersion).toBe(4)
  })

  it('keeps the original VDD block when the form values omit it', () => {
    const values = toFormValues(document)
    delete values.vdd
    values.configurationManager.url = 'http://changed.example.com'
    const updated = applyKnownFields(document, values)

    expect(updated.configurationManager.url).toBe('http://changed.example.com')
    expect(updated.vdd).toEqual(document.vdd)
    expect(updated.schemaVersion).toBe(4)
    expect(document.vdd?.owner).toBe('release-team')
  })
})
