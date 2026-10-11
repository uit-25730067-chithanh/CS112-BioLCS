/**
 * Benchmark View Coordinator
 * Coordinates BenchmarkEngine and BenchmarkRenderer with interactive controls.
 */

import { BenchmarkEngine } from './benchmark_engine.js';
import { BenchmarkRenderer } from './benchmark_renderer.js';

export class BenchmarkView {
  constructor(containerId) {
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.engine = new BenchmarkEngine();
    this.renderer = new BenchmarkRenderer();
    this.lastSeqX = '';
    this.lastSeqY = '';
    this.lastTestcase = null;
    this.currentIterations = 50;
    this.lang = 'vi';
    this.raceTimers = [];
  }

  _clearRaceTimers() {
    if (this.raceTimers && this.raceTimers.length > 0) {
      this.raceTimers.forEach(id => clearTimeout(id));
      this.raceTimers = [];
    }
  }

  setLanguage(lang) {
    this._clearRaceTimers();
    this.lang = lang || 'vi';
    if (this.renderer) {
      this.renderer.setLanguage(this.lang);
    }
    if (this.lastSeqX || this.lastSeqY) {
      this._executeAndRender(this.lastSeqX, this.lastSeqY, {
        testcase: this.lastTestcase,
        iterations: this.currentIterations,
        lang: this.lang
      });
    }
  }

