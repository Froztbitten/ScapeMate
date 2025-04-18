import React, {
  useState,
  MouseEvent,
  useEffect,
  useContext,
} from 'react'
import {
  Box,
  Button,
  Grid,
  Container,
  Tooltip,
  Popover,
  TextField,
  Stack,
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useItemData } from '@/context/ItemDataContext'
import type { Equipment } from '@/utils/types'
import { AuthContext } from '@/context/AuthContext' // Import the AuthContext
import { ref, update, get } from 'firebase/database' // Import Firebase functions
import { database } from '@/utils/firebaseConfig' // Import Firebase config

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

const defaultItem: Equipment = {
  id: -1,
  name: '',
  imageUrl: '',
  stats: {
    slot: '',
  },
} as unknown as Equipment

type SelectedItems = Record<EquipmentSlot, Equipment>

interface EquipmentButtonProps {
  itemId: number | undefined
  imageUrl: string
  label: string
  large?: boolean
  onClick: (event: any, label: string) => void
}

const EquipmentButton: React.FC<EquipmentButtonProps> = ({
  itemId,
  imageUrl,
  label,
  onClick,
  large,
}) => {
  return (
    <Tooltip title={label}>
      <Button
        variant='outlined'
        onClick={() => onClick && onClick(event, label)}
        sx={{
          width: '64px',
          height: large ? '128px' : '64px',
          position: 'relative',
          '& .MuiButton-label': {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}>
        {itemId !== -1 && itemId && (
          <Box
            component='img'
            src={imageUrl}
            sx={{
              width: 50,
              height: 50,
              display: 'block',
            }}
          />
        )}
        {itemId === -1 || !itemId ? label : ''}
      </Button>
    </Tooltip>
  )
}

const Equipment: React.FC = () => {
  const items = useItemData()
  const [open, setOpen] = useState(false)
  const [slotFilter, setSlotFilter] = useState<Equipment[]>([])
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({
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
  })
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
      const loadoutRef = ref(database, `players/${user.uid}/loadout`) // Use userId as key
      await update(loadoutRef, loadout)
      console.log(`Loadout saved to Firebase for user ${user.uid}.`)
    } catch (err) {
      console.error('Error saving loadout to Firebase:', err)
    }
  }

  const loadLoadoutToFirebase = async (loadout: SelectedItems) => {
    if (!user) {
      console.warn('User not logged in. Cannot save loadout.')
      return
    }
    try {
      const loadoutRef = ref(database, `players/${user.uid}/loadout`) // Use userId as key
      const snapshot = await get(loadoutRef)
      if (snapshot.exists()) {
        const selectedItems = snapshot.val()
        setSelectedItems(selectedItems)
      } else {
        console.log('No player name found for this user.')
      }
    } catch (err) {
      console.error('Error saving loadout to Firebase:', err)
    }
  }

  const handleClearLoadout = () => {
    setSelectedItems({
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
    })

    // Save the cleared loadout to Firebase
    saveLoadoutToFirebase({
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
    })
  }

  const handleButtonClick = (event: MouseEvent, label: string) => {
    setDialogPosition({ x: event.clientX, y: event.clientY })
    setOpen(true)
    const lowerCaseLabel = label.toLowerCase()
    setActiveSlot(lowerCaseLabel as EquipmentSlot)
    setSelectedItem(
      selectedItems[lowerCaseLabel as EquipmentSlot] !== defaultItem
        ? selectedItems[lowerCaseLabel as EquipmentSlot]
        : null
    )
    setSlotFilter(
      Object.values(items.allItems).filter(item => {
        let labels = [lowerCaseLabel]
        if (lowerCaseLabel === 'weapon') {
          labels.push('2h')
        } else if (lowerCaseLabel === 'spec wep') {
          labels.push('weapon')
          labels.push('2h')
        }
        return item.stats?.slot ? labels.includes(item.stats.slot) : false
      })
    )
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

    // Save the updated loadout to Firebase
    saveLoadoutToFirebase(newSelectedItems)
  }

  useEffect(() => {
    if (!loading && user) {
      loadLoadoutToFirebase(selectedItems)
    }
  }, [user, loading])

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
              itemId={selectedItems.head.id}
              imageUrl={selectedItems.head.image_url}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Body'
              itemId={selectedItems.body.id}
              imageUrl={selectedItems.body.image_url}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Legs'
              itemId={selectedItems.legs.id}
              imageUrl={selectedItems.legs.image_url}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Feet'
              itemId={selectedItems.feet.id}
              imageUrl={selectedItems.feet.image_url}
              onClick={handleButtonClick}
            />
          </Stack>
          <Stack spacing={2} justifyContent={'center'}>
            <EquipmentButton
              large
              label='Weapon'
              itemId={selectedItems.weapon.id}
              imageUrl={selectedItems.weapon.image_url}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Spec Wep'
              itemId={selectedItems['spec wep'].id}
              imageUrl={selectedItems['spec wep'].image_url}
              onClick={handleButtonClick}
            />
          </Stack>
          <Stack spacing={2} justifyContent={'center'}>
            <EquipmentButton
              large
              label='Shield'
              itemId={selectedItems.shield.id}
              imageUrl={selectedItems.shield.image_url}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Ammo'
              itemId={selectedItems.ammo.id}
              imageUrl={selectedItems.ammo.image_url}
              onClick={handleButtonClick}
            />
          </Stack>
          <Stack spacing={2}>
            <EquipmentButton
              label='Cape'
              itemId={selectedItems.cape.id}
              imageUrl={selectedItems.cape.image_url}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Hands'
              itemId={selectedItems.hands.id}
              imageUrl={selectedItems.hands.image_url}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Neck'
              itemId={selectedItems.neck.id}
              imageUrl={selectedItems.neck.image_url}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Ring'
              itemId={selectedItems.ring.id}
              imageUrl={selectedItems.ring.image_url}
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
          value={selectedItem}
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
