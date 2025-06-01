/* —————————————————— */
/*       dig.js       */
/* —————————————————— */

import * as THREE from '../cache/three.js';
import {
  raycaster,
  mouse,
  camera,
  renderer,
  intersectMeshes,
  resources,
  chunks
} from '../main.js';
import { modeState, resetModes } from './mode-state.js';
import { updateMouseCoords } from './helpers.js';
import { highlightBox, notAllowedBox, blockObjects } from '../world/textures.js'

// 1) Toggle dig mode
const digBtn = document.getElementById('dig-button');
digBtn.addEventListener('click', () => {
  resetModes();
  modeState.digging = !modeState.digging;
  highlightBox.visible = false;
  notAllowedBox.visible = false;
});

// 2) On pointer move, raycast & show highlight/notAllowed
renderer.domElement.addEventListener('pointermove', (e) => {
  if (!modeState.digging) return;
  updateMouseCoords(e);

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(intersectMeshes, true);
  const hit = hits.find(h => {
    // instanced meshes always have instanceId >= 0
    return h.instanceId !== undefined

  });
  if (!hit) {
    highlightBox.visible = false;
    notAllowedBox.visible = false;
    return;
  }

  const { object, instanceId } = hit;
  const type = object.userData.tileType;
  const rule = blockObjects[type].actions.dig;
  if (rule.tool) {
    document.body.style.cursor = `url(assets/icons/${rule.tool}.png) 0 31, auto`;
  } else {
    document.body.style.cursor = 'auto';
  }
  // count total remaining of this type
  const total = chunks.reduce((sum, c) => sum + c.counts[type], 0);
  const canDig = total > (rule.allowIf?.minRemainingBlocks || 1);

  // position the preview box
  const mat = object.matrixWorld.clone()
    .multiply(new THREE.Matrix4().makeTranslation(
      hit.point.x - hit.point.x,
      hit.point.y - hit.point.y,
      hit.point.z - hit.point.z
    ));
  // simpler: just reuse the instanced‐mesh matrix
  object.getMatrixAt(instanceId, mat);
  highlightBox.matrix.copy(mat);
  notAllowedBox.matrix.copy(mat);
  highlightBox.matrixAutoUpdate = false;
  notAllowedBox.matrixAutoUpdate = false;

  if (canDig) {
    highlightBox.visible = true;
    notAllowedBox.visible = false;
  } else {
    highlightBox.visible = false;
    notAllowedBox.visible = true;
  }
});

// 3) On click: actually remove
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (!modeState.digging) return;
  updateMouseCoords(e);
  destroyBlock();
});

function destroyBlock() {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(intersectMeshes, true);
  const hit = hits.find(h =>
    h.instanceId !== undefined
    && h.object.userData.tileType !== 'air'
  );
  if (!hit) return;

  const { object, instanceId } = hit;
  const type = object.userData.tileType;
  const rule = blockObjects[type].actions.dig;
  const total = chunks.reduce((sum, c) => sum + c.counts[type], 0);

  if (total <= (rule.allowIf?.minRemainingBlocks || 1)) {
    // nothing to do
    return;
  }

  // find its chunk and local index
  const chunk = object.userData.chunk;
  // remove it from that chunk
  chunk.removeInstance(type, instanceId);
  // decrement global inventory
  resources[type] = (resources[type] || 0) + (rule.yield[type] || 1);

  // update your UI counter, e.g.:
  const el = document.getElementById(`${type}-count`);
  if (el) el.textContent = resources[type];
}
