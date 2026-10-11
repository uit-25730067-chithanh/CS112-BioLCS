/**
 * Adaptive Layout Manager Module
 * Coordinates dynamic view switching based on sequence characteristics
 * (Genomic 3D vs General Text) and selected algorithm (2D Grid, 2-Row, Hirschberg).
 */

import { t } from './i18n.js';

export class AdaptiveLayoutManager {
  constructor(domElements) {
    this.dom = domElements;
    this.lang = 'vi';
    this.lastClassification = null;
    this.lastAlgoKey = 'grid';
  }

  setLanguage(lang) {
    this.lang = lang || 'vi';
    if (this.lastClassification) {
      this.adaptGenomicContext(this.lastClassification);
    }
    if (this.lastAlgoKey) {
      this.adaptAlgorithmView(this.lastAlgoKey);
    }
  }

  /**
   * Adapts the UI based on whether input sequences are biological or general text.
   * @param {object} classification
   */
  adaptGenomicContext(classification) {
    this.lastClassification = classification;
    const { isGenomic, badge, label, reason } = classification;
    const isEn = this.lang === 'en';

    // 1. Tab Genomic Label & Badge
    if (this.dom.tabGenomicLabel) {
      if (isEn) {
        this.dom.tabGenomicLabel.textContent = isGenomic ? 'Genomic Lab & 3D Helix' : 'Alignment & Diff';
      } else {
        this.dom.tabGenomicLabel.textContent = isGenomic ? 'Phòng Genomics & Xoắn Kép 3D' : 'So Khớp Chuỗi & Diff';
      }
    }

    if (this.dom.tabGenomicBadge) {
      this.dom.tabGenomicBadge.textContent = badge || (isGenomic ? '3D WebGL' : 'Text Diff');
      this.dom.tabGenomicBadge.className = isGenomic ? 'tab-badge-live' : 'tab-badge-live badge-text-mode';
    }

    // 2. Input sequence labels
    if (this.dom.labelSeqX) {
      this.dom.labelSeqX.textContent = t(isGenomic ? 'seqXGenomic' : 'seqXText', this.lang);
    }
    if (this.dom.labelSeqY) {
      this.dom.labelSeqY.textContent = t(isGenomic ? 'seqYGenomic' : 'seqYText', this.lang);
    }

    // 3. Nucleotide Legend (Hide for general text)
    if (this.dom.baseLegend) {
      this.dom.baseLegend.style.display = isGenomic ? 'flex' : 'none';
    }

    // 4. Quick 3D button (Hide if non-genomic)
    if (this.dom.btnQuick3D) {
      this.dom.btnQuick3D.style.display = isGenomic ? 'inline-block' : 'none';
    }

    // 5. Non-genomic notice banner & 3D canvas panel
    if (this.dom.nonGenomicNotice) {
      this.dom.nonGenomicNotice.style.display = isGenomic ? 'none' : 'flex';
      const h3 = this.dom.nonGenomicNotice.querySelector('h3');
      if (h3) {
        h3.textContent = isEn
          ? 'General String Matching Mode'
          : 'Chế Độ Đối Sánh Chuỗi Ký Tự Tổng Quát (General String Matching)';
      }
    }

    if (this.dom.nonGenomicReasonText) {
      this.dom.nonGenomicReasonText.textContent = isEn
        ? (classification.reasonEn || reason)
        : (reason || classification.reason);
    }

    if (this.dom.panel3DHelix) {
      this.dom.panel3DHelix.style.display = isGenomic ? 'block' : 'none';
    }
  }

  /**
   * Adapts the primary visualizer panel based on active algorithm.
   * @param {string} algoKey - 'grid' | 'space_opt' | 'hirschberg'
   */
  adaptAlgorithmView(algoKey) {
    this.lastAlgoKey = algoKey;
    const isSpaceOpt = algoKey === 'space_opt';
    const isHirschberg = algoKey === 'hirschberg';
    const isEn = this.lang === 'en';

    if (this.dom.tabMatrixLabel) {
      if (isSpaceOpt) {
        this.dom.tabMatrixLabel.textContent = isEn ? '2-Row Buffer (Ping-Pong)' : 'Bộ Đệm 2 Dòng (Ping-Pong)';
      } else if (isHirschberg) {
        this.dom.tabMatrixLabel.textContent = isEn ? 'Hirschberg D&C Tree' : 'Cây Chia Để Trị (Hirschberg)';
      } else {
        this.dom.tabMatrixLabel.textContent = isEn ? '2D DP Matrix Studio' : 'Ma Trận DP 2D';
      }
    }

    if (this.dom.matrixViewport) {
      this.dom.matrixViewport.style.display = isSpaceOpt ? 'none' : 'block';
    }

    if (this.dom.alternateViewport) {
      this.dom.alternateViewport.style.display = isSpaceOpt ? 'block' : 'none';
    }

    if (this.dom.matrixLegendHints) {
      this.dom.matrixLegendHints.style.display = isSpaceOpt ? 'none' : 'flex';
    }

    if (this.dom.titleVisualizerText) {
      if (isSpaceOpt) {
        this.dom.titleVisualizerText.textContent = isEn
          ? '2-Row Dynamic Programming Cyclic Buffer (2 × n)'
          : 'Không Gian Bộ Đệm Quy Hoạch Động 2 Dòng (2 × n)';
      } else if (isHirschberg) {
        this.dom.titleVisualizerText.textContent = isEn
          ? 'Hirschberg Algorithm (Linear Space D&C O(N))'
          : 'Thuật Toán Hirschberg (Chia Để Trị Tuyến Tính O(N))';
      } else {
        this.dom.titleVisualizerText.textContent = isEn
          ? '2D Dynamic Programming Matrix Space (m+1) × (n+1)'
          : 'Không Gian Ma Trận Quy Hoạch Động (m+1) × (n+1)';
      }
    }
  }

  /**
   * Adapts tab enabled/disabled states.
   * - Tab 2 (Genomic Lab) is disabled for non-genomic general text (cannot render 3D helix).
   * - Tab 1 (Matrix) and Tab 3 (Benchmark) are ALWAYS accessible for complete user control.
   * @param {object} params { classification, seqX, seqY }
   * @returns {string|null} fallback tab if current view becomes invalid
   */
  adaptTabs({ classification, seqX = '', seqY = '' }) {
    // 1. Tab Genomic Lab & Alignment (ALWAYS ENABLED: adapts dynamically to Genomic 3D or General Text Diff)
    if (this.dom.tabBtnGenomic) {
      this.dom.tabBtnGenomic.disabled = false;
      this.dom.tabBtnGenomic.classList.remove('tab-btn-disabled');
      this.dom.tabBtnGenomic.removeAttribute('title');
    }

    // 2. Tab DP Matrix 2D (ALWAYS ENABLED - Never disable core algorithm tab!)
    if (this.dom.tabBtnMatrix) {
      this.dom.tabBtnMatrix.disabled = false;
      this.dom.tabBtnMatrix.classList.remove('tab-btn-disabled');
      this.dom.tabBtnMatrix.removeAttribute('title');
    }

    // 3. Tab Benchmark (ALWAYS ENABLED)
    if (this.dom.tabBtnBenchmark) {
      this.dom.tabBtnBenchmark.disabled = false;
      this.dom.tabBtnBenchmark.classList.remove('tab-btn-disabled');
    }

    return null;
  }
}
