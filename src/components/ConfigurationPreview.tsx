import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { serializeConfiguration, type ReleaseConfigFormValues } from '../model/document.ts'

type ConfigurationPreviewProps = {
  values: ReleaseConfigFormValues
  onHide: () => void
}

export function ConfigurationPreview({ values, onHide }: ConfigurationPreviewProps) {
  return (
    <Box
      role="region"
      aria-label="Current values"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'visible',
        borderRadius: 2,
        border: '1px solid #000000',
        bgcolor: '#000000',
        color: '#e8eef6',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, pt: 0.5 }}>
        <Button size="small" onClick={onHide} sx={{ color: 'inherit' }}>
          Hide preview
        </Button>
      </Box>
      <Box
        component="pre"
        sx={{
          m: 0,
          px: 2,
          pb: 2,
          overflow: 'visible',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
          fontFamily: 'ui-monospace, Consolas, monospace',
          fontSize: '0.8125rem',
          lineHeight: 1.55,
        }}
      >
        {serializeConfiguration(values)}
      </Box>
    </Box>
  )
}
