/**
 * 3D DNA Double Helix Visualizer (Three.js with 2D Canvas Fallback)
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * Student: Dang Chi Thanh (MSSV: 25730067)
 */

import { buildDNAHelixMesh } from './dna-3d-builder.js';
import { DNAOrbitController } from './dna-3d-controller.js';
import { init2DFallback } from './dna-2d-fallback.js';
import { createViewportUI } from './dna-3d-toolbar.js';

export class DNAVisualizer3D {
  constructor(containerId) {
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.animId = null;
    this.mode = '2d';
    this.highlightLcsOnly = false;
    this.showLabels = true;
    this.alignmentData = null;
    this.colors = {
      'A': '#38bdf8', 'T': '#fb7185', 'G': '#fbbf24', 'C': '#a78bfa',
      'U': '#34d399', 'default': '#38bdf8', 'matchBond': 0x10b981
    };
    if (this.container) this.init();
  }

  _checkWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch { return false; }
  }

  async init() {
    if (!this.container) return;
    this.container.innerHTML = '';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'dna-3d-canvas';
    this.container.appendChild(this.canvas);

    this.ui = createViewportUI(this.container, {
      onToggleRotate: () => this.controller?.toggleAutoRotate(),
      onZoomIn: () => this.controller?.zoomIn(),
      onZoomOut: () => this.controller?.zoomOut(),
      onResetView: () => this.controller?.resetView(),
      onToggleLcs: () => {
        this.highlightLcsOnly = !this.highlightLcsOnly;
        this._applyLcsFilter();
        return this.highlightLcsOnly;
      },
      onToggleLabels: () => {
        this.showLabels = !this.showLabels;
        this.meshData?.labels?.forEach(l => l.visible = this.showLabels);
        return this.showLabels;
      }
    });

    if (this._checkWebGL() && window.THREE) {
      try {
        this._initThreeJS();
        this.mode = 'three';
        this.ui.modeTag.textContent = '3D WebGL Molecular (Three.js)';
        return;
      } catch (err) {
        console.warn('Three.js init failed, falling back to 2D Canvas:', err);
      }
    }

    this.fallback2D = init2DFallback(this.canvas, this.container);
    this.mode = '2d';
    this.ui.modeTag.textContent = '2D Cyber Canvas (High-FPS Fallback)';
  }

  _initThreeJS() {
    const THREE = window.THREE;
    const w = this.container.clientWidth || 400;
    const h = this.container.clientHeight || 380;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    this.camera.position.set(0, 0, 26);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(10, 15, 20);
    this.scene.add(dir);

    this.pointLight = new THREE.PointLight(0x38bdf8, 2.0, 40);
    this.pointLight.position.set(0, 0, 10);
    this.scene.add(this.pointLight);

    this.controller = new DNAOrbitController(this.canvas, this.camera, {
      onHover: (data) => this._onHoverBase(data)
    });

    this._rebuildMesh();

    const loop = () => {
      this.controller.update();
      if (this.meshData?.particles) this.meshData.particles.rotation.y += 0.002;
      this.renderer.render(this.scene, this.camera);
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  _rebuildMesh() {
    if (!this.scene) return;
    if (this.helixGroup) this.scene.remove(this.helixGroup);

    this.meshData = buildDNAHelixMesh(this.alignmentData, this.colors, { showLabels: this.showLabels });
    this.helixGroup = this.meshData.group;
    this.scene.add(this.helixGroup);
    this.controller?.setTargets(this.helixGroup, this.meshData.spheres);
    this._applyLcsFilter();
  }

  _applyLcsFilter() {
    if (!this.meshData?.rungs) return;
    for (const r of this.meshData.rungs) {
      const match = r.userData?.match;
      const op = this.highlightLcsOnly ? (match ? 1.0 : 0.1) : (match ? 0.95 : 0.65);
      if (r.material) r.material.opacity = op;
      if (r.userData?.sph1?.material) r.userData.sph1.material.opacity = this.highlightLcsOnly ? (match ? 1.0 : 0.2) : 1.0;
      if (r.userData?.sph2?.material) r.userData.sph2.material.opacity = this.highlightLcsOnly ? (match ? 1.0 : 0.2) : 1.0;
    }
  }

  _onHoverBase(data) {
    if (!data) {
      this.ui.tooltip.style.display = 'none';
      return;
    }
    const names = { A: 'Adenine (A)', T: 'Thymine (T)', G: 'Guanine (G)', C: 'Cytosine (C)', U: 'Uracil (U)', '-': 'Gap' };
    const st = data.match ? '<span style="color:#10b981;">✔ Trùng khớp LCS</span>' : (data.type === 'DELETION' || data.type === 'INSERTION' ? '<span style="color:#f43f5e;">✕ Đột biến Indel</span>' : '<span style="color:#f59e0b;">⚠ Đột biến thay thế (SNP)</span>');
    this.ui.tooltip.innerHTML = `<div class="tooltip-title">Cặp Base #${data.index + 1}: ${names[data.char] || data.char}</div><div class="tooltip-sub">Nhánh: Chuỗi ${data.strand} | Trạng thái: ${st}</div>`;
    this.ui.tooltip.style.display = 'block';
  }

  setData(alignmentData, meta = {}) {
    this.alignmentData = alignmentData;
    this.meta = meta;
    if (this.mode === 'three') this._rebuildMesh();
    if (this.fallback2D && typeof this.fallback2D.setData === 'function') {
      this.fallback2D.setData(alignmentData);
    }
    if (this.ui?.updateStatus) this.ui.updateStatus(null);
  }

  updateStep(snapshot) {
    if (!snapshot) return;

    if (this.mode === '2d' && this.fallback2D?.updateStep) {
      this.fallback2D.updateStep(snapshot);
      return;
    }

    if (!this.meshData?.rungs || this.meshData.rungs.length === 0) return;

    const count = this.meshData.rungs.length;
    const height = this.meshData.height || (count * 0.95);
    const m = this.meta?.seqX?.length || count;

    let targetIdx = 0;
    let isMatch = false;
    let isIndel = false;
    let char1 = 'A';
    let char2 = 'T';

    if (snapshot.algorithm === 'space_optimized' && snapshot.twoRowSnapshot) {
      const activeRow = snapshot.twoRowSnapshot.activeRowIndex ?? 1;
      targetIdx = Math.min(Math.max(0, Math.floor(((activeRow - 1) / Math.max(1, m)) * count)), count - 1);
      const pair = this.alignmentData?.[targetIdx];
      char1 = pair?.charX || (this.meta?.seqX?.[activeRow - 1] ?? 'N');
      char2 = pair?.charY || 'N';
      isMatch = char1 === char2 && char1 !== '-';
    } else if (snapshot.algorithm === 'hirschberg' && snapshot.hirschbergTreeSnapshot) {
      const snap = snapshot.hirschbergTreeSnapshot;
      const mid = snap.midIndex ?? 0;
      targetIdx = Math.min(Math.max(0, Math.floor((mid / Math.max(1, m)) * count)), count - 1);
      const pair = this.alignmentData?.[targetIdx];
      char1 = pair?.charX || 'N';
      char2 = pair?.charY || 'N';
      isMatch = snapshot.phase === 'conquer_merge' || Boolean(snapshot.lcsAccumulated);
    } else {
      const cell = snapshot.currentCell;
      const row = cell?.row ?? cell?.i ?? 1;
      targetIdx = Math.min(Math.max(0, Math.floor(((row - 1) / Math.max(1, m)) * count)), count - 1);
      const pair = this.alignmentData?.[targetIdx];
      char1 = cell?.charX || pair?.charX || 'A';
      char2 = cell?.charY || pair?.charY || 'T';
      isMatch = Boolean(cell?.isMatch);
      isIndel = char1 === '-' || char2 === '-';
    }

    // 1. Dynamic Smooth Rotation of the Double Helix
    if (this.helixGroup) {
      this.helixGroup.rotation.y += 0.045;
    }
    if (this.meshData.particles) {
      this.meshData.particles.rotation.y += 0.015;
    }

    // 2. Dynamic 3D Laser Scanning Ring
    if (this.meshData.scannerRing) {
      this.meshData.scannerRing.visible = (snapshot.phase !== 'finished' && snapshot.phase !== 'complete');
      const targetY = (targetIdx / Math.max(count - 1, 1)) * height - height / 2;
      this.meshData.scannerRing.position.y = targetY;
      if (isMatch) {
        this.meshData.scannerRing.material.color.setHex(0x10b981);
      } else {
        this.meshData.scannerRing.material.color.setHex(0x38bdf8);
      }
    }

    // 3. Highlight Active Molecular Base Pair (Spheres + Hydrogen Bond Rung)
    if (this.lastActive) {
      const prev = this.lastActive;
      if (prev.sph1?.scale) prev.sph1.scale.set(1, 1, 1);
      if (prev.sph2?.scale) prev.sph2.scale.set(1, 1, 1);
      if (prev.rung?.material && !prev.isPermanentMatch) {
        prev.rung.material.emissiveIntensity = prev.rung.userData?.match ? 0.8 : 0;
        if (prev.rung.userData?.match) {
          prev.rung.material.emissive.setHex(0x059669);
        }
      }
      if (prev.sph1?.material && !prev.isPermanentMatch) {
        prev.sph1.material.emissiveIntensity = prev.sph1.userData?.match ? 0.4 : 0.15;
      }
      if (prev.sph2?.material && !prev.isPermanentMatch) {
        prev.sph2.material.emissiveIntensity = prev.sph2.userData?.match ? 0.4 : 0.15;
      }
    }

    const currentRung = this.meshData.rungs[targetIdx];
    if (currentRung) {
      const sph1 = currentRung.userData?.sph1;
      const sph2 = currentRung.userData?.sph2;
      const pairData = currentRung.userData;

      if (sph1) sph1.scale.set(1.4, 1.4, 1.4);
      if (sph2) sph2.scale.set(1.4, 1.4, 1.4);

      if (currentRung.material) {
        if (isMatch) {
          currentRung.material.emissive.setHex(0x10b981);
          currentRung.material.emissiveIntensity = 3.5;
          if (sph1?.material) {
            sph1.material.emissive.setHex(0x10b981);
            sph1.material.emissiveIntensity = 2.5;
          }
          if (sph2?.material) {
            sph2.material.emissive.setHex(0x10b981);
            sph2.material.emissiveIntensity = 2.5;
          }
        } else {
          currentRung.material.emissive.setHex(0xf59e0b);
          currentRung.material.emissiveIntensity = 1.8;
          if (sph1?.material) sph1.material.emissiveIntensity = 1.2;
          if (sph2?.material) sph2.material.emissiveIntensity = 1.2;
        }
      }

      this.lastActive = {
        rung: currentRung,
        sph1,
        sph2,
        isPermanentMatch: Boolean(pairData?.match && (snapshot.phase === 'traceback' || snapshot.phase === 'finished'))
      };
    }

    // 4. Traceback phase: permanently illuminate confirmed LCS rungs
    if (snapshot.phase === 'traceback') {
      this.meshData.rungs.forEach((r) => {
        if (r.userData?.match && r.material) {
          r.material.emissive.setHex(0x10b981);
          r.material.emissiveIntensity = 2.2;
        }
      });
    }

    // 5. Finished phase: celebratory glow
    if (snapshot.phase === 'finished' || snapshot.phase === 'complete') {
      if (this.meshData.scannerRing) this.meshData.scannerRing.visible = false;
      this.meshData.rungs.forEach((r) => {
        if (r.userData?.match && r.material) {
          r.material.emissive.setHex(0x10b981);
          r.material.emissiveIntensity = 2.8;
          if (r.userData?.sph1?.material) r.userData.sph1.material.emissiveIntensity = 1.8;
          if (r.userData?.sph2?.material) r.userData.sph2.material.emissiveIntensity = 1.8;
        }
      });
    }

    // 6. Update Live Cyber HUD
    if (this.ui?.updateStatus) {
      this.ui.updateStatus({
        status: snapshot.phase,
        pairIndex: targetIdx,
        totalPairs: count,
        char1,
        char2,
        isMatch,
        isIndel,
        phase: snapshot.phase,
        lcsAccumulated: snapshot.lcsAccumulated,
        lcsLength: snapshot.lcsAccumulated?.length ?? 0
      });
    }
  }

  setLanguage(lang) {
    this.lang = lang || 'vi';
    if (this.ui?.setLanguage) {
      this.ui.setLanguage(this.lang);
    }
  }

  onThemeChange(theme) {
    const isLight = theme === 'light';
    this.colors = isLight ?
      { 'A': '#0284c7', 'T': '#e11d48', 'G': '#d97706', 'C': '#7c3aed', 'U': '#059669', 'default': '#0284c7', 'matchBond': 0x059669 } :
      { 'A': '#38bdf8', 'T': '#fb7185', 'G': '#fbbf24', 'C': '#a78bfa', 'U': '#34d399', 'default': '#38bdf8', 'matchBond': 0x10b981 };
    if (this.mode === 'three') this._rebuildMesh();
  }

  resize() {
    if (!this.container || !this.canvas) return;
    const w = this.container.clientWidth || 400;
    const h = this.container.clientHeight || 380;
    if (this.mode === 'three' && this.renderer && this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    } else if (this.fallback2D) {
      this.fallback2D.resize();
    }
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.controller?.destroy();
    this.renderer?.dispose();
    this.fallback2D?.destroy();
  }
}
