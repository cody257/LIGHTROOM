# LIGHT ROOM — Plan 01: Tracer Bullet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A working web app where you place a light on a top-down diagram, press **Capture**, and see the subject (a blockout head) rendered under that light with truthful exposure — proving the whole rig → render pipeline end-to-end.

**Architecture:** A single Zustand `Rig` store is the source of truth. A 2D SVG `PlanView` edits light angle/distance. On **Capture**, a one-shot Three.js render builds a scene from the rig (lights mapped from modifier params, ACES tone-mapping driven by the exposure dial) and returns a PNG shown in the UI. The renderer hides behind a `CaptureRenderer` interface so the WebGPU path-tracer can replace it later.

**Tech Stack:** TypeScript · React + Vite · Three.js (WebGLRenderer for this one-shot; WebGPU swap is a later plan) · Zustand · Vitest + Testing Library.

**Repo conventions:** This repo is git-initialized on `main`. End each commit message with the trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Pure logic is TDD'd; the GPU render is verified manually (the spike gate in Task 11).

---

## Milestone roadmap (context — only Plan 01 is detailed here)

- **Plan 01 — Tracer bullet (this doc):** place one light on the plan diagram → Capture the blockout head with truthful exposure. Proves the pipeline + the soft-shadow spike.
- **Plan 02 — Real subject + dual-2D:** swap the blockout head for a generic glTF head; add the side-elevation editor, head-turn + camera-angle, backdrop + floor + black room; switch renderer to Three.js `WebGPURenderer` (WebGL2 fallback).
- **Plan 03 — Modifier depth:** full modifier set, diffusion (material + density), flags (solid + net), bounce/reflectors, gels, grids/barn doors, up to 4 lights with roles.
- **Plan 04 — Presets + gallery:** named-pattern presets, capture gallery, compare, PNG export (photo + diagram), save/load (IndexedDB + localStorage).
- **Plan 05+ — Phase 2 (own specs):** WebGPU path-traced capture; MediaPipe face personalization; auto pattern/ratio labels.

---

## File structure (Plan 01)

| File | Responsibility |
|---|---|
| `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` | Scaffold + tooling |
| `src/main.tsx`, `src/App.tsx` | App entry + layout / capture flow |
| `src/domain/types.ts` | `Rig`, `Light`, `Subject`, `CameraConfig` types |
| `src/domain/color.ts` | `kelvinToRgb` |
| `src/domain/exposure.ts` | `exposureMultiplier` |
| `src/domain/optics.ts` | `modifierSoftness` |
| `src/domain/geometry.ts` | `polarToXY`, `xyToPolar` (plan-view ↔ world) |
| `src/domain/lightProps.ts` | `buildLightProps` (Light → 3D light params) |
| `src/store/defaults.ts` | `makeLight`, `makeDefaultRig` |
| `src/store/rigStore.ts` | Zustand store + actions |
| `src/subject/blockoutHead.ts` | Primitive head with a nose (shows shadow shaping) |
| `src/render/CaptureRenderer.ts` | Renderer interface |
| `src/render/rasterCaptureRenderer.ts` | One-shot Three.js implementation |
| `src/diagram/PlanView.tsx` | Top-down SVG editor (drag → store) |
| `src/panels/LightProperties.tsx` | Selected-light controls + exposure |
| `src/*/**.test.ts` | Vitest unit tests |

---

## Task 1: Project scaffold + tooling

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vitest.setup.ts`, `src/smoke.test.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "light-room",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "three": "^0.171.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/three": "^0.171.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create config files**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/vitest.setup.ts'],
  },
});
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2021",
    "useDefineForClassFields": true,
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LIGHT ROOM</title>
  </head>
  <body style="margin:0;background:#0f1115;color:#e8eaed;font-family:system-ui,sans-serif">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/vitest.setup.ts`:
```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 3: Create app entry + placeholder App**

