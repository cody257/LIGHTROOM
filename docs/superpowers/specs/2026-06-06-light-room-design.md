# LIGHT ROOM — Design Spec

- **Date:** 2026-06-06
- **Status:** Draft for review
- **Author:** brainstorming session (cody@copperstateit.com)

## 1. Summary

LIGHT ROOM is a browser-based **lighting pre-visualization tool**. The user arranges studio lights, modifiers, gels, diffusion, flags, and reflectors around a subject on a clean **top-down map**, and a **live 3D preview** shows how those choices light the subject — updating continuously as anything moves. It is a planning tool: a photographer or gaffer mocks up a setup before touching real gear.

The format is modeled directly on the reference material the user supplied (top-down lighting diagrams paired with the resulting portrait — e.g. Strobox setup cards and the "24 Essential Studio Set-ups" poster).

## 2. Users & goals

- **Primary user:** a photographer / gaffer planning a portrait or product shoot.
- **Job to be done:** "Before I rent/rig anything, let me see what a given light placement and modifier will do to my subject, and save/share that plan."
- **Success:** the user can reproduce any of the classic lighting patterns (Rembrandt, loop, split, butterfly, flat, clamshell, silhouette, hi-key), understand the effect of moving a light or swapping a modifier, and export the plan as a shareable image.

## 3. Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Purpose | Pre-viz for real shoots — believable, reasonably accurate |
| 2 | Subject | Swappable — at least one face and one product |
| 3 | Platform | Web app, real-time 3D (WebGL / Three.js) |
| 4 | Accuracy bar | "Plausible look **+ color & ratio**" — accurate color temperature / gels and a readable key:fill ratio; **not** metered exposure |
| 5 | Rendering approach | **Live 3D render** — the map and preview are two views of one 3D rig |
| 6 | Control surface | **2D top-down map** (SVG) as the primary editor, mirroring the references |

## 4. Architecture

**One source of truth, two synchronized views.**

```
                 Lighting Rig (Zustand store)
                 subject · camera · lights[] · reflectors[] · flags[] · backdrop
                          ▲ edit              ▼ render
        ┌─────────────────┴───────┐   ┌───────┴────────────────┐
        │ ① Setup Map (2D SVG)    │   │ ② Subject Preview (R3F) │
        │ top-down · drag angle/  │   │ live 3D camera view     │
        │ distance · icons+labels │   │ + pattern/ratio overlay │
        └─────────────────────────┘   └────────────┬───────────┘
                                                    ▲ feeds
                              Pure domain functions │
                              kelvin→rgb · pattern classifier ·
                              key:fill ratio · modifier→softness
```

- The **Setup Map** is hand-built SVG (crisp icons, light cones, angle labels, gear/Kelvin chips) — this is what makes it look like the references rather than a gray top-down 3D render. It reads/writes the rig store.
- The **Subject Preview** is a `react-three-fiber` scene whose lights/materials are a pure function of the rig store.
- Editing in either view mutates the same store; both re-render.

**Stack:** React + Vite + TypeScript · `react-three-fiber` + `drei` + `three` (preview) · `zustand` (rig store) · SVG (map) · Vitest + Testing Library (tests). Fully client-side; no backend.

## 5. Domain model — the Rig

A `Rig` is one serializable JSON object. Presets are just saved Rigs. Save/load/export = serialize this.

- **Subject** — `model` (face | product | figure), `faceYaw`, `facePitch` (the head turn is what makes short vs broad vs Rembrandt possible), `material/skin`.
- **Camera** — `angle`, `distance`, `height`, `lens` (mm).
- **Light[]** — `role` (key | fill | rim | hair | background), `fixture`, `modifier`, `modifierSize`, `angle`, `height`, `distance`, `aim/tilt`, `intensity`, `kelvin`, `gel`, `grid/honeycomb`, `barnDoors`, `diffusion` (scrim).
- **Reflector[]** — `surface` (white | silver | gold | black/negative-fill), `size`, `angle`, `distance`.
- **Flag[]** — `size`, `position`, `rotation`; cuts/blocks spill.
- **Backdrop** — `color`, `type` (seamless | none); needed for hi-key, background lights, silhouette.

**Derived (computed live, never stored):** pattern name (Rembrandt / loop / split / butterfly / flat / clamshell / broad / short / silhouette), key:fill ratio, per-light softness.

## 6. Rendering technique

**Modifier → light mapping (the believability rules):**

| Modifier class | Three.js mapping | Effect |
|---|---|---|
| Softbox / octa / parabolic / umbrella / beauty / strip | `RectAreaLight` (LTC shading), sized to the modifier | Bigger or closer = softer shadows + more wrap |
| Bare / fresnel / snoot / grid | `SpotLight` with tight angle + penumbra | Crisp shadows, faster spill cutoff |
| Fill / ambient | low-intensity area or hemisphere | Lifts shadows |
| Reflector | bounce: an approximated fill from the reflector's direction, tinted by surface, attenuated by efficiency | White/silver/gold fill or black negative fill |
| Flag | thin shadow-casting occluder geometry | Cuts spill / shapes falloff |

- **Color:** `kelvin → rgb` for white balance; gels multiply the light color; ACES/Filmic tone mapping + sRGB output for believable rolloff. Distance applies an approximate inverse-square falloff (look only — not a metered readout).
- **Materials:** PBR (`MeshStandardMaterial`/physical). No subsurface scattering in v1 (cheap translucency wrap is a stretch goal).

