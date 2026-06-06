import { describe, it, expect } from 'vitest';
import { kelvinToRgb } from './color';

describe('kelvinToRgb', () => {
  it('daylight ~6600K is near-white', () => {
    const [r, g, b] = kelvinToRgb(6600);
    expect(r).toBe(255);
    expect(g).toBeGreaterThan(248);
    expect(b).toBeGreaterThan(245);
  });

  it('tungsten ~3200K is warm (low blue)', () => {
    const [r, g, b] = kelvinToRgb(3200);
    expect(r).toBe(255);
    expect(g).toBeGreaterThan(150);
    expect(g).toBeLessThan(210);
    expect(b).toBeLessThan(150);
  });

  it('clamps channels to 0..255', () => {
    for (const k of [1000, 2000, 5600, 10000, 20000]) {
      for (const c of kelvinToRgb(k)) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(255);
      }
    }
  });
});
