import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { createDefaultReleaseConfig } from '../model/defaults.ts'
import { toFormValues, type ReleaseConfigFormValues } from '../model/convertConfiguration.ts'
import { releaseConfigFieldSchema } from '../model/validators.ts'

export const useConfigurationForm = (initialValues?: ReleaseConfigFormValues) =>
  useForm<ReleaseConfigFormValues>({
    defaultValues: initialValues ?? toFormValues(createDefaultReleaseConfig()),
    resolver: zodResolver(releaseConfigFieldSchema, undefined, { raw: true }),
    // Show a field error after the user leaves it, then update that field as they type.
    mode: 'onTouched',
    shouldFocusError: false,
    shouldUnregister: false,
  })
