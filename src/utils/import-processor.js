/**
 * import-processor.js
 * Orchestrates the full client-side import pipeline:
 *   Excel file → raw rows → mapped → normalized → defaulted → validated → preview JSON
 *
 * Column layout: A–CM (91 columns), header on row 12, data from row 13.
 * See import-mapper.js COLUMN_KEYS for the full positional map.
 *
 * Pipeline phases:
 *   1. Parse Excel rows → flat objects → structured records
 *   2. Fetch DB context (existing ANC visit counts per NIK)
 *   3. Solve jenis_kunjungan (K1–K8) using DB context + in-file order
 *   4. Validate + dedup
 *   5. Risk scoring (Option B) — sets status_risiko_visit, flags parity uncertainty
 *
 * This runs entirely in the browser. Nothing is sent to the server until
 * the user explicitly confirms the import.
 */

import * as XLSX from 'xlsx';
import { mapRowToObject, mapToImportRecord } from './import-mapper';
import { normalizeRecord, validateRecord, hasBlockingErrors } from './import-normalizer';
import { applyDefaults, hasLabData } from './import-defaulter-fill';
import { solveAllKunjungan } from './import-kunjungan-solver';
import { applyRiskScore } from './import-risk-scorer';

// ── Constants ─────────────────────────────────────────────────────────────────

// The external file header is on row 12, so data starts at row 13 (skip 12 rows, 0-indexed)
const HEADER_ROWS = 12;
const MAX_FILE_SIZE_MB = 5;

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Process an uploaded Excel File object into a preview-ready JSON array.
 * Stores result in localStorage under 'ibundacare_import_preview'.
 *
 * @param {File} file - the .xlsx file from the file input
 * @param {Object} defaultOverrides - optional overrides for IMPORT_DEFAULTS
 * @returns {Promise<ImportResult>}
 */
