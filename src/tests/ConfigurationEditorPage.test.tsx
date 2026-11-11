// @vitest-environment jsdom

import { ThemeProvider } from '@mui/material/styles'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react'
import { appTheme } from '../theme.ts'
import { ConfigurationEditorPage } from '../pages/ConfigurationEditorPage.tsx'

const renderEditor = () =>
  render(
    <ThemeProvider theme={appTheme}>
      <ConfigurationEditorPage />
    </ThemeProvider>,
  )

const helperOf = (input: HTMLElement) => {
  const helper = input.closest('.MuiFormControl-root')?.querySelector('.MuiFormHelperText-root')
  if (!(helper instanceof HTMLElement)) {
    throw new Error('Helper text was not found.')
  }
  return helper
}

const showPreview = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Show preview' }))
  fireEvent.click(within(screen.getByRole('dialog', { name: 'Show the preview?' })).getByRole('button', { name: 'Show preview' }))
  await waitForElementToBeRemoved(() => screen.queryByRole('dialog', { name: 'Show the preview?' }))
}

const configurationDocument = (url: string) =>
  JSON.stringify({
    configurationManager: { url, username: 'admin', password: 'password123' },
    branchSelection: { defaultBranch: 'main' },
    build: { versionNumber: '1.0.0', command: 'npm run build', outputDirectory: 'build/' },
    copyToTarget: { targetDirectory: '/var/www/html/' },
  })

const fileInput = () => {
  const input = document.querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Configuration file input was not found.')
  }
  return input
}

const chooseFile = (contents: string, name = 'customer.json') => {
  fireEvent.change(fileInput(), { target: { files: [new File([contents], name, { type: 'application/json' })] } })
}

const chooseThisFile = (file: File) => {
  fireEvent.change(fileInput(), { target: { files: [file] } })
}

const deferredFile = (contents: string, name: string) => {
  let resolveRead: (value: string) => void = () => undefined
  let rejectRead: (reason?: unknown) => void = () => undefined
  const file = new File([contents], name, { type: 'application/json' })
  const result = new Promise<string>((resolve, reject) => {
    resolveRead = resolve
    rejectRead = reject
  })
  vi.spyOn(file, 'text').mockReturnValue(result)
  return {
    file,
    finish: () => resolveRead(contents),
    fail: () => rejectRead(new Error('disk')),
  }
}

afterEach(() => {
  cleanup()
})

