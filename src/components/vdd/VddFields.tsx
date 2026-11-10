import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { Control, UseFormSetValue } from 'react-hook-form'
import type { ReleaseConfigFormValues } from '../../model/convertConfiguration.ts'
import { ConfigurationField } from '../ConfigurationField.tsx'
import { RecentFixesEditor } from './RecentFixesEditor.tsx'

type VddFieldsProps = {
  control: Control<ReleaseConfigFormValues>
  setValue: UseFormSetValue<ReleaseConfigFormValues>
}

export function VddFields({ control, setValue }: VddFieldsProps) {
  return (
    <Stack spacing={2.5}>
      <ConfigurationField
        control={control}
        name="vdd.versionNumber"
        label="Description version"
        helperText="Recorded on the version description. It is separate from the build version."
      />
      <ConfigurationField
        control={control}
        name="vdd.releaseDate"
        label="Release date"
        helperText="Use YYYY-MM-DD."
      />
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          Each entry is one fix. An empty list is allowed.
        </Typography>
        <RecentFixesEditor control={control} setValue={setValue} />
      </Stack>
    </Stack>
  )
}
