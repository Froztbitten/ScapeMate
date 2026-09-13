import {
  SetStateAction,
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useState,
} from 'react'
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
} from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { Routes, Route, NavLink } from 'react-router-dom'
import HomePage from '@/pages/HomePage.tsx'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth'
import { auth, provider } from '@/utils/firebaseConfig'
import { getThemeByName, palettes } from '@/theme'
import ThemeSwitcher from '@/theme/ThemeSwitcher'

// Split per route: the charts and canvas libraries are only needed once the
// user actually opens those pages.
const ProgressionTree = lazy(() => import('@/pages/ProgressionTree.tsx'))
const DpsCalculator = lazy(() => import('@/pages/DpsCalculator.tsx'))
const ItemSearch = lazy(() => import('@/pages/ItemSearch.tsx'))
const ConnectPlugin = lazy(() => import('@/pages/ConnectPlugin.tsx'))

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
              <Button component={NavLink} to='/progression-tree' sx={navLinkSx}>
                Map
              </Button>
              <Button component={NavLink} to='/connect' sx={navLinkSx}>
                Connect
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
              }}
            >
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
          <Suspense fallback={<CircularProgress sx={{ mt: 4 }} />}>
            <Routes>
              <Route path='/' element={<HomePage />} />
              <Route path='/dps-calculator' element={<DpsCalculator />} />
              <Route path='/item-search' element={<ItemSearch />} />
              <Route path='/progression-tree' element={<ProgressionTree />} />
              <Route path='/connect' element={<ConnectPlugin />} />
            </Routes>
          </Suspense>
        </Box>
      </Container>
    </ThemeProvider>
  )
}

export default App
