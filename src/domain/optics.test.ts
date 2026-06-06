import { describe, it, expect } from 'vitest';
import { modifierSoftness } from './optics';

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
