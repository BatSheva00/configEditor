import type { Control } from 'react-hook-form'
import type { ReleaseConfigFormValues } from '../../model/convertConfiguration.ts'
import { ConfigurationField } from '../ConfigurationField.tsx'

type CopyToTargetStepProps = {
  control: Control<ReleaseConfigFormValues>
}

export function CopyToTargetStep({ control }: CopyToTargetStepProps) {
  return (
    <ConfigurationField
      control={control}
      name="copyToTarget.targetDirectory"
      label="Target directory"
      placeholder="/var/www/html/"
      helperText="A path such as /var/www/html/. Files are not copied."
    />
  )
}