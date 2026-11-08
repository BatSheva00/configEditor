import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

type StepNavigationProps = {
  activeStep: number
  stepCount: number
  onBack: () => void
  onNext: () => void
}

export function StepNavigation({ activeStep, stepCount, onBack, onNext }: StepNavigationProps) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
      <Button onClick={onBack} disabled={activeStep === 0}>
        Back
      </Button>
      <Button variant="contained" onClick={onNext} disabled={activeStep === stepCount - 1}>
        Next
      </Button>
    </Stack>
  )
}
