import React, { useState, useMemo } from 'react'
import { Box, TextField, Typography, Table,
  TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper } from '@mui/material'
import { calculateMaxHit, MaxHitParams } from '@/utils/max-hit'

interface MaxHitCalculatorProps {
  onMaxHitParamsChange: (params: Partial<MaxHitParams>) => void;
  maxHitParams: Partial<MaxHitParams>
}

const MaxHitCalculator: React.FC<MaxHitCalculatorProps> = ({ onMaxHitParamsChange, maxHitParams }) => {
  const maxHit = useMemo(() => {
    if (
      maxHitParams.effectiveStrength !== undefined &&
      maxHitParams.strengthBonus !== undefined
    ) {
        return calculateMaxHit(maxHitParams as MaxHitParams);
    }
    return 0
  }, [maxHitParams])

  const handleParamChange = (param: keyof MaxHitParams, value: number) => {
    onMaxHitParamsChange({
      ...maxHitParams,
      [param]: value,
    })
  }

  return (
    <Box>
      <Typography variant="h6" component="h3" sx={{ mt: 2 }}>
        Max Hit Parameters
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
            <TableRow>
              <TableCell>Effective Strength</TableCell>
              <TableCell>
                <TextField
                  type="number"
                  id="effectiveStrength"
                  value={maxHitParams.effectiveStrength ?? ''}
                  onChange={(e) =>
                    handleParamChange('effectiveStrength', parseInt(e.target.value))
                  }
                  variant="outlined"
                  fullWidth
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Strength Bonus</TableCell>
              <TableCell>
                <TextField
                  type="number"
                  id="strengthBonus"
                  value={maxHitParams.strengthBonus ?? ''}
                  onChange={(e) =>
                    handleParamChange('strengthBonus', parseInt(e.target.value))
                  }
                  variant="outlined"
                  fullWidth
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Typography sx={{ mt: 2 }}>Calculated Max Hit: {maxHit}</Typography>
    </Box>
  )
}

export default MaxHitCalculator
