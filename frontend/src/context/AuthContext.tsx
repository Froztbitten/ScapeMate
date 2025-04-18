// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/utils/firebaseConfig' // Adjust path if needed

// 1. Define the Context Shape
interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// 2. Create the Context with the correct type
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

// 3. Create a Custom Hook for easy consumption
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 4. Define Props for the Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

// 5. Create the Provider Component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true) // Loading state to check auth status

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // This callback fires immediately with the current auth state
      // and whenever the auth state changes (login, logout)
      setUser(user) // user will be null if not logged in, or a User object if logged in
      setLoading(false) // Auth state has been determined
      console.log(
        'Auth state changed:',
        user ? `User logged in (${user.uid})` : 'User logged out'
      )
    })

    // Cleanup subscription on unmount
    return () => {
      console.log('Unsubscribing from auth state changes')
      unsubscribe()
    }
  }, []) // Empty dependency array means this effect runs once on mount

  // The value provided to consuming components
  const value = useMemo(
    () => ({
      user,
      loading,
      // You could add login/logout functions here if preferred,
      // though often they are called directly from components using the 'auth' export
      // e.g., login: (email, password) => signInWithEmailAndPassword(auth, email, password),
      //       logout: () => signOut(auth),
    }),
    [user, loading]
  )

  // Render the provider with the value and children
  // Don't render children until the loading state is false to prevent UI flashes
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
