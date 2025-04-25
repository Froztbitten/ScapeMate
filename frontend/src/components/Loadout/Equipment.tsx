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
  Divider,
  Popover,
  TextField,
  Stack,
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useItemData } from '@/context/ItemDataContext'
import type { Equipment } from '@/utils/types'
import EquipmentButton from './EquipmentButton'
import { useLoadout, SelectedItems, EquipmentSlot, initialEquipmentState, defaultItem } from '@/context/LoadoutContext';

interface ItemsData {
  [key: string]: Equipment
}

interface EquipmentProps {
  combatStyle: string
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
  combatStyle
}) => {
  const items = useItemData()
  const [open, setOpen] = useState(false)
  const [slotFilter, setSlotFilter] = useState<Equipment[]>([])
  const [activeSlot, setActiveSlot] = useState<EquipmentSlot | null>()
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null)
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 })

  const { selectedItems, setSelectedItems, saveLoadoutToFirebase, resetLoadout} = useLoadout();

  const combatStyleLower = combatStyle.toLowerCase() as keyof typeof selectedItems;

  const currentSelectedItems: SelectedItems = selectedItems[combatStyleLower] || initialEquipmentState;

  const handleClearLoadout = () => {
    resetLoadout();
  }

  const handleButtonClick = (event: MouseEvent, label: string) => {
    const lowerCaseLabel = label.toLowerCase() as EquipmentSlot
    setActiveSlot(lowerCaseLabel)
    setSelectedItem(
      currentSelectedItems[lowerCaseLabel] !== defaultItem
        ? currentSelectedItems[lowerCaseLabel]
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
    const newSelectedItems = { ...selectedItems }
    newSelectedItems[combatStyleLower][activeSlot as EquipmentSlot] = value || defaultItem
    setSelectedItems(newSelectedItems)
    setSelectedItem(null)
    setSlotFilter(Object.values(items.allItems))
    setOpen(false)

    saveLoadoutToFirebase(newSelectedItems[combatStyleLower], combatStyle)
  }

  return (
    <Container>
      <Grid container justifyContent={'center'} spacing={2} sx={{paddingBottom: '10px'}}>
        <Grid size={3}>
          <Button variant='contained' disabled>Load</Button>
        </Grid>
        <Grid size={3}>
          <Button variant='contained' disabled>Opti</Button>
        </Grid>
        <Grid size={3}>
          <Button variant='contained' disabled>Save</Button>
        </Grid>
        <Grid size={3}>
          <Button variant='contained' onClick={handleClearLoadout}>
            Clear
          </Button>
        </Grid>
        
        <Divider sx={{width: '100%'}}/>
      </Grid>
      <Box sx={{ maxWidth: '350px', paddingY: '20px' }}>
        <Grid container spacing={2} justifyContent={'center'}>
          <Stack spacing={2}>
            <EquipmentButton
              label='Head'
              selectedItem={currentSelectedItems.head}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Body'
              selectedItem={currentSelectedItems.body}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Legs'
              selectedItem={currentSelectedItems.legs}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Feet'
              selectedItem={currentSelectedItems.feet}
              onClick={handleButtonClick}
            />
          </Stack>
          <Stack spacing={2} justifyContent={'center'}>
            <EquipmentButton
              large
              label='Weapon'
              selectedItem={currentSelectedItems.weapon}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Spec Wep'
              selectedItem={currentSelectedItems['spec wep']}
              onClick={handleButtonClick}
            />
          </Stack>
          <Stack spacing={2} justifyContent={'center'}>
            <EquipmentButton
              large
              label='Shield'
              selectedItem={currentSelectedItems.shield}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Ammo'
              selectedItem={currentSelectedItems.ammo}
              onClick={handleButtonClick}
            />
          </Stack>
          <Stack spacing={2}>
            <EquipmentButton
              label='Cape'
              selectedItem={currentSelectedItems.cape}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Hands'
              selectedItem={currentSelectedItems.hands}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Neck'
              selectedItem={currentSelectedItems.neck}
              onClick={handleButtonClick}
            />
            <EquipmentButton
              label='Ring'
              selectedItem={currentSelectedItems.ring}
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
    </Container>
  )
}

export default Equipment
