// @vitest-environment jsdom

import { ThemeProvider } from '@mui/material/styles'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import { appTheme } from '../theme.ts'
import { ConfigurationEditorPage } from '../pages/ConfigurationEditorPage.tsx'

const renderEditor = () =>
  render(
    <ThemeProvider theme={appTheme}>
      <ConfigurationEditorPage />
    </ThemeProvider>,
  )

const chooseFile = (contents: string, name = 'customer.json') => {
  const input = document.querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Configuration file input was not found.')
  }
  fireEvent.change(input, { target: { files: [new File([contents], name, { type: 'application/json' })] } })
}

beforeEach(() => {
  sessionStorage.clear()
})

afterEach(() => {
  cleanup()
  sessionStorage.clear()
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
    expect(screen.getByLabelText('Version number')).toHaveProperty('value', '')
    const preview = screen.getByRole('region', { name: 'Current values' }).textContent ?? ''
    expect(preview).toContain('"versionNumber": "1.0.0"')
    expect(preview).toContain('"versionNumber": ""')
    expect(preview).toContain('"releaseDate": ""')
    expect(preview).toContain('"recentFixes": []')
  })

  it('stores the version description text as typed, including an impossible date', () => {
    renderEditor()
    fireEvent.click(screen.getByRole('switch', { name: 'Include a version description' }))

    fireEvent.change(screen.getByLabelText('Version number'), { target: { value: '  1.0  ' } })
    fireEvent.change(screen.getByLabelText('Release date'), { target: { value: '2024-02-31' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add fix' }))
    fireEvent.change(screen.getByLabelText('Fix 1'), { target: { value: 'Fixed login' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add fix' }))
    fireEvent.change(screen.getByLabelText('Fix 2'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Remove fix 1' }))

    expect(screen.getByLabelText('Fix 1')).toHaveProperty('value', '   ')
    const preview = screen.getByRole('region', { name: 'Current values' }).textContent ?? ''
    expect(preview).toContain('"versionNumber": "  1.0  "')
    expect(preview).toContain('"releaseDate": "2024-02-31"')
    expect(preview).toContain('"recentFixes": [\n      "   "\n    ]')
    expect(preview).toContain('"versionNumber": "1.0.0"')
  })

  it('asks before removing a version description that has text', async () => {
    renderEditor()
    const include = screen.getByRole('switch', { name: 'Include a version description' })
    fireEvent.click(include)
    fireEvent.change(screen.getByLabelText('Version number'), { target: { value: ' ' } })

    fireEvent.click(include)
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))
    expect(screen.getByLabelText('Version number')).toHaveProperty('value', ' ')

    fireEvent.click(include)
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))
    expect(screen.getByText('No version description in this configuration.')).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Current values' }).textContent).not.toContain('"vdd"')

    fireEvent.click(include)
    expect(screen.getByLabelText('Version number')).toHaveProperty('value', '')
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
    fireEvent.change(screen.getByLabelText('Release date'), { target: { value: '2024-02-31' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hide preview' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show preview' }))

    expect(screen.getByLabelText('Branch name')).toBeTruthy()
    expect(screen.getByLabelText('Release date')).toHaveProperty('value', '2024-02-31')
    expect(screen.getByRole('region', { name: 'Current values' }).textContent).toContain('"releaseDate": "2024-02-31"')
  })

  it('keeps an empty field and restores it when the editor is opened again', async () => {
    const view = renderEditor()
    fireEvent.change(screen.getByLabelText('Configuration manager URL'), { target: { value: '   ' } })

    await waitFor(() => {
      expect(sessionStorage.getItem('config-editor-draft')).toContain('"url":"   "')
    })
    view.unmount()
    renderEditor()

    expect(screen.getByLabelText('Configuration manager URL')).toHaveProperty('value', '   ')
    expect(screen.getByRole('region', { name: 'Current values' }).textContent).toContain('"url": "   "')
  })

  it('downloads a complete configuration and refuses an incomplete one', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    renderEditor()

    fireEvent.click(screen.getByRole('button', { name: 'Download configuration' }))
    expect(click).not.toHaveBeenCalled()
    expect(screen.getByText(/configurationManager.url/)).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Current values' }).textContent).toContain('"url": ""')

    fireEvent.change(screen.getByLabelText('Configuration manager URL'), {
      target: { value: 'http://config-manager.example.com' },
    })
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.change(screen.getByLabelText('Target directory'), { target: { value: '/var/www/html/' } })
    fireEvent.click(screen.getByRole('button', { name: 'Download configuration' }))

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
