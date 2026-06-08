import type { Modifier } from './types';

/** Apparent angular size of the source as seen from the subject. Larger = softer light. */
export function modifierSoftness(light: { modifierSizeCm: number; distanceM: number }): number {
  const sizeM = light.modifierSizeCm / 100;
  return sizeM / Math.max(0.1, light.distanceM);
}

/**
 * How much each modifier type diffuses the source relative to its raw apparent size.
 * 1.0 = neutral (the emitting area is the modifier face); below 1 hardens, above 1 softens.
 */
const SOFTNESS_FACTOR: Record<Modifier, number> = {
  bare: 0.15,
  fresnel: 0.3,
  snoot: 0.12,
  parabolic: 0.5,
  beautyDish: 0.6,
  umbrellaSilver: 0.7,
  strip: 0.85,
  softbox: 1.0,
  octa: 1.0,
  umbrellaWhite: 1.15,
};

export interface ModifierConfig {
  modifier: Modifier;
  modifierSizeCm: number;
  distanceM: number;
  feather?: number; // 0..1, how much the source is feathered (edge turned toward subject)
  grid?: boolean;   // egg-crate grid: restricts spill and tightens the beam
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Effective shadow-edge softness: raw apparent size scaled by the modifier's diffusion
 * character, then opened up further by feathering. Equals modifierSoftness for a neutral
 * modifier (octa/softbox) with no feather.
 */
export function effectiveSoftness(cfg: ModifierConfig): number {
  const base = modifierSoftness(cfg);
  const factor = SOFTNESS_FACTOR[cfg.modifier] ?? 1;
  const feather = clamp01(cfg.feather ?? 0);
  return base * factor * (1 + 0.3 * feather);
}

/** Beam spread as a cone half-angle in degrees. Snoots, fresnels and grids tighten it. */
export function beamSpreadDeg(cfg: { modifier: Modifier; grid?: boolean }): number {
  const WIDE = 55;
  const FOCUSED = 30;
  const SNOOT = 10;
  const GRID_MAX = 18;
  let spread =
    cfg.modifier === 'snoot' ? SNOOT :
    cfg.modifier === 'fresnel' || cfg.modifier === 'parabolic' ? FOCUSED :
    WIDE;
  if (cfg.grid) spread = Math.min(spread, GRID_MAX);
  return spread;
}
