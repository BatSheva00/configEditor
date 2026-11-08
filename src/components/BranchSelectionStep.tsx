import TextField from '@mui/material/TextField'
import { Controller, type Control } from 'react-hook-form'
import type { ReleaseConfigFormValues } from '../model/document.ts'

type BranchSelectionStepProps = {
  control: Control<ReleaseConfigFormValues>
}

export function BranchSelectionStep({ control }: BranchSelectionStepProps) {
  return (
    <Controller
      name="branchSelection.defaultBranch"
      control={control}
      render={({ field }) => (
        <TextField {...field} label="Branch name" placeholder="main" helperText="The branch selected for the release." />
      )}
    />
  )
}
