// @vitest-environment jsdom

import { ThemeProvider } from '@mui/material/styles'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
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

const chooseFile = (contents: string, name = 'customer.json') => {
  const input = document.querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Configuration file input was not found.')
  }
  fireEvent.change(input, { target: { files: [new File([contents], name, { type: 'application/json' })] } })
}

afterEach(() => {
  cleanup()
})

describe('ConfigurationEditorPage', () => {
  it('keeps an entered value after moving to the next step and back', () => {
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

  it('hides and shows the JSON preview', () => {
    renderEditor()

    fireEvent.click(screen.getByRole('button', { name: 'Hide preview' }))
    expect(screen.queryByRole('region', { name: 'Current values' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Show preview' }))
    expect(screen.getByRole('region', { name: 'Current values' })).toBeTruthy()
  })

  it('adds an empty version description without copying the build version', () => {
    renderEditor()

    expect(screen.getByText('No version description in this configuration.')).toBeTruthy()
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

  it('stores the version description text as typed and keeps a chosen date', () => {
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

  it('keeps the version description while changing steps and hiding the preview', () => {
    renderEditor()
    fireEvent.click(screen.getByRole('switch', { name: 'Include a version description' }))
    fireEvent.change(screen.getByLabelText('Release date'), { target: { value: '2024-08-09' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hide preview' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show preview' }))

    expect(screen.getByLabelText('Branch name')).toBeTruthy()
    expect(screen.getByLabelText('Release date')).toHaveProperty('value', '2024-08-09')
    expect(screen.getByRole('region', { name: 'Current values' }).textContent).toContain('"releaseDate": "2024-08-09"')
  })

  it('keeps spaces in the current editor and starts fresh when opened again', () => {
    const view = renderEditor()
    fireEvent.change(screen.getByLabelText('Configuration manager URL'), { target: { value: '   ' } })

    expect(screen.getByLabelText('Configuration manager URL')).toHaveProperty('value', '   ')
    expect(screen.getByRole('region', { name: 'Current values' }).textContent).toContain('"url": "   "')
    expect(sessionStorage.getItem('config-editor-draft')).toBeNull()

    view.unmount()
    renderEditor()

    expect(screen.getByLabelText('Configuration manager URL')).toHaveProperty('value', '')
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

  it('downloads a complete configuration and refuses an incomplete one', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    renderEditor()

    expect(screen.getByRole('button', { name: 'Download configuration' })).toHaveProperty('disabled', true)
    fireEvent.click(screen.getByRole('button', { name: 'Download configuration' }))
    expect(click).not.toHaveBeenCalled()
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

  it('shows the password when the eye is pressed', () => {
    renderEditor()

    const password = screen.getByLabelText('Password')
    expect(password).toHaveProperty('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveProperty('type', 'text')

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password).toHaveProperty('type', 'password')
  })
})
