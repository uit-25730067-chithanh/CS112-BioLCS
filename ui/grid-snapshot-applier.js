/**
 * Snapshot Applier & Hirschberg Visualizer for GridRenderer
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * Student: Dang Chi Thanh (MSSV: 25730067)
 */

export function getArrowSymbol(dir) {
  if (dir === 'DIAG') return { symbol: '↖', cssClass: 'arrow-diag' };
  if (dir === 'UP') return { symbol: '↑', cssClass: 'arrow-up' };
  if (dir === 'LEFT') return { symbol: '←', cssClass: 'arrow-left' };
  return { symbol: '', cssClass: '' };
}

export function renderCellContent(cell, val, dir, uncomputed) {
  if (!cell) return;
  if (uncomputed) {
    cell.classList.add('cell-uncomputed');
    cell.innerHTML = '<div class="cell-content"><span class="cell-val">·</span></div>';
  } else {
    cell.classList.remove('cell-uncomputed');
    const a = getArrowSymbol(dir);
    cell.innerHTML = `
      <div class="cell-content">
        ${a.symbol ? `<span class="cell-arrow ${a.cssClass}">${a.symbol}</span>` : ''}
        <span class="cell-val">${val}</span>
      </div>
    `;
  }
}

export function applyGridDPSnapshot(step, ctx) {
  const { m, n, finalC, finalB, steps, getCell } = ctx;
  ctx.clearHighlights();

  if (step.phase === 'init') {
    ctx.clearTraceback();
    for (let r = 1; r <= m; r++) {
      for (let c = 1; c <= n; c++) renderCellContent(getCell(r, c), 0, '', true);
    }
    const isEn = ctx.lang === 'en';
    ctx.updateFormula(step.explanation || (isEn ? 'Initialize row 0 and column 0 to 0 (Base cases).' : 'Khởi tạo hàng 0 và cột 0 bằng 0 (Base cases).'), 'fill');
    return;
  }

  if (step.phase === 'cell_computation' || step.phase === 'fill') {
    ctx.clearTraceback();
    const cellData = step.currentCell || {};
    const currI = cellData.row !== undefined ? cellData.row : step.i;
    const currJ = cellData.col !== undefined ? cellData.col : step.j;
    const isMatch = Boolean(cellData.isMatch || step.char_match);

    for (let r = 1; r <= m; r++) {
      for (let c = 1; c <= n; c++) {
        if (r < currI || (r === currI && c <= currJ)) {
          const val = step.matrixSnapshot?.[r]?.[c] ?? finalC?.[r]?.[c] ?? 0;
          const dir = finalB?.[r]?.[c] ?? '';
          renderCellContent(getCell(r, c), val, dir, false);
        } else {
          renderCellContent(getCell(r, c), 0, '', true);
        }
      }
    }

    const activeCell = getCell(currI, currJ);
    if (activeCell) {
      activeCell.classList.add('cell-active');
      ctx.activeHighlights.push(activeCell);

      if (isMatch) {
        activeCell.classList.add('cell-match-found');
        const diagCell = getCell(currI - 1, currJ - 1);
        if (diagCell) { diagCell.classList.add('cell-compare'); ctx.activeHighlights.push(diagCell); }
      } else {
        const upCell = getCell(currI - 1, currJ);
        const leftCell = getCell(currI, currJ - 1);
        if (upCell) { upCell.classList.add('cell-compare'); ctx.activeHighlights.push(upCell); }
        if (leftCell) { leftCell.classList.add('cell-compare'); ctx.activeHighlights.push(leftCell); }
      }
      activeCell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
    ctx.updateFormula(step.explanation, 'fill');
    return;
  }

  if (step.phase === 'traceback') {
    ctx.clearHighlights();
    for (let r = 1; r <= m; r++) {
      for (let c = 1; c <= n; c++) {
        const val = finalC?.[r]?.[c] ?? step.matrixSnapshot?.[r]?.[c] ?? 0;
        const dir = finalB?.[r]?.[c] ?? '';
        renderCellContent(getCell(r, c), val, dir, false);
      }
    }
    ctx.clearTraceback();
    const currentStepIdx = step.stepIndex ?? 0;
    if (steps?.length > 0) {
      for (let k = 0; k <= currentStepIdx; k++) {
        const st = steps[k];
        if (st?.phase === 'traceback' && st.currentCell) {
          const tbCell = getCell(st.currentCell.row, st.currentCell.col);
          if (tbCell) {
            tbCell.classList.add('cell-traceback');
            if (st.currentCell.isMatch) {
              tbCell.classList.add('cell-traceback-match');
              const rH = document.getElementById(`row-header-${st.currentCell.row}`);
              const cH = document.getElementById(`col-header-${st.currentCell.col}`);
              if (rH) rH.classList.add('header-match');
              if (cH) cH.classList.add('header-match');
            } else {
              tbCell.classList.add('cell-traceback-skip');
            }
            if (!ctx.tracebackPath.includes(tbCell)) ctx.tracebackPath.push(tbCell);
          }
        }
      }
    }
    const currCell = getCell(step.currentCell?.row, step.currentCell?.col);
    if (currCell) currCell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    ctx.updateFormula(step.explanation, 'traceback');
    return;
  }

  if (step.phase === 'finished' || step.phase === 'complete') {
    ctx.clearHighlights();
    for (let r = 1; r <= m; r++) {
      for (let c = 1; c <= n; c++) {
        renderCellContent(getCell(r, c), finalC?.[r]?.[c] ?? 0, finalB?.[r]?.[c] ?? '', false);
      }
    }
    ctx.clearTraceback();
    for (const st of (steps || [])) {
      if (st?.phase === 'traceback' && st.currentCell) {
        const tbCell = getCell(st.currentCell.row, st.currentCell.col);
        if (tbCell) {
          tbCell.classList.add('cell-traceback');
          if (st.currentCell.isMatch) {
            tbCell.classList.add('cell-traceback-match');
            const rH = document.getElementById(`row-header-${st.currentCell.row}`);
            const cH = document.getElementById(`col-header-${st.currentCell.col}`);
            if (rH) rH.classList.add('header-match');
            if (cH) cH.classList.add('header-match');
          } else {
            tbCell.classList.add('cell-traceback-skip');
          }
          if (!ctx.tracebackPath.includes(tbCell)) ctx.tracebackPath.push(tbCell);
        }
      }
    }
    const originCell = getCell(0, 0);
    if (originCell) {
      originCell.classList.add('cell-traceback', 'cell-traceback-origin');
      if (!ctx.tracebackPath.includes(originCell)) ctx.tracebackPath.push(originCell);
    }
    const isEn = ctx.lang === 'en';
    ctx.updateFormula(step.explanation || (isEn ? 'Algorithm completed! LCS traceback path highlighted.' : 'Thuật toán hoàn tất! Đường đi truy vết LCS được làm nổi bật.'), 'complete');
  }
}

function formatSubseq(seq, maxLen = 42) {
  if (!seq) return '""';
  if (seq.length <= maxLen) return `"${seq}"`;
  return `"${seq.slice(0, 20)}...${seq.slice(-14)}" (${seq.length} bp)`;
}

export function applyHirschbergSnapshot(step, ctx) {
  const isEn = ctx.lang === 'en';
  const treeContainer = ctx.viewport.querySelector('.hirschberg-container');
  const snap = step.hirschbergTreeSnapshot || {};

  if (!treeContainer) {
    ctx.viewport.innerHTML = `
      <div class="hirschberg-container">
        <div class="hirschberg-card">
          <div class="hirschberg-header">
            <div class="hirschberg-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="5" r="3"></circle>
                <circle cx="5" cy="19" r="3"></circle>
                <circle cx="19" cy="19" r="3"></circle>
                <path d="M12 8v4M7.5 16.5L10 12M16.5 16.5L14 12"></path>
              </svg>
              <span>${isEn ? 'Hirschberg Divide-and-Conquer Tree Space (O(min(m, n)) RAM)' : 'Không Gian Cây Chia Để Trị Hirschberg (O(min(m, n)) RAM)'}</span>
            </div>
            <span class="hirschberg-algo-pill">CACM 1975</span>
          </div>
          <p class="hirschberg-desc">${isEn ? 'Decompose sequence X at midpoint (mid), compute forward and reverse linear LLCS vectors to find optimal split point k* on Y.' : 'Phân rã chuỗi X tại vị trí giữa (mid), tính hai vector LLCS tuyến tính để tìm điểm cắt tối ưu k* trên chuỗi Y.'}</p>
          <div id="hirschberg-live-state" class="hirschberg-state-box"></div>
        </div>
      </div>
    `;
  }

  const stateDiv = ctx.viewport.querySelector('#hirschberg-live-state');
  if (stateDiv) {
    const xFmt = formatSubseq(snap.xSub, 36);
    const yFmt = formatSubseq(snap.ySub, 36);
    const lcsFmt = step.lcsAccumulated ? formatSubseq(step.lcsAccumulated, 36) : (isEn ? '(Synthesizing...)' : '(Đang tổng hợp...)');

    stateDiv.innerHTML = `
      <div class="hirschberg-meta-row">
        <div><strong>${isEn ? 'Recursion Depth:' : 'Độ sâu đệ quy:'}</strong> <span class="hirschberg-val">${snap.depth ?? 0}</span></div>
        <div><strong>${isEn ? 'Phase:' : 'Pha:'}</strong> <span class="hirschberg-phase-tag">${(step.phase || 'running').toUpperCase()}</span></div>
        <div><strong>${isEn ? 'Midpoint cut mid(X):' : 'Điểm cắt mid(X):'}</strong> <span class="hirschberg-val">${snap.midIndex ?? 0}</span></div>
        <div><strong>${isEn ? 'Optimal split k*(Y):' : 'Điểm cắt k*(Y):'}</strong> <span class="hirschberg-val">${snap.splitPointK ?? 0}</span></div>
      </div>
      <div class="hirschberg-seq-grid">
        <div class="hirschberg-seq-item">
          <div class="seq-label">${isEn ? 'Subsequence X (Decomposition branch):' : 'Chuỗi con X (Nhánh phân rã):'}</div>
          <div class="seq-val" title="${snap.xSub || ''}">${xFmt}</div>
        </div>
        <div class="hirschberg-seq-item">
          <div class="seq-label">${isEn ? 'Subsequence Y (Segment at k*):' : 'Chuỗi con Y (Phân đoạn theo k*):'}</div>
          <div class="seq-val" title="${snap.ySub || ''}">${yFmt}</div>
        </div>
      </div>
      <div class="hirschberg-lcs-row">
        <strong>${isEn ? 'Accumulated LCS:' : 'LCS Tích Lũy:'}</strong> <span class="lcs-val" title="${step.lcsAccumulated || ''}">${lcsFmt}</span>
      </div>
    `;
  }

  ctx.updateFormula(step.explanation || (isEn ? 'Hirschberg executing...' : 'Hirschberg đang thực thi...'), 'fill');
}