describe('ConfigurationEditorPage', () => {
  it('keeps an entered value after moving to the next step and back', async () => {
    renderEditor()

    fireEvent.change(screen.getByLabelText('Configuration manager URL'), {
      target: { value: 'http://config-manager.example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByLabelText('Branch name')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(screen.getByLabelText('Configuration manager URL')).toHaveProperty(
      'value',
      'http://config-manager.example.com',
    )
    await showPreview()
    expect(screen.getByRole('region', { name: 'Current values' }).textContent).toContain(
      '"url": "http://config-manager.example.com"',
    )
  })

  it('shows a schema error under a field only after the user leaves it', async () => {
    renderEditor()

    const url = screen.getByLabelText('Configuration manager URL')
    expect(helperOf(url).textContent).toBe('The address of the configuration manager.')
    expect(helperOf(url).className).not.toContain('Mui-error')
    expect(url.getAttribute('aria-invalid')).not.toBe('true')

    fireEvent.focus(url)
    fireEvent.blur(url)
    await waitFor(() => {
      expect(helperOf(url).className).toContain('Mui-error')
    })
    expect(helperOf(url).textContent).not.toBe('The address of the configuration manager.')
    expect(url.getAttribute('aria-invalid')).toBe('true')
    expect(url.closest('.MuiFormControl-root')?.className).not.toContain('Mui-error')
    expect(helperOf(screen.getByLabelText('Username')).textContent).toBe(
      'Account used to sign in to the configuration manager.',
    )

    fireEvent.change(url, { target: { value: '   ' } })
    await waitFor(() => {
      expect(helperOf(url).className).toContain('Mui-error')
    })
    expect(url).toHaveProperty('value', '   ')

    fireEvent.change(url, { target: { value: 'not-a-url' } })
    fireEvent.blur(url)
    await waitFor(() => {
      expect(helperOf(url).className).toContain('Mui-error')
    })
    expect(url).toHaveProperty('value', 'not-a-url')

    const password = screen.getByLabelText('Password')
    fireEvent.blur(password)
    await waitFor(() => {
      expect(helperOf(password).className).toContain('Mui-error')
    })
    expect(password.getAttribute('aria-invalid')).toBe('true')

    fireEvent.click(screen.getByRole('switch', { name: 'Include a version description' }))
    const releaseDate = screen.getByLabelText('Release date')
    expect(releaseDate).toHaveProperty('type', 'text')
    expect(helperOf(releaseDate).className).not.toContain('Mui-error')
    fireEvent.blur(releaseDate)
    await waitFor(() => {
      expect(helperOf(releaseDate).className).toContain('Mui-error')
    })
    expect(releaseDate).toHaveProperty('value', '')
  })

  it('hides and shows the JSON preview', async () => {
    renderEditor()

    expect(screen.queryByRole('region', { name: 'Current values' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Show preview' }))
    const dialog = screen.getByRole('dialog', { name: 'Show the preview?' })
    expect(dialog.textContent).toContain('The preview shows passwords in plain text.')
    expect(screen.queryByRole('region', { name: 'Current values' })).toBeNull()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog', { name: 'Show the preview?' }))
    expect(screen.queryByRole('region', { name: 'Current values' })).toBeNull()

    await showPreview()
    const preview = screen.getByRole('region', { name: 'Current values' })
    expect(preview.querySelector('pre')?.textContent).toContain('"url": ""')

    fireEvent.click(screen.getByRole('button', { name: 'Hide preview' }))
    expect(screen.queryByRole('region', { name: 'Current values' })).toBeNull()
  })

  it('adds an empty version description without copying the build version', async () => {
    renderEditor()

    expect(screen.getByText('No version description in this configuration.')).toBeTruthy()
    await showPreview()
    expect(screen.getByRole('region', { name: 'Current values' }).textContent).not.toContain('"vdd"')

    fireEvent.click(screen.getByRole('switch', { name: 'Include a version description' }))

    expect(screen.getByLabelText('Release date')).toHaveProperty('value', '')
    expect(screen.getByLabelText('Description version')).toHaveProperty('value', '')
    const preview = screen.getByRole('region', { name: 'Current values' }).textContent ?? ''
    expect(preview).toContain('"versionNumber": "1.0.0"')
    expect(preview).toContain('"versionNumber": ""')
    expect(preview).toContain('"releaseDate": ""')
    expect(preview).toContain('"recentFixes": []')
  })

  it('stores the version description text as typed and keeps a chosen date', async () => {
    renderEditor()
    fireEvent.click(screen.getByRole('switch', { name: 'Include a version description' }))

    fireEvent.change(screen.getByLabelText('Description version'), { target: { value: '  1.0  ' } })
    fireEvent.change(screen.getByLabelText('Release date'), { target: { value: '2024-08-09' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add fix' }))
    fireEvent.change(screen.getByLabelText('Fix 1'), { target: { value: 'Fixed login' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add fix' }))
    fireEvent.change(screen.getByLabelText('Fix 2'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Remove fix 1' }))
    fireEvent.blur(screen.getByLabelText('Description version'))
    fireEvent.blur(screen.getByLabelText('Fix 1'))

    expect(screen.getByLabelText('Description version')).toHaveProperty('value', '  1.0  ')
    expect(screen.getByLabelText('Fix 1')).toHaveProperty('value', '   ')
    await showPreview()
    const preview = screen.getByRole('region', { name: 'Current values' }).textContent ?? ''
    expect(preview).toContain('"versionNumber": "  1.0  "')
    expect(preview).toContain('"releaseDate": "2024-08-09"')
    expect(preview).toContain('"recentFixes": []')
    expect(preview).toContain('"versionNumber": "1.0.0"')
  })

  it('asks before removing a version description that has text', async () => {
    renderEditor()
    const include = screen.getByRole('switch', { name: 'Include a version description' })
    fireEvent.click(include)
    fireEvent.change(screen.getByLabelText('Description version'), { target: { value: ' ' } })

    fireEvent.click(include)
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))
    expect(screen.getByLabelText('Description version')).toHaveProperty('value', ' ')

    fireEvent.click(include)
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))
    expect(screen.getByText('No version description in this configuration.')).toBeTruthy()
    await showPreview()
    expect(screen.getByRole('region', { name: 'Current values' }).textContent).not.toContain('"vdd"')

    fireEvent.click(include)
    expect(screen.getByLabelText('Description version')).toHaveProperty('value', '')
  })

  it('removes an empty version description without asking', () => {
    renderEditor()
    const include = screen.getByRole('switch', { name: 'Include a version description' })
    fireEvent.click(include)
    fireEvent.click(include)

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('No version description in this configuration.')).toBeTruthy()
  })

  it('asks before removing a version description that only has an empty fix row', () => {
    renderEditor()
    const include = screen.getByRole('switch', { name: 'Include a version description' })
    fireEvent.click(include)
    fireEvent.click(screen.getByRole('button', { name: 'Add fix' }))
    fireEvent.click(include)

    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('keeps the version description while changing steps and hiding the preview', async () => {
    renderEditor()
    fireEvent.click(screen.getByRole('switch', { name: 'Include a version description' }))
    fireEvent.change(screen.getByLabelText('Release date'), { target: { value: '2024-08-09' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await showPreview()
    fireEvent.click(screen.getByRole('button', { name: 'Hide preview' }))
    await showPreview()

    expect(screen.getByLabelText('Branch name')).toBeTruthy()
    expect(screen.getByLabelText('Release date')).toHaveProperty('value', '2024-08-09')
    expect(screen.getByRole('region', { name: 'Current values' }).textContent).toContain('"releaseDate": "2024-08-09"')
  })

  it('keeps spaces in the current editor and starts fresh when opened again', async () => {
    const view = renderEditor()
    fireEvent.change(screen.getByLabelText('Configuration manager URL'), { target: { value: '   ' } })

    expect(screen.getByLabelText('Configuration manager URL')).toHaveProperty('value', '   ')
    await showPreview()
    expect(screen.getByRole('region', { name: 'Current values' }).textContent).toContain('"url": "   "')
    expect(sessionStorage.getItem('config-editor-draft')).toBeNull()

    view.unmount()
    renderEditor()

    expect(screen.getByLabelText('Configuration manager URL')).toHaveProperty('value', '')
    await showPreview()
    expect(screen.getByRole('region', { name: 'Current values' }).textContent).toContain('"url": ""')
  })

  it('shows an invalid field error after the last step without leaving the field', async () => {
    renderEditor()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    const target = screen.getByLabelText('Target directory')
    await waitFor(() => {
      expect(helperOf(target).className).toContain('Mui-error')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    const url = screen.getByLabelText('Configuration manager URL')
    expect(helperOf(url).className).toContain('Mui-error')
    expect(url).toHaveProperty('value', '')
  })

  it('names the other step when download is blocked by a field there', () => {
    renderEditor()
    expect(screen.queryByRole('status')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.queryByRole('status')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.queryByLabelText('Configuration manager URL')).toBeNull()
    expect(screen.getByRole('button', { name: 'Download configuration' })).toHaveProperty('disabled', true)
    const blocked = screen.getByRole('status')
    expect(blocked.textContent).toContain('This configuration is not ready to download.')
    expect(blocked.textContent).toContain('Access Configuration Manager')
    expect(blocked.textContent).toContain('Copy to Target Directory')
  })

  it('downloads a complete configuration and refuses an incomplete one', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    renderEditor()

    expect(screen.getByRole('button', { name: 'Download configuration' })).toHaveProperty('disabled', true)
    fireEvent.click(screen.getByRole('button', { name: 'Download configuration' }))
    expect(click).not.toHaveBeenCalled()
    await showPreview()
    expect(screen.getByRole('region', { name: 'Current values' }).textContent).toContain('"url": ""')

    fireEvent.change(screen.getByLabelText('Configuration manager URL'), {
      target: { value: 'http://config-manager.example.com' },
    })
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.change(screen.getByLabelText('Target directory'), { target: { value: '/var/www/html/' } })
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    const download = screen.getAllByRole('button', { name: 'Download' }).find((button) => button.textContent === 'Download')
    if (!download) {
      throw new Error('Download button was not found.')
    }
    fireEvent.click(download)

    expect(click).toHaveBeenCalledOnce()
    expect(screen.getByText('The configuration file was downloaded.')).toBeTruthy()
    click.mockRestore()
  })

  it('opens a file, keeps unknown fields, and asks before replacing unsaved edits', async () => {
    renderEditor()
    chooseFile('{"password":')
    expect(await screen.findByText('The file is not valid JSON.')).toBeTruthy()

    chooseFile(JSON.stringify({
      schemaVersion: 4,
      configurationManager: { url: 'http://kept.example.com', username: 'admin', password: 'password123' },
      branchSelection: { defaultBranch: 'main' },
      build: { versionNumber: '1.0.0', command: 'npm run build', outputDirectory: 'build/' },
      copyToTarget: { targetDirectory: '/var/www/html/' },
    }))

    expect(await screen.findByDisplayValue('http://kept.example.com')).toBeTruthy()
    await showPreview()
    expect(screen.getByRole('region', { name: 'Current values' }).textContent).toContain('"schemaVersion": 4')
    fireEvent.change(screen.getByLabelText('Configuration manager URL'), {
      target: { value: 'http://edited.example.com' },
    })

    chooseFile(JSON.stringify({
      configurationManager: { url: 'http://next.example.com', username: 'admin', password: 'password123' },
      branchSelection: { defaultBranch: 'main' },
      build: { versionNumber: '1.0.0', command: 'npm run build', outputDirectory: 'build/' },
      copyToTarget: { targetDirectory: '/var/www/html/' },
    }))
    expect(await screen.findByRole('dialog')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByLabelText('Configuration manager URL')).toHaveProperty('value', 'http://edited.example.com')

    chooseFile(JSON.stringify({
      configurationManager: { url: 'http://next.example.com', username: 'admin', password: 'password123' },
      branchSelection: { defaultBranch: 'main' },
      build: { versionNumber: '1.0.0', command: 'npm run build', outputDirectory: 'build/' },
      copyToTarget: { targetDirectory: '/var/www/html/' },
    }))
    fireEvent.click(await screen.findByRole('button', { name: 'Open file' }))
    expect(await screen.findByDisplayValue('http://next.example.com')).toBeTruthy()
  })

  it('warns before leaving only after an edit that was not downloaded', () => {
    renderEditor()
    const untouched = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(untouched)
    expect(untouched.defaultPrevented).toBe(false)

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } })
    const edited = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(edited)
    expect(edited.defaultPrevented).toBe(true)
  })

  it('shows the exported JSON in the preview, including the password', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    renderEditor()

    fireEvent.change(screen.getByLabelText('Configuration manager URL'), {
      target: { value: 'http://config-manager.example.com' },
    })
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'hunter2-secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.change(screen.getByLabelText('Target directory'), { target: { value: '/var/www/html/' } })
    await showPreview()
    const json = screen.getByRole('region', { name: 'Current values' }).querySelector('pre')?.textContent ?? ''
    const downloaded: string[] = []
    const RealBlob = Blob
    const blob = vi.spyOn(globalThis, 'Blob').mockImplementation(function (parts?: BlobPart[], options?: BlobPropertyBag) {
      downloaded.push(String(parts?.[0] ?? ''))
      return new RealBlob(parts, options)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Download configuration' }))

    expect(json).toBe(downloaded[0])
    expect(json).toContain('"password": "hunter2-secret"')
    expect(json).not.toMatch(/\*{3,}|•+/)
    blob.mockRestore()
    click.mockRestore()
  })

  it('shows the password when the eye is pressed', () => {
    renderEditor()

    const password = screen.getByLabelText('Password')
    expect(password).toHaveProperty('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveProperty('type', 'text')

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password).toHaveProperty('type', 'password')
  })

  it('keeps an edit made while a file is loading and asks before replacing it', async () => {
    renderEditor()
    const pending = deferredFile(configurationDocument('http://from-file.example.com'), 'incoming.json')
    chooseThisFile(pending.file)

    fireEvent.change(screen.getByLabelText('Configuration manager URL'), {
      target: { value: 'http://edited-during-read.example.com' },
    })
    await act(async () => {
      pending.finish()
    })

    expect(await screen.findByRole('dialog', { name: 'Open another configuration?' })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Configuration manager URL', hidden: true })).toHaveProperty(
      'value',
      'http://edited-during-read.example.com',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog', { name: 'Open another configuration?' }))
    expect(screen.getByLabelText('Configuration manager URL')).toHaveProperty('value', 'http://edited-during-read.example.com')
    expect(screen.queryByText('incoming.json')).toBeNull()
  })

  it('ignores another file chosen while a file is still loading', async () => {
    renderEditor()
    const pending = deferredFile(configurationDocument('http://first.example.com'), 'first.json')
    chooseThisFile(pending.file)
    expect(screen.getByRole('button', { name: 'Open configuration' })).toHaveProperty('disabled', true)

    chooseFile(configurationDocument('http://second.example.com'), 'second.json')
    await act(async () => {
      pending.finish()
    })

    expect(await screen.findByDisplayValue('http://first.example.com')).toBeTruthy()
    expect(screen.queryByDisplayValue('http://second.example.com')).toBeNull()
    expect(screen.getByText('first.json')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open configuration' })).toHaveProperty('disabled', false)
  })

  it('shows a syntax error when a file finishes loading after an edit', async () => {
    renderEditor()
    const pending = deferredFile('{"password":', 'broken.json')
    chooseThisFile(pending.file)
    fireEvent.change(screen.getByLabelText('Configuration manager URL'), {
      target: { value: 'http://edited-during-read.example.com' },
    })
    await act(async () => {
      pending.finish()
    })

    expect(await screen.findByText('The file is not valid JSON.')).toBeTruthy()
    expect(screen.getByLabelText('Configuration manager URL')).toHaveProperty('value', 'http://edited-during-read.example.com')
    expect(screen.getByRole('button', { name: 'Open configuration' })).toHaveProperty('disabled', false)
  })

  it('keeps the pending file when another file is chosen while confirmation is open', async () => {
    renderEditor()
    fireEvent.change(screen.getByLabelText('Configuration manager URL'), {
      target: { value: 'http://edited.example.com' },
    })
    chooseFile(configurationDocument('http://first.example.com'), 'first.json')
    expect(await screen.findByRole('dialog', { name: 'Open another configuration?' })).toBeTruthy()

    chooseFile(configurationDocument('http://second.example.com'), 'second.json')
    expect(screen.getByRole('dialog', { name: 'Open another configuration?' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Open file' }))

    expect(await screen.findByDisplayValue('http://first.example.com')).toBeTruthy()
    expect(screen.queryByDisplayValue('http://second.example.com')).toBeNull()
    expect(screen.getByText('first.json')).toBeTruthy()
    expect(screen.queryByText('second.json')).toBeNull()
  })

  it('reports a failed file read and clears the loading state', async () => {
    renderEditor()
    const pending = deferredFile('{', 'unreadable.json')
    chooseThisFile(pending.file)
    expect(screen.getByRole('button', { name: 'Open configuration' })).toHaveProperty('disabled', true)

    await act(async () => {
      pending.fail()
    })

    expect(await screen.findByText('The file could not be read.')).toBeTruthy()
    expect(screen.getByText('Choose the file again.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open configuration' })).toHaveProperty('disabled', false)
  })
})
