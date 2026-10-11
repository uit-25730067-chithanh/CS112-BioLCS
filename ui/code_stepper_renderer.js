/**
 * Code Stepper Renderer Module
 * Manages the interactive synchronized code viewer on the right side of the visualizer.
 */

import { CODE_TEMPLATES, mapSnapshotToLine, getCodeLines } from './code_stepper_templates.js';

export class CodeStepperRenderer {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentAlgo = 'grid';
    this.currentLang = 'py';
    this.uiLang = 'vi';
    this.activeLine = 1;
    this.currentSnapshot = null;
    this.seqX = '';
    this.seqY = '';
    this.testId = '';

    this.dom = {
      titleText: null,
      tcTag: null,
      codeLinesContainer: null,
      scopeCard: null
    };

    this._renderScaffold();
  }

  _renderScaffold() {
    if (!this.container) return;
    const isEn = this.uiLang === 'en';
    this.container.innerHTML = `
      <div class="stepper-header">
        <div class="stepper-title-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          <span class="stepper-title" id="stepper-algo-title">Giải Thuật LCS</span>
          <span class="stepper-tc-chip" id="stepper-tc-tag"></span>
        </div>
        <div class="stepper-lang-tabs">
          <button class="lang-tab-btn active" data-lang="py">Python 3</button>
          <button class="lang-tab-btn" data-lang="pseudo">${isEn ? 'Pseudocode (CLRS)' : 'Mã Giả (CLRS)'}</button>
        </div>
      </div>
      <div class="stepper-code-scroll" id="stepper-code-body"></div>
      <div class="stepper-scope-inspector" id="stepper-scope-card">
        <div class="scope-header">
          <span class="scope-label">${isEn ? '⚡ SCOPE VARIABLES (STEP INSPECTOR)' : '⚡ BIẾN NỘI TẠI (STEP INSPECTOR)'}</span>
          <span class="scope-phase-badge" id="scope-phase">INIT</span>
        </div>
        <div class="scope-grid" id="scope-vars">
          <div class="scope-item"><span class="k">${isEn ? 'Position:' : 'Vị trí:'}</span> <span class="v" id="v-pos">-</span></div>
          <div class="scope-item"><span class="k">${isEn ? 'Characters:' : 'Ký tự:'}</span> <span class="v" id="v-chars">-</span></div>
          <div class="scope-item"><span class="k">${isEn ? 'Match:' : 'So khớp:'}</span> <span class="v" id="v-match">-</span></div>
          <div class="scope-item"><span class="k">${isEn ? 'Value:' : 'Giá trị:'}</span> <span class="v" id="v-score">-</span></div>
        </div>
      </div>
    `;

    this.dom.titleText = this.container.querySelector('#stepper-algo-title');
    this.dom.tcTag = this.container.querySelector('#stepper-tc-tag');
    this.dom.codeLinesContainer = this.container.querySelector('#stepper-code-body');
    this.dom.scopeCard = this.container.querySelector('#stepper-scope-card');

    this.container.querySelectorAll('.lang-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.lang-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setLanguage(btn.dataset.lang);
      });
    });

    this._renderCodeLines();
  }

  setContext(seqX, seqY, testId) {
    this.seqX = seqX || '';
    this.seqY = seqY || '';
    this.testId = testId || '';
    this.currentSnapshot = null;
    if (this.dom.tcTag) {
      this.dom.tcTag.textContent = testId ? `[${testId}] ${this.seqX.length}×${this.seqY.length} bp` : '';
    }
    this._renderCodeLines();
    this._updateScope({ phase: 'init' });
  }

  setAlgorithm(algoKey) {
    this.currentAlgo = algoKey || 'grid';
    const tpl = CODE_TEMPLATES[this.currentAlgo] || CODE_TEMPLATES.grid;
    const isEn = this.uiLang === 'en';
    if (this.dom.titleText) {
      this.dom.titleText.textContent = isEn && tpl.titleEn ? tpl.titleEn : tpl.title;
    }
    this._renderCodeLines();
    if (this.currentSnapshot) {
      this.applySnapshot(this.currentSnapshot);
    } else {
      this._updateScope({ phase: 'init' });
    }
  }

  setUILanguage(lang) {
    this.uiLang = lang || 'vi';
    const isEn = this.uiLang === 'en';

    const tpl = CODE_TEMPLATES[this.currentAlgo] || CODE_TEMPLATES.grid;
    if (this.dom.titleText) {
      this.dom.titleText.textContent = isEn && tpl.titleEn ? tpl.titleEn : tpl.title;
    }

    const pseudoBtn = this.container.querySelector('.lang-tab-btn[data-lang="pseudo"]');
    if (pseudoBtn) {
      pseudoBtn.textContent = isEn ? 'Pseudocode (CLRS)' : 'Mã Giả (CLRS)';
    }

    const scopeLabel = this.dom.scopeCard?.querySelector('.scope-label');
    if (scopeLabel) {
      scopeLabel.textContent = isEn ? '⚡ SCOPE VARIABLES (STEP INSPECTOR)' : '⚡ BIẾN NỘI TẠI (STEP INSPECTOR)';
    }

    const scopeGrid = this.dom.scopeCard?.querySelector('#scope-vars');
    if (scopeGrid) {
      const keys = scopeGrid.querySelectorAll('.k');
      if (keys.length >= 4) {
        keys[0].textContent = isEn ? 'Position:' : 'Vị trí:';
        keys[1].textContent = isEn ? 'Characters:' : 'Ký tự:';
        keys[2].textContent = isEn ? 'Match:' : 'So khớp:';
        keys[3].textContent = isEn ? 'Value:' : 'Giá trị:';
      }
    }

    this._renderCodeLines();
    if (this.currentSnapshot) {
      this.applySnapshot(this.currentSnapshot);
    } else {
      this._updateScope({ phase: 'init' });
    }
  }

  setLanguage(langKey) {
    this.currentLang = langKey || 'py';
    this._renderCodeLines();
    if (this.currentSnapshot) this.applySnapshot(this.currentSnapshot);
  }

  _renderCodeLines() {
    if (!this.dom.codeLinesContainer) return;
    const lines = getCodeLines(this.currentAlgo, this.currentLang, this.seqX, this.seqY, this.uiLang);

    this.dom.codeLinesContainer.innerHTML = '';
    const table = document.createElement('div');
    table.className = 'code-table';

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const row = document.createElement('div');
      row.className = 'code-row';
      row.id = `code-line-${lineNum}`;
      row.dataset.line = lineNum;
      row.innerHTML = `<span class="code-num">${lineNum}</span><span class="code-text">${lineText}</span>`;
      table.appendChild(row);
    });

    this.dom.codeLinesContainer.appendChild(table);
  }

  applySnapshot(snapshot) {
    if (!snapshot) return;
    this.currentSnapshot = snapshot;

    const targetLine = mapSnapshotToLine(this.currentAlgo, this.currentLang, snapshot);
    this.activeLine = targetLine;

    if (this.dom.codeLinesContainer) {
      const prevActive = this.dom.codeLinesContainer.querySelectorAll('.code-row.active-line');
      prevActive.forEach(el => el.classList.remove('active-line'));

      const activeEl = this.dom.codeLinesContainer.querySelector(`#code-line-${targetLine}`);
      if (activeEl) {
        activeEl.classList.add('active-line');
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    this._updateScope(snapshot);
  }

  _updateScope(snapshot) {
    if (!this.dom.scopeCard) return;
    const isEn = this.uiLang === 'en';
    const phaseBadge = this.dom.scopeCard.querySelector('#scope-phase');
    const vPos = this.dom.scopeCard.querySelector('#v-pos');
    const vChars = this.dom.scopeCard.querySelector('#v-chars');
    const vMatch = this.dom.scopeCard.querySelector('#v-match');
    const vScore = this.dom.scopeCard.querySelector('#v-score');

    const phase = (snapshot.phase || 'computation').toUpperCase();
    if (phaseBadge) phaseBadge.textContent = phase;

    if (snapshot.currentCell) {
      const c = snapshot.currentCell;
      if (vPos) vPos.textContent = `i=${c.row}, j=${c.col}`;
      if (vChars) vChars.innerHTML = `X[${c.row}]='<b>${c.charX}</b>' Y[${c.col}]='<b>${c.charY}</b>'`;
      if (vMatch) {
        vMatch.innerHTML = c.isMatch
          ? '<span class="scope-match-yes">TRUE (Match ↖)</span>'
          : `<span class="scope-match-no">FALSE (${c.arrow || 'Skip'})</span>`;
      }
      if (vScore) vScore.textContent = `L[${c.row}, ${c.col}] = ${c.val}`;
    } else if (snapshot.phase === 'traceback') {
      if (vPos) vPos.textContent = isEn ? 'Traceback' : 'Truy vết';
      if (vChars) vChars.textContent = snapshot.charAdded ? `+ '${snapshot.charAdded}'` : (isEn ? 'Shift' : 'Dịch chuyển');
      if (vMatch) vMatch.textContent = snapshot.arrow || 'DIAG';
      if (vScore) vScore.textContent = `LCS = "${snapshot.lcsAccumulated || ''}"`;
    } else if (snapshot.phase === 'init') {
      const sX = this.seqX.length <= 8 ? this.seqX : `${this.seqX.slice(0, 6)}...`;
      const sY = this.seqY.length <= 8 ? this.seqY : `${this.seqY.slice(0, 6)}...`;
      if (vPos) vPos.textContent = `${this.seqX.length} × ${this.seqY.length} bp`;
      if (vChars) vChars.textContent = `X:"${sX}" Y:"${sY}"`;
      if (vMatch) vMatch.textContent = isEn ? 'Init L[i,j]=0' : 'Khởi tạo L[i,j]=0';
      if (vScore) vScore.textContent = isEn ? 'Ready to run' : 'Sẵn sàng chạy';
    } else {
      if (vPos) vPos.textContent = `Step ${snapshot.stepIndex + 1}`;
      if (vChars) vChars.textContent = '-';
      if (vMatch) vMatch.textContent = '-';
      if (vScore) vScore.textContent = snapshot.explanation ? snapshot.explanation.slice(0, 30) : '-';
    }
  }
}
