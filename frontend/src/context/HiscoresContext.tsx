// src/context/HiscoresContext.tsx
import React, { createContext, useState, useEffect, useContext, useMemo, ReactNode } from 'react'
import axios from 'axios'
import { ref, update, get } from 'firebase/database'
import { database } from '@/utils/firebaseConfig'
import { AuthContext } from '@/context/AuthContext' // Import the AuthContext

// Define the structure of a single hiscore entry
export type Hiscores = {
  [keyName: string]: HiscoreEntry
} & { lastUpdated?: number }

export interface HiscoreEntry {
  rank: number
  level: number
  experience?: number
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
  'League Points',
  'Deadman Points',
  'Bounty Hunter - Hunter',
  'Bounty Hunter - Rogue',
  'Bounty Hunter (Legacy) - Hunter',
  'Bounty Hunter (Legacy) - Rogue',
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
  'Colosseum Glory',
  'Collections Logged',
  'Abyssal Sire',
  'Alchemical Hydra',
  'Amoxliatl',
  'Araxxor',
  'Artio',
  'Barrows Chests',
  'Bryophyta',
  'Callisto',
  "Cal'varion",
  'Cerberus',
  'Chambers of Xeric',
  'Chambers of Xeric: Challenge Mode',
  'Chaos Elemental',
  'Chaos Fanatic',
  'Commander Zilyana',
  'Corporeal Beast',
  'Crazy Archaeologist',
  'Dagannoth Prime',
  'Dagannoth Rex',
  'Dagannoth Supreme',
  'Deranged Archaeologist',
  'Duke Sucellus',
  'General Graardor',
  'Giant Mole',
  'Grotesque Guardians',
  'Hespori',
  'Kalphite Queen',
  'King Black Dragon',
  'Kraken',
  "Kree'Arra",
  "K'ril Tsutsaroth",
  'Mimic',
  'Nex',
  'Nightmare',
  "Phosani's Nightmare",
  'Obor',
  'Phantom Muspah',
  'Royal Titans',
  'Sarachnis',
  'Scorpia',
  'Skotizo',
  'Sol Heredit',
  'Spindel',
  'Tempoross',
  'The Gauntlet',
  'The Corrupted Gauntlet',
  'The Hueycoatl',
  'The Leviathan',
  'The Whisperer',
  'Theatre of Blood',
  'Theatre of Blood: Hard Mode',
  'Thermonuclear Smoke Devil',
  'Tombs of Amascut',
  'Tombs of Amascut: Expert Mode',
  'TzKal-Zuk',
  'TzTok-Jad',
  'Vardorvis',
  'Venenatis',
  "Vet'ion",
  'Vorkath',
  'Wintertodt',
  'Zalcano',
  'Zulrah',
]

const parseHiscoresCSV = (csvData: string): Hiscores => {
  if (!csvData || typeof csvData !== 'string') {
    return {}
  }
  const lines = csvData.trim().split('\n')

  const hiscores: Hiscores = {}

  lines.forEach((line, index) => {
    if (index < skillNames.length) {
      const [rank, level, experience] = line.split(',')
      const skillName = skillNames[index]

      if (parseInt(rank) > 0 && parseInt(level) > 0) {
        hiscores[skillName] = {
          rank: parseInt(rank),
          level: parseInt(level),
        }
      }
      if (experience ? parseInt(experience) > 0 : false) {
        hiscores[skillName].experience = parseInt(experience)
      }
    }
  })
  return hiscores
}

interface HiscoresContextState {
  playerName: string
  setPlayerName: (name: string) => void
  hiscoresData: Hiscores | null
  fetchHiscores: (name: string) => Promise<void>
  isLoading: boolean
  error: ErrorType
}

const HiscoresContext = createContext<HiscoresContextState | undefined>(undefined)

interface HiscoresProviderProps {
  children: ReactNode
}

