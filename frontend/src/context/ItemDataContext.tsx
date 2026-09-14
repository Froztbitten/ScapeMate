// src/context/ItemDataContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
  ReactNode, // Import ReactNode for children type
} from 'react'
import type { ItemDataContextState, Equipment } from '@/utils/types' // Import types

// Define a default state matching the ItemDataContextState interface
const defaultContextState: ItemDataContextState = {
  allItems: {},
  resolveItemById: () => undefined,
  isLoading: true,
  error: null,
}

// 1. Create the context with the specific type and default state
const ItemDataContext = createContext<ItemDataContextState>(defaultContextState)

// Define props for the provider, including children
interface ItemDataProviderProps {
  children: ReactNode
}

// 2. Create a Provider Component with typed props
export const ItemDataProvider: React.FC<ItemDataProviderProps> = ({
  children,
}) => {
  // Use generics for useState
  const [allItems, setAllItems] = useState<Record<number, Equipment>>({})
  const [aliases, setAliases] = useState<Record<number, number>>({})
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  // 3. Fetch data when the provider mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [itemsResponse, aliasesResponse] = await Promise.all([
          fetch('/weapons_armor_with_stats.json'),
          fetch('/equipment_aliases.json'),
        ])
        if (!itemsResponse.ok || !aliasesResponse.ok) {
          throw new Error(
            `Item data request failed: items ${itemsResponse.status}, aliases ${aliasesResponse.status}`
          )
        }
        const data = (await itemsResponse.json()) as Record<number, Equipment>
        const aliasData = (await aliasesResponse.json()) as Record<
          number,
          number
        >
        setAllItems(data || {})
        setAliases(aliasData || {})
      } catch (e: unknown) {
        // Catch error as 'unknown'
        console.error('Failed to fetch item data:', e)
        // Type check the error before setting state
        if (e instanceof Error) {
          setError(e)
        } else {
          setError(new Error('An unknown error occurred during fetch.'))
        }
        setAllItems({})
        setAliases({})
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, []) // Empty dependency array remains the same

  const resolveItemById = useCallback(
    (itemId: number): Equipment | undefined => {
      const canonicalId = aliases[itemId]
      return allItems[itemId] ?? allItems[canonicalId]
    },
    [aliases, allItems]
  )

  // 4. Memoize the context value. Types are inferred correctly now.
  const value = useMemo(
    () => ({
      allItems,
      resolveItemById,
      isLoading,
      error,
    }),
    [allItems, resolveItemById, isLoading, error]
  )

  return (
    <ItemDataContext.Provider value={value}>
      {children}
    </ItemDataContext.Provider>
  )
}

// 5. Create a custom hook for easy access - no change needed here other than context typing
export const useItemData = (): ItemDataContextState => {
  const context = useContext(ItemDataContext)
  if (context === undefined) {
    throw new Error('useItemData must be used within an ItemDataProvider')
  }
  // The hook now correctly returns the ItemDataContextState type
  return context
}
