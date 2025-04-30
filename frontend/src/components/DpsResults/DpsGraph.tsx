import React, { useEffect, useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useMonsterData } from '@/context/TargetDataContext'
import { useLoadout, SelectedItems } from '@/context/LoadoutContext'
import { useItemData } from '@/context/ItemDataContext'
import { useHiscores } from '@/context/HiscoresContext'
import { calculateDps, DpsParams } from '@/utils/dps'
import { BarChart } from '@mui/x-charts/BarChart'

interface BarGraphData {
  combatStyle: string
  dps: number
  color: string
  id: string
}

const DpsGraph: React.FC = () => {
  const { selectedItems } = useLoadout()
  const { selectedMonsters } = useMonsterData()
  const { allItems, isLoading: itemDataLoading } = useItemData()
  const { hiscoresData } = useHiscores()

  const [dpsData, setDpsData] = useState<BarGraphData[]>([])

  const colors = ['#0077CC', '#CC0000', '#00CC00']

  const dpsParams: DpsParams | null = useMemo(() => {
    return {
      visibleAttackLevel: 1,
      visibleStrengthLevel: 1,
      attackPrayerMultiplier: 1.0,
      strengthPrayerMultiplier: 1.0,
      attackStyleBonus: 0,
      strengthStyleBonus: 0,
      otherAttackMultiplier: 1.0,
      otherStrengthMultiplier: 1.0,
      equipmentAttackBonus: 0,
      equipmentStrengthBonus: 0,
      targetDefenceLevel: 1,
      targetStyleDefenceBonus: 0,
      attackSpeed: 4,
    } as DpsParams
  }, [])

  useEffect(() => {
    if (!dpsParams || itemDataLoading || !hiscoresData || !selectedMonsters) return

    const calculateLoadoutDps = (loadout: SelectedItems, combatStyle: string) => {
      let attackLevel = 1
      let strengthLevel = 1
      let newEquipmentAttackBonus = 0
      let newEquipmentStrengthBonus = 0
      let weaponAttackSpeed = 4
      if (combatStyle === 'melee') {
        attackLevel = hiscoresData.Attack.level
        strengthLevel = hiscoresData.Strength.level
      } else if (combatStyle === 'ranged') {
        attackLevel = hiscoresData.Ranged.level
        strengthLevel = hiscoresData.Ranged.level
      } else if (combatStyle === 'magic') {
        attackLevel = hiscoresData.Magic.level
      }

      Object.values(loadout).forEach(item => {
        if (item.id !== -1 && allItems[item.id]) {
          const itemData = allItems[item.id]

          if (itemData.stats) {
            if (combatStyle === 'melee') {
              newEquipmentAttackBonus += itemData.stats.stab_attack ?? 0
              newEquipmentStrengthBonus += itemData.stats.melee_strength ?? 0
            } else if (combatStyle === 'ranged') {
              newEquipmentAttackBonus += itemData.stats.ranged_attack ?? 0
              newEquipmentStrengthBonus += itemData.stats.ranged_strength ?? 0
            } else if (combatStyle === 'magic') {
              newEquipmentAttackBonus += itemData.stats.magic_attack ?? 0
            }
          }

          if (itemData.stats?.slot && ['weapon', '2h'].includes(itemData.stats?.slot)) {
            weaponAttackSpeed = itemData.stats.speed ?? 4
          }
        }
      })

      return calculateDps({
        ...dpsParams,
        visibleAttackLevel: attackLevel,
        visibleStrengthLevel: strengthLevel,
        equipmentAttackBonus: newEquipmentAttackBonus,
        equipmentStrengthBonus: newEquipmentStrengthBonus,
        targetDefenceLevel: selectedMonsters[0]?.selectedVariant
          ? selectedMonsters[0].variants[selectedMonsters[0].selectedVariant].Defence_level
          : 1,
        targetStyleDefenceBonus: selectedMonsters[0]?.selectedVariant
          ? selectedMonsters[0].variants[selectedMonsters[0].selectedVariant].Stab_defence_bonus
          : 1,
        attackSpeed: weaponAttackSpeed,
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
  }, [selectedItems, hiscoresData, selectedMonsters])

  return (
    <Box>
      <Typography variant='h6' component='h3'>
        Calculated DPS For Loadout(s)
      </Typography>
      <BarChart
        width={500}
        height={300}
        series={[
          {
            data: dpsData.map(item => item.dps),
            label: 'DPS',
          },
        ]}
        colors={dpsData.map(item => item.color)}
        xAxis={[{ scaleType: 'band', id: 'combatStyle', data: ['Melee', 'Ranged', 'Magic'] }]}
      />
    </Box>
  )
}

export default DpsGraph
