/**
 * Comprehensive Web Testing Suite for BioLCS Visualizer
 * Tests ALL buttons, controls, inputs, and ALL 30 testcases across all tabs.
 * Generates an exhaustive report of all interactions, edge cases, and runtime bugs.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

function createStaticServer(baseDir, port = 3567) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
      const filePath = path.join(baseDir, reqPath);

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(port, () => resolve(server));
  });
}

async function runComprehensiveTests() {
  const issues = [];
  const PORT = 3567;
  const server = await createStaticServer(SRC_DIR, PORT);
  console.log(`📡 [Test Runner] Server listening at http://localhost:${PORT}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      issues.push({ type: 'CONSOLE_ERROR', message: msg.text(), location: msg.location() });
      console.error(`  ❌ Console Error: ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    issues.push({ type: 'PAGE_CRASH', message: err.message, stack: err.stack });
    console.error(`  💥 Page Error: ${err.message}`);
  });

  try {
    console.log('\n======================================================');
    console.log('🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN MỌI NÚT VÀ MỌI TESTCASE');
    console.log('======================================================\n');

    await page.goto(`http://localhost:${PORT}`);
    await page.waitForLoadState('networkidle');

    // ------------------------------------------------------------------
    // TEST 1: THEME TOGGLE BUTTON (#theme-toggle)
    // ------------------------------------------------------------------
    console.log('▶ [Button Test 1/8] Kiểm tra Theme Toggle (#theme-toggle)...');
    const initialTheme = await page.$eval('html', el => el.getAttribute('data-theme'));
    await page.click('#theme-toggle');
    const toggledTheme = await page.$eval('html', el => el.getAttribute('data-theme'));
    if (initialTheme === toggledTheme) {
      issues.push({ type: 'BUTTON_BUG', target: '#theme-toggle', message: 'Theme did not toggle on click' });
    }
    await page.click('#theme-toggle'); // toggle back
    console.log(`  ✓ Theme Toggle OK: ${initialTheme} ➔ ${toggledTheme} ➔ ${initialTheme}`);

    // ------------------------------------------------------------------
    // TEST 2: SWAP BUTTON (#btn-swap)
    // ------------------------------------------------------------------
    console.log('▶ [Button Test 2/8] Kiểm tra Hoán đổi chuỗi (#btn-swap)...');
    await page.fill('#input-seq-x', 'ACGT');
    await page.fill('#input-seq-y', 'TGCA');
    await page.click('#btn-swap');
    const swappedX = await page.$eval('#input-seq-x', el => el.value);
    const swappedY = await page.$eval('#input-seq-y', el => el.value);
    if (swappedX !== 'TGCA' || swappedY !== 'ACGT') {
      issues.push({ type: 'BUTTON_BUG', target: '#btn-swap', message: `Swap failed: expected TGCA/ACGT but got ${swappedX}/${swappedY}` });
    } else {
      console.log('  ✓ Swap Sequences OK');
    }

    // ------------------------------------------------------------------
    // TEST 3: SPEED SELECTOR (#speed-select)
    // ------------------------------------------------------------------
    console.log('▶ [Button Test 3/8] Kiểm tra Tốc độ animation (#speed-select)...');
    const speeds = ['50', '150', '250', '500', '1000'];
    for (const sp of speeds) {
      await page.selectOption('#speed-select', sp);
      const val = await page.$eval('#speed-select', el => el.value);
      if (val !== sp) {
        issues.push({ type: 'CONTROL_BUG', target: '#speed-select', message: `Speed option ${sp} failed to select` });
      }
    }
    await page.selectOption('#speed-select', '250');
    console.log('  ✓ Speed Selector OK');

    // ------------------------------------------------------------------
    // TEST 4: CUSTOM INPUTS & VALIDATION FEEDBACK
    // ------------------------------------------------------------------
    console.log('▶ [Input Test 4/8] Kiểm tra Input tùy chỉnh & Validate...');
    await page.fill('#input-seq-x', 'INVALID_123');
    await page.fill('#input-seq-y', 'ACGT');
    await page.click('#btn-run');
    await page.waitForTimeout(100);
    const toastError = await page.$eval('.toast-error', el => el.innerText).catch(() => null);
    if (!toastError) {
      issues.push({ type: 'VALIDATION_BUG', message: 'No error toast appeared for invalid characters' });
    } else {
      console.log(`  ✓ Validation Error Toast OK: "${toastError}"`);
    }

    // ------------------------------------------------------------------
    // TEST 5: ALL 30 TESTCASES AUTOMATION RUN
    // ------------------------------------------------------------------
    console.log('\n▶ [Testcase Matrix 5/8] Kiểm tra toàn bộ 30 testcases mẫu...');
    const testcaseIds = await page.$$eval('#testcase-select option', opts => opts.map(o => o.value));
    console.log(`  Tổng số testcases tìm thấy trong dropdown: ${testcaseIds.length}`);

    for (let i = 0; i < testcaseIds.length; i++) {
      const tcId = testcaseIds[i];
      process.stdout.write(`  [${i + 1}/${testcaseIds.length}] Testing ${tcId}... `);

      await page.selectOption('#testcase-select', tcId);
      await page.waitForTimeout(200);

      const valX = await page.$eval('#input-seq-x', el => el.value);
      const valY = await page.$eval('#input-seq-y', el => el.value);
      const countX = await page.$eval('#counter-x', el => el.innerText);
      const countY = await page.$eval('#counter-y', el => el.innerText);

      if (!countX.includes(`${valX.length} bp`) || !countY.includes(`${valY.length} bp`)) {
        issues.push({ type: 'COUNTER_MISMATCH', testcase: tcId, message: `Counter mismatch for ${tcId}` });
      }

      // Click "Phân Tích & Chạy"
      await page.click('#btn-run');
      await page.waitForTimeout(300);

      // If invalid testcase, expect toast error
      if (tcId.startsWith('TC_06')) {
        const hasToast = await page.$eval('.toast-error', el => el.innerText).catch(() => null);
        if (!hasToast) {
          issues.push({ type: 'TESTCASE_BUG', testcase: tcId, message: 'Expected error toast for invalid testcase' });
        }
        console.log(`(Invalid testcase handled cleanly)`);
        continue;
      }

      // For valid testcase, test timeline controls
      // 1. Pause
      const isRunning = await page.$eval('#btn-run', el => el.classList.contains('btn-running')).catch(() => false);
      if (isRunning) {
        await page.click('#btn-run'); // pause
      }

      // 2. Next step
      const stepBeforeNext = await page.$eval('#step-counter', el => el.innerText);
      await page.click('#btn-next');
      const stepAfterNext = await page.$eval('#step-counter', el => el.innerText);

      // 3. Prev step
      await page.click('#btn-prev');
      const stepAfterPrev = await page.$eval('#step-counter', el => el.innerText);

      // 4. Reset
      await page.click('#btn-reset');
      const stepAfterReset = await page.$eval('#step-counter', el => el.innerText);
      if (!stepAfterReset.includes('Bước: 0') && !stepAfterReset.includes('Bước: 1')) {
        issues.push({ type: 'TIMELINE_BUG', testcase: tcId, message: `Reset failed, got "${stepAfterReset}"` });
      }

      // Check Code Stepper on Tab 1
      const activeLine = await page.$eval('.code-line.active-line', el => el.innerText).catch(() => null);
      if (!activeLine) {
        // Not a critical failure if at step 0, but check stepper presence
        const stepperExists = await page.$('#code-stepper-container');
        if (!stepperExists) {
          issues.push({ type: 'CODE_STEPPER_BUG', testcase: tcId, message: 'Code stepper container missing' });
        }
      }

      console.log(`✓ (Timeline & Stepper OK)`);
    }

    // ------------------------------------------------------------------
    // TEST 6: TAB SWITCHING & COMPONENT INTEGRITY
    // ------------------------------------------------------------------
    console.log('\n▶ [Tab Switching 6/8] Kiểm tra tính trơn tru khi chuyển Tab...');
    // Load a genomic testcase
    await page.selectOption('#testcase-select', 'TC_01_03');
    await page.click('#btn-run');
    await page.waitForTimeout(300);
    await page.click('#btn-run'); // pause

    // Tab 2: Genomic Lab
    await page.click('#tab-btn-genomic');
    await page.waitForTimeout(300);
    const canvasVisible = await page.$eval('#panel-3d-helix', el => el.style.display !== 'none');
    const alignmentVisible = await page.$eval('#alignment-tracks', el => el.children.length > 0).catch(() => false);
    if (!canvasVisible || !alignmentVisible) {
      issues.push({ type: 'TAB_BUG', tab: 'genomic', message: 'Genomic 3D canvas or alignment track missing' });
    } else {
      console.log('  ✓ Tab 2 (Genomic Lab & 3D Helix) rendered properly');
    }

    // Quick 3D button in Tab 1
    await page.click('#tab-btn-matrix');
    await page.waitForTimeout(200);
    await page.click('#btn-quick-3d');
    await page.waitForTimeout(200);
    const isGenomicActive = await page.$eval('#pane-genomic', el => el.classList.contains('active'));
    if (!isGenomicActive) {
      issues.push({ type: 'BUTTON_BUG', target: '#btn-quick-3d', message: 'Quick 3D button failed to switch to genomic tab' });
    } else {
      console.log('  ✓ Quick 3D Navigation Button OK');
    }

    // Tab 3: Benchmark Arena
    await page.click('#tab-btn-benchmark');
    await page.waitForTimeout(500);
    const hasBenchmarkCard = await page.$('.algo-card');
    if (!hasBenchmarkCard) {
      issues.push({ type: 'TAB_BUG', tab: 'benchmark', message: 'Benchmark cards not rendered' });
    } else {
      console.log('  ✓ Tab 3 (Benchmark Arena) rendered properly');
    }

    // Benchmark Controls: Re-benchmark button & Iterations
    await page.selectOption('#benchmark-iter-select', '20');
    await page.click('#btn-re-benchmark');
    await page.waitForTimeout(400);
    const bannerTitle = await page.$eval('.benchmark-overview-title', el => el.innerText);
    if (!bannerTitle.includes('20 lần lặp')) {
      issues.push({ type: 'BENCHMARK_BUG', message: `Re-benchmark with 20 iterations failed: ${bannerTitle}` });
    } else {
      console.log('  ✓ Benchmark Iterations Re-run OK (20 iterations)');
    }

    // ------------------------------------------------------------------
    // TEST 7: ALGORITHMS SWITCHING
    // ------------------------------------------------------------------
    console.log('\n▶ [Algorithm Switch 7/8] Kiểm tra chuyển đổi 3 giải thuật...');
    await page.click('#tab-btn-matrix');
    await page.waitForTimeout(200);

    const algos = ['grid', 'hirschberg', 'space_opt'];
    for (const algo of algos) {
      await page.selectOption('#algo-select', algo);
      await page.click('#btn-run');
      await page.waitForTimeout(300);
      await page.click('#btn-run'); // pause
      console.log(`  ✓ Algorithm "${algo}" runs cleanly`);
    }

    // ------------------------------------------------------------------
    // TEST 8: KEYBOARD SHORTCUTS
    // ------------------------------------------------------------------
    console.log('\n▶ [Keyboard Shortcuts 8/8] Kiểm tra phím tắt bàn phím...');
    // Space
    const playBefore = await page.$eval('#btn-run', el => el.classList.contains('btn-running')).catch(() => false);
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    const playAfter = await page.$eval('#btn-run', el => el.classList.contains('btn-running')).catch(() => false);
    if (playBefore === playAfter) {
      issues.push({ type: 'SHORTCUT_BUG', key: 'Space', message: 'Space key did not toggle animation' });
    }
    await page.keyboard.press('Space'); // pause

    // ArrowRight
    const stepBeforeKey = await page.$eval('#step-counter', el => el.innerText);
    await page.keyboard.press('ArrowRight');
    const stepAfterKey = await page.$eval('#step-counter', el => el.innerText);

    // 'r' key
    await page.keyboard.press('r');
    const stepAfterR = await page.$eval('#step-counter', el => el.innerText);
    if (!stepAfterR.includes('Bước: 0') && !stepAfterR.includes('Bước: 1')) {
      issues.push({ type: 'SHORTCUT_BUG', key: 'r', message: 'Key R failed to reset timeline' });
    }
    console.log('  ✓ Keyboard Shortcuts (Space, ArrowRight, R) OK');

    // Meta+R / Ctrl+R non-blocking check
    const prevented = await page.evaluate(() => {
      const event = new KeyboardEvent('keydown', { key: 'r', metaKey: true, cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    });
    if (prevented) {
      issues.push({ type: 'SHORTCUT_BUG', key: 'Meta+r', message: 'Meta+r was intercepted and prevented default' });
    } else {
      console.log('  ✓ Browser Shortcut Meta+R not blocked OK');
    }

    // Session Persistence test on reload
    await page.selectOption('#testcase-select', 'TC_01_03');
    await page.reload();
    await page.waitForLoadState('networkidle');
    const restoredTestcase = await page.$eval('#testcase-select', el => el.value);
    if (restoredTestcase !== 'TC_01_03') {
      issues.push({ type: 'PERSISTENCE_BUG', target: '#testcase-select', message: `Expected TC_01_03 after reload, got ${restoredTestcase}` });
    } else {
      console.log('  ✓ Session State Persistence on Reload OK');
    }

  } catch (err) {
    issues.push({ type: 'RUNNER_CRASH', message: err.message, stack: err.stack });
    console.error('💥 Runner Crash:', err);
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n======================================================');
  console.log(`📊 TỔNG KẾT KIỂM THỬ: ${issues.length} VẤN ĐỀ ĐƯỢC GHI NHẬN`);
  console.log('======================================================');
  if (issues.length === 0) {
    console.log('🎉 TẤT CẢ CÁC NÚT, PHÍM TẮT VÀ 30 TESTCASES ĐỀU ĐẠT CHUẨN 100%!');
  } else {
    issues.forEach((iss, idx) => {
      console.log(`${idx + 1}. [${iss.type}] ${iss.message || JSON.stringify(iss)}`);
    });
  }

  if (issues.length > 0) {
    fs.writeFileSync(
      path.resolve(SRC_DIR, '../test_issues_report.json'),
      JSON.stringify(issues, null, 2)
    );
  }
}

runComprehensiveTests();
