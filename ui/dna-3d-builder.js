/**
 * 3D DNA Helix Molecular Mesh Builder
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * Student: Dang Chi Thanh (MSSV: 25730067)
 */

export function createBaseSprite(char, color) {
  const THREE = window.THREE;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, 32, 33);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.9 });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.1, 1.1, 1.1);
  return sprite;
}

export function buildDNAHelixMesh(alignmentData, colors, options = {}) {
  const THREE = window.THREE;
  const group = new THREE.Group();
  const rungs = [];
  const spheres = [];
  const labels = [];

  const pairs = alignmentData && alignmentData.length > 0 ? alignmentData.slice(0, 36) : getDefaultPairs();
  const count = pairs.length;
  const radius = 4.2;
  const height = Math.max(16, count * 0.95);
  const pts1 = [];
  const pts2 = [];

  for (let i = 0; i < count; i++) {
    const pair = pairs[i];
    const t = (i / Math.max(count - 1, 1)) * Math.PI * 4;
    const y = (i / Math.max(count - 1, 1)) * height - height / 2;

    const x1 = Math.cos(t) * radius;
    const z1 = Math.sin(t) * radius;
    const x2 = Math.cos(t + Math.PI) * radius;
    const z2 = Math.sin(t + Math.PI) * radius;

    const p1 = new THREE.Vector3(x1, y, z1);
    const p2 = new THREE.Vector3(x2, y, z2);
    pts1.push(p1);
    pts2.push(p2);

    const char1 = pair.charX || 'A';
    const char2 = pair.charY || 'T';
    const isMatch = pair.type === 'MATCH';
    const isIndel = pair.type === 'DELETION' || pair.type === 'INSERTION';

    const col1 = new THREE.Color(colors[char1] || colors.default);
    const col2 = new THREE.Color(colors[char2] || colors.default);

    // Node 1 (Strand X)
    const mat1 = new THREE.MeshPhongMaterial({
      color: col1,
      emissive: isMatch ? col1.clone().multiplyScalar(0.4) : col1.clone().multiplyScalar(0.15),
      shininess: 90,
      transparent: char1 === '-',
      opacity: char1 === '-' ? 0.25 : 1.0
    });
    const sph1 = new THREE.Mesh(new THREE.SphereGeometry(char1 === '-' ? 0.22 : 0.42, 20, 20), mat1);
    sph1.position.copy(p1);
    sph1.userData = { strand: 'X', char: char1, index: i, type: pair.type, match: isMatch };
    group.add(sph1);
    spheres.push(sph1);

    // Node 2 (Strand Y)
    const mat2 = new THREE.MeshPhongMaterial({
      color: col2,
      emissive: isMatch ? col2.clone().multiplyScalar(0.4) : col2.clone().multiplyScalar(0.15),
      shininess: 90,
      transparent: char2 === '-',
      opacity: char2 === '-' ? 0.25 : 1.0
    });
    const sph2 = new THREE.Mesh(new THREE.SphereGeometry(char2 === '-' ? 0.22 : 0.42, 20, 20), mat2);
    sph2.position.copy(p2);
    sph2.userData = { strand: 'Y', char: char2, index: i, type: pair.type, match: isMatch };
    group.add(sph2);
    spheres.push(sph2);

    // Billboard Text Labels
    if (char1 !== '-') {
      const lbl1 = createBaseSprite(char1, colors[char1] || '#38bdf8');
      lbl1.position.copy(p1).add(new THREE.Vector3(x1 > 0 ? 0.7 : -0.7, 0, z1 > 0 ? 0.7 : -0.7));
      lbl1.visible = options.showLabels !== false;
      group.add(lbl1);
      labels.push(lbl1);
    }
    if (char2 !== '-') {
      const lbl2 = createBaseSprite(char2, colors[char2] || '#fb7185');
      lbl2.position.copy(p2).add(new THREE.Vector3(x2 > 0 ? 0.7 : -0.7, 0, z2 > 0 ? 0.7 : -0.7));
      lbl2.visible = options.showLabels !== false;
      group.add(lbl2);
      labels.push(lbl2);
    }

    // Hydrogen Bond Rung (Connecting Cylinder)
    const dist = p1.distanceTo(p2);
    const rungGeo = new THREE.CylinderGeometry(isMatch ? 0.12 : 0.07, isMatch ? 0.12 : 0.07, isIndel ? dist * 0.4 : dist, 12);
    const rungColor = isMatch ? (colors.matchBond || 0x10b981) : (isIndel ? 0x64748b : 0xf59e0b);
    const rungMat = new THREE.MeshPhongMaterial({
      color: rungColor,
      emissive: isMatch ? 0x059669 : 0x000000,
      emissiveIntensity: isMatch ? 0.8 : 0,
      transparent: true,
      opacity: isIndel ? 0.4 : (isMatch ? 0.95 : 0.65),
      shininess: 80
    });
    const rung = new THREE.Mesh(rungGeo, rungMat);
    rung.position.copy(p1).lerp(p2, isIndel ? (char1 === '-' ? 0.8 : 0.2) : 0.5);
    rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
    rung.userData = { index: i, type: pair.type, match: isMatch, sph1, sph2 };
    group.add(rung);
    rungs.push(rung);

    // If Match: Add decorative glowing hydrogen bond rings
    if (isMatch) {
      const ringGeo = new THREE.TorusGeometry(0.24, 0.05, 8, 20);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.85 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(p1).lerp(p2, 0.5);
      ring.quaternion.copy(rung.quaternion);
      ring.rotateX(Math.PI / 2);
      group.add(ring);
    }
  }

  // Phosphate-sugar backbone ribbons (Smooth 3D Tubes)
  if (pts1.length > 2 && pts2.length > 2) {
    const curve1 = new THREE.CatmullRomCurve3(pts1);
    const tube1 = new THREE.Mesh(
      new THREE.TubeGeometry(curve1, count * 3, 0.14, 8, false),
      new THREE.MeshPhongMaterial({ color: 0x0284c7, transparent: true, opacity: 0.75, shininess: 100 })
    );
    group.add(tube1);

    const curve2 = new THREE.CatmullRomCurve3(pts2);
    const tube2 = new THREE.Mesh(
      new THREE.TubeGeometry(curve2, count * 3, 0.14, 8, false),
      new THREE.MeshPhongMaterial({ color: 0xe11d48, transparent: true, opacity: 0.75, shininess: 100 })
    );
    group.add(tube2);
  }

  // Floating bioluminescent dust particles
  const particlesGeo = new THREE.BufferGeometry();
  const particleCount = 120;
  const pPos = new Float32Array(particleCount * 3);
  for (let k = 0; k < particleCount * 3; k += 3) {
    pPos[k] = (Math.random() - 0.5) * 22;
    pPos[k + 1] = (Math.random() - 0.5) * 26;
    pPos[k + 2] = (Math.random() - 0.5) * 22;
  }
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const particlesMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.22, transparent: true, opacity: 0.6 });
  const particles = new THREE.Points(particlesGeo, particlesMat);
  group.add(particles);

  // Dynamic 3D Laser Scanning Ring (Cyber-Biotech Beacon)
  const scannerGeo = new THREE.TorusGeometry(radius * 1.25, 0.12, 16, 48);
  const scannerMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85
  });
  const scannerRing = new THREE.Mesh(scannerGeo, scannerMat);
  scannerRing.rotateX(Math.PI / 2);
  scannerRing.position.set(0, -height / 2, 0);
  scannerRing.visible = false;
  group.add(scannerRing);

  return { group, rungs, spheres, labels, particles, scannerRing, height, count, radius };
}

function getDefaultPairs() {
  const seq = 'ATGCGATCGATCGATCGTACGATCGATC';
  const complement = { A: 'T', T: 'A', G: 'C', C: 'G' };
  return seq.split('').map((c, idx) => ({
    charX: c,
    charY: complement[c] || 'T',
    type: 'MATCH',
    index: idx
  }));
}
