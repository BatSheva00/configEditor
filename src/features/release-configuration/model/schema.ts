import { z } from 'zod'

const jsonValueSchema = z.json()

export type JsonValue = z.infer<typeof jsonValueSchema>

/** Known fields keep the types in `shape`. Any other JSON key is retained. */
const jsonObject = <Shape extends z.core.$ZodLooseShape>(shape: Shape) =>
  z.object(shape).catchall(jsonValueSchema)

export const configurationManagerSchema = jsonObject({
  url: z.string(),
  username: z.string(),
  password: z.string(),
})

export const branchSelectionSchema = jsonObject({
  defaultBranch: z.string(),
})

export const buildSchema = jsonObject({
  versionNumber: z.string(),
  command: z.string(),
  outputDirectory: z.string(),
})

export const copyToTargetSchema = jsonObject({
  targetDirectory: z.string(),
})

export const vddSchema = jsonObject({
  versionNumber: z.string(),
  releaseDate: z.string(),
  recentFixes: z.array(z.string(), 'Recent fixes must be a list of text.'),
})

/** A required field is a present key. An empty string is a valid value. */
export const releaseConfigSchema = jsonObject({
  configurationManager: configurationManagerSchema,
  branchSelection: branchSelectionSchema,
  build: buildSchema,
  copyToTarget: copyToTargetSchema,
  vdd: vddSchema.optional(),
}).brand<'ValidatedReleaseConfig'>()

export type ConfigurationManagerSettings = z.infer<typeof configurationManagerSchema>
export type BranchSelectionSettings = z.infer<typeof branchSelectionSchema>
export type BuildSettings = z.infer<typeof buildSchema>
export type CopyToTargetSettings = z.infer<typeof copyToTargetSchema>
export type VddDocument = z.infer<typeof vddSchema>
export type ReleaseConfigDraft = z.input<typeof releaseConfigSchema>
export type ReleaseConfig = z.output<typeof releaseConfigSchema>
