/**
 * PlayerPhysics
 * — Handles movement, jumping, gravity, and basic collision against a
 *   block-based world (InstancedMesh tiles flagged with userData.collision = true).
 *
 * USAGE
 *   const physics = new PlayerPhysics(playerMesh.object3d, {
 *     /** Given integer grid coords (i, j, k) → returns true if block is solid *\/
 *     getBlock: (i, j, k) => world.isSolidAt(i, j, k)
 *   });
 *
 *   // In your render loop:
 *   const input = controller.pollInput();
 *   physics.update(delta, input);   // delta = seconds since last frame
 */

import * as THREE from '../cache/three.js'; // adjust path if necessary

import {
  TILE_SIZE,
  CHARACTER_DIMENSIONS,
  JUMP
} from './character-config.js';

const EPS = 1e-3; // tiny offset to avoid floating-point jitter

export class PlayerPhysics {
  /**
   * @param {THREE.Object3D} object3d - root of the player mesh (feet at Y=0)
   * @param {Object} opts
   * @param {(i:number, j:number, k:number)=>boolean} opts.getBlock
   */
  constructor (object3d, { getBlock }) {
    this.object3d = object3d;
    this.getBlock = getBlock;

    // Dimensions
    this.width  = CHARACTER_DIMENSIONS.width;
    this.depth  = CHARACTER_DIMENSIONS.depth;
    this.heightStanding = CHARACTER_DIMENSIONS.height;
    this.heightCrouch   = CHARACTER_DIMENSIONS.crouchHeight;

    // Motion
    this.velocity  = new THREE.Vector3(); // world units / s
    this.isGrounded = false;
  }

  // ────────────────────────────────────────────────────────────
  // Main Public Method
  // ────────────────────────────────────────────────────────────
  /**
   * Update player position.
   * @param {number} dt       — seconds elapsed since last frame
   * @param {Object} input    — result from PlayerController.pollInput()
   */
  update (dt, input) {
    // 1. Horizontal movement intent (grid axes, no diagonal boost)
    let moveVec = new THREE.Vector3(
      input.direction.x,
      0,
      -input.direction.y  // forward (+Z) is negative screen Y
    );

    if (moveVec.lengthSq() > 0) {
      moveVec.normalize().multiplyScalar(input.speedMul * TILE_SIZE);
    }

    // 2. Jump & gravity
    if (this.isGrounded) {
      this.velocity.y = 0;

      if (input.jump) {
        this.velocity.y = Math.sqrt(-2 * JUMP.gravity * JUMP.maxHeight);
        this.isGrounded = false;
      }
    } else {
      this.velocity.y += JUMP.gravity * dt;
    }

    // 3. Compose desired delta movement
    const dx = moveVec.x; // * dt;
    const dz = moveVec.z; // * dt;
    const dy = this.velocity.y; // * dt;

    // 4. Collision-aware movement
    this.#applyMovement(dx, dy, dz, input.crouching);
  }

  // ────────────────────────────────────────────────────────────
  // Private Helpers
  // ────────────────────────────────────────────────────────────
  #applyMovement (dx, dy, dz, crouching) {
    const pos = this.object3d.position.clone();
    const halfW = this.width  * 0.5;
    const halfD = this.depth  * 0.5;
    const height = crouching ? this.heightCrouch : this.heightStanding;

    // --- Horizontal (X)
    if (dx !== 0) {
      const newX = pos.x + dx;
      if (!this.#boxCollides(newX, pos.y, pos.z, halfW, halfD, height)) {
        pos.x = newX;
      }
    }

    // --- Horizontal (Z)
    if (dz !== 0) {
      const newZ = pos.z + dz;
      if (!this.#boxCollides(pos.x, pos.y, newZ, halfW, halfD, height)) {
        pos.z = newZ;
      }
    }

    // --- Vertical (Y)
    pos.y += dy;
    console.log(pos.x, pos.y, pos.z)
    console.log(pos.x + dx, pos.y + dy, pos.z + dz)
    if (dy <= 0) {
      // Falling / walking: check for ground beneath
      if (this.#boxCollides(pos.x, pos.y - EPS, pos.z, halfW, halfD, height)) {
        // Snap to top of the block beneath
        const groundY = Math.floor((pos.y - height / 2) / TILE_SIZE) * TILE_SIZE + TILE_SIZE;
        pos.y = groundY + height / 2;
        this.isGrounded = true;
        this.velocity.y = 0;
      } else {
        this.isGrounded = false;
      }
    } else {
      // Ascending: head-hit check
      if (this.#boxCollides(pos.x, pos.y + EPS, pos.z, halfW, halfD, height)) {
        // Bump head, cancel upward motion
        pos.y -= dy; // revert vertical step
        this.velocity.y = 0;
      }
      this.isGrounded = false;
    }

    this.object3d.position.copy(pos);
  }

  /**
   * Axis-aligned bounding box collision test against solid blocks.
   * @returns {boolean} - true if ANY block overlaps
   */
  #boxCollides (x, y, z, halfW, halfD, height) {
    const minX = x - halfW;
    const maxX = x + halfW;
    const minY = y - height / 2;
    const maxY = y + height / 2;
    const minZ = z - halfD;
    const maxZ = z + halfD;

    // Convert to grid indices
    const iMin = Math.floor(minX / TILE_SIZE);
    const iMax = Math.floor(maxX / TILE_SIZE);
    const jMin = Math.floor(minY / TILE_SIZE);
    const jMax = Math.floor(maxY / TILE_SIZE);
    const kMin = Math.floor(minZ / TILE_SIZE);
    const kMax = Math.floor(maxZ / TILE_SIZE);

    for (let i = iMin; i <= iMax; i++) {
      for (let j = jMin; j <= jMax; j++) {
        for (let k = kMin; k <= kMax; k++) {
          if (this.getBlock(i, j, k)) return true;
        }
      }
    }
    return false;
  }
}

/**
 * Factory helper.
 * @param {THREE.Object3D} obj
 * @param {Function} getBlockFn
 */
export function createPlayerPhysics (obj, getBlockFn) {
  return new PlayerPhysics(obj, { getBlock: getBlockFn });
}
