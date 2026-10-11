/**
 * Hirschberg Algorithm Module (Divide-and-Conquer + Linear-Space DP)
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * 
 * Reference: Daniel S. Hirschberg (1975), CACM.
 * Achieves O(min(m, n)) space complexity AND full sequence recovery.
 * Time complexity: <= 2 * O(m * n) = O(m * n).
 */

/**
 * Reverses a string.
 * @param {string} str
 * @returns {string}
 */
function reverseString(str) {
  return str.split("").reverse().join("");
}

/**
 * Linear-Space LCS vector computation (LLCS).
 * Computes the last row of the LCS DP table between xStr and yStr using 2 rows.
 * 
 * @param {string} xStr
 * @param {string} yStr
 * @returns {number[]} Array of size yStr.length + 1
 */
export function llcs(xStr, yStr) {
  const n = yStr.length;
  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);

  for (let i = 0; i < xStr.length; i++) {
    const charX = xStr[i];
    curr[0] = 0;
    for (let j = 0; j < n; j++) {
      const charY = yStr[j];
      if (charX === charY) {
        curr[j + 1] = prev[j] + 1;
      } else {
        curr[j + 1] = Math.max(prev[j + 1], curr[j]);
      }
    }
    prev = curr.slice();
  }

  return prev;
}

/**
 * Internal recursive implementation of Hirschberg's algorithm.
 * 
 * @param {string} xStr - Substring of X
 * @param {string} yStr - Substring of Y
 * @param {number} depth - Recursion tree depth
 * @param {Array<object>} steps - Step recorder
 * @returns {string} Recovered LCS sequence for this subproblem
 */
function hirschbergInternal(xStr, yStr, depth, steps) {
  const m = xStr.length;
  const n = yStr.length;

  // Base case 1: either string is empty
  if (m === 0 || n === 0) {
    return "";
  }

  // Base case 2: X has length 1
  if (m === 1) {
    const char = xStr[0];
    const found = yStr.includes(char);
    const result = found ? char : "";
    steps.push({
      stepIndex: steps.length,
      algorithm: "hirschberg",
      phase: "conquer_merge",
      hirschbergTreeSnapshot: {
        depth,
        xSub: xStr,
        ySub: yStr,
        midIndex: 0,
        splitPointK: found ? yStr.indexOf(char) : 0,
        leftScore: [],
        rightScore: []
      },
      lcsAccumulated: result,
      explanation: found
        ? `Base case (m=1): Character '${char}' found in Y ("${yStr}"). Solved: "${result}".`
        : `Base case (m=1): Character '${char}' NOT found in Y ("${yStr}"). Solved: "".`
    });
    return result;
  }

  // Base case 3: Y has length 1 (optimization)
  if (n === 1) {
    const char = yStr[0];
    const found = xStr.includes(char);
    const result = found ? char : "";
    steps.push({
      stepIndex: steps.length,
      algorithm: "hirschberg",
      phase: "conquer_merge",
      hirschbergTreeSnapshot: {
        depth,
        xSub: xStr,
        ySub: yStr,
        midIndex: Math.floor(m / 2),
        splitPointK: found ? 1 : 0,
        leftScore: [],
        rightScore: []
      },
      lcsAccumulated: result,
      explanation: found
        ? `Base case (n=1): Character '${char}' found in X ("${xStr}"). Solved: "${result}".`
        : `Base case (n=1): Character '${char}' NOT found in X ("${xStr}"). Solved: "".`
    });
    return result;
  }

  // Divide step: bisect X at middle index
  const mid = Math.floor(m / 2);
  const xLeft = xStr.slice(0, mid);
  const xRight = xStr.slice(mid);

  // Compute forward and reverse LLCS vectors
  const scoreLeft = llcs(xLeft, yStr);
  const scoreRight = llcs(reverseString(xRight), reverseString(yStr));

  // Find optimal split point k* on Y maximizing scoreLeft[j] + scoreRight[n - j]
  let maxScore = -1;
  let splitK = 0;
  for (let j = 0; j <= n; j++) {
    const totalScore = scoreLeft[j] + scoreRight[n - j];
    if (totalScore > maxScore) {
      maxScore = totalScore;
      splitK = j;
    }
  }

  steps.push({
    stepIndex: steps.length,
    algorithm: "hirschberg",
    phase: "divide",
    hirschbergTreeSnapshot: {
      depth,
      xSub: xStr,
      ySub: yStr,
      midIndex: mid,
      splitPointK: splitK,
      leftScore: scoreLeft.slice(),
      rightScore: scoreRight.slice()
    },
    lcsAccumulated: "",
    explanation: `Divided X ("${xStr}") at index ${mid} -> Left: "${xLeft}", Right: "${xRight}". Found optimal split point on Y at index k*=${splitK} (max combined score: ${maxScore}).`
  });

  // Conquer step: recursive descent
  const zLeft = hirschbergInternal(xLeft, yStr.slice(0, splitK), depth + 1, steps);
  const zRight = hirschbergInternal(xRight, yStr.slice(splitK), depth + 1, steps);

  // Combine step: concatenate left and right solutions
  const mergedLcs = zLeft + zRight;

  steps.push({
    stepIndex: steps.length,
    algorithm: "hirschberg",
    phase: "conquer_merge",
    hirschbergTreeSnapshot: {
      depth,
      xSub: xStr,
      ySub: yStr,
      midIndex: mid,
      splitPointK: splitK,
      leftScore: scoreLeft.slice(),
      rightScore: scoreRight.slice()
    },
    lcsAccumulated: mergedLcs,
    explanation: `Merged subproblems at depth ${depth}: Left("${zLeft}") + Right("${zRight}") -> "${mergedLcs}".`
  });

  return mergedLcs;
}

/**
 * Solves LCS problem using Hirschberg's linear-space divide-and-conquer algorithm.
 * 
 * @param {string} xSeq - First sequence
 * @param {string} ySeq - Second sequence
 * @returns {{
 *   length: number,
 *   lcs: string,
 *   steps: Array<object>
 * }}
 */
export function solveHirschberg(xSeq = "", ySeq = "") {
  const steps = [];

  steps.push({
    stepIndex: steps.length,
    algorithm: "hirschberg",
    phase: "init",
    hirschbergTreeSnapshot: {
      depth: 0,
      xSub: xSeq,
      ySub: ySeq,
      midIndex: Math.floor(xSeq.length / 2),
      splitPointK: 0,
      leftScore: [],
      rightScore: []
    },
    lcsAccumulated: "",
    explanation: `Initialized Hirschberg algorithm for X (length ${xSeq.length}) and Y (length ${ySeq.length}). Space complexity: O(min(m, n)).`
  });

  const finalLcs = hirschbergInternal(xSeq, ySeq, 0, steps);

  steps.push({
    stepIndex: steps.length,
    algorithm: "hirschberg",
    phase: "finished",
    hirschbergTreeSnapshot: {
      depth: 0,
      xSub: xSeq,
      ySub: ySeq,
      midIndex: Math.floor(xSeq.length / 2),
      splitPointK: 0,
      leftScore: [],
      rightScore: []
    },
    lcsAccumulated: finalLcs,
    explanation: `Hirschberg completed successfully. Recovered optimal LCS "${finalLcs}" with length ${finalLcs.length}.`
  });

  return {
    length: finalLcs.length,
    lcs: finalLcs,
    steps
  };
}