`src/main.tsx`:
```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`src/App.tsx`:
```tsx
export function App() {
  return <h1>LIGHT ROOM</h1>;
}
```

- [ ] **Step 4: Add a smoke test**

`src/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Install and verify**

Run: `npm install && npm test`
Expected: smoke test passes (1 passed).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Vitest"
```

---

## Task 2: Domain types

**Files:**
- Create: `src/domain/types.ts`

- [ ] **Step 1: Write the types**

```ts
export type LightRole = 'key' | 'fill' | 'rim' | 'background';

export type Modifier =
  | 'bare' | 'fresnel' | 'softbox' | 'octa' | 'parabolic'
  | 'beautyDish' | 'umbrellaWhite' | 'umbrellaSilver' | 'strip' | 'snoot';

export interface Light {
  id: string;
  role: LightRole;
  modifier: Modifier;
  modifierSizeCm: number;  // largest dimension of the modifier, cm
  angleDeg: number;        // azimuth around subject; 0 = on the camera axis (front), CCW in plan view
  distanceM: number;       // metres from subject
  heightM: number;         // metres above the floor
  tiltDeg: number;         // vertical aim (reserved; 0 for this milestone)
  power: number;           // relative power, 1 = nominal
  kelvin: number;          // colour temperature
}

export interface Subject {
  model: string;           // 'genericHead'
  headTurnDeg: 0 | 45;
}

export interface CameraConfig {
  angle: 'front' | 'profile';
  lensMm: number;
  exposure: number;        // EV offset applied as tone-mapping exposure; 0 = neutral
}

