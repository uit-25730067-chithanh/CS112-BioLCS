# BioLCS Studio — Plant Genomics Sequence Alignment & LCS Visualizer

[![Live Demo](https://img.shields.io/badge/Demo-biolcs.vercel.app-10b981?style=for-the-badge&logo=vercel)](https://biolcs.vercel.app)
[![YouTube Video](https://img.shields.io/badge/YouTube-4K%20UHD%20Walkthrough-ef4444?style=for-the-badge&logo=youtube)](https://youtu.be/byLa-Dqlw0Q)
[![License: MIT](https://img.shields.io/badge/License-MIT-3b82f6?style=for-the-badge)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0-339933?style=for-the-badge&logo=node.js)](package.json)
[![Academic Course](https://img.shields.io/badge/VNUHCM--UIT-CS112%20Term%20Project-0052cc?style=for-the-badge)](https://www.uit.edu.vn)

> **BioLCS Studio** is a modern, web-native algorithm visualizer and benchmark suite designed to tackle the classic quadratic memory bottleneck in bioinformatics sequence alignment. It contrasts standard 2D Dynamic Programming against linear-space algorithms (2-Row Rolling DP and Hirschberg's Divide-and-Conquer) on real-world plant genomics sequences (*Oryza sativa* vs. *Zea mays* chloroplast *rbcL* genes).

---

## Table of Contents

- [Overview & Biological Motivation](#overview--biological-motivation)
- [Key Features](#key-features)
- [Algorithmic Foundations & Complexity](#algorithmic-foundations--complexity)
- [Interactive Visualizer Suite](#interactive-visualizer-suite)
- [Standardized 30-Testcase Matrix](#standardized-30-testcase-matrix)
- [Repository Structure](#repository-structure)
- [Getting Started & Local Execution](#getting-started--local-execution)
- [Automated Verification & Testing](#automated-verification--testing)
- [Academic Integrity Notice](#academic-integrity-notice)
- [Author & Acknowledgments](#author--acknowledgments)
- [License](#license)

---

## Overview & Biological Motivation

In bioinformatics and molecular phylogenetics, identifying conserved genetic sequences and locating nucleotide mutations (insertions, deletions, transitions, transversions) relies on sequence alignment. The **Longest Common Subsequence (LCS)** serves as the mathematical foundation for unweighted global alignment.

While standard dynamic programming requires an `(m + 1) × (n + 1)` table consuming `O(m × n)` memory, real-world biological sequences frequently span hundreds or thousands of base pairs. When scaling to genomic scale (e.g., chloroplast *rbcL* genes of 260+ bp or full microbial genomes), the quadratic memory footprint quickly exhausts browser RAM and mobile memory limits.

**BioLCS Studio** was built to investigate and visualize how space-optimized algorithms overcome this barrier:
1. **Classic 2D Grid DP**: Full table visualization with explicit traceback arrows.
2. **Space-Optimized 2-Row DP**: Rolling two-row buffer reducing memory to `O(min(m, n))`.
3. **Hirschberg's Algorithm (1975)**: Combining Divide-and-Conquer with Dynamic Programming to recover the full optimal alignment sequence while maintaining strictly linear `O(min(m, n))` space.

---

## Key Features

- **Side-by-Side Algorithm Benchmark**: Direct head-to-head comparison between 2D Grid DP, 2-Row DP, and Hirschberg on identical inputs, measuring execution runtime, cell operations, and memory consumption.
- **Dynamic Step-by-Step Grid Animation**: Interactive playback controls (`Play`, `Pause`, `Step Next`, `Step Prev`, `Reset`, and variable speed control) with cell scanning highlights and backtracking pointer vectors.
- **Synchronous Python 3 Code Stepper**: Highlighting corresponding algorithm pseudocode and Python 3 source code lines in real time as the animation progresses.
- **3D WebGL Genomic Double Helix**: Interactive Three.js r128 visualization rendering a 3D double helix structure with nucleotide-specific coloring (`A` Adenine, `C` Cytosine, `G` Guanine, `T` Thymine) and base-pair hydrogen bonding.
- **Curated Plant Genomics Dataset**: Authentic chloroplast ribulose-1,5-bisphosphate carboxylase/oxygenase large subunit (*rbcL*) sequences retrieved from NCBI GenBank for Rice (*Oryza sativa*) and Maize (*Zea mays*).
- **Anti-Slop Design System**: Accessible UI engineered according to WCAG 2.1 AA standards, featuring Linear Dark and Vercel Light themes with zero external heavy frameworks.

---

## Algorithmic Foundations & Complexity

| Algorithm | Time Complexity | Space Complexity | Recovers Full Sequence? | Cell Allocation Footprint | Practical Benchmark Verdict |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Classic 2D Grid DP** | `O(m × n)` | `O(m × n)` | **Yes** | Entire `(m + 1) × (n + 1)` table in memory | Best for pedagogical inspection on short sequences (`≤ 150 bp`). |
| **Space-Optimized DP** | `O(m × n)` | `O(min(m, n))` | **Length Only** | Exactly 2 rows (`2 × min(m, n)`) | Optimal for rapid similarity filtering and score calculations. |
| **Hirschberg's Algorithm** | `O(m × n)` | `O(min(m, n))` | **Yes** | Linear recursion stack + 2 auxiliary rows | **Industry standard**: Reconstructs the complete LCS with up to **99.1% memory savings**. |

### Why Hirschberg's Algorithm Excels in Practice

Given two sequences `X` of length `m` and `Y` of length `n`:
- Classic 2D Grid DP requires storing the full table `DP[0..m, 0..n]`. For two 300-bp sequences, this allocates `301 × 301 = 90,601` matrix cells.
- Hirschberg splits `X` at midpoint `mid = ⌊m / 2⌋`, computes forward prefix DP on `X[1..mid]` and reverse suffix DP on `X[mid+1..m]`, finds the optimal split point `k* = argmax (Prefix[k] + Suffix[n - k])`, and recursively solves two independent subproblems.
- Total memory remains strictly bounded by `2 × min(m, n) + O(log m)` stack frames, ensuring instantaneous execution on standard devices without garbage collection stutter.

---

## Interactive Visualizer Suite

### 1. Matrix Grid & Traceback Visualization
Visualizes the dynamic programming grid as cells are evaluated row by row. Matching characters trigger green highlight pulses, while non-matching characters pull values from adjacent cells with indicator arrows (`↑`, `←`, `↖`).

### 2. Live Code Stepper
Synchronized display of Python 3 implementation code with dynamic line indicators, variable values (`i`, `j`, `current_char`), and call-stack introspection.

### 3. Genomic 3D Lab (WebGL Three.js)
Renders a 3D double helix model of the input DNA sequences. Bases are connected by complementary rungs, allowing users to rotate, pan, and zoom into individual codon alignments.

### 4. Benchmark Arena
Conducts automated in-browser benchmarking with performance statistics:
- Execution time in milliseconds (via `performance.now()`).
- Total matrix operations executed.
- Memory consumption estimation and comparative reduction ratio.

---

## Standardized 30-Testcase Matrix

BioLCS Studio includes 30 verified testcases classified into 6 standardized categories located in `testcases/`:

| Category | Count | Focus & Description | Examples |
| :--- | :---: | :--- | :--- |
| **01_normal** | 5 | Classic textbook and pedagogical strings | GATTACA vs. GACTATA, CLRS LCS pairs |
| **02_boundary** | 5 | Extreme edge cases | Empty strings, identical strings, zero overlapping characters |
| **03_small** | 5 | Micro strings (`len ≤ 6`) | Manual step-by-step trace and visual verification |
| **04_large** | 5 | Scaled sequences (`len 50 ~ 400 bp`) | High-load benchmark testing for Hirschberg vs. 2D DP |
| **05_special** | 5 | Real-world NCBI plant genomics | Oryza sativa vs. Zea mays chloroplast *rbcL* gene (261 bp) |
| **06_invalid** | 5 | Robustness & fault tolerance | Numeric inputs, special characters, whitespace, overflow |

Each testcase is stored as a self-contained JSON schema in `testcases/<category>/<ID>.json` and indexed centrally in `testcases/testcases_index.json`.

---

## Repository Structure

```
cs112-biolcs/
├── index.html                 # Main application entry point (HTML5 & ES Modules)
├── package.json               # Project manifest, NPM test scripts, and dev dependencies
├── vercel.json                # Vercel deployment configuration
├── LICENSE                    # MIT License
├── README.md                  # Comprehensive documentation and project guide
├── engine/                    # Pure algorithmic core modules
│   ├── grid_dp.js             # Classic 2D Grid DP with traceback reconstruction
│   ├── space_optimized_dp.js  # 2-Row space-optimized rolling DP
│   ├── hirschberg.js          # Linear-space Hirschberg Divide & Conquer engine
│   ├── alignment.js           # Sequence diff & pairwise alignment formatter
│   ├── sequence_classifier.js # Sequence type detection (DNA, RNA, Protein, Text)
│   ├── input_validator.js     # Strict sanitization and boundary assertion
│   └── step_engine.js         # Step generator for visualizer state snapshots
├── ui/                        # UI controllers and view renderers
│   ├── app.js                 # Central application coordinator
│   ├── animation_controller.js# Playback state, timers, and speed controls
│   ├── grid_renderer.js       # Dynamic SVG & DOM matrix renderer
│   ├── code_stepper_renderer.js # Synchronized source code stepping
│   ├── dna_visualizer_3d.js   # Three.js WebGL 3D DNA helix renderer
│   ├── benchmark_view.js      # Head-to-head performance charts & metrics
│   ├── testcases_data.js      # Embedded testcase data module
│   └── i18n.js                # Dual-language localization (English / Vietnamese)
├── styles/                    # Stylesheet architecture
│   ├── main.css               # Core layout, typography, and theme tokens
│   ├── biotech_theme.css      # Genomic laboratory visual accents
│   ├── code_stepper.css       # Monospace syntax styling
│   └── adaptive_views.css     # Responsive viewport adaptations
├── vendor/                    # Localized third-party vendor assets
│   └── three.min.js           # Three.js r128 standalone build
├── testcases/                 # Standardized 30-case benchmark catalog
│   ├── 01_normal/ ... 06_invalid/
│   └── testcases_index.json   # Master JSON catalog index
├── tests/                     # Automated testing suite
│   ├── test_core.js           # Algorithmic correctness & cross-validation tests
│   ├── test_testcases.js      # Automated catalog verification across all 30 cases
│   ├── test_biolcs_regressions.js # Edge cases and invariant regression suite
│   ├── test_ui_e2e.js         # Playwright End-to-End interaction tests
│   └── test_all_buttons_and_cases.js # Complete UI audit & button matrix test
└── docs/                      # Supplemental project documentation
    ├── SUBMISSION_METADATA.md # Academic course profile, video breakdown & criteria
    └── ACADEMIC_INTEGRITY.md  # Official disclosure on withheld theoretical PDF report
```

---

## Getting Started & Local Execution

### Option 1: Live Web App (No Installation Needed)
Access the live deployment on Vercel:
👉 **[https://biolcs.vercel.app](https://biolcs.vercel.app)**

### Option 2: Zero-Dependency Local Static Launch
Because BioLCS Studio is engineered with native modern ES Modules and bundled vendor assets, you can run it immediately without external package installations:

```bash
# Clone the repository
git clone https://github.com/uit-25730067-chithanh/cs112-biolcs.git
cd cs112-biolcs

# Launch via any standard local HTTP server
npx serve . -p 3000
# Alternatively using Python 3:
# python3 -m http.server 3000
```
Open `http://localhost:3000` in your web browser.

---

## Automated Verification & Testing

The repository includes a comprehensive automated test suite ensuring mathematical accuracy, algorithmic invariance, and schema integrity:

```bash
# 1. Run core algorithm verification (Grid DP vs. Hirschberg vs. 2-Row)
npm run test:core

# 2. Run full 30-case validation against the master catalog
npm run test:testcases

# 3. Run regression and invariant tests
npm run test:regressions

# 4. Run all test suites combined
npm test
```

### Continuous Verification Results
```text
==============================================================
SUMMARY: Total Checks: 124 | Passed: 124 | Failed: 0
==============================================================
ALL 30 TESTCASES VALIDATED AND PASSED WITH 100% SUCCESS!
```

---

## Academic Integrity Notice

To comply with **VNUHCM-UIT Academic Integrity** guidelines and actively prevent student plagiarism, the formal 30-page PDF report manuscript (`CS112_BTL_25730067_DangChiThanh.pdf`) is intentionally excluded from this public repository. 

All algorithmic engines, interactive visualizers, and test suites are released under the **MIT License**. For full details, please refer to [`docs/ACADEMIC_INTEGRITY.md`](docs/ACADEMIC_INTEGRITY.md).

---

## Author & Acknowledgments

- **Author**: Đặng Chí Thanh
- **Student ID**: 25730067
- **Institution**: Faculty of Computer Science, University of Information Technology (VNUHCM-UIT)
- **Course**: CS112.F31.LT.TTNT — Algorithm Analysis & Design
- **Supervising Lecturer**: Dr. Huynh Thi Thanh Thuong

Special thanks to Dr. Huynh Thi Thanh Thuong for insightful guidance on dynamic programming space reduction and complexity analysis throughout the course.

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).  
Copyright © 2026 Dang Chi Thanh.
