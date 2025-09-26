/**
 * Creates and manages the visual representation of the player.
 * Adjust the import path to Three.js to fit your local cache.
 */

import * as THREE from '../cache/three.js'; // <-- change if your path differs
import {
  CHARACTER_DIMENSIONS,
  TILE_SIZE
} from './character-config.js';

/**
 * Simple, lightweight player mesh:
 * - One box for the body (1×1×2 tiles)
 * - Optional head mesh for future customization
 * Swap `buildBody()` with a GLTF/FBX loader if you have a character model.
 */
export class PlayerMesh {
  constructor () {
    this.group = new THREE.Group();
    this.group.name = 'Player';

    this.body = this.buildBody();
    this.group.add(this.body);

    // Origin sits at player’s feet so Y = 0 is ground level.
    this.group.position.set(0, CHARACTER_DIMENSIONS.height / 2, 0);
  }

  // ────────────────────────────────────────────────────────────
  // Construction helpers
  // ────────────────────────────────────────────────────────────
  buildBody () {
    const geo = new THREE.BoxGeometry(
      CHARACTER_DIMENSIONS.width,
      CHARACTER_DIMENSIONS.height,
      CHARACTER_DIMENSIONS.depth
    );

    const mat = new THREE.MeshStandardMaterial({
      color: 0x4b9eff, // placeholder blue—replace with texture/material
      roughness: 0.5,
      metalness: 0.1
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    mesh.name = 'PlayerBody';
    return mesh;
  }

  // ────────────────────────────────────────────────────────────
  // Pose updates
  // ────────────────────────────────────────────────────────────
  /**
   * Update mesh size/offsets based on player state.
   * @param {Object} state
   *   { crouching: Boolean, sneaking: Boolean }
   */
  updatePose (state) {
    const { crouching } = state;

    // Height adjustment (crouch ⇒ 1 tile tall, stand ⇒ 2 tiles)
    const targetHeight = crouching
      ? CHARACTER_DIMENSIONS.crouchHeight
      : CHARACTER_DIMENSIONS.height;

    this.body.scale.y = targetHeight / CHARACTER_DIMENSIONS.height;

    // Re-align origin so feet stay on ground
    this.group.position.y = (targetHeight / 2);
  }

  /**
   * Expose the root THREE.Object3D for external use.
   */
  get object3d () {
    return this.group;
  }
}

/**
 * Convenience factory if you prefer a function export.
 * @returns {PlayerMesh}
 */
export function createPlayerMesh () {
  return new PlayerMesh();
}
