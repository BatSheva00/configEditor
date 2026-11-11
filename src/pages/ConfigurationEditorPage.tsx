import { useEffect, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { BranchSelectionStep } from '../components/steps/BranchSelectionStep.tsx'
import { BuildStep } from '../components/steps/BuildStep.tsx'
import { ConfirmDialog } from '../components/ConfirmDialog.tsx'
import { ConfigurationManagerStep } from '../components/steps/ConfigurationManagerStep.tsx'
import { ConfigurationPreview } from '../components/ConfigurationPreview.tsx'
import { ConfigurationStepper } from '../components/ConfigurationStepper.tsx'
import { CopyToTargetStep } from '../components/steps/CopyToTargetStep.tsx'
import { DownloadBlockedAlert } from '../components/DownloadBlockedAlert.tsx'
import { StepNavigation } from '../components/StepNavigation.tsx'
import { stepLabels } from '../components/stepLabels.ts'
import { VddEditor } from '../components/vdd/VddEditor.tsx'
import { useConfigurationEditor, type ConfigurationNotice } from '../hooks/useConfigurationEditor.ts'

const configurationSteps = [
  { label: stepLabels.configurationManager, Step: ConfigurationManagerStep },
  { label: stepLabels.branchSelection, Step: BranchSelectionStep },
  { label: stepLabels.build, Step: BuildStep },
  { label: stepLabels.copyToTarget, Step: CopyToTargetStep },
] as const

const noticeTitle = (notice: Exclude<ConfigurationNotice, { kind: 'downloaded' }>) =>
  notice.kind === 'syntax'
    ? 'The file is not valid JSON.'
    : 'The file does not match the configuration structure.'

export function ConfigurationEditorPage() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewConfirm, setPreviewConfirm] = useState(false)
  const editor = useConfigurationEditor()
  const lastStep = configurationSteps.length - 1
  const ActiveStep = configurationSteps[activeStep].Step
  const showBlockedList = !editor.canDownload && activeStep === lastStep

  useEffect(() => {
    if (activeStep === lastStep) {
      editor.revealFieldErrors()
    }
  }, [activeStep, lastStep, editor.revealFieldErrors])

  return (
    <Stack spacing={2.5} sx={{ mt: 3 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => fileInput.current?.click()}>
            Open configuration
          </Button>
          <Button variant="contained" onClick={editor.download} disabled={!editor.canDownload}>
            Download configuration
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {editor.fileName}
        </Typography>
      </Stack>
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        hidden
        aria-label="Configuration file"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) {
            void editor.importFile(file)
          }
        }}
      />
      {showBlockedList && <DownloadBlockedAlert issues={editor.downloadIssues} />}
      {editor.notice?.kind === 'downloaded' && (
        <Alert severity="success">The configuration file was downloaded.</Alert>
      )}
      {editor.notice && editor.notice.kind !== 'downloaded' && (
        <Alert severity="error">
          <AlertTitle>{noticeTitle(editor.notice)}</AlertTitle>
          {editor.notice.kind === 'syntax' ? (
            editor.notice.message
          ) : (
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {editor.notice.issues.map((issue) => (
                <li key={`${issue.path}:${issue.message}`}>
                  {issue.path}: {issue.message}
                </li>
              ))}
            </Box>
          )}
        </Alert>
      )}
      <ConfigurationStepper
        labels={configurationSteps.map((step) => step.label)}
        activeStep={activeStep}
        onSelect={setActiveStep}
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: previewVisible
            ? { xs: '1fr', md: 'minmax(0, 1fr) minmax(220px, 340px)' }
            : '1fr',
          gap: 2.5,
          alignItems: 'stretch',
        }}
      >
        <Stack spacing={2.5}>
          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2.5}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="h2">
                  {configurationSteps[activeStep].label}
                </Typography>
                {!previewVisible && (
                  <Button size="small" onClick={() => setPreviewConfirm(true)}>
                    Show preview
                  </Button>
                )}
              </Stack>
              <ActiveStep control={editor.control} />
              <Divider />
              <StepNavigation
                activeStep={activeStep}
                stepCount={configurationSteps.length}
                onBack={() => setActiveStep((step) => Math.max(step - 1, 0))}
                onNext={() => setActiveStep((step) => Math.min(step + 1, lastStep))}
                onDownload={editor.download}
                canDownload={editor.canDownload}
              />
            </Stack>
          </Paper>
          <VddEditor
            control={editor.control}
            setValue={editor.setValue}
            onInclude={editor.includeVdd}
            onRemove={editor.removeVddBlock}
          />
        </Stack>
        {previewVisible && <ConfigurationPreview text={editor.currentText} onHide={() => setPreviewVisible(false)} />}
      </Box>
      <ConfirmDialog
        open={previewConfirm}
        title="Show the preview?"
        message="The preview shows passwords in plain text."
        confirmLabel="Show preview"
        onConfirm={() => {
          setPreviewConfirm(false)
          setPreviewVisible(true)
        }}
        onCancel={() => setPreviewConfirm(false)}
      />
      <ConfirmDialog
        open={editor.pendingFile !== null}
        title="Open another configuration?"
        message="The current configuration has not been downloaded. Opening a file replaces it in the editor."
        confirmLabel="Open file"
        onConfirm={editor.confirmOpen}
        onCancel={editor.cancelOpen}
      />
    </Stack>
  )
}
