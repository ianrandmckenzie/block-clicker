/* -—————————————————— */
/* complexture.js      */
/*                     */
/* (portmanteau of     */
/*  complex + texture) */
/* ——————————————————- */

import * as THREE from '../cache/three.js';
import * as BufferGeometryUtils from '../cache/addons/utils/BufferGeometryUtils.js';

/**
 * Creates an InstancedMesh of tall grass blades composed of intersecting transparent planes
 * that sway over time using a GPU shader uniform.
 * @param {number} tileSize  The size of one voxel tile in world units.
 * @param {THREE.Texture} texture  The grass texture with alpha channel.
 * @param {number} count  Number of grass instances.
 * @returns {THREE.InstancedMesh}
 */
export function createTallGrassInstancedMesh(tileSize, texture, count) {
  // 1) Generate per-instance random phase
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    phases[i] = Math.random() * Math.PI * 2;
  }

  // 2) Build the intersecting plane geometry (3 crossed quads)
  const bladeWidth  = tileSize * 1.1;
  const bladeHeight = tileSize * 1.4;
  const plane1 = new THREE.PlaneGeometry(bladeWidth, bladeHeight).applyMatrix4(new THREE.Matrix4().makeRotationY(0.75));
  plane1.translate(0, bladeHeight / 2, 0);
  const plane2 = plane1.clone().applyMatrix4(new THREE.Matrix4().makeRotationY(1.5));
  const plane3 = plane1.clone().applyMatrix4(new THREE.Matrix4().makeRotationY(2.25));
  const plane4 = plane1.clone().applyMatrix4(new THREE.Matrix4().makeRotationY(3));
  const plane5 = plane1.clone().applyMatrix4(new THREE.Matrix4().makeRotationY(3.75));
  const bladeGeometry = BufferGeometryUtils.mergeGeometries([plane1, plane2, plane3, plane4, plane5], false);

  // Attach the phase attribute for each instance
  bladeGeometry.setAttribute('phase', new THREE.InstancedBufferAttribute(phases, 1));

  // 3) Prepare a shared time uniform object
  const uTime = { value: 0 };

  // 4) Create material and inject custom vertex shader code for sway
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  });

  material.onBeforeCompile = (shader) => {
    // Add our time uniform
    shader.uniforms.uTime = uTime;

    // Prepend declarations
    shader.vertexShader = `uniform float uTime;\nattribute float phase;\n` + shader.vertexShader;

    // Inject sway logic at the vertex stage
    shader.vertexShader = shader.vertexShader.replace(
      // chill out: float sway = sin(uTime + phase) * 0.05;
      // violent: float sway = sin((uTime + phase) * 5.0) * 0.5;
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float sway = sin(uTime + phase) * 0.05;
       mat3 rotX = mat3(
         1.0, 0.0, 0.0,
         0.0, cos(sway), -sin(sway),
         0.0, sin(sway),  cos(sway)
       );
       transformed = rotX * transformed;`
    );

    // Expose our time uniform for external updates
    material.userData.uTimeUniform = uTime;
  };

  // 5) Create the instanced mesh
  const instancedMesh = new THREE.InstancedMesh(bladeGeometry, material, count);
  instancedMesh.userData = { tileType: 'hay' };
  instancedMesh.position.y = - tileSize / 2;
  return instancedMesh;
}
