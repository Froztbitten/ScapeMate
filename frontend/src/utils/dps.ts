import { calculateHitChance, HitChanceParams } from './hit-chance'
import { calculateMaxHit, MaxHitParams } from './max-hit'

export interface DpsParams extends HitChanceParams, MaxHitParams {
  attackSpeed: number
}

export const calculateDps = (params: DpsParams): number => {
  const { attackSpeed } = params

  const hitChance = calculateHitChance(params)
  const maxHit = calculateMaxHit(params)

  return ((maxHit / 2 + 1 / (maxHit + 1)) * hitChance) / (attackSpeed * 0.6)
}