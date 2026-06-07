export type RendererKind = 'webgpu' | 'raster';

/** Whether the runtime exposes a WebGPU adapter entry point. */
export function supportsWebGPU(
  nav: { gpu?: unknown } | undefined = typeof navigator !== 'undefined' ? navigator : undefined,
): boolean {
  return !!(nav && (nav as { gpu?: unknown }).gpu);
}

/** Choose the capture renderer: WebGPU path tracer when available, rasterizer otherwise. */
export function pickRendererKind(hasWebGPU: boolean): RendererKind {
  return hasWebGPU ? 'webgpu' : 'raster';
}
