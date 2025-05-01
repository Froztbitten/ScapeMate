// src/components/AttackStyle.tsx
import React, { useState, useEffect, useMemo } from 'react'
import {
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Typography,
} from '@mui/material'
import { useLoadout } from '@/context/LoadoutContext' // Import useLoadout hook

interface AttackStyleProps {
  combatStyle: string
  onStyleChange: (style: any) => void // Callback function to handle style selection
}

interface Style {
  stance: string
  attack_type: string
  style: string | null
  experience: string[]
  boost: string | null
}

const AttackStyle: React.FC<AttackStyleProps> = ({ combatStyle, onStyleChange }) => {
  const [styles, setStyles] = useState<Style[]>([])
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const { getCurrentWeapon } = useLoadout() // Get the getCurrentWeapon function
  const currentWeapon = getCurrentWeapon(combatStyle) // Get the current weapon

  const combatStyles = useMemo(() => {
    const fetchCombatStyles = async () => {
      try {
        const response = await fetch('/combatStyles.json')
        if (!response.ok) {
          throw new Error(`Failed to fetch combat styles: ${response.status}`)
        }
        return await response.json()
      } catch (error) {
        console.error('Error fetching combat styles:', error)
        return {} // Ensure styles is always an array
      }
    }
    return fetchCombatStyles()
  }, [])

  useEffect(() => {
    combatStyles.then(data => {
      //Use slot from equipped weapon as key
      console.log(currentWeapon.stats?.combatstyle, data)
      if (currentWeapon.stats?.combatstyle && data[currentWeapon.stats.combatstyle]) {
        setStyles(data[currentWeapon.stats.combatstyle].styles)
      } else {
        setStyles([]) // No styles found for weapon
      }
    })
  }, [combatStyles, currentWeapon]) // Re-fetch styles when the weapon changes

  const handleStyleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = styles.find(style => style.stance === event.target.value)
    setSelectedStyle(event.target.value)
    if (selected) {
      onStyleChange(selected)
    }
  }

  if (!currentWeapon || currentWeapon.id === -1) { // Adjusted check for no weapon
    return (
      <Typography variant='body1'>
        Please select a weapon to view attack styles.
      </Typography>
    )
  }

  if (styles.length === 0) {
    return (
      <Typography variant='body1'>
        No attack styles found for this weapon.
      </Typography>
    )
  }

  return (
    <FormControl component='fieldset'>
      <Typography variant='h6'>Attack Styles</Typography>
      <RadioGroup
        aria-label='attack-style'
        name='attack-style'
        value={selectedStyle}
        onChange={handleStyleChange}>
        {styles.map(style => (
          <FormControlLabel
            key={style.stance}
            value={style.stance}
            control={<Radio />}
            label={`${style.stance} (${style.attack_type} - ${style.style})`}
          />
        ))}
      </RadioGroup>
    </FormControl>
  )
}

export default AttackStyle
