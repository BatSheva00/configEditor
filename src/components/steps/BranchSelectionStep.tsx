import type { Control } from 'react-hook-form'
import type { ReleaseConfigFormValues } from '../../model/convertConfiguration.ts'
import { ConfigurationField } from '../ConfigurationField.tsx'

// Demo options standing in for a future external source, such as a Git API.
const DEMO_BRANCHES = ['main', 'develop', 'release'] as const

type BranchSelectionStepProps = {
  control: Control<ReleaseConfigFormValues>
}

export function BranchSelectionStep({ control }: BranchSelectionStepProps) {
  return (
    <ConfigurationField
      control={control}
      name="branchSelection.defaultBranch"
      label="Branch name"
      helperText="Choose a listed branch, or type a name."
      options={DEMO_BRANCHES}
    />
  )
}
