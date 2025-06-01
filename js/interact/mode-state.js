/* —————————————————— */
/*   mode-state.js    */
/* —————————————————— */

import { highlightBox } from '../world/textures.js'

export const modeState = {
  digging:      false,
  placing:      false,
  treePlanting: false
};

// resets all modes + cursor
export function resetModes() {
  modeState.digging      = false;
  modeState.placing      = false;
  modeState.treePlanting = false;
  document.body.style.cursor = 'auto';
  highlightBox.visible = false;
}
