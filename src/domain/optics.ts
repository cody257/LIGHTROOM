/** Apparent angular size of the source as seen from the subject. Larger = softer light. */
export function modifierSoftness(light: { modifierSizeCm: number; distanceM: number }): number {
  const sizeM = light.modifierSizeCm / 100;
  return sizeM / Math.max(0.1, light.distanceM);
}
