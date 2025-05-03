// src/components/Stances.tsx
import React, { useState, useEffect, useMemo } from 'react'
import {
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Typography,
} from '@mui/material'
import { useLoadout } from '@/context/LoadoutContext'
import { useStances } from '@/context/StanceContext'

interface StancesProps {
  combatStyle: string
}

interface Style {
  stance: string
  attack_type: string
  style: string | null
  experience: string[]
  boost: string | null
}

const Stances: React.FC<StancesProps> = ({ combatStyle }) => {
  const [styles, setStyles] = useState<Style[]>([])
  const { getCurrentWeapon } = useLoadout()
  const { stances, setStances } = useStances()
  const currentWeapon = getCurrentWeapon(combatStyle)
  const safeCombatStyle = combatStyle.toLowerCase()

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
        return {}
      }
    }
    return fetchCombatStyles()
  }, [])

  useEffect(() => {
    combatStyles.then(data => {
      if (currentWeapon.stats?.combatstyle && data[currentWeapon.stats.combatstyle]) {
        setStyles(data[currentWeapon.stats.combatstyle].styles)
      }
    })
  }, [currentWeapon])

  const handleStanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStances({
      ...stances,
      [safeCombatStyle]: Number(event.target.value),
    })
  }

  if (!currentWeapon || currentWeapon.id === -1) {
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
        value={stances[safeCombatStyle]}
        onChange={handleStanceChange}>
        {styles.map((style,index) => (
          <FormControlLabel
            key={`${style.stance} - ${style.style}`}
            value={index}
            control={<Radio />}
            label={`${style.stance} (${style.attack_type} - ${style.style})`}
          />
        ))}
      </RadioGroup>
    </FormControl>
  )
}

export default Stances
