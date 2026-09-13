/**
 * Pairing and sync endpoints for the ScapeMate RuneLite plugin.
 *
 * The plugin cannot authenticate as the user: the Realtime Database rules
 * require a Firebase identity, and a Java client has no safe way to hold one.
 * So the plugin never touches the database. It exchanges a short pairing code
 * for an opaque bearer token, and this module writes on its behalf using the
 * Admin SDK, which bypasses the rules server-side.
 *
 * Neither `pairings` nor `pluginTokens` is readable by any client: the rules
 * grant `players/$uid` and nothing else, and everything unmatched is denied.
 */
const crypto = require('crypto')
const admin = require('firebase-admin')

if (!admin.apps.length) {
  admin.initializeApp()
}

/** Pairing codes are meant to be typed by hand, so keep them short-lived. */
const PAIRING_CODE_TTL_MS = 10 * 60 * 1000

/** Ambiguous characters (0/O, 1/I/L) are excluded so codes survive retyping. */
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const CODE_LENGTH = 8

/** Plugins push on equipment change; anything faster than this is a bug. */
const SYNC_MIN_INTERVAL_MS = 2000

const db = () => admin.database()

/** Random code from a reduced alphabet, via rejection sampling to stay uniform. */
const generatePairingCode = () => {
  let code = ''
  while (code.length < CODE_LENGTH) {
    for (const byte of crypto.randomBytes(CODE_LENGTH)) {
      if (byte < 248) {
        // 248 = 8 * 31, the largest multiple of the alphabet size under 256.
        code += CODE_ALPHABET[byte % CODE_ALPHABET.length]
        if (code.length === CODE_LENGTH) break
      }
    }
  }
  return code
}

/** Tokens are stored only as a hash, so a database leak yields nothing usable. */
const hashToken = token =>
  crypto.createHash('sha256').update(token, 'utf8').digest('hex')

/** Verifies the Firebase ID token a signed-in webapp user sends. */
const requireWebUser = async req => {
  const header = req.get('Authorization') || ''
  const match = header.match(/^Bearer (.+)$/)
  if (!match) return null
  try {
    const decoded = await admin.auth().verifyIdToken(match[1])
    return decoded.uid
  } catch {
    return null
  }
}

/** Resolves a plugin bearer token to the uid that issued it. */
const resolvePluginToken = async req => {
  const header = req.get('Authorization') || ''
  const match = header.match(/^Bearer (.+)$/)
  if (!match) return null
  const snapshot = await db()
    .ref(`pluginTokens/${hashToken(match[1])}`)
    .get()
  if (!snapshot.exists()) return null
  const { uid, revoked } = snapshot.val()
  return revoked ? null : uid
}

const register = app => {
  /**
   * Webapp asks for a code to show the user. Requires a signed-in user, so the
   * code is bound to a real uid before it is ever displayed.
   */
  app.post('/api/plugin/pair-code', async (req, res) => {
    const uid = await requireWebUser(req)
    if (!uid) {
      return res.status(401).json({ error: 'Sign in to link the plugin.' })
    }

    const code = generatePairingCode()
    const expiresAt = Date.now() + PAIRING_CODE_TTL_MS
    await db().ref(`pairings/${code}`).set({ uid, expiresAt })

    return res.json({ code, expiresAt })
  })

  /**
   * Plugin redeems the code for a token. The code is single use: it is deleted
   * whether or not it turned out to be valid, so a guessed code cannot be
   * probed twice.
   */
  app.post('/api/plugin/redeem', async (req, res) => {
    const code = String(req.body?.code || '')
      .trim()
      .toUpperCase()
    if (!code) {
      return res.status(400).json({ error: 'A pairing code is required.' })
    }

    const ref = db().ref(`pairings/${code}`)
    const snapshot = await ref.get()
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Unknown or already used code.' })
    }

    const { uid, expiresAt } = snapshot.val()
    await ref.remove()

    if (!expiresAt || expiresAt < Date.now()) {
      return res.status(410).json({ error: 'That code has expired.' })
    }

    const token = crypto.randomBytes(32).toString('base64url')
    await db()
      .ref(`pluginTokens/${hashToken(token)}`)
      .set({ uid, createdAt: Date.now(), revoked: false })

    return res.json({ token })
  })

  /**
   * Plugin pushes the player's worn equipment and levels. Stored under the
   * user's own subtree so the webapp reads it with the rules it already has.
   */
  app.post('/api/plugin/sync', async (req, res) => {
    const uid = await resolvePluginToken(req)
    if (!uid) {
      return res.status(401).json({ error: 'Invalid or revoked plugin token.' })
    }

    const payload = normaliseSyncPayload(req.body)
    if (!payload) {
      return res.status(400).json({ error: 'Malformed sync payload.' })
    }

    const liveRef = db().ref(`players/${uid}/live`)
    const previous = await liveRef.get()
    if (previous.exists()) {
      const since = Date.now() - (previous.val().updatedAt || 0)
      if (since < SYNC_MIN_INTERVAL_MS) {
        return res.status(429).json({ error: 'Slow down.' })
      }
    }

    await liveRef.set({ ...payload, updatedAt: Date.now() })
    return res.json({ ok: true })
  })

  /** Lets the webapp cut the plugin off without touching the database by hand. */
  app.post('/api/plugin/revoke', async (req, res) => {
    const uid = await requireWebUser(req)
    if (!uid) {
      return res.status(401).json({ error: 'Sign in to revoke.' })
    }
    const all = await db().ref('pluginTokens').get()
    const updates = {}
    all.forEach(child => {
      if (child.val().uid === uid) updates[`${child.key}/revoked`] = true
    })
    await db().ref('pluginTokens').update(updates)
    return res.json({ revoked: Object.keys(updates).length })
  })
}

/**
 * Accepts only the shape we expect, so a compromised or buggy plugin cannot
 * write arbitrary structures into the player's subtree.
 */
const normaliseSyncPayload = body => {
  if (!body || typeof body !== 'object') return null

  const equipment = Array.isArray(body.equipment)
    ? body.equipment
        .filter(slot => slot && typeof slot === 'object')
        .slice(0, 14)
        .map(slot => ({
          slot: String(slot.slot || '').slice(0, 24),
          itemId: Number(slot.itemId),
        }))
        .filter(slot => slot.slot && Number.isInteger(slot.itemId))
    : []

  const levels = {}
  if (body.levels && typeof body.levels === 'object') {
    for (const [skill, value] of Object.entries(body.levels)) {
      const level = Number(value)
      if (Number.isInteger(level) && level >= 1 && level <= 126) {
        levels[String(skill).slice(0, 24)] = level
      }
    }
  }

  if (!equipment.length && !Object.keys(levels).length) return null

  const result = { equipment, levels }
  if (typeof body.playerName === 'string') {
    result.playerName = body.playerName.slice(0, 12)
  }
  return result
}

module.exports = {
  register,
  // exported for tests
  generatePairingCode,
  hashToken,
  normaliseSyncPayload,
  PAIRING_CODE_TTL_MS,
}
