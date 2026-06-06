import { describe, it, expect } from 'vitest';
import { polarToXY, xyToPolar } from './geometry';

const C = { x: 200, y: 200 };

describe('polarToXY', () => {
  it('angle 0 places the light toward the camera (below centre)', () => {
    expect(polarToXY(0, 1, 100, C)).toEqual({ x: 200, y: 300 });
  });
  it('angle 90 places the light to the right', () => {
    const p = polarToXY(90, 1, 100, C);
    expect(p.x).toBeCloseTo(300, 5);
    expect(p.y).toBeCloseTo(200, 5);
  });
});

describe('xyToPolar', () => {
  it('inverts polarToXY', () => {
    const r = xyToPolar({ x: 300, y: 200 }, C, 100);
    expect(r.angleDeg).toBeCloseTo(90, 5);
    expect(r.distanceM).toBeCloseTo(1, 5);
  });
  it('normalises angle to 0..360', () => {
    const r = xyToPolar({ x: 100, y: 200 }, C, 100); // to the left -> 270
    expect(r.angleDeg).toBeCloseTo(270, 5);
  });
});
