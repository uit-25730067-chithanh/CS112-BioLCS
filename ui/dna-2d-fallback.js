/**
 * 2D Bioluminescent Sine-Helix Canvas Fallback
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * Student: Dang Chi Thanh (MSSV: 25730067)
 */

export function init2DFallback(canvas, container) {
  const ctx = canvas.getContext('2d');
  let animId = null;
  let angle = 0;

  const resize = () => {
    if (!container || !canvas) return;
    const w = container.clientWidth || 400;
    const h = container.clientHeight || 380;
    canvas.width = w * window.devicePixelRatio;
    canvas.height = h * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  };
  resize();

  let activeRung = -1;
  let isMatchActive = false;

  let isPaused = false;

  const render = () => {
    if (!ctx || isPaused) return;
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, w, h);
    angle += 0.02;

    const rungs = 18;
    for (let i = 0; i < rungs; i++) {
      const a = angle + i * 0.4;
      const x = (w / rungs) * i + 20;
      const y1 = h / 2 + Math.sin(a) * 50;
      const y2 = h / 2 - Math.sin(a) * 50;

      const isActive = i === activeRung;
      ctx.strokeStyle = isActive ? (isMatchActive ? '#10b981' : '#38bdf8') : 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = isActive ? 3.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();

      ctx.fillStyle = isActive && isMatchActive ? '#10b981' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(x, y1, isActive ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isActive && isMatchActive ? '#10b981' : '#fb7185';
      ctx.beginPath();
      ctx.arc(x, y2, isActive ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
    }
    animId = requestAnimationFrame(render);
  };
  render();

  return {
    resize,
    pause: () => {
      isPaused = true;
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    },
    resume: () => {
      if (isPaused) {
        isPaused = false;
        render();
      }
    },
    updateStep: (snapshot) => {
      angle += 0.05;
      const cell = snapshot?.currentCell;
      if (cell) {
        activeRung = ((cell.row || 1) + (cell.col || 1)) % 18;
        isMatchActive = Boolean(cell.isMatch);
      } else if (snapshot?.twoRowSnapshot) {
        activeRung = (snapshot.twoRowSnapshot.activeRowIndex || 1) % 18;
        isMatchActive = false;
      } else if (snapshot?.hirschbergTreeSnapshot) {
        activeRung = (snapshot.hirschbergTreeSnapshot.midIndex || 1) % 18;
        isMatchActive = true;
      }
    },
    destroy: () => {
      isPaused = true;
      if (animId) cancelAnimationFrame(animId);
    }
  };
}
