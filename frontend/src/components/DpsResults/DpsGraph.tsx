import React, { useEffect, useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useMonsterData } from '@/context/TargetDataContext'
import { useLoadout, SelectedItems } from '@/context/LoadoutContext'
import { useHiscores } from '@/context/HiscoresContext'
import { calculateDps, DpsParams } from '@/utils/dps'
import { BarChart } from '@mui/x-charts/BarChart'
import { useStances } from '@/context/StanceContext'

interface BarGraphData {
  label: string
  data: number
  color?: string
  id: string
}

const DpsGraph: React.FC = () => {
  const { selectedItems } = useLoadout()
  const { selectedMonsters } = useMonsterData()
  const { hiscoresData } = useHiscores()
  const { stances, combatStyles } = useStances()

  const [dpsData, setDpsData] = useState<BarGraphData[]>([])

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
    if (!dpsParams || !hiscoresData || !selectedMonsters || !stances || !combatStyles) return

    const calculateLoadoutDps = (
      loadout: SelectedItems,
      combatStyle: string,
      stanceIndex: number
    ) => {
      let attackLevel = 1
      let strengthLevel = 1
      let attackStyleBonus = 0
      let strengthStyleBonus = 0
      let equipmentAttackBonus = 0
      let equipmentStabBonus = 0
      let equipmentSlashBonus = 0
      let equipmentCrushBonus = 0
      let equipmentStrengthBonus = 0
      let weaponAttackSpeed = 4
      let targetStyleDefenceBonus = 0

      if (combatStyle === 'melee') {
        attackLevel = hiscoresData.Attack.level
        strengthLevel = hiscoresData.Strength.level
      } else if (combatStyle === 'ranged') {
        attackLevel = hiscoresData.Ranged.level
        strengthLevel = hiscoresData.Ranged.level
      } else if (combatStyle === 'magic') {
        attackLevel = hiscoresData.Magic.level
      }

      let currentStyle = null
      const weaponCombatStyle = loadout.weapon.stats?.combatstyle
      if (combatStyles && weaponCombatStyle) {
        if (combatStyles?.[weaponCombatStyle]?.styles[stanceIndex]) {
          currentStyle = combatStyles[weaponCombatStyle].styles[stanceIndex]
        }
      }

      Object.values(loadout).forEach(item => {
        if (item.id !== -1 && item.id !== loadout['spec wep'].id && item.stats?.slot) {
          if (loadout.weapon.stats?.slot !== '2h' || item.stats.slot !== 'shield') {
            if (combatStyle === 'melee') {
              equipmentStabBonus += item.stats.stab_attack ?? 0
              equipmentSlashBonus += item.stats.slash_attack ?? 0
              equipmentCrushBonus += item.stats.crush_attack ?? 0
              equipmentStrengthBonus += item.stats.melee_strength ?? 0
            } else if (combatStyle === 'ranged') {
              equipmentAttackBonus += item.stats.ranged_attack ?? 0
              equipmentStrengthBonus += item.stats.ranged_strength ?? 0
            } else if (combatStyle === 'magic') {
              equipmentAttackBonus += item.stats.magic_attack ?? 0
            }

            if (['weapon', '2h'].includes(item.stats.slot)) {
              weaponAttackSpeed = item.stats.speed ?? 4
              if (currentStyle?.style === 'Rapid') {
                weaponAttackSpeed -= 1
              }
            }
          }
        }
      })

      if (selectedMonsters[0].selectedVariant !== null) {
        if (currentStyle?.attack_type === 'Stab') {
          equipmentAttackBonus = equipmentStabBonus
          targetStyleDefenceBonus = Number(
            selectedMonsters[0].variants[selectedMonsters[0].selectedVariant].Stab_defence_bonus
          )
        } else if (currentStyle?.attack_type === 'Slash') {
          equipmentAttackBonus = equipmentSlashBonus
          targetStyleDefenceBonus = Number(
            selectedMonsters[0].variants[selectedMonsters[0].selectedVariant].Slash_defence_bonus
          )
        } else if (currentStyle?.attack_type === 'Crush') {
          equipmentAttackBonus = equipmentCrushBonus
          targetStyleDefenceBonus = Number(
            selectedMonsters[0].variants[selectedMonsters[0].selectedVariant].Crush_defence_bonus
          )
        } else if (currentStyle?.attack_type === 'Light') {
          targetStyleDefenceBonus = Number(
            selectedMonsters[0].variants[selectedMonsters[0].selectedVariant]
              .Light_range_defence_bonus
          )
        } else if (
          currentStyle?.attack_type === 'Standard' ||
          currentStyle?.attack_type === 'Ranged'
        ) {
          targetStyleDefenceBonus = Number(
            selectedMonsters[0].variants[selectedMonsters[0].selectedVariant].Range_defence_bonus
          )
        } else if (currentStyle?.attack_type === 'Heavy') {
          targetStyleDefenceBonus = Number(
            selectedMonsters[0].variants[selectedMonsters[0].selectedVariant]
              .Heavy_range_defence_bonus
          )
        }
      }

      if (currentStyle?.style === 'Accurate') {
        attackStyleBonus += 3
      } else if (currentStyle?.style === 'Aggressive') {
        strengthStyleBonus += 3
      } else if (currentStyle?.style === 'Controlled') {
        attackStyleBonus += 1
        strengthStyleBonus += 1
        // defenceStyleBonus += 1
      } else if (currentStyle?.style === 'Longrange') {
        // defenceStyleBonus += 3
      }

      const dps = calculateDps({
        ...dpsParams,
        visibleAttackLevel: attackLevel,
        visibleStrengthLevel: strengthLevel,
        attackStyleBonus: attackStyleBonus,
        strengthStyleBonus: strengthStyleBonus,
        equipmentAttackBonus: equipmentAttackBonus,
        equipmentStrengthBonus: equipmentStrengthBonus,
        targetDefenceLevel: selectedMonsters[0]?.selectedVariant
          ? Number(selectedMonsters[0].variants[selectedMonsters[0].selectedVariant].Defence_level)
          : 1,
        targetStyleDefenceBonus: targetStyleDefenceBonus,
        attackSpeed: weaponAttackSpeed,
      })
      return dps
    }

    const newDpsData: BarGraphData[] = []
    Object.entries(selectedItems).forEach(([combatStyle, loadout]) => {
      const safeCombatStyle = combatStyle.toLowerCase()
      const selectedStances = stances?.[safeCombatStyle] || []

      if (selectedStances.length > 0) {
        selectedStances.forEach(stanceIndex => {
          newDpsData.push({
            label: `${combatStyle} (Stance ${stanceIndex + 1})`,
            data: calculateLoadoutDps(loadout, safeCombatStyle, stanceIndex),
            id: `${safeCombatStyle}-stance-${stanceIndex}`,
          })
        })
      }
    })
    setDpsData(newDpsData)
  }, [selectedItems, hiscoresData, selectedMonsters, stances])

  return (
    <Box>
      <Typography variant='h6' component='h3'>
        Calculated DPS For Loadout(s)
      </Typography>
      <BarChart
        width={700}
        height={400}
        series={[
          {
            data: dpsData.map(item => item.data),
            label: 'DPS',
          },
        ]}
        xAxis={[
          {
            scaleType: 'band',
            id: 'combatStyle',
            data: dpsData.map(item => item.label),
          },
        ]}
      />
    </Box>
  )
}

export default DpsGraph
