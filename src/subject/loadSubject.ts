import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SUBJECT_HEAD_Y } from '../domain/lightProps';
import { fitHeadTransform } from './headTransform';
import { buildBlockoutHead } from './blockoutHead';
import { GENERIC_HEAD, resolveModelUrl } from './subjectSource';

// Tunable: controller will fine-tune by eye after visual verification
const TARGET_HEIGHT = 0.32; // metres

const SKIN = new THREE.MeshStandardMaterial({ color: 0xc9b29c, roughness: 0.62, metalness: 0 });

const cache = new Map<string, Promise<THREE.Object3D>>();

/** Load a subject head by model key ('genericHead') or URL (e.g. an uploaded object URL). */
export function loadSubjectHead(model: string = GENERIC_HEAD): Promise<THREE.Object3D> {
  const url = resolveModelUrl(model);
  let entry = cache.get(url);
  if (!entry) {
    entry = build(url);
    cache.set(url, entry);
  }
  return entry;
}

async function build(url: string): Promise<THREE.Object3D> {
  try {
    const gltf = await new GLTFLoader().loadAsync(url);
    const root = gltf.scene;
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if ((m as any).isMesh) {
        m.material = SKIN;
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    const b = new THREE.Box3().setFromObject(root);
    const fit = fitHeadTransform(
      { min: b.min, max: b.max },
      { targetHeight: TARGET_HEIGHT, headCenterY: SUBJECT_HEAD_Y },
    );
    const group = new THREE.Group();
    group.add(root);
    group.scale.setScalar(fit.scale);
    group.position.set(fit.position[0], fit.position[1], fit.position[2]);
    return group;
  } catch (err) {
    console.warn('[LIGHT ROOM] subject head failed to load; using blockout fallback', err);
    return buildBlockoutHead();
  }
}
