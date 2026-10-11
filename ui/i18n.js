/**
 * BioLCS Bilingual Internationalization (i18n) Engine
 * Supports seamless real-time switching between Vietnamese (vi) and English (en).
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * Student: Dang Chi Thanh (MSSV: 25730067)
 */

export const I18N = {
  vi: {
    // Header & Meta
    brandTitle: 'BioLCS Studio',
    brandTag: 'CS112',
    brandSubtitle: 'Theo dõi Đột biến Gen Thực vật & Bộ Giải thuật LCS',
    brandReloadTitle: 'Tải lại BioLCS Studio',
    studentName: 'Đặng Chí Thanh',
    studentId: 'MSSV: 25730067',
    studentClass: 'Lớp: CS112.F31.LT.TTNT',
    studentAdvisor: 'GVHD: TS. Huỳnh Thị Thanh Thương',
    studentUni: 'Khoa KHMT - UIT',
    studentBadgeTitle: 'Bấm để xem chi tiết thông tin đồ án & tác giả học thuật',
    modalAcademicTitle: 'Thông Tin Đồ Án & Tác Giả Học Thuật',
    modalAcademicSub: 'Trường Đại học Công nghệ Thông tin — ĐHQG-HCM (UIT)',
    modalLblAuthor: 'Sinh viên thực hiện:',
    modalLblId: 'Mã số sinh viên (MSSV):',
    modalLblClass: 'Mã lớp học phần:',
    modalLblCourse: 'Học phần môn học:',
    modalValCourse: 'Phân tích và Thiết kế Thuật toán (CS112)',
    modalLblAdvisor: 'Giảng viên hướng dẫn:',
    modalLblTopic: 'Đề tài Bài tập lớn:',
    modalValTopic: 'BioLCS — Nền Tảng Trực Quan Hóa Đa Giải Thuật So Khớp Hệ Gen Thực Vật & Đột Biến Di Truyền',
    modalLblLinks: 'Liên kết trực tuyến:',
    modalCopyright: '© 2026 Đặng Chí Thanh — MSSV: 25730067. Bản quyền phục vụ học phần CS112 tại UIT.',
    modalBtnClose: 'Đóng',
    themeToggleTitleLight: 'Chuyển sang chế độ Sáng (Light Mode)',
    themeToggleTitleDark: 'Chuyển sang chế độ Tối (Dark Mode)',
    langToggleTitle: 'Chuyển đổi ngôn ngữ (Tiếng Việt / English)',

    // Control Ribbon
    testcaseLabel: 'Bộ Testcase Mẫu (30 Chuẩn):',
    seqXGenomic: 'Chuỗi X (Bộ Gen 1):',
    seqXText: 'Chuỗi X (Chuỗi Ký Tự 1):',
    seqYGenomic: 'Chuỗi Y (Bộ Gen 2):',
    seqYText: 'Chuỗi Y (Chuỗi Ký Tự 2):',
    placeholderSeq: 'Ví dụ: ACCGGTC...',
    placeholderSeqY: 'Ví dụ: AGTGTC...',
    swapTitle: 'Hoán đổi 2 chuỗi (X ↔ Y)',
    algoLabel: 'Giải Thuật Thực Thi:',
    algoGrid: '1. Grid DP 2D (Toàn diện & Traceback)',
    algoHirschberg: '2. Hirschberg D&C (Tối ưu Bộ nhớ Tuyến tính)',
    algoSpaceOpt: '3. Space-Optimized DP (Bộ nhớ 2 Dòng O(min(M,N)))',
    btnRun: 'Phân Tích & Chạy',
    btnPause: 'Tạm Dừng',
    btnResume: 'Tiếp Tục',

    // Biological Context Bar
    bioLoading: 'Đang tải thông tin mẫu thực vật...',
    ntLabel: 'Nuclêôtit:',

    // Tabs
    tabMatrixGrid: 'Ma Trận DP 2D',
    tabMatrixHirschberg: 'Cây Chia Để Trị (Hirschberg)',
    tabMatrixSpaceOpt: 'Bộ Đệm 2 Dòng (Ping-Pong)',
    tabGenomic: 'Phòng Genomics & Xoắn Kép 3D',
    tabGenomicText: 'So Khớp Chuỗi & Diff',
    tabGenomicBadge: '3D WebGL',
    tabGenomicBadgeText: 'Text Diff',
    tabBenchmark: 'So Sánh Hiệu Năng',
    tabGenomicDisabledTitle: 'Vô hiệu hóa: Chuỗi không phải bộ gen sinh học (A, T, G, C, U)',

    // Visualizer Panel (Tab 1)
    matrixTitleGrid: 'Không Gian Ma Trận Quy Hoạch Động (m+1) × (n+1)',
    matrixTitleHirschberg: 'Thuật Toán Hirschberg (Chia Để Trị Tuyến Tính O(N))',
    matrixTitleSpaceOpt: 'Không Gian Bộ Đệm Quy Hoạch Động 2 Dòng (2 × n)',
    legendMatch: 'Khớp LCS (↖)',
    legendMatchTitle: 'Ký tự trùng khớp thực sự đưa vào chuỗi LCS (Match ↖)',
    legendSkip: 'Dịch chuyển (↑/←)',
    legendSkipTitle: 'Bước nhảy ma trận dịch hàng/cột (Skip ↑/←)',
    legendActive: 'Đang tính',
    legendActiveTitle: 'Ô hiện tại đang được tính toán',
    legendCompare: 'So sánh',
    legendCompareTitle: 'Các ô con đang được so sánh',
    btnQuick3D: '🧬 Xem Chuỗi Xoắn 3D →',
    btnQuick3DTitle: 'Chuyển nhanh sang Genomic Lab & Chuỗi Xoắn 3D',
    formulaReady: 'Khởi tạo ma trận...',
    stepStatusReady: 'Sẵn sàng',

    // Defensive Gateway / Input Validation Card
    defensiveBadge: 'LỚP BẢO VỆ ĐẦU VÀO',
    defensiveTitle: 'Kiểm Thử Ngoại Lệ & Cơ Chế Phòng Vệ Dữ Liệu',
    defensiveTcInvalid: 'DỮ LIỆU NGOẠI LỆ',
    defensiveViolationDetected: 'Vi phạm được phát hiện:',
    defensiveAcademicTitle: 'Ý nghĩa học thuật (Đặc tả BTL CS112 §6):',
    defensiveAcademicDesc: 'Chứng minh tính bền bỉ của hệ thống trước dữ liệu sinh học bị lỗi. Chuỗi không hợp lệ được chặn an toàn trước khi cấp phát bộ nhớ ma trận, ngăn ngừa tình trạng treo trình duyệt hoặc lỗi tràn RAM.',
    defensiveBtnSanitize: 'Tự Động Làm Sạch & Chạy Minh Họa',
    defensiveFormulaHint: 'Hệ thống đã nhận diện và chặn chuỗi lỗi. Nhấn <strong>Tự Động Làm Sạch & Chạy</strong> để xem sửa lỗi tự động.',
    defensiveDefaultReason: 'Phát hiện dữ liệu nucleotide không hợp lệ hoặc vượt ngưỡng an toàn.',

    // Genomic Lab (Tab 2)
    nonGenomicTitle: 'Chế Độ Đối Sánh Chuỗi Ký Tự Tổng Quát (General String Matching)',
    nonGenomicReason: 'Bộ dữ liệu hiện tại không phải chuỗi nucleotide sinh học (A, T, G, C, U). Mô hình chuỗi xoắn kép 3D được ẩn đi để đảm bảo tính chuẩn xác khoa học. Bạn có thể xem bảng đối sánh và thống kê độ tương đồng ký tự bên dưới.',
    dna3DTitle: 'Mô Hình 3D Chuỗi Xoắn Kép DNA (Three.js)',
    dna3DHint: 'Tự động quay & Bừng sáng khi Match',
    alignmentTitle: 'Dải Gióng Hàng & Thống Kê Biến Dị Di Truyền',
    alignEmpty: 'Chưa có dữ liệu gióng hàng chuỗi.',
    alignReady: 'SẴN SÀNG GIÓNG HÀNG',
    alignTotalPos: 'Tổng số vị trí:',
    alignTrackX: 'Chuỗi X (Gen 1):',
    alignTrackMid: 'Tương đồng:',
    alignTrackY: 'Chuỗi Y (Gen 2):',
    statLcsLength: 'Độ dài LCS (Trùng khớp)',
    statSimilarity: 'Tỷ lệ tương đồng',
    statDeletions: 'Mất đoạn (Deletions)',
    statInsertions: 'Chèn đoạn (Insertions)',
    bioInsightTitle: 'Nhận định sinh học tiến hóa:',
    bioInsightHigh: 'Độ tương đồng rất cao (High Conservation). Vùng gen mã hóa chức năng được bảo tồn chặt chẽ giữa hai loài thực vật.',
    bioInsightMedium: 'Tương đồng trung bình (Homology). Có sự tích lũy của các đột biến thay thế và chèn/mất đoạn (Indels).',
    bioInsightLow: 'Trình tự có mức phân kỳ cao (High Divergence). Tồn tại nhiều biến dị cấu trúc lớn.',

    // Benchmark Arena (Tab 3)
    benchmarkTitle: 'Đối Đầu Hiệu Năng 3 Giải Thuật (Performance Benchmark)',
    benchmarkIterLabel: 'Lặp lại đo:',
    benchmarkIter1: '1 lần (Tức thì)',
    benchmarkIter20: '20 lần (Trung bình)',
    benchmarkIter20Label: '20 lần lặp',
    benchmarkIter50: '50 lần (Chuẩn UIT)',
    benchmarkIter200: '200 lần (Đo sâu)',
    btnRunBenchmark: 'Chạy Đối Đầu 3 Thuật Toán',
    raceTitle: 'MÔ PHỎNG ĐỐI ĐẦU TIẾN TRÌNH THEO BƯỚC (STEP-BY-STEP RACE SIMULATOR)',
    overviewTitle: (iters) => `Kết Quả Đo Hiệu Năng Thực Tế (${iters} lần lặp)`,
    savingsTag: (pct) => `Tiết kiệm RAM với Hirschberg: ${pct}%`,
    colMetric: 'Tiêu Chí So Sánh',
    colRuntime: 'Thời Gian Chạy Thực Tế',
    colRamEst: 'Ước Tính RAM Tiêu Thụ',
    colRamFormula: 'Công Thức Bộ Nhớ Cụ Thể',
    colLcsRes: 'Chuỗi LCS Thu Được',
    colBigO: 'Bộ Nhớ Tiệm Cận (Big-O)',
    onlyLength: (len) => `Chỉ độ dài (${len} bp)`,

    // Timeline Toolbar
    stepLabel: 'Bước:',
    phaseInit: 'Khởi tạo',
    phaseCompute: 'Tính toán ô',
    phaseTraceback: 'Truy vết nghiệm',
    phaseFinished: 'Hoàn thành',
    btnResetTitle: 'Làm mới lại từ đầu (R)',
    btnPrevTitle: 'Lùi 1 bước (Mũi tên trái)',
    btnPlayTitle: 'Phát / Dừng (Phím cách)',
    btnPlayText: 'Chạy tiếp',
    btnPauseText: 'Tạm dừng',
    btnNextTitle: 'Tiến 1 bước (Mũi tên phải)',
    speedLabel: 'Tốc độ:',
    speed50: 'Siêu tốc (50ms)',
    speed150: 'Nhanh (150ms)',
    speed250: 'Chuẩn (250ms)',
    speed500: 'Chậm (500ms)',
    speed1000: 'Từng nhịp (1s)',
    speedShortcutTitle: 'Phím tắt: [ nhanh hơn, ] chậm hơn',
    speedShortcutChanged: 'Đã đổi tốc độ:',

    // Categories
    categories: {
      '01_normal': '01. Mẫu Tiêu Chuẩn (Normal)',
      '02_boundary': '02. Điều Kiện Biên (Boundary)',
      '03_small': '03. Chuỗi Siêu Ngắn (Small)',
      '04_large': '04. Chuỗi Dài Quy Mô Lớn (Large)',
      '05_special': '05. Sinh Học Thực Vật NCBI (Special Plant)',
      '06_invalid': '06. Kiểm Thử Ngoại Lệ & Bắt Lỗi (Negative/Error Handling)'
    },

    // Toasts
    toastThemeLight: 'Đã chuyển sang giao diện Sáng (Biomedical Lab)',
    toastThemeDark: 'Đã chuyển sang giao diện Tối (Cyber-Biotech)',
    toastLangVi: 'Đã chuyển sang giao diện Tiếng Việt',
    toastLangEn: 'Switched to English interface'
  },

  en: {
    // Header & Meta
    brandTitle: 'BioLCS Studio',
    brandTag: 'CS112',
    brandSubtitle: 'Plant Genomics Mutation Tracking & Algorithm Suite',
    brandReloadTitle: 'Reload BioLCS Studio',
    studentName: 'Dang Chi Thanh',
    studentId: 'ID: 25730067',
    studentClass: 'Class: CS112.F31.LT.TTNT',
    studentAdvisor: 'Advisor: Dr. Huynh Thi Thanh Thuong',
    studentUni: 'Faculty of CS - UIT',
    studentBadgeTitle: 'Click to view complete academic project & author details',
    modalAcademicTitle: 'Academic Project & Author Information',
    modalAcademicSub: 'University of Information Technology — VNU-HCM (UIT)',
    modalLblAuthor: 'Author / Student:',
    modalLblId: 'Student ID (MSSV):',
    modalLblClass: 'Course Section Code:',
    modalLblCourse: 'Course Subject:',
    modalValCourse: 'Algorithm Analysis and Design (CS112)',
    modalLblAdvisor: 'Faculty Advisor:',
    modalLblTopic: 'Term Project Topic:',
    modalValTopic: 'BioLCS — Multi-Algorithm Plant Genomic & Mutation Tracking Platform',
    modalLblLinks: 'Online Resources:',
    modalCopyright: '© 2026 Dang Chi Thanh — Student ID: 25730067. Academic Project for CS112 at UIT.',
    modalBtnClose: 'Close',
    themeToggleTitleLight: 'Switch to Light Mode',
    themeToggleTitleDark: 'Switch to Dark Mode',
    langToggleTitle: 'Switch Language (Vietnamese / English)',

    // Control Ribbon
    testcaseLabel: 'Standard Testcases (30 Samples):',
    seqXGenomic: 'Sequence X (Genomic 1):',
    seqXText: 'Sequence X (Text String 1):',
    seqYGenomic: 'Sequence Y (Genomic 2):',
    seqYText: 'Sequence Y (Text String 2):',
    placeholderSeq: 'e.g. ACCGGTC...',
    placeholderSeqY: 'e.g. AGTGTC...',
    swapTitle: 'Swap Sequences (X ↔ Y)',
    algoLabel: 'Execution Algorithm:',
    algoGrid: '1. 2D DP Grid (Full Matrix & Traceback)',
    algoHirschberg: '2. Hirschberg D&C (Linear Space O(min(M,N)))',
    algoSpaceOpt: '3. Space-Optimized DP (2-Row Buffer O(min(M,N)))',
    btnRun: 'Analyze & Run',
    btnPause: 'Pause',
    btnResume: 'Resume',

    // Biological Context Bar
    bioLoading: 'Loading genomic sample metadata...',
    ntLabel: 'Nucleotides:',

    // Tabs
    tabMatrixGrid: '2D DP Matrix Studio',
    tabMatrixHirschberg: 'Hirschberg D&C Tree',
    tabMatrixSpaceOpt: '2-Row Buffer (Ping-Pong)',
    tabGenomic: 'Genomic Lab & 3D Helix',
    tabGenomicText: 'Alignment & Diff',
    tabGenomicBadge: '3D WebGL',
    tabGenomicBadgeText: 'Text Diff',
    tabBenchmark: 'Benchmark Arena',
    tabGenomicDisabledTitle: 'Disabled: Sequences are non-genomic text (A, T, G, C, U)',

    // Visualizer Panel (Tab 1)
    matrixTitleGrid: '2D Dynamic Programming Matrix Space (m+1) × (n+1)',
    matrixTitleHirschberg: 'Hirschberg Algorithm (Linear Space D&C O(N))',
    matrixTitleSpaceOpt: '2-Row Dynamic Programming Cyclic Buffer (2 × n)',
    legendMatch: 'LCS Match (↖)',
    legendMatchTitle: 'Matching character added to LCS sequence (Match ↖)',
    legendSkip: 'Skip Step (↑/←)',
    legendSkipTitle: 'Matrix movement step across rows/columns (Skip ↑/←)',
    legendActive: 'Computing',
    legendActiveTitle: 'Cell currently being computed',
    legendCompare: 'Comparing',
    legendCompareTitle: 'Sub-cells currently being compared',
    btnQuick3D: '🧬 View 3D Helix →',
    btnQuick3DTitle: 'Quick Jump to Genomic Lab & 3D Double Helix',
    formulaReady: 'Initializing DP matrix...',
    stepStatusReady: 'Ready',

    // Defensive Gateway / Input Validation Card
    defensiveBadge: 'DEFENSIVE GATEWAY',
    defensiveTitle: 'Defensive Input Sanitization & Error Handling',
    defensiveTcInvalid: 'INVALID INPUT',
    defensiveViolationDetected: 'Violation Detected:',
    defensiveAcademicTitle: 'Academic Objective (CS112 Specs §6):',
    defensiveAcademicDesc: 'Demonstrates algorithmic robustness against corrupted biological inputs. Malformed sequences are securely intercepted before memory buffer allocation, preventing browser tab freezes and out-of-memory exceptions.',
    defensiveBtnSanitize: 'Sanitize & Run Validated Sequence',
    defensiveFormulaHint: 'Input validation intercepted corrupted sequence. Click <strong>Sanitize & Run</strong> to demonstrate automatic repair.',
    defensiveDefaultReason: 'Malformed or out-of-bound nucleotide sequence detected.',

    // Genomic Lab (Tab 2)
    nonGenomicTitle: 'General String Matching Mode',
    nonGenomicReason: 'The current dataset does not contain biological nucleotides (A, T, G, C, U). The 3D double helix is hidden for scientific accuracy. You can view the sequence alignment track and character similarity statistics below.',
    dna3DTitle: '3D Double Helix DNA Model (Three.js)',
    dna3DHint: 'Auto-rotates & Glows on Match',
    alignmentTitle: 'Sequence Alignment & Mutation Breakdown',
    alignEmpty: 'No alignment data available yet.',
    alignReady: 'ALIGNMENT READY',
    alignTotalPos: 'Total Positions:',
    alignTrackX: 'Sequence X (Gene 1):',
    alignTrackMid: 'Homology:',
    alignTrackY: 'Sequence Y (Gene 2):',
    statLcsLength: 'LCS Length (Matches)',
    statSimilarity: 'Similarity Score',
    statDeletions: 'Deletions (Indels)',
    statInsertions: 'Insertions (Indels)',
    bioInsightTitle: 'Evolutionary genomics insight:',
    bioInsightHigh: 'High Conservation. Functional coding region strictly preserved between plant species.',
    bioInsightMedium: 'Moderate Homology. Accumulation of substitutions and indels observed.',
    bioInsightLow: 'High Sequence Divergence. Substantial structural variations detected.',

    // Benchmark Arena (Tab 3)
    benchmarkTitle: '3-Algorithm Performance Benchmark Arena',
    benchmarkIterLabel: 'Iterations:',
    benchmarkIter1: '1 run (Instant)',
    benchmarkIter20: '20 runs (Average)',
    benchmarkIter20Label: '20 iterations',
    benchmarkIter50: '50 runs (UIT Standard)',
    benchmarkIter200: '200 runs (Deep Profiling)',
    btnRunBenchmark: 'Run 3-Algorithm Faceoff',
    raceTitle: 'STEP-BY-STEP RACE SIMULATOR',
    overviewTitle: (iters) => `Empirical Performance Benchmark (${iters} iterations)`,
    savingsTag: (pct) => `RAM Savings with Hirschberg: ${pct}%`,
    colMetric: 'Comparison Metric',
    colRuntime: 'Actual Execution Runtime',
    colRamEst: 'Estimated RAM Consumption',
    colRamFormula: 'Concrete Memory Formula',
    colLcsRes: 'Recovered LCS Subsequence',
    colBigO: 'Asymptotic Space Complexity (Big-O)',
    onlyLength: (len) => `Length only (${len} bp)`,

    // Timeline Toolbar
    stepLabel: 'Step:',
    phaseInit: 'Initialization',
    phaseCompute: 'Cell Computation',
    phaseTraceback: 'LCS Traceback',
    phaseFinished: 'Completed',
    btnResetTitle: 'Reset to start (R)',
    btnPrevTitle: 'Step backward (Left Arrow)',
    btnPlayTitle: 'Play / Pause (Spacebar)',
    btnPlayText: 'Play',
    btnPauseText: 'Pause',
    btnNextTitle: 'Step forward (Right Arrow)',
    speedLabel: 'Speed:',
    speed50: 'Fastest (50ms)',
    speed150: 'Fast (150ms)',
    speed250: 'Normal (250ms)',
    speed500: 'Slow (500ms)',
    speed1000: 'Step by Step (1s)',
    speedShortcutTitle: 'Keyboard shortcuts: [ faster, ] slower',
    speedShortcutChanged: 'Speed changed:',

    // Categories
    categories: {
      '01_normal': '01. Standard Benchmark (Normal)',
      '02_boundary': '02. Boundary & Edge Cases',
      '03_small': '03. Short Sequence Snippets',
      '04_large': '04. Large-Scale Genomic Data',
      '05_special': '05. NCBI Plant Genomic Motifs',
      '06_invalid': '06. Negative & Error Handling Tests (Invalid Data)'
    },

    // Toasts
    toastThemeLight: 'Switched to Light Theme (Biomedical Lab)',
    toastThemeDark: 'Switched to Dark Theme (Cyber-Biotech)',
    toastLangVi: 'Đã chuyển sang giao diện Tiếng Việt',
    toastLangEn: 'Switched to English interface'
  }
};

