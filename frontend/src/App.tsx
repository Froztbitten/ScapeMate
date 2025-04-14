import { useEffect, useState } from 'react'
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
import ProgressionTree from './pages/ProgressionTree.tsx'
import DpsCalculator from './pages/DpsCalculator.tsx'
import ItemSearch from './pages/ItemSearch.tsx'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth'
import { auth, provider } from './utils/firebaseConfig'
import theme from './theme/index'

type TabValue = 'dpsCalculator' | 'equipmentSearch' | 'map'

function App() {
  const [activeTab, setActiveTab] = useState<TabValue>('dpsCalculator')
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const handleTabChange = (newValue: TabValue) => {
    setActiveTab(newValue)
  }

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user)
    })

    return () => unsubscribe()
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container>
        <AppBar position='sticky'>
          <Toolbar>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              <Button
                onClick={() => handleTabChange('dpsCalculator')}
                sx={{ my: 2, color: 'white', display: 'block' }}>
                DPS Calculator
              </Button>
              <Button
                onClick={() => handleTabChange('equipmentSearch')}
                sx={{ my: 2, color: 'white', display: 'block' }}>
                Equipment Search
              </Button>
              <Button
                onClick={() => handleTabChange('map')}
                sx={{ my: 2, color: 'white', display: 'block' }}>
                Map
              </Button>
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
          {activeTab === 'dpsCalculator' && <DpsCalculator />}
          {activeTab === 'equipmentSearch' && <ItemSearch />}
          {activeTab === 'map' && <ProgressionTree />}
        </Box>
      </Container>
    </ThemeProvider>
  )
}

export default App
