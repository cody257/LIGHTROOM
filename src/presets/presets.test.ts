import { describe, it, expect } from 'vitest';
import { PRESETS, getPreset } from './presets';
import { SUBJECT_HEAD_Y } from '../domain/lightProps';

describe('lighting presets', () => {
  it('every preset builds at least one light', () => {
    for (const p of PRESETS) expect(p.build().length).toBeGreaterThan(0);
  });
  it('Butterfly key is on-axis and above the head', () => {
    const key = getPreset('Butterfly')!.build()[0];
    expect(key.angleDeg).toBe(0);
    expect(key.heightM).toBeGreaterThan(SUBJECT_HEAD_Y);
  });
  it('Rembrandt key is a high three-quarter angle', () => {
    const key = getPreset('Rembrandt')!.build()[0];
    expect(key.angleDeg).toBeGreaterThanOrEqual(30);
    expect(key.angleDeg).toBeLessThanOrEqual(60);
  });
  it('Split key is at the side', () => {
    expect(getPreset('Split')!.build()[0].angleDeg).toBe(90);
  });
  it('Clamshell is a key above and a fill below', () => {
    const [key, fill] = getPreset('Clamshell')!.build();
    expect(key.heightM).toBeGreaterThan(fill.heightM);
    expect(fill.power).toBeLessThan(key.power);
  });
  it('each build call produces fresh light ids', () => {
    const a = getPreset('Loop')!.build()[0];
    const b = getPreset('Loop')!.build()[0];
    expect(a.id).not.toBe(b.id);
  });
  it('getPreset returns undefined for an unknown name', () => {
    expect(getPreset('Nope')).toBeUndefined();
  });
});
