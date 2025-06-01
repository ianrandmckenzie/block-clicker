/* —————————————————— */
/*     chunk.js       */
/* —————————————————— */

import * as THREE from '../cache/three.js';
import { Vector3, Box3 } from '../cache/three.js';
import { chunks, CHUNK_SIZE, CHUNK_COUNT, groundDepth,
         gridSize, tileSize, scene, gridDepth, soilStart,
         intersectMeshes, environment } from '../main.js';
import { meshConfigs } from './textures.js';
import { generateTree } from './flora/trees.js';

export class Chunk {
  constructor(cx, cy, cz) {
    this.cx = cx; this.cy = cy; this.cz = cz;
    this.origin = {
      i: this.cx * CHUNK_SIZE.x,
      j: this.cy * CHUNK_SIZE.y,
      k: this.cz * CHUNK_SIZE.z
    };

    this.meshes        = {};
    this.counts        = {};
    this.instanceCoord = {};

    const halfX = (gridSize*tileSize)/2 - tileSize/2;
    const halfY = (gridDepth*tileSize)/2 - tileSize/2;
    const min = new Vector3(
      this.origin.i * tileSize - halfX,
      this.origin.k * tileSize - halfY,
      this.origin.j * tileSize - halfX
    );
    const max = min.clone().add(new Vector3(
      CHUNK_SIZE.x*tileSize, CHUNK_SIZE.z*tileSize, CHUNK_SIZE.y*tileSize
    ));
    this.boundingBox = new Box3(min, max);

    for (const [type, { ctor, transparent, opacity }] of Object.entries(meshConfigs)) {
      const mesh = ctor();

      this[`${type}Mesh`] = mesh;

      // shared setup:
      mesh.userData    = { tileType: type, chunk: this };
      if (transparent  !== undefined) mesh.transparent = transparent;
      if (opacity      !== undefined) mesh.opacity     = opacity;

      // group collections:
      this.meshes[type] = mesh;
      if (type !== 'air') this.counts[type] = 0;
      this.instanceCoord[type] = [];

      scene.add(mesh);
      intersectMeshes.push(mesh);
    }
  }

  addBlock(i, j, k, type) {
    const mesh = this.meshes[type];
    if (!mesh) console.log(type);
    if (!mesh) return;
    const index = this.counts[type]++;

    // use the world-space position you already wrote
    const [x, y, z] = this.computePosition(i, j, k);
    const mtx = new THREE.Matrix4().makeTranslation(x, y, z);
    mesh.setMatrixAt(index, mtx);
    this.instanceCoord[type].push({ x: i, y: j, z: k });
  }

  computePosition(i, j, k) {
    const halfX = (gridSize * tileSize) / 2 - tileSize / 2;
    const halfY = (gridDepth * tileSize) / 2 - tileSize / 2;

    return [
      i * tileSize - halfX + tileSize / 2,
      k * tileSize - halfY + tileSize / 2,
      j * tileSize - halfX + tileSize / 2
    ];
  }

  removeInstance(type, idx) {
    const mesh = this.meshes[type];
    const last = this.counts[type] - 1;
    if (idx !== last) {
      // swap the last matrix into idx
      const tmpM = new THREE.Matrix4();
      mesh.getMatrixAt(last, tmpM);
      mesh.setMatrixAt(idx, tmpM);
      // swap coord data
      this.instanceCoord[type][idx] = this.instanceCoord[type][last];
    }
    // drop the last entry
    this.instanceCoord[type].pop();
    this.counts[type]--;
    mesh.count = this.counts[type];
    mesh.instanceMatrix.needsUpdate = true;
  }

  finalize() {
    for (const type in this.meshes) {
      const mesh = this.meshes[type];
      mesh.count = this.counts[type];
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

/**
 * Computes the linear chunk index for a given world (i,j,k) tile coordinate.
 */
export function getChunkIndex(i, j, k) {
  const cx = Math.floor(i / CHUNK_SIZE.x);
  const cy = Math.floor(j / CHUNK_SIZE.y);
  const cz = Math.floor(k / CHUNK_SIZE.z);
  return cx * CHUNK_COUNT.y * CHUNK_COUNT.z + cy * CHUNK_COUNT.z + cz;
}

// build and populate chunks
for (let cx=0; cx<CHUNK_COUNT.x; cx++) {
  for (let cy=0; cy<CHUNK_COUNT.y; cy++) {
    for (let cz=0; cz<CHUNK_COUNT.z; cz++) {
      chunks.push(new Chunk(cx, cy, cz));
    }
  }
}
let treePlaced = false;
for (let i = 0; i < gridSize; i++) {
  for (let j = 0; j < gridSize; j++) {
    for (let k = 0; k < gridDepth; k++) {
      const type =
        k >= soilStart + 3 ? 'hay' :
        k >= soilStart + 2 ? 'grass' :
        k >= soilStart     ? 'soil' : 'stone';

      const cx = Math.floor(i / CHUNK_SIZE.x);
      const cy = Math.floor(j / CHUNK_SIZE.y);
      const cz = Math.floor(k / CHUNK_SIZE.z);
      const idx = cx * CHUNK_COUNT.y * CHUNK_COUNT.z
                + cy * CHUNK_COUNT.z
                + cz;

      // generate one tree at world center on first soil block
      if (!treePlaced
          && i === Math.floor(gridSize/2)
          && j === Math.floor(gridSize/2)
          && type === 'grass') {
        treePlaced = true;
        generateTree(chunks[idx], i, j, k);
      }
      chunks[idx].addBlock(i, j, k, type);
    }
  }
}
chunks.forEach(c=> {
  c.finalize();
});
