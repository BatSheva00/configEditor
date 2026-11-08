import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import Typography from '@mui/material/Typography'
import { ThemeProvider } from '@mui/material/styles'
import { ConfigurationEditorPage } from './pages/ConfigurationEditorPage.tsx'
import { appTheme } from './theme.ts'

export default function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h5" component="h1">
            Configuration Editor
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Nothing is executed or copied.
          </Typography>
          <ConfigurationEditorPage />
        </Container>
      </Box>
    </ThemeProvider>
  )
}
