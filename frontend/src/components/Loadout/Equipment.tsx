import React, { useState, MouseEvent } from 'react'
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
  name: '',
  stats: {
    id: -1,
    slot: undefined,
  },
} as unknown as Equipment

type SelectedItems = Record<EquipmentSlot, Equipment>

interface EquipmentButtonProps {
  itemId: number | undefined
  label: string
  large?: boolean
  onClick: (event: any, label: string) => void
}

const EquipmentButton: React.FC<EquipmentButtonProps> = ({
  itemId,
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
            src={
              'https://raw.githubusercontent.com/osrsbox/osrsbox-db/refs/heads/master/docs/items-icons/' +
              itemId +
              '.png'
            }
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
  const items = useItemData()

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
      items.allItems.filter(item => {
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
    setSlotFilter(items.allItems)
    setSelectedItem(null)
  }

  const handleSelect = (_event: any, value: Equipment | null) => {
    setSelectedItems(prevSelectedItems => ({
      ...prevSelectedItems,
      [activeSlot as EquipmentSlot]: value || defaultItem,
    }))
    setSelectedItem(null)
    setSlotFilter(items.allItems)
    setOpen(false)
  }

  return (
    <Container>
      <Grid container justifyContent={'center'}>
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
              itemId={selectedItems.head.stats?.id}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Body'
              itemId={selectedItems.body.stats?.id}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Legs'
              itemId={selectedItems.legs.stats?.id}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Feet'
              itemId={selectedItems.feet.stats?.id}
              onClick={handleButtonClick}
            />
          </Stack>
          <Stack spacing={2} justifyContent={'center'}>
            <EquipmentButton
              large
              label='Weapon'
              itemId={selectedItems.weapon.stats?.id}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Spec Wep'
              itemId={selectedItems['spec wep'].stats?.id}
              onClick={handleButtonClick}
            />
          </Stack>
          <Stack spacing={2} justifyContent={'center'}>
            <EquipmentButton
              large
              label='Shield'
              itemId={selectedItems.shield.stats?.id}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Ammo'
              itemId={selectedItems.ammo.stats?.id}
              onClick={handleButtonClick}
            />
          </Stack>
          <Stack spacing={2}>
            <EquipmentButton
              label='Cape'
              itemId={selectedItems.cape.stats?.id}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Hands'
              itemId={selectedItems.hands.stats?.id}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Neck'
              itemId={selectedItems.neck.stats?.id}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Ring'
              itemId={selectedItems.ring.stats?.id}
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
            option.name + ' (id:' + option.stats?.id.toString() + ')'
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
