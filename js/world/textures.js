/* —————————————————— */
/*    textures.js     */
/*   (& materials +   */
/*    simple meshes)  */
/* —————————————————— */

import * as THREE from '../cache/three.js'
import { CHUNK_SIZE, scene, renderer, tileSize, resources } from '../main.js'
import { createTallGrassInstancedMesh } from './complexture.js'
import { createSexTexCube } from './sextex-cube.js'

const loader = new THREE.TextureLoader()
export const boxGeo = new THREE.BoxGeometry(tileSize, tileSize, tileSize)

// ——————————————————
//  BLOCK CONFIGS (includes texture files)
// ——————————————————
export const blockConfigs = [
  {
    type: 'stone',
    textures: ['stone.png'],
    initialOpacity: 1,
    interactable: true,
    actions: {
      dig: { tool: 'pickaxe', yield: { stone: 1 }, allowIf: { minRemainingBlocks: 2 } }
    }
  },
  {
    type: 'wood',
    textures: ['wood.png', 'wood.png', 'wood-xy.png'],
    initialOpacity: 1,
    interactable: true,
    actions: {
      dig: { tool: 'pickaxe', yield: { wood: 1 }, allowIf: { minRemainingBlocks: -1 } }
    }
  },
  {
    type: 'leaves',
    textures: ['leaves.png'],
    initialOpacity: 1,
    interactable: true,
    actions: {
      dig: { tool: 'pickaxe', yield: { leaves: 1 }, allowIf: { minRemainingBlocks: -1 } }
    }
  },
  {
    type: 'soil',
    textures: ['soil.png'],
    initialOpacity: 1,
    interactable: true,
    actions: {
      dig: { tool: 'shovel', yield: { soil: 1 }, allowIf: { minRemainingBlocks: 2 } }
    }
  },
  {
    type: 'grass',
    textures: ['grass.png', 'soil.png', 'grass-xy.png'], // [top, bottom, side]
    initialOpacity: 1,
    interactable: true,
    actions: {
      dig: { tool: 'shovel', yield: { grass: 1 }, allowIf: { minRemainingBlocks: 2 } }
    }
  },
  {
    type: 'hay',
    textures: ['hay.png'],
    initialOpacity: 0.4,
    interactable: true,
    actions: {
      dig: { tool: 'scythe', yield: { hay: 1 }, allowIf: { minRemainingBlocks: -1 } }
    }
  },
  {
    type: 'air',
    textures: ['air.png'],
    initialOpacity: 0.01,
    interactable: false
  },
]

const faceKeys = ['AX','BX','AY','BY','AZ','BZ']

// ——————————————————
//  LOAD TEXTURES
// ——————————————————
const textures = {}
for (const { type, textures: files } of blockConfigs) {
  if (files.length === 1) {
    textures[type] = loader.load(`assets/textures/${files[0]}`, t => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.anisotropy = renderer.capabilities.getMaxAnisotropy()
    })
  }
  else if (files.length === 3) {
    const [topF, botF, sideF] = files
    textures[type] = {
      top:  loader.load(`assets/textures/${topF}`, t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = renderer.capabilities.getMaxAnisotropy() }),
      bot:  loader.load(`assets/textures/${botF}`, t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = renderer.capabilities.getMaxAnisotropy() }),
      side: loader.load(`assets/textures/${sideF}`, t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = renderer.capabilities.getMaxAnisotropy() })
    }
  }
  else if (files.length === 6) {
    textures[type] = {}
    files.forEach((file, i) => {
      textures[type][ faceKeys[i] ] = loader.load(
        `assets/textures/${file}`, t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = renderer.capabilities.getMaxAnisotropy() }
      )
    })
  }
}

// ——————————————————
//  MATERIALS
// ——————————————————
const matConfigs = [
  ['air',   true,  0],
  ['stone', true,  1],
  ['soil',  true,  1],
  ['leaves',  true,  1]
]
const materials = matConfigs.reduce((acc, [type, transparent, opacity]) => {
  acc[`${type}Mat`] = new THREE.MeshStandardMaterial({
    map: textures[type],
    transparent,
    opacity,
    side: THREE.DoubleSide
  })
  return acc
}, {})

