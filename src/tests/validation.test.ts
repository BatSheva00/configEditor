import { describe, expect, it } from 'vitest'
import { createDefaultReleaseConfig } from '../model/defaults.ts'
import type { ReleaseConfig, ReleaseConfigDraft } from '../model/schema.ts'
import { validateReleaseConfig, validateReleaseConfigForExport } from '../model/validation.ts'

type UnknownKeysAreRetained = string extends keyof ReleaseConfig ? true : false
type VddMayBeAbsent = undefined extends ReleaseConfig['vdd'] ? true : false
type Username = ReleaseConfig['configurationManager']['username']
type UsernameIsString = [Username] extends [string] ? ([string] extends [Username] ? true : false) : false
type DraftIsNotValidated = ReleaseConfigDraft extends ReleaseConfig ? false : true

const exampleDocument = {
  configurationManager: {
    url: 'http://config-manager.example.com',
    username: 'admin',
    password: 'password123',
  },
  branchSelection: {
    defaultBranch: 'main',
  },
  build: {
    versionNumber: '1.0.0',
    command: 'npm run build',
    outputDirectory: 'build/',
  },
  copyToTarget: {
    targetDirectory: '/var/www/html/',
  },
  vdd: {
    versionNumber: '1.0.0',
    releaseDate: '2024-08-09',
    recentFixes: ['Fixed login issue', 'Updated API endpoints'],
  },
}

const withoutVdd = {
  configurationManager: exampleDocument.configurationManager,
  branchSelection: exampleDocument.branchSelection,
  build: exampleDocument.build,
  copyToTarget: exampleDocument.copyToTarget,
}

const padded = {
  ...exampleDocument,
  configurationManager: {
    ...exampleDocument.configurationManager,
    url: '  http://config-manager.example.com  ',
    username: '  admin  ',
    password: '  password123  ',
  },
  branchSelection: { defaultBranch: '  main  ' },
  build: {
    ...exampleDocument.build,
    versionNumber: '  1.0.0  ',
    command: '  npm run build  ',
    outputDirectory: '  build/  ',
  },
  copyToTarget: { targetDirectory: '  /var/www/html/  ' },
  vdd: {
    ...exampleDocument.vdd,
    versionNumber: '  1.0.0  ',
    releaseDate: '  2024-08-09  ',
  },
}

const missingSection = {
  branchSelection: exampleDocument.branchSelection,
  build: exampleDocument.build,
  copyToTarget: exampleDocument.copyToTarget,
  vdd: exampleDocument.vdd,
}

const expectStructural = (input: unknown): ReleaseConfig => {
  const result = validateReleaseConfig(input)
  if (!result.success) {
    expect.fail(JSON.stringify(result.issues, null, 2))
  }
  return result.data
}

const expectStructuralRejection = (input: unknown) => {
  const result = validateReleaseConfig(input)
  if (result.success) {
    expect.fail('Expected the document to be rejected')
  }
  return result.issues
}

const expectStructuralPath = (input: unknown, path: string) => {
  const issues = expectStructuralRejection(input)
  expect(issues.map((issue) => issue.path)).toContain(path)
  return issues
}

const expectExport = (input: unknown): ReleaseConfig => {
  const result = validateReleaseConfigForExport(input)
  if (!result.success) {
    expect.fail(JSON.stringify(result.issues, null, 2))
  }
  return result.data
}

const expectExportRejection = (input: unknown) => {
  const result = validateReleaseConfigForExport(input)
  if (result.success) {
    expect.fail('Expected the document to be rejected for export')
  }
  return result.issues
}

const expectExportPath = (input: unknown, path: string) => {
  const issues = expectExportRejection(input)
  expect(issues.map((issue) => issue.path)).toContain(path)
  return issues
}

