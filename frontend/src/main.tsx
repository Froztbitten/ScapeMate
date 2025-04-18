import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import { ItemDataProvider } from '@/context/ItemDataContext'
import { AuthProvider } from './context/AuthContext'

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
      <ItemDataProvider>
        <App />
      </ItemDataProvider>
    </AuthProvider>
  </React.StrictMode>
)
