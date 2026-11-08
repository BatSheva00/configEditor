import { useState } from 'react'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { Controller, useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import type { ReleaseConfigFormValues } from '../model/document.ts'

type RecentFixesEditorProps = {
  control: Control<ReleaseConfigFormValues>
  setValue: UseFormSetValue<ReleaseConfigFormValues>
}

export function RecentFixesEditor({ control, setValue }: RecentFixesEditorProps) {
  const fixes = useWatch({ control, name: 'vdd.recentFixes' }) ?? []
  const [rowIds, setRowIds] = useState<string[]>([])

  const update = (nextFixes: string[], nextIds: string[]) => {
    setRowIds(nextIds)
    setValue('vdd.recentFixes', nextFixes, { shouldDirty: true })
  }

  return (
    <Stack spacing={1.5}>
      {fixes.map((_, index) => (
        <Stack key={rowIds[index]} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <Controller
            name={`vdd.recentFixes.${index}`}
            control={control}
            render={({ field }) => <TextField {...field} label={`Fix ${index + 1}`} />}
          />
          <Button
            type="button"
            aria-label={`Remove fix ${index + 1}`}
            onClick={() => update(fixes.filter((__, fixIndex) => fixIndex !== index), rowIds.filter((__, idIndex) => idIndex !== index))}
            sx={{ mt: 0.5 }}
          >
            Remove
          </Button>
        </Stack>
      ))}
      <Button type="button" onClick={() => update([...fixes, ''], [...rowIds, crypto.randomUUID()])}>
        Add fix
      </Button>
    </Stack>
  )
}
