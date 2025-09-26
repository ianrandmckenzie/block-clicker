/**
 * PlayerController
 * ‒ Listens to keyboard (and optional game-pad later)
 * ‒ Exposes the player’s desired movement each frame
 *
 * Controls (default):
 *   • W / ArrowUp    → forward
 *   • S / ArrowDown  → back
 *   • A / ArrowLeft  → left
 *   • D / ArrowRight → right
 *   • Space          → jump
 *   • Shift (⇧)      → sprint
 *   • Ctrl  (⌃)      → crouch
 *   • Alt   (⌥)      → sneak
 *
 * Only **one** speed modifier is active at a time, with priority:
 * crouch > sneak > sprint > walk
 */

import * as THREE from '../cache/three.js'; // adjust path if needed
import { SPEED } from './character-config.js';

export class PlayerController {
  constructor (dom = document) {
    // Movement intention
    this.dir         = new THREE.Vector2(); // X (left/right), Y (forward/back)
    this.jumpPressed = false;

    // State flags
    this.modifier = 'walk'; // walk | sprint | crouch | sneak

    // Private
    this._keys = new Map();
    this._bindListeners(dom);
  }

  // ────────────────────────────────────────────────────────────
  // Public API
  // ────────────────────────────────────────────────────────────
  /**
   * Call every frame BEFORE physics update.
   * @returns {Object} { direction: THREE.Vector2, speedMul, jump, crouching, sneaking }
   */
  pollInput (playerMesh) {
    // Direction
    const forward = (this._isDown('KeyW') || this._isDown('ArrowUp')) ? 1 : 0;
    const back    = (this._isDown('KeyS') || this._isDown('ArrowDown')) ? 1 : 0;
    const left    = (this._isDown('KeyA') || this._isDown('ArrowLeft')) ? 1 : 0;
    const right   = (this._isDown('KeyD') || this._isDown('ArrowRight')) ? 1 : 0;

    // Update dir vector (Y = forward/back, X = left/right)
    this.dir.set(right - left, forward - back).normalize();

    // Determine active speed modifier (priority: crouch > sneak > sprint > walk)
    if (this._isDown('ControlLeft') || this._isDown('ControlRight')) {
      this.modifier = 'crouch';
    } else if (this._isDown('AltLeft') || this._isDown('AltRight')) {
      this.modifier = 'sneak';
    } else if (this._isDown('ShiftLeft') || this._isDown('ShiftRight')) {
      this.modifier = 'sprint';
    } else {
      this.modifier = 'walk';
    }

    // Jump handling: rising edge detection
    let jumpNow = false;
    if (this._isDown('Space') && !this.jumpPressed) {
      jumpNow = true;            // We register a jump once
      this.jumpPressed = true;   // until space is released
    }
    if (!this._isDown('Space')) {
      this.jumpPressed = false;
    }

    return {
      direction : this.dir.clone(),          // Vector2
      speedMul  : SPEED[this.modifier],      // 1 / 1.5 / 0.75 / 0.25
      jump      : jumpNow,                   // Boolean
      crouching : this.modifier === 'crouch',
      sneaking  : this.modifier === 'sneak',
      sprinting : this.modifier === 'sprint'
    };
  }

  // ────────────────────────────────────────────────────────────
  // Private
  // ────────────────────────────────────────────────────────────
  _bindListeners (dom) {
    dom.addEventListener('keydown', (e) => this._keys.set(e.code, true));
    dom.addEventListener('keyup',   (e) => this._keys.set(e.code, false));
    // Prevent browser scrolling with arrow keys/space while focused
    window.addEventListener('keydown', (e) => {
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  _isDown (code) {
    return this._keys.get(code) === true;
  }
}

/**
 * Convenience factory.
 * @param {HTMLElement|Document} dom
 * @returns {PlayerController}
 */
export function createPlayerController (dom = document) {
  return new PlayerController(dom);
}
