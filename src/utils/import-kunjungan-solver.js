/**
 * import-kunjungan-solver.js
 *
 * Automatically determines jenis_kunjungan (K1–K8) when the Excel row has
 * an empty or invalid kunjungan cell.
 *
 * Rules (based on Indonesian ANC guidelines / Buku KIA):
 *
 *   Trimester 1  (0–13 weeks)  → K1, K2
 *   Trimester 2  (14–27 weeks) → K3, K4
 *   Trimester 3  (28+ weeks)   → K5, K6, K7, K8
 *
 * Sequential assignment within each trimester:
 *   - Count how many visits this mother already has in the same trimester
 *     (combining DB records + earlier rows in the import file).
 *   - The next visit gets the next K-number in that trimester's slot.
 *
 * K8 special rule:
 *   - K8 is only assigned when the mother has already had ≥4 trimester-3
 *     visits (i.e., this would be her 5th or more T3 visit).
 *   - The 5th T3 visit → K8, 6th → K8, etc. (K8 is the ceiling).
 *
 * DB context is fetched once before processing and passed in as `dbContext`.
 */

// ── Trimester helpers ─────────────────────────────────────────────────────────

/**
 * Calculate gestational age in weeks from HPHT and visit date.
 * @param {string} hpht       - YYYY-MM-DD
 * @param {string} visitDate  - YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
 * @returns {number|null} weeks, or null if dates are invalid
 */
export function gestationalWeeks(hpht, visitDate) {
  if (!hpht || !visitDate) return null;
  const hphtMs = new Date(hpht).getTime();
  const visitMs = new Date(visitDate.substring(0, 10)).getTime();
  if (isNaN(hphtMs) || isNaN(visitMs)) return null;
  const diffDays = (visitMs - hphtMs) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return null;
  return Math.floor(diffDays / 7);
}

/**
 * Determine trimester number from gestational weeks.
 * @param {number} weeks
 * @returns {1|2|3|null}
 */
export function trimesterOf(weeks) {
  if (weeks === null || weeks === undefined) return null;
  if (weeks <= 13) return 1;
  if (weeks <= 27) return 2;
  return 3;
}

// ── K-number slot maps ────────────────────────────────────────────────────────

// Which K-numbers belong to each trimester (in order)
const TRIMESTER_SLOTS = {
  1: ['K1', 'K2'],
  2: ['K3', 'K4'],
  3: ['K5', 'K6', 'K7', 'K8'],
};

// ── Main solver ───────────────────────────────────────────────────────────────

/**
 * Resolve jenis_kunjungan for a single record.
 *
 * @param {Object} record       - normalized import record (anc.jenis_kunjungan may be null)
 * @param {Object} visitCounter - mutable counter object tracking visits seen so far
 *                                Shape: { [nik]: { 1: n, 2: n, 3: n } }
 * @param {Object} dbContext    - DB visit counts fetched before processing
 *                                Shape: { [nik]: { t1: n, t2: n, t3: n } }
 * @returns {{ jenis_kunjungan: string, _autoSolved: boolean, _solverNote: string }}
 */