  /**
   * Runs the benchmark with specified iterations and renders the view.
   */
  runBenchmark(seqX, seqY, options = {}) {
    if (!this.container) return;
    this._clearRaceTimers();
    this.lastSeqX = seqX || '';
    this.lastSeqY = seqY || '';
    if (options.testcase) {
      this.lastTestcase = options.testcase;
    }
    const iterations = options.iterations || this.currentIterations;
    const lang = options.lang || this.lang || 'vi';
    const isEn = lang === 'en';

    // If already rendered, do live in-place animation so user sees visible action
    const btnRe = this.container.querySelector('#btn-re-benchmark');
    const racePanel = this.container.querySelector('#benchmark-live-race-panel');
    const phaseInfo = this.container.querySelector('#race-phase-info');
    const stepInfo = this.container.querySelector('#race-step-info');
    const gridBar = this.container.querySelector('#race-grid-bar');
    const spaceBar = this.container.querySelector('#race-space-bar');
    const hirschBar = this.container.querySelector('#race-hirsch-bar');
    const gridStat = this.container.querySelector('#race-grid-stat');
    const spaceStat = this.container.querySelector('#race-space-stat');
    const hirschStat = this.container.querySelector('#race-hirsch-stat');

    if (btnRe && racePanel) {
      // 0. Update overview banner title immediately for responsive UI and test consistency
      const overviewTitle = this.container.querySelector('.benchmark-overview-title');
      if (overviewTitle) {
        overviewTitle.textContent = isEn
          ? `Empirical Performance Benchmark (${iterations} iterations)`
          : `Kết Quả Đo Hiệu Năng Thực Tế (${iterations} lần lặp)`;
      }

      // 1. Button loading & spin animation
      btnRe.classList.add('btn-benchmarking');
      btnRe.disabled = true;
      btnRe.innerHTML = `
        <svg class="spin-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <span>${isEn ? `Measuring (${iterations} runs)...` : `Đang đo lường (${iterations} lần)...`}</span>
      `;

      // 2. Dynamic Pacing directly governed by speed-select
      const speedSelect = document.getElementById('speed-select');
      const speedVal = speedSelect ? parseInt(speedSelect.value, 10) : 250;
      // Paced for human observation: exactly proportional to speed-select (50ms to 800ms)
      const tStep = Math.max(50, Math.min(speedVal, 800));

      // Apply smooth transition duration to progress bars matching step pacing
      const barTransition = `width ${Math.round(tStep * 0.92)}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
      if (gridBar) gridBar.style.transition = barTransition;
      if (spaceBar) spaceBar.style.transition = barTransition;
      if (hirschBar) hirschBar.style.transition = barTransition;

      // Stage 0 (t=0): Reset bars & init labels
      if (gridBar) gridBar.style.width = '0%';
      if (spaceBar) spaceBar.style.width = '0%';
      if (hirschBar) hirschBar.style.width = '0%';

      if (phaseInfo) {
        phaseInfo.textContent = isEn ? 'STARTING...' : 'BẮT ĐẦU...';
        phaseInfo.style.background = 'rgba(99, 102, 241, 0.25)';
        phaseInfo.style.color = '#818cf8';
      }
      if (stepInfo) {
        stepInfo.textContent = isEn ? `Run 1 / ${iterations}` : `Lần 1 / ${iterations}`;
      }

      // Stage 1 (t = tStep): Early surge (Space-Opt sprints first)
      this.raceTimers.push(setTimeout(() => {
        if (spaceBar) spaceBar.style.width = '42%';
        if (hirschBar) hirschBar.style.width = '32%';
        if (gridBar) gridBar.style.width = '22%';
        if (spaceStat) spaceStat.textContent = `42% (${isEn ? '2-Row Buffer' : 'Bộ đệm 2 dòng'})`;
        if (hirschStat) hirschStat.textContent = `32% (${isEn ? 'Midpoint Split' : 'Cắt trung điểm'})`;
        if (gridStat) gridStat.textContent = `22% (${isEn ? 'Matrix Alloc' : 'Khởi tạo bảng'})`;
        if (phaseInfo) phaseInfo.textContent = isEn ? 'PROFILING...' : 'ĐANG ĐUA TIẾN TRÌNH...';
        if (stepInfo) stepInfo.textContent = isEn ? `Run ${Math.max(1, Math.round(iterations * 0.25))} / ${iterations}` : `Lần ${Math.max(1, Math.round(iterations * 0.25))} / ${iterations}`;
      }, tStep));

      // Stage 2 (t = 2*tStep): Mid-race progression
      this.raceTimers.push(setTimeout(() => {
        if (spaceBar) spaceBar.style.width = '82%';
        if (hirschBar) hirschBar.style.width = '68%';
        if (gridBar) gridBar.style.width = '52%';
        if (spaceStat) spaceStat.textContent = `82% (${isEn ? 'Buffer Swapping' : 'Ghi đè bộ đệm'})`;
        if (hirschStat) hirschStat.textContent = `68% (${isEn ? 'D&C Conquer' : 'Đệ quy phân rã'})`;
        if (gridStat) gridStat.textContent = `52% (${isEn ? 'Filling Cells' : 'Tính toán ô'})`;
        if (stepInfo) stepInfo.textContent = isEn ? `Run ${Math.max(1, Math.round(iterations * 0.5))} / ${iterations}` : `Lần ${Math.max(1, Math.round(iterations * 0.5))} / ${iterations}`;
      }, tStep * 2));

      // Stage 3 (t = 3*tStep): Approaching finish line
      this.raceTimers.push(setTimeout(() => {
        if (spaceBar) spaceBar.style.width = '100%';
        if (hirschBar) hirschBar.style.width = '95%';
        if (gridBar) gridBar.style.width = '80%';
        if (spaceStat) spaceStat.textContent = isEn ? '100% (Fastest RAM)' : '100% (Tối ưu RAM)';
        if (hirschStat) hirschStat.textContent = isEn ? '95% (Linear D&C)' : '95% (Chia để trị)';
        if (gridStat) gridStat.textContent = isEn ? '80% (Full Table)' : '80% (Toàn bảng)';
        if (phaseInfo) phaseInfo.textContent = isEn ? 'ANALYZING...' : 'ĐANG PHÂN TÍCH...';
        if (stepInfo) stepInfo.textContent = isEn ? `Run ${iterations} / ${iterations}` : `Lần ${iterations} / ${iterations}`;
      }, tStep * 3));

      // Stage 4 (t = 4*tStep): Complete race and render final results
      this.raceTimers.push(setTimeout(() => {
        this._executeAndRender(this.lastSeqX, this.lastSeqY, {
          testcase: this.lastTestcase,
          iterations,
          lang
        });
      }, tStep * 4));
      return;
    }

    // Initial render when container is empty
    this.container.innerHTML = `
      <div style="padding: 32px; text-align: center; color: var(--text-muted); font-size: 0.85rem; display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <div style="width: 20px; height: 20px; border: 2px solid var(--accent-primary, #5e6ad2); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <div>${isEn ? `Benchmarking 3-algorithm performance (${iterations} iterations)...` : `Đang đo lường đối đầu 3 giải thuật (${iterations} lần lặp)...`}</div>
      </div>
    `;

    setTimeout(() => {
      this._executeAndRender(this.lastSeqX, this.lastSeqY, {
        testcase: this.lastTestcase,
        iterations,
        lang
      });
    }, 25);
  }

  _executeAndRender(seqX, seqY, options = {}) {
    this._clearRaceTimers();
    this.lastSeqX = seqX || '';
    this.lastSeqY = seqY || '';
    if (options.testcase) {
      this.lastTestcase = options.testcase;
    }
    if (options.iterations) {
      this.currentIterations = options.iterations;
    }
    const data = this.engine.measure(seqX, seqY, options);
    data.lang = options.lang || this.lang || 'vi';
    this.renderer.render(this.container, data);
    this._bindControls();

    // Trigger pop-in animation on algorithm cards
    const cards = this.container.querySelectorAll('.algo-card');
    cards.forEach((card, idx) => {
      card.style.animationDelay = `${idx * 40}ms`;
      card.classList.add('card-pop-in');
    });

    // Complete race bars
    const spaceBar = this.container.querySelector('#race-space-bar');
    const gridBar = this.container.querySelector('#race-grid-bar');
    const hirschBar = this.container.querySelector('#race-hirsch-bar');
    if (spaceBar) spaceBar.style.width = '100%';
    if (gridBar) gridBar.style.width = '100%';
    if (hirschBar) hirschBar.style.width = '100%';
    const isEn = data.lang === 'en';
    const phaseInfo = this.container.querySelector('#race-phase-info');
    if (phaseInfo) {
      phaseInfo.textContent = isEn ? 'DONE' : 'HOÀN THÀNH';
    }
    const stepInfo = this.container.querySelector('#race-step-info');
    if (stepInfo) stepInfo.textContent = `${isEn ? 'Step' : 'Bước'}: ${data.iterations} / ${data.iterations}`;
    const gridStat = this.container.querySelector('#race-grid-stat');
    const spaceStat = this.container.querySelector('#race-space-stat');
    const hirschStat = this.container.querySelector('#race-hirsch-stat');
    if (gridStat) gridStat.textContent = isEn ? 'Done (O(M×N))' : 'Hoàn tất (O(M×N))';
    if (spaceStat) spaceStat.textContent = isEn ? 'Done (RAM Optimized)' : 'Hoàn tất (Tiết kiệm RAM)';
    if (hirschStat) hirschStat.textContent = isEn ? 'Done (Linear Space)' : 'Hoàn tất (LCS Tuyến tính)';
  }

  _bindControls() {
    if (!this.container) return;
    const btnRe = this.container.querySelector('#btn-re-benchmark');
    const selectIter = this.container.querySelector('#benchmark-iter-select');

    if (btnRe) {
      btnRe.addEventListener('click', () => {
        const iters = selectIter ? parseInt(selectIter.value, 10) : this.currentIterations;
        this.currentIterations = iters;
        this.runBenchmark(this.lastSeqX, this.lastSeqY, {
          testcase: this.lastTestcase,
          iterations: iters
        });
      });
    }

    if (selectIter) {
      selectIter.addEventListener('change', (e) => {
        this.currentIterations = parseInt(e.target.value, 10);
      });
    }
  }

  /**
   * Updates live step race simulator according to timeline progress.
   * @param {object} snapshot - Timeline snapshot
   * @param {number} totalSteps - Total number of algorithm steps
   */
  applySnapshot(snapshot, totalSteps = 0) {
    if (!this.container || !snapshot) return;
    const racePanel = this.container.querySelector('#benchmark-live-race-panel');
    if (!racePanel) return;

    const isEn = this.lang === 'en';
    const stepIdx = snapshot.stepIndex || 0;
    const tot = Math.max(totalSteps, 1);
    const pct = Math.min(100, Math.round(((stepIdx + 1) / tot) * 100));

    const stepInfo = racePanel.querySelector('#race-step-info');
    const phaseInfo = racePanel.querySelector('#race-phase-info');
    if (stepInfo) stepInfo.textContent = `${isEn ? 'Step' : 'Bước'}: ${stepIdx + 1} / ${totalSteps}`;
    if (phaseInfo) phaseInfo.textContent = (snapshot.phase || 'running').toUpperCase();

    const barGrid = racePanel.querySelector('#race-grid-bar');
    const statGrid = racePanel.querySelector('#race-grid-stat');
    const barSpace = racePanel.querySelector('#race-space-bar');
    const statSpace = racePanel.querySelector('#race-space-stat');
    const barHirsch = racePanel.querySelector('#race-hirsch-bar');
    const statHirsch = racePanel.querySelector('#race-hirsch-stat');

    if (barGrid) barGrid.style.width = `${pct}%`;
    if (statGrid) statGrid.textContent = `${pct}% (${isEn ? 'Full Matrix O(M×N)' : 'Bảng O(M×N)'})`;

    const spacePct = Math.min(100, Math.round(pct * 1.1));
    if (barSpace) barSpace.style.width = `${spacePct}%`;
    if (statSpace) statSpace.textContent = `${spacePct}% (${isEn ? '2-Row Buffer' : '2 Dòng Buffer'})`;
 
    const hirschPct = Math.min(100, Math.round(pct * 0.95));
    if (barHirsch) barHirsch.style.width = `${hirschPct}%`;
    if (statHirsch) statHirsch.textContent = `${hirschPct}% (${isEn ? 'Linear D&C O(N)' : 'Chia để trị O(N)'})`;

    if (snapshot.phase === 'finished') {
      if (barGrid) barGrid.style.width = '100%';
      if (barSpace) barSpace.style.width = '100%';
      if (barHirsch) barHirsch.style.width = '100%';
      if (statGrid) statGrid.textContent = isEn ? 'Done (O(M×N))' : 'Hoàn tất (O(M×N))';
      if (statSpace) statSpace.textContent = isEn ? 'Done (RAM Optimized)' : 'Hoàn tất (Tiết kiệm RAM)';
      if (statHirsch) statHirsch.textContent = isEn ? 'Done (Linear Space)' : 'Hoàn tất (LCS Tuyến tính)';
    }
  }
}
