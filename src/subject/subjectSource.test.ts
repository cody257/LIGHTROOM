import { describe, it, expect } from 'vitest';
import {
  resolveModelUrl, isAllowedSubjectFile, GENERIC_HEAD, GENERIC_HEAD_URL, MAX_SUBJECT_BYTES,
} from './subjectSource';

describe('resolveModelUrl', () => {
  it('maps the generic head key to the bundled model', () => {
    expect(resolveModelUrl(GENERIC_HEAD)).toBe(GENERIC_HEAD_URL);
  });
  it('passes a real url through unchanged (uploaded object url)', () => {
    expect(resolveModelUrl('blob:http://x/abc')).toBe('blob:http://x/abc');
  });
  it('treats an empty string as the generic head', () => {
    expect(resolveModelUrl('')).toBe(GENERIC_HEAD_URL);
  });
});

describe('isAllowedSubjectFile', () => {
  it('accepts .glb and .gltf', () => {
    expect(isAllowedSubjectFile({ name: 'me.glb', size: 1000 })).toBe(true);
    expect(isAllowedSubjectFile({ name: 'me.GLTF', size: 1000 })).toBe(true);
  });
  it('rejects other extensions', () => {
    expect(isAllowedSubjectFile({ name: 'me.png', size: 1000 })).toBe(false);
  });
  it('rejects empty or oversize files', () => {
    expect(isAllowedSubjectFile({ name: 'me.glb', size: 0 })).toBe(false);
    expect(isAllowedSubjectFile({ name: 'me.glb', size: MAX_SUBJECT_BYTES + 1 })).toBe(false);
  });
});
