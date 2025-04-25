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
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useItemData } from '@/context/ItemDataContext'

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
  equipment: Equipment[] // Array of equipped items for this combat style
  totalBonuses: StatBonuses
}

interface LoadoutData {
  melee?: Record<string, number | null>;
  magic?: Record<string, number | null>;
  ranged?: Record<string, number | null>;
  weapon?: Record<string, number | null>;
  armor?: Record<string, any>;
  levels?: Record<string, number | null>;
}
interface StatsTableProps {
  loadouts: Record<string, LoadoutData>
}

const StatsTable: React.FC<StatsTableProps> = ({ loadouts }) => {
  const { allItems, isLoading: itemDataLoading } = useItemData()
  const [combatStyleStats, setCombatStyleStats] = useState<{
    melee?: CombatStyleStats
    ranged?: CombatStyleStats
    magic?: CombatStyleStats
  }>({})

  const calculateStats = () => {
    if (itemDataLoading) return
    console.log('calculating Stats...')
    const newCombatStyleStats: {
      melee?: CombatStyleStats
      ranged?: CombatStyleStats
      magic?: CombatStyleStats
    } = {}

    // Separate combat styles
    const meleeLoadout = loadouts?.default?.melee
    const rangedLoadout = loadouts?.default?.ranged
    const magicLoadout = loadouts?.default?.magic

    const processLoadout = (
      loadout: Record<string, number | null> | undefined,
      styleName: 'melee' | 'ranged' | 'magic'
    ) => {
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

      Object.values(loadout).forEach(itemId => {
        if (itemId && allItems[itemId]) {
          const item = allItems[itemId]
          newEquipment.push(item)

          if (item.stats) {
            newTotalBonuses.attack_stab += item.stats.stab_attack || 0
            newTotalBonuses.attack_slash += item.stats.slash_attack || 0
            newTotalBonuses.attack_crush += item.stats.crush_attack || 0
            newTotalBonuses.attack_magic += item.stats.magic_attack || 0
            newTotalBonuses.attack_ranged += item.stats.ranged_attack || 0
            newTotalBonuses.defence_stab += item.stats.stab_defence || 0
            newTotalBonuses.defence_slash += item.stats.slash_defence || 0
            newTotalBonuses.defence_crush += item.stats.crush_defence || 0
            newTotalBonuses.defence_magic += item.stats.magic_defence || 0
            newTotalBonuses.defence_ranged += item.stats.ranged_defence || 0
            newTotalBonuses.melee_strength += item.stats.melee_strength || 0
            newTotalBonuses.ranged_strength += item.stats.ranged_strength || 0
            newTotalBonuses.magic_damage += item.stats.magic_damage || 0
            newTotalBonuses.prayer += item.stats.prayer || 0
          }
        }
      })
      newCombatStyleStats[styleName] = {
        equipment: newEquipment,
        totalBonuses: newTotalBonuses,
      }
    }

    processLoadout(meleeLoadout, 'melee')
    processLoadout(rangedLoadout, 'ranged')
    processLoadout(magicLoadout, 'magic')

    setCombatStyleStats(newCombatStyleStats)
  }

  useEffect(() => {
    calculateStats()
  }, [loadouts, allItems, itemDataLoading])

  const renderStatRows = (statBonuses: StatBonuses) => {
    return Object.entries(statBonuses).map(([stat, value]) => (
      <TableRow key={stat}>
        <TableCell component="th" scope="row">
          {stat.replace(/_/g, ' ')}
        </TableCell>
        <TableCell align="right">{value}</TableCell>
      </TableRow>
    ))
  }

  return (
    <TableContainer component={Paper}>
      {/*Melee Stats Table*/}
      {combatStyleStats.melee && (
        <Table sx={{ minWidth: 400 }} aria-label="melee attack stats table">
          <TableHead>
            <TableRow>
              <TableCell colSpan={2}>
                <Typography variant="h6">Melee Stats</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{renderStatRows(combatStyleStats.melee.totalBonuses)}</TableBody>
          <TableHead>
                <TableRow>
                <TableCell colSpan={2}>
                  <Typography variant="h6">Melee Equipment</Typography>
                </TableCell>
                </TableRow>
              </TableHead>
            <TableBody>
            {combatStyleStats.melee.equipment.map(equipment => (
              <TableRow key={equipment.id}>
                <TableCell component="th" scope="row">
                  {equipment.name}
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
        </Table>
      )}

      {/*Ranged Stats Table*/}
      {combatStyleStats.ranged && (
        <Table sx={{ minWidth: 400 }} aria-label="ranged attack stats table">
          <TableHead>
            <TableRow>
              <TableCell colSpan={2}>
                <Typography variant="h6">Ranged Stats</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderStatRows(combatStyleStats.ranged.totalBonuses)}
          </TableBody>
          <TableHead>
                <TableRow>
                <TableCell colSpan={2}>
                  <Typography variant="h6">Ranged Equipment</Typography>
                </TableCell>
                </TableRow>
              </TableHead>
            <TableBody>
            {combatStyleStats.ranged.equipment.map(equipment => (
              <TableRow key={equipment.id}>
                <TableCell component="th" scope="row">
                  {equipment.name}
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
        </Table>
      )}

      {/*Magic Stats Table*/}
      {combatStyleStats.magic && (
        <Table sx={{ minWidth: 400 }} aria-label="magic attack stats table">
          <TableHead>
            <TableRow>
              <TableCell colSpan={2}>
                <Typography variant="h6">Magic Stats</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderStatRows(combatStyleStats.magic.totalBonuses)}
          </TableBody>
          <TableHead>
                <TableRow>
                <TableCell colSpan={2}>
                  <Typography variant="h6">Magic Equipment</Typography>
                </TableCell>
                </TableRow>
              </TableHead>
            <TableBody>
            {combatStyleStats.magic.equipment.map(equipment => (
              <TableRow key={equipment.id}>
                <TableCell component="th" scope="row">
                  {equipment.name}
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
        </Table>
      )}
    </TableContainer>
  )
}

export default StatsTable
