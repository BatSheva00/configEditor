import type { ReleaseConfigFieldValues } from './validators.ts'
import type { ReleaseConfigDraft } from './schema.ts'

export type ReleaseConfigFormValues = ReleaseConfigFieldValues

export type ConfigurationTextResult =
  | { success: true; data: unknown }
  | { success: false; message: string }

/** JSON syntax only. Accepted field values stay in `validators.ts`. */
export const parseConfigurationText = (text: string): ConfigurationTextResult => {
  try {
    return { success: true, data: JSON.parse(text) }
  } catch (error) {
    const message = error instanceof SyntaxError ? error.message : 'The text is not valid JSON.'
    return { success: false, message }
  }
}

export const toFormValues = (document: ReleaseConfigDraft): ReleaseConfigFormValues => {
  const values: ReleaseConfigFormValues = {
    configurationManager: {
      url: document.configurationManager.url,
      username: document.configurationManager.username,
      password: document.configurationManager.password,
    },
    branchSelection: {
      defaultBranch: document.branchSelection.defaultBranch,
    },
    build: {
      versionNumber: document.build.versionNumber,
      command: document.build.command,
      outputDirectory: document.build.outputDirectory,
    },
    copyToTarget: {
      targetDirectory: document.copyToTarget.targetDirectory,
    },
  }

  if (document.vdd !== undefined) {
    values.vdd = {
      versionNumber: document.vdd.versionNumber,
      releaseDate: document.vdd.releaseDate,
      recentFixes: [...document.vdd.recentFixes],
    }
  }

  return values
}

export const applyKnownFields = (
  document: ReleaseConfigDraft,
  values: ReleaseConfigFormValues,
  edit: { removeVdd?: boolean } = {},
): ReleaseConfigDraft => {
  const next = structuredClone(document)

  next.configurationManager = { ...next.configurationManager, ...values.configurationManager }
  next.branchSelection = { ...next.branchSelection, ...values.branchSelection }
  next.build = { ...next.build, ...values.build }
  next.copyToTarget = { ...next.copyToTarget, ...values.copyToTarget }

  // Omitted VDD is not a removal. The original block, including its unknown fields, stays.
  if (values.vdd !== undefined) {
    next.vdd = {
      ...next.vdd,
      ...values.vdd,
      recentFixes: values.vdd.recentFixes.filter((fix) => fix.trim().length > 0),
    }
  }

  if (edit.removeVdd) {
    delete next.vdd
  }

  return next
}

export const serializeConfiguration = (document: ReleaseConfigDraft): string =>
  JSON.stringify(document, null, 2)
