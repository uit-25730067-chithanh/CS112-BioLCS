/**
 * Genetic Alignment Mutation Bar & Biological Statistics Renderer
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * Student: Dang Chi Thanh (MSSV: 25730067)
 */

import { generateAlignment } from '../engine/alignment.js';

export class AlignmentRenderer {
  constructor(tracksContainerId, statsContainerId) {
    this.tracksContainer = typeof tracksContainerId === 'string' ? document.getElementById(tracksContainerId) : tracksContainerId;
    this.statsContainer = typeof statsContainerId === 'string' ? document.getElementById(statsContainerId) : statsContainerId;
    this.lang = 'vi';
    this.lastSeqX = '';
    this.lastSeqY = '';
    this.lastLcs = '';
  }

  setLanguage(lang) {
    this.lang = lang || 'vi';
    if (this.lastSeqX || this.lastSeqY) {
      this.render(this.lastSeqX, this.lastSeqY, this.lastLcs);
    }
  }

  /**
   * Renders sequence alignment and mutation metrics
   */
  render(seqX, seqY, lcs, options = {}) {
    if (!this.tracksContainer) return;
    this.lastSeqX = seqX;
    this.lastSeqY = seqY;
    this.lastLcs = lcs;
    const lang = options.lang || this.lang || 'vi';
    const isEn = lang === 'en';
    
    // Clear
    this.tracksContainer.innerHTML = '';
    if (this.statsContainer) this.statsContainer.innerHTML = '';

    if (!seqX && !seqY) {
      this.tracksContainer.innerHTML = `<div style="color: #64748b; padding: 20px;">${isEn ? 'No alignment data available yet.' : 'Chưa có dữ liệu gióng hàng chuỗi.'}</div>`;
      return;
    }

    // Call engine's generateAlignment
    const alignmentResult = generateAlignment(seqX || '', seqY || '', lcs || '');
    const { xAligned, yAligned, mutations, summary } = alignmentResult;
    const len = xAligned.length;

    // Live Scanning Status Bar
    const liveBar = document.createElement('div');
    liveBar.id = 'alignment-live-status-bar';
    liveBar.className = 'alignment-live-bar';
    liveBar.innerHTML = `
      <div class="align-live-tag"><span class="hud-pulse-dot dot-active"></span> ${isEn ? 'ALIGNMENT READY' : 'SẴN SÀNG GIÓNG HÀNG'}</div>
      <div class="align-live-pos">${isEn ? 'Total Positions:' : 'Tổng số vị trí:'} <b>${len}</b> bp</div>
      <div class="align-live-lcs">LCS: <b style="color: #10b981;">"${lcs || ''}"</b> (${summary?.matchCount || 0} bp)</div>
    `;
    this.tracksContainer.appendChild(liveBar);
    this.liveBar = liveBar;

    // Build DOM Tracks
    const wrapper = document.createElement('div');
    wrapper.className = 'alignment-tracks-wrapper';

    // Track 1: Sequence X
    const rowX = document.createElement('div');
    rowX.className = 'track-row';
    rowX.innerHTML = `<span class="track-label">${isEn ? 'Sequence X (Gene 1):' : 'Chuỗi X (Gen 1):'}</span>`;
    const seqXDiv = document.createElement('div');
    seqXDiv.className = 'track-sequence';

    // Track 2: Middle Indicator
    const rowMid = document.createElement('div');
    rowMid.className = 'track-row';
    rowMid.innerHTML = `<span class="track-label">${isEn ? 'Homology:' : 'Tương đồng:'}</span>`;
    const seqMidDiv = document.createElement('div');
    seqMidDiv.className = 'track-sequence';

    // Track 3: Sequence Y
    const rowY = document.createElement('div');
    rowY.className = 'track-row';
    rowY.innerHTML = `<span class="track-label">${isEn ? 'Sequence Y (Gene 2):' : 'Chuỗi Y (Gen 2):'}</span>`;
    const seqYDiv = document.createElement('div');
    seqYDiv.className = 'track-sequence';

    for (let k = 0; k < len; k++) {
      const charX = xAligned[k];
      const charY = yAligned[k];
      const mut = mutations[k] || { type: 'MATCH' };
      const op = mut.type.toLowerCase();

      // Slot X
      const slotX = document.createElement('div');
      if (charX === '-') {
        slotX.className = 'gap-slot';
        slotX.textContent = '-';
      } else {
        slotX.className = `nt-slot nt-${charX.toLowerCase()}`;
        slotX.textContent = charX;
      }
      seqXDiv.appendChild(slotX);

      // Slot Mid
      const slotMid = document.createElement('div');
      slotMid.className = 'match-bar-slot';
      if (op === 'match') {
        slotMid.innerHTML = '<span class="match-symbol">|</span>';
      } else if (op === 'insertion') {
        slotMid.innerHTML = '<span class="gap-symbol">+</span>';
      } else if (op === 'deletion') {
        slotMid.innerHTML = '<span class="gap-symbol">-</span>';
      } else {
        slotMid.innerHTML = '<span class="mismatch-symbol">·</span>';
      }
      seqMidDiv.appendChild(slotMid);

      // Slot Y
      const slotY = document.createElement('div');
      if (charY === '-') {
        slotY.className = 'gap-slot';
        slotY.textContent = '-';
      } else {
        slotY.className = `nt-slot nt-${charY.toLowerCase()}`;
        slotY.textContent = charY;
      }
      seqYDiv.appendChild(slotY);
    }

    rowX.appendChild(seqXDiv);
    rowMid.appendChild(seqMidDiv);
    rowY.appendChild(seqYDiv);

    wrapper.appendChild(rowX);
    wrapper.appendChild(rowMid);
    wrapper.appendChild(rowY);
    this.tracksContainer.appendChild(wrapper);

    // Save slot references for animation tracking
    this.slotsX = Array.from(seqXDiv.children);
    this.slotsMid = Array.from(seqMidDiv.children);
    this.slotsY = Array.from(seqYDiv.children);
    this.wrapper = wrapper;
    this.mutations = mutations;

    // Build mapping from original sequence positions to aligned slot indices
    let curX = 0;
    let curY = 0;
    this.xToSlot = [];
    this.yToSlot = [];
    for (let k = 0; k < len; k++) {
      if (xAligned[k] !== '-') {
        this.xToSlot[curX] = k;
        curX++;
      }
      if (yAligned[k] !== '-') {
        this.yToSlot[curY] = k;
        curY++;
      }
    }

    // Build Stats Grid
    if (this.statsContainer && summary) {
      const matchPct = (summary.similarityPercentage || 0).toFixed(1);
      
      let bioComment = '';
      if (isEn) {
        if (summary.similarityPercentage >= 80) {
          bioComment = 'High Conservation. Functional coding region strictly preserved between plant species.';
        } else if (summary.similarityPercentage >= 50) {
          bioComment = 'Moderate Homology. Accumulation of substitutions and indels observed.';
        } else {
          bioComment = 'High Sequence Divergence. Substantial structural variations detected.';
        }
      } else {
        if (summary.similarityPercentage >= 80) {
          bioComment = 'Độ tương đồng rất cao (High Conservation). Vùng gen mã hóa chức năng được bảo tồn chặt chẽ giữa hai loài thực vật.';
        } else if (summary.similarityPercentage >= 50) {
          bioComment = 'Tương đồng trung bình (Homology). Có sự tích lũy của các đột biến thay thế và chèn/mất đoạn (Indels).';
        } else {
          bioComment = 'Trình tự có mức phân kỳ cao (High Divergence). Tồn tại nhiều biến dị cấu trúc lớn.';
        }
      }

      this.statsContainer.innerHTML = `
        <div class="mutation-stats-grid">
          <div class="stat-box">
            <span class="stat-label">${isEn ? 'LCS Length (Matches)' : 'Độ dài LCS (Trùng khớp)'}</span>
            <span class="stat-value stat-match">${summary.matchCount} bp</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">${isEn ? 'Similarity Score' : 'Tỷ lệ tương đồng'}</span>
            <span class="stat-value stat-similarity">${matchPct}%</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">${isEn ? 'Deletions (Indels)' : 'Mất đoạn (Deletions)'}</span>
            <span class="stat-value stat-del">${summary.deletionCount}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">${isEn ? 'Insertions (Indels)' : 'Chèn đoạn (Insertions)'}</span>
            <span class="stat-value stat-ins">${summary.insertionCount}</span>
          </div>
        </div>
        <div class="bio-comment-callout">
          <strong>${isEn ? 'Evolutionary genomics insight:' : 'Nhận định sinh học tiến hóa:'}</strong> ${bioComment}
        </div>
      `;
    }
  }

