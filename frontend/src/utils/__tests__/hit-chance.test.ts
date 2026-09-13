import { describe, it, expect } from 'vitest'
import {
  calculateAttackRoll,
  calculateDefenceRoll,
  calculateHitChance,
  type HitChanceParams,
} from '@/utils/hit-chance'

const base: HitChanceParams = {
  visibleAttackLevel: 99,
  targetDefenceLevel: 100,
}

describe('calculateAttackRoll', () => {
  it('defaults the optional multipliers and bonuses', () => {
    // (floor(99 * 1) + 0 + 8) * (0 + 64)
    expect(calculateAttackRoll(base)).toBe(107 * 64)
  })

  it('floors the prayer multiplier before adding the style bonus', () => {
    // floor(99 * 1.2) = 118; (118 + 3 + 8) * (64 + 64)
    expect(
      calculateAttackRoll({
        ...base,
        attackPrayerMultiplier: 1.2,
        attackStyleBonus: 3,
        equipmentAttackBonus: 64,
      })
    ).toBe(129 * 128)
  })
})

describe('calculateDefenceRoll', () => {
  it('applies the flat +9 and +64', () => {
    expect(calculateDefenceRoll(base)).toBe(109 * 64)
    expect(
      calculateDefenceRoll({ ...base, targetStyleDefenceBonus: 100 })
    ).toBe(109 * 164)
  })
})

describe('calculateHitChance', () => {
  it('uses the favourable branch when the attack roll wins', () => {
    const params: HitChanceParams = {
      visibleAttackLevel: 99,
      equipmentAttackBonus: 100,
      targetDefenceLevel: 1,
    }
    const attack = calculateAttackRoll(params)
    const defence = calculateDefenceRoll(params)
    expect(attack).toBeGreaterThan(defence)
    expect(calculateHitChance(params)).toBeCloseTo(
      1 - (defence + 2) / (2 * (attack + 1)),
      10
    )
  })

  it('uses the unfavourable branch when the defence roll wins', () => {
    const params: HitChanceParams = {
      visibleAttackLevel: 1,
      targetDefenceLevel: 300,
      targetStyleDefenceBonus: 200,
    }
    const attack = calculateAttackRoll(params)
    const defence = calculateDefenceRoll(params)
    expect(attack).toBeLessThanOrEqual(defence)
    expect(calculateHitChance(params)).toBeCloseTo(
      attack / (2 * (defence + 1)),
      10
    )
  })

  it('always returns a probability between 0 and 1', () => {
    for (const targetDefenceLevel of [1, 50, 100, 200, 500]) {
      const chance = calculateHitChance({ ...base, targetDefenceLevel })
      expect(chance).toBeGreaterThanOrEqual(0)
      expect(chance).toBeLessThanOrEqual(1)
    }
  })
})
