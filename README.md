# LIGHT ROOM

A browser-based studio-lighting simulator. Arrange lights, modifiers, and camera angles around a fixed 3D subject on a top-down plan and a side elevation, then press **Capture** to render a truthfully-exposed photo of how that setup lights the face. It models an "old-school camera": no live preview, you commit and shoot.

**Live:** https://lightroom-3gd.pages.dev/

## What it does

- **Plan + elevation editors.** Drag lights around the subject top-down (angle + distance) and from the side (height + distance), and set each light's aim tilt.
- **Modifiers.** Choose a type (octabox, softbox, strip, umbrella, beauty dish, parabolic, fresnel, bare reflector, snoot) and tune size, feathering, and an egg-crate grid; the type drives shadow softness and beam spread.
- **Light controls.** Power, colour temperature (Kelvin), and per-light selection, up to four lights.
- **Capture.** One-shot render with truthful exposure (ACES tone mapping driven by an exposure dial) and soft shadows that scale with the modifier's apparent size.
- **Presets.** One-click classic setups: Butterfly, Loop, Rembrandt, Split, Clamshell.
- **Gallery + compare.** Recent captures are kept in a gallery; pick two to view side by side.
- **Your own subject.** Use the bundled head scan or upload your own `.glb`/`.gltf` (loaded locally in the browser, with a blockout fallback).

## Stack

TypeScript, React, Vite, Three.js, Zustand, Vitest + Testing Library. The capture renderer sits behind a swappable interface; a WebGPU path-traced backend is planned (see `docs/superpowers/plans/`).

## Develop

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm test         # vitest
npm run build    # tsc + vite build -> dist/
```

CI runs the typecheck, build, and tests on every push and PR.

## Deploy

Push to `main`. Cloudflare Pages auto-builds (`npm run build`) and deploys `dist/`, live in about 1 to 2 minutes.

## Roadmap

WebGPU path-traced renderer (in progress) for true area-light soft shadows, bounce, and accurate falloff.

## Credits

Subject head scan: LeePerrySmith (CC-BY 3.0). See [CREDITS.md](CREDITS.md).