export interface Rig {
  subject: Subject;
  camera: CameraConfig;
  lights: Light[];
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/domain/types.ts
git commit -m "feat(domain): add Rig/Light/Subject/Camera types"
```

---

## Task 3: `kelvinToRgb`

**Files:**
- Create: `src/domain/color.ts`, `src/domain/color.test.ts`

- [ ] **Step 1: Write the failing test**

`src/domain/color.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- color`
Expected: FAIL ("kelvinToRgb is not a function" / module not found).

- [ ] **Step 3: Write the implementation (Tanner Helland approximation)**

`src/domain/color.ts`:
```ts
/** Approximate sRGB (0..255) for a black-body colour temperature in Kelvin. */
export function kelvinToRgb(kelvin: number): [number, number, number] {
  const t = Math.min(40000, Math.max(1000, kelvin)) / 100;
  const clamp = (v: number) => Math.min(255, Math.max(0, v));

  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  return [clamp(r), clamp(g), clamp(b)];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- color`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add src/domain/color.ts src/domain/color.test.ts
git commit -m "feat(domain): kelvinToRgb colour-temperature conversion"
```

---

## Task 4: `exposureMultiplier`

**Files:**
- Create: `src/domain/exposure.ts`, `src/domain/exposure.test.ts`

- [ ] **Step 1: Write the failing test**

`src/domain/exposure.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { exposureMultiplier } from './exposure';

describe('exposureMultiplier', () => {
  it('0 EV = 1x', () => expect(exposureMultiplier(0)).toBe(1));
  it('+1 EV doubles', () => expect(exposureMultiplier(1)).toBe(2));
  it('-1 EV halves', () => expect(exposureMultiplier(-1)).toBe(0.5));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- exposure`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

`src/domain/exposure.ts`:
```ts
/** Convert an exposure-value (stops) offset into a linear render-exposure multiplier. */
export function exposureMultiplier(ev: number): number {
  return Math.pow(2, ev);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- exposure`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/exposure.ts src/domain/exposure.test.ts
git commit -m "feat(domain): exposureMultiplier (EV stops -> linear)"
```

---

## Task 5: `modifierSoftness`

**Files:**
- Create: `src/domain/optics.ts`, `src/domain/optics.test.ts`

- [ ] **Step 1: Write the failing test**

`src/domain/optics.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- optics`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

`src/domain/optics.ts`:
```ts
/** Apparent angular size of the source as seen from the subject. Larger = softer light. */
export function modifierSoftness(light: { modifierSizeCm: number; distanceM: number }): number {
  const sizeM = light.modifierSizeCm / 100;
  return sizeM / Math.max(0.1, light.distanceM);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- optics`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/optics.ts src/domain/optics.test.ts
git commit -m "feat(domain): modifierSoftness from size/distance"
```

---

## Task 6: Plan-view geometry (`polarToXY` / `xyToPolar`)

**Files:**
- Create: `src/domain/geometry.ts`, `src/domain/geometry.test.ts`

- [ ] **Step 1: Write the failing test**

`src/domain/geometry.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { polarToXY, xyToPolar } from './geometry';

const C = { x: 200, y: 200 };

describe('polarToXY', () => {
  it('angle 0 places the light toward the camera (below centre)', () => {
    expect(polarToXY(0, 1, 100, C)).toEqual({ x: 200, y: 300 });
  });
  it('angle 90 places the light to the right', () => {
    const p = polarToXY(90, 1, 100, C);
    expect(p.x).toBeCloseTo(300, 5);
    expect(p.y).toBeCloseTo(200, 5);
  });
});

describe('xyToPolar', () => {
  it('inverts polarToXY', () => {
    const r = xyToPolar({ x: 300, y: 200 }, C, 100);
    expect(r.angleDeg).toBeCloseTo(90, 5);
    expect(r.distanceM).toBeCloseTo(1, 5);
  });
  it('normalises angle to 0..360', () => {
    const r = xyToPolar({ x: 100, y: 200 }, C, 100); // to the left -> 270
    expect(r.angleDeg).toBeCloseTo(270, 5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- geometry`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

`src/domain/geometry.ts`:
```ts
export interface Pt { x: number; y: number; }

/** Plan view: +angle is CCW from the camera axis; +world-Z (front) maps to +screen-Y (down toward camera). */
export function polarToXY(angleDeg: number, distanceM: number, scale: number, c: Pt): Pt {
  const a = (angleDeg * Math.PI) / 180;
  return {
    x: c.x + Math.sin(a) * distanceM * scale,
    y: c.y + Math.cos(a) * distanceM * scale,
  };
}

export function xyToPolar(p: Pt, c: Pt, scale: number): { angleDeg: number; distanceM: number } {
  const wx = (p.x - c.x) / scale;
  const wz = (p.y - c.y) / scale;
  let angleDeg = (Math.atan2(wx, wz) * 180) / Math.PI;
  if (angleDeg < 0) angleDeg += 360;
  return { angleDeg, distanceM: Math.hypot(wx, wz) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- geometry`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/geometry.ts src/domain/geometry.test.ts
git commit -m "feat(domain): plan-view polar<->xy geometry"
```

---

## Task 7: `buildLightProps` (Light → 3D light params)

**Files:**
- Create: `src/domain/lightProps.ts`, `src/domain/lightProps.test.ts`

- [ ] **Step 1: Write the failing test**

`src/domain/lightProps.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildLightProps, SUBJECT_HEAD_Y } from './lightProps';
import type { Light } from './types';

const base: Light = {
  id: 'l1', role: 'key', modifier: 'octa', modifierSizeCm: 90,
  angleDeg: 0, distanceM: 2, heightM: 1.7, tiltDeg: 0, power: 1, kelvin: 5600,
};

describe('buildLightProps', () => {
  it('angle 0 places the light in front (+Z) at the given height', () => {
    const p = buildLightProps(base);
    expect(p.position[0]).toBeCloseTo(0, 5);
    expect(p.position[1]).toBeCloseTo(1.7, 5);
    expect(p.position[2]).toBeCloseTo(2, 5);
  });
  it('angle 90 places the light to the +X side', () => {
    const p = buildLightProps({ ...base, angleDeg: 90 });
    expect(p.position[0]).toBeCloseTo(2, 5);
    expect(p.position[2]).toBeCloseTo(0, 5);
  });
  it('aims at the head and normalises colour to 0..1', () => {
    const p = buildLightProps(base);
    expect(p.target).toEqual([0, SUBJECT_HEAD_Y, 0]);
    for (const c of p.color) { expect(c).toBeGreaterThanOrEqual(0); expect(c).toBeLessThanOrEqual(1); }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lightProps`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

`src/domain/lightProps.ts`:
```ts
import type { Light } from './types';
import { kelvinToRgb } from './color';
import { modifierSoftness } from './optics';

export const SUBJECT_HEAD_Y = 1.5;
export const BASE_INTENSITY = 3;

export interface LightProps {
  position: [number, number, number];
  target: [number, number, number];
  color: [number, number, number]; // 0..1
  intensity: number;
  softness: number;
}

export function buildLightProps(light: Light, headY = SUBJECT_HEAD_Y): LightProps {
  const a = (light.angleDeg * Math.PI) / 180;
  const x = Math.sin(a) * light.distanceM;
  const z = Math.cos(a) * light.distanceM;
  const [r, g, b] = kelvinToRgb(light.kelvin);
  return {
    position: [x, light.heightM, z],
    target: [0, headY, 0],
    color: [r / 255, g / 255, b / 255],
    intensity: light.power * BASE_INTENSITY,
    softness: modifierSoftness(light),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lightProps`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/lightProps.ts src/domain/lightProps.test.ts
git commit -m "feat(domain): buildLightProps (Light -> 3D light params)"
```

---

## Task 8: Rig store + defaults

**Files:**
- Create: `src/store/defaults.ts`, `src/store/rigStore.ts`, `src/store/rigStore.test.ts`

- [ ] **Step 1: Write defaults**

`src/store/defaults.ts`:
```ts
import type { Light, Rig } from '../domain/types';

let _seq = 0;
export const nextLightId = () => `light-${++_seq}`;

export function makeLight(partial: Partial<Light> = {}): Light {
  return {
    id: nextLightId(),
    role: 'key',
    modifier: 'octa',
    modifierSizeCm: 90,
    angleDeg: 45,
    distanceM: 1.5,
    heightM: 1.7,
    tiltDeg: 0,
    power: 1,
    kelvin: 5600,
    ...partial,
  };
}

export function makeDefaultRig(): Rig {
  return {
    subject: { model: 'genericHead', headTurnDeg: 0 },
    camera: { angle: 'front', lensMm: 85, exposure: 0 },
    lights: [makeLight()],
  };
}
```

- [ ] **Step 2: Write the failing test**

`src/store/rigStore.test.ts`:
```ts
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
  it('removeLight removes and clears selection', () => {
    const id = useRig.getState().rig.lights[0].id;
    useRig.getState().selectLight(id);
    useRig.getState().removeLight(id);
    expect(useRig.getState().rig.lights).toHaveLength(0);
    expect(useRig.getState().selectedLightId).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- rigStore`
Expected: FAIL (module not found).

- [ ] **Step 4: Write the store**

`src/store/rigStore.ts`:
```ts
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
  setExposure: (ev: number) => void;
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
  setExposure: (ev) => set((s) => ({ rig: { ...s.rig, camera: { ...s.rig.camera, exposure: ev } } })),
}));
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- rigStore`
Expected: PASS (5 passed).

- [ ] **Step 6: Commit**

```bash
git add src/store
git commit -m "feat(store): zustand rig store + defaults"
```

---

## Task 9: Blockout head subject

**Files:**
- Create: `src/subject/blockoutHead.ts`

> No unit test — this builds Three.js geometry verified visually in Task 11. The nose/brow protrusions exist specifically so the key light cuts a recognisable loop/Rembrandt shadow.

- [ ] **Step 1: Write the head builder**

`src/subject/blockoutHead.ts`:
```ts
import * as THREE from 'three';
import { SUBJECT_HEAD_Y } from '../domain/lightProps';

/** A neutral blockout head+shoulders with a protruding nose and brow so shadows read. */
export function buildBlockoutHead(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xb9b4ad, roughness: 0.72, metalness: 0 });
  const y = SUBJECT_HEAD_Y;

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.105, 48, 48), mat);
  cranium.position.set(0, y, 0);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.06, 16), mat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, y - 0.01, 0.105);

  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.018, 0.025), mat);
  brow.position.set(0, y + 0.045, 0.095);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.13, 24), mat);
  neck.position.set(0, y - 0.16, 0);

  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.22), mat);
  shoulders.position.set(0, y - 0.30, 0);

  for (const m of [cranium, nose, brow, neck, shoulders]) {
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  return g;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/subject/blockoutHead.ts
git commit -m "feat(subject): blockout head with nose/brow for shadow shaping"
```

---

## Task 10: Capture renderer

**Files:**
- Create: `src/render/CaptureRenderer.ts`, `src/render/rasterCaptureRenderer.ts`

> The interface is the swap point for the future WebGPU path-tracer. The implementation is a one-shot offscreen render (no live loop) — matching the "old-school capture" model.

- [ ] **Step 1: Write the interface**

`src/render/CaptureRenderer.ts`:
```ts
import type { Rig } from '../domain/types';

export interface CaptureRenderer {
  /** Render the rig once and return a PNG data URL. */
  render(rig: Rig, width?: number, height?: number): Promise<string>;
}
```

- [ ] **Step 2: Write the rasterized implementation**

`src/render/rasterCaptureRenderer.ts`:
```ts
import * as THREE from 'three';
import type { Rig } from '../domain/types';
import type { CaptureRenderer } from './CaptureRenderer';
import { buildLightProps, SUBJECT_HEAD_Y } from '../domain/lightProps';
import { exposureMultiplier } from '../domain/exposure';
import { buildBlockoutHead } from '../subject/blockoutHead';

export class RasterCaptureRenderer implements CaptureRenderer {
  async render(rig: Rig, width = 768, height = 1024): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = exposureMultiplier(rig.camera.exposure);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshStandardMaterial({ color: 0x070707, roughness: 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    scene.add(buildBlockoutHead());

    for (const light of rig.lights) {
      const p = buildLightProps(light);
      const spot = new THREE.SpotLight(
        new THREE.Color(p.color[0], p.color[1], p.color[2]),
        p.intensity,
        0,
        Math.PI / 4,
        0.6,
        2
      );
      spot.position.set(p.position[0], p.position[1], p.position[2]);
      spot.target.position.set(p.target[0], p.target[1], p.target[2]);
      spot.castShadow = true;
      spot.shadow.mapSize.set(2048, 2048);
      spot.shadow.camera.near = 0.1;
      spot.shadow.camera.far = 20;
      // Penumbra scales with apparent source size -> softer modifier = softer shadow edge.
      spot.shadow.radius = Math.max(1, p.softness * 18);
      scene.add(spot);
      scene.add(spot.target);
    }

    const cam = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    if (rig.camera.angle === 'profile') {
      cam.position.set(2.2, SUBJECT_HEAD_Y, 0.0001);
    } else {
      cam.position.set(0, SUBJECT_HEAD_Y, 2.2);
    }
    cam.lookAt(0, SUBJECT_HEAD_Y, 0);

    renderer.render(scene, cam);
    const url = canvas.toDataURL('image/png');
    renderer.dispose();
    return url;
  }
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/render
git commit -m "feat(render): CaptureRenderer interface + rasterized one-shot impl"
```

---

## Task 11: UI — PlanView, properties, capture flow (+ manual spike gate)

**Files:**
- Create: `src/diagram/PlanView.tsx`, `src/panels/LightProperties.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the PlanView (top-down SVG, drag to set angle/distance)**

`src/diagram/PlanView.tsx`:
```tsx
import { useRef } from 'react';
import { useRig } from '../store/rigStore';
import { polarToXY, xyToPolar } from '../domain/geometry';

const SIZE = 320;
const SCALE = 80; // px per metre
const CENTER = { x: SIZE / 2, y: SIZE / 2 };

export function PlanView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const rig = useRig((s) => s.rig);
  const selectedId = useRig((s) => s.selectedLightId);
  const updateLight = useRig((s) => s.updateLight);
  const selectLight = useRig((s) => s.selectLight);

  function onPointerMove(id: string, e: React.PointerEvent) {
    if (e.buttons !== 1 || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const { angleDeg, distanceM } = xyToPolar(p, CENTER, SCALE);
    updateLight(id, { angleDeg, distanceM: Math.min(3.5, Math.max(0.4, distanceM)) });
  }

  const camera = polarToXY(0, 1.4, SCALE, CENTER);

  return (
    <svg
      ref={svgRef}
      width={SIZE}
      height={SIZE}
      style={{ background: '#54565a', borderRadius: 8, touchAction: 'none' }}
    >
      <circle cx={CENTER.x} cy={CENTER.y} r={14} fill="#3a7bd5" stroke="#e8923a" strokeWidth={3} />
      <text x={CENTER.x} y={CENTER.y - 20} fill="#f0c36a" fontSize={11} textAnchor="middle">Talent</text>
      <rect x={camera.x - 12} y={camera.y - 8} width={24} height={16} rx={3} fill="#2f3a45" />
      <text x={camera.x} y={camera.y + 24} fill="#c7ccd2" fontSize={10} textAnchor="middle">camera</text>
      {rig.lights.map((l) => {
        const pos = polarToXY(l.angleDeg, l.distanceM, SCALE, CENTER);
        const selected = l.id === selectedId;
        return (
          <g key={l.id}
             onPointerDown={() => selectLight(l.id)}
             onPointerMove={(e) => onPointerMove(l.id, e)}
             style={{ cursor: 'grab' }}>
            <line x1={pos.x} y1={pos.y} x2={CENTER.x} y2={CENTER.y}
                  stroke="#ffffff" strokeOpacity={0.25} strokeDasharray="3 3" />
            <circle cx={pos.x} cy={pos.y} r={13}
                    fill={selected ? '#ffd36b' : '#ddd'} stroke="#222" strokeWidth={selected ? 3 : 1} />
            <text x={pos.x} y={pos.y - 18} fill="#fff" fontSize={11} textAnchor="middle">
              {Math.round(l.angleDeg)}°
            </text>
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 2: Write the LightProperties panel**

`src/panels/LightProperties.tsx`:
```tsx
import { useRig } from '../store/rigStore';

const pill: React.CSSProperties = { display: 'block', margin: '8px 0', fontSize: 13 };

export function LightProperties() {
  const rig = useRig((s) => s.rig);
  const selectedId = useRig((s) => s.selectedLightId);
  const updateLight = useRig((s) => s.updateLight);
  const setExposure = useRig((s) => s.setExposure);
  const light = rig.lights.find((l) => l.id === selectedId) ?? rig.lights[0];

  return (
    <div style={{ width: 240 }}>
      <label style={pill}>
        Exposure: {rig.camera.exposure.toFixed(1)} EV
        <input type="range" min={-4} max={4} step={0.1} value={rig.camera.exposure}
               onChange={(e) => setExposure(parseFloat(e.target.value))} style={{ width: '100%' }} />
      </label>
      {light && (
        <>
          <div style={{ fontWeight: 600, margin: '12px 0 4px' }}>Selected light</div>
          <label style={pill}>
            Height: {light.heightM.toFixed(2)} m
            <input type="range" min={0.2} max={3} step={0.05} value={light.heightM}
                   onChange={(e) => updateLight(light.id, { heightM: parseFloat(e.target.value) })}
                   style={{ width: '100%' }} />
          </label>
          <label style={pill}>
            Power: {light.power.toFixed(2)}
            <input type="range" min={0} max={3} step={0.05} value={light.power}
                   onChange={(e) => updateLight(light.id, { power: parseFloat(e.target.value) })}
                   style={{ width: '100%' }} />
          </label>
          <label style={pill}>
            Colour: {light.kelvin} K
            <input type="range" min={2000} max={9000} step={100} value={light.kelvin}
                   onChange={(e) => updateLight(light.id, { kelvin: parseInt(e.target.value) })}
                   style={{ width: '100%' }} />
          </label>
          <label style={pill}>
            Modifier size: {light.modifierSizeCm} cm
            <input type="range" min={20} max={200} step={5} value={light.modifierSizeCm}
                   onChange={(e) => updateLight(light.id, { modifierSizeCm: parseInt(e.target.value) })}
                   style={{ width: '100%' }} />
          </label>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire the App (setup on the left, Capture + photo on the right)**

`src/App.tsx`:
```tsx
import { useState } from 'react';
import { PlanView } from './diagram/PlanView';
import { LightProperties } from './panels/LightProperties';
import { useRig } from './store/rigStore';
import { RasterCaptureRenderer } from './render/rasterCaptureRenderer';

const renderer = new RasterCaptureRenderer();

export function App() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function capture() {
    setBusy(true);
    try {
      const url = await renderer.render(useRig.getState().rig);
      setPhoto(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 24, padding: 24, alignItems: 'flex-start' }}>
      <div>
        <h2 style={{ marginTop: 0 }}>LIGHT ROOM</h2>
        <PlanView />
        <button onClick={capture} disabled={busy}
                style={{ marginTop: 12, padding: '10px 18px', fontSize: 15, cursor: 'pointer' }}>
          {busy ? 'Rendering…' : '📷 Capture'}
        </button>
      </div>
      <LightProperties />
      <div style={{ width: 384, minHeight: 512, background: '#15171b', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {photo
          ? <img src={photo} alt="capture" style={{ maxWidth: '100%', borderRadius: 8 }} />
          : <span style={{ color: '#6b7280' }}>Press Capture to shoot</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build + tests**

Run: `npm run build && npm test`
Expected: build succeeds; all tests pass.

- [ ] **Step 5: Manual spike gate — run the app and confirm the lighting reads**

Run: `npm run dev`, open the local URL.
Verify:
1. Drag the light around the head on the plan → the angle label updates.
2. Press **Capture** → the head renders, lit from the light's direction, with a **visible nose/brow shadow** that moves as you change the angle.
3. Slide **Exposure** down → the captured image goes **dark** (truthful exposure). Up → it brightens/blows out.
4. Increase **Modifier size** (or pull the light closer) → the shadow edge gets **softer**.

**This is the gate the spec called out.** If the soft shadow / direction / exposure read believably, the rasterized approach is validated and we proceed to Plan 02. If not, stop and revisit the renderer (PCSS vs. accumulation) before building further.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): plan diagram, light properties, capture flow"
```

---

## Self-review (author)

- **Spec coverage (Plan 01 subset):** lights move on a top-down plan ✔ · truthful exposure ✔ · capture-then-render (no live preview) ✔ · rasterized renderer behind a swappable `CaptureRenderer` ✔ · subject with facial form for shadow-cutting ✔ (blockout). Deferred by design to later plans: side-elevation editor, real glTF head, WebGPU, modifiers/flags/bounce/diffusion, presets, gallery, persistence, head-turn/camera-profile UI (camera-profile is wired in the renderer but not yet a UI control — Plan 02).
- **Placeholder scan:** none — every step has runnable code/commands.
- **Type consistency:** `Light`/`Rig` fields are identical across `types.ts`, `defaults.ts`, `lightProps.ts`, store, renderer. `buildLightProps` returns `{position,target,color,intensity,softness}` consumed verbatim by the renderer. `SUBJECT_HEAD_Y` is defined once in `lightProps.ts` and imported by the head + renderer.
- **Known intentional simplification:** WebGLRenderer (not WebGPU) for this first one-shot; switching to `WebGPURenderer` is an explicit Plan 02 task. Documented in Tech Stack + roadmap.
