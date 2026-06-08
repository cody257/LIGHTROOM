import { describe, it, expect } from 'vitest';
import { supportsWebGPU, pickRendererKind } from './rendererSelect';

describe('supportsWebGPU', () => {
  it('is true when navigator exposes a gpu', () => {
    expect(supportsWebGPU({ gpu: {} })).toBe(true);
  });
  it('is false without a gpu or navigator', () => {
    expect(supportsWebGPU({})).toBe(false);
    expect(supportsWebGPU(undefined)).toBe(false);
  });
});

describe('pickRendererKind', () => {
  it('prefers webgpu when available', () => {
    expect(pickRendererKind(true)).toBe('webgpu');
  });
  it('falls back to raster otherwise', () => {
    expect(pickRendererKind(false)).toBe('raster');
  });
});
