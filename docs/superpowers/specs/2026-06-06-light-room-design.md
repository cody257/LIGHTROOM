# LIGHT ROOM — Design Spec

- **Date:** 2026-06-06
- **Status:** Draft for review (revised after a grill-me session)
- **Author:** brainstorming + grilling session (cody@copperstateit.com)

## 1. Summary

LIGHT ROOM is a browser-based **studio-lighting simulator centered on a fixed subject**. The user sculpts a lighting setup — moving lights, modifiers, diffusion, flags, gels, and bounce cards around a subject on a **dual 2D diagram** (top-down plan + side elevation) — then presses **Capture** to render a photograph of the subject under exactly that light. The fidelity of *light behavior* is the product; the subject just needs to receive light truthfully.

It is modeled on the reference material the user supplied (top-down lighting diagrams paired with the resulting portrait), but turned into an interactive, "old-school camera" experience: set up, then shoot.

## 2. Users & goals

- **Primary user:** a photographer / gaffer planning or studying a lighting setup.
- **Job to be done:** "Arrange a light setup, shoot it, and see truthfully how that light falls on the subject — including when it's wrong (too dark, flat, harsh)."
- **Success:** the user can build the classic patterns (Rembrandt, loop, split, butterfly, clamshell, hi-key, silhouette), see honest results including under/over-exposure, save and compare shots, and export the photo + diagram.

## 3. Locked decisions (from brainstorming + grilling)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Product identity | A **light simulator** centered on a subject; light fidelity is the star |
| 2 | What moves | **Lights move freely** (angle / distance / height + modifiers, flags, bounce). **Up to 4 lights** |
| 3 | Shot framing | **Head turn** (forward / 45°) + **camera angle** (front / 90° profile) — discrete, framing only |
| 4 | Preview model | **No live subject preview.** Arrange on the diagram, then **Capture** → render (loading OK) |
| 5 | Setup view | **Dual 2D**: top-down plan (angle + distance) + side elevation (height + tilt) |
| 6 | Render engine | **v1 rasterized + accumulated soft shadows** behind a swappable interface; **Phase 2 = WebGPU path tracer** |
| 7 | Exposure | **Truthful** — per-light power + one exposure dial; underlit renders dark. No f-stop readout |
| 8 | Environment | **Black void + configurable backdrop (color/distance) + floor**; wall-bounce later |
| 9 | Subject | One fixed **generic anatomically-detailed head+shoulders** (swappable module); neutral material |
| 10 | Personalization | **Phase 2** — face-from-photos via MediaPipe FaceLandmarker |
| 11 | Gear model | **Generic parametric** lights/modifiers (type + shape + size + params), not a branded catalog |
| 12 | Presets | **Named-pattern presets in v1** (seed the lights); auto pattern/ratio **labels later** |
| 13 | Captures | **Saved to a gallery**, compared side-by-side, exported as PNG (photo + diagram) |
| 14 | Units | Meters + cm, Kelvin |
| 15 | Platform/stack | **WebGPU-first Three.js + react-three-fiber v9 + TSL**, WebGL2 fallback; desktop web; client-only |

## 4. Core interaction model

1. **Arrange** lights and modifiers on the dual-2D diagram (no subject shown).
2. Optionally pick a **preset** to seed a known setup, then tweak.
3. Set **head turn** + **camera angle** for the shot, and the **exposure**.
4. Press **Capture** → a loading state while the subject renders under the configured light.
5. The capture lands in the **gallery**; compare with prior shots, export, or keep iterating.

"Old school": you don't see the subject react live — you commit to a setup and shoot it. This deliberately splits a cheap interactive diagram from a heavier, truthful render.

## 5. Architecture

**One source of truth (the Rig), two surfaces (the 2D setup diagram and the capture render).**

```
                 Rig (Zustand store)
   subject · lights[≤4] · reflectors[] · flags[] · backdrop · camera · exposure
            ▲ edit                                   │ render on Capture
   ┌────────┴───────────────┐            ┌───────────┴─────────────────┐
   │ Setup diagram (SVG)     │            │ Capture renderer (interface)│
   │ plan + side elevation   │            │  v1: rasterized R3F/WebGPU  │
   │ drag lights, set params │            │  P2: WebGPU path tracer     │
   └─────────────────────────┘            └───────────┬─────────────────┘
                                                       ▲ pure inputs
                         Pure domain functions          │
              kelvin→rgb · modifier→softness/spread · exposure ·
              preset definitions · (later) pattern classifier
```

