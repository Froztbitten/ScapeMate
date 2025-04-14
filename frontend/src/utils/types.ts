export interface EquipmentStats {
  id: number

  stab_attack: number
  slash_attack: number
  crush_attack: number
  magic_attack: number
  ranged_attack: number

  stab_defence: number
  slash_defence: number
  crush_defence: number
  magic_defence: number
  ranged_defence: number

  melee_strength: number
  ranged_strength: number
  magic_damage: number
  prayer: number
  slot: string

  speed: number
  attackrange: number
  combatstyle: string
}

export interface Equipment {
  name: string
  stats?: EquipmentStats
}

// Type for the context state
export interface ItemDataContextState {
  allItems: Equipment[]
  isLoading: boolean
  error: Error | null
}