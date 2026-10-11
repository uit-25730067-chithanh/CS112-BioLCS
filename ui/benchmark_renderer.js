/**
 * Benchmark Renderer Module
 * Renders the interactive head-to-head performance arena, comparison table,
 * and testcase-tailored academic analysis.
 */

import { getTestcaseDescription } from './i18n.js';

export class BenchmarkRenderer {
  constructor() {
    this.lang = 'vi';
  }

  setLanguage(lang) {
    this.lang = lang || 'vi';
  }

  render(container, data) {
    if (!container) return;
    const lang = data.lang || this.lang || 'vi';
    const isEn = lang === 'en';
    const maxTime = Math.max(data.tGrid, data.tSpace, data.tHirsch, 0.001);
    const tcId = data.testcase ? data.testcase.test_id : (isEn ? 'Custom' : 'Tự Do');
    const tcDesc = data.testcase
      ? getTestcaseDescription(data.testcase, lang)
      : (isEn ? 'Custom user-entered sequences' : 'Chuỗi tùy biến do người dùng nhập');
    const minLen = Math.min(data.m, data.n);

    const lcsGrid = data.resGrid?.lcs ? (data.resGrid.lcs.length > 20 ? `"${data.resGrid.lcs.slice(0, 16)}..." (${data.resGrid.length} bp)` : `"${data.resGrid.lcs}" (${data.resGrid.length} bp)`) : `${data.resGrid?.length ?? 0} bp`;
    const lcsSpace = data.resSpace ? (isEn ? `Length only (${data.resSpace.length} bp)` : `Chỉ độ dài (${data.resSpace.length} bp)`) : '0 bp';
    const lcsHirsch = data.resHirsch?.lcs ? (data.resHirsch.lcs.length > 20 ? `"${data.resHirsch.lcs.slice(0, 16)}..." (${data.resHirsch.length} bp)` : `"${data.resHirsch.lcs}" (${data.resHirsch.length} bp)`) : `${data.resHirsch?.length ?? 0} bp`;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <!-- 1. Interactive Control Toolbar -->
        <div class="benchmark-toolbar">
          <div class="benchmark-context-chip">
            <span class="chip-badge">${tcId}</span>
            <span class="chip-desc" title="${tcDesc}"><strong>${tcDesc}</strong></span>
            <span class="chip-separator" style="color: var(--border-hairline);">|</span>
            <span class="chip-stats">|X| = <strong>${data.m} bp</strong>, |Y| = <strong>${data.n} bp</strong> (${data.totalCells.toLocaleString()} ${isEn ? 'cells' : 'ô tính'})</span>
          </div>

          <div class="benchmark-actions">
            <div class="iter-select-group">
              <label for="benchmark-iter-select">${isEn ? 'Iterations:' : 'Lặp lại đo:'}</label>
              <select id="benchmark-iter-select" class="form-select-sm">
                <option value="1" ${data.iterations === 1 ? 'selected' : ''}>${isEn ? '1 run (Instant)' : '1 lần (Tức thì)'}</option>
                <option value="20" ${data.iterations === 20 ? 'selected' : ''}>${isEn ? '20 runs (Average)' : '20 lần (Trung bình)'}</option>
                <option value="50" ${data.iterations === 50 ? 'selected' : ''}>${isEn ? '50 runs (UIT Standard)' : '50 lần (Chuẩn UIT)'}</option>
                <option value="200" ${data.iterations === 200 ? 'selected' : ''}>${isEn ? '200 runs (Deep Profiling)' : '200 lần (Đo sâu)'}</option>
              </select>
            </div>
            <button id="btn-re-benchmark" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              <span>${isEn ? 'Run 3-Algorithm Faceoff' : 'Chạy Đối Đầu 3 Thuật Toán'}</span>
            </button>
          </div>
        </div>

        <!-- 2. Live Step Race Simulator Panel -->
        <div class="benchmark-live-race-panel" id="benchmark-live-race-panel">
          <div class="race-header">
            <div class="race-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              <span>${isEn ? 'STEP-BY-STEP PROGRESS RACE SIMULATOR' : 'MÔ PHỎNG ĐỐI ĐẦU TIẾN TRÌNH THEO BƯỚC (STEP-BY-STEP RACE SIMULATOR)'}</span>
            </div>
            <div class="race-status-badges">
              <span class="race-step-badge" id="race-step-info">${isEn ? 'Step: 0 / 0' : 'Bước: 0 / 0'}</span>
              <span class="race-phase-badge" id="race-phase-info">READY</span>
            </div>
          </div>

          <div class="race-lanes">
            <!-- Lane 1: Grid DP -->
            <div class="race-lane">
              <div class="lane-label">
                <span class="lane-name">1. Grid DP 2D</span>
                <span class="lane-stat" id="race-grid-stat">0% (${isEn ? 'Matrix RAM O(M×N)' : 'RAM Bảng O(M×N)'})</span>
              </div>
              <div class="lane-track">
                <div class="lane-bar lane-bar-cyan" id="race-grid-bar" style="width: 0%;"></div>
              </div>
            </div>

            <!-- Lane 2: Space-Opt 2-Row -->
            <div class="race-lane">
              <div class="lane-label">
                <span class="lane-name">2. Space-Optimized DP</span>
                <span class="lane-stat" id="race-space-stat">0% (${isEn ? '2-Row Cyclic Buffer RAM' : 'RAM Bộ đệm 2 Dòng'})</span>
              </div>
              <div class="lane-track">
                <div class="lane-bar lane-bar-amber" id="race-space-bar" style="width: 0%;"></div>
              </div>
            </div>

            <!-- Lane 3: Hirschberg -->
            <div class="race-lane">
              <div class="lane-label">
                <span class="lane-name">3. Hirschberg D&C</span>
                <span class="lane-stat" id="race-hirsch-stat">0% (${isEn ? 'Linear D&C RAM O(N)' : 'Chia để trị RAM O(N)'})</span>
              </div>
              <div class="lane-track">
                <div class="lane-bar lane-bar-green" id="race-hirsch-bar" style="width: 0%;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Overview Banner -->
        <div class="benchmark-overview-banner">
          <div class="benchmark-overview-title">
            ${isEn ? `Empirical Performance Benchmark (${data.iterations} iterations)` : `Kết Quả Đo Hiệu Năng Thực Tế (${data.iterations} lần lặp)`}
          </div>
          <div class="benchmark-savings-tag">
            ${isEn ? `RAM Savings with Hirschberg: ${data.memSavingsPct}%` : `Tiết kiệm RAM với Hirschberg: ${data.memSavingsPct}%`}
          </div>
        </div>

        <!-- 3. Cards Grid -->
        <div class="benchmark-grid">
          ${this._renderCard({
            name: isEn ? '1. 2D DP Grid' : '1. Grid DP 2D',
            meta: isEn ? 'Matrix dynamic programming' : 'Quy hoạch động ma trận',
            pill: data.winner === 'grid' ? data.winnerBadge : 'CLRS §15.4',
            isWinner: data.winner === 'grid',
            time: data.tGrid,
            error: data.gridError,
            maxTime,
            color: 'cyan',
            isEn,
            specs: [
              `<strong>${isEn ? 'Actual RAM:' : 'RAM thực tế:'}</strong> (${data.m}+1)×(${data.n}+1)×4B = ${data.memGridKB.toFixed(2)} KB`,
              `<strong>${isEn ? 'Recovered LCS:' : 'LCS khôi phục:'}</strong> ${lcsGrid}`,
              `<strong>${isEn ? 'Complexity:' : 'Độ phức tạp:'}</strong> O(m × n) time & space`
            ]
          })}

          ${this._renderCard({
            name: isEn ? '2. Space-Optimized DP' : '2. Space-Optimized DP',
            meta: isEn ? '2-Row cyclic buffer' : 'Quy hoạch động 2 dòng',
            pill: data.winner === 'space' ? data.winnerBadge : (isEn ? 'RAM Optimized' : 'Tối ưu RAM'),
            isWinner: data.winner === 'space',
            time: data.tSpace,
            error: data.spaceError,
            maxTime,
            color: 'amber',
            isEn,
            specs: [
              `<strong>${isEn ? 'Actual RAM:' : 'RAM thực tế:'}</strong> 2×(${minLen}+1)×4B = ${data.memSpaceKB.toFixed(2)} KB`,
              `<strong>${isEn ? 'Recovered LCS:' : 'LCS khôi phục:'}</strong> ${lcsSpace}`,
              `<strong>${isEn ? 'Complexity:' : 'Độ phức tạp:'}</strong> O(m × n) time, O(min(m,n)) space`
            ]
          })}

          ${this._renderCard({
            name: isEn ? '3. Hirschberg D&C' : '3. Hirschberg D&C',
            meta: isEn ? 'Linear divide-and-conquer' : 'Chia để trị tuyến tính',
            pill: data.winner === 'hirsch' ? data.winnerBadge : 'CACM 1975 D&C',
            isWinner: data.winner === 'hirsch',
            time: data.tHirsch,
            error: data.hirschError,
            maxTime,
            color: 'green',
            isEn,
            specs: [
              `<strong>${isEn ? 'Actual RAM:' : 'RAM thực tế:'}</strong> 2×(${minLen}+1)×4B + (${data.m}+${data.n})B = ${data.memHirschKB.toFixed(2)} KB`,
              `<strong>${isEn ? 'Recovered LCS:' : 'LCS khôi phục:'}</strong> ${lcsHirsch}`,
              `<strong>${isEn ? 'Complexity:' : 'Độ phức tạp:'}</strong> O(m × n) time, O(min(m,n)) space`
            ]
          })}
        </div>

        <!-- 4. Comparison Table -->
        <div class="benchmark-table-wrapper">
          <table class="benchmark-comparison-table">
            <thead>
              <tr>
                <th>${isEn ? 'Comparison Metric' : 'Tiêu Chí So Sánh'}</th>
                <th>${isEn ? '1. 2D DP Grid' : '1. Grid DP 2D'}</th>
                <th>2. Space-Optimized DP</th>
                <th>3. Hirschberg D&C</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${isEn ? 'Actual Execution Runtime' : 'Thời Gian Chạy Thực Tế'}</td>
                <td class="${data.winner === 'grid' ? 'col-winner' : ''}">${data.gridError ? 'N/A' : `${data.tGrid.toFixed(4)} ms`}</td>
                <td class="${data.winner === 'space' ? 'col-winner' : ''}">${data.spaceError ? 'N/A' : `${data.tSpace.toFixed(4)} ms`}</td>
                <td class="${data.winner === 'hirsch' ? 'col-winner' : ''}">${data.hirschError ? 'N/A' : `${data.tHirsch.toFixed(4)} ms`}</td>
              </tr>
              <tr>
                <td>${isEn ? 'Estimated RAM Consumption' : 'Ước Tính RAM Tiêu Thụ'}</td>
                <td>${data.memGridKB.toFixed(2)} KB (${data.memGridBytes.toLocaleString()} B)</td>
                <td class="${data.winner === 'space' ? 'col-winner' : ''}">${data.memSpaceKB.toFixed(2)} KB (${data.memSpaceBytes.toLocaleString()} B)</td>
                <td class="${data.winner === 'hirsch' ? 'col-winner' : ''}">${data.memHirschKB.toFixed(2)} KB (${data.memHirschBytes.toLocaleString()} B)</td>
              </tr>
              <tr>
                <td>${isEn ? 'Concrete Memory Formula' : 'Công Thức Bộ Nhớ Cụ Thể'}</td>
                <td>(${data.m}+1) × (${data.n}+1) × 4 bytes</td>
                <td>2 × (${minLen}+1) × 4 bytes</td>
                <td>2 × (${minLen}+1) × 4B + (${data.m}+${data.n})B</td>
              </tr>
              <tr>
                <td>${isEn ? 'Recovered LCS Subsequence' : 'Chuỗi LCS Thu Được'}</td>
                <td>${lcsGrid}</td>
                <td>${lcsSpace}</td>
                <td>${lcsHirsch}</td>
              </tr>
              <tr>
                <td>${isEn ? 'Asymptotic Space Complexity (Big-O)' : 'Bộ Nhớ Tiệm Cận (Big-O)'}</td>
                <td>${isEn ? 'O(m × n) - Quadratic' : 'O(m × n) - Bậc hai'}</td>
                <td>${isEn ? 'O(min(m, n)) - Linear' : 'O(min(m, n)) - Tuyến tính'}</td>
                <td>${isEn ? 'O(min(m, n)) - Linear' : 'O(min(m, n)) - Tuyến tính'}</td>
              </tr>
              <tr>
                <td>${isEn ? 'LCS String Reconstruction' : 'Khôi Phục Chuỗi LCS'}</td>
                <td>${isEn ? 'Backtrack pointer matrix' : 'Ma trận vết Backtrack'}</td>
                <td>${isEn ? 'Length only (No backtrack)' : 'Chỉ tính độ dài (Không lưu vết)'}</td>
                <td>${isEn ? 'Complete reconstruction (D&C)' : 'Tái tạo trọn vẹn (Chia để trị)'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 5. Dynamic Academic Note -->
        <div class="benchmark-academic-note">
          <div class="verdict-header">
            <span class="verdict-icon">🔬</span>
            <h4>${isEn ? 'Academic Analysis for Current Testcase:' : 'Nhận Xét Học Thuật Riêng Biệt Cho Testcase Hiện Tại:'}</h4>
          </div>
          <p>${data.academicAnalysis}</p>
        </div>
      </div>
    `;
  }

  _renderCard({ name, meta, pill, isWinner, time, error, maxTime, color, specs, isEn }) {
    const pct = Math.max(5, Math.min(100, Math.round((time / maxTime) * 100)));
    return `
      <div class="algo-card ${isWinner ? 'winner' : ''}">
        <div class="algo-card-header">
          <div>
            <div class="algo-name">${name}</div>
            <div class="algo-meta">${meta}</div>
          </div>
          <span class="${isWinner ? 'winner-badge' : 'step-type-pill'}">${pill}</span>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-size: 0.72rem; color: var(--text-muted);">${isEn ? 'Execution runtime:' : 'Thời gian thực thi:'}</span>
          <span class="algo-time-value">${error ? 'N/A' : `${time.toFixed(3)} ms`}</span>
        </div>

        <div class="metric-bar-group">
          <div class="metric-label-row">
            <span>${isEn ? 'Relative speed' : 'Tốc độ tương đối'}</span>
            <span>${error ? 'N/A' : `${pct}%`}</span>
          </div>
          <div class="metric-progress">
            <div class="metric-fill ${color}" style="width: ${error ? 0 : pct}%;"></div>
          </div>
        </div>

        <div class="algo-specs-list">
          ${specs.map(s => `<div>${s}</div>`).join('')}
        </div>
      </div>
    `;
  }
}
