import * as THREE from 'three';
import { SUBJECT_HEAD_Y } from '../domain/lightProps';

/** A neutral blockout head+shoulders with a protruding nose and brow so shadows read. */
export function buildBlockoutHead(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xb9b4ad, roughness: 0.72, metalness: 0 });
  const y = SUBJECT_HEAD_Y;

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.105, 48, 48), mat);
  cranium.position.set(0, y, 0);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.06, 16), mat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, y - 0.01, 0.105);

  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.018, 0.025), mat);
  brow.position.set(0, y + 0.045, 0.095);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.13, 24), mat);
  neck.position.set(0, y - 0.16, 0);

  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.22), mat);
  shoulders.position.set(0, y - 0.30, 0);

  for (const m of [cranium, nose, brow, neck, shoulders]) {
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  return g;
}
