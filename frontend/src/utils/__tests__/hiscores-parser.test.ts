import { describe, it, expect } from 'vitest'
import { parseHiscoresCSV } from '@/context/HiscoresContext'

// Line order follows skillNames: Overall, Attack, Defence, Strength, Hitpoints...
describe('parseHiscoresCSV', () => {
  it('keeps an unranked skill that still has a level and experience', () => {
    // Regression: rank -1 with real data used to be dropped, and the
    // experience assignment then threw on the missing object.
    const result = parseHiscoresCSV('-1,75,1271864')
    expect(result.Overall).toEqual({ rank: -1, level: 75, experience: 1271864 })
  })

  it('does not throw on unranked rows (the original crash)', () => {
    expect(() => parseHiscoresCSV('-1,75,1271864')).not.toThrow()
  })

  it('keeps a ranked skill with its real rank', () => {
    const result = parseHiscoresCSV('1631000,1466,27957906')
    expect(result.Overall).toEqual({
      rank: 1631000,
      level: 1466,
      experience: 27957906,
    })
  })

  it('keeps an untrained skill at level 1 with no experience', () => {
    const result = parseHiscoresCSV('-1,1,-1')
    expect(result.Overall).toEqual({ rank: -1, level: 1 })
    expect(result.Overall.experience).toBeUndefined()
  })

  it('drops rows with no data at all', () => {
    // Bosses never fought come back as -1,-1
    expect(parseHiscoresCSV('-1,-1').Overall).toBeUndefined()
  })

  it('parses a multi-line response positionally', () => {
    const csv = [
      '1631000,1466,27957906',
      '1609988,76,1343681',
      '-1,75,1271864',
    ].join('\n')
    const result = parseHiscoresCSV(csv)
    expect(result.Overall.level).toBe(1466)
    expect(result.Attack.level).toBe(76)
    expect(result.Defence).toEqual({ rank: -1, level: 75, experience: 1271864 })
  })

  it('returns an empty object for junk input', () => {
    expect(parseHiscoresCSV('')).toEqual({})
    expect(parseHiscoresCSV(null as unknown as string)).toEqual({})
  })

  it('handles two-field activity rows without an experience column', () => {
    const result = parseHiscoresCSV('12345,50')
    expect(result.Overall).toEqual({ rank: 12345, level: 50 })
  })
})
