import { createContext, useContext } from 'react'

export interface ThemeControls {
  themeName: string
  setThemeName: (name: string) => void
  availableThemes: string[]
}

const ThemeContext = createContext<ThemeControls | null>(null)

export const ThemeControlsProvider = ThemeContext.Provider

/** The theme picker lives in Settings, well away from where the state sits. */
export const useThemeControls = (): ThemeControls => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error(
      'useThemeControls must be used within ThemeControlsProvider'
    )
  }
  return context
}