/**
 * High-craft English descriptions for all 30 testcases
 */
export const TESTCASE_DESCRIPTIONS_EN = {
  TC_01_01: 'Textbook DNA sequence alignment pair',
  TC_01_02: 'Classic example from CLRS Cormen et al.',
  TC_01_03: 'Classic genetic sequence pair from sci-fi film GATTACA',
  TC_01_04: 'Original Hirschberg CACM 1975 verification test pair',
  TC_01_05: '12-bp plant nucleotide snippet with high homology',
  TC_02_01: 'Extreme Boundary: Both nucleotide sequences are empty',
  TC_02_02: 'Extreme Boundary: One empty sequence vs non-empty sequence',
  TC_02_03: 'Extreme Boundary: Completely disjoint sequences with 0 matches',
  TC_02_04: 'Extreme Boundary: 100% identical nucleotide sequences',
  TC_02_05: 'Extreme Boundary: Single character vs sequence with multiple occurrences',
  TC_03_01: 'Small 3x3: DNA triplet codons with 2 matching nucleotides',
  TC_03_02: 'Small 4x4: Nucleotide permutation checking DP trace path',
  TC_03_03: 'Small 5x4: Single-nucleotide internal deletion mutation',
  TC_03_04: 'Small 5x5: Interleaved motif with branching traceback',
  TC_03_05: 'Small 6x5: Transcription initiation region (Start codon motif)',
  TC_04_01: 'Large 50-bp: Short plant exon level performance benchmark',
  TC_04_02: 'Large 100-bp: Head-to-head benchmark: Grid DP vs Hirschberg',
  TC_04_03: 'Large 200-bp: RAM consumption and execution runtime profiling',
  TC_04_04: 'Large 300-bp: Memory compression measurement for Hirschberg',
  TC_04_05: 'Large 500-bp: Full-gene scale stress test',
  TC_05_01: 'Rice (Oryza sativa M36881) vs Maize (Zea mays X86563) rbcL gene',
  TC_05_02: 'Green algae (Chlamydomonas) vs Moss (Physcomitrella) psbA gene',
  TC_05_03: 'Symmetric RNA hairpin loop (osa-miR156 rice microRNA)',
  TC_05_04: 'Simple Sequence Repeats (SSR microsatellite) in crop breeding',
  TC_05_05: 'Single Nucleotide Polymorphism (SNP) in beta-globin gene',
  TC_06_01: 'Invalid data: Sequence contains illegal numeric digits',
  TC_06_02: 'Invalid data: Sequence contains illegal special symbols',
  TC_06_03: 'Invalid data: Sequence contains internal whitespace gaps',
  TC_06_04: 'Invalid data: Sequence exceeds browser maximum length limit',
  TC_06_05: 'Invalid data: Missing required sequence input (Null or undefined)'
};

