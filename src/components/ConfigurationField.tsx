import type { FocusEvent, ReactNode } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { Controller, type Control, type FieldPath } from 'react-hook-form'
import type { ReleaseConfigFormValues } from '../model/convertConfiguration.ts'

type ConfigurationFieldProps = {
  control: Control<ReleaseConfigFormValues>
  name: FieldPath<ReleaseConfigFormValues>
  label: string
  helperText?: string
  placeholder?: string
  type?: string
  autoComplete?: string
  endAdornment?: ReactNode
  options?: readonly string[]
}

const withCurrentValue = (value: string, options: readonly string[]) =>
  value.length > 0 && !options.includes(value) ? [value, ...options] : options

export function ConfigurationField({
  control,
  name,
  label,
  helperText,
  placeholder,
  type,
  autoComplete,
  endAdornment,
  options,
}: ConfigurationFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const message = fieldState.error?.message
        const text = typeof field.value === 'string' ? field.value : ''
        if (options !== undefined) {
          return (
            <Autocomplete
              freeSolo
              options={withCurrentValue(text, options)}
              value={text}
              inputValue={text}
              onChange={(_, next) => field.onChange(next ?? '')}
              onInputChange={(_, next, reason) => {
                if (reason !== 'reset') field.onChange(next)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name={field.name}
                  label={label}
                  placeholder={placeholder}
                  helperText={message ?? helperText}
                  slotProps={{
                    ...params.slotProps,
                    htmlInput: {
                      ...params.slotProps.htmlInput,
                      onBlur: (event: FocusEvent<HTMLInputElement>) => {
                        params.slotProps.htmlInput.onBlur?.(event)
                        field.onBlur()
                      },
                      ...(message ? { 'aria-invalid': true } : {}),
                    },
                    formHelperText: message ? { error: true } : undefined,
                  }}
                />
              )}
            />
          )
        }
        return (
          <TextField
            {...field}
            value={text}
            type={type}
            label={label}
            placeholder={placeholder}
            autoComplete={autoComplete}
            helperText={message ?? helperText}
            slotProps={{
              htmlInput: message ? { 'aria-invalid': true } : undefined,
              formHelperText: message ? { error: true } : undefined,
              input: endAdornment ? { endAdornment } : undefined,
            }}
          />
        )
      }}
    />
  )
}
