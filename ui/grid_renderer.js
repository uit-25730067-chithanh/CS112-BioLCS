/**
 * DP Matrix Studio Renderer (Interactive 2D Grid & Traceback Vector Arrows)
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * Student: Dang Chi Thanh (MSSV: 25730067)
 */

import { buildDPTableDOM } from './grid-table-builder.js';
import { applyGridDPSnapshot, applyHirschbergSnapshot } from './grid-snapshot-applier.js';
import { t, getLocalizedValidationError } from './i18n.js';

export class GridRenderer {
  constructor(viewportId, formulaBarId) {
    this.viewport = typeof viewportId === 'string' ? document.getElementById(viewportId) : viewportId;
    this.formulaBar = typeof formulaBarId === 'string' ? document.getElementById(formulaBarId) : formulaBarId;
    this.table = null;
    this.cells = [];
    this.seqX = '';
    this.seqY = '';
    this.finalC = null;
    this.finalB = null;
    this.steps = [];
    this.activeHighlights = [];
    this.tracebackPath = [];
    this.lang = 'vi';
    this.lastDefensiveCardArgs = null;
  }

  setLanguage(lang) {
    this.lang = lang || 'vi';
    const isEn = this.lang === 'en';
    if (this.formulaBar) {
      const pillEl = this.formulaBar.querySelector('.step-type-pill');
      if (pillEl) {
        if (pillEl.classList.contains('step-type-traceback')) {
          pillEl.textContent = isEn ? 'TRACEBACK' : 'Truy vết';
        } else if (pillEl.classList.contains('step-type-complete')) {
          pillEl.textContent = isEn ? 'COMPLETE' : 'Hoàn tất';
        } else if (pillEl.classList.contains('step-type-divide')) {
          pillEl.textContent = isEn ? 'DIVIDE & CONQUER' : 'Chia để trị';
        } else {
          pillEl.textContent = isEn ? 'DYNAMIC PROGRAMMING' : 'Quy hoạch động';
        }
      }
      if (!this.steps || this.steps.length === 0) {
        const existingCard = this.viewport?.querySelector('#defensive-validation-card');
        if (!existingCard) {
          this.updateFormula(isEn ? 'Ready. Click <strong>Analyze & Run</strong> to start the algorithm.' : 'Sẵn sàng. Bấm <strong>Phân Tích & Chạy</strong> để bắt đầu thuật toán.');
        }
      }
    }

    // Dynamically refresh defensive validation card in the new language if currently rendered
    const existingCard = this.viewport?.querySelector('#defensive-validation-card');
    if (existingCard && this.lastDefensiveCardArgs) {
      this.renderDefensiveValidationCard({
        ...this.lastDefensiveCardArgs,
        lang: this.lang
      });
    }
  }

  initTable(seqX, seqY, finalC = null, finalB = null, steps = []) {
    if (!this.viewport) return;
    this.lastDefensiveCardArgs = null;
    this.seqX = seqX || '';
    this.seqY = seqY || '';
    this.finalC = finalC;
    this.finalB = finalB;
    this.steps = Array.isArray(steps) ? steps : [];
    const m = this.seqX.length;
    const n = this.seqY.length;
    const isEn = this.lang === 'en';

    this.viewport.innerHTML = '';
    this.cells = [];
    this.activeHighlights = [];
    this.tracebackPath = [];

    // If Hirschberg mode
    if (!finalC && this.steps[0]?.algorithm === 'hirschberg') {
      applyHirschbergSnapshot(this.steps[0], this._getContext());
      return;
    }

    // Safeguard for very large sequences
    if (m * n > 3600) {
      this.viewport.innerHTML = `
        <div style="padding: 32px; text-align: center; color: var(--text-muted);">
          <h4 style="color: var(--nt-a); margin-bottom: 8px;">${isEn ? `Large Dimension Matrix (${m} × ${n} = ${m * n} cells)` : `Bảng Ma Trận Kích Thước Lớn (${m} × ${n} = ${m * n} ô)`}</h4>
          <p>${isEn ? 'Matrix compressed for browser FPS optimization. Please switch to <strong>Genomic Lab</strong> or <strong>Benchmark Arena</strong>.' : 'Để tối ưu hóa FPS trình duyệt, ma trận được nén. Vui lòng chuyển sang tab <strong>Genomic Lab</strong> hoặc <strong>Benchmark Arena</strong>.'}</p>
        </div>
      `;
      return;
    }

    const { table, cells } = buildDPTableDOM(this.seqX, this.seqY, (i, j) => this._handleCellClick(i, j));
    this.table = table;
    this.cells = cells;
    this.viewport.appendChild(table);
    this.updateFormula(isEn ? 'Ready. Click <strong>Analyze & Run</strong> to start the algorithm.' : 'Sẵn sàng. Bấm <strong>Phân Tích & Chạy</strong> để bắt đầu thuật toán.');
  }

  applySnapshot(step) {
    if (!step) return;
    if (step.algorithm === 'hirschberg') {
      applyHirschbergSnapshot(step, this._getContext());
      return;
    }
    if (!this.table) return;
    applyGridDPSnapshot(step, this._getContext());
  }

  _getContext() {
    return {
      m: this.seqX.length,
      n: this.seqY.length,
      finalC: this.finalC,
      finalB: this.finalB,
      steps: this.steps,
      viewport: this.viewport,
      activeHighlights: this.activeHighlights,
      tracebackPath: this.tracebackPath,
      lang: this.lang,
      getCell: (i, j) => this.getCell(i, j),
      clearHighlights: () => this.clearHighlights(),
      clearTraceback: () => this.clearTraceback(),
      updateFormula: (t, p) => this.updateFormula(t, p)
    };
  }

