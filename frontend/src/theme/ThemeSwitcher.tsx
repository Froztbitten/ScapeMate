import { Select, MenuItem, FormControl, InputLabel } from '@mui/material'

interface ThemeSwitcherProps {
  currentThemeName: string;
  availableThemes: string[];
  onThemeChange: (themeName: string) => void;
}
function ThemeSwitcher({ currentThemeName, availableThemes, onThemeChange }: Readonly<ThemeSwitcherProps>) {
  // Receive availableThemes as prop
  const handleThemeChange = (event: { target: { value: string } }) => {
    onThemeChange(event.target.value)
  }

  return (
    <FormControl size='small' sx={{ m: 1, minWidth: 120 }}>
      <InputLabel id='theme-select-label'>Theme</InputLabel>
      <Select
        labelId='theme-select-label'
        id='theme-select'
        value={currentThemeName}
        label='Theme'
        onChange={handleThemeChange}>
        {/* Map over the names passed via props */}
        {availableThemes.map((themeName: string) => (
          <MenuItem key={themeName} value={themeName}>
            {themeName}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default ThemeSwitcher
