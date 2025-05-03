import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import { AuthProvider } from '@/context/AuthContext'
import { ItemDataProvider } from '@/context/ItemDataContext'
import { MonsterDataProvider } from '@/context/TargetDataContext'
import { LoadoutProvider } from './context/LoadoutContext'
import { HiscoresProvider } from './context/HiscoresContext'
import { StancesProvider } from './context/StanceContext'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element') // Type guard

rootElement.style.height = '100%'
document.body.style.height = '100vh'
document.body.style.margin = '0'
document.body.style.overflow = 'hidden'

const root = ReactDOM.createRoot(rootElement)
root.render(
  <React.StrictMode>
    <AuthProvider>
      <HiscoresProvider>
        <ItemDataProvider>
          <MonsterDataProvider>
            <LoadoutProvider>
              <StancesProvider>
                <App />
              </StancesProvider>
            </LoadoutProvider>
          </MonsterDataProvider>
        </ItemDataProvider>
      </HiscoresProvider>
    </AuthProvider>
  </React.StrictMode>
)