/**
 * Returns localized string for given key
 */
export function t(key, lang = 'vi', ...args) {
  const dict = I18N[lang] || I18N.vi;
  const val = dict[key] !== undefined ? dict[key] : (I18N.vi[key] || key);
  if (typeof val === 'function') {
    return val(...args);
  }
  return val;
}

/**
 * Returns localized description for a testcase
 */
export function getTestcaseDescription(tc, lang = 'vi') {
  if (!tc) return '';
  if (lang === 'en' && TESTCASE_DESCRIPTIONS_EN[tc.test_id]) {
    return TESTCASE_DESCRIPTIONS_EN[tc.test_id];
  }
  return tc.description || '';
}

/**
 * Returns localized validation error message for defensive card and toasts
 */
export function getLocalizedValidationError(valResult, rawX = '', rawY = '', lang = 'vi') {
  if (!valResult) return t('defensiveDefaultReason', lang);
  const isEn = lang === 'en';
  const type = valResult.errorType;

  if (type === 'EXCEEDS_MAX_LENGTH') {
    const offendingLen = Math.max((rawX || '').length, (rawY || '').length) || 6000;
    return isEn
      ? `Sequence length (${offendingLen}) exceeds maximum permissible length of 5000 bp.`
      : `Độ dài chuỗi (${offendingLen}) vượt quá giới hạn tối đa cho phép của trình duyệt (5000 bp).`;
  }
  if (type === 'MISSING_INPUT') {
    return isEn
      ? 'Required sequence field is null or undefined.'
      : 'Trường dữ liệu chuỗi bắt buộc bị thiếu hoặc không xác định (null/undefined).';
  }
  if (type === 'INVALID_FORMAT') {
    if (typeof rawX !== 'string' || typeof rawY !== 'string') {
      return isEn
        ? 'Input sequences must be strings.'
        : 'Chuỗi đầu vào phải là định dạng văn bản (string).';
    }
    return isEn
      ? 'Whitespace characters detected inside sequence body.'
      : 'Phát hiện ký tự khoảng trắng ngắt quãng bên trong chuỗi nucleotide.';
  }
  if (type === 'INVALID_CHARACTERS') {
    if (/[0-9]/.test(rawX || '') || /[0-9]/.test(rawY || '')) {
      return isEn
        ? 'Sequence contains illegal numeric characters.'
        : 'Chuỗi chứa ký tự số không hợp lệ trong nucleotide.';
    }
    return isEn
      ? 'Sequence contains illegal characters outside standard nucleotide alphabet.'
      : 'Chuỗi chứa ký tự đặc biệt ngoài bảng mã nucleotide chuẩn.';
  }

  return isEn
    ? (valResult.errorMessage || t('defensiveDefaultReason', 'en'))
    : (valResult.localizedErrMsg || valResult.errorMessage || t('defensiveDefaultReason', 'vi'));
}
