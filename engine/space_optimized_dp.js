/**
 * Space-Optimized DP Module (Ping-Pong 2-Row Buffer)
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * 
 * Computes LCS length using only two alternating rows of size min(m, n) + 1.
 * Achieves O(min(m, n)) space complexity with O(m * n) time.
 * Demonstrates the fatal drawback: unable to reconstruct full LCS string without full table.
 */

/**
 * Solves LCS length using space-optimized 2-row DP.
 * 
 * @param {string} xSeq - First sequence
 * @param {string} ySeq - Second sequence
 * @param {object} [options] - Configuration options
 * @param {boolean} [options.swapForMinSpace=false] - Whether to orient shorter sequence to columns
 * @returns {{
 *   length: number,
 *   operationsCount: number,
 *   memoryBytesEstimated: number,
 *   steps: Array<object>
 * }}
 */
export function solveSpaceOptimizedDP(xSeq = "", ySeq = "", options = {}) {
  // If user requests absolute minimal memory, ensure ySeq is the shorter sequence
  let seqA = xSeq;
  let seqB = ySeq;
  if (options.swapForMinSpace && seqA.length < seqB.length) {
    seqA = ySeq;
    seqB = xSeq;
  }

  const m = seqA.length;
  const n = seqB.length;
  const steps = [];
  let operationsCount = 0;

  // 8 bytes per number (IEEE 754 64-bit float representation)
  const memoryBytesEstimated = 2 * (n + 1) * 8;

  let prevRow = new Array(n + 1).fill(0);
  let currRow = new Array(n + 1).fill(0);

  // Initial step snapshot
  steps.push({
    stepIndex: steps.length,
    algorithm: "space_optimized",
    phase: "init",
    twoRowSnapshot: {
      prevRow: prevRow.slice(),
      currRow: currRow.slice(),
      activeRowIndex: 0
    },
    lcsAccumulated: "",
    explanation: `Initialized 2-row ping-pong buffer with 2 x ${n + 1} cells. Estimated RAM: ${memoryBytesEstimated} bytes (vs Full Matrix: ${(m + 1) * (n + 1) * 8} bytes).`
  });

  for (let i = 1; i <= m; i++) {
    const charA = seqA[i - 1];
    currRow[0] = 0;

    for (let j = 1; j <= n; j++) {
      const charB = seqB[j - 1];
      operationsCount++;

      if (charA === charB) {
        currRow[j] = prevRow[j - 1] + 1;
      } else {
        currRow[j] = Math.max(prevRow[j], currRow[j - 1]);
      }
    }

    // Record step snapshot per completed row
    steps.push({
      stepIndex: steps.length,
      algorithm: "space_optimized",
      phase: "cell_computation",
      twoRowSnapshot: {
        prevRow: prevRow.slice(),
        currRow: currRow.slice(),
        activeRowIndex: i
      },
      lcsAccumulated: "",
      explanation: `Computed row ${i}/${m} for character '${charA}'. Current row values: [${currRow.join(", ")}]. Overwriting previous row for next iteration.`
    });

    // Ping-pong buffer swap: copy current row into previous row
    prevRow = currRow.slice();
    currRow.fill(0);
  }

  const finalLength = prevRow[n] || 0;

  // Finished snapshot
  steps.push({
    stepIndex: steps.length,
    algorithm: "space_optimized",
    phase: "finished",
    twoRowSnapshot: {
      prevRow: prevRow.slice(),
      currRow: currRow.slice(),
      activeRowIndex: m
    },
    lcsAccumulated: "",
    explanation: `Space-Optimized DP completed. LCS length: ${finalLength} with ${operationsCount} operations. Notice: Subsequence text cannot be recovered due to row overwrites.`
  });

  return {
    length: finalLength,
    operationsCount,
    memoryBytesEstimated,
    steps
  };
}
