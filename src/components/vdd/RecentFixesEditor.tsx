import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { useWatch, type Control, type FieldPath, type UseFormSetValue } from 'react-hook-form'
import type { ReleaseConfigFormValues } from '../../model/convertConfiguration.ts'
import { ConfigurationField } from '../ConfigurationField.tsx'

type RecentFixesEditorProps = {
  control: Control<ReleaseConfigFormValues>
  setValue: UseFormSetValue<ReleaseConfigFormValues>
}

export function RecentFixesEditor({ control, setValue }: RecentFixesEditorProps) {
  const fixes = useWatch({ control, name: 'vdd.recentFixes' }) ?? []

  const setFixes = (nextFixes: string[]) => {
    setValue('vdd.recentFixes', nextFixes, { shouldDirty: true })
  }

  return (
    <Stack spacing={1.5}>
      {fixes.map((_, index) => (
        <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <ConfigurationField
            control={control}
            name={`vdd.recentFixes.${index}` as FieldPath<ReleaseConfigFormValues>}
            label={`Fix ${index + 1}`}
          />
          <Button
            type="button"
            aria-label={`Remove fix ${index + 1}`}
            onClick={() => setFixes(fixes.filter((__, fixIndex) => fixIndex !== index))}
            sx={{ mt: 0.5 }}
          >
            Remove
          </Button>
        </Stack>
      ))}
      <Button type="button" onClick={() => setFixes([...fixes, ''])}>
        Add fix
      </Button>
    </Stack>
  )
}
