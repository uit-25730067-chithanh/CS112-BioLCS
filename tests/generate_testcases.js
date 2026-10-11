/**
 * Testcase Generation Script for CS112 Term Project (BioLCS)
 * Student: Dang Chi Thanh (MSSV: 25730067)
 * 
 * Generates 30 standardized JSON testcases across 6 mandatory categories:
 * - 01_normal (5 tests): standard textbook & CLRS pairs
 * - 02_boundary (5 tests): empty, single char, disjoint, identical
 * - 03_small (5 tests): len <= 6 for DP Matrix Studio GUI
 * - 04_large (5 tests): 50 to 500 bp for benchmark scaling
 * - 05_special (5 tests): authentic NCBI FASTA plant genomics (Oryza sativa, Zea mays, SSR, LPS)
 * - 06_invalid (5 tests): input sanitization & error handling
 * 
 * Uses solveHirschberg & solveGridDP to accurately compute expected_output.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { solveHirschberg } from "../engine/hirschberg.js";
import { solveGridDP } from "../engine/grid_dp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = fs.existsSync(path.resolve(__dirname, "../testcases"))
  ? path.resolve(__dirname, "../testcases")
  : path.resolve(__dirname, "../../testcases");

// Authentic NCBI plant DNA sequences
const RICE_RBCL = "ATGTCACCACAAACAGAGACTAAAGCAAGTGTTGGATTCAAAGCTGGTGTTAAAGATTATAAATTGACTTATTATACTCCTGAGTACCAAACCAAGGATACTGATATATTGGCAGCATTCCGAGTAACTCCTCAACCTGGAGTTCCACCTGAAGAAGCAGGGGCCGCGGTAGCTGCCGAATCTTCTACTGGTACATGGACAACTGTGTGGACCGATGGACTTACCAGCCTTGATCGTTACAAAGGGCGATGCTACCACATC";
const MAIZE_RBCL = "ATGTCACCACAAACAGAAACTAAAGCAAGTGTTGGATTCAAAGCTGGTGTTAAAGAGTACAAATTGACTTATTATACTCCTGAGTACCAAACCAAGGATACTGATATATTGGCAGCATTCCGAGTAACTCCTCAACCTGGAGTTCCGCCCGAGGAAGCAGGGGCCGCGGTAGCTGCCGAATCTTCTACTGGTACATGGACAACTGTGTGGACCGATGGACTTACCAGTCTTGATCGTTACAAAGGGCGATGCTACCACATC";

const CHLAMY_PSBA = "ATGACTGCAATTTTAGAGAGACGCGAAAGCGAAAGCCTTTGGGGTCGCTTCTGTAACTGGATAACTAGCACTGAAAACCGTCTTTACATTGGTTGGTTTGGTGTATTGATGATCCCTACCTTACTTACTGCAACTTCTGTATTCATCATCGCCTTCATTGCTGCTCCTCCAGTAGACATTGATGGTATTCGTGAGCCTGTTGCT";
const MOSS_PSBA = "ATGACTGCAATTTTAGAGAGACGTGAAAGCGAAAGCCTATGGGGTCGCTTCTGTAACTGGATAACTAGCACTGAAAACCGTCTTTACATCGGTTGGTTTGGTGTATTGATGATCCCTACCTTACTTACTGCTACTTCTGTATTCATCATCGCCTTCATTGCTGCTCCACCAGTAGACATTGATGGTATTCGTGAACCTGTTTCT";

// Palindromic RNA hairpin loop (osa-miR156 precursor in rice)
const PALINDROME_STEM_A = "UGACAGAAGAGAGUGAGCAC";
const PALINDROME_STEM_B = "GUGCUCACUCUCUUCUGUCA";

// Microsatellites / SSRs (Tandem repeats in plant genetics)
const SSR_PARENT_A = "ATCGATCGATCG" + "GATAGATAGATAGATA" + "TTTTTT" + "CTCTCTCTCTCT" + "GCGC";
const SSR_PARENT_B = "ATCGATCGATCG" + "GATAGATAGATA" + "TTTTTT" + "CTCTCTCTCTCTCTCT" + "GCGC";

// Deterministic pseudo-random nucleotide sequence generator for large benchmark tests
function generateDNA(len, seed) {
  const bases = ["A", "C", "G", "T"];
  let res = "";
  let s = seed;
  for (let i = 0; i < len; i++) {
    s = (s * 9301 + 49297) % 233280;
    const idx = Math.floor((s / 233280) * 4);
    res += bases[idx];
  }
  return res;
}

// 30 Defined Testcase Specifications
const testcaseDefs = [
  // ==========================================
  // Category 01: Normal (5 tests)
  // ==========================================
  {
    test_id: "TC_01_01",
    category: "01_normal",
    description: "So khớp chuỗi nucleotide mẫu giáo khoa (Textbook DNA pair)",
    input: { sequence_x: "ACCGGTC", sequence_y: "AGTGTC" }
  },
  {
    test_id: "TC_01_02",
    category: "01_normal",
    description: "Ví dụ kinh điển từ giáo trình CLRS Cormen et al.",
    input: { sequence_x: "BDAB", sequence_y: "BACDB" }
  },
  {
    test_id: "TC_01_03",
    category: "01_normal",
    description: "Cặp chuỗi gen kinh điển từ tác phẩm khoa học viễn tưởng GATTACA",
    input: { sequence_x: "GATTACA", sequence_y: "GCATGCU" }
  },
  {
    test_id: "TC_01_04",
    category: "01_normal",
    description: "Cặp chuỗi kiểm chứng bài báo gốc Hirschberg (CACM 1975)",
    input: { sequence_x: "AGCAT", sequence_y: "GAC" }
  },
  {
    test_id: "TC_01_05",
    category: "01_normal",
    description: "Đoạn trình tự nucleotide 12-bp thực vật có tỷ lệ tương đồng cao",
    input: { sequence_x: "CGTACCAGTTAC", sequence_y: "TAGTACTCGAC" }
  },

  // ==========================================
  // Category 02: Boundary (5 tests)
  // ==========================================
  {
    test_id: "TC_02_01",
    category: "02_boundary",
    description: "Biên cực trị: Cả hai chuỗi nucleotide đều rỗng",
    input: { sequence_x: "", sequence_y: "" }
  },
  {
    test_id: "TC_02_02",
    category: "02_boundary",
    description: "Biên cực trị: Một chuỗi rỗng đối đầu chuỗi có nucleotide",
    input: { sequence_x: "", sequence_y: "ACGT" }
  },
  {
    test_id: "TC_02_03",
    category: "02_boundary",
    description: "Biên cực trị: Hai chuỗi hoàn toàn không có ký tự chung (Disjoint)",
    input: { sequence_x: "AAAA", sequence_y: "CCCC" }
  },
  {
    test_id: "TC_02_04",
    category: "02_boundary",
    description: "Biên cực trị: Hai chuỗi nucleotide giống hệt nhau 100%",
    input: { sequence_x: "AGCTAGCT", sequence_y: "AGCTAGCT" }
  },
  {
    test_id: "TC_02_05",
    category: "02_boundary",
    description: "Biên cực trị: Chuỗi 1 ký tự đối đầu chuỗi dài chứa ký tự đó ở nhiều vị trí",
    input: { sequence_x: "A", sequence_y: "TATATATA" }
  },

  // ==========================================
  // Category 03: Small (5 tests, len <= 6)
  // ==========================================
  {
    test_id: "TC_03_01",
    category: "03_small",
    description: "Chuỗi nhỏ 3x3: Bộ ba mã hóa DNA triplet codons có 2 nucleotide trùng khớp",
    input: { sequence_x: "ACG", sequence_y: "ACT" }
  },
  {
    test_id: "TC_03_02",
    category: "03_small",
    description: "Chuỗi nhỏ 4x4: Hoán vị nucleotide kiểm tra đường đi ma trận DP",
    input: { sequence_x: "ATGC", sequence_y: "AGTC" }
  },
  {
    test_id: "TC_03_03",
    category: "03_small",
    description: "Chuỗi nhỏ 5x4: Đột biến mất đoạn 1 nucleotide ở giữa",
    input: { sequence_x: "AGTAC", sequence_y: "ATAC" }
  },
  {
    test_id: "TC_03_04",
    category: "03_small",
    description: "Chuỗi nhỏ 5x5: Mẫu hình đan xen phân nhánh truy vết",
    input: { sequence_x: "CGATG", sequence_y: "GCTGA" }
  },
  {
    test_id: "TC_03_05",
    category: "03_small",
    description: "Chuỗi nhỏ 6x5: Vùng khởi đầu phiên mã (Start codon motif)",
    input: { sequence_x: "ATGCTA", sequence_y: "AGCTA" }
  },

  // ==========================================
  // Category 04: Large (5 tests: 50 ~ 500 bp)
  // ==========================================
  {
    test_id: "TC_04_01",
    category: "04_large",
    description: "Chuỗi lớn 50-bp: Benchmark hiệu năng cấp độ exon ngắn thực vật",
    input: {
      sequence_x: generateDNA(50, 101),
      sequence_y: generateDNA(50, 102)
    }
  },
  {
    test_id: "TC_04_02",
    category: "04_large",
    description: "Chuỗi lớn 100-bp: Benchmark đối đầu Grid DP vs Hirschberg",
    input: {
      sequence_x: generateDNA(100, 201),
      sequence_y: generateDNA(100, 202)
    }
  },
  {
    test_id: "TC_04_03",
    category: "04_large",
    description: "Chuỗi lớn 200-bp: Khảo sát tiêu thụ RAM và thời gian thực thi",
    input: {
      sequence_x: generateDNA(200, 301),
      sequence_y: generateDNA(200, 302)
    }
  },
  {
    test_id: "TC_04_04",
    category: "04_large",
    description: "Chuỗi lớn 300-bp: Đo lường khả năng nén bộ nhớ Hirschberg",
    input: {
      sequence_x: generateDNA(300, 401),
      sequence_y: generateDNA(300, 402)
    }
  },
  {
    test_id: "TC_04_05",
    category: "04_large",
    description: "Chuỗi lớn 500-bp: Thử thách áp lực quy mô gen đầy đủ",
    input: {
      sequence_x: generateDNA(500, 501),
      sequence_y: generateDNA(500, 502)
    }
  },

  // ==========================================
  // Category 05: Special (5 tests, NCBI plant genetics)
  // ==========================================
  {
    test_id: "TC_05_01",
    category: "05_special",
    description: "Gen rbcL Lúa nước (Oryza sativa M36881) vs Ngô (Zea mays X86563) thực tế",
    input: {
      sequence_x: RICE_RBCL,
      sequence_y: MAIZE_RBCL
    }
  },
  {
    test_id: "TC_05_02",
    category: "05_special",
    description: "Gen psbA Tảo lục (Chlamydomonas BK000554) vs Rêu (Physcomitrella)",
    input: {
      sequence_x: CHLAMY_PSBA,
      sequence_y: MOSS_PSBA
    }
  },
  {
    test_id: "TC_05_03",
    category: "05_special",
    description: "Cấu trúc kẹp tóc RNA đối xứng (Palindromic Hairpin Loop osa-miR156 Lúa nước)",
    input: {
      sequence_x: PALINDROME_STEM_A,
      sequence_y: PALINDROME_STEM_B
    }
  },
  {
    test_id: "TC_05_04",
    category: "05_special",
    description: "Chuỗi vi vệ tinh lặp đoạn ngắn (Tandem Repeats SSR) trong chọn giống cây trồng",
    input: {
      sequence_x: SSR_PARENT_A,
      sequence_y: SSR_PARENT_B
    }
  },
  {
    test_id: "TC_05_05",
    category: "05_special",
    description: "Đột biến điểm đơn nucleotide (SNP) trong gen beta-globin kiểm soát biến dị di truyền",
    input: {
      sequence_x: "ATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAG",
      sequence_y: "ATGGTGCACCTGACTCCTGTGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAG"
    }
  },

  // ==========================================
  // Category 06: Invalid (5 tests, error handling)
  // ==========================================
  {
    test_id: "TC_06_01",
    category: "06_invalid",
    description: "Dữ liệu lỗi: Chuỗi chứa ký tự số không hợp lệ trong nucleotide",
    input: { sequence_x: "ACTG123", sequence_y: "ACGT" },
    expected_output: {
      is_valid: false,
      error_type: "INVALID_CHARACTERS",
      error_message: "Sequence contains illegal numeric characters: 1, 2, 3."
    }
  },
  {
    test_id: "TC_06_02",
    category: "06_invalid",
    description: "Dữ liệu lỗi: Chuỗi chứa ký tự đặc biệt ngoài bảng mã nucleotide",
    input: { sequence_x: "AC@G#T", sequence_y: "ACGT" },
    expected_output: {
      is_valid: false,
      error_type: "INVALID_CHARACTERS",
      error_message: "Sequence contains illegal special characters: @, #."
    }
  },
  {
    test_id: "TC_06_03",
    category: "06_invalid",
    description: "Dữ liệu lỗi: Chuỗi chứa khoảng trắng ngắt quãng ở giữa các base",
    input: { sequence_x: "AC GT", sequence_y: "A CGT" },
    expected_output: {
      is_valid: false,
      error_type: "INVALID_FORMAT",
      error_message: "Whitespace characters detected inside sequence body."
    }
  },
  {
    test_id: "TC_06_04",
    category: "06_invalid",
    description: "Dữ liệu lỗi: Chuỗi vượt ngưỡng kích thước tối đa cho phép của trình duyệt (Overlength)",
    input: { sequence_x: "A".repeat(6000), sequence_y: "ACGT" },
    expected_output: {
      is_valid: false,
      error_type: "EXCEEDS_MAX_LENGTH",
      error_message: "Sequence length (6000) exceeds maximum permissible length of 5000 bp."
    }
  },
  {
    test_id: "TC_06_05",
    category: "06_invalid",
    description: "Dữ liệu lỗi: Thiếu trường dữ liệu chuỗi bắt buộc (Null or undefined sequence)",
    input: { sequence_x: null, sequence_y: "ACGT" },
    expected_output: {
      is_valid: false,
      error_type: "MISSING_INPUT",
      error_message: "Required sequence field is null or undefined."
    }
  }
];

console.log("=== Generating 30 BioLCS Testcases ===");

const indexCatalog = [];

for (const tc of testcaseDefs) {
  // If not already set (valid categories 01 to 05), compute expected_output using core algorithms
  if (!tc.expected_output) {
    const x = tc.input.sequence_x || "";
    const y = tc.input.sequence_y || "";
    
    // For smaller sequences, compute both Grid DP and Hirschberg; for large use Hirschberg / Grid DP with no snapshots
    const gridRes = solveGridDP(x, y, { recordSnapshots: false });
    const hirschRes = solveHirschberg(x, y);

    const possibleLcs = Array.from(new Set([gridRes.lcs, hirschRes.lcs].filter(Boolean)));
    if (possibleLcs.length === 0 && gridRes.length === 0) {
      possibleLcs.push("");
    }

    tc.expected_output = {
      lcs_length: gridRes.length,
      possible_lcs: possibleLcs,
      is_valid: true
    };
  }

  // Write file to category folder
  const catDir = path.join(baseDir, tc.category);
  if (!fs.existsSync(catDir)) {
    fs.mkdirSync(catDir, { recursive: true });
  }

  const filePath = path.join(catDir, `${tc.test_id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(tc, null, 2) + "\n", "utf-8");
  console.log(`Generated: ${tc.category}/${tc.test_id}.json (LCS Length: ${tc.expected_output.lcs_length !== undefined ? tc.expected_output.lcs_length : "N/A"})`);

  // Add to index catalog
  indexCatalog.push({
    test_id: tc.test_id,
    category: tc.category,
    description: tc.description,
    x_length: tc.input.sequence_x ? tc.input.sequence_x.length : 0,
    y_length: tc.input.sequence_y ? tc.input.sequence_y.length : 0,
    is_valid: tc.expected_output.is_valid,
    lcs_length: tc.expected_output.lcs_length !== undefined ? tc.expected_output.lcs_length : 0,
    file_path: `testcases/${tc.category}/${tc.test_id}.json`
  });
}

// Write master testcases_index.json
const indexPath = path.join(baseDir, "testcases_index.json");
fs.writeFileSync(indexPath, JSON.stringify({
  version: "1.0.0",
  total_testcases: indexCatalog.length,
  categories: ["01_normal", "02_boundary", "03_small", "04_large", "05_special", "06_invalid"],
  testcases: indexCatalog
}, null, 2) + "\n", "utf-8");

console.log(`\nGenerated master index: testcases_index.json (${indexCatalog.length} testcases indexed).`);
console.log("=== Testcase Generation Complete ===");
