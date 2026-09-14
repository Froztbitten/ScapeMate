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

/**
 * One variant of a monster, converted from the OSRS Wiki DPS dataset into
 * `public/monsters_bosses.json`.
 *
 * Every value arrives as a string, including the numeric ones ("147"), so
 * callers must convert before doing arithmetic. Every field is optional: the
 * wiki does not fill in every infobox, and across the 2557 variants currently
 * shipped no single field is present on all of them. The index signature keeps
 * the 86 fields that exist in the data but are not yet read by the app
 * reachable without widening everything to `any`.
 */
export interface MonsterVariant {
  Attack_bonus?: string
  Attack_level?: string
  Attack_speed?: string
  Attack_style?: string
  Combat_level?: string
  Crush_defence_bonus?: string
  Defence_level?: string
  Elemental_weakness?: string
  Elemental_weakness_percent?: string
  Heavy_range_defence_bonus?: string
  Hitpoints?: string
  Image?: string
  Immune_to_poison?: string
  Immune_to_venom?: string
  Light_range_defence_bonus?: string
  Magic_Damage_bonus?: string
  Magic_attack_bonus?: string
  Magic_defence_bonus?: string
  Magic_level?: string
  Max_hit?: string
  Monster_attribute?: string
  NPC_ID?: string
  Poisonous?: string
  Range_attack_bonus?: string
  Range_defence_bonus?: string
  Ranged_Strength_bonus?: string
  Ranged_level?: string
  Size?: string
  Slash_defence_bonus?: string
  Stab_defence_bonus?: string
  Standard_range_defence_bonus?: string
  Strength_bonus?: string
  Strength_level?: string
  [field: string]: string | undefined
}

/** A monster and its variants, plus which variant the user has chosen. */
export interface Monster {
  name: string
  variants: Record<string, MonsterVariant>
  selectedVariant: string | null
}

export interface ItemDataContextState {
  allItems: Record<number, Equipment>
  resolveItemById: (itemId: number) => Equipment | undefined
  isLoading: boolean
  error: Error | null
}

/**
 * Narrow an unknown caught value to a message. `catch` bindings are `unknown`,
 * and anything can be thrown, so this is the safe way to read `.message`.
 */
export const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err)
