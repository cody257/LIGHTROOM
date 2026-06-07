import { describe, it, expect } from 'vitest';
import { buildLightProps, SUBJECT_HEAD_Y } from './lightProps';
import type { Light } from './types';

const base: Light = {
  id: 'l1', role: 'key', modifier: 'octa', modifierSizeCm: 90,
  angleDeg: 0, distanceM: 2, heightM: 1.7, tiltDeg: 0, power: 1, kelvin: 5600,
};

describe('buildLightProps', () => {
  it('angle 0 places the light in front (+Z) at the given height', () => {
    const p = buildLightProps(base);
    expect(p.position[0]).toBeCloseTo(0, 5);
    expect(p.position[1]).toBeCloseTo(1.7, 5);
    expect(p.position[2]).toBeCloseTo(2, 5);
  });
  it('angle 90 places the light to the +X side', () => {
    const p = buildLightProps({ ...base, angleDeg: 90 });
    expect(p.position[0]).toBeCloseTo(2, 5);
    expect(p.position[2]).toBeCloseTo(0, 5);
  });
  it('aims at the head and normalises colour to 0..1', () => {
    const p = buildLightProps(base);
    expect(p.target).toEqual([0, SUBJECT_HEAD_Y, 0]);
    for (const c of p.color) { expect(c).toBeGreaterThanOrEqual(0); expect(c).toBeLessThanOrEqual(1); }
  });
  it('positive tilt aims above the head, negative tilt below', () => {
    const up = buildLightProps({ ...base, tiltDeg: 30 });
    const down = buildLightProps({ ...base, tiltDeg: -30 });
    expect(up.target[1]).toBeGreaterThan(SUBJECT_HEAD_Y);
    expect(down.target[1]).toBeLessThan(SUBJECT_HEAD_Y);
  });
});
