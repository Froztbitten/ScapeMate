import React, { createContext, useState, useEffect, useContext, useMemo } from 'react'
import { database } from '@/utils/firebaseConfig'
import { ref, get, update } from 'firebase/database'
import { AuthContext } from '@/context/AuthContext'

interface StanceContextProps {
  stances: Record<string, number>
  setStances: React.Dispatch<React.SetStateAction<Record<string, number>>>
}

const StanceContext = createContext<StanceContextProps | undefined>(undefined)

export const StancesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stances, setStances] = useState<Record<string, number>>({})

  const { user, loading } = useContext(AuthContext)

  useEffect(() => {
    const loadStancesFromFirebase = async () => {
      if (user && !loading) {
        const stancesRef = ref(database, `players/${user.uid}/loadouts/default/stances`)
        try {
          const snapshot = await get(stancesRef)
          if (snapshot.exists()) {
            setStances(snapshot.val())
          }
        } catch (error) {
          console.error('Error loading stances:', error)
        }
      }
    }
    loadStancesFromFirebase()
  }, [user, loading])

  useEffect(() => {
    const saveStancesToFirebase = async () => {
      if (user) {
        const stancesRef = ref(database, `players/${user.uid}/loadouts/default/stances`)
        try {
          await update(stancesRef, stances)
        } catch (error) {
          console.error('Error saving stances:', error)
        }
      }
    }
    saveStancesToFirebase()
  }, [stances])

  const contextValue: StanceContextProps = useMemo(() => {
    return {
      stances,
      setStances,
    }
  }, [stances, setStances])

  return <StanceContext.Provider value={contextValue}>{children}</StanceContext.Provider>
}

export const useStances = () => {
  const context = useContext(StanceContext)
  if (!context) {
    throw new Error('useStances must be used within a StancesProvider')
  }
  return context
}
