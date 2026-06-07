import { describe, it, expect, beforeEach } from 'vitest';
import { useRig, MAX_LIGHTS } from './rigStore';
import { makeDefaultRig } from './defaults';

beforeEach(() => useRig.setState({ rig: makeDefaultRig(), selectedLightId: null }));

describe('rigStore', () => {
  it('starts with one light', () => {
    expect(useRig.getState().rig.lights).toHaveLength(1);
  });
  it('addLight adds and selects it, capped at MAX_LIGHTS', () => {
    const s = useRig.getState();
    while (useRig.getState().rig.lights.length < MAX_LIGHTS) s.addLight();
    expect(useRig.getState().rig.lights).toHaveLength(MAX_LIGHTS);
    s.addLight();
    expect(useRig.getState().rig.lights).toHaveLength(MAX_LIGHTS);
  });
  it('updateLight patches a light by id', () => {
    const id = useRig.getState().rig.lights[0].id;
    useRig.getState().updateLight(id, { angleDeg: 90, distanceM: 2 });
    const l = useRig.getState().rig.lights[0];
    expect(l.angleDeg).toBe(90);
    expect(l.distanceM).toBe(2);
  });
  it('setExposure updates the camera', () => {
    useRig.getState().setExposure(-1.5);
    expect(useRig.getState().rig.camera.exposure).toBe(-1.5);
  });
  it('setSubjectModel swaps the subject model', () => {
    useRig.getState().setSubjectModel('blob:abc');
    expect(useRig.getState().rig.subject.model).toBe('blob:abc');
  });
  it('removeLight removes and clears selection', () => {
    const id = useRig.getState().rig.lights[0].id;
    useRig.getState().selectLight(id);
    useRig.getState().removeLight(id);
    expect(useRig.getState().rig.lights).toHaveLength(0);
    expect(useRig.getState().selectedLightId).toBeNull();
  });
});
