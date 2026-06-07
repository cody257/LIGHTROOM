import type { Light } from './types';
import { kelvinToRgb } from './color';
import { modifierSoftness } from './optics';

export const SUBJECT_HEAD_Y = 1.5;
export const BASE_INTENSITY = 3;

export interface LightProps {
  position: [number, number, number];
  target: [number, number, number];
  color: [number, number, number]; // 0..1
  intensity: number;
  softness: number;
}

export function buildLightProps(light: Light, headY = SUBJECT_HEAD_Y): LightProps {
  const a = (light.angleDeg * Math.PI) / 180;
  const x = Math.sin(a) * light.distanceM;
  const z = Math.cos(a) * light.distanceM;
  const [r, g, b] = kelvinToRgb(light.kelvin);
  // tilt pitches the aim above (+) or below (-) the head, in the vertical plane.
  const aimY = headY + Math.tan((light.tiltDeg * Math.PI) / 180) * light.distanceM;
  return {
    position: [x, light.heightM, z],
    target: [0, aimY, 0],
    color: [r / 255, g / 255, b / 255],
    intensity: light.power * BASE_INTENSITY,
    softness: modifierSoftness(light),
  };
}
