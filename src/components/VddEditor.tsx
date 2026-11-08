import { useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import {
  Controller,
  useWatch,
  type Control,
  type UseFormSetValue,
  type UseFormUnregister,
} from 'react-hook-form'
import type { ReleaseConfigFormValues } from '../model/document.ts'
import { RecentFixesEditor } from './RecentFixesEditor.tsx'

type VddEditorProps = {
  control: Control<ReleaseConfigFormValues>
  setValue: UseFormSetValue<ReleaseConfigFormValues>
  unregister: UseFormUnregister<ReleaseConfigFormValues>
  onIncluded: () => void
  onRemoved: () => void
}

const hasVddContent = (vdd: ReleaseConfigFormValues['vdd']) =>
  vdd !== undefined &&
  (vdd.versionNumber.length > 0 || vdd.releaseDate.length > 0 || vdd.recentFixes.length > 0)

export function VddEditor({ control, setValue, unregister, onIncluded, onRemoved }: VddEditorProps) {
  const vdd = useWatch({ control, name: 'vdd' })
  const [confirmRemoval, setConfirmRemoval] = useState(false)
  const included = vdd !== undefined

  const removeVdd = () => {
    unregister('vdd')
    setConfirmRemoval(false)
    onRemoved()
  }

  const changeInclusion = () => {
    if (!included) {
      setValue('vdd', { versionNumber: '', releaseDate: '', recentFixes: [] }, { shouldDirty: true })
      onIncluded()
      return
    }

    if (hasVddContent(vdd)) {
      setConfirmRemoval(true)
      return
    }

    removeVdd()
  }

  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        <FormControlLabel
          control={<Switch checked={included} onChange={changeInclusion} />}
          label="Include a version description"
        />
        {included ? (
          <Stack spacing={2.5}>
            <Controller
              name="vdd.versionNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Version number"
                  helperText="Recorded on the version description. It is separate from the build version."
                />
              )}
            />
            <Controller
              name="vdd.releaseDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Release date"
                  placeholder="YYYY-MM-DD"
                  helperText="Use YYYY-MM-DD. The value is stored as typed."
                />
              )}
            />
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Each entry is one fix. An empty list is allowed.
              </Typography>
              <RecentFixesEditor control={control} setValue={setValue} />
            </Stack>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No version description in this configuration.
          </Typography>
        )}
      </Stack>
      <Dialog open={confirmRemoval} onClose={() => setConfirmRemoval(false)}>
        <DialogTitle>Remove version description</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The version number, release date, and fixes will be removed from this configuration.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemoval(false)}>Cancel</Button>
          <Button onClick={removeVdd}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
