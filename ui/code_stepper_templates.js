/**
 * Algorithm Code Stepper Templates & Active Line Mapping
 * Provides clean Python 3, CLRS pseudocode, and dynamic line mapping.
 */

export const CODE_TEMPLATES = {
  grid: {
    title: 'Giải Thuật Quy Hoạch Động 2D (CLRS LCS)',
    titleEn: '2D Dynamic Programming (CLRS LCS)',
    pseudo: [
      'function LCS_Length(X, Y):',
      '  m = length(X); n = length(Y)',
      '  for i = 0 to m: L[i, 0] = 0',
      '  for j = 0 to n: L[0, j] = 0',
      '  for i = 1 to m:',
      '    for j = 1 to n:',
      '      if X[i] == Y[j]:',
      '        L[i, j] = L[i-1, j-1] + 1',
      '        B[i, j] = "DIAG" (↖)',
      '      else if L[i-1, j] >= L[i, j-1]:',
      '        L[i, j] = L[i-1, j]',
      '        B[i, j] = "UP" (↑)',
      '      else:',
      '        L[i, j] = L[i, j-1]',
      '        B[i, j] = "LEFT" (←)',
      '  return L, B',
      'function Traceback(B, X, m, n):',
      '  while i > 0 and j > 0:',
      '    if B[i, j] == "DIAG":',
      '      lcs.append(X[i]); i--; j--',
      '    else if B[i, j] == "UP": i--',
      '    else: j--',
      '  return reverse(lcs)'
    ],
    py: [
      'def lcs_grid_dp(x: str, y: str) -> tuple[int, str]:',
      '    m, n = len(x), len(y)',
      '    L = [[0] * (n + 1) for _ in range(m + 1)]',
      '    B = [[""] * (n + 1) for _ in range(m + 1)]',
      '    for i in range(1, m + 1):',
      '        for j in range(1, n + 1):',
      '            if x[i - 1] == y[j - 1]:',
      '                L[i][j] = L[i - 1][j - 1] + 1',
      '                B[i][j] = "DIAG"',
      '            elif L[i - 1][j] >= L[i][j - 1]:',
      '                L[i][j] = L[i - 1][j]',
      '                B[i][j] = "UP"',
      '            else:',
      '                L[i][j] = L[i][j - 1]',
      '                B[i][j] = "LEFT"',
      '    i, j, lcs = m, n, []',
      '    while i > 0 and j > 0:',
      '        if B[i][j] == "DIAG":',
      '            lcs.append(x[i - 1]); i -= 1; j -= 1',
      '        elif B[i][j] == "UP": i -= 1',
      '        else: j -= 1',
      '    return L[m][n], "".join(reversed(lcs))'
    ]
  },

  space_opt: {
    title: 'Quy Hoạch Động 2 Dòng O(min(M,N)) (Ping-Pong Buffer)',
    titleEn: '2-Row Space-Optimized DP (Ping-Pong Buffer)',
    pseudo: [
      'function LCS_2Row(X, Y):',
      '  m = length(X); n = length(Y)',
      '  prev = array(n + 1, 0)',
      '  curr = array(n + 1, 0)',
      '  for i = 1 to m:',
      '    curr[0] = 0',
      '    for j = 1 to n:',
      '      if X[i] == Y[j]:',
      '        curr[j] = prev[j - 1] + 1',
      '      else:',
      '        curr[j] = max(prev[j], curr[j - 1])',
      '    prev = copy(curr) // Swap buffer',
      '  return curr[n]'
    ],
    py: [
      'def lcs_2row_dp(x: str, y: str) -> int:',
      '    m, n = len(x), len(y)',
      '    prev = [0] * (n + 1)',
      '    curr = [0] * (n + 1)',
      '    for i in range(1, m + 1):',
      '        curr[0] = 0',
      '        for j in range(1, n + 1):',
      '            if x[i - 1] == y[j - 1]:',
      '                curr[j] = prev[j - 1] + 1',
      '            else:',
      '                curr[j] = max(prev[j], curr[j - 1])',
      '        prev = curr[:]  # Swap 2-row buffer',
      '    return curr[n]'
    ]
  },

  hirschberg: {
    title: 'Thuật Toán Hirschberg (Chia Để Trị + Bộ Nhớ O(N))',
    titleEn: 'Hirschberg D&C Algorithm (Linear O(N) Space)',
    pseudo: [
      'function Hirschberg(X, Y):',
      '  if length(X) == 0: return ""',
      '  if length(X) == 1: return (X[1] in Y ? X[1] : "")',
      '  mid = floor(length(X) / 2)',
      '  L1 = LLCS(X[1..mid], Y)',
      '  L2 = LLCS(reverse(X[mid+1..m]), reverse(Y))',
      '  k = argmax_j (L1[j] + L2[n-j])',
      '  left = Hirschberg(X[1..mid], Y[1..k])',
      '  right = Hirschberg(X[mid+1..m], Y[k+1..n])',
      '  return left + right'
    ],
    py: [
      'def solve_hirschberg(x: str, y: str) -> str:',
      '    if len(x) == 0: return ""',
      '    if len(x) == 1: return x if x in y else ""',
      '    mid = len(x) // 2',
      '    L1 = llcs(x[:mid], y)',
      '    L2 = llcs(x[mid:][::-1], y[::-1])',
      '    k = max(range(len(y) + 1), key=lambda j: L1[j] + L2[len(y) - j])',
      '    left = solve_hirschberg(x[:mid], y[:k])',
      '    right = solve_hirschberg(x[mid:], y[k:])',
      '    return left + right'
    ]
  }
};

