import type { Light } from '../domain/types';
import { makeLight } from '../store/defaults';

export interface Preset {
  name: string;
  description: string;
  build: () => Light[];
}

/**
 * Classic one- and two-light portrait setups. Each `build()` returns fresh lights
 * (new ids) so a preset can be loaded repeatedly. Angles are azimuth around the
 * subject (0 = on the camera axis), heights in metres, tilt pitches the aim.
 */
export const PRESETS: Preset[] = [
  {
    name: 'Butterfly',
    description: 'Key high and dead-on; symmetrical shadow under the nose.',
    build: () => [
      makeLight({ role: 'key', modifier: 'beautyDish', modifierSizeCm: 70, angleDeg: 0, distanceM: 1.4, heightM: 2.3, tiltDeg: -32 }),
    ],
  },
  {
    name: 'Loop',
    description: 'Key about 35 degrees off-axis; small loop shadow beside the nose.',
    build: () => [
      makeLight({ role: 'key', modifier: 'octa', modifierSizeCm: 90, angleDeg: 35, distanceM: 1.5, heightM: 1.95, tiltDeg: -12 }),
    ],
  },
  {
    name: 'Rembrandt',
    description: 'Key about 45 degrees and high; triangle of light on the far cheek.',
    build: () => [
      makeLight({ role: 'key', modifier: 'softbox', modifierSizeCm: 80, angleDeg: 45, distanceM: 1.5, heightM: 2.1, tiltDeg: -18 }),
    ],
  },
  {
    name: 'Split',
    description: 'Key at the side; half the face lit, half in shadow.',
    build: () => [
      makeLight({ role: 'key', modifier: 'softbox', modifierSizeCm: 80, angleDeg: 90, distanceM: 1.4, heightM: 1.7, tiltDeg: 0 }),
    ],
  },
  {
    name: 'Clamshell',
    description: 'Key above and fill below, both on-axis; soft beauty look.',
    build: () => [
      makeLight({ role: 'key', modifier: 'octa', modifierSizeCm: 90, angleDeg: 0, distanceM: 1.4, heightM: 2.2, tiltDeg: -25, power: 1 }),
      makeLight({ role: 'fill', modifier: 'strip', modifierSizeCm: 120, angleDeg: 0, distanceM: 1.2, heightM: 1.0, tiltDeg: 22, power: 0.5 }),
    ],
  },
];

export function getPreset(name: string): Preset | undefined {
  return PRESETS.find((p) => p.name === name);
}
