/**
 * Comprehensive Unit Test Suite for BioLCS Algorithm Core Engine
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * Student: Dang Chi Thanh (MSSV: 25730067)
 * 
 * Tests:
 * 1. Cross-Algorithm Validation (Grid DP vs Space-Optimized vs Hirschberg)
 * 2. Boundary / Extreme Cases (Empty, Single-Char, Disjoint, Identical)
 * 3. Subsequence Validity Check (Mathematical correctness of recovered LCS)
 * 4. StepSnapshot Schema Conformance
 * 5. Sequence Alignment & Mutation Classification
 * 6. StepEngine Timeline Controller
 */

import { solveGridDP } from "../engine/grid_dp.js";
import { solveSpaceOptimizedDP } from "../engine/space_optimized_dp.js";
import { solveHirschberg } from "../engine/hirschberg.js";
import { generateAlignment } from "../engine/alignment.js";
import { StepEngine } from "../engine/step_engine.js";

// Helper: Checks whether sub is a valid subsequence of str
function isSubsequence(sub, str) {
  let subIdx = 0;
  for (let i = 0; i < str.length && subIdx < sub.length; i++) {
    if (str[i] === sub[subIdx]) {
      subIdx++;
    }
  }
  return subIdx === sub.length;
}

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m"
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = "") {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ${colors.green}✓ PASS${colors.reset} ${testName}`);
  } else {
    failedTests++;
    console.error(`  ${colors.red}✗ FAIL${colors.reset} ${testName}`);
    if (details) console.error(`    ${colors.yellow}Details: ${details}${colors.reset}`);
  }
}

console.log(`${colors.bold}${colors.cyan}==============================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}  BioLCS CORE ENGINE VERIFICATION SUITE — CS112 (25730067)    ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}==============================================================${colors.reset}\n`);

// -------------------------------------------------------------
// Test Suite 1: Cross-Algorithm Validation
// -------------------------------------------------------------
console.log(`${colors.bold}[1/6] Cross-Algorithm Validation (10 Benchmark Pairs)${colors.reset}`);

const crossPairs = [
  { x: "ACCGGTC", y: "AGTGTC", name: "Textbook DNA pair" },
  { x: "BDAB", y: "BACDB", name: "CLRS classic example" },
  { x: "GATTACA", y: "GCATGCU", name: "Classic film genetics pair" },
  { x: "AGCAT", y: "GAC", name: "Hirschberg paper test" },
  { x: "ATCTGAT", y: "TGCATA", name: "Plant intron motif" },
  { x: "AAAACCCCGGGGTTTT", y: "ACGTACGTACGT", name: "Repeated tetranucleotides" },
  { x: "CGTACCAGTTAC", y: "TAGTACTCGAC", name: "12-bp genomic snippet" },
  { x: "ALGORITHM", y: "ANALYTICS", name: "General text pair" },
  { x: "ATGGTGCACCTGACTCCTGAGGAG", y: "ATGGTGCACCTGACTCCTGTGGAG", name: "Sickle-cell beta-globin SNP" },
  { x: "GGATCGA", y: "RICE_GENE", name: "Mixed alphabet check" }
];

for (const pair of crossPairs) {
  const gridRes = solveGridDP(pair.x, pair.y);
  const spaceRes = solveSpaceOptimizedDP(pair.x, pair.y);
  const hirschRes = solveHirschberg(pair.x, pair.y);

  const lenMatch = gridRes.length === spaceRes.length && spaceRes.length === hirschRes.length;
  assert(
    lenMatch,
    `Length consistency on "${pair.name}": (${gridRes.length} == ${spaceRes.length} == ${hirschRes.length})`,
    `Grid=${gridRes.length}, SpaceOpt=${spaceRes.length}, Hirsch=${hirschRes.length}`
  );

  const gridValid = isSubsequence(gridRes.lcs, pair.x) && isSubsequence(gridRes.lcs, pair.y) && gridRes.lcs.length === gridRes.length;
  assert(gridValid, `Grid DP LCS "${gridRes.lcs}" is valid subsequence for "${pair.name}"`);

  const hirschValid = isSubsequence(hirschRes.lcs, pair.x) && isSubsequence(hirschRes.lcs, pair.y) && hirschRes.lcs.length === hirschRes.length;
  assert(hirschValid, `Hirschberg LCS "${hirschRes.lcs}" is valid subsequence for "${pair.name}"`);
}

// -------------------------------------------------------------
// Test Suite 2: Boundary & Extreme Cases
// -------------------------------------------------------------
console.log(`\n${colors.bold}[2/6] Boundary & Extreme Cases${colors.reset}`);

// 2.1 Both empty
const bothEmptyGrid = solveGridDP("", "");
const bothEmptyHirsch = solveHirschberg("", "");
assert(bothEmptyGrid.length === 0 && bothEmptyGrid.lcs === "", 'Both empty strings -> LCS = "" (Grid DP)');
assert(bothEmptyHirsch.length === 0 && bothEmptyHirsch.lcs === "", 'Both empty strings -> LCS = "" (Hirschberg)');

// 2.2 One empty
const oneEmptyGrid = solveGridDP("", "ACGT");
const oneEmptyHirsch = solveHirschberg("ACGT", "");
assert(oneEmptyGrid.length === 0 && oneEmptyGrid.lcs === "", 'One empty string -> LCS = 0 (Grid DP)');
assert(oneEmptyHirsch.length === 0 && oneEmptyHirsch.lcs === "", 'One empty string -> LCS = 0 (Hirschberg)');

// 2.3 Completely disjoint
const disjointGrid = solveGridDP("AAAA", "CCCC");
const disjointHirsch = solveHirschberg("AAAA", "CCCC");
assert(disjointGrid.length === 0 && disjointGrid.lcs === "", 'Disjoint strings "AAAA" vs "CCCC" -> LCS = 0 (Grid DP)');
assert(disjointHirsch.length === 0 && disjointHirsch.lcs === "", 'Disjoint strings "AAAA" vs "CCCC" -> LCS = 0 (Hirschberg)');

// 2.4 Identical strings
const identicalGrid = solveGridDP("AGCTAGCT", "AGCTAGCT");
const identicalHirsch = solveHirschberg("AGCTAGCT", "AGCTAGCT");
assert(identicalGrid.lcs === "AGCTAGCT", 'Identical strings -> LCS = original sequence (Grid DP)');
assert(identicalHirsch.lcs === "AGCTAGCT", 'Identical strings -> LCS = original sequence (Hirschberg)');

// 2.5 Single characters
const singleMatch = solveHirschberg("A", "A");
const singleMismatch = solveHirschberg("A", "T");
assert(singleMatch.lcs === "A", 'Single char match ("A" vs "A") -> LCS = "A"');
assert(singleMismatch.lcs === "", 'Single char mismatch ("A" vs "T") -> LCS = ""');

// -------------------------------------------------------------
// Test Suite 3: StepSnapshot Schema Conformance
// -------------------------------------------------------------
console.log(`\n${colors.bold}[3/6] StepSnapshot Schema Conformance${colors.reset}`);

const sampleGrid = solveGridDP("ACG", "AG");
assert(sampleGrid.steps.length > 0, "Grid DP generated non-empty snapshot steps");
assert(sampleGrid.steps[0].phase === "init", "Grid DP step 0 has phase 'init'");
assert(sampleGrid.steps[sampleGrid.steps.length - 1].phase === "finished", "Grid DP last step has phase 'finished'");
assert(sampleGrid.steps.every(s => typeof s.explanation === "string" && s.explanation.length > 0), "All Grid DP steps have valid explanations");
assert(sampleGrid.steps.some(s => s.phase === "traceback"), "Grid DP contains traceback phase steps");

const sampleSpace = solveSpaceOptimizedDP("ACG", "AG");
assert(sampleSpace.steps[0].phase === "init", "Space-Optimized DP step 0 has phase 'init'");
assert(sampleSpace.steps[sampleSpace.steps.length - 1].phase === "finished", "Space-Optimized DP last step has phase 'finished'");
assert(sampleSpace.steps.some(s => s.twoRowSnapshot !== undefined), "Space-Optimized DP steps contain twoRowSnapshot");

const sampleHirsch = solveHirschberg("ACG", "AG");
assert(sampleHirsch.steps[0].phase === "init", "Hirschberg step 0 has phase 'init'");
assert(sampleHirsch.steps[sampleHirsch.steps.length - 1].phase === "finished", "Hirschberg last step has phase 'finished'");
assert(sampleHirsch.steps.some(s => s.hirschbergTreeSnapshot !== undefined), "Hirschberg steps contain hirschbergTreeSnapshot");

// -------------------------------------------------------------
// Test Suite 4: Sequence Alignment & Mutation Classification
// -------------------------------------------------------------
console.log(`\n${colors.bold}[4/6] Sequence Alignment & Mutation Classification${colors.reset}`);

const alignResult = generateAlignment("ACGTA", "ACATA", "ACTA");
assert(alignResult.xAligned.replace(/-/g, "") === "ACGTA", "Aligned X stripped of gaps equals original X");
assert(alignResult.yAligned.replace(/-/g, "") === "ACATA", "Aligned Y stripped of gaps equals original Y");
assert(alignResult.xAligned.length === alignResult.yAligned.length, "Aligned X and Y have equal length");
assert(alignResult.summary.matchCount === 4, "Correct match count in alignment summary");
assert(alignResult.summary.deletionCount >= 1, "Detected deletion mutation in alignment");
assert(alignResult.summary.insertionCount >= 1, "Detected insertion mutation in alignment");
assert(alignResult.summary.similarityPercentage > 0, "Valid similarity percentage calculated");

// -------------------------------------------------------------
// Test Suite 5: Traceback Alignment Equivalence
// -------------------------------------------------------------
console.log(`\n${colors.bold}[5/6] Traceback Matrix Alignment Equivalence${colors.reset}`);

const gridForAlign = solveGridDP("ACGTA", "ACATA");
const alignFromTB = generateAlignment("ACGTA", "ACATA", gridForAlign.tracebackMatrix);
assert(alignFromTB.xAligned.replace(/-/g, "") === "ACGTA", "Traceback aligned X matches original");
assert(alignFromTB.yAligned.replace(/-/g, "") === "ACATA", "Traceback aligned Y matches original");
assert(alignFromTB.summary.matchCount === gridForAlign.length, "Matches in traceback alignment match LCS length");

// -------------------------------------------------------------
// Test Suite 6: StepEngine Timeline Controller
// -------------------------------------------------------------
console.log(`\n${colors.bold}[6/6] StepEngine Timeline Controller${colors.reset}`);

const engine = new StepEngine(sampleGrid.steps);
assert(engine.getTotalSteps() === sampleGrid.steps.length, "StepEngine reports correct total steps");
assert(engine.isAtStart() === true, "StepEngine starts at beginning");
assert(engine.getCurrentStep().phase === "init", "StepEngine initial step is 'init'");

const nextStep = engine.next();
assert(nextStep !== null && engine.getCurrentIndex() === 1, "StepEngine next() advances step index");

engine.jumpToStep(5);
assert(engine.getCurrentIndex() === 5, "StepEngine jumpToStep(5) seeks directly to index 5");

const progress = engine.getProgress();
assert(progress.current === 6 && progress.total === sampleGrid.steps.length, "StepEngine progress calculation correct");

engine.finish();
assert(engine.isAtEnd() === true, "StepEngine finish() moves pointer to final step");
assert(engine.next() === null, "StepEngine next() at end returns null");

engine.reset();
assert(engine.isAtStart() === true && engine.getCurrentIndex() === 0, "StepEngine reset() returns pointer to 0");

// -------------------------------------------------------------
// Final Report
// -------------------------------------------------------------
console.log(`\n${colors.bold}${colors.cyan}==============================================================${colors.reset}`);
console.log(`${colors.bold}SUMMARY:${colors.reset} Total: ${totalTests} | ${colors.green}Passed: ${passedTests}${colors.reset} | ${colors.red}Failed: ${failedTests}${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}==============================================================${colors.reset}\n`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log(`${colors.green}${colors.bold}ALL UNIT TESTS PASSED SUCCESSFULLY! (Exit code 0)${colors.reset}\n`);
  process.exit(0);
}
