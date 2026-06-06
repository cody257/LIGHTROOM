/** Convert an exposure-value (stops) offset into a linear render-exposure multiplier. */
export function exposureMultiplier(ev: number): number {
  return Math.pow(2, ev);
}
