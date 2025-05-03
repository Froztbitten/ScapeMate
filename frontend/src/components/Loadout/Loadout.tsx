import React, { useState, useEffect } from 'react'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import Equipment from '@/components/Loadout/Equipment'
import Stances from '@/components/Loadout/Stances'
import { useLoadout } from '@/context/LoadoutContext'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: Readonly<TabPanelProps>) {
  const { children, value, index, ...other } = props

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`loadout-tabpanel-${index}`}
      aria-labelledby={`loadout-tab-${index}`}
      {...other}>
      {value === index && (
        <Box sx={{ p: 1 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `loadout-tab-${index}`,
    'aria-controls': `loadout-tabpanel-${index}`,
  }
}

function Loadout() {
  const [value, setValue] = useState(0)
  const combatStyleTabs = ['Melee', 'Ranged', 'Magic']
  const [combatStyle, setCombatStyle] = useState(combatStyleTabs[0])
  const { saveCombatStyleToFirebase, loadCombatStyleFromFirebase } = useLoadout()

  const handleChange = async (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
    const newCombatStyle = combatStyleTabs[newValue]
    setCombatStyle(newCombatStyle)
    await saveCombatStyleToFirebase(newValue)
  }

  useEffect(() => {
    const loadInitialCombatStyle = async () => {
      const initialStyle = await loadCombatStyleFromFirebase()
      if (initialStyle !== null && initialStyle >= 0 && initialStyle < combatStyleTabs.length) {
        setValue(initialStyle)
      }
    }
    loadInitialCombatStyle()
  }, [])

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          sx={{
            '.MuiTabs-indicator': {
              backgroundColor: 'white',
            },
            color: 'white'
          }}
          value={value}
          onChange={handleChange}
          aria-label='loadout tabs'
          centered>
          {combatStyleTabs.map((tabName, index) => (
            <Tab
              key={tabName}
              value={index}
              label={tabName}
              {...a11yProps(index)}
              sx={{ flexGrow: 1 }}
            />
          ))}
        </Tabs>
      </Box>
      {combatStyleTabs.map((tabName, index) => (
        <TabPanel key={`${tabName}-panel`} value={value} index={index}>
          <Equipment combatStyle={tabName} />
        </TabPanel>
      ))}
      <hr />
      <Stances combatStyle={combatStyle} />
    </Box>
  )
}

export default Loadout
