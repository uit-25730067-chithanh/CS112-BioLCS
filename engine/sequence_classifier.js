/**
 * Sequence Classifier Engine
 * Determines if input sequences are biological nucleic acids (DNA/RNA)
 * or general text strings, adapting visual representations accordingly.
 */

const DNA_BASES = new Set(['A', 'C', 'G', 'T']);
const RNA_BASES = new Set(['A', 'C', 'G', 'U']);
const NUCLEIC_BASES = new Set(['A', 'C', 'G', 'T', 'U']);

/**
 * Classifies two sequences and returns genomic validity and UI metadata.
 * @param {string} seqX
 * @param {string} seqY
 * @returns {object} classification metadata
 */
export function classifySequences(seqX = '', seqY = '') {
  const upperX = (seqX || '').toUpperCase();
  const upperY = (seqY || '').toUpperCase();

  if (upperX.length === 0 && upperY.length === 0) {
    return {
      isGenomic: true,
      type: 'empty',
      label: 'Chuỗi Rỗng',
      labelEn: 'Empty Sequences',
      badge: 'EMPTY',
      canRender3D: true,
      reason: 'Cả hai chuỗi đang rỗng.',
      reasonEn: 'Both sequences are currently empty.'
    };
  }

  const charsX = new Set(upperX.split(''));
  const charsY = new Set(upperY.split(''));
  const allChars = new Set([...charsX, ...charsY]);

  const isStrictDNA = [...allChars].every(c => DNA_BASES.has(c));
  const isStrictRNA = [...allChars].every(c => RNA_BASES.has(c));
  const isNucleic = [...allChars].every(c => NUCLEIC_BASES.has(c));

  if (isStrictDNA) {
    return {
      isGenomic: true,
      type: 'dna',
      label: 'DNA Thực Vật / Sinh Học',
      labelEn: 'Plant / Biological DNA',
      badge: 'DNA (3D WebGL)',
      canRender3D: true,
      reason: 'Chuỗi chỉ chứa 4 loại base nucleotide tiêu chuẩn: A, C, G, T.',
      reasonEn: 'Sequences strictly contain 4 canonical DNA nucleotide bases: A, C, G, T.'
    };
  }

  if (isStrictRNA) {
    return {
      isGenomic: true,
      type: 'rna',
      label: 'RNA Phân Tử',
      labelEn: 'Molecular RNA',
      badge: 'RNA (3D WebGL)',
      canRender3D: true,
      reason: 'Chuỗi chỉ chứa 4 loại base nucleotide RNA: A, C, G, U.',
      reasonEn: 'Sequences strictly contain 4 canonical RNA nucleotide bases: A, C, G, U.'
    };
  }

  if (isNucleic) {
    return {
      isGenomic: true,
      type: 'hybrid',
      label: 'Phiên Mã DNA/RNA Phân Tử',
      labelEn: 'Molecular DNA/RNA Hybrid',
      badge: 'DNA/RNA (3D WebGL)',
      canRender3D: true,
      reason: 'Cặp chuỗi gồm base nucleotide DNA và RNA (chứa A, C, G, T, U).',
      reasonEn: 'Sequences contain mixed canonical DNA and RNA nucleotide bases (A, C, G, T, U).'
    };
  }

  // Non-nucleic general strings (e.g. BDAB, ALGORITHM, ALTITUDE)
  const nonNucleotides = [...allChars].filter(c => !NUCLEIC_BASES.has(c));
  const invalidCharsStr = nonNucleotides.slice(0, 5).join(', ');

  return {
    isGenomic: false,
    type: 'general_text',
    label: 'Chuỗi Ký Tự Tổng Quát',
    labelEn: 'General Text String',
    badge: 'GENERAL TEXT',
    canRender3D: false,
    reason: `Chứa các ký tự đại số/văn bản không phải base nucleotide sinh học: [${invalidCharsStr}]. Tắt mô hình 3D xoắn kép để đảm bảo tính chuẩn xác khoa học.`,
    reasonEn: `Contains general/text characters not found in biological nucleotides: [${invalidCharsStr}]. 3D double helix is hidden for scientific precision.`
  };
}
