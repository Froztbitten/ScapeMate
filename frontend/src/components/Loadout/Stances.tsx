import React, { useState, useEffect, useMemo } from 'react'
import { FormControl, FormGroup, FormControlLabel, Checkbox, Typography } from '@mui/material'
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
        let styles = data[currentWeapon.stats.combatstyle].styles
        setStyles(styles)
      }
    })
  }, [currentWeapon])

  const handleStanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = event.target
    const currentStances = stances[safeCombatStyle] || []
    const newValue = Number(value)

    const updatedStances = checked
      ? [...currentStances, newValue]
      : currentStances.filter((stance: number) => stance !== newValue)

    setStances({ ...stances, [safeCombatStyle]: updatedStances })
  }

  if (!currentWeapon || currentWeapon.id === -1) {
    return (<Typography variant='body1'>
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

  return (<FormControl component='fieldset'>
    <Typography variant='h6'>Attack Styles</Typography>
    <FormGroup>
      {styles.map((style, index) => (
        <FormControlLabel
          key={`${style.stance} ${index}`}
          control={
            <Checkbox
              checked={
                stances[safeCombatStyle]?.includes(index) ?? false
              }
              onChange={handleStanceChange}
              value={index}
            />
          }
          label={`${style.stance} (${style.attack_type} - ${style.style})`}
        />
      ))}
    </FormGroup>
  </FormControl>)
}

export default Stances
