const functions = require('firebase-functions')
const express = require('express')
const axios = require('axios')
const cors = require('cors')

const app = express()

// --- Middleware ---

app.use(cors({ origin: 'https://scapemate.net' }))
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

// --- Basic Root Route (Optional) ---
app.get('/', (req, res) => {
  res.send('Simple React Backend Proxy is running!')
})

// --- Firebase Functions Export ---
exports.api = functions.https.onRequest(app)
