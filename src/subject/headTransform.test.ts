import { describe, it, expect } from 'vitest';
import { fitHeadTransform } from './headTransform';

describe('fitHeadTransform', () => {
  it('scales an 8-unit-tall box centred at origin so the world centroid lands at headCenterY', () => {
    // Box 8 units tall centred near origin: min y=-4, max y=4
    const box = { min: { x: -1, y: -4, z: -1 }, max: { x: 1, y: 4, z: 1 } };
    const opts = { targetHeight: 0.32, headCenterY: 1.5 };
    const fit = fitHeadTransform(box, opts);

    expect(fit.scale).toBeCloseTo(0.32 / 8, 10);

    // World centroid Y = position[1] + scale * cy, where cy = (−4 + 4)/2 = 0
    const cy = (box.min.y + box.max.y) / 2;
    const worldCentroidY = fit.position[1] + fit.scale * cy;
    expect(worldCentroidY).toBeCloseTo(opts.headCenterY, 10);

    // X and Z should recenter to 0: position[0] + scale * cx = 0
    const cx = (box.min.x + box.max.x) / 2;
    const cz = (box.min.z + box.max.z) / 2;
    expect(fit.position[0] + fit.scale * cx).toBeCloseTo(0, 10);
    expect(fit.position[2] + fit.scale * cz).toBeCloseTo(0, 10);
  });

  it('recenters a non-origin-offset box so world centroid is (0, headCenterY, 0)', () => {
    // min {1,2,3} max {3,10,5} → height = 8, cx=2, cy=6, cz=4
    const box = { min: { x: 1, y: 2, z: 3 }, max: { x: 3, y: 10, z: 5 } };
    const opts = { targetHeight: 0.32, headCenterY: 1.5 };
    const fit = fitHeadTransform(box, opts);

    const cx = (box.min.x + box.max.x) / 2; // 2
    const cy = (box.min.y + box.max.y) / 2; // 6
    const cz = (box.min.z + box.max.z) / 2; // 4

    const worldCentroidX = fit.position[0] + fit.scale * cx;
    const worldCentroidY = fit.position[1] + fit.scale * cy;
    const worldCentroidZ = fit.position[2] + fit.scale * cz;

    expect(worldCentroidX).toBeCloseTo(0, 10);
    expect(worldCentroidY).toBeCloseTo(opts.headCenterY, 10);
    expect(worldCentroidZ).toBeCloseTo(0, 10);
  });

  it('returns the correct scale regardless of box offset', () => {
    const box = { min: { x: 1, y: 2, z: 3 }, max: { x: 3, y: 10, z: 5 } };
    const opts = { targetHeight: 0.32, headCenterY: 1.5 };
    const fit = fitHeadTransform(box, opts);
    expect(fit.scale).toBeCloseTo(0.32 / 8, 10);
  });
});
