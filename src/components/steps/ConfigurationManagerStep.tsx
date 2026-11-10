import { useState } from 'react'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import type { Control } from 'react-hook-form'
import type { ReleaseConfigFormValues } from '../../model/convertConfiguration.ts'
import { ConfigurationField } from '../ConfigurationField.tsx'

type ConfigurationManagerStepProps = {
  control: Control<ReleaseConfigFormValues>
}

export function ConfigurationManagerStep({ control }: ConfigurationManagerStepProps) {
  const [passwordVisible, setPasswordVisible] = useState(false)

  return (
    <Stack spacing={2.5}>
      <ConfigurationField
        control={control}
        name="configurationManager.url"
        label="Configuration manager URL"
        placeholder="http://config-manager.example.com"
        helperText="The address of the configuration manager."
      />
      <ConfigurationField
        control={control}
        name="configurationManager.username"
        label="Username"
        helperText="Account used to sign in to the configuration manager."
      />
      <ConfigurationField
        control={control}
        name="configurationManager.password"
        label="Password"
        type={passwordVisible ? 'text' : 'password'}
        autoComplete="off"
        helperText="Stored in the configuration file. It is not written to the log."
        endAdornment={
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
        }
      />
    </Stack>
  )
}