export async function processImportFile(file, defaultOverrides = {}) {
  // File validation
  if (!file) throw new Error('Tidak ada file yang dipilih.');
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Ukuran file melebihi batas ${MAX_FILE_SIZE_MB}MB.`);
  }
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['xlsx', 'xls'].includes(ext)) {
    throw new Error('Format file tidak didukung. Gunakan file .xlsx atau .xls.');
  }

  // Read file as ArrayBuffer
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });

  // Use first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to array of arrays (raw values)
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  // Skip header rows
  const dataRows = rawRows.slice(HEADER_ROWS).filter(row =>
    row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
  );

  if (dataRows.length === 0) {
    throw new Error('File tidak mengandung data. Pastikan format file sesuai.');
  }

  // ── Phase 1: parse all rows ───────────────────────────────────────────────
  const rawRecords = [];
  const nikVisitSet = new Set();

  dataRows.forEach((rowValues, idx) => {
    try {
      const flatRow = mapRowToObject(rowValues);
      let record = mapToImportRecord(flatRow);
      record = normalizeRecord(record);
      record = applyDefaults(record, defaultOverrides);
      // Risk scoring runs after defaults so all fields are populated
      record = applyRiskScore(record);

      rawRecords.push({
        _rowIndex: idx + HEADER_ROWS + 1,
        _parseError: false,
        ...record,
      });
    } catch (err) {
      rawRecords.push({
        _rowIndex: idx + HEADER_ROWS + 1,
        _parseError: true,
        _parseErrorMsg: err.message,
        ibu: { nik_ibu: null, nama_lengkap: `[Baris ${idx + HEADER_ROWS + 1} — error]` },
        kehamilan: {},
        anc: {},
        lab: {},
        komplikasi: [],
        meta: {},
      });
    }
  });

  // ── Phase 2: fetch DB context for kunjungan solver ────────────────────────
  const uniqueNiks = [
    ...new Set(rawRecords.filter(r => r.ibu?.nik_ibu).map(r => r.ibu.nik_ibu)),
  ];

  let dbContext = {};
  if (uniqueNiks.length > 0) {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const resp = await fetch('/api/import/anc-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ niks: uniqueNiks }),
      });
      if (resp.ok) dbContext = await resp.json();
    } catch {
      // Non-fatal — solver will treat all mothers as new (DB baseline = 0)
    }
  }

  // ── Phase 3: solve kunjungan for all records ──────────────────────────────
  const solvedRecords = solveAllKunjungan(rawRecords, dbContext);

  // ── Phase 4: validate + dedup ─────────────────────────────────────────────
  const records = [];

  solvedRecords.forEach(record => {
    if (record._parseError) {
      records.push({
        _rowIndex: record._rowIndex,
        _importStatus: 'error',
        _warnings: [{ field: 'row', level: 'error', message: `Parse error: ${record._parseErrorMsg}` }],
        _hasLab: false,
        _hasKomplikasi: false,
        _autoSolved: false,
        _solverNote: null,
        ...record,
      });
      return;
    }

    const warnings = validateRecord(record);
    const isBlocked = hasBlockingErrors(warnings);

    // Add solver note as an info warning so it shows in the preview table
    if (record._autoSolved && record._solverNote) {
      warnings.push({ field: 'kunjungan', level: 'info', message: record._solverNote });
    }

    const dupKey = `${record.ibu.nik_ibu}__${record.anc.jenis_kunjungan}__${record.kehamilan.haid_terakhir}`;
    const isDuplicateInFile = nikVisitSet.has(dupKey);
    if (!isDuplicateInFile && record.ibu.nik_ibu && record.anc.jenis_kunjungan) {
      nikVisitSet.add(dupKey);
    }

    let importStatus = 'new';
    if (isBlocked) importStatus = 'error';
    else if (isDuplicateInFile) importStatus = 'duplicate_in_file';

    records.push({
      ...record,
      _importStatus: importStatus,
      _warnings: warnings,
      _hasLab: hasLabData(record.lab),
      _hasKomplikasi: record.komplikasi.length > 0,
    });
  });

  // ── Phase 5: build result ─────────────────────────────────────────────────
  const summary = buildSummary(records);

  const result = {
    fileName: file.name,
    processedAt: new Date().toISOString(),
    totalRows: dataRows.length,
    summary,
    records,
  };

  try {
    localStorage.setItem('ibundacare_import_preview', JSON.stringify(result));
  } catch (e) {
    console.warn('localStorage quota exceeded, preview not cached:', e);
  }

  return result;
}

/**
 * Load the last import preview from localStorage.
 * @returns {ImportResult|null}
 */
export function loadImportPreview() {
  try {
    const raw = localStorage.getItem('ibundacare_import_preview');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Clear the import preview from localStorage.
 */
export function clearImportPreview() {
  localStorage.removeItem('ibundacare_import_preview');
}

// ── Summary builder ───────────────────────────────────────────────────────────

function buildSummary(records) {
  const total = records.length;
  const errors = records.filter(r => r._importStatus === 'error').length;
  const duplicatesInFile = records.filter(r => r._importStatus === 'duplicate_in_file').length;
  const withWarnings = records.filter(r => r._warnings.some(w => w.level === 'warning')).length;
  const withLab = records.filter(r => r._hasLab).length;
  const withKomplikasi = records.filter(r => r._hasKomplikasi).length;
  const autoSolved = records.filter(r => r._autoSolved).length;
  const importable = total - errors - duplicatesInFile;

  const uniqueNiks = new Set(
    records.filter(r => r.ibu?.nik_ibu).map(r => r.ibu.nik_ibu)
  ).size;

  return {
    total,
    importable,
    errors,
    duplicatesInFile,
    withWarnings,
    withLab,
    withKomplikasi,
    autoSolved,
    uniquePatients: uniqueNiks,
  };
}

/**
 * Get column keys for display in the preview table.
 * Import directly from import-mapper instead: import { COLUMN_KEYS } from './import-mapper'
 */
export { COLUMN_KEYS } from './import-mapper';
