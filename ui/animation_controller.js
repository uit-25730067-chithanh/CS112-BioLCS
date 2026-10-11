/**
 * Animation Controller (Timeline Playback & StepEngine Coordinator)
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * Student: Dang Chi Thanh (MSSV: 25730067)
 */

export class AnimationController {
  constructor(stepEngine, uiElements = {}, onStepCallback = null) {
    this.engine = stepEngine;
    this.ui = uiElements;
    this.onStep = onStepCallback;
    this.isPlaying = false;
    this.intervalId = null;
    this.speed = 250;

    this._bindEvents();
    this.syncUI();
  }

  setEngine(stepEngine) {
    this.pause();
    this.engine = stepEngine;
    if (this.ui.slider) {
      this.ui.slider.min = 0;
      this.ui.slider.max = Math.max(0, this.engine.getTotalSteps() - 1);
      this.ui.slider.value = 0;
    }
    this.syncUI();
  }

  _bindEvents() {
    this.ui.btnPlay?.addEventListener('click', () => this.togglePlay());
    this.ui.btnNext?.addEventListener('click', () => this.stepNext());
    this.ui.btnPrev?.addEventListener('click', () => this.stepPrev());
    this.ui.btnReset?.addEventListener('click', () => this.reset());

    this.ui.slider?.addEventListener('input', (e) => {
      this.pause();
      this.jumpTo(parseInt(e.target.value, 10));
    });

    this.ui.speedSelect?.addEventListener('change', (e) => {
      this.speed = parseInt(e.target.value, 10);
      if (this.isPlaying) {
        this.pause();
        this.play();
      }
    });
  }

  togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  play() {
    if (!this.engine || this.engine.getTotalSteps() === 0) return;
    if (this.engine.isAtEnd?.()) this.engine.reset();

    this.isPlaying = true;
    this._updatePlayButton();

    this.intervalId = setInterval(() => {
      const step = this.engine.next();
      if (step) {
        this.syncUI();
        this.onStep?.(step);
      } else {
        this.pause();
      }
    }, this.speed);
  }

  pause() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this._updatePlayButton();
  }

  stepNext() {
    this.pause();
    if (!this.engine) return;
    const step = this.engine.next();
    if (step) {
      this.syncUI();
      this.onStep?.(step);
    }
  }

  stepPrev() {
    this.pause();
    if (!this.engine) return;
    const step = this.engine.prev();
    if (step) {
      this.syncUI();
      this.onStep?.(step);
    }
  }

  reset() {
    this.pause();
    if (!this.engine) return;
    const step = this.engine.reset();
    this.syncUI();
    if (this.onStep && step) this.onStep(step);
  }

  jumpTo(index) {
    if (!this.engine) return;
    const step = this.engine.jumpToStep(index);
    this.syncUI();
    if (this.onStep && step) this.onStep(step);
  }

  setLanguage(lang) {
    this.lang = lang || 'vi';
    this._updatePlayButton();
    this.syncUI();
  }

  setLanguage(lang) {
    this.lang = lang;
    this._updatePlayButton();
    this.syncUI();
  }

  _updatePlayButton() {
    const playSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    const pauseSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
    const isEn = (this.lang || document.documentElement.getAttribute('lang')) === 'en';

    if (this.ui.btnPlay) {
      this.ui.btnPlay.innerHTML = this.isPlaying
        ? `${pauseSvg}<span id="btn-play-text">${isEn ? 'Pause' : 'Tạm dừng'}</span>`
        : `${playSvg}<span id="btn-play-text">${isEn ? 'Play' : 'Chạy tiếp'}</span>`;
    }

    if (this.ui.btnRun) {
      if (this.isPlaying) {
        this.ui.btnRun.innerHTML = `${pauseSvg}<span id="btn-run-text">${isEn ? 'Pause Animation' : 'Tạm Dừng Animation'}</span>`;
        this.ui.btnRun.classList.add('btn-running');
      } else {
        this.ui.btnRun.innerHTML = `${playSvg}<span id="btn-run-text">${isEn ? 'Analyze & Run' : 'Phân Tích & Chạy'}</span>`;
        this.ui.btnRun.classList.remove('btn-running');
      }
    }
  }

  setLanguage(lang) {
    this.lang = lang || 'vi';
    this._updatePlayButton();
    this.syncUI();
  }

  syncUI() {
    const isEn = (this.lang || document.documentElement.getAttribute('lang')) === 'en';
    const current = this.engine ? this.engine.getCurrentIndex() : 0;
    const total = this.engine ? this.engine.getTotalSteps() : 0;
    const step = this.engine ? this.engine.getCurrentStep() : null;

    if (this.ui.stepCounter) {
      this.ui.stepCounter.textContent = total > 0
        ? `${isEn ? 'Step' : 'Bước'}: ${current + 1} / ${total}`
        : `${isEn ? 'Step: 0 / 0' : 'Bước: 0 / 0'}`;
    }

    if (this.ui.phaseText) {
      if (step) {
        let p = isEn ? 'Initialization' : 'Khởi tạo';
        if (step.phase === 'fill' || step.phase === 'cell_computation') p = isEn ? 'DP Matrix Computation' : 'Tính ma trận DP';
        else if (step.phase === 'traceback') p = isEn ? 'Traceback Optimal Path' : 'Truy vết đường đi';
        else if (step.phase === 'divide') p = isEn ? 'Hirschberg: Divide' : 'Hirschberg: Chia đệ quy';
        else if (step.phase === 'conquer_merge') p = isEn ? 'Hirschberg: Conquer & Merge' : 'Hirschberg: Hợp nhất LCS';
        else if (step.phase === 'complete' || step.phase === 'finished') p = isEn ? 'Solution Completed' : 'Hoàn tất nghiệm';
        this.ui.phaseText.textContent = p;
      } else {
        this.ui.phaseText.textContent = isEn ? 'Initialization' : 'Khởi tạo';
      }
    }

    if (this.ui.slider && this.engine) this.ui.slider.value = current;
  }
}
