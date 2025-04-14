export interface MaxHitParams {
  effectiveStrength: number;
  strengthBonus: number;
}

export const calculateMaxHit = (params: MaxHitParams): number => {
  const { effectiveStrength, strengthBonus } = params
    return Math.floor(0.5 + (effectiveStrength * (strengthBonus + 64)) / 640)
};
