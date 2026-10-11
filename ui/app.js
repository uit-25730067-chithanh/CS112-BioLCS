/**
 * Master Application Controller for BioLCS Web Visualizer
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * Student: Dang Chi Thanh (MSSV: 25730067)
 */

import { TESTCASES } from './testcases_data.js';
import { validateSequences } from '../engine/input_validator.js';
import { solveGridDP } from '../engine/grid_dp.js';
import { solveHirschberg } from '../engine/hirschberg.js';
import { solveSpaceOptimizedDP } from '../engine/space_optimized_dp.js';
import { classifySequences } from '../engine/sequence_classifier.js';
import { StepEngine } from '../engine/step_engine.js';
import { GridRenderer } from './grid_renderer.js';
import { DNAVisualizer3D } from './dna_visualizer_3d.js';
import { AlignmentRenderer } from './alignment_renderer.js';
import { AnimationController } from './animation_controller.js';
import { BenchmarkView } from './benchmark_view.js';
import { CodeStepperRenderer } from './code_stepper_renderer.js';
import { TwoRowRenderer } from './two_row_renderer.js';
import { AdaptiveLayoutManager } from './adaptive_layout_manager.js';
import { generateAlignment } from '../engine/alignment.js';
import { t, getTestcaseDescription, getLocalizedValidationError } from './i18n.js';

class BioLCSApp {
  constructor() {
    this.testcases = TESTCASES || [];
    this.currentTestcase = null;
    this.currentLang = 'vi';
    this.stepEngine = null;
    this.animController = null;

    // View Components
    this.gridRenderer = null;
    this.dnaVisualizer = null;
    this.alignmentRenderer = null;
    this.benchmarkView = null;
    this.codeStepper = null;
    this.twoRowRenderer = null;
    this.adaptiveLayout = null;

    // State
    this.activeTab = 'matrix';
    this.lastLcsResult = null;
  }

  init() {
    this._cacheDOM();
    this._syncStickyTabOffset();
    this._initTheme();
    this._initLanguage();
    this._initViews();
    this._populateTestcases();
    this._bindEvents();

    // Restore previous state if available, or load default testcase (TC_01_01)
    let restored = false;
    try {
      const savedTc = sessionStorage.getItem('biolcs_selected_testcase');
      const savedCustom = sessionStorage.getItem('biolcs_custom_input');
      if (savedTc && this.testcases.some((t) => t.test_id === savedTc)) {
        this.loadTestcase(savedTc);
        restored = true;
      } else if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        if (parsed && typeof parsed.x === 'string' && typeof parsed.y === 'string') {
          this.dom.inputX.value = parsed.x;
          this.dom.inputY.value = parsed.y;
          this.currentTestcase = null;
          if (this.dom.bioDescText) {
            this.dom.bioDescText.textContent = this.currentLang === 'en'
              ? 'Custom user-entered input data'
              : 'Dữ liệu tùy biến do người dùng nhập trực tiếp';
          }
          if (this.dom.bioTag) this.dom.bioTag.textContent = 'CUSTOM';
          if (this.dom.counterX) this.dom.counterX.textContent = `${parsed.x.length} bp`;
          if (this.dom.counterY) this.dom.counterY.textContent = `${parsed.y.length} bp`;
          this.runAnalysis({ autoPlay: false });
          restored = true;
        }
      }
    } catch (e) {}

    if (!restored && this.testcases.length > 0) {
      this.loadTestcase(this.testcases[0].test_id);
    }

