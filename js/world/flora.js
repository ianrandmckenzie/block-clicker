/* ------------------------------------------------------------------ */
/*  flora.js                                                          */
/*                                                                    */
/*  High‑level vegetation helpers.                                    */
/*                                                                    */
/*  growHayOverGrass()                                                */
/*  --------------------                                              */
/*  Scans every chunk for "grass" blocks, checks the voxel directly   */
/*  above each one, and if that voxel is empty *or* contains an "air" */
/*  placeholder, it places a "plant" block in that space.             */
/*                                                                    */
/*  Assumptions:                                                      */
/*    • placeBlock(i,j,k,type) is globally available (or imported).   */
/*    • `chunks`, and `getChunkIndex` are imported.                   */
/* ------------------------------------------------------------------ */

import { chunks } from '../main.js';
import { getChunkIndex } from '../world/chunk.js';
import { placeBlock } from '../interact/build.js'

/* —―― utility: does ANY non-air block occupy (i,j,k)? ――― */
export function isOccupied(i, j, k) {
  const chunkIdx = getChunkIndex(i, j, k);
  const chk = chunks[chunkIdx]
  // If (i,j,k) is outside world bounds, treat as “occupied” to prevent out‐of‐bounds placement.
  if (!chk) return true

  // Check each type’s instanceCoord to see if any stored coordinate matches:
  for (const [t, arr] of Object.entries(chk.instanceCoord)) {
    if (t === 'air') continue
    if (arr.some(c => c.x === i && c.y === j && c.z === k)) {
      return true
    }
  }
  return false
}

/**
 * Iterates all grass voxels and spawns plant in the cell above when vacant (or air).
 */
export function growSingleOverGrass(type, i, j, k) {
  for (const chunk of chunks) {
    const grassCoords = chunk.instanceCoord.grass;
    for (let g = 0; g < grassCoords.length; g++) {
      // If anything non‑air already occupies the above voxel, skip.
      const iAbove = i, jAbove = j, kAbove = k + 1;
      if (isOccupied(iAbove, jAbove, kAbove)) continue;

      placeBlock(type, 'flora', i, j, k + 1);
    }
  }
}

// // ─── Random hay growth: every 5 s convert 0-5 % of existing grass ───
(function randomHayGrowth() {
  const INTERVAL = 5000;          // 5 s
  const MAX_PCT  = 0.001;          // up to 5 %

  setTimeout(function tick() {
    /* 1. flatten all grass coordinates into a single array */
    const allGrass = [];
    chunks.forEach(chunk =>
      chunk.instanceCoord.grass.forEach(c => allGrass.push({ ...c }))
    );

    /* 2. choose how many to convert this cycle (0 … 5 % of total) */
    const pickCount = Math.floor(Math.random() * (allGrass.length * MAX_PCT + 1));

    /* 3. shuffle-select that many and grow hay over them */
    for (let n = 0; n < pickCount; n++) {
      const idx = Math.floor(Math.random() * allGrass.length);
      const { x, y, z } = allGrass.splice(idx, 1)[0];  // remove so we don’t pick twice
      growSingleOverGrass('hay', x, y, z);                    // your helper places hay above
    }

    setTimeout(tick, INTERVAL);     // reschedule
  }, INTERVAL);
})();
