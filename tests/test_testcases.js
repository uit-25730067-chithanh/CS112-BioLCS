/**
 * Comprehensive Automated Verification Suite for BioLCS 30 Testcases
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * Student: Dang Chi Thanh (MSSV: 25730067)
 * 
 * Verifies:
 * 1. JSON Schema Conformance of all 30 testcase files
 * 2. Master Catalog Index Integrity (testcases_index.json)
 * 3. Cross-Validation of Core Engine against expected_output for valid tests
 * 4. Error Sanitization & Handling for invalid testcases
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { solveGridDP } from "../engine/grid_dp.js";
import { solveSpaceOptimizedDP } from "../engine/space_optimized_dp.js";
import { solveHirschberg } from "../engine/hirschberg.js";
import { validateSequences } from "../engine/input_validator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testcasesDir = fs.existsSync(path.resolve(__dirname, "../testcases"))
  ? path.resolve(__dirname, "../testcases")
  : path.resolve(__dirname, "../../testcases");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m"
};

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, checkName, details = "") {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ${colors.green}✓ PASS${colors.reset} ${checkName}`);
  } else {
    failedChecks++;
    console.error(`  ${colors.red}✗ FAIL${colors.reset} ${checkName}`);
    if (details) console.error(`    ${colors.yellow}Details: ${details}${colors.reset}`);
  }
}

// Subsequence verification helper
function isSubsequence(sub, str) {
  let subIdx = 0;
  for (let i = 0; i < str.length && subIdx < sub.length; i++) {
    if (str[i] === sub[subIdx]) subIdx++;
  }
  return subIdx === sub.length;
}

console.log(`${colors.bold}${colors.cyan}==============================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}  BioLCS TESTCASE SUITE VERIFICATION — CS112 (25730067)       ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}==============================================================${colors.reset}\n`);

const categories = ["01_normal", "02_boundary", "03_small", "04_large", "05_special", "06_invalid"];

// -------------------------------------------------------------
// Check 1: Master Index Catalog Integrity
// -------------------------------------------------------------
console.log(`${colors.bold}[1/4] Master Catalog Index Integrity (testcases_index.json)${colors.reset}`);

const indexPath = path.join(testcasesDir, "testcases_index.json");
assert(fs.existsSync(indexPath), "testcases_index.json exists in root of testcases/");

let indexData = null;
try {
  indexData = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  assert(indexData.total_testcases === 30, `Total testcases count in index is exactly 30 (got ${indexData.total_testcases})`);
  assert(Array.isArray(indexData.testcases) && indexData.testcases.length === 30, "Index contains 30 items in testcases array");
} catch (err) {
  assert(false, "Parse testcases_index.json failed", err.message);
}

// -------------------------------------------------------------
// Check 2: Schema Conformance across all 30 files
// -------------------------------------------------------------
console.log(`\n${colors.bold}[2/4] Schema Conformance (30 JSON Files)${colors.reset}`);

const allTestcases = [];

for (const cat of categories) {
  const catPath = path.join(testcasesDir, cat);
  assert(fs.existsSync(catPath), `Category directory exists: ${cat}`);

  const files = fs.readdirSync(catPath).filter(f => f.endsWith(".json"));
  assert(files.length === 5, `Category ${cat} contains exactly 5 testcase files (found ${files.length})`);

  for (const f of files) {
    const filePath = path.join(catPath, f);
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const hasRequired = (
      typeof content.test_id === "string" &&
      content.category === cat &&
      typeof content.description === "string" &&
      typeof content.input === "object" &&
      content.input !== null
    );

    assert(hasRequired, `Schema valid: ${cat}/${f} (ID: ${content.test_id})`);
    allTestcases.push(content);
  }
}

// -------------------------------------------------------------
// Check 3: Valid Testcases Execution against Core Engine (25 tests)
// -------------------------------------------------------------
console.log(`\n${colors.bold}[3/4] Core Engine Execution on Valid Testcases (25 Tests)${colors.reset}`);

const validTests = allTestcases.filter(tc => tc.category !== "06_invalid");

for (const tc of validTests) {
  const x = tc.input.sequence_x || "";
  const y = tc.input.sequence_y || "";
  const expectedLen = tc.expected_output.lcs_length;

  // Execute Hirschberg
  const hirschRes = solveHirschberg(x, y);
  const hirschLenMatch = hirschRes.length === expectedLen;
  assert(
    hirschLenMatch,
    `[${tc.test_id}] Hirschberg length matches expected (${hirschRes.length} === ${expectedLen})`
  );

  const hirschValidSub = isSubsequence(hirschRes.lcs, x) && isSubsequence(hirschRes.lcs, y);
  assert(
    hirschValidSub,
    `[${tc.test_id}] Hirschberg recovered LCS is valid subsequence of X and Y`
  );

  // For smaller/medium sequences (len <= 60), also verify with Grid DP and Space-Optimized
  if (x.length <= 60 && y.length <= 60) {
    const gridRes = solveGridDP(x, y, { recordSnapshots: false });
    const spaceRes = solveSpaceOptimizedDP(x, y);

    assert(
      gridRes.length === expectedLen && spaceRes.length === expectedLen,
      `[${tc.test_id}] Cross-validation Grid DP & Space-Optimized match (${gridRes.length} == ${spaceRes.length} == ${expectedLen})`
    );
  }
}

// -------------------------------------------------------------
// Check 4: Input Sanitization & Error Handling (5 tests)
// -------------------------------------------------------------
console.log(`\n${colors.bold}[4/4] Input Sanitization on Invalid Testcases (5 Tests)${colors.reset}`);

const invalidTests = allTestcases.filter(tc => tc.category === "06_invalid");

for (const tc of invalidTests) {
  const validation = validateSequences(tc.input.sequence_x, tc.input.sequence_y);

  assert(
    validation.isValid === false,
    `[${tc.test_id}] Rejected invalid input as expected: "${tc.description}"`
  );

  assert(
    validation.errorType === tc.expected_output.error_type,
    `[${tc.test_id}] Error type matches expected: ${validation.errorType} === ${tc.expected_output.error_type}`
  );
}

// -------------------------------------------------------------
// Final Summary Report
// -------------------------------------------------------------
console.log(`\n${colors.bold}${colors.cyan}==============================================================${colors.reset}`);
console.log(`${colors.bold}SUMMARY:${colors.reset} Total Checks: ${totalChecks} | ${colors.green}Passed: ${passedChecks}${colors.reset} | ${colors.red}Failed: ${failedChecks}${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}==============================================================${colors.reset}\n`);

if (failedChecks > 0) {
  process.exit(1);
} else {
  console.log(`${colors.green}${colors.bold}ALL 30 TESTCASES VALIDATED AND PASSED WITH 100% SUCCESS!${colors.reset}\n`);
  process.exit(0);
}
