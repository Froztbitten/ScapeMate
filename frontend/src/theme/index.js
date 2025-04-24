import { createTheme } from '@mui/material/styles'
import {
  blueGrey,
  grey,
  cyan,
  amber,
  brown,
  yellow,
  pink,
  lightBlue,
  deepPurple,
  lime,
  teal,
  green,
  orange,
  common,
} from '@mui/material/colors'

const baseThemeConfig = {
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 500 },
    h2: { fontSize: '2rem', fontWeight: 500 },
    h3: { fontSize: '1.75rem', fontWeight: 500 },
    h4: { fontSize: '1.5rem', fontWeight: 500 },
    h5: { fontSize: '1.25rem', fontWeight: 500 },
    h6: { fontSize: '1.1rem', fontWeight: 500 },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.875rem' },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          padding: '0px !important',
          maxWidth: '100% !important',
          height: '100%',
          margin: '0 auto',
          textAlign: 'center',
        },
      },
    },
  },
}

export const palettes = {
  'Navigation Calculator': {
    palette: {
      mode: 'dark',
      primary: {
        main: cyan[700],
        light: cyan[500],
        dark: cyan[900],
        contrastText: '#ffffff',
      },
      secondary: {
        main: amber[500],
        light: amber[300],
        dark: amber[700],
        contrastText: grey[900],
      },
      background: {
        default: grey[900],
        paper: blueGrey[900],
      },
      text: {
        primary: grey[100],
        secondary: grey[400],
        disabled: grey[600],
      },
      divider: blueGrey[700],
      action: {
        active: cyan[400],
        hover: 'rgba(255, 255, 255, 0.08)',
        selected: 'rgba(0, 188, 212, 0.16)',
        disabled: grey[700],
        disabledBackground: grey[800],
      },
    },
  },
  'Light Mode': {
    palette: {
      mode: 'light',
      primary: { main: blueGrey[800] },
      secondary: { main: amber[700] },
      background: { default: grey[100], paper: '#ffffff' },
    },
  },
  'OSRS Classic': {
    palette: {
      mode: 'dark',
      primary: { main: brown[600] },
      secondary: { main: yellow[700] },
      background: {
        default: '#333333',
        paper: '#c2b8a5',
      },
      text: {
        primary: '#ffffff',
        secondary: grey[400],
      },
    },
    typography: {
      fontFamily: '"RuneScape UF", "Roboto", sans-serif',
      button: { textTransform: 'none' },
    },
    shape: {
      borderRadius: 2,
    },
  },
  'Cupcake Sprinkles': {
    palette: {
      mode: 'light',
      primary: {
        main: pink[400],
        light: pink[200],
        dark: pink[600],
        contrastText: '#ffffff',
      },
      secondary: {
        main: lightBlue[300],
        light: lightBlue[100],
        dark: lightBlue[500],
        contrastText: grey[900],
      },
      background: {
        default: '#faf3e0',
        paper: '#ffffff',
      },
      text: {
        primary: grey[900],
        secondary: grey[700],
        disabled: grey[500],
      },
      divider: pink[100],
      action: {
        active: pink[500],
        hover: 'rgba(224, 0, 119, 0.08)',
        selected: 'rgba(224, 0, 119, 0.16)',
        disabled: grey[500],
        disabledBackground: grey[200],
      },
      info: { main: deepPurple[300] },
      success: { main: lime[500] },
      warning: { main: yellow[600] },
      error: { main: pink[700] },
      common: common,
      grey: grey,
    },
  },
  'Lo-fi Hip Hop Beats': {
      palette: {
          mode: 'dark', // Definitely dark mode
          primary: { // Muted teal/cyan
              main: teal[700],
              light: teal[500],
              dark: teal[900],
              contrastText: '#ffffff',
          },
          secondary: { // Soft, muted purple
              main: deepPurple[400],
              light: deepPurple[200],
              dark: deepPurple[600],
              contrastText: '#ffffff',
          },
          background: { // Very dark, slightly desaturated purple/blue
              default: '#1a1a2e', // Custom dark blue/purple
              paper: '#2a2a4e', // Slightly lighter paper background
          },
          text: { // Off-white, maybe slightly warm
              primary: grey[200], // Brighter than default dark text
              secondary: grey[400],
              disabled: grey[600],
          },
          divider: blueGrey[700], // Subtle dark divider
          action: { // Use primary/secondary variants
              active: teal[500],
              hover: 'rgba(0, 121, 107, 0.15)', // teal[700] hover, slightly more visible
              selected: 'rgba(0, 121, 107, 0.25)', // teal[700] selected, slightly more visible
              disabled: grey[700],
              disabledBackground: grey[800],
          },
          // Optional: Muted info/success/warning/error
          info: { main: lightBlue[700] },
          success: { main: green[800] },
          warning: { main: orange[700] },
          error: { main: pink[800] },
          common: common,
          grey: grey,
      },
  },
}

export const getThemeByName = themeName => {
  const selectedPaletteConfig =
    palettes[themeName] || palettes['Navigation Calculator']
  return createTheme(baseThemeConfig, selectedPaletteConfig)
}
