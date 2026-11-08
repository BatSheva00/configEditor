import Box from '@mui/material/Box'
import Step from '@mui/material/Step'
import StepButton from '@mui/material/StepButton'
import Stepper from '@mui/material/Stepper'

type ConfigurationStepperProps = {
  labels: readonly string[]
  activeStep: number
  onSelect: (step: number) => void
}

export function ConfigurationStepper({ labels, activeStep, onSelect }: ConfigurationStepperProps) {
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', px: { xs: 1, sm: 2 }, py: 2 }}>
      <Stepper nonLinear alternativeLabel activeStep={activeStep}>
        {labels.map((label, index) => (
          <Step key={label}>
            <StepButton
              onClick={() => onSelect(index)}
              sx={{ '& .MuiStepLabel-label': { whiteSpace: 'normal', lineHeight: 1.3 } }}
            >
              {label}
            </StepButton>
          </Step>
        ))}
      </Stepper>
    </Box>
  )
}
