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
