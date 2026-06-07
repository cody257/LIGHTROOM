# LIGHT ROOM Plan 02: WebGPU path-traced CaptureRenderer

Status: proposed (COP-177). This plan is the reviewable first step the issue asks for
("write a short plan doc and open it for review before large changes"). The first PR
delivers the selection + fallback infrastructure; the path-tracer core is built and
verified in follow-up work on a WebGPU-capable machine.

## Goal

Add a physically based, path-traced capture backend that produces higher-fidelity stills
(true soft shadows from area lights, indirect bounce, accurate falloff and contact
shadows) while keeping the existing rasterizer as the fallback. The swap happens behind
the existing `CaptureRenderer` interface so nothing else in the app changes.

## Why now

- June 2026: WebGPU is Baseline across current Chrome, Edge, Firefox, and Safari.
- The rasterized renderer (COP-174) approximates softness with VSM shadow radius. It
  reads well but is not truthful for area-light penumbrae, bounce, or occlusion contact.
- The renderer was deliberately built behind `CaptureRenderer` (`render(rig): Promise<png>`)
  as the designed swap point.

## Interface (unchanged)

```
interface CaptureRenderer { render(rig: Rig, width?, height?): Promise<string /* png data url */> }
```

Both backends consume the same `Rig` and `buildLightProps` output (position, target,
colour, intensity, softness, spread). No store or UI change is required.

## Architecture

1. Selection (this PR, done):
   - `rendererSelect.ts`: `supportsWebGPU()` + `pickRendererKind()` (pure, unit-tested).
   - `createCaptureRenderer()`: the single swap point. Returns the rasterizer today;
     returns the path tracer from the `webgpu` branch once it exists.
   - `App` consumes `createCaptureRenderer()`.
2. Path tracer (follow-up):
   - Build on three's `WebGPURenderer` (`three/webgpu`) + TSL compute, or integrate
     `three-gpu-pathtracer` if its WebGPU path is ready at implementation time.
   - Area lights from each light's modifier face (size from `modifierSizeCm`), so softness
     and spread fall out of the geometry instead of being approximated.
   - Progressive accumulation: render N samples per Capture, resolve, tone map with the
     same ACES + `exposureMultiplier(camera.exposure)` so exposure stays truthful and
     consistent with the rasterizer.
   - Reuse the subject pipeline (`loadSubjectHead`, glTF + blockout fallback) and the
     black void + floor.
3. Fallback:
   - If `navigator.gpu` is absent, or adapter/device request fails at runtime, or the
     path tracer throws, fall back to `RasterCaptureRenderer` so Capture never dead-ends.

## Milestones

- M1 (this PR): selection + fallback infra + plan. CI green, no behaviour change.
- M2: WebGPURenderer wired behind the interface, rasterized parity (same scene, WebGPU
  device), exposure verified equal to the raster path on a reference rig.
- M3: replace lights with emissive area lights + a progressive path-trace integrator;
  converge on a sample budget that looks correct within a Capture's time budget.
- M4: tune modifier area-light shapes (softbox/octa/strip/grid/snoot) so COP-179's
  parameters drive the trace directly.

## Verification

- Unit: selection logic (pure) is unit-tested in CI.
- The renderer itself needs a WebGPU browser; verify by eye against the rasterizer on a
  reference rig (key + fill), confirming softer truthful penumbrae and matching exposure.
  This cannot run in the headless CI environment, so M2+ land behind the fallback and are
  signed off from a real browser before the `webgpu` branch is switched on.

## Risk / rollback

- `three/webgpu` adds bundle weight; code-split the path tracer so the rasterizer path
  stays light.
- Every step keeps the rasterizer as the default until the WebGPU path is verified, so a
  regression is a one-line revert in `createCaptureRenderer`.
