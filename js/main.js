/* —————————————————— */
/*      main.js       */
/* —————————————————— */

// IMPORTS
import * as THREE from './cache/three.js';
import { PlayerMesh } from './player/player-mesh.js';
import { PlayerController } from './player/player-controller.js';
import { PlayerPhysics } from './player/player-physics.js';
import { createThirdPersonCamera } from './player/third-person-camera.js';

// TRANSITS
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
const aspect = window.innerWidth / window.innerHeight;
const d = 30;
const clock = new THREE.Clock();

// 1. Create player mesh and add to scene
export const playerMesh = new PlayerMesh();

// 2. Create input controller
const controller = new PlayerController();

// 3. Define how to detect solid blocks for physics (stub for now)
// const getBlock = (i, j, k) => {
//   // For now, assume nothing is solid:
//   return false;
// };
// For testing:
const getBlock = (i, j, k) => j <= 22;

// 4. Create physics handler
const physics = new PlayerPhysics(playerMesh.object3d, { getBlock });


// EXPORTS
export const gridSize  = 16;
export const gridDepth = 32;
export const soilDepth = 4;
export const airDepth  = 16;
export const groundDepth = gridDepth - airDepth;
export const soilStart   = groundDepth - soilDepth;
export const tileSize  = 4;
export const scene = new THREE.Scene();
export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
export const camera = new THREE.OrthographicCamera(-d*aspect, d*aspect, d, -d, 1, 1000);
export const raycaster       = new THREE.Raycaster();
export const mouse           = new THREE.Vector2();
export const intersectMeshes = [];
export const chunks = [];
export const CHUNK_SIZE = { x:8, y:8, z:gridDepth };
export const CHUNK_COUNT = {
  x: Math.ceil(gridSize  / CHUNK_SIZE.x),
  y: Math.ceil(gridSize  / CHUNK_SIZE.y),
  z: Math.ceil(gridDepth / CHUNK_SIZE.z)
};
export const environment = window.location.host.startsWith('localhost') ? 'dev' : 'prod';
export const resources = environment === 'dev' ? { hay: 50, stone: 50, grass: 50, soil: 50, wood: 50, leaves: 50 } : {};
export const BREAKABLE_TEXTURES = ['hay','grass','soil','stone', 'wood', 'leaves'];
export const PLACEABLE_STRUCTURES = ['tree'];

// Begin Large Content Paint
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(playerMesh.object3d);
const tpcam = createThirdPersonCamera(playerMesh.object3d, { scene });

// Lighting
scene.add(new THREE.AmbientLight(0xAAAAAA, 0.5));
scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444, 0.6));
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 128;
dirLight.shadow.mapSize.height = 128;
dirLight.shadow.radius = 4; // adds blur to the shadow edges

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

dirLight.position.set(-15,-15,-15);
scene.add(dirLight);

// bounce/fill light example
// const fillLight = new THREE.DirectionalLight(0xaaaaaa, 1.5);
// fillLight.position.set(20, 10.5, 11);
// scene.add(fillLight);



animate();

function animate() {

  // 1) schedule next frame
  requestAnimationFrame(animate);

  // 3) ensure camera world‐matrix is fresh
  camera.updateMatrixWorld();

  // 4) frustum‐cull each chunk (or leave visible=true for debug)
  const frustum = new THREE.Frustum();
  const projMatrix = new THREE.Matrix4()
    .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  frustum.setFromProjectionMatrix(projMatrix);
  const t = clock.getElapsedTime();
  chunks.forEach(chunk => {
    const visible = frustum.intersectsBox(chunk.boundingBox);
    const mat = chunk.hayMesh.material;
    if (mat.userData.uTimeUniform) mat.userData.uTimeUniform.value = t;
    for (const name of BREAKABLE_TEXTURES) chunk[`${name}Mesh`].visible = visible;
  });

  const delta = clock.getDelta();
  const input = controller.pollInput(); // pass to PlayerPhysics

  // --- update player physics
  physics.update(delta, input);

  // --- update camera position
  tpcam.update(delta);

  // --- update player visual (crouch, etc)
  playerMesh.updatePose(input);

  // 5) finally render
  renderer.render(scene, camera);
}