export const HiscoresProvider: React.FC<HiscoresProviderProps> = ({ children }) => {
  const [playerName, setPlayerName] = useState<string>('')
  const [hiscoresData, setHiscoresData] = useState<Hiscores | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<ErrorType>(null)
  const { user, loading } = useContext(AuthContext)

  const savePlayerNameToFirebase = async (name: string) => {
    if (!user) {
      console.warn('User not logged in. Cannot save player name.')
      return
    }
    try {
      const playerRef = ref(database, `players/${user.uid}`)
      await update(playerRef, { name })
      console.log(`Player name "${name}" saved to Firebase for user ${user.uid}.`)
    } catch (err) {
      console.error('Error saving player name to Firebase:', err)
    }
  }

  const savePlayerHiscoresToFirebase = async (hiscores: Hiscores) => {
    if (!user) {
      console.warn('User not logged in. Cannot save player name.')
      return
    }
    try {
      const playerRef = ref(database, `players/${user.uid}`)
      const timestamp = Date.now()
      hiscores.lastUpdated = timestamp
      await update(playerRef, { hiscores })
      console.log(`Player data saved to Firebase for user ${user.uid}.`)
    } catch (err) {
      console.error('Error saving player name to Firebase:', err)
    }
  }

  const loadPlayerNameFromFirebase = async () => {
    if (!user) {
      console.warn('User not logged in. Cannot load player name.')
      return
    }
    try {
      const playerRef = ref(database, `players/${user.uid}/name`)
      const snapshot = await get(playerRef)
      if (snapshot.exists()) {
        const playerData = snapshot.val()
        setPlayerName(playerData)
      } else {
        console.log('No player name found for this user.')
      }
    } catch (err) {
      console.error('Error loading player name from Firebase:', err)
    }
  }

  const loadPlayerHiscoresFromFirebase = async () => {
    if (!user) {
      console.warn('User not logged in. Cannot load player name.')
      return
    }
    try {
      const hiscoresRef = ref(database, `players/${user.uid}/hiscores`)
      const snapshot = await get(hiscoresRef)
      if (snapshot.exists()) {
        const playerData = snapshot.val()
        setHiscoresData(playerData)
      } else {
        console.log('No player name found for this user.')
      }
    } catch (err) {
      console.error('Error loading player name from Firebase:', err)
    }
  }

  const fetchHiscores = async (name: string) => {
    if (!name.trim()) {
      setError('Please enter a player name.')
      setHiscoresData(null)
      return
    }

    setIsLoading(true)
    setError(null)
    setHiscoresData(null) // Clear previous results
    setPlayerName(name)

    // Save the player name to Firebase when the lookup is clicked
    await savePlayerNameToFirebase(name)

    const backendApiUrl =
      import.meta.env.VITE_REACT_APP_API_URL +
      `/api/osrs-hiscores?player=${encodeURIComponent(name)}`

    try {
      const response = await axios.get(backendApiUrl, {
        responseType: 'text',
        timeout: 10000, // 10 seconds
      })

      if (response.status === 200) {
        const parsedData = parseHiscoresCSV(response.data)
        setHiscoresData(parsedData)
        await savePlayerHiscoresToFirebase(parsedData)
      } else {
        setError(`Unexpected status code: ${response.status}`)
      }
    } catch (err) {
      console.error('Error fetching Hiscores:', err)
      if (axios.isAxiosError(err)) {
        if (err.response) {
          if (err.response.status === 404) {
            setError(`Player "${name}" not found on the Hiscores.`)
          } else {
            setError(`Error: ${err.response.status} - ${err.response.statusText || 'Server Error'}`)
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

  useEffect(() => {
    if (!loading && user) {
      loadPlayerNameFromFirebase()
      loadPlayerHiscoresFromFirebase()
    }
  }, [user, loading])

  const contextValue: HiscoresContextState = useMemo(
    () => ({
      playerName,
      setPlayerName,
      hiscoresData,
      fetchHiscores,
      isLoading,
      error,
    }),
    [playerName, hiscoresData, isLoading, error]
  )

  return <HiscoresContext.Provider value={contextValue}>{children}</HiscoresContext.Provider>
}

export const useHiscores = (): HiscoresContextState => {
  const context = useContext(HiscoresContext)
  if (!context) {
    throw new Error('useHiscores must be used within a HiscoresProvider')
  }
  return context
}
