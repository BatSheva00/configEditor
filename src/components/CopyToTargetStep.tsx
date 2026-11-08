import TextField from '@mui/material/TextField'
import { Controller, type Control } from 'react-hook-form'
import type { ReleaseConfigFormValues } from '../model/document.ts'

type CopyToTargetStepProps = {
  control: Control<ReleaseConfigFormValues>
}

export function CopyToTargetStep({ control }: CopyToTargetStepProps) {
  return (
    <Controller
      name="copyToTarget.targetDirectory"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label="Target directory"
          placeholder="/var/www/html/"
          helperText="Recorded only. Files are not copied."
        />
      )}
    />
  )
}
