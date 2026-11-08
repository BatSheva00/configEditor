// @vitest-environment jsdom

import { ThemeProvider } from '@mui/material/styles'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { appTheme } from '../theme.ts'
import { ConfigurationEditorPage } from '../pages/ConfigurationEditorPage.tsx'

const renderEditor = () =>
  render(
    <ThemeProvider theme={appTheme}>
      <ConfigurationEditorPage />
    </ThemeProvider>,
  )

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

  it('hides and shows the JSON preview', () => {
    renderEditor()

    fireEvent.click(screen.getByRole('button', { name: 'Hide preview' }))
    expect(screen.queryByRole('region', { name: 'Current values' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Show preview' }))
    expect(screen.getByRole('region', { name: 'Current values' })).toBeTruthy()
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
