import { z } from 'zod'

// Field rules for editing and export. The document shape stays in `schema.ts`.
// Text is stored as typed. `trim()` only treats a spaces-only value as blank.

const required = (message: string) =>
  z.string().refine((value) => value.trim().length > 0, message)

const absoluteHttpUrl = z.string().check((payload) => {
  const value = payload.value
  if (value.trim().length === 0) {
    payload.issues.push({ code: 'custom', input: value, message: 'URL is required.' })
    return
  }
  try {
    const url = new URL(value)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return
    }
  } catch {
    // Fall through to the invalid-address message.
  }
  payload.issues.push({ code: 'custom', input: value, message: 'URL is not valid.' })
})

const directoryPath = (requiredMessage: string, invalidMessage: string) =>
  z.string().check((payload) => {
    const value = payload.value
    if (value.trim().length === 0) {
      payload.issues.push({ code: 'custom', input: value, message: requiredMessage })
      return
    }
    if (/[<>"|?*\u0000-\u001F]/.test(value)) {
      payload.issues.push({ code: 'custom', input: value, message: invalidMessage })
    }
  })

const calendarDate = z.string().check((payload) => {
  const value = payload.value
  if (value.trim().length === 0) {
    payload.issues.push({ code: 'custom', input: value, message: 'Release date is required.' })
    return
  }
  if (!z.iso.date().safeParse(value).success) {
    payload.issues.push({ code: 'custom', input: value, message: 'Release date is not valid.' })
  }
})

export const releaseConfigFieldSchema = z.object({
  configurationManager: z.object({
    url: absoluteHttpUrl,
    username: required('Username is required.'),
    password: required('Password is required.'),
  }),
  branchSelection: z.object({
    defaultBranch: required('Branch name is required.'),
  }),
  build: z.object({
    versionNumber: required('Version number is required.'),
    command: required('Build command is required.'),
    outputDirectory: directoryPath('Output directory is required.', 'Output directory is not valid.'),
  }),
  copyToTarget: z.object({
    targetDirectory: directoryPath('Target directory is required.', 'Target directory is not valid.'),
  }),
  vdd: z
    .object({
      versionNumber: required('Description version is required.'),
      releaseDate: calendarDate,
      recentFixes: z.array(z.string()),
    })
    .optional(),
})

export type ReleaseConfigFieldValues = z.infer<typeof releaseConfigFieldSchema>
