import React, { useState, useEffect, useCallback } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Tooltip,
} from '@mui/material'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import { useMonsterData } from '@/context/TargetDataContext'

interface Monster {
  name: string
  variants: { [key: string]: { [key: string]: any } }
  selectedVariant: string | null
}

const MonsterAutocomplete: React.FC = () => {
  const { selectedMonsters, allMonsters, saveMonsterToRTDB } = useMonsterData()
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [monsterSubtitle, setMonsterSubtitle] = useState<string>('')

  const buildMonsterSubtitle = useCallback(
    (monster: Monster | null, variantData: any) => {
      if (!monster || !variantData) return ''

      const attribute = variantData.Monster_attribute
      const size = variantData.Size
      let subtitleParts: string[] = []

      if (attribute) {
        subtitleParts.push(attribute)
      }

      if (size) {
        subtitleParts.push(`${size}x${size}`)
      }

      return subtitleParts.join(', ')
    },
    []
  )

  useEffect(() => {
    if (selectedMonsters.length > 0) {
      setSelectedMonster(selectedMonsters[0])
      if (selectedMonsters[0].selectedVariant) {
        setSelectedVariant(selectedMonsters[0].selectedVariant)
      }
    }
  }, [selectedMonsters])

  useEffect(() => {
    if (!selectedMonster) return

    setMonsterSubtitle(buildMonsterSubtitle(selectedMonster, selectedVariant))
  }, [selectedMonster, selectedVariant, buildMonsterSubtitle])

  const handleChangeMonster = (_event: any, newValue: Monster | null) => {
    setSelectedMonster(newValue)
    setSelectedVariant(null)
    saveMonsterToRTDB(newValue)
  }

  const handleChangeVariant = (event: any) => {
    setSelectedVariant(event.target.value)
    if (selectedMonster) {
      const updatedMonster = {
        ...selectedMonster,
        selectedVariant: event.target.value,
      }
      setSelectedMonster(updatedMonster)
      saveMonsterToRTDB(updatedMonster)
    }
  }

  const variantOptions = selectedMonster
    ? allMonsters.find(m => m.name === selectedMonster.name)?.variants
    : undefined

  const variantOptionsArray = variantOptions ? Object.keys(variantOptions) : []

  const isSingleNoVariant = variantOptionsArray.length === 1

  const variantData = selectedMonster?.selectedVariant
    ? selectedMonster?.variants[selectedMonster?.selectedVariant]
    : selectedMonster?.variants['No variant']

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
    <Box sx={{ minWidth: 300, maxWidth: 650, margin: '0 auto', padding: 2 }}>
      <Autocomplete
        disablePortal
        id='monster-autocomplete'
        options={allMonsters}
        getOptionLabel={monster => monster.name}
        onChange={handleChangeMonster}
        value={selectedMonster?.name ? selectedMonster : null}
        renderInput={params => (
          <TextField {...params} label='Search for a Monster' variant='outlined' />
        )}
      />

      {selectedMonster && variantOptionsArray.length > 1 && !isSingleNoVariant && (
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id='variant-select-label'>Variant</InputLabel>
          <Select
            labelId='variant-select-label'
            id='variant-select'
            value={selectedVariant ?? ''}
            label='Variant'
            onChange={handleChangeVariant}>
            {variantOptionsArray.map(variant => (
              <MenuItem key={variant} value={variant}>
                {variant}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {selectedMonster && variantData && (
        <Box mt={3}>
          <Typography variant='h4' component='h2'>
            {selectedMonster.name}
          </Typography>
          {monsterSubtitle && <Typography variant='subtitle1'>{monsterSubtitle}</Typography>}
          {getImage(variantData) && (
            <img
              src={getImage(variantData)}
              alt={selectedMonster.name}
              style={{ width: '200px', height: '200px', objectFit: 'contain' }}
            />
          )}
          {!isSingleNoVariant && selectedVariant && <h3>Variant: {selectedVariant}</h3>}

          <Grid container spacing={2}>
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Tooltip title='Hitpoints' placement="top">
                    <Grid container alignItems='center' justifyContent='center'>
                      <img
                        src='https://oldschool.runescape.wiki/images/1/1e/Hitpoints_icon.png?4a6a9'
                        alt='Hitpoints'
                        style={{
                          marginRight: '5px',
                        }}
                      />
                      <Typography>{variantData.Hitpoints ?? 'N/A'}</Typography>
                    </Grid>
                  </Tooltip>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Tooltip title='Defence Level' placement="top">
                    <Grid container alignItems='center' justifyContent='center'>
                      <img
                        src='https://oldschool.runescape.wiki/images/Defence_icon.png?ca0cd'
                        alt='Defence Level'
                        style={{
                          marginRight: '5px',
                        }}
                      />
                      <Typography>{variantData.Defence_level ?? 'N/A'}</Typography>
                    </Grid>
                  </Tooltip>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Tooltip title='Magic Level' placement="top">
                    <Grid container alignItems='center' justifyContent='center'>
                      <img
                        src='https://oldschool.runescape.wiki/images/Magic_icon.png?334cf'
                        alt='Magic Level'
                        style={{
                          marginRight: '5px',
                        }}
                      />
                      <Typography>{variantData.Magic_level ?? 'N/A'}</Typography>
                    </Grid>
                  </Tooltip>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={4}>
              <Card>
                <CardContent>
                  <Tooltip title='Stab Defence' placement="top">
                    <Grid container alignItems='center' justifyContent='center'>
                      <img
                        src='https://oldschool.runescape.wiki/images/White_dagger.png?db3e5'
                        alt='Stab Defence'
                        style={{
                          marginRight: '5px',
                        }}
                      />
                      <Typography>{variantData.Stab_defence_bonus ?? 'N/A'}</Typography>
                    </Grid>
                  </Tooltip>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Tooltip title='Slash Defence' placement="top">
                    <Grid container alignItems='center' justifyContent='center'>
                      <img
                        src='https://oldschool.runescape.wiki/images/White_scimitar.png?2dc8c'
                        alt='Slash Defence'
                        style={{
                          marginRight: '5px',
                        }}
                      />
                      <Typography>{variantData.Slash_defence_bonus ?? 'N/A'}</Typography>
                    </Grid>
                  </Tooltip>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Tooltip title='Crush Defence' placement="top">
                    <Grid container alignItems='center' justifyContent='center'>
                      <img
                        src='https://oldschool.runescape.wiki/images/White_warhammer.png?2ff77'
                        alt='Crush Defence'
                        style={{
                          marginRight: '5px',
                        }}
                      />
                      <Typography>{variantData.Crush_defence_bonus ?? 'N/A'}</Typography>
                    </Grid>
                  </Tooltip>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={4}>
              <Card>
                <CardContent>
                  <Tooltip title='Light Range Defence' placement="top">
                    <Grid container alignItems='center' justifyContent='center'>
                      <img
                        src='https://oldschool.runescape.wiki/images/Steel_dart.png?3203e'
                        alt='Light Range Defence'
                        style={{
                          marginRight: '5px',
                        }}
                      />
                      <Typography>{variantData.Light_range_defence_bonus ?? 'N/A'}</Typography>
                    </Grid>
                  </Tooltip>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Tooltip title='Standard Range Defence' placement="top">
                    <Grid container alignItems='center' justifyContent='center'>
                      <img
                        src='https://oldschool.runescape.wiki/images/Steel_arrow_5.png?2c4a2'
                        alt='Standard Range Defence'
                        style={{
                          marginRight: '5px',
                        }}
                      />
                      <Typography>{variantData.Standard_range_defence_bonus ?? 'N/A'}</Typography>
                    </Grid>
                  </Tooltip>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Tooltip title='Heavy Range Defence' placement="top">
                    <Grid container alignItems='center' justifyContent='center'>
                      <img
                        src='https://oldschool.runescape.wiki/images/Steel_bolts_5.png?f1c11'
                        alt='Heavy Range Defence'
                        style={{
                          marginRight: '5px',
                        }}
                      />
                      <Typography>{variantData.Heavy_range_defence_bonus ?? 'N/A'}</Typography>
                    </Grid>
                  </Tooltip>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={2} />
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Tooltip title='Magic Defence' placement="top">
                    <Grid container alignItems='center' justifyContent='center'>
                      <img
                        src='https://oldschool.runescape.wiki/images/Magic_defence_icon.png?65b01'
                        alt='Magic Defence'
                        style={{
                          marginRight: '5px',
                        }}
                      />
                      <Typography>{variantData.Magic_defence_bonus ?? 'N/A'}</Typography>
                    </Grid>
                  </Tooltip>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={4}>
              <Card>
                <CardContent>
                  <Tooltip title='Elemental Weakness (%)' placement="top">
                    <Grid container alignItems='center' justifyContent='center'>
                      <img
                        src={dynamicElementalWeaknessImage}
                        alt='Elemental Weakness'
                        style={{
                          marginRight: '5px',
                        }}
                      />
                      <Typography>{variantData.Elemental_weakness_percent ?? 'N/A'}</Typography>
                    </Grid>
                  </Tooltip>
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
