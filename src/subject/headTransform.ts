export interface BBox {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
}

export interface HeadFit {
  scale: number;
  position: [number, number, number];
}

/**
 * Normalizes an arbitrary model bounding box to a target height,
 * centred at a given world Y. X and Z are recentred to 0.
 */
export function fitHeadTransform(
  box: BBox,
  opts: { targetHeight: number; headCenterY: number },
): HeadFit {
  const height = box.max.y - box.min.y;
  const scale = opts.targetHeight / height;
  const cx = (box.min.x + box.max.x) / 2;
  const cy = (box.min.y + box.max.y) / 2;
  const cz = (box.min.z + box.max.z) / 2;
  return {
    scale,
    position: [-scale * cx, opts.headCenterY - scale * cy, -scale * cz],
  };
}
