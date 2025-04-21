import React, {
  useState,
  MouseEvent,
  useEffect,
  useContext,
  useMemo,
} from 'react'
import {
  Box,
  Button,
  Grid,
  Container,
  Popover,
  TextField,
  Stack,
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useItemData } from '@/context/ItemDataContext'
import type { Equipment } from '@/utils/types'
import { AuthContext } from '@/context/AuthContext'
import { ref, update, get } from 'firebase/database'
import { database } from '@/utils/firebaseConfig'
import EquipmentButton from './EquipmentButton' // Import the component

type EquipmentSlot =
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

interface ItemsData {
  [key: string]: Equipment
}

const defaultItem: Equipment = {
  id: -1,
  name: '',
  imageUrl: '',
  stats: {
    slot: '',
  },
} as unknown as Equipment

const initialEquipmentState = {
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

type SelectedItems = Record<EquipmentSlot, Equipment>

interface EquipmentProps {
  combatStyle: string
  initialSelectedItems?: SelectedItems
}

const filterItemsBySlot = (slot: string, allItems: ItemsData): Equipment[] => {
  let labels = [slot]
  if (slot === 'weapon') {
    labels.push('2h')
  } else if (slot === 'spec wep') {
    labels.push('weapon')
    labels.push('2h')
  }
  return Object.values(allItems).filter(item => {
    return item.stats?.slot ? labels.includes(item.stats.slot) : false
  })
}

const Equipment: React.FC<EquipmentProps> = ({
  combatStyle,
  initialSelectedItems,
}) => {
  const items = useItemData()
  const [open, setOpen] = useState(false)
  const [slotFilter, setSlotFilter] = useState<Equipment[]>([])
  const [selectedItems, setSelectedItems] = useState<SelectedItems>(
    initialSelectedItems || initialEquipmentState
  )
  const [activeSlot, setActiveSlot] = useState<EquipmentSlot | null>()
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null)
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 })

  const { user, loading } = useContext(AuthContext)

  const saveLoadoutToFirebase = async (loadout: SelectedItems) => {
    if (!user) {
      console.warn('User not logged in. Cannot save loadout.')
      return
    }

    try {
      const transformedLoadout = Object.entries(loadout).reduce(
        (acc: Record<EquipmentSlot, number | null>, [slot, item]) => {
          acc[slot as EquipmentSlot] = item.id != -1 ? item.id : null
          return acc
        },
        {} as Record<EquipmentSlot, number | null>
      )

      const loadoutRef = ref(
        database,
        `players/${user.uid}/loadouts/default/${combatStyle}`
      )
      await update(loadoutRef, transformedLoadout)
      console.log(`Loadout saved to Firebase for user ${user.uid}.`)
    } catch (err) {
      console.error('Error saving loadout to Firebase:', err)
    }
  }

  const loadLoadoutFromFirebase = async () => {
    if (!user) {
      console.warn('User not logged in. Cannot save loadout.')
      return
    }

    try {
      const loadoutRef = ref(
        database,
        `players/${user.uid}/loadouts/default/${combatStyle}`
      )
      const snapshot = await get(loadoutRef)

      if (snapshot.exists()) {
        const loadedLoadout = snapshot.val()
        const newSelectedItems: SelectedItems = { ...initialEquipmentState }

        for (const slot in initialEquipmentState) {
          if (loadedLoadout.hasOwnProperty(slot)) {
            const itemId = loadedLoadout[slot]

            if (itemId && items.allItems[itemId]) {
              newSelectedItems[slot as EquipmentSlot] = items.allItems[itemId]
            } else {
              newSelectedItems[slot as EquipmentSlot] = defaultItem
            }
          }
        }

        setSelectedItems(newSelectedItems)
      } else {
        console.log('No player name found for this user.')
      }
    } catch (err) {
      console.error('Error saving loadout to Firebase:', err)
    }
  }

  const resetLoadout = useMemo(() => initialEquipmentState, [])

  const handleClearLoadout = () => {
    setSelectedItems(resetLoadout)
    saveLoadoutToFirebase(resetLoadout)
  }

  const handleButtonClick = (event: MouseEvent, label: string) => {
    const lowerCaseLabel = label.toLowerCase() as EquipmentSlot
    setActiveSlot(lowerCaseLabel)
    setSelectedItem(
      selectedItems[lowerCaseLabel] !== defaultItem
        ? selectedItems[lowerCaseLabel]
        : null
    )
    setSlotFilter(filterItemsBySlot(lowerCaseLabel, items.allItems))
    setDialogPosition({ x: event.clientX, y: event.clientY })
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setSlotFilter(Object.values(items.allItems))
    setSelectedItem(null)
  }

  const handleSelect = (_event: any, value: Equipment | null) => {
    const newSelectedItems = {
      ...selectedItems,
      [activeSlot as EquipmentSlot]: value || defaultItem,
    }
    setSelectedItems(newSelectedItems)
    setSelectedItem(null)
    setSlotFilter(Object.values(items.allItems))
    setOpen(false)

    saveLoadoutToFirebase(newSelectedItems)
  }

  useEffect(() => {
    if (!loading && items && user) {
      loadLoadoutFromFirebase()
    }
  }, [user, items, loading])

  return (
    <Container>
      <Grid container justifyContent={'center'} spacing={3}>
        <Grid size={3}>
          <Button variant='contained'>Load</Button>
        </Grid>
        <Grid size={3}>
          <Button variant='contained'>Opti</Button>
        </Grid>
        <Grid size={3}>
          <Button variant='contained'>Save</Button>
        </Grid>
        <Grid size={3}>
          <Button variant='contained' onClick={handleClearLoadout}>
            Clear
          </Button>
        </Grid>
      </Grid>
      <Box sx={{ maxWidth: '350px', paddingY: '20px' }}>
        <Grid container spacing={2} justifyContent={'center'}>
          <Stack spacing={2}>
            <EquipmentButton
              label='Head'
              selectedItem={selectedItems.head}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Body'
              selectedItem={selectedItems.body}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Legs'
              selectedItem={selectedItems.legs}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Feet'
              selectedItem={selectedItems.feet}
              onClick={handleButtonClick}
            />
          </Stack>
          <Stack spacing={2} justifyContent={'center'}>
            <EquipmentButton
              large
              label='Weapon'
              selectedItem={selectedItems.weapon}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Spec Wep'
              selectedItem={selectedItems['spec wep']}
              onClick={handleButtonClick}
            />
          </Stack>
          <Stack spacing={2} justifyContent={'center'}>
            <EquipmentButton
              large
              label='Shield'
              selectedItem={selectedItems.shield}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Ammo'
              selectedItem={selectedItems.ammo}
              onClick={handleButtonClick}
            />
          </Stack>
          <Stack spacing={2}>
            <EquipmentButton
              label='Cape'
              selectedItem={selectedItems.cape}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Hands'
              selectedItem={selectedItems.hands}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Neck'
              selectedItem={selectedItems.neck}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Ring'
              selectedItem={selectedItems.ring}
              onClick={handleButtonClick}
            />
          </Stack>
        </Grid>
      </Box>
      <Popover
        open={open}
        onClose={handleClose}
        sx={{
          top: dialogPosition.y,
          left: dialogPosition.x,
        }}>
        <Autocomplete
          autoHighlight
          id='item-combobox'
          options={slotFilter}
          onChange={handleSelect}
          sx={{
            width: 300,
          }}
          value={selectedItem?.id != -1 ? selectedItem : null}
          getOptionLabel={(option: Equipment) =>
            option.name + ' (id:' + option.id.toString() + ')'
          }
          renderInput={params => (
            <TextField {...params} placeholder='Start typing' />
          )}
        />
      </Popover>
      {<p>Selected Head Item: {selectedItems['spec wep'].name}</p>}
    </Container>
  )
}

export default Equipment
