import React, { useState, useEffect } from 'react'
import { FormControl, FormGroup, FormControlLabel, Checkbox, Typography } from '@mui/material'
import { useLoadout } from '@/context/LoadoutContext'
import { useStances, Style } from '@/context/StanceContext'

interface StancesProps {
  combatStyle: string
}

const Stances: React.FC<StancesProps> = ({ combatStyle }) => {
  const [styles, setStyles] = useState<Style[]>([])
  const { getCurrentWeapon } = useLoadout()
  const { stances, setStances } = useStances()
  const currentWeapon = getCurrentWeapon(combatStyle)
  const safeCombatStyle = combatStyle.toLowerCase()

  const { combatStyles } = useStances()

  useEffect(() => {
    if (!combatStyles) return;

    combatStyles.then((data) => {
      if (currentWeapon.stats?.combatstyle && data[currentWeapon.stats.combatstyle]) {
        let styles = data[currentWeapon.stats.combatstyle].styles
        setStyles(styles)
      }
    })
  }, [currentWeapon])

  const handleStanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = event.target
    const currentStances = stances?.[safeCombatStyle] || []
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
                stances?.[safeCombatStyle]?.includes(index) ?? false
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