export function solveKunjungan(record, visitCounter, dbContext) {
  const nik = record.ibu?.nik_ibu;
  const hpht = record.kehamilan?.haid_terakhir;
  const visitDate = record.anc?.tanggal_kunjungan;
  const existing = record.anc?.jenis_kunjungan;

  // If already valid, just count it and return as-is
  if (existing && /^K[1-8]$/.test(existing)) {
    _incrementCounter(visitCounter, nik, hpht, visitDate);
    return { jenis_kunjungan: existing, _autoSolved: false, _solverNote: null };
  }

  // Can't solve without HPHT or visit date
  if (!hpht || !visitDate || !nik) {
    return {
      jenis_kunjungan: existing || null,
      _autoSolved: false,
      _solverNote: 'Tidak dapat menentukan kunjungan: HPHT atau tanggal kunjungan kosong',
    };
  }

  const weeks = gestationalWeeks(hpht, visitDate);
  const trimester = trimesterOf(weeks);

  if (!trimester) {
    return {
      jenis_kunjungan: existing || null,
      _autoSolved: false,
      _solverNote: `Tidak dapat menentukan trimester dari usia kehamilan (${weeks} minggu)`,
    };
  }

  // Get DB baseline for this NIK
  const dbCounts = dbContext[nik] || { t1: 0, t2: 0, t3: 0 };
  const dbBaseline = dbCounts[`t${trimester}`] || 0;

  // Get in-file count so far (visits already processed in this batch)
  if (!visitCounter[nik]) visitCounter[nik] = { 1: 0, 2: 0, 3: 0 };
  const fileCount = visitCounter[nik][trimester] || 0;

  // Total visits in this trimester = DB + file so far
  const totalSoFar = dbBaseline + fileCount;

  // Determine which slot this visit occupies (0-based)
  const slotIndex = totalSoFar; // 0 = first visit in trimester
  const slots = TRIMESTER_SLOTS[trimester];

  // Assign K-number — cap at last slot (K8 for T3, K2 for T1, K4 for T2)
  const kunjungan = slots[Math.min(slotIndex, slots.length - 1)];

  // Increment counter for subsequent rows
  visitCounter[nik][trimester] = fileCount + 1;

  const note = existing
    ? `Kunjungan "${existing}" tidak valid — diganti otomatis menjadi ${kunjungan} (T${trimester}, kunjungan ke-${totalSoFar + 1})`
    : `Kunjungan kosong — ditentukan otomatis: ${kunjungan} (T${trimester}, ${weeks} minggu, kunjungan ke-${totalSoFar + 1})`;

  return {
    jenis_kunjungan: kunjungan,
    _autoSolved: true,
    _solverNote: note,
  };
}

// ── Batch solver ──────────────────────────────────────────────────────────────

/**
 * Apply the kunjungan solver to all records in a batch.
 * Records are processed in their original order (chronological within each NIK).
 *
 * @param {Array}  records   - array of normalized import records
 * @param {Object} dbContext - DB visit counts, keyed by NIK
 * @returns {Array} records with anc.jenis_kunjungan resolved and _autoSolved/_solverNote set
 */
export function solveAllKunjungan(records, dbContext) {
  const visitCounter = {}; // tracks in-file visit counts per NIK per trimester

  // Sort by NIK + visit date so counter increments in chronological order
  const sorted = [...records].sort((a, b) => {
    const nikA = a.ibu?.nik_ibu || '';
    const nikB = b.ibu?.nik_ibu || '';
    if (nikA !== nikB) return nikA.localeCompare(nikB);
    const dateA = a.anc?.tanggal_kunjungan || '';
    const dateB = b.anc?.tanggal_kunjungan || '';
    return dateA.localeCompare(dateB);
  });

  // Build a map from original index to sorted index so we can write back
  const indexMap = new Map(sorted.map((r, i) => [r, i]));

  const results = sorted.map(record => {
    const { jenis_kunjungan, _autoSolved, _solverNote } = solveKunjungan(
      record,
      visitCounter,
      dbContext
    );

    return {
      ...record,
      anc: { ...record.anc, jenis_kunjungan },
      _autoSolved,
      _solverNote,
    };
  });

  // Re-sort back to original row order
  const originalOrder = new Map(records.map((r, i) => [r, i]));
  results.sort((a, b) => {
    // Match back by _rowIndex which is stable
    return (a._rowIndex || 0) - (b._rowIndex || 0);
  });

  return results;
}

// ── Private helpers ───────────────────────────────────────────────────────────

function _incrementCounter(visitCounter, nik, hpht, visitDate) {
  if (!nik || !hpht || !visitDate) return;
  const weeks = gestationalWeeks(hpht, visitDate);
  const trimester = trimesterOf(weeks);
  if (!trimester) return;
  if (!visitCounter[nik]) visitCounter[nik] = { 1: 0, 2: 0, 3: 0 };
  visitCounter[nik][trimester] = (visitCounter[nik][trimester] || 0) + 1;
}
