import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const examplePath = path.resolve('release-config.example.json')

test('imports the example, edits one field, and reads the downloaded file', async ({ page }) => {
  const example = JSON.parse(await readFile(examplePath, 'utf8'))
  await page.goto('/')
  await page.getByLabel('Configuration file').setInputFiles(examplePath)

  await expect(page.getByLabel('Configuration manager URL')).toHaveValue(example.configurationManager.url)
  await expect(page.getByLabel('Username')).toHaveValue('admin')
  await expect(page.getByRole('textbox', { name: 'Password' })).toHaveValue('password123')

  await page.getByRole('tab', { name: 'Branch Selection' }).click()
  await expect(page.getByRole('combobox', { name: 'Branch name' })).toHaveValue('main')
  await page.getByRole('combobox', { name: 'Branch name' }).click()
  await page.getByRole('option', { name: 'release' }).click()

  await page.getByRole('tab', { name: 'Build' }).click()
  await expect(page.getByLabel('Version number')).toHaveValue('1.0.0')
  await expect(page.getByLabel('Build command')).toHaveValue('npm run build')
  await expect(page.getByLabel('Output directory')).toHaveValue('build/')
  await expect(page.getByLabel('Description version')).toHaveValue('1.0.0')

  await page.getByRole('tab', { name: 'Copy to Target Directory' }).click()
  await expect(page.getByLabel('Target directory')).toHaveValue('/var/www/html/')

  await expect(page.getByRole('switch', { name: 'Include a version description' })).toBeChecked()
  await expect(page.getByLabel('Release date')).toHaveValue('2024-08-09')
  await expect(page.getByRole('textbox', { name: 'Fix 1', exact: true })).toHaveValue('Fixed login issue')
  await expect(page.getByRole('textbox', { name: 'Fix 2', exact: true })).toHaveValue('Updated API endpoints')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download configuration' }).click()
  const download = await downloadPromise
  await expect(page.getByText('The configuration file was downloaded.')).toBeVisible()

  const directory = await mkdtemp(path.join(tmpdir(), 'config-editor-'))
  const savedPath = path.join(directory, download.suggestedFilename())
  await download.saveAs(savedPath)
  const exported = JSON.parse(await readFile(savedPath, 'utf8'))

  expect(exported.branchSelection.defaultBranch).toBe('release')
  expect(exported.configurationManager).toEqual(example.configurationManager)
  expect(exported.build).toEqual(example.build)
  expect(exported.copyToTarget).toEqual(example.copyToTarget)
  expect(exported.vdd).toEqual(example.vdd)

  await page.getByLabel('Configuration file').setInputFiles(savedPath)
  await page.getByRole('tab', { name: 'Branch Selection' }).click()
  await expect(page.getByRole('combobox', { name: 'Branch name' })).toHaveValue('release')
  await expect(page.getByLabel('Release date')).toHaveValue('2024-08-09')
})

test('keeps unknown fields, including nested ones, through an edit and download', async ({ page }) => {
  const example = JSON.parse(await readFile(examplePath, 'utf8'))
  const source = {
    schemaVersion: 4,
    ...example,
    configurationManager: {
      ...example.configurationManager,
      timeoutSeconds: 30,
      retry: { attempts: 3, backoffMs: 500 },
    },
    vdd: {
      ...example.vdd,
      owner: 'release-team',
    },
  }
  const directory = await mkdtemp(path.join(tmpdir(), 'config-editor-'))
  const sourcePath = path.join(directory, 'with-unknown.json')
  await writeFile(sourcePath, JSON.stringify(source, null, 2))

  await page.goto('/')
  await page.getByLabel('Configuration file').setInputFiles(sourcePath)
  await expect(page.getByLabel('Configuration manager URL')).toHaveValue('http://config-manager.example.com')
  await page.getByRole('tab', { name: 'Branch Selection' }).click()
  await page.getByRole('combobox', { name: 'Branch name' }).click()
  await page.getByRole('option', { name: 'release' }).click()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download configuration' }).click()
  const download = await downloadPromise
  const savedPath = path.join(directory, 'downloaded.json')
  await download.saveAs(savedPath)
  const exported = JSON.parse(await readFile(savedPath, 'utf8'))

  expect(exported.schemaVersion).toBe(4)
  expect(exported.configurationManager.timeoutSeconds).toBe(30)
  expect(exported.configurationManager.retry).toEqual({ attempts: 3, backoffMs: 500 })
  expect(exported.configurationManager.password).toBe('password123')
  expect(exported.vdd.owner).toBe('release-team')
  expect(exported.vdd.recentFixes).toEqual(example.vdd.recentFixes)
  expect(exported.branchSelection.defaultBranch).toBe('release')
  expect(exported.build).toEqual(example.build)
  expect(exported.copyToTarget).toEqual(example.copyToTarget)
})
