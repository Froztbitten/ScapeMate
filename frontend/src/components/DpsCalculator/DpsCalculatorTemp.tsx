import React, { useState, useMemo } from 'react'
import { Box, TextField, Typography, Paper } from '@mui/material'
import HitChance from '@/DpsCalculator/HitChance'
import MaxHitCalculator from './MaxHit'
import { calculateDps, DpsParams } from '@/utils/dps'
import { HitChanceParams } from '@/utils/hit-chance'
import { MaxHitParams } from '@/utils/max-hit'

const DpsCalculator: React.FC = () => {
  const [hitChanceParams, setHitChanceParams] = useState<Partial<HitChanceParams>>({})
  const [maxHitParams, setMaxHitParams] = useState<Partial<MaxHitParams>>({})
  const [attackSpeed, setAttackSpeed] = useState(4) // Default attack speed

  const handleHitChanceParamsChange = (params: Partial<HitChanceParams>) => {
    setHitChanceParams(params)
  }

  const handleMaxHitParamsChange = (params: Partial<MaxHitParams>) => {
    setMaxHitParams(params)
  }

  const dpsParams: DpsParams | null = useMemo(() => {
    if (
      hitChanceParams.visibleAttackLevel !== undefined &&
      hitChanceParams.visibleDefenceLevel !== undefined &&
      maxHitParams.effectiveStrength !== undefined &&
      maxHitParams.strengthBonus !== undefined
    ) {
      return {
        ...hitChanceParams,
        ...maxHitParams,
        attackSpeed,
      } as DpsParams
    }
    return null
  }, [hitChanceParams, maxHitParams, attackSpeed])

  const dps = useMemo(() => {
    if (!dpsParams) return 0
    return calculateDps(dpsParams)
  }, [dpsParams])

  return (
    <Box className="dps-calculator" sx={{ maxWidth: '1400px', margin: '0 auto'}}>
      <Typography variant="h4" component="h1" sx={{ margin: 2 }}>
        OSRS DPS Calculator
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
        <Paper sx={{ p: 2, width: "100%" }}>
          <HitChance onHitChanceParamsChange={handleHitChanceParamsChange} />
        </Paper>
        <Paper sx={{ p: 2, width: "100%" }}>
          <MaxHitCalculator
            onMaxHitParamsChange={handleMaxHitParamsChange}
            maxHitParams={maxHitParams}
          />
        </Paper>
        <Paper sx={{ p: 2, width: "100%" }}>
          <Box sx={{ mt: 2 }}>
            <Typography>Attack Speed (Ticks):</Typography>
            <TextField
              type="number"
              value={attackSpeed}
              onChange={(e) => setAttackSpeed(parseInt(e.target.value))}
              variant="outlined"
            />
          </Box>
          {dpsParams && <Typography sx={{ mt: 2 }}>Calculated DPS: {dps.toFixed(2)}</Typography>}
        </Paper>
      </Box>
    </Box>
  )
}

export default DpsCalculator
