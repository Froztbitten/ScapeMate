import React from 'react'
import { Button, Box, Tooltip } from '@mui/material'
import { useItemData } from '@/context/ItemDataContext'
import type { Equipment } from '@/utils/types'

interface EquipmentButtonProps {
  selectedItem: Equipment
  label: string
  large?: boolean
  disabled?: boolean
  onClick: (event: React.MouseEvent, label: string) => void
}

const EquipmentButton: React.FC<EquipmentButtonProps> = ({
  selectedItem,
  label,
  onClick,
  large,
  disabled,
}) => {
  const items = useItemData()

  let imageUrl = ''
  if (items.allItems) {
    imageUrl =
      selectedItem.id !== -1 && items.allItems[selectedItem.id]
        ? items.allItems[selectedItem.id].image_url ?? ''
        : ''
  }

  return (
    <Tooltip title={selectedItem.name || label}>
      <Button
        variant='outlined'
        onClick={event => onClick(event, label)}
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
        {selectedItem.id !== -1 && (
          <Box
            component='img'
            src={imageUrl}
            sx={{
              width: 50,
              height: 50,
              display: 'block',
              opacity: disabled ? 0.5 : 1,
            }}
          />
        )}
        {selectedItem.id === -1 && label}
      </Button>
    </Tooltip>
  )
}

export default EquipmentButton