describe('structural validation', () => {
  it('accepts the assignment example and preserves its values', () => {
    const example = expectStructural(exampleDocument)

    expect(example.configurationManager.username).toBe('admin')
    expect(example.configurationManager.password).toBe('password123')
    expect(example.vdd?.recentFixes).toEqual(['Fixed login issue', 'Updated API endpoints'])
  })

  it('accepts a document without VDD', () => {
    const document = expectStructural(withoutVdd)

    expect(document.vdd).toBeUndefined()
  })

  it('rejects an incomplete VDD block and a null VDD', () => {
    expectStructuralPath(
      {
        ...exampleDocument,
        vdd: { versionNumber: '1.0.0', recentFixes: [] },
      },
      'vdd.releaseDate',
    )
    expectStructuralPath({ ...exampleDocument, vdd: null }, 'vdd')
  })

  it('rejects missing sections, missing keys, and incorrect types', () => {
    expectStructuralPath(missingSection, 'configurationManager')
    expectStructuralPath(
      {
        ...exampleDocument,
        build: { command: 'npm run build', outputDirectory: 'build/' },
      },
      'build.versionNumber',
    )
    expectStructuralPath(
      {
        ...exampleDocument,
        build: { ...exampleDocument.build, versionNumber: 1 },
      },
      'build.versionNumber',
    )
    expectStructuralPath(
      {
        ...exampleDocument,
        configurationManager: { username: 'admin', password: 'password123' },
      },
      'configurationManager.url',
    )
    expectStructuralPath(
      {
        ...exampleDocument,
        vdd: { ...exampleDocument.vdd, recentFixes: 'Fixed login issue' },
      },
      'vdd.recentFixes',
    )
    expectStructuralRejection([])
  })

  it('accepts an empty string as a present value', () => {
    const document = expectStructural({
      ...exampleDocument,
      configurationManager: { ...exampleDocument.configurationManager, url: '' },
    })

    expect(document.configurationManager.url).toBe('')
  })

  it('preserves URL, version, and date text', () => {
    const document = expectStructural({
      ...exampleDocument,
      configurationManager: {
        ...exampleDocument.configurationManager,
        url: 'not-a-url',
      },
      build: { ...exampleDocument.build, versionNumber: '1.0' },
      vdd: { ...exampleDocument.vdd, releaseDate: '2024-02-31' },
    })

    expect(document.configurationManager.url).toBe('not-a-url')
    expect(document.build.versionNumber).toBe('1.0')
    expect(document.vdd?.releaseDate).toBe('2024-02-31')
  })

  it('keeps surrounding spaces and does not mutate the input', () => {
    const document = expectStructural(padded)

    expect(document.configurationManager).toEqual(padded.configurationManager)
    expect(document.branchSelection).toEqual(padded.branchSelection)
    expect(document.build).toEqual(padded.build)
    expect(document.copyToTarget).toEqual(padded.copyToTarget)
    expect(document.vdd).toEqual(padded.vdd)
    expect(padded.configurationManager.url).toBe('  http://config-manager.example.com  ')
  })

  it('preserves unknown root and nested JSON fields', () => {
    const document = expectStructural({
      schemaVersion: 4,
      signedBy: 'qa-team',
      configurationManager: {
        ...exampleDocument.configurationManager,
        timeoutSeconds: 30,
        retry: { attempts: 3, backoffMs: 500 },
      },
      branchSelection: exampleDocument.branchSelection,
      build: exampleDocument.build,
      copyToTarget: exampleDocument.copyToTarget,
    })

    expect(document.schemaVersion).toBe(4)
    expect(document.signedBy).toBe('qa-team')
    expect(document.configurationManager.timeoutSeconds).toBe(30)
    expect(document.configurationManager.retry).toMatchObject({ attempts: 3 })
  })

  it('rejects a non-JSON unknown field', () => {
    expectStructuralRejection({
      schemaVersion: 4,
      signedBy: 'qa-team',
      configurationManager: exampleDocument.configurationManager,
      branchSelection: exampleDocument.branchSelection,
      build: exampleDocument.build,
      copyToTarget: exampleDocument.copyToTarget,
      callback: () => undefined,
    })
  })
})

describe('defaults', () => {
  it('creates a structurally valid draft without VDD', () => {
    const draft = createDefaultReleaseConfig()

    expect(draft.branchSelection.defaultBranch).toBe('main')
    expect(draft.build.command).toBe('npm run build')
    expect(draft.configurationManager.url).toBe('')
    expect(draft.vdd).toBeUndefined()

    const validated = expectStructural(draft)
    expect(validated.configurationManager.url).toBe('')
    expect(validated.configurationManager.password).toBe('')
    expect(validated.vdd).toBeUndefined()
  })

  it('allows an empty VDD block to be added later', () => {
    const document = expectStructural({
      ...createDefaultReleaseConfig(),
      vdd: {
        versionNumber: '',
        releaseDate: '',
        recentFixes: [],
      },
    })

    expect(document.vdd?.versionNumber).toBe('')
    expect(document.vdd?.recentFixes).toEqual([])
  })

  it('rejects the default draft for export, including an empty password', () => {
    const issues = expectExportRejection(createDefaultReleaseConfig())
    const paths = issues.map((issue) => issue.path)

    expect(paths).toEqual(
      expect.arrayContaining([
        'configurationManager.url',
        'configurationManager.username',
        'configurationManager.password',
        'copyToTarget.targetDirectory',
      ]),
    )
  })
})

