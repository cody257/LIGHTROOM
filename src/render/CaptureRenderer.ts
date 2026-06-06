import type { Rig } from '../domain/types';

export interface CaptureRenderer {
  /** Render the rig once and return a PNG data URL. */
  render(rig: Rig, width?: number, height?: number): Promise<string>;
}
