import { describe, it, expect } from 'vitest'
import {
  calculateEffectiveStrengthLevel,
  calculateMaxHit,
  type MaxHitParams,
} from '@/utils/max-hit'

const base: MaxHitParams = {
  visibleStrengthLevel: 99,
  strengthPrayerMultiplier: 1.0,
  strengthStyleBonus: 3,
  otherStrengthMultiplier: 1.0,
  equipmentStrengthBonus: 0,
}

describe('calculateEffectiveStrengthLevel', () => {
  it('applies prayer, then style bonus, then the flat +8', () => {
    // floor(99 * 1.0) + 3 + 8
    expect(calculateEffectiveStrengthLevel(base)).toBe(110)
  })

  it('floors the prayer multiplier before adding bonuses', () => {
    // floor(99 * 1.23) = 121, not 121.77
    expect(
      calculateEffectiveStrengthLevel({
        ...base,
        strengthPrayerMultiplier: 1.23,
      })
    ).toBe(132)
  })

  it('applies the other multiplier last, after the +8', () => {
    // floor((99 + 3 + 8) * 1.1) = floor(121) = 121
    expect(
      calculateEffectiveStrengthLevel({ ...base, otherStrengthMultiplier: 1.1 })
    ).toBe(121)
  })
})

describe('calculateMaxHit', () => {
  it('matches the known unarmed 99 Strength aggressive max hit', () => {
    // floor(0.5 + 110 * (0 + 64) / 640) = 11
    expect(calculateMaxHit(base)).toBe(11)
  })

  it('scales with the equipment strength bonus', () => {
    // floor(0.5 + 110 * (86 + 64) / 640) = floor(0.5 + 25.78) = 26
    expect(calculateMaxHit({ ...base, equipmentStrengthBonus: 86 })).toBe(26)
  })

  it('returns an integer for fractional inputs', () => {
    const hit = calculateMaxHit({
      ...base,
      strengthPrayerMultiplier: 1.23,
      equipmentStrengthBonus: 82,
    })
    expect(Number.isInteger(hit)).toBe(true)
  })
})
