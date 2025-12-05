import { SetStateAction, useEffect, useMemo, useState } from 'react'
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Container,
  CssBaseline,
  Tooltip,
  Avatar,
} from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { Routes, Route, NavLink } from 'react-router-dom'
import ProgressionTree from '@/pages/ProgressionTree.tsx'
import DpsCalculator from '@/pages/DpsCalculator.tsx'
import ItemSearch from '@/pages/ItemSearch.tsx'
import HomePage from '@/pages/HomePage.tsx'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth'
import { auth, provider } from '@/utils/firebaseConfig'
import { getThemeByName, palettes } from '@/theme/index.js'
import ThemeSwitcher from '@/theme/ThemeSwitcher'

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [themeName, setThemeName] = useState('Navigation Calculator')

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider)
      console.log('Successfully signed in.')
    } catch (error) {
      console.error('Error signing in:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      console.log('Successfully signed out.')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const activeTheme = useMemo(() => getThemeByName(themeName), [themeName])

  const handleThemeChange = (newThemeName: SetStateAction<string>) => {
    setThemeName(newThemeName)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user)
    })

    return () => unsubscribe()
  }, [])

  const navLinkStyle = {
    my: 2,
    color: 'white',
    display: 'block',
    textDecoration: 'none',
  }

  const activeLinkStyle = {
    ...navLinkStyle,
    textDecoration: 'underline',
  }

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <Container>
        <AppBar position='sticky'>
          <Toolbar>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              <Button
                component={NavLink}
                to='/'
                style={({ isActive }) => (isActive ? activeLinkStyle : navLinkStyle)}
              >
                Home
              </Button>
              <Button
                component={NavLink}
                to='/dps-calculator'
                style={({ isActive }) => (isActive ? activeLinkStyle : navLinkStyle)}
              >
                DPS Calculator
              </Button>
              <Button
                component={NavLink}
                to='/item-search'
                style={({ isActive }) => (isActive ? activeLinkStyle : navLinkStyle)}
              >
                Equipment Search
              </Button>
              <Button
                component={NavLink}
                to='/progression-tree'
                style={({ isActive }) => (isActive ? activeLinkStyle : navLinkStyle)}
              >
                Map
              </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}></Box>
            <Box>
              <ThemeSwitcher
                currentThemeName={themeName}
                availableThemes={Object.keys(palettes)}
                onThemeChange={handleThemeChange}
              />
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                marginLeft: 'auto',
              }}>
              {currentUser ? (
                <>
                  <Tooltip title={currentUser.email ?? ''}>
                    <Avatar
                      alt={currentUser.displayName ?? 'User Avatar'}
                      src={currentUser.photoURL ?? undefined}
                      sx={{ width: 32, height: 32, mr: 2 }}
                    />
                  </Tooltip>

                  <Button color='inherit' onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <Button color='inherit' onClick={handleLogin}>
                  Login with Google
                </Button>
              )}
            </Box>
          </Toolbar>
        </AppBar>
        <Box sx={{ height: '100%' }}>
          <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/dps-calculator' element={<DpsCalculator />} />
            <Route path='/item-search' element={<ItemSearch />} />
            <Route path='/progression-tree' element={<ProgressionTree />} />
          </Routes>
        </Box>
      </Container>
    </ThemeProvider>
  )
}

export default App
