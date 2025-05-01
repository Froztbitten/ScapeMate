export interface HitChanceParams {
  // Attacker's stats
  visibleAttackLevel: number;   // Base level + potion boosts
  attackPrayerMultiplier?: number; // e.g., 1.20 for Piety, 1.15 for Rigour(atk), 1.0 for none
  otherAttackMultiplier?: number;  // Product of others (Void, Slayer Helm etc.), defaults to 1.0
  attackStyleBonus?: number;     // +3 for Accurate/Controlled styles, +1 for Controlled, +0 otherwise
  equipmentAttackBonus?: number; // Sum of gear bonus for the specific attack style

  // Defender's stats
  targetDefenceLevel: number;
  targetStyleDefenceBonus?: number;
}

export const calculateHitChance = (params: HitChanceParams): number => {

  const attackRoll = calculateAttackRoll(params);
  const defenceRoll = calculateDefenceRoll(params);

  console.log(attackRoll, defenceRoll)
  if (attackRoll > defenceRoll) {
    return 1 - (defenceRoll + 2) / (2 * (attackRoll + 1));
  } else {
    return attackRoll / (2 * (defenceRoll + 1));
  }
}

export const calculateAttackRoll = (params: HitChanceParams): number => {
  const {
    visibleAttackLevel,
    attackPrayerMultiplier = 1.0,
    otherAttackMultiplier = 1.0,
    attackStyleBonus = 0,
    equipmentAttackBonus = 0,
  } = params;
  const effectiveAttackLevel = Math.floor(
    (
      Math.floor(visibleAttackLevel * attackPrayerMultiplier) +
      attackStyleBonus +
      8
    ) *
    otherAttackMultiplier);
  return Math.floor(effectiveAttackLevel * (equipmentAttackBonus + 64));
}

export const calculateDefenceRoll = (params: HitChanceParams): number => {
  const {
    targetDefenceLevel,
    targetStyleDefenceBonus = 0,
  } = params;
  return (targetDefenceLevel + 9) * (targetStyleDefenceBonus + 64);
}