  /**
   * Applies timeline step snapshot to animate scanning cursor and traceback on alignment tracks.
   * @param {object} snapshot - Timeline snapshot from StepEngine
   */
  applySnapshot(snapshot) {
    if (!snapshot || !this.slotsX || this.slotsX.length === 0) return;

    // Reset previous scan highlight classes
    this.slotsX.forEach(s => s.classList.remove('slot-scan-active', 'slot-scan-match'));
    this.slotsY.forEach(s => s.classList.remove('slot-scan-active', 'slot-scan-match'));
    this.slotsMid.forEach(s => s.classList.remove('slot-scan-active', 'slot-scan-match'));

    if (snapshot.phase === 'init') {
      this.slotsX.forEach(s => s.classList.remove('slot-confirmed-lcs', 'slot-lcs-final'));
      this.slotsY.forEach(s => s.classList.remove('slot-confirmed-lcs', 'slot-lcs-final'));
      this.slotsMid.forEach(s => s.classList.remove('slot-confirmed-lcs', 'slot-lcs-final'));
      return;
    }

    if (snapshot.phase === 'cell_computation') {
      let idxX = undefined;
      let idxY = undefined;
      let isMatch = false;

      if (snapshot.algorithm === 'space_optimized' && snapshot.twoRowSnapshot) {
        const row = snapshot.twoRowSnapshot.activeRowIndex ?? 1;
        idxX = this.xToSlot ? this.xToSlot[row - 1] : undefined;
        idxY = idxX;
        isMatch = Boolean(this.mutations?.[idxX]?.type === 'MATCH');
      } else if (snapshot.algorithm === 'hirschberg' && snapshot.hirschbergTreeSnapshot) {
        const snap = snapshot.hirschbergTreeSnapshot;
        const mid = snap.midIndex ?? 0;
        const splitK = snap.splitPointK ?? 0;
        idxX = this.xToSlot ? this.xToSlot[mid] : undefined;
        idxY = this.yToSlot ? this.yToSlot[splitK] : undefined;
        isMatch = (snapshot.phase === 'conquer_merge') || Boolean(snapshot.lcsAccumulated);
      } else if (snapshot.currentCell) {
        const cell = snapshot.currentCell;
        const row = cell.row ?? cell.i;
        const col = cell.col ?? cell.j;
        idxX = this.xToSlot ? this.xToSlot[row - 1] : undefined;
        idxY = this.yToSlot ? this.yToSlot[col - 1] : undefined;
        isMatch = Boolean(cell.isMatch);
      }

      const cls = isMatch ? 'slot-scan-match' : 'slot-scan-active';

      if (idxX !== undefined && this.slotsX[idxX]) {
        this.slotsX[idxX].classList.add(cls);
      }
      if (idxY !== undefined && this.slotsY[idxY]) {
        this.slotsY[idxY].classList.add(cls);
      }
      if (idxX !== undefined && idxX === idxY && this.slotsMid[idxX]) {
        this.slotsMid[idxX].classList.add(cls);
      }

      // Update live status bar
      if (this.liveBar) {
        const activeIdx = (idxX ?? idxY ?? 0) + 1;
        const len = this.slotsX.length;
        const matchText = isMatch ? '<span style="color:#10b981;">● TRÙNG KHỚP LCS</span>' : '<span style="color:#f59e0b;">○ ĐỘT BIẾN</span>';
        this.liveBar.innerHTML = `
          <div class="align-live-tag"><span class="hud-pulse-dot dot-active"></span> ĐANG QUÉT VỊ TRÍ #${activeIdx}/${len} bp</div>
          <div class="align-live-pos">Trạng thái: ${matchText}</div>
          <div class="align-live-lcs">Pha: <b>${(snapshot.phase || '').toUpperCase()}</b></div>
        `;
      }

      // Smoothly scroll active nucleotide into view if sequence is wide
      const targetSlot = (idxX !== undefined && this.slotsX[idxX]) || (idxY !== undefined && this.slotsY[idxY]);
      if (targetSlot && this.wrapper) {
        const offset = targetSlot.offsetLeft - (this.wrapper.clientWidth / 2);
        this.wrapper.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
      }
    } else if (snapshot.phase === 'traceback') {
      if (this.liveBar) {
        this.liveBar.innerHTML = `
          <div class="align-live-tag"><span class="hud-pulse-dot dot-active" style="background:#10b981;box-shadow:0 0 8px #10b981;"></span> TRUY VẾT ĐƯỜNG ĐI LCS TỐI ƯU</div>
          <div class="align-live-pos">Ký tự thêm: <b style="color:#10b981;">"${snapshot.charAdded || ''}"</b></div>
          <div class="align-live-lcs">LCS Tích lũy: <b style="color:#10b981;">"${snapshot.lcsAccumulated || ''}"</b></div>
        `;
      }
      if (snapshot.charAdded || snapshot.arrow === 'DIAG') {
        const char = snapshot.charAdded;
        if (char) {
          for (let k = 0; k < this.slotsX.length; k++) {
            if (this.mutations && this.mutations[k]?.type === 'MATCH' && this.slotsX[k]?.textContent === char) {
              this.slotsX[k].classList.add('slot-confirmed-lcs');
              this.slotsY[k].classList.add('slot-confirmed-lcs');
              if (this.slotsMid[k]) this.slotsMid[k].classList.add('slot-confirmed-lcs');
            }
          }
        }
      }
    } else if (snapshot.phase === 'finished' || snapshot.phase === 'complete') {
      if (this.liveBar) {
        this.liveBar.innerHTML = `
          <div class="align-live-tag" style="color:#10b981;"><span class="hud-pulse-dot dot-finished"></span> HOÀN TẤT GIÓNG HÀNG DI TRUYỀN</div>
          <div class="align-live-pos">Tổng số vị trí: <b>${this.slotsX.length}</b> bp</div>
          <div class="align-live-lcs">LCS: <b style="color:#10b981;">"${snapshot.lcsAccumulated || ''}"</b></div>
        `;
      }
      for (let k = 0; k < this.slotsX.length; k++) {
        if (this.mutations && this.mutations[k]?.type === 'MATCH') {
          this.slotsX[k].classList.add('slot-lcs-final');
          this.slotsY[k].classList.add('slot-lcs-final');
          if (this.slotsMid[k]) this.slotsMid[k].classList.add('slot-lcs-final');
        }
      }
    }
  }
}