**⚠ Primary technical risk — soft shadows.** Three.js `RectAreaLight` does **not** cast shadows. Mitigation (validated by an early spike, see §11): shade with the RectAreaLight for the soft directional look, and pair it with a shadow-casting `SpotLight`/`DirectionalLight` proxy at the modifier center using PCSS-style soft shadow maps (`drei` `<SoftShadows/>`), with penumbra scaled by modifier size and distance. Optionally accumulate a few area samples (`AccumulativeShadows`) when the rig is static. **Reproducing a believable loop/split/Rembrandt nose shadow is the acceptance test for this spike.**

## 7. Screen layout & height handling

Three zones:

- **Left — Setup Map** (SVG, top-down): drag a light around the subject to set **angle**, drag in/out for **distance**; modifier icons, light cones, angle labels, gear/Kelvin chips, camera, and the talent marker with a face-direction indicator.
- **Right — Subject Preview** (3D): live camera view, with an overlay showing the computed **pattern name** and **key:fill ratio**.
- **Docked panels:** a **Light list / add-light** rail; a **Properties panel** for the selected light (fixture, modifier + size, intensity, Kelvin + gel, grid, barn doors, diffusion, height, tilt); a **Preset gallery**; a small **Camera/backdrop** panel.

**Height (the one thing a top-down map can't show):** the selected light gets a **height slider** plus a compact **side-elevation mini-view** (a profile diagram of subject + selected light) so plan (top-down) and elevation (side) together fully specify the 3D position. Height also shows as a numeric chip on the map icon.

## 8. v1 scope (YAGNI)

**In:**
- Two starter subjects: a portrait head/bust and one product (e.g. a bottle); architecture supports adding more.
- Curated fixtures/modifiers: bare, fresnel/spot, softbox, octa, parabolic, umbrella (white/silver), strip, beauty dish, snoot, ring; grids/honeycombs; barn doors.
- Multi-light rig with roles (key/fill/rim/hair/background).
- Reflectors (white/silver/gold/black-negative) and flags.
- Color temperature (Kelvin) + gels; diffusion scrim.
- Top-down SVG map editor + 3D preview, synchronized.
- Height via slider + side-elevation mini-view.
- Derived pattern-name + key:fill ratio overlay.
- Preset library — a starter set of ~8 named setups (expand toward the 24 later).
- Simple seamless backdrop with color control.
- Save/load setups (localStorage); export map + preview as an image.

**Out (deferred):**
- Metered exposure / EV readout (accuracy bar is color+ratio, not metering).
- Photoreal skin (SSS), caustics, volumetric/haze light beams.
- Multiple subjects in one scene; posing/expressions.
- Custom 3D model import.
- Accounts, cloud sync, sharing backend.
- Animation/keyframes, video export.
- Mobile-first UI (desktop-first; responsive is best-effort).

## 9. Domain vocabulary

- **Patterns:** flat, butterfly (paramount), loop, Rembrandt (+ short / broad), split, clamshell, hi-key, silhouette.
- **Roles:** key, fill, rim/hair, background.
- **Modifiers:** softbox (closed/feathered), octa, parabolic, umbrella (shoot-through/reflective, white/silver), beauty dish, strip box, snoot, grid/honeycomb, barn doors, scrim/diffusion.
- **Ratio:** key:fill expressed as a ratio / stops of difference.

These terms are the canonical language for issue titles, tests, and UI copy. (A `CONTEXT.md` glossary can be grown lazily via `grill-with-docs` as terms get pinned down.)

## 10. Project structure

```
src/
  domain/    pure: rig types, kelvin→rgb, pattern classifier, ratio, softness, presets
  store/     zustand rig store + actions
  map/       SVG top-down editor (icons, cones, drag handlers, elevation mini-view)
  preview/   R3F scene, modifier→light mappers, materials, shadow setup, tone mapping
  panels/    light list, properties, preset gallery, camera/backdrop
  app/       layout, persistence (localStorage), image export
```

## 11. Testing strategy & build order

**Test-driven where it counts — the pure `domain/` layer:**
- `kelvinToRgb(k)`, `classifyPattern(rig) → name`, `keyFillRatio(rig)`, `modifierToSoftness(modifier, size, distance)`, `inverseSquareIntensity(distance)`. Deterministic; these are the "truth" of the app and are written test-first.
- Component tests for map interactions (drag updates angle/distance in store) and panel bindings.
- The 3D render is verified by a manual visual spike + smoke tests (scene mounts, light count matches rig), not pixel diffs.

**Build order (tracer bullet first):**
1. **Spike — soft shadows.** Prove a believable loop/split/Rembrandt nose shadow in R3F with one RectAreaLight + soft-shadow proxy. Gate the whole approach on this.
2. **Tracer bullet.** One subject, one key light, map ⇄ store ⇄ 3D preview end-to-end (drag light → face relights).
3. Expand modifiers, roles, multi-light; Kelvin/gel; diffusion.
4. Reflectors, flags, backdrop.
5. Derived pattern-name + ratio overlay; side-elevation height view.
6. Preset library; save/load; image export.
7. Second subject (product) + subject swap.

## 12. Open questions

- **Subject assets:** where do the 3D head + product models come from (CC-licensed, purchased, or modeled)? Affects realism and timeline.
- **Preset count for v1:** the starter ~8, or push for all 24?
- **Reflector fidelity:** approximate bounce light vs. real bounce geometry — how accurate must negative/positive fill be?
- **Haze/volumetric beams:** confirmed out for v1, or wanted as a stretch?
- **Skin realism ceiling:** is non-SSS PBR skin acceptable for the "believable" bar?
```
