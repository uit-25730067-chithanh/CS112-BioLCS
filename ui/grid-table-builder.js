/**
 * DP Table DOM Construction Helper for GridRenderer
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * Student: Dang Chi Thanh (MSSV: 25730067)
 */

export function getNtClass(char) {
  if (!char) return 'nt-other';
  const c = char.toUpperCase();
  if (c === 'A') return 'nt-a';
  if (c === 'T') return 'nt-t';
  if (c === 'G') return 'nt-g';
  if (c === 'C') return 'nt-c';
  if (c === 'U') return 'nt-u';
  return 'nt-other';
}

export function buildDPTableDOM(seqX, seqY, onCellClick) {
  const m = seqX.length;
  const n = seqY.length;
  const table = document.createElement('table');
  table.className = 'dp-table';
  const cells = Array.from({ length: m + 1 }, () => new Array(n + 1));

  // Row 0: Headers
  const headerRow = document.createElement('tr');
  const cornerTh = document.createElement('th');
  cornerTh.className = 'corner-header';
  cornerTh.innerHTML = 'i \\ j';
  headerRow.appendChild(cornerTh);

  const emptyColTh = document.createElement('th');
  emptyColTh.innerHTML = '<span style="color:var(--text-muted)">ε</span><br><small style="font-size:0.65rem">0</small>';
  headerRow.appendChild(emptyColTh);

  for (let j = 0; j < n; j++) {
    const th = document.createElement('th');
    th.className = 'col-header';
    th.id = `col-header-${j + 1}`;
    const char = seqY[j];
    th.innerHTML = `<span class="nt-badge ${getNtClass(char)}">${char}</span><br><small style="font-size:0.65rem">${j + 1}</small>`;
    headerRow.appendChild(th);
  }
  table.appendChild(headerRow);

  // Rows 0..m
  for (let i = 0; i <= m; i++) {
    const row = document.createElement('tr');
    const rowTh = document.createElement('th');
    rowTh.className = 'row-header';
    rowTh.id = `row-header-${i}`;
    if (i === 0) {
      rowTh.innerHTML = '<span style="color:var(--text-muted)">ε</span> (0)';
    } else {
      const char = seqX[i - 1];
      rowTh.innerHTML = `<span class="nt-badge ${getNtClass(char)}">${char}</span> (${i})`;
    }
    row.appendChild(rowTh);

    for (let j = 0; j <= n; j++) {
      const td = document.createElement('td');
      td.className = 'dp-cell';
      td.id = `cell-${i}-${j}`;
      td.dataset.i = i;
      td.dataset.j = j;

      if (i === 0 || j === 0) {
        td.dataset.stateKey = 'base_0';
        td.innerHTML = '<div class="cell-content"><span class="cell-val">0</span></div>';
      } else {
        td.classList.add('cell-uncomputed');
        td.dataset.stateKey = 'uncomputed';
        td.innerHTML = '<div class="cell-content"><span class="cell-val">·</span></div>';
      }

      td.addEventListener('click', () => onCellClick?.(i, j));
      row.appendChild(td);
      cells[i][j] = td;
    }
    table.appendChild(row);
  }

  return { table, cells };
}
