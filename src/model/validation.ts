import { releaseConfigSchema, type ReleaseConfig } from './schema.ts'

export type ValidationIssue = {
  path: string
  message: string
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issues: ValidationIssue[] }

const toIssuePath = (path: ReadonlyArray<PropertyKey>): string => path.map(String).join('.')

const toIssues = (
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): ValidationIssue[] =>
  issues.map((issue) => ({
    path: toIssuePath(issue.path),
    message: issue.message,
  }))

export const validateReleaseConfig = (input: unknown): ValidationResult<ReleaseConfig> => {
  const result = releaseConfigSchema.safeParse(input)
  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, issues: toIssues(result.error.issues) }
}

const hasText = (value: string): boolean => value.trim().length > 0

const isAbsoluteHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const isRealCalendarDate = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12) {
    return false
  }

  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const daysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return day >= 1 && day <= daysInMonth[month - 1]
}

type ExportIssue = {
  code: 'custom'
  path: PropertyKey[]
  message: string
  input: string
  continue: true
}

const addIssue = (issues: ExportIssue[], path: PropertyKey[], message: string, value: string) => {
  issues.push({
    code: 'custom',
    path,
    message,
    input: value,
    continue: true,
  })
}

const requireText = (issues: ExportIssue[], value: string, path: PropertyKey[], message: string) => {
  if (hasText(value)) {
    return
  }

  addIssue(issues, path, message, value)
}

// Trim decides whether text is empty. The stored strings are not rewritten.
// The URL parser ignores surrounding spaces; a date must match YYYY-MM-DD exactly.
// Password is not read here; structural validation already requires it to be a string.
const collectExportIssues = (config: ReleaseConfig): ExportIssue[] => {
  const issues: ExportIssue[] = []
  if (!isAbsoluteHttpUrl(config.configurationManager.url)) {
    addIssue(
      issues,
      ['configurationManager', 'url'],
      'Enter an absolute http or https URL.',
      config.configurationManager.url,
    )
  }

  requireText(issues, config.configurationManager.username, ['configurationManager', 'username'], 'Enter a username.')
  requireText(issues, config.branchSelection.defaultBranch, ['branchSelection', 'defaultBranch'], 'Enter a branch name.')
  requireText(issues, config.build.versionNumber, ['build', 'versionNumber'], 'Enter a version number.')
  requireText(issues, config.build.command, ['build', 'command'], 'Enter a build command.')
  requireText(issues, config.build.outputDirectory, ['build', 'outputDirectory'], 'Enter an output directory.')
  requireText(
    issues,
    config.copyToTarget.targetDirectory,
    ['copyToTarget', 'targetDirectory'],
    'Enter a target directory.',
  )

  const vdd = config.vdd
  if (vdd === undefined) {
    return issues
  }

  requireText(issues, vdd.versionNumber, ['vdd', 'versionNumber'], 'Enter a version number.')
  if (!isRealCalendarDate(vdd.releaseDate)) {
    addIssue(issues, ['vdd', 'releaseDate'], 'Enter a real date as YYYY-MM-DD.', vdd.releaseDate)
  }

  for (const [index, fix] of vdd.recentFixes.entries()) {
    requireText(issues, fix, ['vdd', 'recentFixes', index], 'Enter a fix description.')
  }

  return issues
}

const releaseConfigExportSchema = releaseConfigSchema.check((payload) => {
  payload.issues.push(...collectExportIssues(payload.value))
})

export const validateReleaseConfigForExport = (input: unknown): ValidationResult<ReleaseConfig> => {
  const result = releaseConfigExportSchema.safeParse(input)
  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, issues: toIssues(result.error.issues) }
}
