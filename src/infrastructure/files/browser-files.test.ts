// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { readTextFile } from './browser-files.ts'

describe('readTextFile', () => {
  it('removes a leading byte order mark', async () => {
    const file = new File(['\uFEFF{"url":""}'], 'config.json', { type: 'application/json' })

    await expect(readTextFile(file)).resolves.toBe('{"url":""}')
  })
})
