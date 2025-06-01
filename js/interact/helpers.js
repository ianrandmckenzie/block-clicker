/* —————————————————— */
/*     helpers.js     */
/* —————————————————— */

import { renderer, mouse } from '../main.js';

// normalize mouse coords relative to the canvas
export function updateMouseCoords(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
  mouse.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1;
}
