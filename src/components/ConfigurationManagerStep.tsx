import { useState } from 'react'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { Controller, type Control } from 'react-hook-form'
import type { ReleaseConfigFormValues } from '../model/document.ts'

type ConfigurationManagerStepProps = {
  control: Control<ReleaseConfigFormValues>
}

export function ConfigurationManagerStep({ control }: ConfigurationManagerStepProps) {
  const [passwordVisible, setPasswordVisible] = useState(false)

  return (
    <Stack spacing={2.5}>
      <Controller
        name="configurationManager.url"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Configuration manager URL"
            placeholder="http://config-manager.example.com"
            helperText="The address of the configuration manager."
          />
        )}
      />
      <Controller
        name="configurationManager.username"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Username"
            helperText="Account used to sign in to the configuration manager."
          />
        )}
      />
      <Controller
        name="configurationManager.password"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            type={passwordVisible ? 'text' : 'password'}
            label="Password"
            autoComplete="off"
            helperText="Stored in the configuration file. It is not written to the log."
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                      onClick={() => setPasswordVisible((visible) => !visible)}
                      edge="end"
                      size="small"
                    >
                      {passwordVisible ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
      />
    </Stack>
  )
}
