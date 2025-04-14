import React, { useState, useMemo } from 'react'
import {
  calculateAttackRoll,
  calculateDefenceRoll,
  calculateHitChance,
  HitChanceParams,
} from '@/utils/hit-chance.ts'
import {
  Box,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'

interface HitChanceProps {
  onHitChanceParamsChange: (params: Partial<HitChanceParams>) => void
}

const HitChance: React.FC<HitChanceProps> = ({ onHitChanceParamsChange }) => {
  const [attackerParams, setAttackerParams] = useState<Partial<HitChanceParams>>({
    visibleAttackLevel: 99,
  })

  const [defenderParams, setDefenderParams] = useState<Partial<HitChanceParams>>({
    visibleDefenceLevel: 99,
  })

  const hitChanceParams: HitChanceParams | null = useMemo(() => {
    if (
      attackerParams.visibleAttackLevel !== undefined &&
      defenderParams.visibleDefenceLevel !== undefined
    ) {
      return { ...attackerParams, ...defenderParams } as HitChanceParams
    }
    return null
  }, [attackerParams, defenderParams])

  const hitChance = useMemo(() => {
    if (!hitChanceParams) return 0
    return calculateHitChance(hitChanceParams)
  }, [hitChanceParams])

  const attackRoll = useMemo(() => {
    if (!hitChanceParams) return 0
    return calculateAttackRoll(hitChanceParams)
  }, [hitChanceParams])

  const defenceRoll = useMemo(() => {
    if (!hitChanceParams) return 0
    return calculateDefenceRoll(hitChanceParams)
  }, [hitChanceParams])

  const handleAttackerParamChange = (param: keyof HitChanceParams, value: number) => {
    setAttackerParams((prevParams) => ({
      ...prevParams,
      [param]: value,
    }))
  }

  const handleDefenderParamChange = (param: keyof HitChanceParams, value: number) => {
    setDefenderParams((prevParams) => ({
      ...prevParams,
      [param]: value,
    }))
  }

  return (
    <Box className="hit-chance"
      sx={{
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          backgroundImage:
            'url("https://www.runescape.com/img/rsp777/scroll/backdrop_765_top.gif")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center top',
          backgroundSize: '100%',
          height: '80px',
          width: '100%',
          top: '-50px',
          left: '0',
          zIndex: 1 // place the image on top of the container
        },
        marginBottom: '16px',
        marginTop: '45px',
        padding: '20px',
        zIndex: 0 // make sure the container is below the image
      }}
    >
      {/* <TableContainer component={Paper} sx={{ width: "100%" }}> */}
      <Box
        sx={{
          backgroundImage:
            'url(https://www.runescape.com/img/rsp777/scroll/backdrop_745.gif)',
          width: '100%',
          padding: '20px',
          backgroundSize: '100% auto',
          backgroundRepeat: 'repeat-y',
        }}
      >
      <Typography variant="h6" component="h3" color='#000'>
        Attacker Parameters
      </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Parameter</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Attacker Table Rows */}
            {[
              'visibleAttackLevel',
              'attackPrayerMultiplier',
              'otherAttackMultiplier',
              'attackStyleBonus',
              'equipmentAttackBonus',
            ].map((param, index) => (
              <TableRow
                key={param}
              >
                <TableCell>
                  {param === 'visibleAttackLevel' && 'Visible Attack Level'}
                  {param === 'attackPrayerMultiplier' && 'Attack Prayer Multiplier'}
                  {param === 'otherAttackMultiplier' && 'Other Attack Multiplier'}
                  {param === 'attackStyleBonus' && 'Attack Style Bonus'}
                  {param === 'equipmentAttackBonus' && 'Equipment Attack Bonus'}
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    id={param}
                    value={attackerParams[param as keyof HitChanceParams] ?? ''}
                    onChange={(e) =>
                      handleAttackerParamChange(
                        param as keyof HitChanceParams,
                        param === "attackPrayerMultiplier" || param === "otherAttackMultiplier"
                         ? parseFloat(e.target.value) 
                         : parseInt(e.target.value)
                      )
                    }
                    variant="outlined"
                    fullWidth
                    slotProps={param === "attackPrayerMultiplier" || param === "otherAttackMultiplier" ? {
                      htmlInput: { step: 0.01, min: 1 },
                      } : {}}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      {/* </TableContainer> */}

      <Typography variant="h6" component="h3">
        Defender Parameters
      </Typography>
      <TableContainer component={Paper} sx={{ width: '100%' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Parameter</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Defender Table Rows */}
            {[
              'visibleDefenceLevel',
              'defenceStyleBonus',
            ].map((param, index) => (
              <TableRow
                key={param}
                sx={{
                  backgroundColor:
                    index % 2 === 0
                      ? 'rgba(255, 240, 200, 0.2)' // Warm, off-white, 20% opacity
                      : 'transparent',
                  border: "1px solid #CCAA66",
                }}
              >
                <TableCell>
                    {param === 'visibleDefenceLevel' && 'Visible Defence Level'}
                    {param === 'defenceStyleBonus' && 'Defence Style Bonus'}
                  </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    id={param}
                    value={defenderParams[param as keyof HitChanceParams] ?? ''}
                    onChange={(e) =>
                      handleDefenderParamChange(
                        param as keyof HitChanceParams,
                        parseInt(e.target.value)
                      )
                    }
                    variant="outlined"
                    fullWidth
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {hitChanceParams && (
        <Box sx={{ mt: 2 }}>
          <Typography>Attack Roll: {attackRoll}</Typography>
          <Typography>Defence Roll: {defenceRoll}</Typography>
        </Box>
      )}

      {hitChanceParams ? (
        <Typography sx={{ mt: 2 }}>
          Calculated Chance to Hit: {(hitChance * 100).toFixed(2)}%
        </Typography>
      ) : (
        <Typography sx={{ mt: 2 }}>
          Please provide all necessary parameters.
        </Typography>
      )}
    </Box>
  )
}

export default HitChance
