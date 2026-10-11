/**
 * Deterministic browser regressions for the BioLCS demo.
 *
 * These checks intentionally run against the current application before the
 * corresponding UI fixes land.  A red result identifies the named contract
 * that still needs repair; all cases run so one defect cannot hide another.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '..');
const INDEX_PATH = '/index.html';
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

// No browser/runtime errors are expected from the local application.  Keep
// this explicit so a future third-party warning cannot be silently ignored.
const CONSOLE_ERROR_ALLOWLIST = [];
// A cleared state must survive several 50 ms animation ticks.  The bounded
// predicates below poll state; they do not sleep for a fixed interval.
const STABILITY_WINDOW_MS = 180;
const STABILITY_POLL_MS = 25;
const STABILITY_TIMEOUT_MS = 2000;

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function createStaticServer(baseDir) {
  const root = path.resolve(baseDir);
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let pathname;
      try {
        pathname = decodeURIComponent(new URL(req.url || '/', 'http://127.0.0.1').pathname);
      } catch {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('400 Bad Request');
        return;
      }

      const relative = pathname.replace(/^[/\\]+/, '') || 'index.html';
      const filePath = path.resolve(root, relative);
      const insideRoot = filePath === root || filePath.startsWith(`${root}${path.sep}`);
      if (!insideRoot) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 Forbidden');
        return;
      }

      let stat;
      try {
        stat = fs.statSync(filePath);
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }
      if (!stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }

      const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });

    const onError = (error) => {
      server.removeListener('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.removeListener('error', onError);
      resolve(server);
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(0, '127.0.0.1');
  });
}

function serverUrl(server) {
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Static server did not expose an assigned TCP port');
  return `http://127.0.0.1:${address.port}`;
}

async function waitForApp(page) {
  await page.goto(`${page.baseURL || ''}${INDEX_PATH}`, { waitUntil: 'domcontentloaded' });
  await page.locator('#testcase-select').waitFor({ state: 'visible' });
  await page.locator('#timeline-slider').waitFor({ state: 'attached' });
  await page.waitForFunction(() => Boolean(
    window.app &&
    window.app.stepEngine &&
    document.querySelector('#benchmark-container .benchmark-grid')
  ), null, { timeout: 10000 });
}

function runtimeErrors(consoleErrors, pageErrors) {
  const unexpectedConsole = consoleErrors.filter((message) => (
    !CONSOLE_ERROR_ALLOWLIST.some((allowed) => message.includes(allowed))
  ));
  const messages = [
    ...unexpectedConsole.map((message) => `console.error: ${message}`),
    ...pageErrors.map((message) => `pageerror: ${message}`)
  ];
  return messages;
}

async function getTimelineState(page) {
  return page.evaluate(() => {
    const slider = document.querySelector('#timeline-slider');
    const counter = document.querySelector('#step-counter');
    const runButton = document.querySelector('#btn-run');
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
    return {
      value: Number(slider?.value || 0),
      max: Number(slider?.max || 0),
      counter: counter?.textContent?.trim() || '',
      running: runButton?.classList.contains('btn-running') || false,
      staleVisuals: staleSelectors.reduce((total, selector) => total + document.querySelectorAll(selector).length, 0)
    };
  });
}

async function waitForToast(page, selector) {
  const toast = page.locator(`#toast-container ${selector}`).last();
  await toast.waitFor({ state: 'visible', timeout: 5000 });
  return (await toast.textContent())?.trim() || '';
}

async function waitForStableTimelineClear(page) {
  await page.waitForFunction((windowMs) => {
    const slider = document.querySelector('#timeline-slider');
    const counter = document.querySelector('#step-counter')?.textContent || '';
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
    const state = {
      value: Number(slider?.value || 0),
      max: Number(slider?.max || 0),
      counter: counter.trim(),
      running: document.querySelector('#btn-run')?.classList.contains('btn-running') || false,
      staleVisuals: staleSelectors.reduce((total, selector) => total + document.querySelectorAll(selector).length, 0)
    };
    const stableState = !state.running && state.value === 0 && state.max === 0 &&
      /(?:Bước|Step):\s*0\s*\/\s*0/.test(state.counter) && state.staleVisuals === 0;
    const tracker = window.__bioLcsTimelineStability || (window.__bioLcsTimelineStability = {
      key: null,
      firstObserved: 0,
      samples: 0
    });
    if (!stableState) {
      tracker.key = null;
      tracker.firstObserved = 0;
      tracker.samples = 0;
      return false;
    }
    const key = JSON.stringify(state);
    if (tracker.key !== key) {
      tracker.key = key;
      tracker.firstObserved = performance.now();
      tracker.samples = 1;
      return false;
    }
    tracker.samples += 1;
    return tracker.samples >= 4 && performance.now() - tracker.firstObserved >= windowMs;
  }, STABILITY_WINDOW_MS, { timeout: STABILITY_TIMEOUT_MS, polling: STABILITY_POLL_MS });
}

async function waitForStableBenchmarkClear(page) {
  await page.waitForFunction((windowMs) => {
    const container = document.querySelector('#benchmark-container');
    const hasResultNodes = Boolean(container?.querySelector('.benchmark-grid, .benchmark-comparison-table, .algo-card'));
    const metrics = /\d+(?:\.\d+)?\s*(?:ms|KB)|\|X\|\s*=|\|Y\|\s*=/i.test(container?.textContent || '');
    const state = {
      count: Number(window.__bioLcsBenchmarkRunCount || 0),
      hasResultNodes,
      metrics
    };
    const tracker = window.__bioLcsBenchmarkStability || (window.__bioLcsBenchmarkStability = {
      key: null,
      firstObserved: 0,
      samples: 0
    });
    const clearState = state.count === 0 && !state.hasResultNodes && !state.metrics;
    if (!clearState) {
      tracker.key = null;
      tracker.firstObserved = 0;
      tracker.samples = 0;
      return false;
    }
    const key = JSON.stringify(state);
    if (tracker.key !== key) {
      tracker.key = key;
      tracker.firstObserved = performance.now();
      tracker.samples = 1;
      return false;
    }
    tracker.samples += 1;
    return tracker.samples >= 4 && performance.now() - tracker.firstObserved >= windowMs;
  }, STABILITY_WINDOW_MS, { timeout: STABILITY_TIMEOUT_MS, polling: STABILITY_POLL_MS });
}

async function getBenchmarkState(page) {
  return page.evaluate(() => {
    const container = document.querySelector('#benchmark-container');
    const benchmarkTab = document.querySelector('#tab-btn-benchmark');
    return {
      count: Number(window.__bioLcsBenchmarkRunCount || 0),
      hasResultNodes: Boolean(container?.querySelector('.benchmark-grid, .benchmark-comparison-table, .algo-card')),
      metrics: /\d+(?:\.\d+)?\s*(?:ms|KB)|\|X\|\s*=|\|Y\|\s*=/i.test(container?.textContent || ''),
      tabDisabled: Boolean(benchmarkTab?.disabled || benchmarkTab?.classList.contains('tab-btn-disabled')),
      tabActive: benchmarkTab?.classList.contains('active') || false
    };
  });
}

async function runSpaceOptimizedCase(page) {
  await page.selectOption('#speed-select', '50');
  await page.fill('#input-seq-x', 'ACGT');
  await page.fill('#input-seq-y', 'AGT');
  await page.selectOption('#algo-select', 'space_opt');
  await page.click('#btn-run');

  const toastText = await waitForToast(page, '.toast-success');
  await page.waitForFunction(() => {
    const context = document.querySelector('#benchmark-container .benchmark-context-chip')?.textContent || '';
    return context.includes('4 bp') && context.includes('3 bp') && Boolean(
      document.querySelector('#benchmark-container .benchmark-comparison-table')
    );
  }, null, { timeout: 5000 });

  assertCondition(/3\s*bp/.test(toastText), `Space-Optimized success toast omitted positive length: "${toastText}"`);
  const userFacingText = await page.evaluate(() => [
    '#toast-container',
    '#benchmark-container',
    '#alignment-stats'
  ].map((selector) => document.querySelector(selector)?.textContent || '').join('\n'));
  assertCondition(
    !/\bLCS\s*:\s*(?:""|''|“”)/i.test(userFacingText),
    'Space-Optimized presented an empty recovered LCS claim despite returning a positive length'
  );
}

async function runInvalidTimelineCase(page) {
  await page.selectOption('#speed-select', '50');
  await page.fill('#input-seq-x', 'ACGTACGTACGTACGT');
  await page.fill('#input-seq-y', 'TGCATGCATGCATGCA');
  await page.click('#btn-run');
  await page.waitForFunction(() => {
    const slider = document.querySelector('#timeline-slider');
    const value = Number(slider?.value || 0);
    const max = Number(slider?.max || 0);
    return max > 8 && value >= 3 && value < max && document.querySelector('#btn-run')?.classList.contains('btn-running');
  }, null, { timeout: 8000 });

  await page.fill('#input-seq-x', 'ACTG123');
  await page.fill('#input-seq-y', 'ACGT');
  await page.click('#btn-run');
  await waitForToast(page, '.toast-error');

  try {
    await waitForStableTimelineClear(page);
  } catch {
    const state = await getTimelineState(page);
    throw new Error(`Invalid input did not keep timeline cleared for ${STABILITY_WINDOW_MS}ms: ${JSON.stringify(state)}`);
  }

  const state = await getTimelineState(page);
  assertCondition(!state.running, 'Invalid input left animation running after validation');
  assertCondition(state.value === 0 && state.max === 0, `Invalid input did not clear slider: ${JSON.stringify(state)}`);
  assertCondition(/(?:Bước|Step):\s*0\s*\/\s*0/.test(state.counter), `Invalid input left non-empty counter: "${state.counter}"`);
  assertCondition(state.staleVisuals === 0, `Invalid input left stale highlighted/computed visuals: ${state.staleVisuals}`);
}

async function runInvalidBenchmarkCase(page) {
  await page.evaluate(() => {
    const benchmarkView = window.app?.benchmarkView;
    if (!benchmarkView) throw new Error('Benchmark view is unavailable for instrumentation');
    window.__bioLcsBenchmarkRunCount = 0;
    const original = benchmarkView.runBenchmark.bind(benchmarkView);
    benchmarkView.runBenchmark = (...args) => {
      window.__bioLcsBenchmarkRunCount += 1;
      return original(...args);
    };
  });

  await page.fill('#input-seq-x', 'ACTG123');
  await page.fill('#input-seq-y', 'ACGT');
  await page.click('#btn-run');
  await waitForToast(page, '.toast-error');

  try {
    await waitForStableBenchmarkClear(page);
  } catch {
    const state = await getBenchmarkState(page);
    throw new Error(`Invalid input did not keep benchmark absent for ${STABILITY_WINDOW_MS}ms: ${JSON.stringify(state)}`);
  }

  const state = await getBenchmarkState(page);
  assertCondition(state.count === 0, `Invalid input invoked benchmark run ${state.count} time(s)`);
  assertCondition(!state.hasResultNodes && !state.metrics, `Invalid input left benchmark results or metrics: ${JSON.stringify(state)}`);
  assertCondition(state.tabDisabled, `Invalid input did not disable Benchmark tab: ${JSON.stringify(state)}`);
  assertCondition(!state.tabActive, `Invalid input left Benchmark tab active: ${JSON.stringify(state)}`);

  // Attempt the same pointer interaction a user would make. Native disabled
  // buttons ignore the click; force-clicking would hide a real operability bug.
  const benchmarkTab = page.locator('#tab-btn-benchmark');
  await benchmarkTab.scrollIntoViewIfNeeded();
  const tabBox = await benchmarkTab.boundingBox();
  assertCondition(tabBox && tabBox.width > 0 && tabBox.height > 0, 'Disabled Benchmark tab has no clickable geometry');
  await page.mouse.click(tabBox.x + tabBox.width / 2, tabBox.y + tabBox.height / 2);
  const afterClick = await getBenchmarkState(page);
  assertCondition(afterClick.tabDisabled && !afterClick.tabActive, `Disabled Benchmark click changed tab state: ${JSON.stringify(afterClick)}`);
  assertCondition(!afterClick.hasResultNodes && !afterClick.metrics, `Disabled Benchmark click exposed results or metrics: ${JSON.stringify(afterClick)}`);

  // A valid fresh run must restore availability and make the tab genuinely usable.
  await page.fill('#input-seq-x', 'ACGT');
  await page.fill('#input-seq-y', 'AGT');
  await page.click('#btn-run');
  await waitForToast(page, '.toast-success');
  await page.waitForFunction(() => {
    const tab = document.querySelector('#tab-btn-benchmark');
    return Boolean(tab && !tab.disabled && !tab.classList.contains('tab-btn-disabled'));
  }, null, { timeout: 5000 });
  await benchmarkTab.click();
  await page.waitForFunction(() => document.querySelector('#tab-btn-benchmark')?.classList.contains('active'), null, { timeout: 2000 });
  await page.waitForFunction(() => Boolean(document.querySelector('#benchmark-container .benchmark-grid')), null, { timeout: 5000 });
}

async function waitForStableTabGeometry(page, selector) {
  await page.waitForFunction((tabSelector) => {
    const tab = document.querySelector(tabSelector);
    if (!tab) return false;
    const rect = tab.getBoundingClientRect();
    const style = getComputedStyle(tab);
    return !tab.disabled && !tab.classList.contains('tab-btn-disabled') &&
      style.display !== 'none' && style.visibility !== 'hidden' &&
      rect.width > 0 && rect.height > 0 &&
      rect.left >= -1 && rect.top >= -1 &&
      rect.right <= window.innerWidth + 1 && rect.bottom <= window.innerHeight + 1;
  }, selector, { timeout: 5000, polling: STABILITY_POLL_MS });

  await page.waitForFunction(({ tabSelector, windowMs }) => {
    const tab = document.querySelector(tabSelector);
    if (!tab) return false;
    const rect = tab.getBoundingClientRect();
    const state = {
      disabled: tab.disabled,
      className: tab.className,
      text: tab.textContent,
      left: Math.round(rect.left * 100) / 100,
      top: Math.round(rect.top * 100) / 100,
      width: Math.round(rect.width * 100) / 100,
      height: Math.round(rect.height * 100) / 100
    };
    const tracker = window.__bioLcsTabStability || (window.__bioLcsTabStability = {});
    const previous = tracker[tabSelector];
    if (!previous || previous.key !== JSON.stringify(state)) {
      tracker[tabSelector] = { key: JSON.stringify(state), firstObserved: performance.now(), samples: 1 };
      return false;
    }
    previous.samples += 1;
    return previous.samples >= 3 && performance.now() - previous.firstObserved >= windowMs;
  }, { tabSelector: selector, windowMs: STABILITY_WINDOW_MS }, { timeout: STABILITY_TIMEOUT_MS, polling: STABILITY_POLL_MS });
}

async function assertNoHorizontalOverflow(page, label) {
  const sizes = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    htmlClientWidth: document.documentElement.clientWidth,
    htmlScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth
  }));
  assertCondition(
    sizes.htmlScrollWidth <= sizes.htmlClientWidth && sizes.bodyScrollWidth <= sizes.htmlClientWidth,
    `${label} has horizontal overflow: ${JSON.stringify(sizes)}`
  );
}

async function assertTextFitsOrEllipsizes(page, selector, label) {
  const states = await page.locator(selector).evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const actualOverflow = element.scrollWidth > element.clientWidth;
    const ellipsisSemantics = actualOverflow && element.clientWidth > 0 &&
      ['hidden', 'clip'].includes(style.overflowX) &&
      style.textOverflow === 'ellipsis' && style.whiteSpace === 'nowrap';
    return {
      text: element.textContent?.trim() || '',
      left: rect.left,
      right: rect.right,
      width: rect.width,
      height: rect.height,
      viewportWidth: window.innerWidth,
      actualOverflow,
      ellipsisSemantics,
      overflowX: style.overflowX,
      textOverflow: style.textOverflow,
      whiteSpace: style.whiteSpace,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth
    };
  }));
  assertCondition(states.length > 0, `${label} is missing`);
  states.forEach((state, index) => {
    const withinViewport = state.width > 0 && state.height > 0 &&
      state.left >= -1 && state.right <= state.viewportWidth + 1;
    assertCondition(
      withinViewport || state.ellipsisSemantics,
      `${label}[${index}] neither fits viewport nor exposes actual ellipsis semantics: ${JSON.stringify(state)}`
    );
  });
}

async function runBenchmarkRaceCase(page) {
  await page.locator('#tab-btn-benchmark').click();
  await page.waitForFunction(() => document.querySelector('#tab-btn-benchmark')?.classList.contains('active'), null, { timeout: 2000 });
  await page.selectOption('#speed-select', '50');
  await page.selectOption('#benchmark-iter-select', '1');
  await page.click('#btn-re-benchmark');

  await page.waitForFunction(() => /^(?:DONE|HOÀN THÀNH)$/.test(
    document.querySelector('#race-phase-info')?.textContent?.trim() || ''
  ), null, { timeout: 5000 });

  const state = await page.evaluate(() => ({
    phase: document.querySelector('#race-phase-info')?.textContent?.trim() || '',
    step: document.querySelector('#race-step-info')?.textContent?.trim() || '',
    bars: ['#race-grid-bar', '#race-space-bar', '#race-hirsch-bar'].map((selector) => (
      document.querySelector(selector)?.style.width?.trim() || ''
    )),
    labels: ['#race-grid-stat', '#race-space-stat', '#race-hirsch-stat'].map((selector) => (
      document.querySelector(selector)?.textContent?.trim() || ''
    ))
  }));
  assertCondition(/^(?:DONE|HOÀN THÀNH)$/.test(state.phase), `Benchmark race did not finish: ${JSON.stringify(state)}`);
  assertCondition(/^(?:Step|Bước):\s*1\s*\/\s*1$/.test(state.step), `Benchmark race reported wrong completion step: ${JSON.stringify(state)}`);
  assertCondition(state.bars.length === 3 && state.bars.every((width) => width === '100%'), `Benchmark race bars did not finish at 100%: ${JSON.stringify(state)}`);
  assertCondition(
    state.labels.length === 3 && state.labels.every((label) => /(?:Done|Hoàn tất)/i.test(label) && !/0%|0\s*\/\s*0/.test(label)),
    `Benchmark race completion labels were incomplete: ${JSON.stringify(state)}`
  );
}

async function runSpecialDescriptionViewport(page, width, height) {
  await page.selectOption('#testcase-select', 'TC_05_01');
  await page.waitForFunction(() => {
    const select = document.querySelector('#testcase-select');
    const bioTag = document.querySelector('#bio-tag');
    const chip = document.querySelector('#benchmark-container .benchmark-context-chip');
    return select?.value === 'TC_05_01' && bioTag?.dataset.cat === '05_special' &&
      chip?.querySelector('.chip-badge')?.textContent?.trim() === 'TC_05_01';
  }, null, { timeout: 10000 });
  await page.waitForFunction(() => {
    const tab = document.querySelector('#tab-btn-benchmark');
    return Boolean(tab && !tab.disabled && !tab.classList.contains('tab-btn-disabled'));
  }, null, { timeout: 5000 });
  await page.locator('#tab-btn-benchmark').click();
  await page.waitForFunction(() => document.querySelector('#tab-btn-benchmark')?.classList.contains('active'), null, { timeout: 2000 });
  await assertNoHorizontalOverflow(page, `TC_05_01 at ${width}x${height}`);
  await assertTextFitsOrEllipsizes(page, '#bio-desc-text', 'Global testcase description');
  await assertTextFitsOrEllipsizes(page, '#benchmark-container .benchmark-context-chip .chip-desc', 'Benchmark chip description');
}

async function runEnglishAcademicModalCase(page) {
  await page.click('#lang-toggle');
  await page.waitForFunction(() => document.documentElement.lang === 'en' &&
    document.querySelector('#btn-close-academic-modal')?.getAttribute('aria-label') === 'Close' &&
    document.querySelector('#btn-close-academic-action')?.textContent?.trim() === 'Close', null, { timeout: 5000 });

  await page.click('#student-badge');
  await page.waitForFunction(() => document.querySelector('#modal-academic-info')?.style.display === 'flex', null, { timeout: 2000 });
  const closeButtons = page.getByRole('button', { name: 'Close', exact: true });
  assertCondition(await closeButtons.count() === 2, 'English academic modal did not expose two accessible Close buttons');

  const footerClose = page.locator('#btn-close-academic-action');
  await footerClose.click();
  await page.waitForFunction(() => document.querySelector('#modal-academic-info')?.style.display === 'none', null, { timeout: 2000 });

  await page.click('#student-badge');
  await page.waitForFunction(() => document.querySelector('#modal-academic-info')?.style.display === 'flex', null, { timeout: 2000 });
  const xClose = page.locator('#btn-close-academic-modal');
  assertCondition(await xClose.getAttribute('aria-label') === 'Close', 'English modal X close control lacks localized accessible name');
  await xClose.click();
  await page.waitForFunction(() => document.querySelector('#modal-academic-info')?.style.display === 'none', null, { timeout: 2000 });
}

async function runBrandReloadCase(page) {
  const brand = page.locator('#brand-reload');
  await brand.waitFor({ state: 'visible' });
  const beforeUrl = new URL(page.url());
  const state = await brand.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      tagName: element.tagName,
      href: element.getAttribute('href'),
      ariaLabel: element.getAttribute('aria-label'),
      tabIndex: element.tabIndex,
      visible: rect.width > 0 && rect.height > 0,
      withinViewport: rect.left >= -1 && rect.right <= window.innerWidth + 1 &&
        rect.top >= -1 && rect.bottom <= window.innerHeight + 1
    };
  });
  assertCondition(state.tagName === 'A', `Brand reload control is not a semantic link: ${JSON.stringify(state)}`);
  assertCondition(state.href === './index.html', `Brand reload href changed unexpectedly: ${JSON.stringify(state)}`);
  assertCondition(state.ariaLabel?.trim(), `Brand reload link has no accessible name: ${JSON.stringify(state)}`);
  assertCondition(state.tabIndex >= 0 && state.visible && state.withinViewport,
    `Brand reload link is not keyboard-visible: ${JSON.stringify(state)}`);

  await brand.focus();
  const focused = await page.evaluate(() => document.activeElement?.id === 'brand-reload');
  assertCondition(focused, 'Brand reload link could not receive keyboard focus');

  const loadPromise = page.waitForEvent('load', { timeout: 10000 });
  await brand.click();
  await loadPromise;
  await page.locator('#testcase-select').waitFor({ state: 'visible' });

  const afterUrl = new URL(page.url());
  assertCondition(afterUrl.origin === beforeUrl.origin && afterUrl.pathname === beforeUrl.pathname,
    `Brand click navigated away from the app: before=${beforeUrl.href}, after=${afterUrl.href}`);
}

async function runLocalizedLabelsCase(page) {
  await page.waitForFunction(() => document.documentElement.lang === 'vi' &&
    document.querySelector('#label-base-legend')?.textContent?.trim() === 'Nuclêôtit:' &&
    document.querySelector('#tab-genomic-label')?.textContent?.trim() === 'Phòng Genomics & Xoắn Kép 3D' &&
    document.querySelector('#tab-benchmark-label')?.textContent?.trim() === 'So Sánh Hiệu Năng', null,
  { timeout: 5000 });

  await page.locator('#lang-toggle').click();
  await page.waitForFunction(() => document.documentElement.lang === 'en' &&
    document.querySelector('#label-base-legend')?.textContent?.trim() === 'Nucleotides:' &&
    document.querySelector('#tab-genomic-label')?.textContent?.trim() === 'Genomic Lab & 3D Helix' &&
    document.querySelector('#tab-benchmark-label')?.textContent?.trim() === 'Benchmark Arena', null,
  { timeout: 5000 });

  await page.locator('#lang-toggle').click();
  await page.waitForFunction(() => document.documentElement.lang === 'vi' &&
    document.querySelector('#label-base-legend')?.textContent?.trim() === 'Nuclêôtit:' &&
    document.querySelector('#tab-genomic-label')?.textContent?.trim() === 'Phòng Genomics & Xoắn Kép 3D' &&
    document.querySelector('#tab-benchmark-label')?.textContent?.trim() === 'So Sánh Hiệu Năng', null,
  { timeout: 5000 });
}

async function runStickyTabsCase(page) {
  await page.setViewportSize({ width: 1280, height: 640 });
  await page.waitForFunction(() => window.innerWidth === 1280 && window.innerHeight === 640,
    null, { timeout: 2000, polling: STABILITY_POLL_MS });
  const state = await page.locator('.view-tabs').evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      position: style.position,
      top: style.top,
      rectTop: rect.top,
      rectBottom: rect.bottom,
      width: rect.width,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  });
  assertCondition(state.position === 'sticky', `View tabs are not sticky: ${JSON.stringify(state)}`);
  assertCondition(parseFloat(state.top) >= 0 && state.width > 0 && state.rectBottom <= state.viewportHeight + 1,
    `View tabs have invalid desktop geometry: ${JSON.stringify(state)}`);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => window.scrollY === 0, null, { timeout: 2000, polling: STABILITY_POLL_MS });
  const scrollTarget = await page.evaluate(() => Math.max(
    0,
    Math.min(window.innerHeight, document.documentElement.scrollHeight - window.innerHeight)
  ));
  assertCondition(scrollTarget > 0, 'Desktop workspace has no scrollable content for sticky-tab verification');

  const topOffset = parseFloat(state.top);
  await page.evaluate((target) => window.scrollTo(0, target), scrollTarget);
  try {
    await page.waitForFunction(({ offset }) => {
      const tabs = document.querySelector('.view-tabs');
      const header = document.querySelector('.app-header');
      if (!tabs || !header || window.scrollY <= 0) return false;
      const tabsRect = tabs.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      return getComputedStyle(tabs).position === 'sticky' &&
        Math.abs(tabsRect.top - offset) <= 2 &&
        tabsRect.top >= headerRect.bottom - 1 &&
        tabsRect.bottom <= window.innerHeight + 1;
    }, { offset: topOffset }, { timeout: 5000, polling: STABILITY_POLL_MS });
  } catch {
    const debugState = await page.evaluate(() => {
      const tabs = document.querySelector('.view-tabs');
      const header = document.querySelector('.app-header');
      const tabsRect = tabs?.getBoundingClientRect();
      const headerRect = header?.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        tabsTop: tabsRect?.top,
        tabsBottom: tabsRect?.bottom,
        headerTop: headerRect?.top,
        headerBottom: headerRect?.bottom,
        viewportHeight: window.innerHeight,
        position: tabs ? getComputedStyle(tabs).position : 'missing'
      };
    });
    throw new Error(`Sticky tabs did not reach the scroll contract: ${JSON.stringify(debugState)}`);
  }

  const scrolledState = await page.evaluate(() => {
    const tabs = document.querySelector('.view-tabs');
    const header = document.querySelector('.app-header');
    const tabsRect = tabs.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    return {
      scrollY: window.scrollY,
      tabsTop: tabsRect.top,
      tabsBottom: tabsRect.bottom,
      headerBottom: headerRect.bottom,
      viewportHeight: window.innerHeight
    };
  });
  assertCondition(Math.abs(scrolledState.tabsTop - topOffset) <= 2,
    `View tabs did not stick below the header: ${JSON.stringify(scrolledState)}`);
  assertCondition(scrolledState.tabsTop >= scrolledState.headerBottom - 1 &&
    scrolledState.tabsBottom <= scrolledState.viewportHeight + 1,
  `Sticky tabs overlap the header or viewport edge: ${JSON.stringify(scrolledState)}`);
}

async function runSwapIconCase(page) {
  const geometry = await page.locator('#btn-swap svg').evaluate((svg) => {
    const paths = [...svg.querySelectorAll('path')].map((path) => {
      const box = path.getBBox();
      return { d: path.getAttribute('d') || '', width: box.width, height: box.height };
    });
    return {
      paths,
      lineCount: svg.querySelectorAll('line').length,
      polylineCount: svg.querySelectorAll('polyline').length,
      polygonCount: svg.querySelectorAll('polygon').length
    };
  });
  assertCondition(geometry.paths.length === 2 && geometry.lineCount === 0 &&
    geometry.polylineCount === 0 && geometry.polygonCount === 0,
  `Swap icon contains unexpected geometry: ${JSON.stringify(geometry)}`);
  assertCondition(geometry.paths.every((path) => path.width > path.height * 2 && /[hH]/.test(path.d)),
    `Swap icon paths are not clearly horizontal: ${JSON.stringify(geometry)}`);
  assertCondition(new Set(geometry.paths.map((path) => path.d)).size === 2,
    `Swap icon has duplicate path geometry: ${JSON.stringify(geometry)}`);

  await page.fill('#input-seq-x', 'ACGT');
  await page.fill('#input-seq-y', 'TGCA');
  await page.waitForFunction(() => document.querySelector('#input-seq-x')?.value === 'ACGT' &&
    document.querySelector('#input-seq-y')?.value === 'TGCA', null, { timeout: 2000 });
  await page.locator('#btn-swap').click();
  await page.waitForFunction(() => document.querySelector('#input-seq-x')?.value === 'TGCA' &&
    document.querySelector('#input-seq-y')?.value === 'ACGT', null, { timeout: 5000 });
}

async function runKeyboardSpeedShortcutsCase(page) {
  const speed = page.locator('#speed-select');
  await page.waitForFunction(() => {
    const title = document.querySelector('#speed-select')?.getAttribute('title') || '';
    return document.documentElement.lang === 'vi' && title.includes('[') && title.includes(']');
  }, null, { timeout: 5000 });

  await speed.selectOption('250');
  await page.locator('#brand-reload').focus();
  await page.keyboard.press('[');
  await page.waitForFunction(() => document.querySelector('#speed-select')?.value === '150' &&
    Number(window.app?.animController?.speed) === 150, null, { timeout: 2000 });

  await page.keyboard.press(']');
  await page.waitForFunction(() => document.querySelector('#speed-select')?.value === '250' &&
    Number(window.app?.animController?.speed) === 250, null, { timeout: 2000 });

  await page.locator('#input-seq-x').focus();
  await page.keyboard.press('[');
  const inputFocusedSpeed = await speed.inputValue();
  assertCondition(inputFocusedSpeed === '250', `Input-focused [ shortcut changed speed: ${inputFocusedSpeed}`);

  await speed.focus();
  await page.keyboard.press(']');
  const selectFocusedSpeed = await speed.inputValue();
  assertCondition(selectFocusedSpeed === '250', `Select-focused ] shortcut changed speed: ${selectFocusedSpeed}`);
}

async function runMobileOverflowCase(page) {
  for (const viewport of [{ width: 375, height: 844 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    await page.waitForFunction(({ width, height }) => window.innerWidth === width && window.innerHeight === height,
      viewport, { timeout: 2000, polling: STABILITY_POLL_MS });
    await assertNoHorizontalOverflow(page, `BioLCS at ${viewport.width}px`);
  }
}

async function assertHitTestable(page, selector, label) {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'attached' });
  await locator.scrollIntoViewIfNeeded();
  const geometry = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      hit: hit === element || element.contains(hit)
    };
  });
  assertCondition(geometry.width > 0 && geometry.height > 0, `${label} has no hit area: ${JSON.stringify(geometry)}`);
  assertCondition(
    geometry.left >= -1 && geometry.top >= -1 &&
    geometry.right <= geometry.viewportWidth + 1 && geometry.bottom <= geometry.viewportHeight + 1,
    `${label} is outside the viewport: ${JSON.stringify(geometry)}`
  );
  assertCondition(geometry.hit, `${label} center is not hit-testable: ${JSON.stringify(geometry)}`);
}

async function runMobileViewport(page, width, height) {
  const errors = [];
  const check = async (label, action) => {
    try {
      await action();
    } catch (error) {
      errors.push(`${label}: ${error.message}`);
    }
  };

  await check('document overflow', async () => {
    await assertNoHorizontalOverflow(page, `Horizontal overflow at ${width}x${height}`);
  });

  for (const tab of [
    ['#tab-btn-matrix', 'Matrix tab'],
    ['#tab-btn-genomic', 'Genomic tab'],
    ['#tab-btn-benchmark', 'Benchmark tab']
  ]) {
    await check(tab[1], async () => {
      const locator = page.locator(tab[0]);
      await locator.scrollIntoViewIfNeeded();
      await waitForStableTabGeometry(page, tab[0]);
      await assertHitTestable(page, tab[0], tab[1]);
      await locator.click();
      await page.waitForFunction((selector) => document.querySelector(selector)?.classList.contains('active'), tab[0], { timeout: 2000 });
    });
  }

  for (const control of [
    ['#btn-reset', 'Reset button'],
    ['#btn-prev', 'Previous button'],
    ['#btn-play', 'Play button'],
    ['#btn-next', 'Next button'],
    ['#timeline-slider', 'Timeline slider'],
    ['#speed-select', 'Speed selector']
  ]) {
    await check(`${control[1]} hit testing`, () => assertHitTestable(page, control[0], control[1]));
  }

  await check('timeline controls state transitions', async () => {
    const matrixTab = page.locator('#tab-btn-matrix');
    await matrixTab.scrollIntoViewIfNeeded();
    await waitForStableTabGeometry(page, '#tab-btn-matrix');
    await matrixTab.click();
    await page.waitForFunction(() => document.querySelector('#tab-btn-matrix')?.classList.contains('active'), null, { timeout: 2000 });
    const speed = page.locator('#speed-select');
    await speed.scrollIntoViewIfNeeded();
    await speed.selectOption('50');
    const max = Number(await page.locator('#timeline-slider').getAttribute('max'));
    assertCondition(max > 1, `Timeline did not load a usable sequence at ${width}x${height}: max=${max}`);

    const reset = page.locator('#btn-reset');
    await reset.scrollIntoViewIfNeeded();
    await reset.click();
    await page.waitForFunction(() => Number(document.querySelector('#timeline-slider')?.value || 0) === 0, null, { timeout: 2000 });

    const next = page.locator('#btn-next');
    await next.scrollIntoViewIfNeeded();
    await next.click();
    await page.waitForFunction(() => Number(document.querySelector('#timeline-slider')?.value || 0) === 1, null, { timeout: 2000 });

    const play = page.locator('#btn-play');
    await play.scrollIntoViewIfNeeded();
    await play.click();
    await page.waitForFunction(() => Number(document.querySelector('#timeline-slider')?.value || 0) > 1, null, { timeout: 2000 });
    await play.click();
    await page.waitForFunction(() => !/(?:Tạm dừng|Pause)/i.test(document.querySelector('#btn-play-text')?.textContent || ''), null, { timeout: 2000 });

    await reset.scrollIntoViewIfNeeded();
    await reset.click();
    await page.waitForFunction(() => Number(document.querySelector('#timeline-slider')?.value || 0) === 0, null, { timeout: 2000 });
  });

  if (errors.length > 0) {
    throw new Error(`${width}x${height} reported ${errors.length} issue(s):\n- ${errors.join('\n- ')}`);
  }
}

async function runScenario(browser, baseUrl, name, viewport, action, captureFailure) {
  let context;
  let page;
  let result = { name, passed: false, message: '' };
  const consoleErrors = [];
  const pageErrors = [];
  try {
    context = await browser.newContext({ viewport });
    page = await context.newPage();
    page.setDefaultTimeout(5000);
    page.setDefaultNavigationTimeout(10000);
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.baseURL = baseUrl;
    await waitForApp(page);
    await action(page);
    const errors = runtimeErrors(consoleErrors, pageErrors);
    if (errors.length > 0) throw new Error(errors.join('\n'));
    result = { name, passed: true, message: '' };
  } catch (error) {
    const messages = [error.message];
    const errors = runtimeErrors(consoleErrors, pageErrors);
    if (errors.length > 0 && !messages.some((message) => message.includes(errors[0]))) messages.push(...errors);
    result = { name, passed: false, message: messages.join('\n') };
    if (page) {
      try {
        result.screenshot = await captureFailure(page, name);
      } catch (screenshotError) {
        result.message += `\nFailure screenshot unavailable: ${screenshotError.message}`;
      }
    }
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (error) {
        result.passed = false;
        result.message += `\nPage cleanup failed: ${error.message}`;
      }
    }
    if (context) {
      try {
        await context.close();
      } catch (error) {
        result.passed = false;
        result.message += `\nContext cleanup failed: ${error.message}`;
      }
    }
  }
  return result;
}

async function main() {
  let server;
  let browser;
  let artifactDir;
  const failures = [];
  const captureFailure = async (page, name) => {
    artifactDir ||= await fs.promises.mkdtemp(path.join(os.tmpdir(), 'biolcs-regressions-'));
    const filename = `${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
    const screenshot = path.join(artifactDir, filename);
    await page.screenshot({ path: screenshot, fullPage: false });
    return screenshot;
  };

  try {
    server = await createStaticServer(SRC_DIR);
    const baseUrl = serverUrl(server);
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader']
    });

    const desktop = { width: 1280, height: 900 };
    const cases = [
      ['space-optimized-length-only', desktop, runSpaceOptimizedCase],
      ['invalid-stops-and-clears-timeline', desktop, runInvalidTimelineCase],
      ['invalid-does-not-benchmark', desktop, runInvalidBenchmarkCase],
      ['benchmark-race-completes-one-iteration', desktop, runBenchmarkRaceCase],
      ['english-academic-modal-close-controls', desktop, runEnglishAcademicModalCase],
      ['brand-reload-control', desktop, runBrandReloadCase],
      ['localized-labels-toggle-and-restore', desktop, runLocalizedLabelsCase],
      ['sticky-tabs-desktop', desktop, runStickyTabsCase],
      ['horizontal-swap-icon-and-click', desktop, runSwapIconCase],
      ['keyboard-speed-shortcuts-and-focus-guards', desktop, runKeyboardSpeedShortcutsCase],
      ['mobile-horizontal-overflow-375-and-320', desktop, runMobileOverflowCase]
    ];
    for (const [name, viewport, action] of cases) {
      const result = await runScenario(browser, baseUrl, name, viewport, action, captureFailure);
      if (result.passed) console.log(`PASS ${name}`);
      else {
        failures.push(result);
        console.error(`FAIL ${name}\n${result.message}`);
      }
    }

    const mobileResults = [];
    for (const viewport of [{ width: 375, height: 844 }, { width: 320, height: 568 }]) {
      const result = await runScenario(
        browser,
        baseUrl,
        `mobile-controls-operable-${viewport.width}x${viewport.height}`,
        viewport,
        (page) => runMobileViewport(page, viewport.width, viewport.height),
        captureFailure
      );
      mobileResults.push(result);
    }
    const mobileFailures = mobileResults.filter((result) => !result.passed);
    if (mobileFailures.length > 0) {
      failures.push({
        name: 'mobile-controls-operable',
        passed: false,
        message: mobileFailures.map((result) => `${result.name}:\n${result.message}`).join('\n')
      });
      mobileResults.forEach((result) => {
        if (!result.passed) console.error(`FAIL ${result.name}\n${result.message}`);
        else console.log(`PASS ${result.name}`);
      });
    } else {
      mobileResults.forEach((result) => console.log(`PASS ${result.name}`));
    }

    for (const viewport of [{ width: 375, height: 844 }, { width: 320, height: 568 }]) {
      const result = await runScenario(
        browser,
        baseUrl,
        `tc-05-01-description-overflow-${viewport.width}x${viewport.height}`,
        viewport,
        (page) => runSpecialDescriptionViewport(page, viewport.width, viewport.height),
        captureFailure
      );
      if (result.passed) console.log(`PASS ${result.name}`);
      else {
        failures.push(result);
        console.error(`FAIL ${result.name}\n${result.message}`);
      }
    }
  } catch (error) {
    failures.push({ name: 'runner-setup', passed: false, message: error.stack || error.message });
    console.error(`FAIL runner-setup\n${error.stack || error.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        failures.push({ name: 'browser-cleanup', passed: false, message: error.message });
      }
    }
    if (server && server.listening) {
      try {
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      } catch (error) {
        failures.push({ name: 'server-cleanup', passed: false, message: error.message });
      }
    }
    if (failures.length === 0 && artifactDir) await fs.promises.rm(artifactDir, { recursive: true, force: true });
  }

  console.log(`\nBioLCS regression result: ${failures.length === 0 ? 'PASS' : 'FAIL'} (${failures.length} named case failure(s))`);
  if (artifactDir && failures.length > 0) console.log(`Failure screenshots: ${artifactDir}`);
  if (failures.length > 0) {
    failures.forEach((failure) => console.log(`- ${failure.name}: ${failure.message}`));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
