import { chunks } from '../main.js';

/**
 * Remove an existing instance of the given type at (i,j,k) within `chunk`.
 * Utility because Chunk.removeInstance expects the *index* into the coord list.
 */
function removeInstanceByCoord(chunk, type, idx) {
  if (idx !== undefined && idx !== -1) {
    chunk.removeInstance(type, idx);
  }
}

setTimeout(() => {
  let removedCount = 0;
  const toRemove = [];

  // 1) gather all the (chunk, ic) pairs you want to remove
  for (const chunk of chunks) {
    for (const ic of chunk.instanceCoord.hay) {
      toRemove.push({ chunk, ic });
    }
  }

  // 2) remove them in a separate loop
  for (const { chunk, ic } of toRemove) {
    removeInstanceByCoord(chunk, 'hay', ic);
    removedCount++;
  }
}, 0);
