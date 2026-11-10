export type ValidationIssue = {
  path: string
  message: string
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issues: ValidationIssue[] }
