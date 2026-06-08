import type { Pt } from './geometry';

/**
 * Side elevation: the horizontal axis is distance from the subject (metres, growing to
 * the right) and the vertical axis is height above the floor (metres, growing up).
 * `origin` is the screen position of (distance 0, height 0): the foot of the subject.
 */
export function elevationToXY(distanceM: number, heightM: number, scale: number, origin: Pt): Pt {
  return { x: origin.x + distanceM * scale, y: origin.y - heightM * scale };
}

export function xyToElevation(p: Pt, scale: number, origin: Pt): { distanceM: number; heightM: number } {
  return { distanceM: (p.x - origin.x) / scale, heightM: (origin.y - p.y) / scale };
}
