import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import type { ValidationIssue } from '../model/validationTypes.ts'
import { stepLabels } from './stepLabels.ts'

const sectionName = (path: string): string => {
  if (path.startsWith('configurationManager')) return stepLabels.configurationManager
  if (path.startsWith('branchSelection')) return stepLabels.branchSelection
  if (path.startsWith('build.')) return stepLabels.build
  if (path.startsWith('copyToTarget')) return stepLabels.copyToTarget
  const fixIndex = /^vdd\.recentFixes\.(\d+)$/.exec(path)
  if (fixIndex) return `Version description, Fix ${Number(fixIndex[1]) + 1}`
  if (path.startsWith('vdd')) return 'Version description'
  return 'Configuration'
}

type DownloadBlockedAlertProps = {
  issues: readonly ValidationIssue[]
}

export function DownloadBlockedAlert({ issues }: DownloadBlockedAlertProps) {
  if (issues.length === 0) {
    return null
  }

  return (
    <Alert severity="warning" role="status">
      <AlertTitle>This configuration is not ready to download.</AlertTitle>
      Finish these items. The step name tells you where to edit each one.
      <Box component="ul" sx={{ m: 0, mt: 1, pl: 2 }}>
        {issues.map((issue) => (
          <li key={`${issue.path}:${issue.message}`}>
            {sectionName(issue.path)}: {issue.message}
          </li>
        ))}
      </Box>
    </Alert>
  )
}
