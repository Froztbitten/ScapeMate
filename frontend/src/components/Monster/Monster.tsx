import React, { useState, useEffect, useContext } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { Grid, Card, CardContent, Typography, Box } from '@mui/material'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import { useMonsterData } from '@/context/MonsterDataContext'
import { AuthContext } from '@/context/AuthContext'
import { ref, update, get } from 'firebase/database'
import { database } from '@/utils/firebaseConfig'

interface Monster {
  name: string
  variants: { [key: string]: { [key: string]: any } }
}

const MonsterAutocomplete: React.FC = () => {
  const { monsters } = useMonsterData()
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const { user, loading } = useContext(AuthContext)

  useEffect(() => {
    if (!loading && monsters && user) {
      loadMonsterFromRTDB()
    }
  }, [user, monsters, loading])

  const loadMonsterFromRTDB = async () => {
    if (user) {
      const monsterRef = ref(
        database,
        `players/${user.uid}/loadouts/default/monsters`
      )
      await get(monsterRef)
        .then(snapshot => {
          if (snapshot.exists()) {
            const monsterId = snapshot.val()[0]
            const foundMonster = monsters.find(m => {
              for (const variant in m.variants) {
                return m.variants[variant].NPC_ID === monsterId
              }
            })
            if (foundMonster) {
              setSelectedMonster(foundMonster)

              const foundVariantName = Object.keys(
                foundMonster.variants ?? {}
              ).find(
                variant => foundMonster.variants[variant].NPC_ID === monsterId
              )
              if (foundVariantName) {
                setSelectedVariant(foundVariantName)
              }
            }
          }
        })
        .catch(error => {
          console.error('Error loading monster:', error)
        })
    }
  }

  const saveMonsterToRTDB = async () => {
    if (user) {
      const monsterRef = ref(database, `players/${user.uid}/loadouts/default`)

      const monstersIds = []
      const monsterId =
        selectedMonster?.variants[selectedVariant ?? 'No variant'].NPC_ID
      monstersIds.push(monsterId)

      await update(monsterRef, { monsters: monstersIds })
        .then(() => {
          console.log('Monster saved successfully!')
        })
        .catch(error => {
          console.error('Error saving monster: ', error)
        })
    } else {
      console.warn('User not authenticated, cannot save monster.')
    }
  }

  const handleChangeMonster = (_event: any, value: Monster | null) => {
    setSelectedMonster(value)
    setSelectedVariant(null)
    saveMonsterToRTDB()
  }

  const handleChangeVariant = (event: any) => {
    setSelectedVariant(event.target.value)
    saveMonsterToRTDB()
  }

  const variantOptions = selectedMonster
    ? Object.keys(selectedMonster.variants)
    : []

  const isSingleNoVariant =
    variantOptions.length === 1 && variantOptions[0] === 'No variant'

  const variantData =
    selectedMonster && (selectedVariant || isSingleNoVariant)
      ? selectedMonster.variants[selectedVariant ?? 'No variant']
      : null

  const getImage = (variantData: any) => {
    if (!variantData) return undefined
    if (!variantData['Image']) return undefined
    return `https://oldschool.runescape.wiki/images/${variantData['Image']}`
  }

  const getElementalWeaknessImage = (variantData: any): string => {
    const weakness = variantData?.Elemental_weakness

    switch (weakness) {
      case 'Water':
        return 'https://oldschool.runescape.wiki/images/3/39/Water_rune.png'
      case 'Earth':
        return 'https://oldschool.runescape.wiki/images/e/e1/Earth_rune.png'
      case 'Fire':
        return 'https://oldschool.runescape.wiki/images/4/45/Fire_rune.png'
      case 'Air':
        return 'https://oldschool.runescape.wiki/images/f/ff/Air_rune.png'
      default:
        return 'https://oldschool.runescape.wiki/images/4/41/Rune_essence.png'
    }
  }

  const dynamicElementalWeaknessImage = variantData
    ? getElementalWeaknessImage(variantData)
    : 'https://oldschool.runescape.wiki/images/4/41/Rune_essence.png'

  return (
    <Box sx={{ maxWidth: 650, margin: '0 auto', padding: 2 }}>
      <Autocomplete
        disablePortal
        id='monster-autocomplete'
        options={monsters}
        getOptionLabel={monster => monster.name}
        onChange={handleChangeMonster}
        value={selectedMonster?.name ? selectedMonster : null}
        renderInput={params => (
          <TextField
            {...params}
            label='Search for a Monster'
            variant='outlined'
          />
        )}
      />

      {selectedMonster && variantOptions.length > 1 && !isSingleNoVariant && (
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id='variant-select-label'>Variant</InputLabel>
          <Select
            labelId='variant-select-label'
            id='variant-select'
            value={selectedVariant ?? ''}
            label='Variant'
            onChange={handleChangeVariant}>
            {variantOptions.map(variant => (
              <MenuItem key={variant} value={variant}>
                {variant}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {selectedMonster && variantData && (
        <Box mt={3}>
          <h2>{selectedMonster.name}</h2>
          {getImage(variantData) && (
            <img
              src={getImage(variantData)}
              alt={selectedMonster.name}
              style={{ width: '200px', height: '200px', objectFit: 'contain' }}
            />
          )}
          {!isSingleNoVariant && selectedVariant && (
            <h3>Variant: {selectedVariant}</h3>
          )}

          <Grid container spacing={2}>
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Typography variant='subtitle2'>Hitpoints:</Typography>
                  <Grid container alignItems='center' justifyContent='center'>
                    <img
                      src='https://oldschool.runescape.wiki/images/1/1e/Hitpoints_icon.png?4a6a9'
                      alt='Hitpoints'
                      style={{
                        width: '32px',
                        height: '32px',
                        marginRight: '5px',
                      }}
                    />
                    <Typography>{variantData.Hitpoints ?? 'N/A'}</Typography>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Typography variant='subtitle2'>Defence Level:</Typography>
                  <Grid container alignItems='center' justifyContent='center'>
                    <img
                      src='https://oldschool.runescape.wiki/images/Defence_icon.png?ca0cd'
                      alt='Defence Level'
                      style={{
                        width: '32px',
                        height: '32px',
                        marginRight: '5px',
                      }}
                    />
                    <Typography>
                      {variantData.Defence_level ?? 'N/A'}
                    </Typography>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Typography variant='subtitle2'>Magic Level:</Typography>
                  <Grid container alignItems='center' justifyContent='center'>
                    <img
                      src='https://oldschool.runescape.wiki/images/Magic_icon.png?334cf'
                      alt='Magic Level'
                      style={{
                        width: '32px',
                        height: '32px',
                        marginRight: '5px',
                      }}
                    />
                    <Typography>{variantData.Magic_level ?? 'N/A'}</Typography>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={4}>
              <Card>
                <CardContent>
                  <Typography variant='subtitle2'>Stab Defence:</Typography>
                  <Grid container alignItems='center' justifyContent='center'>
                    <img
                      src='https://oldschool.runescape.wiki/images/White_dagger.png?db3e5'
                      alt='Stab Defence'
                      style={{
                        width: '32px',
                        height: '32px',
                        marginRight: '5px',
                      }}
                    />
                    <Typography>
                      {variantData.Stab_defence_bonus ?? 'N/A'}
                    </Typography>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Typography variant='subtitle2'>Slash Defence:</Typography>
                  <Grid container alignItems='center' justifyContent='center'>
                    <img
                      src='https://oldschool.runescape.wiki/images/White_scimitar.png?2dc8c'
                      alt='Slash Defence'
                      style={{
                        width: '32px',
                        height: '32px',
                        marginRight: '5px',
                      }}
                    />
                    <Typography>
                      {variantData.Slash_defence_bonus ?? 'N/A'}
                    </Typography>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Typography variant='subtitle2'>Crush Defence:</Typography>
                  <Grid container alignItems='center' justifyContent='center'>
                    <img
                      src='https://oldschool.runescape.wiki/images/White_warhammer.png?2ff77'
                      alt='Crush Defence'
                      style={{
                        width: '32px',
                        height: '32px',
                        marginRight: '5px',
                      }}
                    />
                    <Typography>
                      {variantData.Crush_defence_bonus ?? 'N/A'}
                    </Typography>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={4}>
              <Card>
                <CardContent>
                  <Typography variant='subtitle2'>
                    Light Range Defence:
                  </Typography>
                  <Grid container alignItems='center' justifyContent='center'>
                    <img
                      src='https://oldschool.runescape.wiki/images/Steel_dart.png?3203e'
                      alt='Light Range Defence'
                      style={{
                        width: '32px',
                        height: '32px',
                        marginRight: '5px',
                      }}
                    />
                    <Typography>
                      {variantData.Light_range_defence_bonus ?? 'N/A'}
                    </Typography>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Typography variant='subtitle2'>
                    Standard Range Defence:
                  </Typography>
                  <Grid container alignItems='center' justifyContent='center'>
                    <img
                      src='https://oldschool.runescape.wiki/images/Steel_arrow_5.png?2c4a2'
                      alt='Standard Range Defence'
                      style={{
                        width: '32px',
                        height: '32px',
                        marginRight: '5px',
                      }}
                    />
                    <Typography>
                      {variantData.Standard_range_defence_bonus ?? 'N/A'}
                    </Typography>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Typography variant='subtitle2'>
                    Heavy Range Defence:
                  </Typography>
                  <Grid container alignItems='center' justifyContent='center'>
                    <img
                      src='https://oldschool.runescape.wiki/images/Steel_bolts_5.png?f1c11'
                      alt='Heavy Range Defence'
                      style={{
                        width: '32px',
                        height: '32px',
                        marginRight: '5px',
                      }}
                    />
                    <Typography>
                      {variantData.Heavy_range_defence_bonus ?? 'N/A'}
                    </Typography>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={2} />
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Typography variant='subtitle2'>Magic Defence:</Typography>
                  <Grid container alignItems='center' justifyContent='center'>
                    <img
                      src='https://oldschool.runescape.wiki/images/Magic_defence_icon.png?65b01'
                      alt='Magic Defence'
                      style={{
                        width: '32px',
                        height: '32px',
                        marginRight: '5px',
                      }}
                    />
                    <Typography>
                      {variantData.Magic_defence_bonus ?? 'N/A'}
                    </Typography>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Typography variant='subtitle2'>
                    Elemental Weakness (%):
                  </Typography>
                  <Grid container alignItems='center' justifyContent='center'>
                    <img
                      src={dynamicElementalWeaknessImage}
                      alt='Elemental Weakness'
                      style={{
                        width: '32px',
                        height: '32px',
                        marginRight: '5px',
                      }}
                    />
                    <Typography>
                      {variantData.Elemental_weakness_percent ?? 'N/A'}
                    </Typography>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={2} />
          </Grid>
        </Box>
      )}
    </Box>
  )
}

export default MonsterAutocomplete
