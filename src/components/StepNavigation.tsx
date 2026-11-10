import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

type StepNavigationProps = {
  activeStep: number
  stepCount: number
  onBack: () => void
  onNext: () => void
  onDownload: () => void
  canDownload: boolean
}

export function StepNavigation({ activeStep, stepCount, onBack, onNext, onDownload, canDownload }: StepNavigationProps) {
  const lastStep = activeStep === stepCount - 1

  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
      <Button onClick={onBack} disabled={activeStep === 0}>
        Back
      </Button>
      <Button variant="contained" onClick={lastStep ? onDownload : onNext} disabled={lastStep && !canDownload}>
        {lastStep ? 'Download' : 'Next'}
      </Button>
    </Stack>
  )
}
