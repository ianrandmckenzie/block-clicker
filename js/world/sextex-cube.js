/* ------------------------------------------------------------------ */
/*  sextex-cube.js                                                    */
/*                                                                    */
/*  Utility helpers for building a cube with six *distinct* textures: */
/*   – one per face (+X, −X, +Y, −Y, +Z, −Z)                          */
/*                                                                    */
/*  Usage example:                                                    */
/*      import { createSexTexCube } from './world/sextex-cube.js';    */
/*                                                                    */
/*      const cube = createSexTexCube(4, px, nx, py, ny, pz, nz);      */
/*      scene.add(cube);                                              */
/*                                                                    */
/*  If you intend to instance these cubes, call                       */
/*      const { geometry, materials } = buildSexTexTemplate(...);     */
/*      const mesh = new THREE.InstancedMesh(geometry, materials, n); */
/* ------------------------------------------------------------------ */

import * as THREE from '../cache/three.js';
import { boxGeo } from './textures.js';

/**
 * Builds the reusable BoxGeometry and six-material array for a six-texture cube.
 * Materials are *cached* so multiple calls with the same textures re-use them.
 *
 * @param {number} size – Edge length of the cube.
 * @param {THREE.Texture} px – Texture for +X (right).
 * @param {THREE.Texture} nx – Texture for −X (left).
 * @param {THREE.Texture} py – Texture for +Y (top).
 * @param {THREE.Texture} ny – Texture for −Y (bottom).
 * @param {THREE.Texture} pz – Texture for +Z (front).
 * @param {THREE.Texture} nz – Texture for −Z (back).
 * @returns {{ geometry: THREE.BoxGeometry, materials: THREE.Material[] }}
 */
export function buildSexTexTemplate(size, px, nx, py, ny, pz, nz) {
  const key = `${size}|${px.uuid}|${nx.uuid}|${py.uuid}|${ny.uuid}|${pz.uuid}|${nz.uuid}`;
  if (buildSexTexTemplate._cache?.[key]) return buildSexTexTemplate._cache[key];

  const geometry = boxGeo;

  const materials = [
    new THREE.MeshStandardMaterial({ map: px }), // +X right
    new THREE.MeshStandardMaterial({ map: nx }), // −X left
    new THREE.MeshStandardMaterial({ map: py }), // +Y top
    new THREE.MeshStandardMaterial({ map: ny }), // −Y bottom
    new THREE.MeshStandardMaterial({ map: pz }), // +Z front
    new THREE.MeshStandardMaterial({ map: nz })  // −Z back
  ];

  buildSexTexTemplate._cache ??= {};
  buildSexTexTemplate._cache[key] = { geometry, materials };
  return { geometry, materials };
}

/**
 * Convenience wrapper that returns an InstancedMesh.Mesh ready to drop into the scene.
 *
 * @param {number} size – Edge length of the cube.
 * @param {THREE.Texture} px – Texture for +X (right).
 * @param {THREE.Texture} nx – Texture for −X (left).
 * @param {THREE.Texture} py – Texture for +Y (top).
 * @param {THREE.Texture} ny – Texture for −Y (bottom).
 * @param {THREE.Texture} pz – Texture for +Z (front).
 * @param {THREE.Texture} nz – Texture for −Z (back).
 * @param {number} maxInstances – How many instances the mesh can hold.
 * @returns {THREE.InstancedMesh}
 */
export function createSexTexCube(size, px, nx, py, ny, pz, nz, maxInstances) {
  const { geometry, materials } = buildSexTexTemplate(size, px, nx, py, ny, pz, nz);
  return new THREE.InstancedMesh(geometry, materials, maxInstances);
}
