import {
  Box,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material'
import { useThemeControls } from '@/theme/ThemeContext'
import PluginConnection from '@/components/Settings/PluginConnection'

function Settings() {
  const { themeName, setThemeName, availableThemes } = useThemeControls()

  return (
    <Container sx={{ py: 6, maxWidth: 760, textAlign: 'left' }}>
      <Typography variant='h4' gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant='h6' gutterBottom>
          Appearance
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Applies straight away and is remembered for this browser.
        </Typography>
        <FormControl size='small' sx={{ minWidth: 240 }}>
          <InputLabel id='theme-select-label'>Theme</InputLabel>
          <Select
            labelId='theme-select-label'
            id='theme-select'
            value={themeName}
            label='Theme'
            onChange={event => setThemeName(event.target.value)}
          >
            {availableThemes.map(name => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      <Divider sx={{ mb: 4 }} />

      <Box>
        <Typography variant='h5' gutterBottom>
          Connect RuneLite
        </Typography>
        <PluginConnection />
      </Box>
    </Container>
  )
}

export default Settings
