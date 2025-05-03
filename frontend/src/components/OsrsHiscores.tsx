import React from 'react'
import { Box, Button, Container, TextField, Typography, CircularProgress } from '@mui/material'
import { useHiscores } from '@/context/HiscoresContext'

function OsrsHiscores() {
  const { playerName, setPlayerName, fetchHiscores, isLoading, error } = useHiscores()

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(event.target.value)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    fetchHiscores(playerName)
  }

  return (
    <Container>
      <Box>
        <Box display='flex' alignItems='stretch' gap={2} mb={2}>
          <TextField
            fullWidth
            hiddenLabel
            placeholder='Enter RSN (e.g., Zezima)'
            variant='filled'
            value={playerName}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <Button
            variant='contained'
            color='primary'
            type='submit'
            onClick={handleSubmit}
            disabled={isLoading || !playerName.trim()}
            sx={{
              height: 'auto%',
            }}>
            {isLoading ? <CircularProgress size={24} color='inherit' /> : 'Lookup'}
          </Button>
        </Box>
        {error && <Typography color='error'>{error}</Typography>}
      </Box>
    </Container>
  )
}

export default OsrsHiscores
