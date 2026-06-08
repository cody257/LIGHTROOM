import { create } from 'zustand';
import type { Light, Rig } from '../domain/types';
import { makeDefaultRig, makeLight } from './defaults';

export const MAX_LIGHTS = 4;

interface RigState {
  rig: Rig;
  selectedLightId: string | null;
  addLight: (partial?: Partial<Light>) => void;
  updateLight: (id: string, patch: Partial<Light>) => void;
  removeLight: (id: string) => void;
  selectLight: (id: string | null) => void;
  setLights: (lights: Light[]) => void;
  setExposure: (ev: number) => void;
  setSubjectModel: (model: string) => void;
}

export const useRig = create<RigState>((set) => ({
  rig: makeDefaultRig(),
  selectedLightId: null,
  addLight: (partial) =>
    set((s) => {
      if (s.rig.lights.length >= MAX_LIGHTS) return s;
      const light = makeLight(partial);
      return { rig: { ...s.rig, lights: [...s.rig.lights, light] }, selectedLightId: light.id };
    }),
  updateLight: (id, patch) =>
    set((s) => ({
      rig: { ...s.rig, lights: s.rig.lights.map((l) => (l.id === id ? { ...l, ...patch } : l)) },
    })),
  removeLight: (id) =>
    set((s) => ({
      rig: { ...s.rig, lights: s.rig.lights.filter((l) => l.id !== id) },
      selectedLightId: s.selectedLightId === id ? null : s.selectedLightId,
    })),
  selectLight: (id) => set({ selectedLightId: id }),
  setLights: (lights) =>
    set((s) => ({ rig: { ...s.rig, lights }, selectedLightId: lights[0]?.id ?? null })),
  setExposure: (ev) => set((s) => ({ rig: { ...s.rig, camera: { ...s.rig.camera, exposure: ev } } })),
  setSubjectModel: (model) =>
    set((s) => ({ rig: { ...s.rig, subject: { ...s.rig.subject, model } } })),
}));
