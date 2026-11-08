import { useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { BranchSelectionStep } from '../components/BranchSelectionStep.tsx'
import { BuildStep } from '../components/BuildStep.tsx'
import { ConfigurationManagerStep } from '../components/ConfigurationManagerStep.tsx'
import { ConfigurationPreview } from '../components/ConfigurationPreview.tsx'
import { ConfigurationStepper } from '../components/ConfigurationStepper.tsx'
import { CopyToTargetStep } from '../components/CopyToTargetStep.tsx'
import { StepNavigation } from '../components/StepNavigation.tsx'
import { VddEditor } from '../components/VddEditor.tsx'
import { useConfigurationSession, type ConfigurationNotice } from '../hooks/useConfigurationSession.ts'

const configurationStepLabels = [
  'Access Configuration Manager',
  'Branch Selection',
  'Build',
  'Copy to Target Directory',
] as const

const noticeTitle = (notice: Exclude<ConfigurationNotice, { kind: 'downloaded' }>) => {
  if (notice.kind === 'syntax') {
    return 'The file is not valid JSON.'
  }
  if (notice.kind === 'structure') {
    return 'The file does not match the configuration structure.'
  }
  return 'The configuration is missing details required to save it.'
}

export function ConfigurationEditorPage() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [previewVisible, setPreviewVisible] = useState(true)
  const session = useConfigurationSession()

  return (
    <Stack spacing={2.5} sx={{ mt: 3 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => fileInput.current?.click()}>
            Open configuration
          </Button>
          <Button variant="contained" onClick={session.download}>
            Download configuration
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {session.fileName}
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
            void session.chooseFile(file)
          }
        }}
      />
      {session.notice?.kind === 'downloaded' && (
        <Alert severity="success">The configuration file was downloaded.</Alert>
      )}
      {session.notice && session.notice.kind !== 'downloaded' && (
        <Alert severity="error">
          <AlertTitle>{noticeTitle(session.notice)}</AlertTitle>
          {session.notice.kind === 'syntax' ? (
            session.notice.message
          ) : (
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {session.notice.issues.map((issue) => (
                <li key={`${issue.path}:${issue.message}`}>
                  {issue.path}: {issue.message}
                </li>
              ))}
            </Box>
          )}
        </Alert>
      )}
      <ConfigurationStepper labels={configurationStepLabels} activeStep={activeStep} onSelect={setActiveStep} />
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
                  {configurationStepLabels[activeStep]}
                </Typography>
                {!previewVisible && (
                  <Button size="small" onClick={() => setPreviewVisible(true)}>
                    Show preview
                  </Button>
                )}
              </Stack>
              {activeStep === 0 && <ConfigurationManagerStep control={session.control} />}
              {activeStep === 1 && <BranchSelectionStep control={session.control} />}
              {activeStep === 2 && <BuildStep control={session.control} />}
              {activeStep === 3 && <CopyToTargetStep control={session.control} />}
              <Divider />
              <StepNavigation
                activeStep={activeStep}
                stepCount={configurationStepLabels.length}
                onBack={() => setActiveStep((step) => Math.max(step - 1, 0))}
                onNext={() => setActiveStep((step) => Math.min(step + 1, configurationStepLabels.length - 1))}
              />
            </Stack>
          </Paper>
          <VddEditor
            control={session.control}
            setValue={session.setValue}
            unregister={session.unregister}
            onIncluded={session.includeVdd}
            onRemoved={session.removeVddBlock}
          />
        </Stack>
        {previewVisible && <ConfigurationPreview text={session.currentText} onHide={() => setPreviewVisible(false)} />}
      </Box>
      <Dialog open={session.pendingFile !== null} onClose={session.cancelOpen}>
        <DialogTitle>Open another configuration?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The current configuration has not been downloaded. Opening a file replaces it in the editor.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={session.cancelOpen}>Cancel</Button>
          <Button onClick={session.confirmOpen}>Open file</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
