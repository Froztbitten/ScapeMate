import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react'
import { AuthContext } from '@/context/AuthContext'
import { ref, update, get } from 'firebase/database'
import { database } from '@/utils/firebaseConfig'

interface Monster {
  name: string
  variants: { [key: string]: { [key: string]: any } }
  selectedVariant: string | null
}

interface MonsterContextType {
  selectedMonsters: Monster[]
  setSelectedMonsters: React.Dispatch<React.SetStateAction<Monster[]>>
  allMonsters: Monster[]
  setAllMonsters: React.Dispatch<React.SetStateAction<Monster[]>>
  loadMonsterFromRTDB: () => Promise<void>
  saveMonsterToRTDB: (selectedMonster: Monster | null) => Promise<void>
}

const MonsterContext = createContext<MonsterContextType>({
  selectedMonsters: [],
  setSelectedMonsters: () => [],
  allMonsters: [],
  setAllMonsters: () => [],
  loadMonsterFromRTDB: async () => {},
  saveMonsterToRTDB: async () => {},
})

interface MonsterProviderProps {
  children: ReactNode
}

const MonsterDataProvider: React.FC<MonsterProviderProps> = ({ children }) => {
  const [selectedMonsters, setSelectedMonsters] = useState<Monster[]>([])
  const [allMonsters, setAllMonsters] = useState<Monster[]>([])
  const [monstersLoading, setMonstersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, loading } = useContext(AuthContext)

  const loadMonsterFromRTDB = async () => {
    if (!user || loading || !allMonsters.length) return
    try {
      const monsterRef = ref(database, `players/${user.uid}/loadouts/default/monsters`)
      const snapshot = await get(monsterRef)
      if (snapshot.exists()) {
        const monsterId = snapshot.val()[0]
        const foundMonster = allMonsters.find(m => {
          for (const variant in m.variants) {
            return m.variants[variant].NPC_ID === monsterId
          }
        })
        if (foundMonster) {
          const variant = Object.keys(foundMonster.variants).find(
            key => foundMonster.variants[key].NPC_ID === monsterId
          )
          if (variant) {
            const selectedMonster = {
              ...foundMonster,
              selectedVariant: variant,
            }
            setSelectedMonsters([selectedMonster])
          }
        }
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const saveMonsterToRTDB = async (selectedMonster: Monster | null) => {
    if (!selectedMonster) return
    setSelectedMonsters([selectedMonster])

    if (!user) {
      console.warn('User not authenticated, cannot save monster.')
      return
    }

    try {
      const monsterRef = ref(database, `players/${user.uid}/loadouts/default`)
      const monstersIds = []
      const monsterIdToSave = selectedMonster.selectedVariant
        ? selectedMonster.variants[selectedMonster.selectedVariant].NPC_ID
        : selectedMonster.variants['No variant'].NPC_ID

      monstersIds.push(monsterIdToSave)

      await update(monsterRef, { monsters: monstersIds })
    } catch (err: any) {
      console.log(err)
    }
  }

  const fetchMonsterData = async () => {
    setMonstersLoading(true)
    try {
      const response = await fetch('/monsters_bosses.json')
      if (!response.ok) {
        throw new Error(`Failed to fetch monster data: ${response.status}`)
      }
      const data = await response.json()
      setAllMonsters(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setMonstersLoading(false)
    }
  }

  useEffect(() => {
    fetchMonsterData()
  }, [])

  useEffect(() => {
    if (!loading && user && allMonsters.length > 0) {
      loadMonsterFromRTDB()
    }
  }, [user, loading, allMonsters])

  const value: MonsterContextType = useMemo(() => {
    return {
      selectedMonsters,
      setSelectedMonsters,
      allMonsters,
      setAllMonsters,
      loadMonsterFromRTDB,
      saveMonsterToRTDB,
    }
  }, [selectedMonsters, setSelectedMonsters, allMonsters, saveMonsterToRTDB])

  if (monstersLoading) {
    return <div>Loading monster data...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return <MonsterContext.Provider value={value}>{children}</MonsterContext.Provider>
}

const useMonsterData = (): MonsterContextType => {
  const context = useContext(MonsterContext)
  if (!context) {
    throw new Error('useMonsterData must be used within a MonsterProvider')
  }
  return context
}

export { MonsterContext, MonsterDataProvider, useMonsterData }
