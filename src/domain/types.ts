export type LightRole = 'key' | 'fill' | 'rim' | 'background';

export type Modifier =
  | 'bare' | 'fresnel' | 'softbox' | 'octa' | 'parabolic'
  | 'beautyDish' | 'umbrellaWhite' | 'umbrellaSilver' | 'strip' | 'snoot';

export interface Light {
  id: string;
  role: LightRole;
  modifier: Modifier;
  modifierSizeCm: number;  // largest dimension of the modifier, cm
  angleDeg: number;        // azimuth around subject; 0 = on the camera axis (front), CCW in plan view
  distanceM: number;       // metres from subject
  heightM: number;         // metres above the floor
  tiltDeg: number;         // vertical aim (reserved; 0 for this milestone)
  power: number;           // relative power, 1 = nominal
  kelvin: number;          // colour temperature
}

export interface Subject {
  model: string;           // 'genericHead'
  headTurnDeg: 0 | 45;
}

export interface CameraConfig {
  angle: 'front' | 'profile';
  lensMm: number;
  exposure: number;        // EV offset applied as tone-mapping exposure; 0 = neutral
}

export interface Rig {
  subject: Subject;
  camera: CameraConfig;
  lights: Light[];
}
