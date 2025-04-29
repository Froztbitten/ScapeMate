import React, { useState, useRef, useEffect } from 'react'
import { Box, Button, Typography, Paper, useMediaQuery, Grid } from '@mui/material'

import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'

import OsrsHiscores from '@/components/OsrsHiscores.tsx'
import Loadout from '@/components/Loadout/Loadout.tsx'
import Monster from '@/components/Monster/Monster.tsx'
import StatsTable from '@/components/DpsResults/StatsTable'
import DpsGraph from '@/components/DpsResults/DpsGraph'

interface SidePanelProps {
  title: string
  content: React.ReactNode
  open: boolean
  onToggle: () => void
  side: 'left' | 'right'
}

const SidePanel: React.FC<SidePanelProps> = ({
  title,
  content,
  open,
  onToggle,
  side,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        border: '1px solid #ccc',
        transition: 'width 0.3s ease-in-out',
        width: open ? '400px' : '40px',
        overflow: 'hidden',
        ...(side === 'left' && { borderRight: '1px solid #ccc' }),
        ...(side === 'right' && { borderLeft: '1px solid #ccc' }),
      }}>
      <Button
        onClick={onToggle}
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
          minWidth: '0px',
          transition: 'width 0.3s ease-in-out',
          ...(side === 'left' && { justifyContent: 'end' }),
          ...(side === 'right' && { justifyContent: 'start' }),
        }}>
        <Box
          sx={{
            display: 'flex',
            height: '24px',
            overflowY: 'clip',
            width: open ? '100%' : '0px',
            justifyContent: side === 'left' ? 'flex-end' : 'flex-start',
          }}>
          {side === 'right' && (open ? <ChevronRight /> : <ChevronLeft />)}
          {open && <Typography>{title}</Typography>}
          {side === 'left' && (!open ? <ChevronRight /> : <ChevronLeft />)}
        </Box>
      </Button>

      <Box
        sx={{
          p: 2,
          overflowY: 'auto',
          display: open ? 'block' : 'none',
          height: '100%',
        }}>
        {content}
      </Box>
    </Box>
  )
}

const DataVisualizationLayout: React.FC = () => {
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(true)
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(true)
  const mainContentRef = useRef<HTMLDivElement>(null)

  const isSmallScreen = useMediaQuery((theme: any) =>
    theme.breakpoints.down('md')
  )

  useEffect(() => {
    const handleResize = () => {
      //Add functionality in the future if needed.
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
      }}>
      <SidePanel
        title='Equipment'
        open={leftPanelOpen}
        onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
        side='left'
        content={
          <Box>
            <OsrsHiscores />
            <Loadout />
          </Box>
        }
      />
      <Box
        ref={mainContentRef}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          transition: 'margin 0.3s ease-in-out',
        }}>
        <DpsGraph />
        <StatsTable />
      </Box>
      <SidePanel
        title='Monsters'
        open={rightPanelOpen}
        onToggle={() => setRightPanelOpen(!rightPanelOpen)}
        side='right'
        content={
          <Box>
            <Monster />
          </Box>
        }
      />
    </Box>
  )
}

export default DataVisualizationLayout
