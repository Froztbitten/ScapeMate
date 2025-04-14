import React, { useState, useEffect } from 'react'
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import Equipment from '@/components/Loadout/Equipment'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
  visible: boolean
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, visible, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index || !visible} // Hide if not selected or not visible
      id={`loadout-tabpanel-${index}`}
      aria-labelledby={`loadout-tab-${index}`}
      {...other}
    >
      {value === index && visible && ( // Only render if selected and visible
        <Box sx={{ p: 1 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  )
}

function a11yProps(index: number, row: number) {
  return {
    id: `loadout-tab-${row}-${index}`,
    'aria-controls': `loadout-tabpanel-${row}-${index}`,
  }
}

interface LoadoutTabState {
  [tabName: string]: number
}

function Loadout() {
  const [value, setValue] = useState(0)
  const [tabs, setTabs] = useState(['Default'])
  const [tabCounter, setTabCounter] = useState(1)
  const [openDialog, setOpenDialog] = useState(false)
  const [tabToDelete, setTabToDelete] = useState<number | null>(null)

  // New state for the second row of tabs, now a map
  const [secondaryValues, setSecondaryValues] = useState<LoadoutTabState>({})
  const secondaryTabs = ['Melee', 'Ranged', 'Magic', 'Spec Atk']

  useEffect(() => {
    // Initialize secondaryValues for new tabs
    const newSecondaryValues: LoadoutTabState = { ...secondaryValues }
    tabs.forEach((tabName) => {
      if (!(tabName in newSecondaryValues)) {
        newSecondaryValues[tabName] = 0 // Default to the first tab
      }
    })
    setSecondaryValues(newSecondaryValues)
  }, [tabs])

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }

  const handleAddTab = () => {
    const newTabName = `Loadout ${tabCounter + 1}`
    setTabs([...tabs, newTabName])
    setTabCounter(tabCounter + 1)
    setValue(tabs.length) // Select the newly added tab
  }

  const handleOpenDialog = (index: number) => {
    setTabToDelete(index)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setTabToDelete(null)
  }

  const handleDeleteTab = () => {
    if (tabToDelete !== null) {
      const newTabs = tabs.filter((_, index) => index !== tabToDelete)
      setTabs(newTabs)

      // Adjust the selected tab if necessary
      if (value >= newTabs.length) {
        setValue(newTabs.length - 1)
      }

      setOpenDialog(false)
      setTabToDelete(null)
      // Remove the secondary value for the deleted tab
      const newSecondaryValues = { ...secondaryValues }
      delete newSecondaryValues[tabs[tabToDelete]]
      setSecondaryValues(newSecondaryValues)
    }
  }

  const handleSecondaryChange = (
    event: React.SyntheticEvent,
    newValue: number
  ) => {
    const selectedTabName = tabs[value]
    setSecondaryValues({
      ...secondaryValues,
      [selectedTabName]: newValue,
    })
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="loadout tabs">
          {tabs.map((tabName, index) => (
            <Tab
              key={tabName}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography component="span">{tabName}</Typography>
                  {tabName !== 'Default' && (
                    <Tooltip title="Close Tab">
                      <CloseIcon
                        onClick={(event) => {
                          event.stopPropagation() // Prevent tab selection
                          handleOpenDialog(index)
                        }}
                        aria-label="close tab"
                        fontSize="small"
                        sx={{ cursor: 'pointer' }}
                      />
                    </Tooltip>
                  )}
                </Box>
              }
              {...a11yProps(index, 0)}
            />
          ))}
          <Tab
            key="add-tab"
            onClick={handleAddTab}
            label={
              <Tooltip title="Add Loadout">
                <AddIcon sx={{ cursor: 'pointer' }} />
              </Tooltip>
            }
            {...a11yProps(tabs.length, 0)}
            sx={{ minWidth: 0, width: 40 }}
          />
        </Tabs>
      </Box>
      {tabs.map((tabName, index) => (
        <Box
          key={`${tabName}-content`}
          sx={{
            display: value === index ? 'block' : 'none', // Hide if not selected
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tabs
            value={secondaryValues[tabName] || 0} // Use the persisted value
            onChange={handleSecondaryChange}
            aria-label="secondary tabs"
            centered
          >
            {secondaryTabs.map((tabName2, index2) => (
              <Tab
                key={tabName2}
                label={tabName2}
                {...a11yProps(index2, 1)}
                sx={{ flexGrow: 1 }}
              />
            ))}
          </Tabs>
          {secondaryTabs.map((tabName2, index2) => (
            <TabPanel
              
              key={`${tabName2}-panel`}
              value={secondaryValues[tabName] || 0} // Use the persisted value
              index={index2}
              visible={value === index}
            >
              <Equipment/>
              {/* {`Content for ${tabName} - ${tabName2}`} */}
            </TabPanel>
          ))}
        </Box>
      ))}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {'Confirm Tab Deletion'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this tab?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleDeleteTab} autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Loadout
