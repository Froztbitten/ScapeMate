import React, { createContext, useState, useEffect, useContext, useMemo } from 'react'
import { database } from '@/utils/firebaseConfig'
import { ref, get, update } from 'firebase/database'
import { AuthContext } from '@/context/AuthContext'

export interface Style {
  stance: string
  attack_type: string
  style: string | null
  experience: string[]
  boost: string | null
}

interface StanceContextProps {
  stances: Record<string, number[]> | null
  setStances: React.Dispatch<React.SetStateAction<Record<string, number[]> | null>>
  combatStyles: Promise<Record<string, { styles: Style[] }>> | null
}

const StanceContext = createContext<StanceContextProps | null>(null)

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

  const combatStyles: Promise<Record<string, { styles: Style[] }>> | null = useMemo(() => {
    const fetchCombatStyles = async () => {
      try {
        const response = await fetch('/combatStyles.json')
        if (!response.ok) {
          throw new Error(`Failed to fetch combat styles: ${response.status}`)
        }
        return await response.json()
      } catch (error) {
        console.error('Error fetching combat styles:', error)
        return null
      }
    }
    return fetchCombatStyles()
  }, [])

  const contextValue: StanceContextProps = useMemo(() => {
    return {
        stances: allStances,
        setStances: setAllStances as React.Dispatch<
          React.SetStateAction<Record<string, number[]> | null>
        >,
        combatStyles: combatStyles,
    }
  }, [allStances, setAllStances, combatStyles])

  return <StanceContext.Provider value={contextValue}>{children}</StanceContext.Provider>
}

export const useStances = () => {
  const context = useContext(StanceContext)
  if (!context) {
    throw new Error('useStances must be used within a StancesProvider')
  }
  return context
}
