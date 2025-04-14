import React from 'react'
import axios from 'axios'
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material'

// Define the structure of a single hiscore entry
interface HiscoreEntry {
  skill: string
  rank: number
  level: number
  experience: number
}

// Type for error state
type ErrorType = string | null

// Define the order of skills/activities as returned by the API
const skillNames: string[] = [
  'Overall',
  'Attack',
  'Defence',
  'Strength',
  'Hitpoints',
  'Ranged',
  'Prayer',
  'Magic',
  'Cooking',
  'Woodcutting',
  'Fletching',
  'Fishing',
  'Firemaking',
  'Crafting',
  'Smithing',
  'Mining',
  'Herblore',
  'Agility',
  'Thieving',
  'Slayer',
  'Farming',
  'Runecraft',
  'Hunter',
  'Construction',
  // Minigames / Bosses follow... add them if needed based on index_lite format
  'League Points',
  'Bounty Hunter - Hunter',
  'Bounty Hunter - Rogue',
  'Clue Scrolls (all)',
  'Clue Scrolls (beginner)',
  'Clue Scrolls (easy)',
  'Clue Scrolls (medium)',
  'Clue Scrolls (hard)',
  'Clue Scrolls (elite)',
  'Clue Scrolls (master)',
  'LMS - Rank',
  'PvP Arena - Rank',
  'Soul Wars Zeal',
  'Rifts closed',
  'Colosseum Glory', // Add more as Jagex updates
  // Bosses start here... (Example subset)
  'Abyssal Sire',
  'Alchemical Hydra',
  'Barrows Chests',
  /* ... many more */
  'Zulrah', // Add all bosses you care about in the correct order
]

const parseHiscoresCSV = (csvData: string): HiscoreEntry[] => {
  if (!csvData || typeof csvData !== 'string') {
    return []
  }
  const lines = csvData.trim().split('\n').splice(0, 24)
  return lines
    .map((line, index) => {
      const [rank, level, experience] = line.split(',')
      const skillName = skillNames[index] || `Unknown Activity ${index + 1}`
      return {
        skill: skillName,
        rank: parseInt(rank, 10),
        level: parseInt(level, 10),
        experience: parseInt(experience, 10),
      }
    })
    .filter(
      (skillData) =>
        skillData.rank !== -1 ||
        skillData.level !== -1 ||
        skillData.experience !== -1
    )
}

function OsrsHiscores() {
  const [playerName, setPlayerName] = React.useState<string>('')
  const [hiscoresData, setHiscoresData] =
    React.useState<HiscoreEntry[] | null>(null)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<ErrorType>(null)

  const fetchHiscores = async (event: React.FormEvent) => {
    event.preventDefault() // Prevent default form submission if used in a form
    if (!playerName.trim()) {
      setError('Please enter a player name.')
      setHiscoresData(null)
      return
    }

    setIsLoading(true)
    setError(null)
    setHiscoresData(null) // Clear previous results


    const backendApiUrl = import.meta.env.VITE_REACT_APP_API_URL + `/api/osrs-hiscores?player=${encodeURIComponent(
      playerName
    )}`

    try {
      const response = await axios.get(backendApiUrl, {
        responseType: 'text',
        timeout: 10000, // 10 seconds
      })

      if (response.status === 200) {
        const parsedData = parseHiscoresCSV(response.data)
        setHiscoresData(parsedData)
      } else {
        setError(`Unexpected status code: ${response.status}`)
      }
    } catch (err) {
      console.error('Error fetching Hiscores:', err)
      if (axios.isAxiosError(err)) {
        if (err.response) {
          if (err.response.status === 404) {
            setError(`Player "${playerName}" not found on the Hiscores.`)
          } else {
            setError(
              `Error: ${err.response.status} - ${err.response.statusText || 'Server Error'
              }`
            )
          }
        } else if (err.request) {
          setError(
            'Network Error: Could not reach the Hiscores server. (Check CORS or network connection)'
          )
        } else {
          setError(`Error: ${err.message}`)
        }
      } else {
        setError('An unknown error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(event.target.value)
  }

  return (
    <Container>
      <Box>
        <Box
          display="flex"
          alignItems="stretch" // Changed to stretch
          gap={2}
          mb={2}
        >
          <TextField
            fullWidth
            hiddenLabel
            placeholder="Enter RSN (e.g., Zezima)"
            variant="filled"
            value={playerName}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            onClick={fetchHiscores}
            disabled={isLoading || !playerName.trim()}
            sx={{
              height: 'auto%',
            }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Lookup'}
          </Button>
        </Box>
        {error && <Typography color="error">{error}</Typography>}
      </Box>
    </Container>
  )
}

export default OsrsHiscores
