/**
 * ThirdPersonCamera
 * — Keeps the existing orthographic `camera` centred on, and orbiting around,
 *   the player.  It does NOT listen for user input directly—that’s delegated to
 *   `camera-orbit-control.js`.  This class only handles:
 *     • Creating a pivot rig
 *     • Updating the rig’s position to follow the player
 *     • Exposing rotation helpers (yaw / pitch) for external controls
 *
 * IMPORT NOTES
 *   • `camera` is created in `js/main.js` and exported from there.
 *   • You must ensure `main.js` exports: `export const camera = ... ;`
 */

import * as THREE from '../cache/three.js';        // adjust if needed
import { camera } from '../main.js';               // <- existing orthographic cam

export class ThirdPersonCamera {
  /**
   * @param {THREE.Object3D} playerObj – root group of the player mesh
   * @param {Object} [opts]
   * @param {THREE.Vector3} [opts.offset] – default camera offset from player
   * @param {number} [opts.pitch]  – default pitch in radians (down-rotation)
   * @param {THREE.Scene} [opts.scene] – scene to which the rig should be added
   */
  constructor (playerObj, opts = {}) {
    this.player   = playerObj;
    this.offset   = opts.offset || new THREE.Vector3(20, 20, 20);
    this.minPitch = 0.1;             // almost top-down
    this.maxPitch = Math.PI / 2 - 0.1; // horizontal
    this.pitchVal = opts.pitch ?? Math.PI / 4; // 45°
    this.yawVal   = 0;

    // ── Rig hierarchy ─────────────────────────────────────────
    // pivot → yawNode → pitchNode → camera
    this.pivot      = new THREE.Group();
    this.pivot.name = 'CameraRig';

    this.yawNode      = new THREE.Group();
    this.yawNode.name = 'YawNode';
    this.pivot.add(this.yawNode);

    this.pitchNode      = new THREE.Group();
    this.pitchNode.name = 'PitchNode';
    this.yawNode.add(this.pitchNode);

    // Position camera and add to pitchNode
    camera.position.copy(this.offset);
    camera.lookAt(new THREE.Vector3());
    this.pitchNode.add(camera);

    // Add rig to scene if provided, otherwise to player's parent scene
    const scene = opts.scene || playerObj.parent;
    if (scene) scene.add(this.pivot);

    // Initial sync
    this.update(0);
  }

  // ────────────────────────────────────────────────────────────
  // Public
  // ────────────────────────────────────────────────────────────
  /**
   * Call every frame AFTER player movement update.
   * Keeps the rig centred on the player.
   * @param {number} _delta — time step (unused but left for symmetry)
   */
  update (_delta) {
    this.pivot.position.copy(this.player.position);
  }

  /**
   * Rotate the rig horizontally (yaw) and vertically (pitch).
   * Typically called by camera-orbit-control each frame.
   * @param {number} dYaw   – radians to add around Y axis
   * @param {number} dPitch – radians to add around X axis
   */
  orbit (dYaw, dPitch) {
    this.yawVal   += dYaw;
    this.pitchVal  = THREE.MathUtils.clamp(
      this.pitchVal + dPitch,
      this.minPitch,
      this.maxPitch
    );

    this.yawNode.rotation.y   = this.yawVal;
    this.pitchNode.rotation.x = this.pitchVal;
  }

  /**
   * Allow external scripts to zoom in/out by scaling the camera offset.
   * @param {number} factor – multiplier, e.g. 0.9 zooms in, 1.1 zooms out
   */
  zoom (factor = 1.0) {
    camera.position.multiplyScalar(factor);
    camera.updateProjectionMatrix();
  }
}

/**
 * Convenience factory.
 * @param {THREE.Object3D} playerObj
 * @param {Object} opts
 */
export function createThirdPersonCamera (playerObj, opts) {
  return new ThirdPersonCamera(playerObj, opts);
}
