import { useState } from 'react'
import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import type { ReleaseConfigFormValues } from '../../model/convertConfiguration.ts'
import { ConfirmDialog } from '../ConfirmDialog.tsx'
import { VddFields } from './VddFields.tsx'

type VddEditorProps = {
  control: Control<ReleaseConfigFormValues>
  setValue: UseFormSetValue<ReleaseConfigFormValues>
  onInclude: () => void
  onRemove: () => void
}

const hasVddContent = (vdd: ReleaseConfigFormValues['vdd']) =>
  vdd !== undefined &&
  (vdd.versionNumber.length > 0 || vdd.releaseDate.length > 0 || vdd.recentFixes.length > 0)

export function VddEditor({ control, setValue, onInclude, onRemove }: VddEditorProps) {
  const vdd = useWatch({ control, name: 'vdd' })
  const [confirmRemoval, setConfirmRemoval] = useState(false)
  const included = vdd !== undefined

  const changeInclusion = () => {
    if (!included) {
      onInclude()
      return
    }

    if (hasVddContent(vdd)) {
      setConfirmRemoval(true)
      return
    }

    onRemove()
  }

  const confirmRemove = () => {
    setConfirmRemoval(false)
    onRemove()
  }

  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        <FormControlLabel
          control={<Switch checked={included} onChange={changeInclusion} />}
          label="Include a version description"
        />
        {included ? (
          <VddFields control={control} setValue={setValue} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No version description in this configuration.
          </Typography>
        )}
      </Stack>
      <ConfirmDialog
        open={confirmRemoval}
        title="Remove version description"
        message="The version number, release date, and fixes will be removed from this configuration."
        confirmLabel="Remove"
        onConfirm={confirmRemove}
        onCancel={() => setConfirmRemoval(false)}
      />
    </Paper>
  )
}