function fmtSeq(s) {
  if (!s) return '""';
  return s.length <= 14 ? `"${s}"` : `"${s.slice(0, 10)}..." (${s.length} bp)`;
}

export function getCodeLines(algoKey, lang = 'py', seqX = '', seqY = '', uiLang = 'vi') {
  const normLang = (lang === 'pseudo') ? 'pseudo' : 'py';
  const tpl = CODE_TEMPLATES[algoKey] || CODE_TEMPLATES.grid;
  const raw = tpl[normLang] || tpl.py;
  const sX = fmtSeq(seqX), sY = fmtSeq(seqY);
  const isEn = uiLang === 'en';

  return raw.map((line, idx) => {
    if (idx === 0) {
      if (algoKey === 'grid') return normLang === 'py' ? `def lcs_grid_dp(x = ${sX}, y = ${sY}):` : `function LCS_Length(X = ${sX}, Y = ${sY}):`;
      if (algoKey === 'space_opt') return normLang === 'py' ? `def lcs_2row_dp(x = ${sX}, y = ${sY}):` : `function LCS_2Row(X = ${sX}, Y = ${sY}):`;
      if (algoKey === 'hirschberg') return normLang === 'py' ? `def solve_hirschberg(x = ${sX}, y = ${sY}):` : `function Hirschberg(X = ${sX}, Y = ${sY}):`;
    }
    if (idx === 1 && seqX && seqY) {
      if (algoKey === 'grid') {
        return normLang === 'py'
          ? (isEn ? `    m, n = ${seqX.length}, ${seqY.length}  # DP Table L: ${seqX.length + 1}×${seqY.length + 1}` : `    m, n = ${seqX.length}, ${seqY.length}  # Ma trận L: ${seqX.length + 1}×${seqY.length + 1}`)
          : (isEn ? `  m = ${seqX.length}; n = ${seqY.length} // DP Table: ${seqX.length + 1}×${seqY.length + 1}` : `  m = ${seqX.length}; n = ${seqY.length} // Bảng DP: ${seqX.length + 1}×${seqY.length + 1}`);
      }
      if (algoKey === 'space_opt') {
        return normLang === 'py'
          ? (isEn ? `    m, n = ${seqX.length}, ${seqY.length}  # RAM 2×${seqY.length + 1}` : `    m, n = ${seqX.length}, ${seqY.length}  # RAM 2×${seqY.length + 1}`)
          : (isEn ? `  m = ${seqX.length}; n = ${seqY.length} // RAM 2×${seqY.length + 1}` : `  m = ${seqX.length}; n = ${seqY.length} // RAM 2×${seqY.length + 1}`);
      }
    }
    return line;
  });
}

export function mapSnapshotToLine(algoKey, lang, snapshot) {
  if (!snapshot) return 1;
  const isPy = lang !== 'pseudo';

  if (algoKey === 'grid') {
    if (snapshot.phase === 'init') return 3;
    if (snapshot.phase === 'cell_computation') {
      const c = snapshot.currentCell;
      return (c && c.isMatch) ? 8 : ((c && c.arrow === 'UP') ? 11 : 14);
    }
    if (snapshot.phase === 'traceback') {
      return (snapshot.isMatch || snapshot.arrow === 'DIAG') ? 19 : (snapshot.arrow === 'UP' ? 20 : 21);
    }
    if (snapshot.phase === 'finished') return isPy ? 22 : 23;
  }

  if (algoKey === 'space_opt') {
    if (snapshot.phase === 'init') return 3;
    if (snapshot.phase === 'cell_computation') return snapshot.isMatch ? (isPy ? 9 : 8) : (isPy ? 11 : 10);
    if (snapshot.phase === 'row_swap') return isPy ? 12 : 11;
    if (snapshot.phase === 'finished') return isPy ? 13 : 12;
  }

  if (algoKey === 'hirschberg') {
    const m = { base_case: 2, split: 4, forward_llcs: 5, backward_llcs: 6, find_split: 7 };
    if (m[snapshot.phase]) return m[snapshot.phase];
    if (snapshot.phase === 'recurse') return 8;
    if (snapshot.phase === 'finished') return 10;
  }

  return 1;
}
