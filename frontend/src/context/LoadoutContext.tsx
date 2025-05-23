import React, { createContext, useState, useContext, useEffect, useMemo } from 'react'
import { AuthContext } from '@/context/AuthContext'
import { ref, update, get } from 'firebase/database'
import { Equipment } from '@/utils/types'
import { database } from '@/utils/firebaseConfig'
import { useItemData } from '@/context/ItemDataContext'

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
} as Equipment

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
  getCurrentWeapon: (combatStyle: string) => Equipment
  saveCombatStyleToFirebase: (combatStyle: number) => Promise<void>
  loadCombatStyleFromFirebase: () => Promise<number | null>
}

const LoadoutContext = createContext<LoadoutContextState | undefined>(undefined)

export const LoadoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const loadoutRef = useMemo(() => {
    if (user) {
      return ref(database, `players/${user.uid}/loadouts/default`)
    }
    return null
  }, [user])

  const saveLoadoutToFirebase = async (loadout: SelectedItems, combatStyle: string) => {
    if (!user || !loadoutRef) {
      console.warn('User not logged in. Cannot save loadout.')
      return
    }

    const transformedLoadout = Object.entries(loadout).reduce(
      (acc: Record<EquipmentSlot, number | null>, [slot, item]) => {
        acc[slot as EquipmentSlot] = item.id !== -1 ? item.id : null
        return acc
      },
      {} as Record<EquipmentSlot, number | null>
    )
    try {
      await update(
        ref(database, `players/${user.uid}/loadouts/default/${combatStyle.toLowerCase()}`),
        transformedLoadout
      )
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

  const saveCombatStyleToFirebase = async (combatStyle: number) => {
    if (!user || !loadoutRef) {
      console.warn('User not logged in. Cannot save combat style.')
      return
    }

    try {
      await update(loadoutRef, { currentCombatStyle: combatStyle })
    } catch (err) {
      console.error('Error saving combat style to firebase:', err)
    }
  }

  const loadCombatStyleFromFirebase = async (): Promise<number | null> => {
    if (!user || !loadoutRef) {
      console.warn('User not logged in. Cannot load combat style.')
      return null
    }

    try {
      const snapshot = await get(loadoutRef)
      if (snapshot.exists()) {
        const data = snapshot.val()
        return data.currentCombatStyle ?? null
      }
      return null
    } catch (error) {
      console.error('Error loading combat style from Firebase:', error)
      return null
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
      getCurrentWeapon,
      saveCombatStyleToFirebase,
      loadCombatStyleFromFirebase,
    }
  }, [
    selectedItems,
    setSelectedItems,
    saveLoadoutToFirebase,
    loadLoadoutFromFirebase,
    resetLoadout,
    getCurrentWeapon,
    saveCombatStyleToFirebase,
    loadCombatStyleFromFirebase,
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
