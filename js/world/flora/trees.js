/* —————————————————— */
/*     trees.js       */
/* —————————————————— */
import { isOccupied } from '../flora.js';

// Defines procedural tree shapes and a generator to plant a single tree in a chunk

// Each tree is a 2D-array stack: outer array = vertical layers (top → bottom),
// each inner array = rows (z-axis) of columns (x-axis).
// null = empty, otherwise block type string.
export const trees = [
  // ---- Small Pine ----
  [
    // Trunk base
    [
      [null, null, null, null, null],
      [null, null, 'wood', null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null]
    ],
    [
      [null, null, null, null, null],
      [null, null, 'wood', null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null]
    ],
    // Transition to trunk
    [
      [null, null, 'leaves', null, null],
      [null, null, 'wood', null, null],
      [null, null, 'wood', null, null],
      [null, null, null, null, null],
      [null, null, null, null, null]
    ],
    // Canopy middle
    [
      [null, 'leaves', 'leaves', 'leaves', null],
      ['leaves','leaves','wood','leaves','leaves'],
      ['leaves','leaves','leaves','leaves','leaves'],
      ['leaves','leaves','leaves','leaves','leaves'],
      [null, 'leaves', 'leaves', 'leaves', null]
    ],
    // Canopy top
    [
      [null, null, 'leaves', null, null],
      [null, 'leaves', 'leaves', 'leaves', null],
      ['leaves','leaves','leaves','leaves','leaves'],
      [null, 'leaves', 'leaves', 'leaves', null],
      [null, null, 'leaves', null, null]
    ],
    [
      [null, null, null, null, null],
      [null, null, 'leaves', null, null],
      [null,'leaves','leaves','leaves',null],
      [null, null, 'leaves', null, null],
      [null, null, null, null, null]
    ],
  ],

  // ---- Broad Oak ----
  [
    // Trunk only
    [
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, 'wood', null, null],
      [null, null, null, null, null],
      [null, null, null, null, null]
    ],
    [
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, 'wood', null, null],
      [null, null, null, null, null],
      [null, null, null, null, null]
    ],
    // Lower canopy + trunk
    [
      [null, null, null, null, null],
      [null, null, 'wood', null, null],
      [null, 'leaves', 'wood', 'leaves', null],
      [null, null, 'wood', null, null],
      [null, null, null, null, null]
    ],
    // Full canopy
    [
      [null,'leaves','leaves','leaves',null],
      ['leaves','leaves','wood','leaves','leaves'],
      ['leaves','wood','wood','wood','leaves'],
      ['leaves','leaves','wood','leaves','leaves'],
      [null,'leaves','leaves','leaves',null]
    ],
    // Top canopy
    [
      [null, null, 'leaves', null, null],
      [null, 'leaves', 'leaves', 'leaves', null],
      ['leaves','leaves','leaves','leaves','leaves'],
      [null, 'leaves', 'leaves', 'leaves', null],
      [null, null, 'leaves', null, null]
    ],
    [
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, 'leaves', null, null],
      [null, null, null, null, null],
      [null, null, null, null, null]
    ]
  ]
];

/**
 * Plant a single tree into the given chunk at world coords (i,j,k).
 * Chooses a random shape from `trees` and calls `chunk.addBlock(...)`
 * for each non-null cell in the shape.
 *
 * @param {Chunk} chunk    - target chunk instance
 * @param {number} baseI   - world X-coordinate of the tree base (center)
 * @param {number} baseJ   - world Z-coordinate of the tree base (center)
 * @param {number} baseK   - world Y-coordinate of the tree base (bottom layer)
 */
export function generateTree(chunk, baseI, baseJ, baseK) {
  const shape = trees[Math.floor(Math.random() * trees.length)];
  const layers = shape.length;
  let generationAllowed = true;
  let blocksToAdd = [];

  while (generationAllowed){
    for (let l = 0; l < layers; l++) {
      const layer = shape[l];
      const rows = layer.length;
      const cols = layer[0].length;
      const midRow = Math.floor(rows / 2);
      const midCol = Math.floor(cols / 2);
      // adjust Y so trunk sits on top of ground (baseK)
      const y = baseK + (layers + l - (Math.ceil(layers/2)+2));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const type = layer[r][c];
          if (!type) continue;
          const i = baseI + (c - midCol);
          const j = baseJ + (r - midRow);
          // if (isOccupied(c, r, l)) generationAllowed = false;
          blocksToAdd.push({ x: i, y: j, z: y, type: type });
        }
      }
    }
    blocksToAdd.forEach(bl => { chunk.addBlock(bl.x, bl.y, bl.z, bl.type)});
    blocksToAdd = [];
    generationAllowed = false;
  }
}
