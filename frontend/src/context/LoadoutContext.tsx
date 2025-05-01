// src/context/LoadoutContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useMemo } from 'react'
import { Equipment } from '@/utils/types'
import { AuthContext } from '@/context/AuthContext'
import { ref, update, get } from 'firebase/database'
import { database } from '@/utils/firebaseConfig'
import { useItemData } from './ItemDataContext'

export type EquipmentSlot =
  | 'head'
  | 'body'
  | 'legs'
  | 'feet'
  | 'weapon'
  | 'spec wep'
  | 'shield'
  | 'ammo'
  | 'cape'
  | 'hands'
  | 'neck'
  | 'ring'

export const defaultItem: Equipment = {
  id: -1,
  name: '',
  image_url: '',
  stats: {
    slot: '',
  },
} as unknown as Equipment

export const initialEquipmentState = {
  head: defaultItem,
  body: defaultItem,
  legs: defaultItem,
  feet: defaultItem,
  weapon: defaultItem,
  'spec wep': defaultItem,
  shield: defaultItem,
  ammo: defaultItem,
  cape: defaultItem,
  hands: defaultItem,
  neck: defaultItem,
  ring: defaultItem,
}

export type SelectedItems = Record<EquipmentSlot, Equipment>

interface LoadoutContextState {
  selectedItems: {
    melee: SelectedItems
    ranged: SelectedItems
    magic: SelectedItems
  }
  setSelectedItems: React.Dispatch<
    React.SetStateAction<{
      melee: SelectedItems
      ranged: SelectedItems
      magic: SelectedItems
    }>
  >
  saveLoadoutToFirebase: (loadout: SelectedItems, combatStyle: string) => Promise<void>
  loadLoadoutFromFirebase: () => Promise<void>
  resetLoadout: (combatStyle: string) => void
  // Added function to get currently equipped weapon
  getCurrentWeapon: (combatStyle: string) => Equipment
}

const LoadoutContext = createContext<LoadoutContextState | undefined>(undefined)

interface LoadoutProviderProps {
  children: ReactNode
}

export const LoadoutProvider: React.FC<LoadoutProviderProps> = ({ children }) => {
  const [selectedItems, setSelectedItems] = useState<{
    melee: SelectedItems
    ranged: SelectedItems
    magic: SelectedItems
  }>({
    melee: { ...initialEquipmentState },
    ranged: { ...initialEquipmentState },
    magic: { ...initialEquipmentState },
  })

  const { user, loading } = useContext(AuthContext)
  const { allItems, isLoading: itemDataLoading } = useItemData()

  const saveLoadoutToFirebase = async (loadout: SelectedItems, combatStyle: string) => {
    if (!user) {
      console.warn('User not logged in. Cannot save loadout.')
      return
    }

    try {
      const transformedLoadout = Object.entries(loadout).reduce(
        (acc: Record<EquipmentSlot, number | null>, [slot, item]) => {
          acc[slot as EquipmentSlot] = item.id !== -1 ? item.id : null
          return acc
        },
        {} as Record<EquipmentSlot, number | null>
      )

      const loadoutRef = ref(
        database,
        `players/${user.uid}/loadouts/default/${combatStyle.toLowerCase()}`
      )
      await update(loadoutRef, transformedLoadout)
      console.log(`Loadout saved to Firebase for user ${user.uid}.`)
    } catch (err) {
      console.error('Error saving loadout to Firebase:', err)
    }
  }

  const loadLoadoutFromFirebase = async () => {
    if (!user) {
      console.warn('User not logged in. Cannot load loadout.')
      return
    }

    try {
      const loadoutRef = ref(database, `players/${user.uid}/loadouts/default`)
      const snapshot = await get(loadoutRef)
      if (snapshot.exists() && allItems) {
        const loadedLoadout = snapshot.val()
        const newSelectedItems = { ...selectedItems }

        for (const combatStyle in loadedLoadout) {
          if (combatStyle == 'melee' || combatStyle == 'ranged' || combatStyle == 'magic') {
            const newCombatStyleLoadout: SelectedItems = {
              ...initialEquipmentState,
            }

            for (const slot in initialEquipmentState) {
              if (loadedLoadout[combatStyle].hasOwnProperty(slot)) {
                const itemId = loadedLoadout[combatStyle][slot]
                if (itemId && allItems[itemId]) {
                  const item = allItems[itemId]
                  newCombatStyleLoadout[slot as EquipmentSlot] = item
                } else {
                  newCombatStyleLoadout[slot as EquipmentSlot] = defaultItem
                }
              }
            }

            newSelectedItems[combatStyle] = newCombatStyleLoadout
            setSelectedItems(newSelectedItems)
          }
        }
      } else {
        console.log('No player name found for this user.')
      }
    } catch (err) {
      console.error('Error saving loadout to Firebase:', err)
    }
  }

  const resetLoadout = (combatStyle: string) => {
    setSelectedItems({
      melee:
        combatStyle.toLowerCase() === 'melee'
          ? { ...initialEquipmentState }
          : { ...selectedItems.melee },
      ranged:
        combatStyle.toLowerCase() === 'ranged'
          ? { ...initialEquipmentState }
          : { ...selectedItems.ranged },
      magic:
        combatStyle.toLowerCase() === 'magic'
          ? { ...initialEquipmentState }
          : { ...selectedItems.magic },
    })
  }

  // Implementation of getCurrentWeapon
  const getCurrentWeapon = (combatStyle: string): Equipment => {
    const combatStyleItems = selectedItems[combatStyle.toLowerCase() as keyof typeof selectedItems]
    if (!combatStyleItems) {
      return defaultItem
    }
    return combatStyleItems.weapon
  }

  useEffect(() => {
    if (!loading && user && !itemDataLoading) {
      loadLoadoutFromFirebase()
    }
  }, [user, loading, itemDataLoading, allItems])

  const contextValue: LoadoutContextState = useMemo(() => {
    return {
      selectedItems,
      setSelectedItems,
      saveLoadoutToFirebase,
      loadLoadoutFromFirebase,
      resetLoadout,
      getCurrentWeapon, // Added to context value
    }
  }, [
    selectedItems,
    setSelectedItems,
    saveLoadoutToFirebase,
    loadLoadoutFromFirebase,
    resetLoadout,
    getCurrentWeapon, // Added to dependency array
  ])

  return <LoadoutContext.Provider value={contextValue}>{children}</LoadoutContext.Provider>
}

export const useLoadout = () => {
  const context = useContext(LoadoutContext)
  if (context === undefined) {
    throw new Error('useLoadout must be used within a LoadoutProvider')
  }
  return context
}