    try {
      const savedAlgo = sessionStorage.getItem('biolcs_selected_algo');
      if (savedAlgo && this.dom.algoSelect) {
        this.dom.algoSelect.value = savedAlgo;
      }
      const savedTab = sessionStorage.getItem('biolcs_active_tab');
      if (savedTab && savedTab !== 'matrix') {
        this.switchTab(savedTab);
      }
    } catch (e) {}
  }

  _cacheDOM() {
    this.dom = {
      appHeader: document.querySelector('.app-header'),
      themeToggle: document.getElementById('theme-toggle'),
      langToggle: document.getElementById('lang-toggle'),
      langToggleText: document.getElementById('lang-toggle-text'),
      langBtnVi: document.getElementById('lang-btn-vi'),
      langBtnEn: document.getElementById('lang-btn-en'),
      brandReload: document.getElementById('brand-reload'),
      brandSubtitle: document.getElementById('brand-subtitle'),
      // Student & Academic Metadata
      studentBadge: document.getElementById('student-badge'),
      badgeStudentName: document.getElementById('badge-student-name'),
      badgeStudentId: document.getElementById('badge-student-id'),
      badgeStudentClass: document.getElementById('badge-student-class'),
      badgeStudentAdvisor: document.getElementById('badge-student-advisor'),
      badgeStudentUni: document.getElementById('badge-student-uni'),
      modalAcademic: document.getElementById('modal-academic-info'),
      btnCloseAcademicModal: document.getElementById('btn-close-academic-modal'),
      btnCloseAcademicAction: document.getElementById('btn-close-academic-action'),
      modalAcademicTitle: document.getElementById('modal-academic-title'),
      modalAcademicSub: document.getElementById('modal-academic-sub'),
      modalLblAuthor: document.getElementById('modal-lbl-author'),
      modalValAuthor: document.getElementById('modal-val-author'),
      modalLblId: document.getElementById('modal-lbl-id'),
      modalValId: document.getElementById('modal-val-id'),
      modalLblClass: document.getElementById('modal-lbl-class'),
      modalValClass: document.getElementById('modal-val-class'),
      modalLblCourse: document.getElementById('modal-lbl-course'),
      modalValCourse: document.getElementById('modal-val-course'),
      modalLblAdvisor: document.getElementById('modal-lbl-advisor'),
      modalValAdvisor: document.getElementById('modal-val-advisor'),
      modalLblTopic: document.getElementById('modal-lbl-topic'),
      modalValTopic: document.getElementById('modal-val-topic'),
      modalLblLinks: document.getElementById('modal-lbl-links'),
      modalAcademicCopyright: document.getElementById('modal-academic-copyright'),
      labelTestcaseSelect: document.getElementById('label-testcase-select'),
      labelAlgoSelect: document.getElementById('label-algo-select'),
      btnRunText: document.getElementById('btn-run-text'),
      labelBaseLegend: document.getElementById('label-base-legend'),
      tabBenchmarkLabel: document.getElementById('tab-benchmark-label'),
      labelSpeedSelect: document.getElementById('label-speed-select'),
      btnPlayText: document.getElementById('btn-play-text'),
      testcaseSelect: document.getElementById('testcase-select'),
      inputX: document.getElementById('input-seq-x'),
      inputY: document.getElementById('input-seq-y'),
      counterX: document.getElementById('counter-x'),
      counterY: document.getElementById('counter-y'),
      algoSelect: document.getElementById('algo-select'),
      btnRun: document.getElementById('btn-run'),
      btnSwap: document.getElementById('btn-swap'),
      bioContextBar: document.getElementById('bio-context-bar'),
      bioDescText: document.getElementById('bio-desc-text'),
      bioTag: document.getElementById('bio-tag'),
      
      // Tabs
      tabBtns: document.querySelectorAll('.tab-btn'),
      tabPanes: document.querySelectorAll('.tab-pane'),

      // Timeline UI
      btnPlay: document.getElementById('btn-play'),
      btnNext: document.getElementById('btn-next'),
      btnPrev: document.getElementById('btn-prev'),
      btnReset: document.getElementById('btn-reset'),
      stepCounter: document.getElementById('step-counter'),
      phaseText: document.getElementById('phase-text'),
      timelineSlider: document.getElementById('timeline-slider'),
      speedSelect: document.getElementById('speed-select'),

      // Containers
      matrixViewport: document.getElementById('matrix-viewport'),
      alternateViewport: document.getElementById('alternate-viewport'),
      matrixLegendHints: document.getElementById('matrix-legend-hints'),
      titleVisualizerText: document.getElementById('title-visualizer-text'),
      codeStepperContainer: document.getElementById('code-stepper-container'),
      formulaBar: document.getElementById('step-formula-bar'),
      dnaCanvasContainer: document.getElementById('dna-canvas-container'),
      alignmentTracks: document.getElementById('alignment-tracks'),
      alignmentStats: document.getElementById('alignment-stats'),
      benchmarkContainer: document.getElementById('benchmark-container'),
      toastContainer: document.getElementById('toast-container'),
      
      // Tab Buttons
      tabBtnMatrix: document.getElementById('tab-btn-matrix'),
      tabBtnGenomic: document.getElementById('tab-btn-genomic'),
      tabBtnBenchmark: document.getElementById('tab-btn-benchmark'),

      // Adaptive Elements
      tabMatrixLabel: document.getElementById('tab-matrix-label'),
      tabGenomicLabel: document.getElementById('tab-genomic-label'),
      tabGenomicBadge: document.getElementById('tab-genomic-badge'),
      labelSeqX: document.getElementById('label-seq-x'),
      labelSeqY: document.getElementById('label-seq-y'),
      baseLegend: document.getElementById('base-legend'),
      btnQuick3D: document.getElementById('btn-quick-3d'),
      nonGenomicNotice: document.getElementById('non-genomic-notice'),
      nonGenomicReasonText: document.getElementById('non-genomic-reason-text'),
      panel3DHelix: document.getElementById('panel-3d-helix'),
      legendMatch: document.querySelector('.legend-chip-match'),
      legendSkip: document.querySelector('.legend-chip-skip'),
      legendActive: document.querySelector('.legend-chip-active'),
      legendCompare: document.querySelector('.legend-chip-compare'),
      alignmentPanelTitle: document.querySelector('#pane-genomic .glass-panel:nth-child(2) .panel-title'),
      benchmarkPanelTitle: document.querySelector('#pane-benchmark .panel-title')
    };
  }

  _syncStickyTabOffset() {
    const header = this.dom.appHeader;
    const ribbon = document.querySelector('.control-ribbon');
    const bioBar = document.getElementById('bio-context-bar');
    if (!header) return;

    const updateOffsets = () => {
      const headerH = Math.ceil(header.getBoundingClientRect().height);
      const ribbonH = ribbon ? Math.ceil(ribbon.getBoundingClientRect().height) : 0;
      const bioH = bioBar ? Math.ceil(bioBar.getBoundingClientRect().height) : 0;

      document.documentElement.style.setProperty('--app-header-height', `${headerH}px`);
      document.documentElement.style.setProperty('--sticky-ribbon-top', `${headerH}px`);
      document.documentElement.style.setProperty('--sticky-bio-top', `${headerH + ribbonH}px`);
      document.documentElement.style.setProperty('--sticky-tabs-top', `${headerH + ribbonH + bioH}px`);
    };

    updateOffsets();
    if ('ResizeObserver' in window) {
      this.headerResizeObserver = new ResizeObserver(updateOffsets);
      this.headerResizeObserver.observe(header);
      if (ribbon) this.headerResizeObserver.observe(ribbon);
      if (bioBar) this.headerResizeObserver.observe(bioBar);
    } else {
      window.addEventListener('resize', updateOffsets);
    }
  }

  _initViews() {
    this.gridRenderer = new GridRenderer(this.dom.matrixViewport, this.dom.formulaBar);
    this.dnaVisualizer = new DNAVisualizer3D(this.dom.dnaCanvasContainer);
    this.alignmentRenderer = new AlignmentRenderer(this.dom.alignmentTracks, this.dom.alignmentStats);
    this.benchmarkView = new BenchmarkView(this.dom.benchmarkContainer);
    this.codeStepper = new CodeStepperRenderer(this.dom.codeStepperContainer);
    this.twoRowRenderer = new TwoRowRenderer(this.dom.alternateViewport);
    this.adaptiveLayout = new AdaptiveLayoutManager({
      tabBtnMatrix: this.dom.tabBtnMatrix,
      tabBtnGenomic: this.dom.tabBtnGenomic,
      tabBtnBenchmark: this.dom.tabBtnBenchmark,
      tabMatrixLabel: this.dom.tabMatrixLabel,
      tabGenomicLabel: this.dom.tabGenomicLabel,
      tabGenomicBadge: this.dom.tabGenomicBadge,
      labelSeqX: this.dom.labelSeqX,
      labelSeqY: this.dom.labelSeqY,
      baseLegend: this.dom.baseLegend,
      btnQuick3D: this.dom.btnQuick3D,
      nonGenomicNotice: this.dom.nonGenomicNotice,
      nonGenomicReasonText: this.dom.nonGenomicReasonText,
      panel3DHelix: this.dom.panel3DHelix,
      matrixViewport: this.dom.matrixViewport,
      alternateViewport: this.dom.alternateViewport,
      matrixLegendHints: this.dom.matrixLegendHints,
      titleVisualizerText: this.dom.titleVisualizerText
    });

    // Initial empty StepEngine & AnimationController
    this.stepEngine = new StepEngine([]);
    this.animController = new AnimationController(
      this.stepEngine,
      {
        btnPlay: this.dom.btnPlay,
        btnRun: this.dom.btnRun,
        btnNext: this.dom.btnNext,
        btnPrev: this.dom.btnPrev,
        btnReset: this.dom.btnReset,
        stepCounter: this.dom.stepCounter,
        phaseText: this.dom.phaseText,
        slider: this.dom.timelineSlider,
        speedSelect: this.dom.speedSelect
      },
      (snapshot) => this._onStepUpdate(snapshot)
    );
  }

  _populateTestcases() {
    if (!this.dom.testcaseSelect) return;
    const currentVal = this.dom.testcaseSelect.value;
    this.dom.testcaseSelect.innerHTML = '';

    const categories = t('categories', this.currentLang) || {
      '01_normal': '01. Mẫu Tiêu Chuẩn (Normal)',
      '02_boundary': '02. Điều Kiện Biên (Boundary)',
      '03_small': '03. Chuỗi Siêu Ngắn (Small)',
      '04_large': '04. Chuỗi Dài Quy Mô Lớn (Large)',
      '05_special': '05. Sinh Học Thực Vật NCBI (Special Plant)',
      '06_invalid': '06. Kiểm Thử Ngoại Lệ & Bắt Lỗi (Negative/Error Handling)'
    };

    const optgroups = {};
    for (const [catKey, catLabel] of Object.entries(categories)) {
      const group = document.createElement('optgroup');
      group.label = catLabel;
      optgroups[catKey] = group;
      this.dom.testcaseSelect.appendChild(group);
    }

    for (const tc of this.testcases) {
      const opt = document.createElement('option');
      opt.value = tc.test_id;
      const desc = getTestcaseDescription(tc, this.currentLang);
      opt.textContent = `[${tc.test_id}] ${desc}`;
      if (optgroups[tc.category]) {
        optgroups[tc.category].appendChild(opt);
      } else {
        this.dom.testcaseSelect.appendChild(opt);
      }
    }

    if (currentVal) {
      this.dom.testcaseSelect.value = currentVal;
    }
  }

  _bindEvents() {
    // Single Language Switcher Toggle (Mirroring theme-toggle)
    if (this.dom.langToggle) {
      this.dom.langToggle.addEventListener('click', () => {
        const nextLang = this.currentLang === 'vi' ? 'en' : 'vi';
        this.setLanguage(nextLang, true);
      });
    }
    if (this.dom.langBtnVi) {
      this.dom.langBtnVi.addEventListener('click', () => {
        this.setLanguage('vi', true);
      });
    }
    if (this.dom.langBtnEn) {
      this.dom.langBtnEn.addEventListener('click', () => {
        this.setLanguage('en', true);
      });
    }

    // Academic Project & Author Info Modal
    const openAcademicModal = () => {
      if (this.dom.modalAcademic) {
        this.dom.modalAcademic.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    };
    const closeAcademicModal = () => {
      if (this.dom.modalAcademic) {
        this.dom.modalAcademic.style.display = 'none';
        document.body.style.overflow = '';
      }
    };

    if (this.dom.studentBadge) {
      this.dom.studentBadge.addEventListener('click', openAcademicModal);
      this.dom.studentBadge.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openAcademicModal();
        }
      });
    }
    if (this.dom.btnCloseAcademicModal) {
      this.dom.btnCloseAcademicModal.addEventListener('click', closeAcademicModal);
    }
    if (this.dom.btnCloseAcademicAction) {
      this.dom.btnCloseAcademicAction.addEventListener('click', closeAcademicModal);
    }
    if (this.dom.modalAcademic) {
      this.dom.modalAcademic.addEventListener('click', (e) => {
        if (e.target === this.dom.modalAcademic) {
          closeAcademicModal();
        }
      });
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.dom.modalAcademic && this.dom.modalAcademic.style.display !== 'none') {
        closeAcademicModal();
      }
    });

    // Testcase Selection Change
    this.dom.testcaseSelect.addEventListener('change', (e) => {
      this.loadTestcase(e.target.value);
    });

    // Inputs real-time counter & custom input detection
    const updateCounters = () => {
      const xLen = (this.dom.inputX.value || '').length;
      const yLen = (this.dom.inputY.value || '').length;
      if (this.dom.counterX) this.dom.counterX.textContent = `${xLen} bp`;
      if (this.dom.counterY) this.dom.counterY.textContent = `${yLen} bp`;
    };

    const handleCustomInput = () => {
      this.currentTestcase = null;
      if (this.dom.bioDescText) {
        this.dom.bioDescText.textContent = this.currentLang === 'en'
          ? 'Custom user-entered input data'
          : 'Dữ liệu tùy biến do người dùng nhập trực tiếp';
      }
      if (this.dom.bioTag) {
        this.dom.bioTag.textContent = 'CUSTOM';
        this.dom.bioTag.removeAttribute('data-cat');
      }
      updateCounters();
      try {
        sessionStorage.setItem('biolcs_custom_input', JSON.stringify({
          x: this.dom.inputX.value,
          y: this.dom.inputY.value
        }));
        sessionStorage.removeItem('biolcs_selected_testcase');
      } catch (e) {}
    };

    this.dom.inputX.addEventListener('input', handleCustomInput);
    this.dom.inputY.addEventListener('input', handleCustomInput);

    // Swap sequences
    if (this.dom.btnSwap) {
      this.dom.btnSwap.addEventListener('click', () => {
        const tmp = this.dom.inputX.value;
        this.dom.inputX.value = this.dom.inputY.value;
        this.dom.inputY.value = tmp;
        updateCounters();
        this.runAnalysis({ autoPlay: false });
      });
    }

    // Algorithm Selection Change
    if (this.dom.algoSelect) {
      this.dom.algoSelect.addEventListener('change', (e) => {
        this.dom.algoSelect.setAttribute('data-algo', e.target.value);
        try {
          sessionStorage.setItem('biolcs_selected_algo', e.target.value);
        } catch (err) {}
        this.runAnalysis({ autoPlay: false });
      });
    }

    // Run Button
    this.dom.btnRun.addEventListener('click', () => {
      const currentX = (this.dom.inputX.value || '').trim().toUpperCase();
      const currentY = (this.dom.inputY.value || '').trim().toUpperCase();
      const inputsChanged = currentX !== (this.lastRanX ?? '') || currentY !== (this.lastRanY ?? '');

      if (this.animController && this.animController.isPlaying && !inputsChanged) {
        this.animController.pause();
      } else {
        this.runAnalysis({ autoPlay: true });
      }
    });

    // Tab buttons
    this.dom.tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled || btn.classList.contains('tab-btn-disabled')) return;
        const target = btn.dataset.tab;
        this.switchTab(target);
      });
    });

    // Quick 3D button on Tab 1
    const btnQuick3D = document.getElementById('btn-quick-3d');
    if (btnQuick3D) {
      btnQuick3D.addEventListener('click', () => {
        this.switchTab('genomic');
      });
    }

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Ignore if user is currently typing inside input box
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' || e.target.isContentEditable) return;

      // Do not intercept browser/system shortcuts (e.g. Cmd+R, Cmd+Shift+R, Ctrl+R, Alt+Arrows)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.animController.togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.animController.stepNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.animController.stepPrev();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        this.animController.reset();
      } else if (e.key === '[' || e.key === ']') {
        const select = this.dom.speedSelect;
        const currentIndex = Array.from(select?.options || []).findIndex((option) => option.value === select.value);
        const direction = e.key === '[' ? -1 : 1;
        const nextIndex = Math.min(Math.max(currentIndex + direction, 0), (select?.options.length || 1) - 1);
        if (select && currentIndex >= 0 && nextIndex !== currentIndex) {
          e.preventDefault();
          select.selectedIndex = nextIndex;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          this.showToast(`${t('speedShortcutChanged', this.currentLang)} ${select.options[nextIndex].textContent}`, 'info');
        }
      }
    });
  }

  loadTestcase(testId) {
    const tc = this.testcases.find((t) => t.test_id === testId);
    if (!tc) return;
    this.currentTestcase = tc;
    if (this.dom.testcaseSelect && this.dom.testcaseSelect.value !== testId) {
      this.dom.testcaseSelect.value = testId;
    }
    try {
      sessionStorage.setItem('biolcs_selected_testcase', testId);
      sessionStorage.removeItem('biolcs_custom_input');
    } catch (e) {}

    const seqX = tc.input?.sequence_x ?? '';
    const seqY = tc.input?.sequence_y ?? '';

    this.dom.inputX.value = seqX;
    this.dom.inputY.value = seqY;

    // Update counters safely
    if (this.dom.counterX) this.dom.counterX.textContent = `${seqX.length} bp`;
    if (this.dom.counterY) this.dom.counterY.textContent = `${seqY.length} bp`;

    // Update bio context
    if (this.dom.bioDescText) {
      this.dom.bioDescText.textContent = getTestcaseDescription(tc, this.currentLang);
    }
    if (this.dom.bioTag) {
      this.dom.bioTag.textContent = (tc.category || '').toUpperCase();
      this.dom.bioTag.setAttribute('data-cat', tc.category || '');
    }

    // Auto-detect recommended algorithm for the selected testcase
    const descLower = (tc.description || '').toLowerCase();
    let recommendedAlgo = 'grid';
    if (tc.test_id === 'TC_01_04' || descLower.includes('hirschberg')) {
      recommendedAlgo = 'hirschberg';
    } else if (tc.category === '04_large' || (tc.category !== '06_invalid' && seqX.length * seqY.length > 2500)) {
      recommendedAlgo = 'space_opt';
    }
    if (this.dom.algoSelect) {
      this.dom.algoSelect.value = recommendedAlgo;
      this.dom.algoSelect.setAttribute('data-algo', recommendedAlgo);
    }

    // Classify sequence and adapt layout safely
    const classification = classifySequences(seqX, seqY);
    if (this.adaptiveLayout) {
      this.adaptiveLayout.adaptGenomicContext(classification);
      this.adaptiveLayout.adaptAlgorithmView(recommendedAlgo);
      const fallbackTab = this.adaptiveLayout.adaptTabs({
        classification,
        seqX,
        seqY
      });
      // Fallback only if currently on genomic tab and data is non-genomic text
      if (this.activeTab === 'genomic' && fallbackTab === 'matrix') {
        this.switchTab('matrix');
      }
    }

    // Synchronize Code Stepper with current testcase context
    if (this.codeStepper) {
      this.codeStepper.setAlgorithm(recommendedAlgo);
      this.codeStepper.setContext(seqX, seqY, tc.test_id);
    }

    // Prepare analysis on select without auto-playing until user clicks Run
    this.runAnalysis({ autoPlay: false });
  }

  sanitizeAndRun() {
    let rawX = (this.dom.inputX?.value || '').trim().toUpperCase();
    let rawY = (this.dom.inputY?.value || '').trim().toUpperCase();

    // 1. Strip non-alphabetic / illegal characters
    let cleanX = rawX.replace(/[^A-Z]/g, '');
    let cleanY = rawY.replace(/[^A-Z]/g, '');

    // 2. Truncate if exceeds safe length
    if (cleanX.length > 500) cleanX = cleanX.slice(0, 500);
    if (cleanY.length > 500) cleanY = cleanY.slice(0, 500);

    // 3. Fallback if empty/null
    if (!cleanX) cleanX = 'ACGT';
    if (!cleanY) cleanY = 'ACGT';

    this.dom.inputX.value = cleanX;
    this.dom.inputY.value = cleanY;
    if (this.dom.counterX) this.dom.counterX.textContent = `${cleanX.length} bp`;
    if (this.dom.counterY) this.dom.counterY.textContent = `${cleanY.length} bp`;

    const isEn = this.currentLang === 'en';
    this.showToast(isEn
      ? `Input cleaned & sanitized successfully! Running algorithm...`
      : `Đã làm sạch dữ liệu thành công! Đang tiến hành giải thuật...`,
      'success'
    );
    this.runAnalysis({ autoPlay: true });
  }

  _setBenchmarkAvailability(isAvailable) {
    const benchmarkTab = this.dom.tabBtnBenchmark;
    if (!benchmarkTab) return;

    benchmarkTab.disabled = !isAvailable;
    benchmarkTab.classList.toggle('tab-btn-disabled', !isAvailable);
  }

  runAnalysis({ autoPlay = true } = {}) {
    let rawX = (this.dom.inputX.value || '').trim().toUpperCase();
    let rawY = (this.dom.inputY.value || '').trim().toUpperCase();

    // Preserve null representation for testcases with explicit null inputs (e.g. TC_06_05)
    if (this.currentTestcase?.input) {
      if (this.currentTestcase.input.sequence_x === null && this.dom.inputX.value === '') {
        rawX = null;
      }
      if (this.currentTestcase.input.sequence_y === null && this.dom.inputY.value === '') {
        rawY = null;
      }
    }

    // Validation
    const valResult = validateSequences(rawX, rawY);
    if (!valResult.isValid) {
      if (this.animController) {
        this.animController.pause();
      }
      this.stepEngine = new StepEngine([]);
      if (this.animController) {
        this.animController.setEngine(this.stepEngine);
      }
      if (this.dom.timelineSlider) {
        this.dom.timelineSlider.value = 0;
        this.dom.timelineSlider.max = 0;
      }
      if (this.dom.stepCounter) {
        this.dom.stepCounter.textContent = this.currentLang === 'en' ? 'Step: 0 / 0' : 'Bước: 0 / 0';
      }
      if (this.dom.phaseText) {
        this.dom.phaseText.textContent = this.currentLang === 'en' ? 'Awaiting Input' : 'Chờ dữ liệu';
      }
      if (this.dom.btnRun) {
        this.dom.btnRun.classList.remove('btn-running');
      }
      if (this.dom.btnPlay) {
        this.dom.btnPlay.classList.remove('btn-running');
      }

      // Clear stale highlighted/computed visuals across DOM
      const staleSelectors = [
        '#matrix-viewport .cell-active',
        '#matrix-viewport .cell-compare',
        '#matrix-viewport .cell-match-found',
        '#matrix-viewport .cell-traceback',
        '#matrix-viewport .cell-traceback-match',
        '#matrix-viewport .cell-traceback-skip',
        '#matrix-viewport .cell-traceback-origin',
        '#matrix-viewport .header-match',
        '#alternate-viewport .cell-active',
        '#alignment-tracks .slot-scan-active',
        '#alignment-tracks .slot-scan-match',
        '#alignment-tracks .slot-confirmed-lcs',
        '#alignment-tracks .slot-lcs-final'
      ];
      document.querySelectorAll(staleSelectors.join(',')).forEach(el => {
        el.classList.remove(
          'cell-active', 'cell-compare', 'cell-match-found',
          'cell-traceback', 'cell-traceback-match', 'cell-traceback-skip',
          'cell-traceback-origin', 'header-match',
          'slot-scan-active', 'slot-scan-match', 'slot-confirmed-lcs', 'slot-lcs-final'
        );
      });

      // Clear benchmark view completely on invalid inputs
      if (this.dom.benchmarkContainer) {
        this.dom.benchmarkContainer.innerHTML = '';
      }
      if (this.benchmarkView) {
        this.benchmarkView._clearRaceTimers();
        this.benchmarkView.lastSeqX = '';
        this.benchmarkView.lastSeqY = '';
        this.benchmarkView.lastTestcase = null;
      }
      this._setBenchmarkAvailability(false);
      if (this.activeTab === 'benchmark') {
        this.switchTab('matrix');
      }

      // Localized error message
      valResult.localizedErrMsg = getLocalizedValidationError(valResult, rawX, rawY, 'vi');

      // Ensure matrix viewport is visible for displaying the defensive validation card
      if (this.dom.matrixViewport) {
        this.dom.matrixViewport.style.display = 'block';
      }
      if (this.dom.alternateViewport) {
        this.dom.alternateViewport.style.display = 'none';
      }
      if (this.dom.matrixLegendHints) {
        this.dom.matrixLegendHints.style.display = 'none';
      }

      // Render defensive validation card in the matrix viewport
      if (this.gridRenderer && typeof this.gridRenderer.renderDefensiveValidationCard === 'function') {
        this.gridRenderer.renderDefensiveValidationCard({
          testId: this.currentTestcase?.test_id,
          valResult,
          rawX,
          rawY,
          lang: this.currentLang,
          onSanitize: () => this.sanitizeAndRun()
        });
      }

      const errMsg = this.currentLang === 'en'
        ? `Input validation error: ${getLocalizedValidationError(valResult, rawX, rawY, 'en')}`
        : `Lỗi dữ liệu đầu vào: ${getLocalizedValidationError(valResult, rawX, rawY, 'vi')}`;
      this.showToast(errMsg, 'error');
      return;
    }

    const { sanitizedX, sanitizedY } = valResult;
    this._setBenchmarkAvailability(true);
    this.lastRanX = sanitizedX;
    this.lastRanY = sanitizedY;
    const algo = this.dom.algoSelect ? this.dom.algoSelect.value : 'grid';
    if (this.dom.algoSelect) {
      this.dom.algoSelect.setAttribute('data-algo', algo);
    }

    // Adapt layout and code stepper based on sequence and algorithm
    const classification = classifySequences(sanitizedX, sanitizedY);
    if (this.adaptiveLayout) {
      this.adaptiveLayout.adaptGenomicContext(classification);
      this.adaptiveLayout.adaptAlgorithmView(algo);
      const fallbackTab = this.adaptiveLayout.adaptTabs({
        classification,
        seqX: sanitizedX,
        seqY: sanitizedY
      });
      if (this.activeTab === 'genomic' && fallbackTab === 'matrix') {
        this.switchTab('matrix');
      }
    }
    if (this.codeStepper) {
      this.codeStepper.setAlgorithm(algo);
      this.codeStepper.setContext(sanitizedX, sanitizedY, this.currentTestcase?.test_id);
    }

    try {
      let result = null;
      if (algo === 'space_opt') {
        result = solveSpaceOptimizedDP(sanitizedX, sanitizedY);
        this.twoRowRenderer.init(sanitizedX, sanitizedY);
      } else if (algo === 'hirschberg' || (sanitizedX.length * sanitizedY.length > 2500 && algo !== 'space_opt')) {
        result = solveHirschberg(sanitizedX, sanitizedY);
      } else {
        result = solveGridDP(sanitizedX, sanitizedY, { recordSnapshots: true });
      }

      this.lastLcsResult = result;

      // 1. Setup StepEngine and AnimationController
      this.stepEngine = new StepEngine(result.steps || []);
      this.animController.setEngine(this.stepEngine);

      // 2. Initialize DP Grid if grid or hirschberg
      if (algo !== 'space_opt') {
        this.gridRenderer.initTable(sanitizedX, sanitizedY, result.matrix, result.tracebackMatrix, result.steps);
      } else {
        const isEn = this.currentLang === 'en';
        this.gridRenderer.updateFormula(isEn ? '2-Row cyclic buffer initialized. Ready to execute.' : 'Khởi tạo bộ đệm 2 dòng. Sẵn sàng thực thi.', 'fill');
      }

      // 3. Render Genetic Alignment Bar & 3D DNA Double Helix
      const alignRes = generateAlignment(sanitizedX, sanitizedY, result.lcs);
      this.alignmentRenderer.render(sanitizedX, sanitizedY, result.lcs);
      if (this.dnaVisualizer && typeof this.dnaVisualizer.setData === 'function') {
        this.dnaVisualizer.setData(alignRes.mutations, { seqX: sanitizedX, seqY: sanitizedY });
      }

      // 4. Update Benchmark View with testcase context
      this.benchmarkView.runBenchmark(sanitizedX, sanitizedY, { testcase: this.currentTestcase, lang: this.currentLang });

      // 5. Notify
      let successMsg;
      if (algo === 'space_opt') {
        successMsg = this.currentLang === 'en'
          ? `Analysis complete! Space-Optimized mode (Length: ${result.length} bp)`
          : `Phân tích thành công! Chế độ tối ưu không gian (Độ dài: ${result.length} bp)`;
      } else {
        const previewLcs = (result.lcs || '').length > 25 ? (result.lcs || '').slice(0, 25) + '...' : (result.lcs || '');
        successMsg = this.currentLang === 'en'
          ? `Analysis complete! LCS: "${previewLcs}" (Length: ${result.length} bp)`
          : `Phân tích thành công! LCS: "${previewLcs}" (Độ dài: ${result.length} bp)`;
      }
      this.showToast(successMsg, 'success');

      // 6. Play animation if autoPlay requested
      if (autoPlay && this.stepEngine && this.stepEngine.getTotalSteps() > 0) {
        // Do NOT force-switch tabs: allow user to observe animation in whichever tab they have open!
        this.animController.play();
      } else {
        const firstStep = this.stepEngine.getCurrentStep();
        if (firstStep) {
          this._onStepUpdate(firstStep);
        }
      }
    } catch (err) {
      console.error('Lỗi khi tính toán LCS:', err);
      const errMsg = this.currentLang === 'en'
        ? `Processing error: ${err.message}`
        : `Lỗi xử lý: ${err.message}`;
      this.showToast(errMsg, 'error');
    }
  }

  _onStepUpdate(snapshot) {
    if (!snapshot) return;
    const algo = this.dom.algoSelect ? this.dom.algoSelect.value : 'grid';

    // 1. Tab 1: Update Grid or Two-Row Table
    if (algo === 'space_opt' && this.twoRowRenderer) {
      this.twoRowRenderer.applySnapshot(snapshot);
      const isEn = this.currentLang === 'en';
      this.gridRenderer.updateFormula(snapshot.explanation || (isEn ? 'Computing 2-row buffer...' : 'Đang tính toán bộ đệm 2 dòng...'), 'fill');
    } else if (this.gridRenderer) {
      this.gridRenderer.applySnapshot(snapshot);
    }

    // 2. Tab 1: Update Synchronized Code Stepper (active line + scope variables)
    if (this.codeStepper) {
      this.codeStepper.applySnapshot(snapshot);
    }

    // 3. Tab 2: Update 3D Double Helix
    if (this.dnaVisualizer && this.dnaVisualizer.updateStep) {
      this.dnaVisualizer.updateStep(snapshot);
    }

    // 4. Tab 2: Update Genetic Alignment Tracks (scanning cursor, matching glow & traceback trail)
    if (this.alignmentRenderer && this.alignmentRenderer.applySnapshot) {
      this.alignmentRenderer.applySnapshot(snapshot);
    }

    // 5. Tab 3: Update Benchmark Live Step Race Simulator
    if (this.benchmarkView && this.benchmarkView.applySnapshot) {
      const totalSteps = this.stepEngine ? this.stepEngine.getTotalSteps() : 0;
      this.benchmarkView.applySnapshot(snapshot, totalSteps);
    }
  }

  switchTab(tabName) {
    if (tabName === 'benchmark') {
      const rawX = (this.dom.inputX.value || '').trim().toUpperCase();
      const rawY = (this.dom.inputY.value || '').trim().toUpperCase();
      const valResult = validateSequences(rawX, rawY);
      if (!valResult.isValid) {
        this._setBenchmarkAvailability(false);
        if (this.activeTab === 'benchmark') {
          this.switchTab('matrix');
        }
        return;
      }
    }

    const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (targetBtn && (targetBtn.disabled || targetBtn.classList.contains('tab-btn-disabled'))) {
      return;
    }
    this.activeTab = tabName;
    try {
      sessionStorage.setItem('biolcs_active_tab', tabName);
    } catch (e) {}
    this.dom.tabBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    this.dom.tabPanes.forEach((pane) => {
      pane.classList.toggle('active', pane.id === `pane-${tabName}`);
    });
    if (tabName === 'genomic' && this.dnaVisualizer) {
      setTimeout(() => {
        if (this.dnaVisualizer.resize) {
          this.dnaVisualizer.resize();
        }
      }, 50);
    } else if (tabName === 'benchmark' && this.benchmarkView) {
      const rawX = (this.dom.inputX.value || '').trim().toUpperCase();
      const rawY = (this.dom.inputY.value || '').trim().toUpperCase();
      const hasGrid = !!this.benchmarkView.container.querySelector('.benchmark-grid');
      const inputChanged = this.benchmarkView.lastSeqX !== rawX || this.benchmarkView.lastSeqY !== rawY;
      if (!hasGrid || inputChanged) {
        this.benchmarkView._executeAndRender(rawX, rawY, {
          testcase: this.currentTestcase,
          iterations: this.benchmarkView.currentIterations,
          lang: this.currentLang
        });
      }
    }
  }

  showToast(message, type = 'info') {
    if (!this.dom.toastContainer) return;
    if (type === 'error') {
      this.dom.toastContainer.innerHTML = '';
    } else {
      while (this.dom.toastContainer.children.length >= 2) {
        this.dom.toastContainer.firstChild.remove();
      }
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    this.dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  }

  _initTheme() {
    let savedTheme = 'dark';
    try {
      savedTheme = localStorage.getItem('biolcs-theme') || 'dark';
    } catch (e) {
      savedTheme = 'dark';
    }
    this.setTheme(savedTheme, false);

    if (this.dom.themeToggle) {
      this.dom.themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(nextTheme, true);
      });
    }
  }

  setTheme(theme, notify = false) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('biolcs-theme', theme);
    } catch (e) {
      // Ignored if local storage blocked
    }
    if (this.dom.themeToggle) {
      const title = theme === 'dark'
        ? t('themeToggleTitleLight', this.currentLang)
        : t('themeToggleTitleDark', this.currentLang);
      this.dom.themeToggle.setAttribute('title', title);
    }
    if (this.dnaVisualizer && typeof this.dnaVisualizer.onThemeChange === 'function') {
      this.dnaVisualizer.onThemeChange(theme);
    }
    if (notify) {
      const msg = theme === 'light'
        ? t('toastThemeLight', this.currentLang)
        : t('toastThemeDark', this.currentLang);
      this.showToast(msg, 'info');
    }
  }

  _initLanguage() {
    let savedLang = 'vi';
    try {
      savedLang = localStorage.getItem('biolcs-lang') || 'vi';
    } catch (e) {
      savedLang = 'vi';
    }
    this.setLanguage(savedLang, false);
  }

  setLanguage(lang, notify = false) {
    if (lang !== 'vi' && lang !== 'en') lang = 'vi';
    this.currentLang = lang;
    try {
      localStorage.setItem('biolcs-lang', lang);
    } catch (e) {}

    document.documentElement.setAttribute('lang', lang);

    // Single language toggle button state (1 indicator at a time)
    if (this.dom.langToggleText) {
      this.dom.langToggleText.textContent = lang === 'vi' ? 'EN' : 'VI';
    }
    if (this.dom.langToggle) {
      const nextTitle = lang === 'vi'
        ? 'Chuyển sang English (Switch to English)'
        : 'Chuyển sang Tiếng Việt (Switch to Vietnamese)';
      this.dom.langToggle.setAttribute('title', nextTitle);
    }

    // Segmented toggle button state (Backwards compatibility)
    if (this.dom.langBtnVi && this.dom.langBtnEn) {
      this.dom.langBtnVi.classList.toggle('active', lang === 'vi');
      this.dom.langBtnEn.classList.toggle('active', lang === 'en');
    }

    // Static text updates in Ribbon and Header
    if (this.dom.brandSubtitle) this.dom.brandSubtitle.textContent = t('brandSubtitle', lang);
    if (this.dom.brandReload) {
      this.dom.brandReload.setAttribute('title', t('brandReloadTitle', lang));
      this.dom.brandReload.setAttribute('aria-label', t('brandReloadTitle', lang));
    }
    // Student Badge & Academic Modal localization
    if (this.dom.badgeStudentName) this.dom.badgeStudentName.textContent = t('studentName', lang);
    if (this.dom.badgeStudentId) this.dom.badgeStudentId.textContent = t('studentId', lang);
    if (this.dom.badgeStudentClass) this.dom.badgeStudentClass.textContent = t('studentClass', lang);
    if (this.dom.badgeStudentAdvisor) this.dom.badgeStudentAdvisor.textContent = t('studentAdvisor', lang);
    if (this.dom.badgeStudentUni) this.dom.badgeStudentUni.textContent = t('studentUni', lang);
    if (this.dom.studentBadge) this.dom.studentBadge.setAttribute('title', t('studentBadgeTitle', lang));

    if (this.dom.modalAcademicTitle) this.dom.modalAcademicTitle.textContent = t('modalAcademicTitle', lang);
    if (this.dom.modalAcademicSub) this.dom.modalAcademicSub.textContent = t('modalAcademicSub', lang);
    if (this.dom.modalLblAuthor) this.dom.modalLblAuthor.textContent = t('modalLblAuthor', lang);
    if (this.dom.modalValAuthor) this.dom.modalValAuthor.textContent = t('studentName', lang);
    if (this.dom.modalLblId) this.dom.modalLblId.textContent = t('modalLblId', lang);
    if (this.dom.modalLblClass) this.dom.modalLblClass.textContent = t('modalLblClass', lang);
    if (this.dom.modalLblCourse) this.dom.modalLblCourse.textContent = t('modalLblCourse', lang);
    if (this.dom.modalValCourse) this.dom.modalValCourse.textContent = t('modalValCourse', lang);
    if (this.dom.modalLblAdvisor) this.dom.modalLblAdvisor.textContent = t('modalLblAdvisor', lang);
    if (this.dom.modalLblTopic) this.dom.modalLblTopic.textContent = t('modalLblTopic', lang);
    if (this.dom.modalValTopic) this.dom.modalValTopic.textContent = t('modalValTopic', lang);
    if (this.dom.modalLblLinks) this.dom.modalLblLinks.textContent = t('modalLblLinks', lang);
    if (this.dom.modalAcademicCopyright) this.dom.modalAcademicCopyright.textContent = t('modalCopyright', lang);
    if (this.dom.btnCloseAcademicModal) this.dom.btnCloseAcademicModal.setAttribute('aria-label', t('modalBtnClose', lang));
    if (this.dom.btnCloseAcademicAction) this.dom.btnCloseAcademicAction.textContent = t('modalBtnClose', lang);

    if (this.dom.labelTestcaseSelect) this.dom.labelTestcaseSelect.textContent = t('testcaseLabel', lang);
    const isGen = this.adaptiveLayout?.lastClassification?.isGenomic ?? true;
    if (this.dom.labelSeqX) this.dom.labelSeqX.textContent = t(isGen ? 'seqXGenomic' : 'seqXText', lang);
    if (this.dom.labelSeqY) this.dom.labelSeqY.textContent = t(isGen ? 'seqYGenomic' : 'seqYText', lang);
    if (this.dom.labelAlgoSelect) this.dom.labelAlgoSelect.textContent = t('algoLabel', lang);
    if (this.dom.btnRunText) this.dom.btnRunText.textContent = t('btnRun', lang);
    if (this.dom.labelBaseLegend) this.dom.labelBaseLegend.textContent = t('ntLabel', lang);
    if (this.dom.tabBenchmarkLabel) this.dom.tabBenchmarkLabel.textContent = t('tabBenchmark', lang);
    if (this.dom.labelSpeedSelect) this.dom.labelSpeedSelect.textContent = t('speedLabel', lang);
    if (this.dom.speedSelect) this.dom.speedSelect.setAttribute('title', t('speedShortcutTitle', lang));

    // Algorithm dropdown option labels
    if (this.dom.algoSelect) {
      const opts = this.dom.algoSelect.options;
      if (opts.length >= 3) {
        opts[0].textContent = t('algoGrid', lang);
        opts[1].textContent = t('algoHirschberg', lang);
        opts[2].textContent = t('algoSpaceOpt', lang);
      }
    }

    // Speed options
    if (this.dom.speedSelect) {
      const sOpts = this.dom.speedSelect.options;
      if (sOpts.length >= 5) {
        sOpts[0].textContent = t('speed50', lang);
        sOpts[1].textContent = t('speed150', lang);
        sOpts[2].textContent = t('speed250', lang);
        sOpts[3].textContent = t('speed500', lang);
        sOpts[4].textContent = t('speed1000', lang);
      }
    }

    // Play/Pause button text
    if (this.dom.btnPlayText) {
      const isPlaying = this.animController && this.animController.isPlaying;
      this.dom.btnPlayText.textContent = isPlaying ? t('btnPauseText', lang) : t('btnPlayText', lang);
    }

    // Tooltips
    if (this.dom.btnSwap) {
      this.dom.btnSwap.setAttribute('title', t('swapTitle', lang));
    }
    if (this.dom.btnReset) {
      this.dom.btnReset.setAttribute('title', t('btnResetTitle', lang));
    }
    if (this.dom.btnPrev) {
      this.dom.btnPrev.setAttribute('title', t('btnPrevTitle', lang));
    }
    if (this.dom.btnPlay) {
      this.dom.btnPlay.setAttribute('title', t('btnPlayTitle', lang));
    }
    if (this.dom.btnNext) {
      this.dom.btnNext.setAttribute('title', t('btnNextTitle', lang));
    }

    // Update Theme toggle title
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    if (this.dom.themeToggle) {
      this.dom.themeToggle.setAttribute('title', currentTheme === 'dark' ? t('themeToggleTitleLight', lang) : t('themeToggleTitleDark', lang));
    }

    // Re-populate testcases dropdown with localized descriptions & categories
    this._populateTestcases();

    // Update input placeholders
    if (this.dom.inputX) this.dom.inputX.placeholder = t('placeholderSeq', lang);
    if (this.dom.inputY) this.dom.inputY.placeholder = t('placeholderSeqY', lang);

    // Update legend chips & Quick 3D button
    if (this.dom.legendMatch) {
      this.dom.legendMatch.title = t('legendMatchTitle', lang);
      this.dom.legendMatch.innerHTML = `<span class="chip-dot"></span> ${t('legendMatch', lang)}`;
    }
    if (this.dom.legendSkip) {
      this.dom.legendSkip.title = t('legendSkipTitle', lang);
      this.dom.legendSkip.innerHTML = `<span class="chip-dot"></span> ${t('legendSkip', lang)}`;
    }
    if (this.dom.legendActive) {
      this.dom.legendActive.title = t('legendActiveTitle', lang);
      this.dom.legendActive.innerHTML = `<span class="chip-dot"></span> ${t('legendActive', lang)}`;
    }
    if (this.dom.legendCompare) {
      this.dom.legendCompare.title = t('legendCompareTitle', lang);
      this.dom.legendCompare.innerHTML = `<span class="chip-dot"></span> ${t('legendCompare', lang)}`;
    }
    if (this.dom.btnQuick3D) {
      this.dom.btnQuick3D.title = t('btnQuick3DTitle', lang);
      this.dom.btnQuick3D.textContent = t('btnQuick3D', lang);
    }

    // Update initial formula bar text if not yet executed
    if (this.dom.formulaBar && (!this.stepEngine || this.stepEngine.getTotalSteps() === 0)) {
      const fText = this.dom.formulaBar.querySelector('.formula-text');
      if (fText) fText.textContent = t('formulaReady', lang);
    }

    // Tab 2: 3D Helix Panel Title & Hint
    if (this.dom.panel3DHelix) {
      const pTitle = this.dom.panel3DHelix.querySelector('.panel-title');
      if (pTitle) {
        pTitle.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          ${t('dna3DTitle', lang)}
        `;
      }
      const pHint = this.dom.panel3DHelix.querySelector('.panel-meta-hint');
      if (pHint) pHint.textContent = t('dna3DHint', lang);
    }

    // Tab 2: Non-Genomic notice
    if (this.dom.nonGenomicNotice) {
      const h3 = this.dom.nonGenomicNotice.querySelector('h3');
      if (h3) h3.textContent = t('nonGenomicTitle', lang);
      if (this.dom.nonGenomicReasonText) {
        this.dom.nonGenomicReasonText.textContent = t('nonGenomicReason', lang);
      }
    }

    // Tab 2: Alignment Panel Title
    if (this.dom.alignmentPanelTitle) {
      this.dom.alignmentPanelTitle.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="4 17 10 11 4 5"></polyline>
          <line x1="12" y1="19" x2="20" y2="19"></line>
        </svg>
        ${t('alignmentTitle', lang)}
      `;
    }

    // Tab 3: Benchmark Panel Title
    if (this.dom.benchmarkPanelTitle) {
      this.dom.benchmarkPanelTitle.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        ${t('benchmarkTitle', lang)}
      `;
    }

    // Bottom timeline toolbar initial values
    if (this.dom.stepCounter && (!this.stepEngine || this.stepEngine.getTotalSteps() === 0)) {
      this.dom.stepCounter.textContent = lang === 'en' ? 'Step: 0 / 0' : 'Bước: 0 / 0';
    }
    if (this.dom.phaseText && (!this.stepEngine || this.stepEngine.getTotalSteps() === 0)) {
      this.dom.phaseText.textContent = t('phaseInit', lang);
    }

    // Update bio-context bar text
    if (this.currentTestcase) {
      if (this.dom.bioDescText) {
        this.dom.bioDescText.textContent = getTestcaseDescription(this.currentTestcase, lang);
      }
    } else {
      if (this.dom.bioDescText) {
        this.dom.bioDescText.textContent = lang === 'en'
          ? 'Custom user-entered input data'
          : 'Dữ liệu tùy biến do người dùng nhập trực tiếp';
      }
    }

    // Forward to child view components
    if (this.codeStepper && typeof this.codeStepper.setUILanguage === 'function') {
      this.codeStepper.setUILanguage(lang);
    }
    if (this.gridRenderer && typeof this.gridRenderer.setLanguage === 'function') {
      this.gridRenderer.setLanguage(lang);
    }
    if (this.twoRowRenderer && typeof this.twoRowRenderer.setLanguage === 'function') {
      this.twoRowRenderer.setLanguage(lang);
    }
    if (this.adaptiveLayout && typeof this.adaptiveLayout.setLanguage === 'function') {
      this.adaptiveLayout.setLanguage(lang);
    }
    if (this.alignmentRenderer && typeof this.alignmentRenderer.setLanguage === 'function') {
      this.alignmentRenderer.setLanguage(lang);
    }
    if (this.dnaVisualizer && typeof this.dnaVisualizer.setLanguage === 'function') {
      this.dnaVisualizer.setLanguage(lang);
    }
    if (this.benchmarkView && typeof this.benchmarkView.setLanguage === 'function') {
      this.benchmarkView.setLanguage(lang);
    }
    if (this.animController && typeof this.animController.setLanguage === 'function') {
      this.animController.setLanguage(lang);
    }
    if (this.animController && typeof this.animController.syncUI === 'function') {
      this.animController.lang = lang;
      this.animController.syncUI();
    }

    if (notify) {
      this.showToast(t(lang === 'en' ? 'toastLangEn' : 'toastLangVi', lang), 'info');
    }
  }
}

// Instantiate and start app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BioLCSApp();
  window.app.init();
});
