import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { onValue, ref } from 'firebase/database'
import { useAuth } from '@/context/AuthContext'
import { auth, database } from '@/utils/firebaseConfig'
import { errorMessage } from '@/utils/types'

const API_BASE = import.meta.env.VITE_REACT_APP_API_URL

interface LiveSnapshot {
  playerName?: string
  updatedAt?: number
  levels?: Record<string, number>
  equipment?: { slot: string; itemId: number }[]
}

/** Calls a plugin endpoint as the signed-in user. */
const postAsUser = async (path: string) => {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('Not signed in.')

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.error || `Request failed (${response.status})`)
  }
  return body
}

const formatRemaining = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function ConnectPlugin() {
  const { user, loading } = useAuth()
  const [code, setCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<number>(0)
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState<LiveSnapshot | null>(null)

  // Watch what the plugin has pushed, so pairing visibly confirms itself.
  useEffect(() => {
    if (!user) {
      setLive(null)
      return
    }
    const liveRef = ref(database, `players/${user.uid}/live`)
    return onValue(liveRef, snapshot =>
      setLive(snapshot.exists() ? snapshot.val() : null)
    )
  }, [user])

  // Only tick while a code is actually counting down.
  useEffect(() => {
    if (!code || expiresAt <= Date.now()) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [code, expiresAt])

  const requestCode = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const body = await postAsUser('/api/plugin/pair-code')
      setCode(body.code)
      setExpiresAt(body.expiresAt)
      setNow(Date.now())
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }, [])

  const revoke = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      await postAsUser('/api/plugin/revoke')
      setCode(null)
      setExpiresAt(0)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }, [])

  if (loading) {
    return (
      <Container sx={{ py: 6 }}>
        <CircularProgress />
      </Container>
    )
  }

  if (!user) {
    return (
      <Container sx={{ py: 6, maxWidth: 640 }}>
        <Typography variant='h4' gutterBottom>
          Connect RuneLite
        </Typography>
        <Alert severity='info'>
          Sign in with Google to link the ScapeMate plugin to your account.
        </Alert>
      </Container>
    )
  }

  const expired = Boolean(code) && expiresAt <= now

  return (
    <Container sx={{ py: 6, maxWidth: 720, textAlign: 'left' }}>
      <Typography variant='h4' gutterBottom>
        Connect RuneLite
      </Typography>
      <Typography variant='body1' sx={{ mb: 3 }}>
        The ScapeMate RuneLite plugin can push your worn equipment and skill
        levels here, so the DPS calculator fills itself in while you play.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant='h6' gutterBottom>
          1. Generate a pairing code
        </Typography>
        <Stack direction='row' spacing={2} alignItems='center' flexWrap='wrap'>
          <Button variant='contained' onClick={requestCode} disabled={busy}>
            {code ? 'New code' : 'Generate code'}
          </Button>
          {code && (
            <>
              <Chip
                label={code}
                sx={{ fontFamily: 'monospace', fontSize: '1.25rem', px: 1 }}
                color={expired ? 'default' : 'primary'}
              />
              <Typography variant='body2' color='text.secondary'>
                {expired
                  ? 'Expired — generate another.'
                  : `Expires in ${formatRemaining(expiresAt - now)}`}
              </Typography>
            </>
          )}
        </Stack>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
          Paste it into the plugin&apos;s settings in RuneLite. The code is
          single use and valid for ten minutes.
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant='h6' gutterBottom>
          2. Status
        </Typography>
        {live ? (
          <Stack spacing={1}>
            <Typography variant='body2'>
              Last update
              {live.playerName ? ` from ${live.playerName}` : ''}:{' '}
              {live.updatedAt
                ? new Date(live.updatedAt).toLocaleString()
                : 'unknown'}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {Object.keys(live.levels ?? {}).length} skills,{' '}
              {(live.equipment ?? []).length} equipment slots
            </Typography>
          </Stack>
        ) : (
          <Typography variant='body2' color='text.secondary'>
            Nothing received yet. Once the plugin syncs, it shows up here.
          </Typography>
        )}
      </Paper>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant='h6' gutterBottom>
        Disconnect
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
        Revokes every plugin token on your account. Any RuneLite client still
        holding one stops being able to send data, and has to pair again.
      </Typography>
      <Button variant='outlined' color='error' onClick={revoke} disabled={busy}>
        Revoke plugin access
      </Button>
    </Container>
  )
}

export default ConnectPlugin
