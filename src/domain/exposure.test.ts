import { describe, it, expect } from 'vitest';
import { exposureMultiplier } from './exposure';

describe('exposureMultiplier', () => {
  it('0 EV = 1x', () => expect(exposureMultiplier(0)).toBe(1));
  it('+1 EV doubles', () => expect(exposureMultiplier(1)).toBe(2));
  it('-1 EV halves', () => expect(exposureMultiplier(-1)).toBe(0.5));
});
