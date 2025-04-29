import React, { useEffect, useMemo, useState } from 'react'
import { Box, Typography, useTheme } from '@mui/material'
import { useMonsterData } from '@/context/MonsterDataContext'
import { useLoadout, SelectedItems } from '@/context/LoadoutContext'
import { calculateDps, DpsParams } from '@/utils/dps'
import { useItemData } from '@/context/ItemDataContext'
import { BarChart } from '@mui/x-charts/BarChart'

interface BarGraphData {
  combatStyle: string
  dps: number
  color: string
  id: string
}

const DpsGraph: React.FC = () => {
  const theme = useTheme()
  const { selectedItems } = useLoadout()
  const { selectedMonsters } = useMonsterData()
  const { allItems, isLoading: itemDataLoading } = useItemData()
  const [dpsData, setDpsData] = useState<BarGraphData[]>([])

  const colors = ['#0077CC', '#CC0000', '#00CC00'] // Blue, Red, Green

  const dpsParams: DpsParams | null = useMemo(() => {
    return {
      visibleAttackLevel: 99,
      attackPrayerMultiplier: 1.20, // Piety
      otherAttackMultiplier: 1.0,
      attackStyleBonus: 3, // Accurate/Controlled
      equipmentAttackBonus: 0, //Will be calculated in another section
      // visibleDefenceLevel: selectedVariant.Defence_level,
      defenceStyleBonus: 0,
      effectiveStrength: 130, //Will be calculated in another section
      strengthBonus: 0, //Will be calculated in another section
      attackSpeed: 4,
    } as DpsParams
  }, [])

  useEffect(() => {
    if (!dpsParams || itemDataLoading) return

    const calculateLoadoutDps = (loadout: SelectedItems, combatStyle: string) => {
      let newEquipmentAttackBonus = 0
      let newStrengthBonus = 0
      let effectiveStrength = 0

      Object.values(loadout).forEach(item => {
        if (item.id !== -1 && allItems[item.id]) {
          const itemData = allItems[item.id]

          if (itemData.stats) {
            newEquipmentAttackBonus += itemData.stats.slash_attack ?? 0 // Assuming slash_attack is a good proxy for overall attack bonus for now
            newStrengthBonus += itemData.stats.melee_strength ?? 0 // Assuming melee_strength is a good proxy for overall strength bonus for now
            effectiveStrength += 1
          }
        }
      })

      return calculateDps({
        ...dpsParams,
        equipmentAttackBonus: newEquipmentAttackBonus,
        strengthBonus: newStrengthBonus,
        effectiveStrength: effectiveStrength,
      })
    }

    const newDpsData: BarGraphData[] = [
      {
        combatStyle: 'Melee',
        dps: calculateLoadoutDps(selectedItems.melee, 'melee'),
        color: colors[0],
        id: 'melee',
      },
      {
        combatStyle: 'Ranged',
        dps: calculateLoadoutDps(selectedItems.ranged, 'ranged'),
        color: colors[1],
        id: 'ranged',
      },
      {
        combatStyle: 'Magic',
        dps: calculateLoadoutDps(selectedItems.magic, 'magic'),
        color: colors[2],
        id: 'magic',
      },
    ]
    setDpsData(newDpsData)
  }, [selectedItems, dpsParams, allItems, itemDataLoading])

  return (
    <Box>
      <Typography variant='h6' component='h3'>
        Calculated DPS For Loadout
      </Typography>
      <BarChart
        width={500}
        height={300}
        series={[
          {
            data: [1,2,3],
            // data: dpsData.map(item => 
            //   item.dps,
            // ),
            label: 'DPS',
            // color: (props) => {
            //   const item = dpsData.find(item => item.combatStyle === props.label);
            //   return item?.color || "#8884d8"; // Use the item.color or a default
            // },
          },
        ]}
        xAxis={[{ scaleType: 'band', id: 'combatStyle', data: ['Melee', 'Ranged', 'Magic'] }]}
      />
    </Box>
  )
}

export default DpsGraph