  getCell(i, j) {
    return this.cells[i]?.[j] ?? null;
  }

  clearHighlights() {
    if (this.viewport) {
      const els = this.viewport.querySelectorAll('.cell-active, .cell-compare, .cell-match-found');
      for (let i = 0; i < els.length; i++) {
        els[i].classList.remove('cell-active', 'cell-compare', 'cell-match-found');
      }
    }
    this.activeHighlights.length = 0;
  }

  clearTraceback() {
    if (this.viewport) {
      const els = this.viewport.querySelectorAll('.cell-traceback, .cell-traceback-match, .cell-traceback-skip, .cell-traceback-origin, .header-match');
      for (let i = 0; i < els.length; i++) {
        els[i].classList.remove('cell-traceback', 'cell-traceback-match', 'cell-traceback-skip', 'cell-traceback-origin', 'header-match');
      }
    }
    this.tracebackPath.length = 0;
  }

  updateFormula(text, phase = 'fill') {
    if (!this.formulaBar) return;
    const txtEl = this.formulaBar.querySelector('.formula-text');
    const pillEl = this.formulaBar.querySelector('.step-type-pill');
    if (txtEl) txtEl.innerHTML = text || '';
    if (pillEl) {
      pillEl.className = `step-type-pill step-type-${phase}`;
      const isEn = this.lang === 'en';
      let label = isEn ? 'DYNAMIC PROGRAMMING' : 'Quy hoạch động';
      if (phase === 'traceback') label = isEn ? 'TRACEBACK' : 'Truy vết';
      else if (phase === 'complete') label = isEn ? 'COMPLETE' : 'Hoàn tất';
      else if (phase === 'divide') label = isEn ? 'DIVIDE & CONQUER' : 'Chia để trị';
      pillEl.textContent = label;
    }
  }

  _handleCellClick(i, j) {
    const isEn = this.lang === 'en';
    if (i === 0 || j === 0) {
      this.updateFormula(isEn ? `Base cell C[${i}][${j}] = 0 (Empty sequence boundary).` : `Ô cơ sở C[${i}][${j}] = 0 (Chuỗi rỗng).`);
      return;
    }
    const charX = this.seqX[i - 1];
    const charY = this.seqY[j - 1];
    const isMatch = charX === charY;
    const val = this.finalC?.[i]?.[j] ?? 0;
    const dir = this.finalB?.[i]?.[j] ?? '';
    if (isMatch) {
      this.updateFormula(isEn
        ? `Cell C[${i}][${j}] = C[${i-1}][${j-1}] + 1 = ${val} since X[${i}] = Y[${j}] = '${charX}' (Match ↖).`
        : `Ô C[${i}][${j}] = C[${i-1}][${j-1}] + 1 = ${val} do X[${i}] = Y[${j}] = '${charX}' (Match ↖).`);
    } else {
      this.updateFormula(isEn
        ? `Cell C[${i}][${j}] = max(C[${i-1}][${j}], C[${i}][${j-1}]) = ${val} since X[${i}]('${charX}') ≠ Y[${j}]('${charY}') (${dir}).`
        : `Ô C[${i}][${j}] = max(C[${i-1}][${j}], C[${i}][${j-1}]) = ${val} do X[${i}]('${charX}') ≠ Y[${j}]('${charY}') (${dir}).`);
    }
  }

  renderDefensiveValidationCard({ testId, valResult, rawX, rawY, lang, onSanitize }) {
    if (!this.viewport) return;
    this.viewport.innerHTML = '';
    this.cells = [];
    this.table = null;

    const activeLang = lang || this.lang || 'vi';
    this.lang = activeLang;
    this.lastDefensiveCardArgs = { testId, valResult, rawX, rawY, onSanitize };

    const card = document.createElement('div');
    card.className = 'defensive-validation-card';
    card.id = 'defensive-validation-card';

    const errTitle = t('defensiveTitle', activeLang);
    const errBadge = t('defensiveBadge', activeLang);
    const tcBadge = testId ? `[${testId}]` : t('defensiveTcInvalid', activeLang);
    const reasonText = getLocalizedValidationError(valResult, rawX, rawY, activeLang);

    card.innerHTML = `
      <div class="defensive-card-header">
        <div class="defensive-card-badge-row">
          <span class="defensive-badge-pill">${errBadge}</span>
          <span class="defensive-badge-tc">${tcBadge}</span>
        </div>
        <h3 class="defensive-card-title">${errTitle}</h3>
      </div>
      <div class="defensive-card-body">
        <div class="defensive-alert-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <div class="defensive-alert-content">
            <strong>${t('defensiveViolationDetected', activeLang)}</strong>
            <p>${reasonText}</p>
          </div>
        </div>
        <div class="defensive-academic-note">
          <strong>${t('defensiveAcademicTitle', activeLang)}</strong>
          <p>${t('defensiveAcademicDesc', activeLang)}</p>
        </div>
        <div class="defensive-actions">
          <button id="btn-sanitize-run" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
            <span>${t('defensiveBtnSanitize', activeLang)}</span>
          </button>
        </div>
      </div>
    `;

    this.viewport.appendChild(card);

    const btnSanitize = card.querySelector('#btn-sanitize-run');
    if (btnSanitize && typeof onSanitize === 'function') {
      btnSanitize.addEventListener('click', onSanitize);
    }

    this.updateFormula(t('defensiveFormulaHint', activeLang), 'error');
  }
}
