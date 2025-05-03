import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/utils/firebaseConfig' // Adjust path if needed

interface AuthContextType {
  user: User | null
  loading: boolean
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: Readonly<AuthProviderProps>) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUser(user)
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
