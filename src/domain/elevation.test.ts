import { describe, it, expect } from 'vitest';
import { elevationToXY, xyToElevation } from './elevation';

const origin = { x: 40, y: 260 };
const scale = 70;

describe('elevation geometry', () => {
  it('maps (distance 0, height 0) to the origin (foot of the subject)', () => {
    expect(elevationToXY(0, 0, scale, origin)).toEqual(origin);
  });
  it('greater height moves up the screen (smaller y)', () => {
    expect(elevationToXY(1, 2, scale, origin).y).toBeLessThan(elevationToXY(1, 1, scale, origin).y);
  });
  it('greater distance moves right (larger x)', () => {
    expect(elevationToXY(2, 1, scale, origin).x).toBeGreaterThan(elevationToXY(1, 1, scale, origin).x);
  });
  it('round-trips through xyToElevation', () => {
    const p = elevationToXY(1.8, 2.1, scale, origin);
    const back = xyToElevation(p, scale, origin);
    expect(back.distanceM).toBeCloseTo(1.8, 5);
    expect(back.heightM).toBeCloseTo(2.1, 5);
  });
});
