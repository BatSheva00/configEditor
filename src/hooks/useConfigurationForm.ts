import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { createDefaultReleaseConfig } from '../model/defaults.ts'
import type { ReleaseConfigFormValues } from '../model/document.ts'
import { releaseConfigSchema } from '../model/schema.ts'

// Nested catchall fields make zodResolver's inferred type too deep for TypeScript.
const resolveConfiguration = zodResolver(releaseConfigSchema) as Resolver<ReleaseConfigFormValues>

export const useConfigurationForm = () =>
  useForm<ReleaseConfigFormValues>({
    defaultValues: createDefaultReleaseConfig(),
    resolver: resolveConfiguration,
    // Keep entered values when the visible step changes.
    shouldUnregister: false,
  })
