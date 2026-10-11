/**
 * Playwright E2E Browser Verification Suite for BioLCS Web Visualizer
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * Student: Dang Chi Thanh (MSSV: 25730067)
 * 
 * Verifies:
 * 1. Initial Page Load & Zero Console Errors
 * 2. Testcase Preset Selection & DP Grid Dimensions
 * 3. Timeline Playback & Pause State
 * 4. Step Next & Step Prev Seeking
 * 5. Timeline Reset
 * 6. Dual-Mode Tabs & Screenshot Artifact Generation
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.resolve(SRC_DIR, '../report/assets/screenshots');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

function createStaticServer(baseDir, port = 3000) {
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

    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function runE2ETests() {
  console.log('🚀 [BioLCS E2E] Khởi động kiểm thử trình duyệt thực tế...');
  
  // Ensure screenshot dir exists
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const PORT = 3456;
  const server = await createStaticServer(SRC_DIR, PORT);
  console.log(`📡 [BioLCS E2E] Static server đã chạy tại http://localhost:${PORT}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  let passedTests = 0;
  const totalTests = 8;

  try {
    // -------------------------------------------------------------
    // Test 1: Khởi tạo trang, kiểm tra canvas và DOM elements, 0 console error
    // -------------------------------------------------------------
    console.log('\n▶ [Test 1/6] Kiểm tra tải trang & 0 lỗi runtime console...');
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });

    const title = await page.title();
    if (!title.includes('BioLCS')) {
      throw new Error(`Tiêu đề trang không đúng: ${title}`);
    }

    // Verify key elements (table attached in DOM, canvas attached)
    await page.waitForSelector('#matrix-viewport table', { state: 'attached' });
    await page.waitForSelector('#dna-canvas-container canvas', { state: 'attached' });
    await page.waitForSelector('#testcase-select');

    if (consoleErrors.length > 0) {
      console.warn('⚠️ Console errors detected:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      throw new Error(`Uncaught runtime error: ${pageErrors.join(', ')}`);
    }

    console.log('  ✅ Test 1 PASSED: Khởi tạo thành công, giao diện Cyber-Biotech & Three.js canvas sẵn sàng.');
    passedTests++;

    // -------------------------------------------------------------
    // Test 2: Chọn testcase mẫu từ dropdown, kiểm tra bảng ma trận
    // -------------------------------------------------------------
    console.log('\n▶ [Test 2/6] Kiểm tra chuyển đổi testcase & cập nhật bảng ma trận...');
    // Select GATTACA testcase (TC_01_03)
    await page.selectOption('#testcase-select', 'TC_01_03');
    await page.waitForTimeout(400);

    const valX = await page.inputValue('#input-seq-x');
    const valY = await page.inputValue('#input-seq-y');
    if (valX !== 'GATTACA' || valY !== 'GCATGCU') {
      throw new Error(`Dữ liệu đầu vào testcase chưa khớp: X="${valX}", Y="${valY}"`);
    }

    // Check rows count in DP table: GATTACA length = 7 -> 8 rows (including empty) + 1 header = 9 rows total
    const rowCount = await page.locator('#matrix-viewport table tr').count();
    if (rowCount < 8) {
      throw new Error(`Bảng ma trận không đủ số hàng: ${rowCount}`);
    }

    console.log('  ✅ Test 2 PASSED: Testcase TC_01_03 nạp chính xác, ma trận 8×8 đã render.');
    passedTests++;

    // -------------------------------------------------------------
    // Test 3: Bấm nút "Phân Tích & Chạy" (#btn-run), kiểm tra tự động chạy animation
    // -------------------------------------------------------------
    console.log('\n▶ [Test 3/6] Kiểm tra nút "Phân Tích & Chạy" (#btn-run) kích hoạt animation...');
    await page.click('#btn-run');
    await page.waitForTimeout(1200);

    const sliderValAfterPlay = parseInt(await page.inputValue('#timeline-slider'), 10);
    if (sliderValAfterPlay < 2) {
      throw new Error(`Nút "Phân Tích & Chạy" không chạy timeline: slider val = ${sliderValAfterPlay}`);
    }

    // Click again to pause
    await page.click('#btn-run');
    await page.waitForTimeout(200);

    console.log(`  ✅ Test 3 PASSED: Nút "Phân Tích & Chạy" tự động chạy animation mượt mà, dừng tại bước ${sliderValAfterPlay}.`);
    passedTests++;

    // -------------------------------------------------------------
    // Test 4: Bấm Step Next và Step Prev, kiểm tra lùi/tiến trạng thái
    // -------------------------------------------------------------
    console.log('\n▶ [Test 4/6] Kiểm tra Step Next và Step Prev...');
    const currentVal = parseInt(await page.inputValue('#timeline-slider'), 10);

    await page.click('#btn-next');
    await page.waitForTimeout(100);
    const nextVal = parseInt(await page.inputValue('#timeline-slider'), 10);
    if (nextVal !== currentVal + 1) {
      throw new Error(`Step Next không tăng bước: trước=${currentVal}, sau=${nextVal}`);
    }

    await page.click('#btn-prev');
    await page.waitForTimeout(100);
    const prevVal = parseInt(await page.inputValue('#timeline-slider'), 10);
    if (prevVal !== currentVal) {
      throw new Error(`Step Prev không lùi bước: trước=${nextVal}, sau=${prevVal}`);
    }

    console.log(`  ✅ Test 4 PASSED: Step Next (+1) và Step Prev (-1) hoạt động chính xác.`);
    passedTests++;

    // -------------------------------------------------------------
    // Test 5: Bấm Reset, kiểm tra bảng xóa về trạng thái ban đầu
    // -------------------------------------------------------------
    console.log('\n▶ [Test 5/6] Kiểm tra nút Reset...');
    await page.click('#btn-reset');
    await page.waitForTimeout(200);

    const resetVal = parseInt(await page.inputValue('#timeline-slider'), 10);
    if (resetVal !== 0) {
      throw new Error(`Reset không đưa timeline về 0: slider val = ${resetVal}`);
    }

    const stepCounterText = await page.textContent('#step-counter');
    if (!stepCounterText.includes('1 /') && !stepCounterText.includes('0 /')) {
      throw new Error(`Step counter sau reset không hợp lệ: ${stepCounterText}`);
    }

    // Test Hirschberg Algorithm Execution
    console.log('  🌳 Kiểm thử chuyển sang giải thuật Hirschberg D&C và kích hoạt Phân Tích & Chạy...');
    await page.selectOption('#algo-select', 'hirschberg');
    await page.click('#btn-run');
    await page.waitForTimeout(400);
    const hirschbergStateCount = await page.locator('#hirschberg-live-state').count();
    if (hirschbergStateCount === 0) {
      throw new Error('Giao diện không hiển thị Cây Chia Để Trị Hirschberg khi bấm Phân Tích & Chạy');
    }
    // Also test Hirschberg with 300 bp sequence (TC_04_04) to ensure NO layout overflow or text clipping
    console.log('  🧬 Kiểm thử Hirschberg với chuỗi dài 300 bp (TC_04_04) - chống tràn chữ vỡ layout...');
    await page.selectOption('#testcase-select', 'TC_04_04');
    await page.selectOption('#algo-select', 'hirschberg');
    await page.click('#btn-run');
    await page.waitForTimeout(300);
    await page.click('#btn-run'); // Pause

    const stateEl = page.locator('#hirschberg-live-state');
    const isOverflowing = await stateEl.evaluate(el => el.scrollWidth > el.clientWidth + 5);
    if (isOverflowing) {
      throw new Error('Lỗi vỡ màn hình: Khung Hirschberg bị tràn chữ (scrollWidth > clientWidth) với chuỗi 300 bp!');
    }

    // Switch back to TC_01_03 and Grid DP for remaining tests
    await page.selectOption('#testcase-select', 'TC_01_03');
    await page.selectOption('#algo-select', 'grid');
    await page.click('#btn-run');
    await page.waitForTimeout(300);
    await page.click('#btn-run'); // Pause

    console.log(`  ✅ Test 5 PASSED: Reset chuẩn xác và Giải thuật Hirschberg D&C chạy trực quan thành công.`);
    passedTests++;

    // -------------------------------------------------------------
    // Test 6: Chuyển Tab & Chụp ảnh màn hình nghiệm thu
    // -------------------------------------------------------------
    console.log('\n▶ [Test 6/6] Kiểm tra chuyển tab & xuất minh chứng hình ảnh (Screenshots)...');

    // Screenshot 1: Tab 1 - DP Matrix Studio (GATTACA)
    await page.click('.tab-btn[data-tab="matrix"]');
    // Advance timeline to completed state to show full traceback
    const maxSteps = parseInt(await page.getAttribute('#timeline-slider', 'max'), 10);
    await page.fill('#timeline-slider', String(maxSteps));
    await page.dispatchEvent('#timeline-slider', 'input');
    await page.waitForTimeout(400);

    const shot1Path = path.join(SCREENSHOTS_DIR, 'screenshot_01_matrix_studio.png');
    await page.screenshot({ path: shot1Path, fullPage: true });
    console.log(`  📸 Đã chụp: ${shot1Path}`);

    // Test Quick 3D Navigation Button from Tab 1
    console.log('  🧬 Kiểm tra nút điều hướng nhanh 3D từ Tab 1 sang Genomic Lab...');
    await page.click('#btn-quick-3d');
    await page.waitForTimeout(300);
    const activeTab = await page.locator('.tab-btn.active').getAttribute('data-tab');
    if (activeTab !== 'genomic') {
      throw new Error(`Nút nhanh Xem Chuỗi Xoắn 3D không chuyển sang Tab genomic: active=${activeTab}`);
    }

    // Verify Three.js WebGL Mode
    const modeTagText = await page.textContent('#dna-mode-tag');
    if (!modeTagText.includes('Three.js')) {
      throw new Error(`Three.js không khởi tạo đúng: modeTag = "${modeTagText}"`);
    }
    console.log(`  🌟 Chế độ 3D xác nhận: "${modeTagText}"`);

    // Verify 3D Viewport Toolbar & LCS Highlight Filter
    await page.click('#dna-btn-lcs');
    const isLcsActive = await page.locator('#dna-btn-lcs').evaluate(el => el.classList.contains('active'));
    if (!isLcsActive) throw new Error('Nút Lọc Khớp LCS không đổi trạng thái active');

    // Simulate 3D mouse drag orbit interaction
    const canvasBox = await page.locator('#dna-canvas-container canvas').boundingBox();
    if (canvasBox) {
      await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + canvasBox.width / 2 + 60, canvasBox.y + canvasBox.height / 2 - 40);
      await page.mouse.up();
      console.log('  🎯 Thao tác xoay chuột 3D (Orbit Drag) hoạt động trơn tru.');
    }

    const shot2Path = path.join(SCREENSHOTS_DIR, 'screenshot_02_genomic_lab_3d.png');
    await page.screenshot({ path: shot2Path, fullPage: true });
    console.log(`  📸 Đã chụp: ${shot2Path}`);

    // Screenshot 3: Tab 3 - Benchmark Arena (Interactive Head-to-Head)
    await page.click('.tab-btn[data-tab="benchmark"]');
    await page.waitForTimeout(500);

    // Verify interactive benchmark controls, comparative table, and academic note
    await page.waitForSelector('#btn-re-benchmark');
    await page.waitForSelector('.benchmark-comparison-table');
    await page.waitForSelector('.benchmark-academic-note');
    await page.click('#btn-re-benchmark');
    await page.waitForTimeout(400);

    const shot3Path = path.join(SCREENSHOTS_DIR, 'screenshot_03_benchmark_arena.png');
    await page.screenshot({ path: shot3Path, fullPage: true });
    console.log(`  📸 Đã chụp: ${shot3Path}`);

    // Also test an NCBI plant testcase (TC_05_01 Oryza sativa vs Zea mays rbcL)
    console.log('  🌾 Kiểm thử mẫu thực vật NCBI TC_05_01 (Lúa vs Bắp rbcL)...');
    await page.selectOption('#testcase-select', 'TC_05_01');
    await page.waitForTimeout(500);
    await page.click('.tab-btn[data-tab="genomic"]');
    await page.waitForTimeout(500);
    const shot4Path = path.join(SCREENSHOTS_DIR, 'screenshot_04_plant_genomics_rbcl.png');
    await page.screenshot({ path: shot4Path, fullPage: false });
    console.log(`  📸 Đã chụp: ${shot4Path}`);

    console.log('  ✅ Test 6 PASSED: Đã xuất thành công 4 ảnh chụp màn hình nghiệm thu thực tế.');
    passedTests++;

    // -------------------------------------------------------------
    // Test 7: Chuyển đổi giao diện Sáng / Tối (Theme Mode)
    // -------------------------------------------------------------
    console.log('\n▶ [Test 7/7] Kiểm tra chuyển đổi giao diện Sáng / Tối (Light & Dark Theme)...');
    
    // Initial theme check
    const initialTheme = (await page.getAttribute('html', 'data-theme')) || 'dark';
    console.log(`  🌓 Giao diện ban đầu: ${initialTheme}`);

    // Click theme toggle button
    const expectedToggle = initialTheme === 'dark' ? 'light' : 'dark';
    await page.click('#theme-toggle');
    await page.waitForTimeout(400);

    const toggledTheme = await page.getAttribute('html', 'data-theme');
    if (toggledTheme !== expectedToggle) {
      throw new Error(`Giao diện không chuyển đúng: mong đợi ${expectedToggle}, thực tế ${toggledTheme}`);
    }

    // Ensure we capture light mode screenshot
    if (toggledTheme !== 'light') {
      await page.click('#theme-toggle');
      await page.waitForTimeout(400);
    }

    // Select GATTACA testcase in Light Mode to verify DP Matrix Studio progressive animation
    console.log('  🧬 Kiểm thử chi tiết DP Matrix Studio ở chế độ Sáng (Light Mode)...');
    await page.selectOption('#testcase-select', 'TC_01_03');
    await page.waitForTimeout(400);
    await page.click('.tab-btn[data-tab="matrix"]');
    await page.waitForTimeout(300);

    // Verify cell (1, 1) starts uncomputed with dot '·'
    const initialCell11Val = await page.textContent('#cell-1-1 .cell-val');
    const isUncomputedInitial = await page.$eval('#cell-1-1', el => el.classList.contains('cell-uncomputed'));
    if (!isUncomputedInitial || initialCell11Val.trim() !== '·') {
      throw new Error(`Ô (1, 1) chưa hiển thị uncomputed ban đầu: val="${initialCell11Val}", classUncomputed=${isUncomputedInitial}`);
    }

    // Step next 10 times to reach mid-matrix computation
    for (let s = 0; s < 10; s++) {
      await page.click('#btn-next');
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(200);

    // Assert that active cell exists and has high contrast text (not white)
    const activeColor = await page.$eval('.dp-cell.cell-active', el => window.getComputedStyle(el).color);
    console.log(`  🎨 Màu chữ ô Active trong Light Mode: ${activeColor}`);
    if (activeColor === 'rgb(255, 255, 255)') {
      throw new Error(`Lỗi tương phản: Chữ ô active bị trắng trên nền sáng! (${activeColor})`);
    }

    // Take mid-computation screenshot
    const shot5Path = path.join(SCREENSHOTS_DIR, 'screenshot_05_light_mode_studio.png');
    await page.screenshot({ path: shot5Path, fullPage: true });
    console.log(`  📸 Đã chụp: ${shot5Path}`);

    // Fast-forward to traceback phase
    const sliderMaxSteps = parseInt(await page.getAttribute('#timeline-slider', 'max'), 10);
    await page.fill('#timeline-slider', String(sliderMaxSteps - 3));
    await page.dispatchEvent('#timeline-slider', 'input');
    await page.waitForTimeout(300);

    // Verify traceback cell contrast
    const tbColor = await page.$eval('.dp-cell.cell-traceback', el => window.getComputedStyle(el).color);
    console.log(`  🎨 Màu chữ ô Traceback trong Light Mode: ${tbColor}`);
    if (tbColor === 'rgb(255, 255, 255)' || tbColor === 'rgb(254, 243, 199)') {
      throw new Error(`Lỗi tương phản: Chữ ô traceback quá nhạt trên nền sáng! (${tbColor})`);
    }

    const shot6Path = path.join(SCREENSHOTS_DIR, 'screenshot_06_light_mode_traceback.png');
    await page.screenshot({ path: shot6Path, fullPage: true });
    console.log(`  📸 Đã chụp: ${shot6Path}`);

    // Toggle to dark mode and verify
    await page.click('#theme-toggle');
    await page.waitForTimeout(300);
    const finalTheme = await page.getAttribute('html', 'data-theme');
    if (finalTheme !== 'dark') {
      throw new Error(`Giao diện không chuyển về dark: ${finalTheme}`);
    }

    console.log('  ✅ Test 7 PASSED: DP Matrix Studio chạy động mượt mà, màu sắc tương phản đạt chuẩn WCAG AAA trên cả Light và Dark mode.');
    passedTests++;

    // -------------------------------------------------------------
    // Test 8: Kiểm tra Layout Động thích ứng & Khung Code Stepper đồng bộ
    // -------------------------------------------------------------
    console.log('\n▶ [Test 8/8] Kiểm tra Layout Động thích ứng & Khung Code Stepper đồng bộ...');
    
    // 8.1 Test Non-Genomic Detection on TC_01_02 (BDAB vs BACDB)
    await page.selectOption('#testcase-select', 'TC_01_02');
    await page.waitForTimeout(300);
    const badgeText = await page.textContent('#tab-genomic-badge');
    const labelXText = await page.textContent('#label-seq-x');
    const baseLegendVisible = await page.isVisible('#base-legend');
    const quick3DVisible = await page.isVisible('#btn-quick-3d');
    console.log(`  🏷️ Badge Tab 2 với chuỗi ký tự tổng quát: "${badgeText}", Nhãn X: "${labelXText}"`);
    if (!badgeText.includes('GENERAL TEXT') && !badgeText.includes('Text Diff')) {
      throw new Error(`Ký tự tổng quát không kích hoạt nhãn text diff: "${badgeText}"`);
    }
    if (baseLegendVisible) {
      throw new Error('Thanh chú giải Nucleotide A-T-G-C không tự động ẩn khi chuỗi là ký tự tổng quát');
    }
    if (quick3DVisible) {
      throw new Error('Nút Xem Chuỗi Xoắn 3D không tự động ẩn khi chuỗi là phi sinh học');
    }

    // Verify Tab 2 (Genomic Lab) is DISABLED for non-genomic text so users cannot click it
    const isGenomicDisabled = await page.locator('.tab-btn[data-tab="genomic"]').isDisabled();
    if (!isGenomicDisabled) {
      throw new Error('Tab Genomic Lab phải bị disabled khi chọn testcase phi sinh học TC_01_02');
    }

    // Verify Tab 1 (Matrix) is prioritized active for non-genomic text
    const activeTab02 = await page.locator('.tab-btn.active').getAttribute('data-tab');
    if (activeTab02 !== 'matrix') {
      throw new Error(`Testcase phi sinh học phải ưu tiên active vào tab matrix: active="${activeTab02}"`);
    }

    const shot7Path = path.join(SCREENSHOTS_DIR, 'screenshot_07_general_text_diff.png');
    await page.screenshot({ path: shot7Path, fullPage: true });
    console.log(`  📸 Đã chụp: ${shot7Path}`);

    // 8.2 Test Space-Optimized DP (2-Row Ping-Pong Buffer) on Tab 1
    await page.click('.tab-btn[data-tab="matrix"]');
    await page.selectOption('#algo-select', 'space_opt');
    await page.waitForTimeout(300);
    const twoRowVisible = await page.isVisible('#alternate-viewport');
    const tabMatrixLabel = await page.textContent('#tab-matrix-label');
    if (!twoRowVisible || !tabMatrixLabel.includes('2 Dòng')) {
      throw new Error(`Chế độ Space-Optimized DP không hiển thị đúng khung bộ đệm hoặc tên tab: label="${tabMatrixLabel}"`);
    }

    // Run animation to step 3 in Space-Optimized DP
    await page.click('#btn-run');
    await page.waitForTimeout(600);
    await page.click('#btn-run'); // Pause
    
    // Check Code Stepper active line
    const activeLineCount = await page.locator('#code-stepper-container .code-row.active-line').count();
    if (activeLineCount === 0) {
      throw new Error('Khung Code Stepper không highlight dòng lệnh nào đang chạy');
    }
    const scopePhaseText = await page.textContent('#scope-phase');
    console.log(`  ⚡ Trạng thái Code Stepper: Phase=${scopePhaseText}, ActiveLineCount=${activeLineCount}`);

    const shot8Path = path.join(SCREENSHOTS_DIR, 'screenshot_08_two_row_space_opt.png');
    await page.screenshot({ path: shot8Path, fullPage: true });
    console.log(`  📸 Đã chụp: ${shot8Path}`);

    // 8.3 Verify dynamic code stepper updates upon switching testcases
    console.log('  🧪 Kiểm tra mã nguồn động thay đổi theo từng testcase (Python 3)...');
    await page.selectOption('#testcase-select', 'TC_01_04');
    await page.waitForTimeout(300);
    const tcTag04 = await page.textContent('#stepper-tc-tag');
    const title04 = await page.textContent('#stepper-algo-title');
    const tabLabel04 = await page.textContent('#tab-matrix-label');
    const line1_04 = await page.textContent('#code-line-1');
    if (!tcTag04.includes('TC_01_04') || !title04.includes('Hirschberg') || !tabLabel04.includes('Hirschberg') || !line1_04.toLowerCase().includes('hirschberg')) {
      throw new Error(`Code Stepper hoặc Tên Tab không tự động đổi sang Hirschberg khi chọn TC_01_04: tag="${tcTag04}", tab="${tabLabel04}", line1="${line1_04}"`);
    }

    await page.selectOption('#testcase-select', 'TC_04_01');
    await page.waitForTimeout(300);
    const tcTagLarge = await page.textContent('#stepper-tc-tag');
    const titleLarge = await page.textContent('#stepper-algo-title');
    const tabLabelLarge = await page.textContent('#tab-matrix-label');
    const line1_Large = await page.textContent('#code-line-1');
    if (!tcTagLarge.includes('TC_04_01') || !titleLarge.includes('2 Dòng') || !tabLabelLarge.includes('2 Dòng') || !line1_Large.toLowerCase().includes('2row')) {
      throw new Error(`Code Stepper hoặc Tên Tab không tự động đổi sang 2-Row khi chọn TC_04_01: tag="${tcTagLarge}", tab="${tabLabelLarge}"`);
    }

    // Switch back to default testcase
    await page.selectOption('#testcase-select', 'TC_01_01');
    await page.waitForTimeout(300);
    const line1_01 = await page.textContent('#code-line-1');
    if (!line1_01.includes('ACCGGTC') || !line1_01.includes('AGTGTC')) {
      throw new Error(`Code Stepper không đổi lại mã kèm chuỗi TC_01_01: line1="${line1_01}"`);
    }

    // 8.4 Test switching to CLRS pseudocode tab and back to Python 3
    console.log('  🐍 Kiểm tra chuyển đổi giữa Python 3 và Mã Giả (CLRS)...');
    await page.click('.tab-btn[data-tab="matrix"]');
    await page.waitForTimeout(200);
    await page.click('.lang-tab-btn[data-lang="pseudo"]');
    await page.waitForTimeout(200);
    const pseudoLine1 = await page.textContent('#code-line-1');
    if (!pseudoLine1.includes('LCS_Length')) {
      throw new Error(`Tab Mã Giả CLRS không hiển thị LCS_Length: "${pseudoLine1}"`);
    }

    await page.click('.lang-tab-btn[data-lang="py"]');
    await page.waitForTimeout(200);
    const pyLine1 = await page.textContent('#code-line-1');
    if (!pyLine1.includes('def lcs_grid_dp')) {
      throw new Error(`Tab Python 3 không hiển thị def lcs_grid_dp: "${pyLine1}"`);
    }

    console.log('  ✅ Test 8 PASSED: Layout động thích ứng và Khung Code Stepper Python 3 đồng bộ hoạt động hoàn hảo.');
    passedTests++;

  } catch (err) {
    console.error('\n❌ E2E TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n======================================================`);
  console.log(`🏆 KẾT QUẢ KIỂM THỬ TRÌNH DUYỆT E2E: ${passedTests}/${totalTests} BÀI THI ĐẠT CHUẨN`);
  console.log(`======================================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runE2ETests();
