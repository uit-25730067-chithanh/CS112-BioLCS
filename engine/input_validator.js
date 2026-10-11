/**
 * Input Validator & Sanitizer Module
 * Part of CS112 Term Project: BioLCS (Plant Genomics Mutation Tracking)
 * Student: Dang Chi Thanh (MSSV: 25730067)
 * 
 * Validates DNA/RNA nucleotide sequences and prevents malicious or malformed inputs:
 * - Checks for null/undefined inputs
 * - Enforces maximum length bounds (<= 5000 bp for browser memory safety)
 * - Detects internal whitespace
 * - Detects illegal characters outside standard IUPAC nucleotide & protein alphabet
 */

export const MAX_SAFE_LENGTH = 5000;

/**
 * Validates a pair of input sequences.
 * 
 * @param {any} seqX
 * @param {any} seqY
 * @returns {{
 *   isValid: boolean,
 *   errorType?: string,
 *   errorMessage?: string,
 *   sanitizedX?: string,
 *   sanitizedY?: string
 * }}
 */
export function validateSequences(seqX, seqY) {
  // 1. Missing input check
  if (seqX === null || seqX === undefined || seqY === null || seqY === undefined) {
    return {
      isValid: false,
      errorType: "MISSING_INPUT",
      errorMessage: "Required sequence field is null or undefined."
    };
  }

  if (typeof seqX !== "string" || typeof seqY !== "string") {
    return {
      isValid: false,
      errorType: "INVALID_FORMAT",
      errorMessage: "Input sequences must be strings."
    };
  }

  // 2. Length threshold check
  if (seqX.length > MAX_SAFE_LENGTH || seqY.length > MAX_SAFE_LENGTH) {
    const offendingLen = Math.max(seqX.length, seqY.length);
    return {
      isValid: false,
      errorType: "EXCEEDS_MAX_LENGTH",
      errorMessage: `Sequence length (${offendingLen}) exceeds maximum permissible length of ${MAX_SAFE_LENGTH} bp.`
    };
  }

  // 3. Whitespace check inside sequence body
  if (/\s/.test(seqX) || /\s/.test(seqY)) {
    return {
      isValid: false,
      errorType: "INVALID_FORMAT",
      errorMessage: "Whitespace characters detected inside sequence body."
    };
  }

  // 4. Numeric characters check
  if (/[0-9]/.test(seqX) || /[0-9]/.test(seqY)) {
    return {
      isValid: false,
      errorType: "INVALID_CHARACTERS",
      errorMessage: "Sequence contains illegal numeric characters."
    };
  }

  // 5. Special symbols check (outside standard A-Z uppercase letters)
  if (/[^a-zA-Z]/.test(seqX) || /[^a-zA-Z]/.test(seqY)) {
    return {
      isValid: false,
      errorType: "INVALID_CHARACTERS",
      errorMessage: "Sequence contains illegal special characters."
    };
  }

  // All checks passed; return normalized uppercase sequences
  return {
    isValid: true,
    sanitizedX: seqX.toUpperCase(),
    sanitizedY: seqY.toUpperCase()
  };
}
