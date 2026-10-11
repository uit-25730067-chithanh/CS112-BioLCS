/**
 * Grid DP 2D Module with Full Matrix Computation & Traceback
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * 
 * Implements Cormen et al. (CLRS) 2D Dynamic Programming table
 * with step-by-step state snapshot recording for GUI animation.
 */

/**
 * Creates a deep copy of a 2D numeric matrix.
 * @param {number[][]} mat
 * @returns {number[][]}
 */
function copyMatrix(mat) {
  return mat.map(row => row.slice());
}

/**
 * Solves Longest Common Subsequence using classic 2D Dynamic Programming.
 * 
 * @param {string} xSeq - First sequence (rows in DP table)
 * @param {string} ySeq - Second sequence (columns in DP table)
 * @param {object} [options] - Configuration options
 * @param {boolean} [options.recordSnapshots=true] - Whether to capture detailed step snapshots
 * @returns {{
 *   length: number,
 *   lcs: string,
 *   matrix: number[][],
 *   tracebackMatrix: string[][],
 *   steps: Array<object>
 * }}
 */
export function solveGridDP(xSeq = "", ySeq = "", options = {}) {
  const { recordSnapshots = true } = options;
  const m = xSeq.length;
  const n = ySeq.length;
  const steps = [];

  // Initialize DP score table L of dimensions (m + 1) x (n + 1)
  const L = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  
  // Initialize traceback direction table B: "DIAG", "UP", "LEFT", or ""
  const B = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(""));

  // Initial step snapshot
  if (recordSnapshots) {
    steps.push({
      stepIndex: steps.length,
      algorithm: "grid_dp",
      phase: "init",
      matrixSnapshot: copyMatrix(L),
      lcsAccumulated: "",
      explanation: `Initialized DP table size (${m + 1} x ${n + 1}) with boundary base cases L[0, j] = 0 and L[i, 0] = 0.`
    });
  }

  // Cell computation phase
  for (let i = 1; i <= m; i++) {
    const charX = xSeq[i - 1];
    for (let j = 1; j <= n; j++) {
      const charY = ySeq[j - 1];
      const isMatch = charX === charY;

      if (isMatch) {
        L[i][j] = L[i - 1][j - 1] + 1;
        B[i][j] = "DIAG";
      } else {
        if (L[i - 1][j] >= L[i][j - 1]) {
          L[i][j] = L[i - 1][j];
          B[i][j] = "UP";
        } else {
          L[i][j] = L[i][j - 1];
          B[i][j] = "LEFT";
        }
      }

      if (recordSnapshots) {
        steps.push({
          stepIndex: steps.length,
          algorithm: "grid_dp",
          phase: "cell_computation",
          currentCell: {
            row: i,
            col: j,
            charX,
            charY,
            isMatch,
            val: L[i][j],
            arrow: B[i][j]
          },
          matrixSnapshot: copyMatrix(L),
          lcsAccumulated: "",
          explanation: isMatch
            ? `Match found: X[${i}] = '${charX}' == Y[${j}] = '${charY}'. L[${i}, ${j}] = L[${i - 1}, ${j - 1}] + 1 = ${L[i][j]} (Direction: DIAG).`
            : `Mismatch: X[${i}] = '${charX}' != Y[${j}] = '${charY}'. L[${i}, ${j}] = max(UP: ${L[i - 1][j]}, LEFT: ${L[i][j - 1]}) = ${L[i][j]} (Direction: ${B[i][j]}).`
        });
      }
    }
  }

  // Traceback phase from bottom-right (m, n) back to (0, 0)
  let currI = m;
  let currJ = n;
  const lcsChars = [];

  while (currI > 0 && currJ > 0) {
    const arrow = B[currI][currJ];
    const charX = xSeq[currI - 1];
    const charY = ySeq[currJ - 1];
    const isMatch = arrow === "DIAG";

    if (recordSnapshots) {
      steps.push({
        stepIndex: steps.length,
        algorithm: "grid_dp",
        phase: "traceback",
        currentCell: {
          row: currI,
          col: currJ,
          charX,
          charY,
          isMatch,
          val: L[currI][currJ],
          arrow
        },
        matrixSnapshot: copyMatrix(L),
        lcsAccumulated: lcsChars.slice().reverse().join(""),
        explanation: isMatch
          ? `Traceback at (${currI}, ${currJ}): DIAG arrow. Character '${charX}' added to LCS. Moving to (${currI - 1}, ${currJ - 1}).`
          : `Traceback at (${currI}, ${currJ}): ${arrow} arrow. Moving to (${arrow === "UP" ? currI - 1 : currI}, ${arrow === "LEFT" ? currJ - 1 : currJ}).`
      });
    }

    if (arrow === "DIAG") {
      lcsChars.push(charX);
      currI--;
      currJ--;
    } else if (arrow === "UP") {
      currI--;
    } else {
      currJ--;
    }
  }

  const finalLcs = lcsChars.reverse().join("");

  // Finished snapshot
  steps.push({
    stepIndex: steps.length,
    algorithm: "grid_dp",
    phase: "finished",
    matrixSnapshot: recordSnapshots ? copyMatrix(L) : [],
    lcsAccumulated: finalLcs,
    explanation: `Grid DP completed. Optimal LCS length is ${L[m][n]} with recovered sequence "${finalLcs}".`
  });

  return {
    length: L[m][n],
    lcs: finalLcs,
    matrix: L,
    tracebackMatrix: B,
    steps
  };
}
