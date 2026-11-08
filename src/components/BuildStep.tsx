import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { Controller, type Control } from 'react-hook-form'
import type { ReleaseConfigFormValues } from '../model/document.ts'

type BuildStepProps = {
  control: Control<ReleaseConfigFormValues>
}

export function BuildStep({ control }: BuildStepProps) {
  return (
    <Stack spacing={2.5}>
      <Controller
        name="build.versionNumber"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Version number" placeholder="1.0.0" helperText="Version recorded for this release." />
        )}
      />
      <Controller
        name="build.command"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Build command"
            placeholder="npm run build"
            helperText="Recorded only. The command is not run."
          />
        )}
      />
      <Controller
        name="build.outputDirectory"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Output directory" placeholder="build/" helperText="Where the build output is recorded." />
        )}
      />
    </Stack>
  )
}
