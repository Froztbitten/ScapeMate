import React from 'react'
import { Box, TextField, Slider, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { styled } from '@mui/material/styles'

interface NodeEditBoxProps {
  editText: string
  gridSize: number
  handleEditTextChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleNodeSizeChange: (event: Event, newValue: number) => void
  handleCloseEdit: (event: React.SetStateAction<boolean>) => void
  nodeSize: number
  isOpen: boolean
}

const StyledEditBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOpen',
})<{ isOpen: boolean }>(({ theme, isOpen }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  width: 300,
  height: '100%',
  zIndex: 100,
  backgroundColor: 'rgba(0,0,0,0.6)',
  border: '2px solid #555',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.short, // e.g., 200ms-250ms
    easing: theme.transitions.easing.easeInOut,
  }),
  transform: 'translateX(100%)', // Slide out to the right
  ...(isOpen && {
    transform: 'translateX(0)', // Slide back to original position
  }),
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
}))

const NodeEditBox: React.FC<NodeEditBoxProps> = ({
  editText,
  gridSize,
  handleEditTextChange,
  handleNodeSizeChange,
  handleCloseEdit,
  nodeSize,
  isOpen,
}) => {

  return (
    <StyledEditBox
      isOpen={isOpen}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <IconButton onClick={() => handleCloseEdit(false)} size="small">
          <CloseIcon sx={{ color: '#fff' }} />
        </IconButton>
      </Box>
      <TextField
        value={editText}
        onChange={handleEditTextChange}
        size="small"
        sx={{ mb: 2, backgroundColor: '#fff', borderRadius: '5px', width: '100%' }}
      />
      <Slider
        value={nodeSize}
        onChange={handleNodeSizeChange}
        min={gridSize}
        max={gridSize * 10}
        step={gridSize}
        valueLabelDisplay="auto"
        aria-label="Node Size"
        sx={{ width: '100%' }}
      />
    </StyledEditBox>
  )
}

export default NodeEditBox
