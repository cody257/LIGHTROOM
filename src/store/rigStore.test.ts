import { describe, it, expect, beforeEach } from 'vitest';
import { useRig, MAX_LIGHTS } from './rigStore';
import { makeDefaultRig, makeLight } from './defaults';

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
  it('setLights replaces the lights and selects the first', () => {
    const next = [makeLight({ angleDeg: 10 }), makeLight({ angleDeg: 20 })];
    useRig.getState().setLights(next);
    const lights = useRig.getState().rig.lights;
    expect(lights).toHaveLength(2);
    expect(lights[0].angleDeg).toBe(10);
    expect(useRig.getState().selectedLightId).toBe(lights[0].id);
  });
  it('resetRig restores default lights + exposure and clears selection, but keeps the subject', () => {
    const s = useRig.getState();
    s.setSubjectModel('blob:keep');
    s.setExposure(3);
    s.addLight();
    s.selectLight(useRig.getState().rig.lights[0].id);
    useRig.getState().resetRig();
    const after = useRig.getState();
    expect(after.rig.lights).toHaveLength(1);
    expect(after.rig.camera.exposure).toBe(0);
    expect(after.rig.subject.model).toBe('blob:keep');
    expect(after.selectedLightId).toBeNull();
  });
});
