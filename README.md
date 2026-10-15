# BioLCS Studio — Plant Genomics Sequence Alignment & LCS Algorithm Suite

[![Live Demo](https://img.shields.io/badge/Demo-biolcs.vercel.app-10b981?style=for-the-badge&logo=vercel)](https://biolcs.vercel.app)
[![YouTube Video](https://img.shields.io/badge/YouTube-4K%20UHD%20Walkthrough-ef4444?style=for-the-badge&logo=youtube)](https://youtu.be/byLa-Dqlw0Q)
[![License: MIT](https://img.shields.io/badge/License-MIT-3b82f6?style=for-the-badge)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0-339933?style=for-the-badge&logo=node.js)](package.json)
[![Academic Course](https://img.shields.io/badge/VNUHCM--UIT-CS112%20Term%20Project-0052cc?style=for-the-badge)](https://www.uit.edu.vn)

![BioLCS Studio Cover](docs/cover.png)

> **BioLCS Studio** is an academic-grade algorithm visualizer and empirical benchmark suite engineered for **CS112 (Algorithm Analysis & Design)** at **VNUHCM - University of Information Technology (UIT)**.  
> The project investigates and resolves the quadratic memory bottleneck ($\mathcal{O}(m \times n)$) in unweighted sequence alignment by contrasting **Classic 2D Grid DP**, **Space-Optimized 2-Row DP**, and **Hirschberg's Divide-and-Conquer Algorithm (1975)** across authentic chloroplast *rbcL* gene sequences from *Oryza sativa* (Rice) and *Zea mays* (Maize).

---

## Table of Contents

- [1. Biological Context & The Quadratic Memory Crisis](#1-biological-context--the-quadratic-memory-crisis)
- [2. Mathematical Formalism & Recurrence Models](#2-mathematical-formalism--recurrence-models)
  - [2.1 Problem Formulation](#21-problem-formulation)
  - [2.2 Classic 2D Grid Dynamic Programming](#22-classic-2d-grid-dynamic-programming)
  - [2.3 Space-Optimized 2-Row Rolling DP](#23-space-optimized-2-row-rolling-dp)
  - [2.4 Hirschberg's Divide-and-Conquer Algorithm (1975)](#24-hirschbergs-divide-and-conquer-algorithm-1975)
- [3. Rigorous Proof of Time & Space Complexity](#3-rigorous-proof-of-time--space-complexity)
- [4. Empirical Head-to-Head Benchmark Suite](#4-empirical-head-to-head-benchmark-suite)
- [5. System Architecture & Technical Craftsmanship](#5-system-architecture--technical-craftsmanship)
- [6. Standardized 30-Testcase Benchmark Taxonomy](#6-standardized-30-testcase-benchmark-taxonomy)
- [7. Interactive Visualizer Capabilities](#7-interactive-visualizer-capabilities)
- [8. Getting Started & Verification Protocol](#8-getting-started--verification-protocol)
- [9. Academic Integrity Notice & Course Attribution](#9-academic-integrity-notice--course-attribution)
- [10. License](#10-license)

---

## 1. Biological Context & The Quadratic Memory Crisis

In molecular phylogenetics and comparative genomics, measuring evolutionary divergence between species relies on pairwise sequence alignment. The **Longest Common Subsequence (LCS)** provides the core mathematical formulation for unweighted global alignment, identifying conserved genetic domains, Single Nucleotide Polymorphisms (SNPs), and insertion/deletion mutations (indels).

```text
Sequence X (Oryza sativa rbcL):  A T G T C A C C A C A A A C A G A ...
                                 | | | | | | | | | | | | | | | | |     (Matches = LCS)
Sequence Y (Zea mays rbcL):      A T G T C A C C A C A A A C A G A ...
```

### The Quadratic Bottleneck in Browser Runtime
Classic dynamic programming computes an $(m + 1) \times (n + 1)$ matrix. When analyzing real biological sequences:
* Chloroplast ribulose-1,5-bisphosphate carboxylase/oxygenase large subunit (*rbcL*) sequences typically measure $m \approx 261\text{ bp}$ and $n \approx 261\text{ bp}$.
* The full table allocates $(261 + 1) \times (261 + 1) = 68{,}644\text{ cells}$.
* In JavaScript virtual machines (V8), allocating large multidimensional arrays and maintaining dynamic SVG/DOM trace nodes for animation triggers substantial Garbage Collection (GC) pauses, rendering mobile and standard browser tabs unresponsive.
* Scaling to full microbial genes ($1{,}500\text{--}5{,}000\text{ bp}$) demands tens of megabytes of continuous heap allocation, leading directly to `Out of Memory` tab crashes.

**BioLCS Studio** was designed to empirically demonstrate how linear-space algorithms overcome this physical barrier without compromising sequence recovery.

---

## 2. Mathematical Formalism & Recurrence Models

### 2.1 Problem Formulation

Let $\Sigma = \{A, C, G, T\}$ denote the standard DNA nucleotide alphabet. Given two sequences:
$$X = \langle x_1, x_2, \dots, x_m \rangle \quad \text{and} \quad Y = \langle y_1, y_2, \dots, y_n \rangle \quad (x_i, y_j \in \Sigma)$$

A sequence $Z = \langle z_1, z_2, \dots, z_k \rangle$ is a **subsequence** of $X$ if there exists a strictly increasing sequence of indices $\langle i_1, i_2, \dots, i_k \rangle$ such that $x_{i_r} = z_r$ for all $r \in \{1, \dots, k\}$.  
The **LCS problem** seeks a common subsequence $Z$ of maximal length $|Z| = k^*$.

---

### 2.2 Classic 2D Grid Dynamic Programming

The optimal substructure of LCS satisfies the Bellman recurrence relation for prefix subproblems $L[i, j] = |LCS(X[1 \dots i], Y[1 \dots j])|$:

$$L[i, j] = \begin{cases} 
0 & \text{if } i = 0 \text{ or } j = 0 \\
L[i-1, j-1] + 1 & \text{if } i, j > 0 \text{ and } x_i = y_j \\
\max\big(L[i-1, j], L[i, j-1]\big) & \text{if } i, j > 0 \text{ and } x_i \ne y_j 
\end{cases}$$

To recover the actual sequence string, a traceback direction matrix $B[i, j]$ is maintained simultaneously:

$$B[i, j] = \begin{cases}
\nwarrow \text{ (DIAG)} & \text{if } x_i = y_j \\
\uparrow \text{ (UP)} & \text{if } x_i \ne y_j \text{ and } L[i-1, j] \ge L[i, j-1] \\
\leftarrow \text{ (LEFT)} & \text{if } x_i \ne y_j \text{ and } L[i-1, j] < L[i, j-1]
\end{cases}$$

* **Time Complexity**: $\Theta(m \times n)$ operations.
* **Space Complexity**: $\Theta(m \times n)$ words to preserve $L$ and $B$.

---

### 2.3 Space-Optimized 2-Row Rolling DP

Observing that cell evaluation at row $i$ depends strictly on elements in row $i-1$ and row $i$, the full matrix can be compressed into a two-row ping-pong cyclic buffer indexed by parity ($i \bmod 2$):

$$L[i \bmod 2, j] = \begin{cases}
L[(i-1) \bmod 2, j-1] + 1 & \text{if } x_i = y_j \\
\max\big(L[(i-1) \bmod 2, j], L[i \bmod 2, j-1]\big) & \text{if } x_i \ne y_j
\end{cases}$$

* **Space Complexity**: $\Theta(\min(m, n))$ words by orienting the shorter sequence along the columns.
* **Critical Limitation**: Because historical rows are overwritten, traceback vectors cannot be retained. This algorithm solves the **LCS length** in linear space, but **cannot reconstruct the actual alignment string**.

---

### 2.4 Hirschberg's Divide-and-Conquer Algorithm (1975)

Daniel S. Hirschberg synthesized Divide-and-Conquer with Dynamic Programming, achieving the best of both paradigms: **linear space $\mathcal{O}(\min(m, n))$ AND complete sequence recovery in $\mathcal{O}(m \times n)$ time**.

#### Algorithmic Mechanism

1. **Midpoint Bisection**: Split sequence $X$ at index $mid = \lfloor m / 2 \rfloor$ into $X_{left} = X[1 \dots mid]$ and $X_{right} = X[mid + 1 \dots m]$.
2. **Forward DP Vector**: Compute the last row of the LCS matrix between $X_{left}$ and $Y$ using a 2-row rolling buffer:
   $$F(j) = \text{LLCS}(X[1 \dots mid], Y[1 \dots j]), \quad \forall j \in \{0, \dots, n\}$$
3. **Reverse DP Vector**: Compute the last row of the LCS matrix between the reversed suffix $X_{right}^R$ and reversed $Y^R$:
   $$R(j) = \text{LLCS}(X^R[mid + 1 \dots m], Y^R[j + 1 \dots n]), \quad \forall j \in \{0, \dots, n\}$$
4. **Optimal Cut Point Identification**: The optimal boundary index $k^*$ in $Y$ that maximizes the sum of left and right alignments is:
   $$k^* = \arg\max_{0 \le k \le n} \big(F(k) + R(n - k)\big)$$
5. **Recursive Conquer & Splice**:
   $$\text{Hirschberg}(X, Y) = \text{Hirschberg}(X[1 \dots mid], Y[1 \dots k^*]) \mathbin{\Vert} \text{Hirschberg}(X[mid + 1 \dots m], Y[k^* + 1 \dots n])$$

---

## 3. Rigorous Proof of Time & Space Complexity

### 3.1 Time Complexity: $\mathcal{O}(m \times n)$

At the root level, computing forward vector $F$ and reverse vector $R$ requires scanning a grid of dimension $m \times n$, taking $c \cdot m \cdot n$ operations.  
The algorithm then splits into two subproblems with sequence lengths:
* Subproblem 1: $\frac{m}{2} \times k^*$
* Subproblem 2: $\frac{m}{2} \times (n - k^*)$

Notice that the sum of the second sequence lengths is strictly invariant:
$$k^* + (n - k^*) = n$$

Thus, the total work executed across all subproblems at recursion depth $d$ is:
$$\sum_{i} c \left(\frac{m}{2^d} \times n_i\right) = c \cdot \frac{m}{2^d} \sum_{i} n_i = \frac{c \cdot m \cdot n}{2^d}$$

Summing over all recursion tree levels yields a geometric series:
$$T(m, n) \le c \cdot m \cdot n \sum_{d=0}^{\lfloor\log_2 m\rfloor} \left(\frac{1}{2}\right)^d < c \cdot m \cdot n \sum_{d=0}^{\infty} \left(\frac{1}{2}\right)^d = 2 c \cdot m \cdot n = \mathcal{O}(m \times n)$$

$$\therefore \text{Hirschberg incurs at most twice the operations of standard 2D DP, preserving strict } \mathcal{O}(m \times n) \text{ time.}$$

### 3.2 Space Complexity: $\mathcal{O}(\min(m, n))$

At any point during execution:
1. Two linear vectors of size $n + 1$ are allocated to evaluate $F$ and $R$.
2. The recursion stack depth is bounded by $\lceil\log_2 m\rceil$.
3. Total memory consumption satisfies:
   $$\text{Memory}(m, n) = 2 \times (n + 1) \text{ words} + \mathcal{O}(\log m) \text{ stack frames} = \mathcal{O}(\min(m, n))$$

---

## 4. Empirical Head-to-Head Benchmark Suite

All three algorithmic engines were tested on identical hardware (Apple M-series Silicon, Node.js v20.x / Chromium V8 runtime).

| Testcase Category | Sequence Dimensions | Metric | Classic 2D Grid DP | Space-Optimized 2-Row | Hirschberg D&C |
| :--- | :---: | :--- | :---: | :---: | :---: |
| **Micro Benchmark**<br>`TC_01_01` (Textbook) | $m = 7\text{ bp}$<br>$n = 6\text{ bp}$ | **Runtime**<br>**Cells Allocated**<br>**Sequence Recovery** | $0.12\text{ ms}$<br>$56\text{ cells}$<br>`AGGTC` | $0.06\text{ ms}$<br>$14\text{ cells}$<br>Length Only (5) | $0.19\text{ ms}$<br>$14\text{ cells}$<br>`AGGTC` |
| **Medium Stress**<br>`TC_04_01` (Scaled) | $m = 50\text{ bp}$<br>$n = 50\text{ bp}$ | **Runtime**<br>**Cells Allocated**<br>**Sequence Recovery** | $2.41\text{ ms}$<br>$2{,}601\text{ cells}$<br>Recovered (30 bp) | $0.98\text{ ms}$<br>$102\text{ cells}$<br>Length Only (30) | $3.15\text{ ms}$<br>$102\text{ cells}$<br>Recovered (30 bp) |
| **Authentic NCBI Genomics**<br>`TC_05_01` (*rbcL* Gene) | $m = 261\text{ bp}$<br>$n = 261\text{ bp}$ | **Runtime**<br>**Cells Allocated**<br>**RAM Heap Allocation**<br>**Memory Reduction** | $14.80\text{ ms}$<br>$68{,}644\text{ cells}$<br>$\approx 549.1\text{ KB}$<br>Baseline ($0\%$) | $4.20\text{ ms}$<br>$524\text{ cells}$<br>$\approx 4.19\text{ KB}$<br>**$-99.24\%$** (No String) | $18.40\text{ ms}$<br>$524\text{ cells}$<br>$\approx 4.25\text{ KB}$<br>**$-99.23\%$ (Full LCS)** |

> [!TIP]
> **Empirical Verdict**: On authentic chloroplast *rbcL* genomic sequences, Hirschberg achieves a **99.23% reduction in matrix memory footprint** while recovering the full 254-bp alignment sequence with negligible execution overhead ($< 4\text{ ms}$ delta).

---

## 5. System Architecture & Technical Craftsmanship

```
cs112-biolcs/
├── index.html                 # Semantic HTML5 application entry point
├── package.json               # NPM scripts and zero-dependency manifest
├── vercel.json                # Vercel static Edge deployment routing
├── LICENSE                    # MIT open-source license
├── README.md                  # Comprehensive academic and engineering guide
│
├── engine/                    # Pure, side-effect-free algorithmic core
│   ├── grid_dp.js             # Classic 2D Grid DP with traceback pointer matrix
│   ├── space_optimized_dp.js  # 2-Row ping-pong cyclic buffer engine
│   ├── hirschberg.js          # Hirschberg D&C with linear-space LLCS vectors
│   ├── alignment.js           # Sequence alignment formatter & mutation classifier
│   ├── sequence_classifier.js # Sequence taxonomy parser (DNA, RNA, Protein, Text)
│   ├── input_validator.js     # IUPAC alphabet sanitizer & length boundary checker
│   └── step_engine.js         # Deterministic timeline and snapshot state machine
│
├── ui/                        # Modular presentation controllers
│   ├── app.js                 # Event-driven application coordinator
│   ├── animation_controller.js# Playback engine with variable speed & keyboard shortcuts
│   ├── grid_renderer.js       # Dynamic SVG & DOM matrix table renderer
│   ├── code_stepper_renderer.js # Synchronous Python 3 AST pseudo-stepper
│   ├── dna_visualizer_3d.js   # Three.js WebGL molecular double helix engine
│   ├── benchmark_view.js      # Head-to-head empirical comparison dashboard
│   ├── testcases_data.js      # Embedded JSON testcase dataset
│   └── i18n.js                # Dual-language localization framework (EN / VI)
│
├── styles/                    # High-contrast, WCAG 2.1 AA design tokens
│   ├── main.css               # Base layout, typography (Inter + JetBrains Mono)
│   ├── biotech_theme.css      # Cyber-biotechnology dark/light visual design system
│   ├── code_stepper.css       # Monospace IDE syntax theme
│   └── adaptive_views.css     # Mobile, tablet, and widescreen responsiveness
│
├── testcases/                 # Standardized 30-case benchmark catalog
│   ├── 01_normal/ ... 06_invalid/
│   └── testcases_index.json   # Master schema catalog
│
├── tests/                     # Automated mathematical verification test suites
│   ├── test_core.js           # Subsequence invariant & cross-validation tests
│   ├── test_testcases.js      # 30-case catalog verification suite
│   ├── test_biolcs_regressions.js # Edge cases and boundary regression tests
│   ├── test_ui_e2e.js         # Playwright End-to-End interaction tests
│   └── test_all_buttons_and_cases.js # Complete UI audit & button matrix test
│
└── docs/                      # Formal academic documentation
    ├── SUBMISSION_METADATA.md # Course profile, video timestamps & evaluation criteria
    └── ACADEMIC_INTEGRITY.md  # Academic integrity notice on withheld PDF manuscript
```

### Architectural Principles

1. **Zero Framework Bloat (Vanilla Modern ES6+)**:
   Built without React, Vue, or Webpack bundlers. Ships native ES Modules directly to the browser with instant cold starts ($< 100\text{ ms}$), zero compilation overhead, and zero dependency vulnerabilities.
2. **Deterministic Step Engine**:
   Algorithmic execution is completely decoupled from rendering. The engine emits an immutable `StepSnapshot` timeline, enabling bi-directional scrubbing (`Play`, `Pause`, `Step Next`, `Step Prev`, `Seek`) without recalculating intermediate state.
3. **Interactive 3D WebGL Molecular Lab (Three.js r128)**:
   Renders a 3D double helix model with nucleotide-specific coloring:
   * **Adenine (A)**: `#38bdf8` (Cyan Blue)
   * **Thymine (T)**: `#f43f5e` (Crimson Rose)
   * **Guanine (G)**: `#fbbf24` (Amber Gold)
   * **Cytosine (C)**: `#34d399` (Emerald Green)
   Base pairs are connected by hydrogen-bonding rungs that glow dynamically when matching the optimal LCS.
4. **Live Python 3 Code Stepper**:
   Synchronizes visual cell evaluation with an embedded Python 3 implementation, dynamically highlighting active loops, conditions, and live variable scopes (`i`, `j`, `charX`, `charY`, `L[i,j]`).

---

## 6. Standardized 30-Testcase Benchmark Taxonomy

The repository contains 30 standardized testcases organized into 6 orthogonal categories:

| Category | Count | Focus & Biological Scope | Key Invariants Tested |
| :--- | :---: | :--- | :--- |
| **01_normal** | 5 | Classic textbook DNA pairs (CLRS, GATTACA) | Exact LCS match, deterministic traceback paths. |
| **02_boundary** | 5 | Extreme boundary conditions | Both empty (`""`), one empty, disjoint alphabet (`AAAA` vs `CCCC`), identical strings. |
| **03_small** | 5 | Micro strings ($len \le 6\text{ bp}$) | Fine-grained manual trace verification and single-step inspection. |
| **04_large** | 5 | Scaled high-load stress tests ($50\text{--}400\text{ bp}$) | Benchmark scaling limits and Garbage Collection stability. |
| **05_special** | 5 | Authentic NCBI plant genomics (*rbcL* gene) | Real-world chloroplast divergence (*Oryza sativa* vs *Zea mays*, $261\text{ bp}$). |
| **06_invalid** | 5 | Negative input sanitization & fuzzing | Numeric characters, invalid IUPAC symbols, internal whitespace, buffer overflow ($> 5{,}000\text{ bp}$). |

---

## 7. Interactive Visualizer Capabilities

1. **Matrix Grid & Traceback Visualization**:
   Row-by-row animated evaluation with pulse indicators on matching characters and directional vector arrows ($\nwarrow, \uparrow, \leftarrow$).
2. **Synchronous Python Code Stepper**:
   Side-by-side pseudocode execution displaying stack frames and variable scopes.
3. **Genomic 3D Lab (WebGL Three.js)**:
   Full camera orbit, zoom, pan, and real-time nucleotide codon inspection.
4. **Benchmark Arena**:
   Live multi-algorithm competition with millisecond timers via `performance.now()`.

---

## 8. Getting Started & Verification Protocol

### Option 1: Live Interactive App
Experience the application directly in your web browser:  
👉 **[https://biolcs.vercel.app](https://biolcs.vercel.app)**

### Option 2: Zero-Dependency Local Static Launch
Clone and serve the repository using any local HTTP static server:

```bash
# Clone the repository
git clone https://github.com/uit-25730067-chithanh/cs112-biolcs.git
cd cs112-biolcs

# Launch via static server (no build step needed)
npx serve . -p 3000
# Alternatively using Python 3:
# python3 -m http.server 3000
```
Navigate to `http://localhost:3000` in your web browser.

### Option 3: Automated Verification Suite

Run the complete mathematical verification and invariant test suite:

```bash
# 1. Run core algorithm verification (Grid DP vs Hirschberg vs 2-Row)
npm run test:core

# 2. Run full 30-case validation against master catalog
npm run test:testcases

# 3. Run regression and invariant tests
npm run test:regressions

# 4. Run all unit and integration tests combined
npm test
```

#### Test Execution Evidence
```text
==============================================================
  BioLCS CORE ENGINE VERIFICATION SUITE — CS112 (25730067)    
==============================================================
[1/6] Cross-Algorithm Validation: 10/10 Passed
[2/6] Boundary & Extreme Cases: 10/10 Passed
[3/6] StepSnapshot Schema Conformance: 11/11 Passed
[4/6] Sequence Alignment & Mutation Classification: 7/7 Passed
[5/6] Traceback Matrix Alignment Equivalence: 3/3 Passed
[6/6] StepEngine Timeline Controller: 9/9 Passed
==============================================================
SUMMARY: Total: 70 | Passed: 70 | Failed: 0 (100% Success)
==============================================================
```

---

## 9. Academic Integrity Notice & Course Attribution

* **Institution**: Faculty of Computer Science, University of Information Technology (VNUHCM-UIT)
* **Course**: CS112.F31.LT.TTNT — Algorithm Analysis & Design
* **Supervising Lecturer**: Dr. Huynh Thi Thanh Thuong
* **Author**: Dang Chi Thanh (Student ID: `25730067`)

### Notice on Withheld Theoretical Report Manuscript
To adhere to **VNUHCM-UIT Academic Integrity** guidelines and proactively prevent plagiarism by future student cohorts, the formal 30-page theoretical research report (`CS112_BTL_25730067_DangChiThanh.pdf`) is **intentionally withheld** from this public repository.  
All algorithmic engines, interactive visualizers, and test suites are released under the open-source **MIT License**. For complete disclosure, see [`docs/ACADEMIC_INTEGRITY.md`](docs/ACADEMIC_INTEGRITY.md) and [`docs/SUBMISSION_METADATA.md`](docs/SUBMISSION_METADATA.md).

---

## 10. License

This project is open-source software licensed under the [MIT License](LICENSE).  
Copyright © 2026 Dang Chi Thanh.
