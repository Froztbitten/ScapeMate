import { createTheme } from '@mui/material/styles'

const theme = createTheme({
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
})

export default theme