- The **setup diagram** is hand-built SVG (plan + elevation), reading/writing the Rig.
- The **capture renderer** is hidden behind a `CaptureRenderer` interface so v1 (rasterized) and Phase 2 (path tracer) are swappable without touching the rest of the app.
- **Stack:** TypeScript + React + Vite · react-three-fiber v9 on **Three.js `WebGPURenderer`** (auto WebGL2 fallback) · **TSL** shaders (compile to WGSL + GLSL) · **Zustand** rig store · SVG diagrams · Vitest + Testing Library. Fully client-side; no backend.

## 6. Domain model — the Rig

One serializable JSON object. Presets are saved Rigs.

- **Subject** — `model` (generic head v1; swappable), `headTurn` (0° | 45°), neutral material.
- **Camera** — `angle` (front | 90° profile), `lens` (mm), `exposure` (a brighten/darken dial — a control, not a metered readout).
- **Light[≤4]** — `role` (key/fill/rim/background), `fixture`, `modifier`, `modifierSize` (cm), `angle`, `height`, `distance`, `aim/tilt`, `power`, `kelvin`, `gel`, `grid/honeycomb`, `barnDoors`, `diffusion { material, density }`.
- **Reflector[]** — `surface` (white/silver/gold/black-negative), `size`, `angle`, `distance`.
- **Flag[]** — `kind` (solid/cutter | net/scrim), `size`, `position`, `rotation`; cuts spill or reduces intensity.
- **Backdrop** — `color`, `distance`.

**Derived (computed, never stored):** per-light softness/spread, exposure result; *(Phase 2: pattern name + key:fill ratio).*

## 7. Light & modifier model (generic parametric)

The user composes a light from **fixture + modifier + size + params**, not branded gear. v1 approximates each behavior; the Phase-2 path tracer makes them physically exact.

| Control | v1 (rasterized approximation) | Phase 2 (path-traced truth) |
|---|---|---|
| Modifier size / distance | Penumbra scaled by size/distance (PCSS or accumulation) | Real area-light penumbra |
| **Diffusion** (muslin/silk × density) | Softness + intensity loss scale with density | Real scatter/transmission through modeled fabric |
| **Flag — solid/cutter** (black) | Shadow-casting occluder + negative fill | Real occlusion + bounce removal |
| **Flag — net/scrim** | Reduces intensity by N stops | Real partial transmission |
| **Bounce** (white/silver/gold/black) | Approx fill from reflector direction, tinted/attenuated | Real bounce light |
| Grid / honeycomb / barn doors | Narrows spill cone / clips | Real spill control |
| Color (Kelvin + gel) | `kelvin→rgb` × gel multiply | Same, spectral-ish |
| **Exposure** | Per-light power + exposure dial; truthful brightness, ACES/Filmic tone-map | Same, with real light transport |

## 8. Setup view & viewpoints

