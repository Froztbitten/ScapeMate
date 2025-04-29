import { Equipment } from '@/utils/types'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useItemData } from '@/context/ItemDataContext'
import { SelectedItems, useLoadout } from '@/context/LoadoutContext'
import { useMonsterData } from '@/context/MonsterDataContext'

interface StatBonuses {
  attack_stab: number
  attack_slash: number
  attack_crush: number
  attack_magic: number
  attack_ranged: number
  defence_stab: number
  defence_slash: number
  defence_crush: number
  defence_magic: number
  defence_ranged: number
  melee_strength: number
  ranged_strength: number
  magic_damage: number
  prayer: number
}

interface CombatStyleStats {
  equipment: Equipment[]
  totalBonuses: StatBonuses
}

const StatsTable: React.FC = () => {
  const { allItems, isLoading: itemDataLoading } = useItemData()
  const { selectedItems } = useLoadout()
  const [combatStyleStats, setCombatStyleStats] = useState<{
    melee?: CombatStyleStats
    ranged?: CombatStyleStats
    magic?: CombatStyleStats
  }>({})

  const calculateStats = () => {
    if (itemDataLoading) return
    const newCombatStyleStats: {
      melee?: CombatStyleStats
      ranged?: CombatStyleStats
      magic?: CombatStyleStats
    } = {}

    const processLoadout = (loadout: SelectedItems, styleName: 'melee' | 'ranged' | 'magic') => {
      if (!loadout) return

      const newEquipment: Equipment[] = []
      let newTotalBonuses: StatBonuses = {
        attack_stab: 0,
        attack_slash: 0,
        attack_crush: 0,
        attack_magic: 0,
        attack_ranged: 0,
        defence_stab: 0,
        defence_slash: 0,
        defence_crush: 0,
        defence_magic: 0,
        defence_ranged: 0,
        melee_strength: 0,
        ranged_strength: 0,
        magic_damage: 0,
        prayer: 0,
      }

      Object.values(loadout).forEach(item => {
        if (item.id != -1 && allItems[item.id]) {
          const itemData = allItems[item.id]
          newEquipment.push(itemData)

          if (itemData.stats) {
            newTotalBonuses.attack_stab += itemData.stats.stab_attack ?? 0
            newTotalBonuses.attack_slash += itemData.stats.slash_attack ?? 0
            newTotalBonuses.attack_crush += itemData.stats.crush_attack ?? 0
            newTotalBonuses.attack_magic += itemData.stats.magic_attack ?? 0
            newTotalBonuses.attack_ranged += itemData.stats.ranged_attack ?? 0
            newTotalBonuses.defence_stab += itemData.stats.stab_defence ?? 0
            newTotalBonuses.defence_slash += itemData.stats.slash_defence ?? 0
            newTotalBonuses.defence_crush += itemData.stats.crush_defence ?? 0
            newTotalBonuses.defence_magic += itemData.stats.magic_defence ?? 0
            newTotalBonuses.defence_ranged += itemData.stats.ranged_defence ?? 0
            newTotalBonuses.melee_strength += itemData.stats.melee_strength ?? 0
            newTotalBonuses.ranged_strength += itemData.stats.ranged_strength ?? 0
            newTotalBonuses.magic_damage += itemData.stats.magic_damage ?? 0
            newTotalBonuses.prayer += itemData.stats.prayer ?? 0
          }
        }
      })

      newCombatStyleStats[styleName] = {
        equipment: newEquipment,
        totalBonuses: newTotalBonuses,
      }
    }

    processLoadout(selectedItems.melee, 'melee')
    processLoadout(selectedItems.ranged, 'ranged')
    processLoadout(selectedItems.magic, 'magic')

    setCombatStyleStats(newCombatStyleStats)
  }

  useEffect(() => {
    calculateStats()
  }, [selectedItems, allItems, itemDataLoading])

  return (
    <TableContainer component={Paper}>
      <Table
        sx={{ minWidth: 100 }}
        aria-label='combined attack stats table'
        size='small'
        stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography variant='h6'>Stat Name</Typography>
            </TableCell>
            <TableCell align='right'>
              <Typography variant='h6'>Melee Loadouts</Typography>
            </TableCell>
            <TableCell align='right'>
              <Typography variant='h6'>Ranged Loadouts</Typography>
            </TableCell>
            <TableCell align='right'>
              <Typography variant='h6'>Magic Loadouts</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Dynamically create rows based on common keys across all stats */}
          {Object.keys({
            ...(combatStyleStats.melee?.totalBonuses ?? {}),
            ...(combatStyleStats.ranged?.totalBonuses ?? {}),
            ...(combatStyleStats.magic?.totalBonuses ?? {}),
          }).map(stat => (
            <TableRow key={stat}>
              <TableCell component='th' scope='row'>
                {stat.replace(/_/g, ' ')}
              </TableCell>
              {/* Melee Stats */}
              <TableCell align='right'>
                {combatStyleStats.melee?.totalBonuses &&
                  (combatStyleStats.melee.totalBonuses as any)[stat]}
              </TableCell>
              {/* Ranged Stats */}
              <TableCell align='right'>
                {combatStyleStats.ranged?.totalBonuses &&
                  (combatStyleStats.ranged.totalBonuses as any)[stat]}
              </TableCell>
              {/* Magic Stats */}
              <TableCell align='right'>
                {combatStyleStats.magic?.totalBonuses &&
                  (combatStyleStats.magic.totalBonuses as any)[stat]}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default StatsTable
