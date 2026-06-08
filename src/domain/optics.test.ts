import { describe, it, expect } from 'vitest';
import { modifierSoftness, effectiveSoftness, beamSpreadDeg } from './optics';

describe('modifierSoftness', () => {
  it('returns the apparent angular size (sizeM / distance)', () => {
    expect(modifierSoftness({ modifierSizeCm: 90, distanceM: 1.5 })).toBeCloseTo(0.6, 5);
  });
  it('bigger modifier = softer (larger value)', () => {
    expect(modifierSoftness({ modifierSizeCm: 120, distanceM: 1.5 }))
      .toBeGreaterThan(modifierSoftness({ modifierSizeCm: 60, distanceM: 1.5 }));
  });
  it('closer = softer (larger value)', () => {
    expect(modifierSoftness({ modifierSizeCm: 90, distanceM: 1 }))
      .toBeGreaterThan(modifierSoftness({ modifierSizeCm: 90, distanceM: 3 }));
  });
});

describe('effectiveSoftness', () => {
  const at = (modifier: Parameters<typeof effectiveSoftness>[0]['modifier'], extra = {}) =>
    effectiveSoftness({ modifier, modifierSizeCm: 90, distanceM: 1.5, ...extra });

  it('equals the raw apparent size for a neutral modifier (octa, no feather)', () => {
    expect(at('octa')).toBeCloseTo(modifierSoftness({ modifierSizeCm: 90, distanceM: 1.5 }), 5);
  });
  it('a softbox is softer than a snoot at the same size and distance', () => {
    expect(at('softbox')).toBeGreaterThan(at('snoot'));
  });
  it('a bare reflector is harder than an octa', () => {
    expect(at('bare')).toBeLessThan(at('octa'));
  });
  it('feathering increases softness', () => {
    expect(at('softbox', { feather: 1 })).toBeGreaterThan(at('softbox', { feather: 0 }));
  });
});

describe('beamSpreadDeg', () => {
  it('a snoot throws a narrower beam than a softbox', () => {
    expect(beamSpreadDeg({ modifier: 'snoot' })).toBeLessThan(beamSpreadDeg({ modifier: 'softbox' }));
  });
  it('a grid narrows the beam', () => {
    expect(beamSpreadDeg({ modifier: 'softbox', grid: true }))
      .toBeLessThan(beamSpreadDeg({ modifier: 'softbox', grid: false }));
  });
});
