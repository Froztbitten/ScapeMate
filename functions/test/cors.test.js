const test = require('node:test')
const assert = require('node:assert/strict')

/** index.js reads NODE_ENV at call time, so set it before requiring. */
const load = env => {
  process.env.NODE_ENV = env
  delete require.cache[require.resolve('../index.js')]
  return require('../index.js').isAllowedOrigin
}

test('development accepts any localhost port', () => {
  const allowed = load('development')
  for (const port of [5173, 5174, 5175, 3000, 8080]) {
    assert.ok(allowed(`http://localhost:${port}`), `localhost:${port}`)
    assert.ok(allowed(`http://127.0.0.1:${port}`), `127.0.0.1:${port}`)
  }
})

test('development accepts private-LAN origins, for testing on a phone', () => {
  const allowed = load('development')
  assert.ok(allowed('http://192.168.1.180:5173'))
  assert.ok(allowed('http://10.0.0.5:4173'))
})

test('development still rejects arbitrary sites', () => {
  const allowed = load('development')
  assert.ok(!allowed('https://evil.example'))
  // Must not match a host that merely embeds an allowed name.
  assert.ok(!allowed('http://localhost.evil.example'))
  assert.ok(!allowed('https://notlocalhost'))
})

test('production allows only the real site', () => {
  const allowed = load('production')
  assert.ok(allowed('https://scapemate.net'))
  assert.ok(!allowed('http://localhost:5173'))
  assert.ok(!allowed('https://scapemate.net.evil.example'))
  assert.ok(!allowed('http://scapemate.net'))
})

test('a missing Origin is allowed in both environments', () => {
  // The RuneLite plugin and curl send none; CORS does not apply to them.
  for (const env of ['development', 'production']) {
    const allowed = load(env)
    assert.ok(allowed(undefined), env)
    assert.ok(allowed(''), env)
  }
})
