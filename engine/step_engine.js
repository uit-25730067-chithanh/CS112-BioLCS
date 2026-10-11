/**
 * Step Engine Module (Timeline Controller)
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * 
 * Manages playback, stepping, seeking, and timeline progress
 * across StepSnapshot arrays produced by any of the 3 algorithms.
 */

export class StepEngine {
  /**
   * Initializes timeline with snapshots.
   * @param {Array<object>} steps - Array of StepSnapshot objects
   */
  constructor(steps = []) {
    this.steps = Array.isArray(steps) ? steps : [];
    this.currentIndex = 0;
  }

  /**
   * Returns current active step snapshot.
   * @returns {object|null}
   */
  getCurrentStep() {
    if (this.steps.length === 0) return null;
    return this.steps[this.currentIndex] || null;
  }

  /**
   * Returns total number of steps in timeline.
   * @returns {number}
   */
  getTotalSteps() {
    return this.steps.length;
  }

  /**
   * Returns current step index (0-indexed).
   * @returns {number}
   */
  getCurrentIndex() {
    return this.currentIndex;
  }

  /**
   * Jumps directly to specified step index.
   * Clamps between 0 and totalSteps - 1.
   * @param {number} index
   * @returns {object|null}
   */
  jumpToStep(index) {
    if (this.steps.length === 0) return null;
    this.currentIndex = Math.max(0, Math.min(Math.floor(index), this.steps.length - 1));
    return this.getCurrentStep();
  }

  /**
   * Advances timeline to next step.
   * @returns {object|null} Next snapshot or null if already at end
   */
  next() {
    if (this.currentIndex < this.steps.length - 1) {
      this.currentIndex++;
      return this.getCurrentStep();
    }
    return null;
  }

  /**
   * Rewinds timeline to previous step.
   * @returns {object|null} Previous snapshot or null if already at start
   */
  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.getCurrentStep();
    }
    return null;
  }

  /**
   * Resets timeline back to first step (index 0).
   * @returns {object|null}
   */
  reset() {
    this.currentIndex = 0;
    return this.getCurrentStep();
  }

  /**
   * Fast-forwards timeline directly to final step.
   * @returns {object|null}
   */
  finish() {
    if (this.steps.length === 0) return null;
    this.currentIndex = this.steps.length - 1;
    return this.getCurrentStep();
  }

  /**
   * Returns progress metadata for UI progress bars.
   * @returns {{ current: number, total: number, percentage: number }}
   */
  getProgress() {
    const total = this.steps.length;
    const current = total > 0 ? this.currentIndex + 1 : 0;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    return { current, total, percentage };
  }

  /**
   * Checks if pointer is at first step.
   * @returns {boolean}
   */
  isAtStart() {
    return this.currentIndex === 0;
  }

  /**
   * Checks if pointer is at final step.
   * @returns {boolean}
   */
  isAtEnd() {
    return this.steps.length === 0 || this.currentIndex === this.steps.length - 1;
  }
}
