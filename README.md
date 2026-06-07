# LIGHT ROOM

A browser-based studio-lighting simulator. Arrange lights, modifiers, and camera angles around a fixed 3D subject on a top-down plan, then press **Capture** to render a truthfully-exposed photo of how that setup lights the face. It models an "old-school camera": no live preview, you commit and shoot.

**Live:** https://lightroom-3gd.pages.dev/

## What it does

- **Plan editor.** Drag lights around the subject on a top-down diagram; set angle, distance, height, power, colour temperature (Kelvin), and modifier size.
- **Capture.** One-shot render with truthful exposure (ACES tone mapping driven by an exposure dial) and soft shadows whose softness scales with the modifier's apparent size.
- **Realistic subject.** A glTF head scan, with a procedural blockout fallback.

## Stack

TypeScript, React, Vite, Three.js (WebGL today, WebGPU path-tracer planned), Zustand, Vitest + Testing Library.

## Develop

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm test         # vitest
npm run build    # tsc + vite build -> dist/
```

## Deploy

Push to `main`. Cloudflare Pages auto-builds (`npm run build`) and deploys `dist/`, live in about 1 to 2 minutes.

## Roadmap

WebGPU path-traced renderer, elevation (height/tilt) view, more modifier types, presets + gallery and A/B compare, user-provided subjects.

## Credits

Subject head scan: LeePerrySmith (CC-BY 3.0). See [CREDITS.md](CREDITS.md).
