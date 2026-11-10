import Stack from '@mui/material/Stack'
import type { Control } from 'react-hook-form'
import type { ReleaseConfigFormValues } from '../../model/convertConfiguration.ts'
import { ConfigurationField } from '../ConfigurationField.tsx'

type BuildStepProps = {
  control: Control<ReleaseConfigFormValues>
}

export function BuildStep({ control }: BuildStepProps) {
  return (
    <Stack spacing={2.5}>
      <ConfigurationField
        control={control}
        name="build.versionNumber"
        label="Version number"
        placeholder="1.0.0"
        helperText="Version recorded for this release."
      />
      <ConfigurationField
        control={control}
        name="build.command"
        label="Build command"
        placeholder="npm run build"
        helperText="Recorded only. The command is not run."
      />
      <ConfigurationField
        control={control}
        name="build.outputDirectory"
        label="Output directory"
        placeholder="build/"
        helperText="For example, build or build/."
      />
    </Stack>
  )
}
