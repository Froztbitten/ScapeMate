export interface MaxHitParams {
  visibleStrengthLevel: number
  strengthPrayerMultiplier: number
  strengthStyleBonus: number
  otherStrengthMultiplier: number
  equipmentStrengthBonus: number
}

export const calculateEffectiveStrengthLevel = (params: MaxHitParams): number => {
  const {
    visibleStrengthLevel,
    strengthPrayerMultiplier,
    otherStrengthMultiplier,
    strengthStyleBonus,
  } = params

  // Calculate the effective strength level
  let effectiveStrengthLevel = Math.floor(visibleStrengthLevel * strengthPrayerMultiplier)
  effectiveStrengthLevel += strengthStyleBonus
  effectiveStrengthLevel += 8
  effectiveStrengthLevel = Math.floor(effectiveStrengthLevel * otherStrengthMultiplier)
  return effectiveStrengthLevel
}

export const calculateMaxHit = (params: MaxHitParams): number => {
  const { equipmentStrengthBonus } = params

  // Calculate the effective strength level first
  const effectiveStrengthLevel = calculateEffectiveStrengthLevel(params)

  // Calculate the max hit
  return Math.floor(0.5 + (effectiveStrengthLevel * (equipmentStrengthBonus + 64)) / 640)
}
