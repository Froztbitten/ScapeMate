const test = require('node:test')
const assert = require('node:assert/strict')

const {
  generatePairingCode,
  hashToken,
  normaliseSyncPayload,
} = require('../plugin-link')

test('pairing codes avoid characters that are easy to mistype', () => {
  const ambiguous = /[01OIL]/
  for (let i = 0; i < 200; i++) {
    const code = generatePairingCode()
    assert.equal(code.length, 8)
    assert.ok(!ambiguous.test(code), `ambiguous character in ${code}`)
  }
})

test('pairing codes are not trivially repeated', () => {
  const seen = new Set()
  for (let i = 0; i < 500; i++) seen.add(generatePairingCode())
  assert.ok(seen.size > 490, `only ${seen.size} distinct codes in 500`)
})

test('token hashing is stable and one-way', () => {
  const token = 'a-token'
  assert.equal(hashToken(token), hashToken(token))
  assert.notEqual(hashToken(token), hashToken('b-token'))
  assert.match(hashToken(token), /^[0-9a-f]{64}$/)
  assert.ok(!hashToken(token).includes(token))
})

test('sync payload keeps well-formed equipment and levels', () => {
  const result = normaliseSyncPayload({
    equipment: [{ slot: 'WEAPON', itemId: 4151 }],
    levels: { Attack: 99, Strength: 99 },
    playerName: 'Zezima',
  })
  assert.deepEqual(result.equipment, [{ slot: 'WEAPON', itemId: 4151 }])
  assert.deepEqual(result.levels, { Attack: 99, Strength: 99 })
  assert.equal(result.playerName, 'Zezima')
})

test('sync payload drops malformed equipment entries', () => {
  const result = normaliseSyncPayload({
    equipment: [
      { slot: 'WEAPON', itemId: 4151 },
      { slot: 'CAPE', itemId: 'not-a-number' },
      { slot: '', itemId: 5 },
      null,
    ],
    levels: { Attack: 99 },
  })
  assert.deepEqual(result.equipment, [{ slot: 'WEAPON', itemId: 4151 }])
})

test('sync payload rejects levels outside the possible range', () => {
  const result = normaliseSyncPayload({
    levels: { Attack: 99, Cooking: 0, Fishing: 127, Mining: 1, Bogus: 'x' },
    equipment: [],
  })
  assert.deepEqual(result.levels, { Attack: 99, Mining: 1 })
})

test('sync payload caps equipment at the number of worn slots', () => {
  const equipment = Array.from({ length: 30 }, (_, i) => ({
    slot: `SLOT_${i}`,
    itemId: i + 1,
  }))
  assert.equal(
    normaliseSyncPayload({ equipment, levels: {} }).equipment.length,
    14
  )
})

test('sync payload truncates an over-long player name', () => {
  const result = normaliseSyncPayload({
    levels: { Attack: 99 },
    playerName: 'x'.repeat(50),
  })
  assert.equal(result.playerName.length, 12)
})

test('sync payload rejects empty or junk bodies', () => {
  assert.equal(normaliseSyncPayload(null), null)
  assert.equal(normaliseSyncPayload('nope'), null)
  assert.equal(normaliseSyncPayload({}), null)
  assert.equal(normaliseSyncPayload({ equipment: [], levels: {} }), null)
})

const {
  buildLoadoutUpdate,
  buildPlayerSyncUpdate,
  SLOT_NAMES,
} = require('../plugin-link')

test('loadout maps RuneLite slots onto the calculator names', () => {
  const update = buildLoadoutUpdate([
    { slot: 'WEAPON', itemId: 4151 },
    { slot: 'AMULET', itemId: 6585 },
    { slot: 'GLOVES', itemId: 7462 },
    { slot: 'BOOTS', itemId: 11732 },
  ])
  assert.equal(update.weapon, 4151)
  assert.equal(update.neck, 6585, 'AMULET maps to neck')
  assert.equal(update.hands, 7462, 'GLOVES maps to hands')
  assert.equal(update.feet, 11732, 'BOOTS maps to feet')
})

test('loadout nulls slots the player is not wearing', () => {
  // Otherwise a previously saved item would linger in an empty slot.
  const update = buildLoadoutUpdate([{ slot: 'WEAPON', itemId: 4151 }])
  assert.equal(update.weapon, 4151)
  for (const slot of ['head', 'body', 'legs', 'feet', 'cape', 'neck', 'ring']) {
    assert.equal(update[slot], null, `${slot} should be cleared`)
  }
})

test('loadout ignores cosmetic slots with no calculator equivalent', () => {
  const update = buildLoadoutUpdate([
    { slot: 'ARMS', itemId: 111 },
    { slot: 'HAIR', itemId: 222 },
    { slot: 'JAW', itemId: 333 },
  ])
  assert.ok(!Object.values(update).includes(111))
  assert.ok(!Object.values(update).includes(222))
  assert.ok(!Object.values(update).includes(333))
})

test('loadout never writes a "spec wep" slot', () => {
  // It has no in-game equivalent, so it must be left as the user set it.
  const update = buildLoadoutUpdate([{ slot: 'WEAPON', itemId: 4151 }])
  assert.ok(!('spec wep' in update))
})

test('every mapped slot name is one the calculator knows', () => {
  const known = [
    'head',
    'body',
    'legs',
    'feet',
    'weapon',
    'shield',
    'ammo',
    'cape',
    'hands',
    'neck',
    'ring',
  ]
  for (const name of Object.values(SLOT_NAMES)) {
    assert.ok(known.includes(name), `unknown slot name: ${name}`)
  }
})

test('live melee sync updates every mapped loadout slot atomically', () => {
  const update = buildPlayerSyncUpdate(
    {
      equipment: [{ slot: 'WEAPON', itemId: 4151 }],
      levels: { Attack: 99 },
    },
    true
  )

  assert.equal(update['loadouts/default/melee/weapon'], 4151)
  assert.equal(update['loadouts/default/melee/head'], null)
  assert.equal(update.live.levels.Attack, 99)
  assert.ok(Number.isInteger(update.live.updatedAt))
  assert.ok(!('loadouts/default/melee/spec wep' in update))
})

test('ordinary plugin sync leaves calculator loadouts alone', () => {
  const update = buildPlayerSyncUpdate(
    { equipment: [{ slot: 'WEAPON', itemId: 4151 }], levels: {} },
    false
  )
  assert.deepEqual(Object.keys(update), ['live'])
})
