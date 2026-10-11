/**
 * 3D Viewport Toolbar and HUD Elements for DNA Visualizer
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * Student: Dang Chi Thanh (MSSV: 25730067)
 */

export function createViewportUI(container, handlers = {}) {
  let currentLang = 'vi';
  let lastInfo = null;
  let currentModeName = '3D WebGL Molecular (Three.js)';

  const hud = document.createElement('div');
  hud.className = 'dna-overlay-hud';
  hud.innerHTML = `
    <div class="dna-hud-header"><span>Bio-Helix:</span> Aligned DNA | <span id="dna-mode-tag">${currentModeName}</span></div>
    <div id="dna-live-status" class="dna-hud-live-body" style="display: none; margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.08);"></div>
  `;
  container.appendChild(hud);

  const tooltip = document.createElement('div');
  tooltip.className = 'dna-hover-tooltip';
  tooltip.style.display = 'none';
  container.appendChild(tooltip);

  const toolbar = document.createElement('div');
  toolbar.className = 'dna-viewport-toolbar';
  toolbar.innerHTML = `
    <button class="dna-tb-btn active" id="dna-btn-rot" title="Bật/Tắt Xoay Tự Động">🔄 Xoay</button>
    <button class="dna-tb-btn" id="dna-btn-zin" title="Phóng to">+</button>
    <button class="dna-tb-btn" id="dna-btn-zout" title="Thu nhỏ">-</button>
    <button class="dna-tb-btn" id="dna-btn-rst" title="Đặt lại góc nhìn">⟲ Góc nhìn</button>
    <button class="dna-tb-btn" id="dna-btn-lcs" title="Chỉ sáng các cặp LCS Match">✨ Khớp LCS</button>
    <button class="dna-tb-btn active" id="dna-btn-lbl" title="Bật/Tắt Nhãn Base 3D">🏷️ Nhãn</button>
  `;
  container.appendChild(toolbar);

  toolbar.querySelector('#dna-btn-rot')?.addEventListener('click', (e) => {
    const active = handlers.onToggleRotate?.();
    e.currentTarget.classList.toggle('active', active);
  });
  toolbar.querySelector('#dna-btn-zin')?.addEventListener('click', () => handlers.onZoomIn?.());
  toolbar.querySelector('#dna-btn-zout')?.addEventListener('click', () => handlers.onZoomOut?.());
  toolbar.querySelector('#dna-btn-rst')?.addEventListener('click', () => handlers.onResetView?.());

  toolbar.querySelector('#dna-btn-lcs')?.addEventListener('click', (e) => {
    const active = handlers.onToggleLcs?.();
    e.currentTarget.classList.toggle('active', active);
  });
  toolbar.querySelector('#dna-btn-lbl')?.addEventListener('click', (e) => {
    const active = handlers.onToggleLabels?.();
    e.currentTarget.classList.toggle('active', active);
  });

  const liveStatusDiv = hud.querySelector('#dna-live-status');
  const modeTag = hud.querySelector('#dna-mode-tag');

  const updateStatus = (info) => {
    lastInfo = info;
    if (!liveStatusDiv) return;
    if (!info) {
      liveStatusDiv.style.display = 'none';
      return;
    }
    liveStatusDiv.style.display = 'block';
    const isEn = currentLang === 'en';

    if (info.phase === 'finished' || info.phase === 'complete') {
      const tagText = isEn ? 'LCS ANALYSIS COMPLETED' : 'HOÀN TẤT PHÂN TÍCH LCS';
      liveStatusDiv.innerHTML = `
        <div class="dna-hud-live-tag finished">
          <span class="hud-pulse-dot dot-finished"></span> ${tagText}
        </div>
        <div class="dna-hud-live-info">
          LCS: <b style="color: #10b981;">"${info.lcsAccumulated || ''}"</b> (${info.lcsLength || 0} bp)
        </div>
      `;
      return;
    }

    const idx = (info.pairIndex ?? 0) + 1;
    const total = info.totalPairs ?? 36;
    let matchTag = '';
    if (info.isMatch) {
      matchTag = `<span class="hud-match">✔ ${isEn ? 'LCS MATCH' : 'TRÙNG KHỚP LCS'}</span>`;
    } else if (info.isIndel) {
      matchTag = `<span class="hud-indel">✕ ${isEn ? 'INDEL MUTATION' : 'ĐỘT BIẾN INDEL'}</span>`;
    } else {
      matchTag = `<span class="hud-diff">⚠ ${isEn ? 'SNP MUTATION' : 'ĐỘT BIẾN SNP'}</span>`;
    }

    const scanTag = isEn ? `SCANNING PAIR #${idx}/${total}` : `ĐANG QUÉT CẶP #${idx}/${total}`;
    liveStatusDiv.innerHTML = `
      <div class="dna-hud-live-tag active">
        <span class="hud-pulse-dot dot-active"></span> ${scanTag}
      </div>
      <div class="dna-hud-live-info">
        Base: <b>${info.char1 || '-'}</b> ⟷ <b>${info.char2 || '-'}</b> • ${matchTag}
      </div>
    `;
  };

  const setLanguage = (lang) => {
    currentLang = lang || 'vi';
    const isEn = currentLang === 'en';

    // Toolbar buttons
    const btnRot = toolbar.querySelector('#dna-btn-rot');
    const btnZin = toolbar.querySelector('#dna-btn-zin');
    const btnZout = toolbar.querySelector('#dna-btn-zout');
    const btnRst = toolbar.querySelector('#dna-btn-rst');
    const btnLcs = toolbar.querySelector('#dna-btn-lcs');
    const btnLbl = toolbar.querySelector('#dna-btn-lbl');

    if (btnRot) {
      btnRot.textContent = isEn ? '🔄 Rotate' : '🔄 Xoay';
      btnRot.title = isEn ? 'Toggle Auto-Rotation' : 'Bật/Tắt Xoay Tự Động';
    }
    if (btnZin) {
      btnZin.title = isEn ? 'Zoom In' : 'Phóng to';
    }
    if (btnZout) {
      btnZout.title = isEn ? 'Zoom Out' : 'Thu nhỏ';
    }
    if (btnRst) {
      btnRst.textContent = isEn ? '⟲ Reset View' : '⟲ Góc nhìn';
      btnRst.title = isEn ? 'Reset Camera View' : 'Đặt lại góc nhìn';
    }
    if (btnLcs) {
      btnLcs.textContent = isEn ? '✨ LCS Match' : '✨ Khớp LCS';
      btnLcs.title = isEn ? 'Highlight LCS Matches Only' : 'Chỉ sáng các cặp LCS Match';
    }
    if (btnLbl) {
      btnLbl.textContent = isEn ? '🏷️ Labels' : '🏷️ Nhãn';
      btnLbl.title = isEn ? 'Toggle Base Labels' : 'Bật/Tắt Nhãn Base 3D';
    }

    // Refresh live status if currently displaying
    if (lastInfo) {
      updateStatus(lastInfo);
    }
  };

  const setMode = (modeName) => {
    currentModeName = modeName;
    if (modeTag) modeTag.textContent = modeName;
  };

  return { hud, modeTag, tooltip, toolbar, updateStatus, setLanguage, setMode };
}
