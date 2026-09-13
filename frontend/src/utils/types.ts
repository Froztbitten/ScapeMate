export interface EquipmentStats {
  stab_attack?: number
  slash_attack?: number
  crush_attack?: number
  magic_attack?: number
  ranged_attack?: number

  stab_defence?: number
  slash_defence?: number
  crush_defence?: number
  magic_defence?: number
  ranged_defence?: number

  melee_strength?: number
  ranged_strength?: number
  magic_damage?: number
  prayer?: number
  slot?: string

  speed?: number
  attackrange?: number | string
  combatstyle?: string
}

export interface Equipment {
  id: number
  name: string
  image_url?: string
  stats?: EquipmentStats
}

export interface ItemDataContextState {
  allItems: Record<number, Equipment>
  isLoading: boolean
  error: Error | null
}

/**
 * Narrow an unknown caught value to a message. `catch` bindings are `unknown`,
 * and anything can be thrown, so this is the safe way to read `.message`.
 */
export const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err)
