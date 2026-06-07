import type { CaptureRenderer } from './CaptureRenderer';
import { RasterCaptureRenderer } from './rasterCaptureRenderer';
import { supportsWebGPU, pickRendererKind } from './rendererSelect';

/**
 * Single swap point for the capture backend. Selects WebGPU when the runtime supports
 * it, otherwise the rasterizer.
 *
 * COP-177: the WebGPU path-traced renderer is not implemented yet (see
 * docs/superpowers/plans/2026-06-07-light-room-02-webgpu-path-tracer.md). Until it
 * lands, both kinds use the rasterizer so Capture always works. When the path tracer
 * is ready, return it from the 'webgpu' branch; nothing else in the app changes.
 */
export function createCaptureRenderer(): CaptureRenderer {
  const kind = pickRendererKind(supportsWebGPU());
  switch (kind) {
    case 'webgpu':
    // falls through until the WebGPU path tracer lands
    case 'raster':
    default:
      return new RasterCaptureRenderer();
  }
}