- **Dual 2D diagram:** top-down **plan** (drag a light to set angle + distance) and side **elevation** (drag to set height + tilt). Distance is shared between views. Clean, photographer-native, and it doubles as the exported diagram.
- **Selected-light properties panel:** fixture, modifier + size, power, Kelvin + gel, diffusion material + density, grid, barn doors.
- **Viewpoints:** camera (front | 90° profile) × head turn (forward | 45°) → covers dead-on, three-quarter, and profile shots.
- **Height** is fully handled by the elevation view (the gap a top-down-only diagram couldn't fill).

## 9. Subject

- v1: one fixed, anatomically-detailed **generic head + shoulders** (defined nose, lips, ears, eye sockets, brow, chin, neck) so shadows cut truthfully. Neutral matte material — *form* matters, photoreal skin does not.
- Loaded as glTF behind a `Subject` module so it can be swapped.
- **Phase 2 — personalization:** reconstruct the user's facial structure from uploaded photos via **MediaPipe FaceLandmarker** (in-browser), deform a base head, optional photo texture. Explicitly "approximate," and built only after the core sim is proven.

## 10. Captures, gallery, persistence

- **Capture** renders the current Rig and saves the image to a **session gallery**.
- **Compare** captures side-by-side.
- **Export** a PNG pairing the photo with its plan+elevation diagram (the reference format).
- **Persistence:** named setups + the gallery saved locally (image blobs in **IndexedDB**; Rig JSON in localStorage).

## 11. v1 scope (YAGNI)

**In:** dual-2D setup diagram · up to 4 lights with roles · generic parametric fixtures/modifiers (softbox, octa, parabolic, beauty dish, umbrella white/silver, strip, snoot, grid, bare, fresnel; barn doors) · diffusion (material + density) · flags (solid + net) · bounce (white/silver/gold/black) · Kelvin + gels · black void + backdrop + floor · head-turn + camera-angle · truthful exposure · **Capture** (rasterized) · named-pattern presets · capture gallery + compare + PNG export · save/load.

**Out (deferred):** path tracing (Phase 2) · personalization (Phase 2) · auto pattern/ratio labels · wall/ceiling bounce · branded gear library · f-stop/EV metering readout · mobile/tablet · multiple subjects · animation/video · accounts/cloud.

## 12. Domain vocabulary

- **Patterns:** flat, butterfly (paramount), loop, Rembrandt (+ short/broad), split, clamshell, hi-key, silhouette.
- **Roles:** key, fill, rim/hair, background.
- **Modifiers:** softbox, octa, parabolic, beauty dish, umbrella (shoot-through/reflective, white/silver), strip, snoot, grid/honeycomb, barn doors, scrim/diffusion (muslin/silk).
- **Cutters:** solid/flag (black, blocks + negative fill), net/scrim (reduces intensity in stops).
- **Bounce:** white/silver/gold (positive fill), black (negative fill).

Canonical terms for issue titles, tests, and UI copy. A `CONTEXT.md` glossary can grow lazily via `grill-with-docs`.

## 13. Project structure

```
src/
  domain/    pure: rig types, kelvin→rgb, modifier→softness/spread, exposure, presets
  store/     zustand rig store + actions
  diagram/   SVG plan + elevation editors (drag handlers, icons, labels)
  render/    CaptureRenderer interface; rasterized R3F/WebGPU impl; materials; tone-map
  subject/   glTF head module (swap point for personalization)
  panels/    light properties, preset picker, exposure/backdrop, gallery/compare
  app/        layout, capture flow, persistence (IndexedDB + localStorage), PNG export
```

## 14. Testing strategy & build order

**TDD the pure `domain/` layer** — `kelvinToRgb`, `modifierToSoftness(modifier,size,distance)`, `diffusionEffect(material,density)`, `exposureResult(...)`, preset definitions. Deterministic; the simulator's "truth." Component tests for diagram drag → store updates. The render is validated by a visual spike + smoke tests, not pixel diffs.

**Build order (tracer-bullet):**
1. **Domain core** (TDD) — rig types, color/softness/exposure functions, preset data.
2. **Setup diagram** — plan + elevation editors wired to the store (add/move lights, set params); no render yet.
3. **Capture v1 spike** — rasterized R3F/WebGPU scene: render the generic head under one light with accumulated soft shadows + truthful exposure; the **Capture** + loading flow. *(Gate: do the soft shadows read believably?)*
4. **Modifier depth** — diffusion density, flags/nets, bounce, gels, grids/barn doors (approximation rules).
5. **Environment + shot** — black void, backdrop, floor; head-turn + camera-angle.
6. **Presets + gallery** — seed setups; capture gallery, compare, PNG export, save/load.
7. **Phase 2 spikes** — WebGPU path-trace renderer behind the interface; MediaPipe personalization.

## 15. Open questions

- **Generic head asset:** CC0 model vs. MakeHuman-generated neutral head (lean MakeHuman → glTF, baked forward + 45° poses).
- **v1 soft-shadow technique:** PCSS vs. multi-sample accumulation — decided by the step-3 spike.
- **Diffusion/flag approximation formulas:** tuned against reference looks during step 4.
- **Gallery storage limits:** IndexedDB quota handling for many captured images.

## 16. Phase 2+ roadmap

Path-traced capture (physically exact modifiers) · face-from-photo personalization · auto pattern-name + key:fill ratio labels · white-wall / ambient bounce environments · optional branded-gear catalog · product subjects.
