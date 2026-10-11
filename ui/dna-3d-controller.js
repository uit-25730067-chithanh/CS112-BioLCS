/**
 * 3D Orbit Interaction & Raycaster Controller for DNA Helix
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * Student: Dang Chi Thanh (MSSV: 25730067)
 */

export class DNAOrbitController {
  constructor(canvas, camera, options = {}) {
    this.canvas = canvas;
    this.camera = camera;
    this.options = options;
    this.THREE = window.THREE;

    this.isDragging = false;
    this.prevX = 0;
    this.prevY = 0;
    this.rotX = 0.2;
    this.rotY = 0;
    this.targetRotX = 0.2;
    this.targetRotY = 0;
    this.autoRotate = true;
    this.autoRotateSpeed = 0.009;
    this.idleTimer = null;

    this.raycaster = new this.THREE.Raycaster();
    this.mouse = new this.THREE.Vector2(-999, -999);
    this.hoveredObject = null;
    this.helixGroup = null;
    this.spheres = [];

    this._bindEvents();
  }

  setTargets(helixGroup, spheres) {
    this.helixGroup = helixGroup;
    this.spheres = spheres || [];
  }

  _bindEvents() {
    this._onPointerDown = (e) => {
      this.isDragging = true;
      this.prevX = e.clientX;
      this.prevY = e.clientY;
      this.canvas.setPointerCapture?.(e.pointerId);
      clearTimeout(this.idleTimer);
    };

    this._onPointerMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.isDragging) {
        const dx = e.clientX - this.prevX;
        const dy = e.clientY - this.prevY;
        this.targetRotY += dx * 0.008;
        this.targetRotX = Math.max(-1.2, Math.min(1.2, this.targetRotX + dy * 0.008));
        this.prevX = e.clientX;
        this.prevY = e.clientY;
      }
    };

    this._onPointerUp = (e) => {
      this.isDragging = false;
      this.canvas.releasePointerCapture?.(e.pointerId);
      this.idleTimer = setTimeout(() => {
        this.autoRotate = true;
      }, 2000);
    };

    this._onWheel = (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.035;
      this.camera.position.z = Math.max(12, Math.min(48, this.camera.position.z + zoomDelta));
    };

    this.canvas.addEventListener('pointerdown', this._onPointerDown);
    this.canvas.addEventListener('pointermove', this._onPointerMove);
    this.canvas.addEventListener('pointerup', this._onPointerUp);
    this.canvas.addEventListener('pointercancel', this._onPointerUp);
    this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
  }

  update() {
    if (!this.helixGroup) return;

    if (this.autoRotate && !this.isDragging) {
      this.targetRotY += this.autoRotateSpeed;
    }

    // Damped smooth rotation
    this.rotX += (this.targetRotX - this.rotX) * 0.12;
    this.rotY += (this.targetRotY - this.rotY) * 0.12;
    this.helixGroup.rotation.x = this.rotX;
    this.helixGroup.rotation.y = this.rotY;

    // Hover Raycasting
    if (this.camera && this.spheres.length > 0) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.spheres);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (this.hoveredObject !== hit) {
          if (this.hoveredObject) this._unhighlight(this.hoveredObject);
          this.hoveredObject = hit;
          this._highlight(hit);
          this.options.onHover?.(hit.userData);
        }
      } else if (this.hoveredObject) {
        this._unhighlight(this.hoveredObject);
        this.hoveredObject = null;
        this.options.onHover?.(null);
      }
    }
  }

  _highlight(mesh) {
    if (!mesh) return;
    this.canvas.style.cursor = 'pointer';
    mesh.scale.set(1.4, 1.4, 1.4);
    if (mesh.material?.emissiveIntensity !== undefined) {
      mesh.material.emissiveIntensity = 2.0;
    }
  }

  _unhighlight(mesh) {
    if (!mesh) return;
    this.canvas.style.cursor = 'grab';
    mesh.scale.set(1.0, 1.0, 1.0);
    if (mesh.material?.emissiveIntensity !== undefined) {
      mesh.material.emissiveIntensity = mesh.userData?.match ? 0.8 : 0.2;
    }
  }

  resetView() {
    this.targetRotX = 0.2;
    this.targetRotY = 0;
    this.camera.position.set(0, 0, 26);
    this.autoRotate = true;
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    return this.autoRotate;
  }

  zoomIn() {
    this.camera.position.z = Math.max(12, this.camera.position.z - 4);
  }

  zoomOut() {
    this.camera.position.z = Math.min(48, this.camera.position.z + 4);
  }

  destroy() {
    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    this.canvas.removeEventListener('pointermove', this._onPointerMove);
    this.canvas.removeEventListener('pointerup', this._onPointerUp);
    this.canvas.removeEventListener('pointercancel', this._onPointerUp);
    this.canvas.removeEventListener('wheel', this._onWheel);
    clearTimeout(this.idleTimer);
  }
}
