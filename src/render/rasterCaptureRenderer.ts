import * as THREE from 'three';
import type { Rig } from '../domain/types';
import type { CaptureRenderer } from './CaptureRenderer';
import { buildLightProps, SUBJECT_HEAD_Y } from '../domain/lightProps';
import { exposureMultiplier } from '../domain/exposure';
import { loadSubjectHead } from '../subject/loadSubject';

export class RasterCaptureRenderer implements CaptureRenderer {
  async render(rig: Rig, width = 768, height = 1024): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = exposureMultiplier(rig.camera.exposure);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshStandardMaterial({ color: 0x070707, roughness: 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    scene.add(await loadSubjectHead());

    for (const light of rig.lights) {
      const p = buildLightProps(light);
      const penumbra = Math.min(1, p.softness);
      const spot = new THREE.SpotLight(
        new THREE.Color(p.color[0], p.color[1], p.color[2]),
        p.intensity,
        0,
        Math.PI / 4,
        penumbra,
        2
      );
      spot.position.set(p.position[0], p.position[1], p.position[2]);
      spot.target.position.set(p.target[0], p.target[1], p.target[2]);
      spot.castShadow = true;
      spot.shadow.mapSize.set(2048, 2048);
      spot.shadow.camera.near = 0.1;
      spot.shadow.camera.far = 20;
      spot.shadow.bias = -0.0004;
      spot.shadow.radius = 1 + p.softness * 14;
      spot.shadow.blurSamples = 16;
      scene.add(spot);
      scene.add(spot.target);
    }

    const cam = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    if (rig.camera.angle === 'profile') {
      cam.position.set(2.2, SUBJECT_HEAD_Y, 0.0001);
    } else {
      cam.position.set(0, SUBJECT_HEAD_Y, 2.2);
    }
    cam.lookAt(0, SUBJECT_HEAD_Y, 0);

    renderer.render(scene, cam);
    const url = canvas.toDataURL('image/png');
    renderer.dispose();
    renderer.forceContextLoss();
    return url;
  }
}