// ——————————————————
//  HIGHLIGHT & NOT-ALLOWED
// ——————————————————
const highlightMat  = new THREE.MeshBasicMaterial({ color:0xffff00, wireframe:true, transparent:true, opacity:0.75 })
const notAllowedMat = new THREE.MeshBasicMaterial({ color:0xff0000, wireframe:true, transparent:true, opacity:0.75 })

export const highlightBox   = new THREE.Mesh(boxGeo, highlightMat)
export const notAllowedBox  = new THREE.Mesh(boxGeo, notAllowedMat)
;[ highlightBox, notAllowedBox ].forEach(box => {
  box.visible = false
  scene.add(box)
})

// ——————————————————
//  MESH CONFIGS
// ——————————————————
const maxInstances = CHUNK_SIZE.x * CHUNK_SIZE.y * CHUNK_SIZE.z
export const meshConfigs = {}
for (const { type } of blockConfigs) {
  const texSpec = textures[type]
  let ctor, transparent = true, opacity = 1

  if (type === 'hay') {
    ctor = () => createTallGrassInstancedMesh(tileSize, textures.hay, maxInstances)
  } else if (typeof texSpec === 'object' && 'AX' in texSpec) {
    const F = faceKeys.map(k => texSpec[k])
    ctor = () => createSexTexCube(tileSize, ...F, maxInstances)
  } else if (typeof texSpec === 'object' && 'side' in texSpec) {
    ctor = () => createSexTexCube(
      tileSize,
      texSpec.side, texSpec.side,
      texSpec.top, texSpec.bot,
      texSpec.side, texSpec.side,
      maxInstances
    )
  } else {
    ctor = () => new THREE.InstancedMesh(boxGeo, materials[`${type}Mat`], maxInstances)
    if (type === 'air') opacity = 0
  }

  meshConfigs[type] = { ctor, transparent, opacity }
}

// ——————————————————
//  BLOCK OBJECTS
// ——————————————————
export const blockObjects = blockConfigs.reduce((acc, { type, textures, ...rest }) => {
  acc[type] = rest
  return acc
}, {})

// ——————————————————
//  COUNTERS (RESOURCES)
// ——————————————————
const resContainer = document.getElementById('resource-counter');
['hay', 'grass', 'stone', 'soil', 'wood', 'leaves'].forEach(type => {
  const el = document.createElement('button');
  el.className = 'relative w-10 h-10 rounded-lg bg-white text-white overflow-hidden border-transparent hover:border-white border-2';
  el.id = (`${type}-button`);

  const elInner = document.createElement('span');
  elInner.id = (`${type}-count`);
  elInner.className = 'absolute right-0.5 bottom-0.5 text-xs bg-black/50 p-0.5 rounded-full';
  elInner.textContent = resources[type];

  const elImg = document.createElement('img');
  elImg.className = 'h-10 w-10';
  elImg.setAttribute('src', `./assets/textures/${type}.png`);

  resContainer.appendChild(el);

  el.appendChild(elInner);
  el.appendChild(elImg);
})

// ——————————————————
//  COUNTERS (STRUCTURES)
// ——————————————————
const structContainer = document.getElementById('structure-counter');
['tree'].forEach(type => {
  const el = document.createElement('button');
  el.className = 'relative w-10 h-10 rounded-lg bg-white text-white overflow-hidden border-transparent hover:border-white border-2';
  el.id = (`${type}-button`);

  const elInner = document.createElement('span');
  elInner.id = (`${type}-count`);
  elInner.className = 'absolute right-0.5 bottom-0.5 text-xs bg-black/50 p-0.5 rounded-full';
  elInner.textContent = resources[type];

  const elImg = document.createElement('img');
  elImg.className = 'h-10 w-10';
  elImg.setAttribute('src', `./assets/textures/${type}.png`);

  structContainer.appendChild(el);

  el.appendChild(elInner);
  el.appendChild(elImg);
})
