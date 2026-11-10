import { toFormValues } from './convertConfiguration.ts'
import { releaseConfigFieldSchema } from './validators.ts'
import { releaseConfigSchema, type ReleaseConfig } from './schema.ts'
import type { ValidationIssue, ValidationResult } from './validationTypes.ts'

const toIssues = (
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): ValidationIssue[] =>
  issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }))

export const validateReleaseConfig = (input: unknown): ValidationResult<ReleaseConfig> => {
  const result = releaseConfigSchema.safeParse(input)
  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, issues: toIssues(result.error.issues) }
}

export const validateReleaseConfigForExport = (input: unknown): ValidationResult<ReleaseConfig> => {
  const structural = releaseConfigSchema.safeParse(input)
  if (!structural.success) {
    return { success: false, issues: toIssues(structural.error.issues) }
  }

  const fields = releaseConfigFieldSchema.safeParse(toFormValues(structural.data))
  if (!fields.success) {
    return { success: false, issues: toIssues(fields.error.issues) }
  }

  return { success: true, data: structural.data }
}
