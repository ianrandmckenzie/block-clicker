/* —————————————————— */
/*     camera.js      */
/* —————————————————— */

import * as THREE from '../cache/three.js';
import { camera, renderer, gridDepth, tileSize, gridSize } from '../main.js';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OrbitControls } from '../cache/addons/controls/OrbitControls.js'; // offline opt
import { resetModes } from '../interact/mode-state.js';

export const halfY = (gridDepth * tileSize)/2 - tileSize/2;
export const halfX = (gridSize*tileSize)/2 - tileSize/2;

const camBtn = document.getElementById('camera-button');

camBtn.addEventListener('click', () => {
  document.body.style.cursor = 'url(assets/icons/camera.png) 0 0, auto';
});

// true isometric angles:
const yaw     = Math.PI / 4;                // 45° around Y
const incline = Math.atan(Math.sqrt(1/2));  // ≈35.26° down from horizontal
const dist    = 60;                         // how far out to sit

camera.position.set(
  dist * Math.cos(yaw),     // x
  dist * Math.sin(incline), // y
  dist * Math.sin(yaw)      // z
);
// camera.position.set(50, 19, 50);
camera.lookAt(0, halfY, 0);
// camera.scale.set(1.4,1.4,1.4);

renderer.domElement.addEventListener('pointerdown', e =>
  e.button === 1 && resetModes()
);

// Camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableRotate = true;
controls.enableZoom   = true;
controls.enablePan    = true;
controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
controls.touches.ONE       = THREE.TOUCH.PAN;

const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');

zoomInBtn.addEventListener('click', () => {
  zoomCamera(-10);
});

zoomOutBtn.addEventListener('click', () => {
  zoomCamera(10);
});

window.addEventListener('keydown', e => {
  e.key === 'Escape' && resetModes();

  let delta = 0;
  if (e.key !== '=' && e.key !== '-') return;
  if (e.key === '=') { delta = -10 }
  if (e.key === '-') { delta = 10 }
  zoomCamera(delta);
});

export function zoomCamera(delta) {
  var scale = camera.scale.z;
  if (delta > 0) { // Zoom in
      scale += 0.1;
  } else if (delta < 0) { // Zoom out
      scale -= 0.1;
  }
  camera.scale.set(scale, scale, scale);
}
