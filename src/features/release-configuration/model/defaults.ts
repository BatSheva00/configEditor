import type { ReleaseConfigDraft } from './schema.ts'

export const createDefaultReleaseConfig = (): ReleaseConfigDraft => ({
  configurationManager: {
    url: '',
    username: '',
    password: '',
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
    targetDirectory: '',
  },
})
