import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
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
import { useConfigurationForm } from '../hooks/useConfigurationForm.ts'

const configurationStepLabels = [
  'Access Configuration Manager',
  'Branch Selection',
  'Build',
  'Copy to Target Directory',
] as const

export function ConfigurationEditorPage() {
  const { control, watch } = useConfigurationForm()
  const [activeStep, setActiveStep] = useState(0)
  const [previewVisible, setPreviewVisible] = useState(true)
  const values = watch()

  return (
    <Stack spacing={2.5} sx={{ mt: 3 }}>
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
            {activeStep === 0 && <ConfigurationManagerStep control={control} />}
            {activeStep === 1 && <BranchSelectionStep control={control} />}
            {activeStep === 2 && <BuildStep control={control} />}
            {activeStep === 3 && <CopyToTargetStep control={control} />}
            <Divider />
            <StepNavigation
              activeStep={activeStep}
              stepCount={configurationStepLabels.length}
              onBack={() => setActiveStep((step) => Math.max(step - 1, 0))}
              onNext={() => setActiveStep((step) => Math.min(step + 1, configurationStepLabels.length - 1))}
            />
          </Stack>
        </Paper>
        {previewVisible && <ConfigurationPreview values={values} onHide={() => setPreviewVisible(false)} />}
      </Box>
    </Stack>
  )
}
