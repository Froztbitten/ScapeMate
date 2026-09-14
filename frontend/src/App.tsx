import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Container,
  CssBaseline,
  Tooltip,
  Avatar,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import { ThemeProvider } from '@mui/material/styles'
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import HomePage from '@/pages/HomePage.tsx'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth'
import { auth, provider } from '@/utils/firebaseConfig'
import { getThemeByName, palettes } from '@/theme'
import { ThemeControlsProvider } from '@/theme/ThemeContext'

// Split per route: the charts and canvas libraries are only needed once the
// user actually opens those pages.
const ProgressionTree = lazy(() => import('@/pages/ProgressionTree.tsx'))
const DpsCalculator = lazy(() => import('@/pages/DpsCalculator.tsx'))
const ItemSearch = lazy(() => import('@/pages/ItemSearch.tsx'))
const Settings = lazy(() => import('@/pages/Settings.tsx'))

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [themeName, setThemeName] = useState('Navigation Calculator')
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const navigate = useNavigate()

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

  const themeControls = useMemo(
    () => ({
      themeName,
      setThemeName,
      availableThemes: Object.keys(palettes),
    }),
    [themeName]
  )

  const closeMenu = () => setMenuAnchor(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user)
    })

    return () => unsubscribe()
  }, [])

  // NavLink adds the `active` class itself, so the active state is expressed
  // as a selector rather than a render callback.
  const navLinkSx = {
    my: 2,
    color: 'white',
    display: 'block',
    textDecoration: 'none',
    '&.active': {
      textDecoration: 'underline',
    },
  }

  return (
    <ThemeProvider theme={activeTheme}>
      <ThemeControlsProvider value={themeControls}>
        <CssBaseline />
        <Container>
          <AppBar position='sticky'>
            <Toolbar>
              <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                <Button component={NavLink} to='/' sx={navLinkSx}>
                  Home
                </Button>
                <Button component={NavLink} to='/dps-calculator' sx={navLinkSx}>
                  DPS Calculator
                </Button>
                <Button component={NavLink} to='/item-search' sx={navLinkSx}>
                  Equipment Search
                </Button>
                <Button
                  component={NavLink}
                  to='/progression-tree'
                  sx={navLinkSx}
                >
                  Map
                </Button>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: 'auto',
                }}
              >
                {currentUser ? (
                  <>
                    <Tooltip title={currentUser.email ?? 'Account'}>
                      <IconButton
                        onClick={event => setMenuAnchor(event.currentTarget)}
                        size='small'
                        aria-label='Account menu'
                        aria-haspopup='true'
                      >
                        <Avatar
                          alt={currentUser.displayName ?? 'User Avatar'}
                          src={currentUser.photoURL ?? undefined}
                          sx={{ width: 32, height: 32 }}
                        />
                      </IconButton>
                    </Tooltip>
                    <Menu
                      anchorEl={menuAnchor}
                      open={Boolean(menuAnchor)}
                      onClose={closeMenu}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                      <MenuItem
                        onClick={() => {
                          closeMenu()
                          navigate('/settings')
                        }}
                      >
                        <ListItemIcon>
                          <SettingsIcon fontSize='small' />
                        </ListItemIcon>
                        <ListItemText>Settings</ListItemText>
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          closeMenu()
                          handleLogout()
                        }}
                      >
                        <ListItemIcon>
                          <LogoutIcon fontSize='small' />
                        </ListItemIcon>
                        <ListItemText>Sign out</ListItemText>
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <>
                    {/* Signed out there is no avatar to hang the menu on, but
                      the theme lives in Settings now, so keep a way in. */}
                    <Tooltip title='Settings'>
                      <IconButton
                        color='inherit'
                        component={NavLink}
                        to='/settings'
                        aria-label='Settings'
                        sx={{ mr: 1 }}
                      >
                        <SettingsIcon />
                      </IconButton>
                    </Tooltip>
                    <Button color='inherit' onClick={handleLogin}>
                      Login with Google
                    </Button>
                  </>
                )}
              </Box>
            </Toolbar>
          </AppBar>
          <Box sx={{ height: '100%' }}>
            <Suspense fallback={<CircularProgress sx={{ mt: 4 }} />}>
              <Routes>
                <Route path='/' element={<HomePage />} />
                <Route path='/dps-calculator' element={<DpsCalculator />} />
                <Route path='/item-search' element={<ItemSearch />} />
                <Route path='/progression-tree' element={<ProgressionTree />} />
                <Route path='/settings' element={<Settings />} />
                {/* The plugin's own text points people at /connect. */}
                <Route
                  path='/connect'
                  element={<Navigate to='/settings' replace />}
                />
              </Routes>
            </Suspense>
          </Box>
        </Container>
      </ThemeControlsProvider>
    </ThemeProvider>
  )
}

export default App
