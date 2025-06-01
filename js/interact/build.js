/* —————————————————— */
/*     build.js       */
/* —————————————————— */

import * as THREE from '../cache/three.js';
import {
  raycaster,
  mouse,
  camera,
  renderer,
  intersectMeshes,
  resources,
  chunks,
  gridSize,
  gridDepth,
  BREAKABLE_TEXTURES,
  PLACEABLE_STRUCTURES
} from '../main.js';
import { modeState, resetModes } from './mode-state.js';
import { getChunkIndex } from '../world/chunk.js';
import { updateMouseCoords } from './helpers.js';
import { highlightBox, notAllowedBox } from '../world/textures.js';
import { generateTree } from '../world/flora/trees.js';

// which block type is currently selected for placement
let selectedType = null;

// start build mode when clicking a resource counter
BREAKABLE_TEXTURES.forEach(type => {
  const el = document.getElementById(`${type}-button`);
  el.style.cursor = 'pointer';
  el.addEventListener('click', () => {
    if ((resources[type] || 0) <= 0) return;
    selectedType = type;
    resetModes(); // clear clicking context just in case
    modeState.placing = true;
    // document.body.style.cursor = `url(assets/icons/${type}.png) 0 0, auto`;
    highlightBox.visible = notAllowedBox.visible = false;
  });
});

// start build mode when clicking a resource counter
PLACEABLE_STRUCTURES.forEach(type => {
  const el = document.getElementById(`${type}-button`);
  el.style.cursor = 'pointer';
  el.addEventListener('click', () => {
    // if ((resources[type] || 0) <= 0) return;
    selectedType = type;
    resetModes(); // clear clicking context just in case
    if (type === 'tree') modeState.treePlanting = true;
    // document.body.style.cursor = `url(assets/icons/${type}.png) 0 0, auto`;
    highlightBox.visible = notAllowedBox.visible = false;
  });
});

// preview placement on hover
renderer.domElement.addEventListener('pointermove', e => {
  if (!modeState.placing && !modeState.treePlanting) return;
  updateMouseCoords(e);
  if (modeState.treePlanting){ // for testing
    updateBuildHighlight(true);
  } else {
    updateBuildHighlight((resources[selectedType] || 0) > 0);
  }
});

// place block on click
renderer.domElement.addEventListener('click', e => {
  if (!modeState.placing && !modeState.treePlanting) return;
  updateMouseCoords(e);
  placeBlock(selectedType, 'player');
});

export function updateBuildHighlight(canPlace) {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(intersectMeshes, true).filter(h => h.instanceId !== undefined);

  if (!hits.length) {
    highlightBox.visible = false;
    notAllowedBox.visible = true;
    return;
  }
  // pick the highest hit…
  const hit = hits.reduce((top,h) => h.point.y>top.point.y? h: top, hits[0]);

  const { object, face, instanceId } = hit;
  const baseType = object.userData.tileType;
  const chunk    = object.userData.chunk;
  const coord    = chunk.instanceCoord[baseType][instanceId];
  let { x:i, y:j, z:k } = coord;
  const n = face.normal;

  // adjacent cell in direction of pointed face
  if (n.y > 0.5)       k += 1;
  else if (n.y < -0.5) k -= 1;
  else if (n.x > 0.5)  i += 1;
  else if (n.x < -0.5) i -= 1;
  else if (n.z > 0.5)  j += 1;
  else if (n.z < -0.5) j -= 1;

  // bounds check
  const outOfBounds = i<0||i>=gridSize||j<0||j>=gridSize||k<0||k>=gridDepth;
  if (outOfBounds) {
    highlightBox.visible = false;
    notAllowedBox.visible = true;
    return;
  }

  // check occupancy in that chunk
  const targetChunk = chunks[getChunkIndex(i,j,k)];

  // position preview box at target cell
  const [wx, wy, wz] = targetChunk.computePosition(i,j,k);
  const m = new THREE.Matrix4().makeTranslation(wx, wy, wz);
  highlightBox.matrix.copy(m);
  notAllowedBox.matrix.copy(m);
  highlightBox.matrixAutoUpdate = notAllowedBox.matrixAutoUpdate = false;

  highlightBox.visible  = canPlace;
  notAllowedBox.visible = !canPlace;
}

export function placeBlock(blockType, initiator, externalX = null, externalY = null, externalZ = null) {
  let placeX;
  let placeY;
  let placeZ;
  if (initiator === 'player') {
    raycaster.setFromCamera(mouse, camera);

    // 1) get *all* non-air hits
    const hits = raycaster.intersectObjects(intersectMeshes, true)
      .filter(h => h.instanceId !== undefined);

    // 2) nothing hit?
    if (hits.length === 0) {
      highlightBox.visible = notAllowedBox.visible = false;
      return;
    }

    // 3) pick the one whose intersection point is *highest* in world-space
    const hit = hits.reduce((top, h) =>
      h.point.y > top.point.y ? h : top,
      hits[0]
    );

    const { object, face, instanceId } = hit;
    const baseType = object.userData.tileType;
    const chunk    = object.userData.chunk;
    const coord    = chunk.instanceCoord[baseType][instanceId];
    let { x:i, y:j, z:k } = coord;
    const n = face.normal;

    if (n.y > 0.5)       k += 1;
    else if (n.y < -0.5) k -= 1;
    else if (n.x > 0.5)  i += 1;
    else if (n.x < -0.5) i -= 1;
    else if (n.z > 0.5)  j += 1;
    else if (n.z < -0.5) j -= 1;

    // bounds check
    if (i<0||i>=gridSize||j<0||j>=gridSize||k<0||k>=gridDepth) return;

    placeX = i;
    placeY = j;
    placeZ = k;
  } else if (initiator === 'flora') {
    placeX = externalX;
    placeY = externalY;
    placeZ = externalZ;
  }

  const targetChunk = chunks[getChunkIndex(placeX,placeY,placeZ)];

  if (blockType === 'tree') {
    generateTree(targetChunk, placeX, placeY, placeZ-1);
  } else {
    if ((resources[blockType] || 0) <= 0) return;

    // actually place
    targetChunk.addBlock(placeX,placeY,placeZ, blockType);
    targetChunk.finalize();

    // remain in build mode for continuous placement
    if (initiator === 'player') {
      updateBuildHighlight();
      // update inventory
      resources[blockType]--;
      document.getElementById(`${blockType}-count`).textContent = resources[blockType];
    }
  }
}
