const functions = require('firebase-functions')
const express = require('express')
const axios = require('axios')
const cors = require('cors')
const pluginLink = require('./plugin-link')

const app = express()

// --- Middleware ---

// In development the dev server's port is not fixed: Vite falls back to 5174,
// 5175 and so on when a port is taken, which used to surface as an opaque
// "Failed to fetch" in the browser. So allow any loopback or private-LAN
// origin while developing, and keep production to the real site only.
const PRODUCTION_ORIGINS = ['https://scapemate.net']

const DEV_ORIGIN_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/

const isDevelopment = () => process.env.NODE_ENV === 'development'

/** Exported so the rule is testable without standing up the server. */
const isAllowedOrigin = origin => {
  // Non-browser callers (the RuneLite plugin, curl) send no Origin at all.
  if (!origin) {
    return true
  }
  if (isDevelopment()) {
    return DEV_ORIGIN_PATTERN.test(origin)
  }
  return PRODUCTION_ORIGINS.includes(origin)
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// --- API Routes ---

app.get('/api/osrs-hiscores', async (req, res) => {
  const playerName = req.query.player

  if (!playerName) {
    return res
      .status(400)
      .json({ error: 'Player name query parameter is required' })
  }

  const hiscoresUrl = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player=${encodeURIComponent(
    playerName
  )}`

  try {
    console.log(
      `Backend: Fetching hiscores for ${playerName} from ${hiscoresUrl}`
    )

    const response = await axios.get(hiscoresUrl, {
      responseType: 'text',
      timeout: 10000, // Set a timeout (e.g., 10 seconds)
    })

    res.setHeader('Content-Type', 'text/plain')
    res.send(response.data)
  } catch (error) {
    console.error('Backend Error fetching Hiscores:', error.message)

    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('OSRS API Error Status:', error.response.status)
        console.error('OSRS API Error Data:', error.response.data)
        res.status(error.response.status).json({
          error: `OSRS API returned status ${error.response.status}`,
          message:
            error.response.status === 404
              ? 'Player not found on Hiscores.'
              : 'Error fetching data from OSRS API.',
        })
      } else if (error.request) {
        // The request was made but no response was received (network error, timeout)
        console.error('No response received from OSRS API:', error.request)
        res.status(504).json({
          error: 'Gateway Timeout',
          message: 'No response received from OSRS API.',
        })
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Axios setup error:', error.message)
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Error setting up request to OSRS API.',
        })
      }
    } else {
      // Handle non-Axios errors (unexpected errors in your backend code)
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred on the backend.',
      })
    }
  }
})

// --- RuneLite plugin pairing and sync ---

pluginLink.register(app)

// --- Basic Root Route (Optional) ---
app.get('/', (req, res) => {
  res.send('Simple React Backend Proxy is running!')
})

// --- Firebase Functions Export ---
exports.api = functions.https.onRequest(app)

// exported for tests
exports.isAllowedOrigin = isAllowedOrigin
