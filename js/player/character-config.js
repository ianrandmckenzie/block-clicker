// Central place for all player-related tunables.
// Adjust here and the rest of the player code picks it up automatically.

export const TILE_SIZE = 4; // world uses 4×4×4 cubes

// ────────────────────────────────
// Geometry
// ────────────────────────────────
export const CHARACTER_DIMENSIONS = {
  width: 1 * TILE_SIZE,      // 1 tile wide
  depth: 1 * TILE_SIZE,      // 1 tile deep
  height: 2 * TILE_SIZE,     // 2 tiles tall
  crouchHeight: 1 * TILE_SIZE // height while crouched
};

// ────────────────────────────────
// Movement speeds (tiles / second multipliers)
// ────────────────────────────────
export const SPEED = {
  walk: 1,      // baseline
  sprint: 1.5,  // 150 %
  sneak: 0.75,  // 75 %
  crouch: 0.25  // 25 %
};

// ────────────────────────────────
// Jump
// ────────────────────────────────
export const JUMP = {
  maxTiles: 9,                           // up to 9 tiles high
  get maxHeight () { return this.maxTiles * TILE_SIZE; },
  gravity: -32                           // units / s² (tweak to taste)
};

// ────────────────────────────────
// Aggregated export (optional convenience)
// ────────────────────────────────
export const CHARACTER_CONFIG = {
  TILE_SIZE,
  dimensions: CHARACTER_DIMENSIONS,
  speed: SPEED,
  jump: JUMP
};