describe('export validation', () => {
  it('accepts the assignment example and a document without VDD', () => {
    const exported = expectExport(exampleDocument)
    const exportedWithoutVdd = expectExport(withoutVdd)

    expect(exported.configurationManager.password).toBe('password123')
    expect(exported.vdd?.versionNumber).toBe(exampleDocument.build.versionNumber)
    expect(exportedWithoutVdd.vdd).toBeUndefined()
  })

  it('rejects missing and mistyped fields', () => {
    expectExportPath(missingSection, 'configurationManager')
    expectExportPath(
      {
        ...exampleDocument,
        build: { ...exampleDocument.build, versionNumber: 1 },
      },
      'build.versionNumber',
    )
  })

  it('rejects empty text for export, including an empty password', () => {
    const incomplete = {
      configurationManager: { url: '', username: '   ', password: '' },
      branchSelection: { defaultBranch: '   ' },
      build: { versionNumber: '', command: ' ', outputDirectory: '\t' },
      copyToTarget: { targetDirectory: '' },
      vdd: {
        versionNumber: ' ',
        releaseDate: '',
        recentFixes: ['', '   '],
      },
    }

    expectStructural(incomplete)
    const issues = expectExportRejection(incomplete)
    expect(issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining([
        'configurationManager.url',
        'configurationManager.username',
        'configurationManager.password',
        'branchSelection.defaultBranch',
        'build.versionNumber',
        'build.command',
        'build.outputDirectory',
        'copyToTarget.targetDirectory',
        'vdd.versionNumber',
        'vdd.releaseDate',
      ]),
    )
    expect(issues.some((issue) => issue.path.startsWith('vdd.recentFixes'))).toBe(false)
  })

  it('requires a URL and keeps the text that was entered', () => {
    const issues = expectExportPath(
      {
        ...exampleDocument,
        configurationManager: { ...exampleDocument.configurationManager, url: '   ' },
      },
      'configurationManager.url',
    )
    expect(issues.find((issue) => issue.path === 'configurationManager.url')?.message).toBe('URL is required.')

    expect(expectExportPath(
      {
        ...exampleDocument,
        configurationManager: { ...exampleDocument.configurationManager, url: 'not-a-url' },
      },
      'configurationManager.url',
    ).find((issue) => issue.path === 'configurationManager.url')?.message).toBe('URL is not valid.')

    const document = expectExport({
      ...exampleDocument,
      configurationManager: { ...exampleDocument.configurationManager, url: 'https://config-manager.example.com' },
    })
    expect(document.configurationManager.url).toBe('https://config-manager.example.com')
  })

  it('requires a directory and rejects a forbidden character', () => {
    const outputMessage = (outputDirectory: string) =>
      expectExportPath(
        { ...exampleDocument, build: { ...exampleDocument.build, outputDirectory } },
        'build.outputDirectory',
      ).find((issue) => issue.path === 'build.outputDirectory')?.message

    expect(outputMessage('')).toBe('Output directory is required.')
    expect(outputMessage('   ')).toBe('Output directory is required.')
    expect(outputMessage('build/<out>')).toBe('Output directory is not valid.')

    const kept = expectExport({
      ...exampleDocument,
      build: { ...exampleDocument.build, outputDirectory: 'build' },
      copyToTarget: { targetDirectory: 'dist' },
    })
    expect(kept.build.outputDirectory).toBe('build')
    expect(kept.copyToTarget.targetDirectory).toBe('dist')
    expect(expectExport({
      ...exampleDocument,
      build: { ...exampleDocument.build, outputDirectory: 'out' },
    }).build.outputDirectory).toBe('out')

    const preserved = expectExport({
      ...exampleDocument,
      build: { ...exampleDocument.build, outputDirectory: '  build/  ' },
      copyToTarget: { targetDirectory: 'C:\\releases\\app\\' },
    })
    expect(preserved.build.outputDirectory).toBe('  build/  ')
    expect(preserved.copyToTarget.targetDirectory).toBe('C:\\releases\\app\\')
  })

  it('uses a separate message for a missing date and an impossible date', () => {
    const messageFor = (releaseDate: string) =>
      expectExportPath(
        { ...exampleDocument, vdd: { ...exampleDocument.vdd, releaseDate } },
        'vdd.releaseDate',
      ).find((issue) => issue.path === 'vdd.releaseDate')?.message

    expect(messageFor('')).toBe('Release date is required.')
    expect(messageFor('   ')).toBe('Release date is required.')
    expect(messageFor('2024-02-31')).toBe('Release date is not valid.')
    expect(messageFor('  2024-08-09  ')).toBe('Release date is not valid.')
  })

  it.each(['2024-02-31', '2023-02-29', '1900-02-29', '2024-13-01', '08/09/2024'])(
    'rejects %s',
    (releaseDate) => {
      expectExportPath(
        { ...exampleDocument, vdd: { ...exampleDocument.vdd, releaseDate } },
        'vdd.releaseDate',
      )
    },
  )

  it('accepts a real leap day and a century leap day', () => {
    expect(expectExport({
      ...exampleDocument,
      vdd: { ...exampleDocument.vdd, releaseDate: '2024-02-29' },
    }).vdd?.releaseDate).toBe('2024-02-29')
    expect(expectExport({
      ...exampleDocument,
      vdd: { ...exampleDocument.vdd, releaseDate: '2000-02-29' },
    }).vdd?.releaseDate).toBe('2000-02-29')
  })

  it('keeps surrounding spaces and does not rewrite the input', () => {
    const exported = expectExport({
      ...padded,
      vdd: { ...padded.vdd, releaseDate: '2024-08-09' },
    })

    expect(exported.configurationManager).toEqual(padded.configurationManager)
    expect(exported.branchSelection).toEqual(padded.branchSelection)
    expect(exported.build).toEqual(padded.build)
    expect(exported.copyToTarget).toEqual(padded.copyToTarget)
    expect(exported.vdd?.versionNumber).toBe('  1.0.0  ')
    expect(exported.vdd?.releaseDate).toBe('2024-08-09')
    expect(padded.configurationManager.url).toBe('  http://config-manager.example.com  ')
  })

  it('does not include the password in error messages', () => {
    const secret = 'hunter2-secret'
    const exportIssues = expectExportRejection({
      ...exampleDocument,
      configurationManager: { ...exampleDocument.configurationManager, password: secret, url: '' },
    })
    const structuralIssues = expectStructuralRejection({
      ...exampleDocument,
      configurationManager: { ...exampleDocument.configurationManager, password: { leak: secret } },
    })

    expect(JSON.stringify(exportIssues)).not.toContain(secret)
    expect(JSON.stringify(structuralIssues)).not.toContain(secret)
  })

  it('preserves unknown fields, original strings, and independent versions', () => {
    const source = {
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
        versionNumber: '1.0',
        command: 'npm run build',
        outputDirectory: 'build/',
      },
      copyToTarget: { targetDirectory: 'C:\\releases\\app\\' },
      vdd: {
        versionNumber: '9.0',
        releaseDate: '2024-02-29',
        recentFixes: [],
        owner: 'release-team',
      },
    }
    const snapshot = JSON.stringify(source)
    const exported = expectExport(source)

    expect(JSON.stringify(source)).toBe(snapshot)
    expect(exported.schemaVersion).toBe(4)
    expect(exported.signedBy).toBe('qa-team')
    expect(exported.configurationManager.username).toBe('admin')
    expect(exported.configurationManager.password).toBe('password123')
    expect(exported.configurationManager.timeoutSeconds).toBe(30)
    expect(exported.configurationManager.retry).toMatchObject({ attempts: 3 })
    expect(exported.build.versionNumber).toBe('1.0')
    expect(exported.branchSelection.defaultBranch).toBe('main')
    expect(exported.copyToTarget.targetDirectory).toBe('C:\\releases\\app\\')
    expect(exported.vdd?.versionNumber).toBe('9.0')
    expect(exported.vdd?.recentFixes).toEqual([])
    expect(exported.vdd?.owner).toBe('release-team')
  })
})

describe('derived types', () => {
  it('keeps draft and validated configuration distinct', () => {
    const unknownKeysAreRetained: UnknownKeysAreRetained = true
    const vddMayBeAbsent: VddMayBeAbsent = true
    const usernameIsString: UsernameIsString = true
    const draftIsNotValidated: DraftIsNotValidated = true

    expect(unknownKeysAreRetained).toBe(true)
    expect(vddMayBeAbsent).toBe(true)
    expect(usernameIsString).toBe(true)
    expect(draftIsNotValidated).toBe(true)
  })
})
