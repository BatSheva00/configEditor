import { z } from 'zod'

const jsonValueSchema = z.json()

/** Known fields keep the types in `shape`. Any other JSON key is retained. */
const jsonObject = <Shape extends z.core.$ZodLooseShape>(shape: Shape) =>
  z.object(shape).catchall(jsonValueSchema)

const text = z.string()

export const configurationManagerSchema = jsonObject({
  url: text,
  username: text,
  password: text,
})

export const branchSelectionSchema = jsonObject({
  defaultBranch: text,
})

export const buildSchema = jsonObject({
  versionNumber: text,
  command: text,
  outputDirectory: text,
})

export const copyToTargetSchema = jsonObject({
  targetDirectory: text,
})

export const vddSchema = jsonObject({
  versionNumber: text,
  releaseDate: text,
  recentFixes: z.array(text, 'Recent fixes must be a list of text.'),
})

/** A required field is a present key. An empty string is a valid value. The string is kept as read. */
export const releaseConfigSchema = jsonObject({
  configurationManager: configurationManagerSchema,
  branchSelection: branchSelectionSchema,
  build: buildSchema,
  copyToTarget: copyToTargetSchema,
  vdd: vddSchema.optional(),
}).brand<'ValidatedReleaseConfig'>()

export type ReleaseConfigDraft = z.input<typeof releaseConfigSchema>
export type ReleaseConfig = z.output<typeof releaseConfigSchema>
