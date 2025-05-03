import React, { createContext, useState, useEffect, useContext, useMemo } from 'react'
import { database } from '@/utils/firebaseConfig'
import { ref, get, update } from 'firebase/database'
import { AuthContext } from '@/context/AuthContext'

interface StanceContextProps {
  stances: Record<string, number[]>
  setStances: React.Dispatch<React.SetStateAction<Record<string, number[]>>>
}

const StanceContext = createContext<StanceContextProps | undefined>(undefined)

export const StancesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allStances, setAllStances] = useState<Record<string, number[]>>({})
  const { user, loading } = useContext(AuthContext)

  useEffect(() => {
    const loadStancesFromFirebase = async () => {
      if (user && !loading) {
        const stancesRef = ref(database, `players/${user.uid}/loadouts/default/stances`)
        try {
          const snapshot = await get(stancesRef)
          if (snapshot.exists()) {
            // Ensure that the loaded data is an array for each combat style
            const loadedStances = snapshot.val() as Record<string, any>
            const validStances: Record<string, number[]> = {}
            for (const key in loadedStances) {
              if (Array.isArray(loadedStances[key])) {
                validStances[key] = loadedStances[key].map(Number).filter(Number.isInteger)
              } else {
                validStances[key] = []
              }
            }
            setAllStances(validStances)
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
          await update(stancesRef, allStances)
        } catch (error) {
          console.error('Error saving stances:', error)
        }
      }
    }
    saveStancesToFirebase()
  }, [allStances])

  const contextValue: StanceContextProps = useMemo(() => {
    return {
      stances: allStances,
      setStances: setAllStances,
    }
}, [allStances, setAllStances])

  return <StanceContext.Provider value={contextValue}>{children}</StanceContext.Provider>
}

export const useStances = () => {
  const context = useContext(StanceContext)
  if (!context) {
    throw new Error('useStances must be used within a StancesProvider')
  }
  return context
}