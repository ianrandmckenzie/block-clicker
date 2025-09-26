/**
 * CameraOrbitControl
 * — Adds right-click orbiting around the player via Pointer-Lock.
 *
 * HOW IT WORKS
 *   • User presses RMB           → element.requestPointerLock()
 *   • While locked, mouse Δx/Δy  → ThirdPersonCamera.orbit()
 *   • Release RMB or ESC         → exitPointerLock
 *
 * CONFIG
 *   const control = new CameraOrbitControl(renderer.domElement, thirdPersonCam, {
 *     sensitivity: 0.002
 *   });
 *
 * Public API
 *   control.enabled = false;   // toggle at runtime
 *   control.dispose();         // remove listeners
 */

export class CameraOrbitControl {
  /**
   * @param {HTMLElement} domElement       — Usually renderer.domElement (the canvas)
   * @param {ThirdPersonCamera} tpCamera   — Instance created in third-person-camera.js
   * @param {Object} [opts]
   * @param {number} [opts.sensitivity=0.002] — radians per pixel
   */
  constructor (domElement, tpCamera, opts = {}) {
    this.dom    = domElement;
    this.tpCam  = tpCamera;
    this.sense  = opts.sensitivity ?? 0.002;
    this.enabled = true;

    // Bindings
    this.#onMouseDown = this.#onMouseDown.bind(this);
    this.#onMouseMove = this.#onMouseMove.bind(this);
    this.#onPointerLockChange = this.#onPointerLockChange.bind(this);

    // Listeners
    this.dom.addEventListener('contextmenu', (e) => e.preventDefault()); // disable RMB menu
    this.dom.addEventListener('mousedown', this.#onMouseDown);
    document.addEventListener('pointerlockchange', this.#onPointerLockChange);
  }

  // ────────────────────────────────────────────────────────────
  // Private Handlers
  // ────────────────────────────────────────────────────────────
  #onMouseDown (e) {
    if (!this.enabled || e.button !== 2) return; // RMB only

    // Request pointer lock
    if (document.pointerLockElement !== this.dom) {
      this.dom.requestPointerLock();
    }

    // Listen for movement while button held
    document.addEventListener('mousemove', this.#onMouseMove);
    document.addEventListener('mouseup',   () => {
      // On mouse up, stop listening (pointer lock might also exit via ESC)
      document.removeEventListener('mousemove', this.#onMouseMove);
      if (document.pointerLockElement === this.dom) {
        document.exitPointerLock();
      }
    }, { once: true });
  }

  #onMouseMove (e) {
    if (!this.enabled) return;
    const dYaw   = -e.movementX * this.sense; // invert for intuitive drag
    const dPitch = -e.movementY * this.sense;
    this.tpCam.orbit(dYaw, dPitch);
  }

  #onPointerLockChange () {
    if (document.pointerLockElement !== this.dom) {
      // Lock exited (ESC or browser), clean move listener just in case
      document.removeEventListener('mousemove', this.#onMouseMove);
    }
  }

  // ────────────────────────────────────────────────────────────
  // Public
  // ────────────────────────────────────────────────────────────
  dispose () {
    this.dom.removeEventListener('mousedown', this.#onMouseDown);
    document.removeEventListener('pointerlockchange', this.#onPointerLockChange);
    document.removeEventListener('mousemove', this.#onMouseMove);
  }
}

/**
 * Factory helper.
 * @param {HTMLElement} dom
 * @param {ThirdPersonCamera} cam
 * @param {Object} opts
 */
export function createCameraOrbitControl (dom, cam, opts) {
  return new CameraOrbitControl(dom, cam, opts);
}
