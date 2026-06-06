import type { Light, Rig } from '../domain/types';

let _seq = 0;
export const nextLightId = () => `light-${++_seq}`;

export function makeLight(partial: Partial<Light> = {}): Light {
  return {
    id: nextLightId(),
    role: 'key',
    modifier: 'octa',
    modifierSizeCm: 90,
    angleDeg: 45,
    distanceM: 1.5,
    heightM: 1.7,
    tiltDeg: 0,
    power: 1,
    kelvin: 5600,
    ...partial,
  };
}

export function makeDefaultRig(): Rig {
  return {
    subject: { model: 'genericHead', headTurnDeg: 0 },
    camera: { angle: 'front', lensMm: 85, exposure: 0 },
    lights: [makeLight()],
  };
}
