// MonsterDataContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react'

interface Monster {
  name: string
  variants: { [key: string]: { [key: string]: any } }
  // Define other monster properties as needed based on your JSON structure
}

interface MonsterContextType {
  monsters: Monster[]
  setMonsters: React.Dispatch<React.SetStateAction<Monster[]>>
}

// Create the context with a default value (can be null or an empty array)
const MonsterContext = createContext<MonsterContextType>({
  monsters: [],
  setMonsters: () => {},
})

interface MonsterProviderProps {
  children: ReactNode
}

// Create the provider component
const MonsterDataProvider: React.FC<MonsterProviderProps> = ({ children }) => {
  const [monsters, setMonsters] = useState<Monster[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMonsterData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/monsters_bosses.json') // Path to your JSON file
        if (!response.ok) {
          throw new Error(`Failed to fetch monster data: ${response.status}`)
        }
        const data = await response.json()
        setMonsters(data as Monster[]) // Set the monster data
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMonsterData()
  }, [])

  if (isLoading) {
    return <div>Loading monster data...</div> // Or a loading spinner
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <MonsterContext.Provider value={{ monsters, setMonsters }}>
      {children}
    </MonsterContext.Provider>
  )
}

// Custom hook to use the monster data
const useMonsterData = (): MonsterContextType => {
  const context = useContext(MonsterContext)
  if (!context) {
    throw new Error('useMonsterData must be used within a MonsterProvider')
  }
  return context
}

export { MonsterContext, MonsterDataProvider, useMonsterData }
