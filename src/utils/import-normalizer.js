/**
 * import-normalizer.js
 * Normalizes raw mapped values so they match the exact enum/type constraints
 * of the iBundaCare database schema. Run this AFTER import-mapper and BEFORE
 * import-defaulter-fill.
 */

// ── Date helpers ──────────────────────────────────────────────────────────────

/**
 * Parse a date string in various formats to YYYY-MM-DD.
 * Handles: DD-MM-YYYY, DD/MM/YYYY, Excel serial numbers, ISO strings.
 */
export function normalizeDate(value) {
  if (!value) return null;

  // Excel serial number (number type)
  if (typeof value === 'number') {
    const date = excelSerialToDate(value);
    return date ? formatDateISO(date) : null;
  }

  const str = String(value).trim();
  if (!str || str === '-') return null;

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Try native Date parse as fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return formatDateISO(parsed);

  return null;
}

/**
 * Parse a datetime string to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS).
 * Handles: DD-MM-YYYY HH:MM:SS, ISO, Excel serial.
 */
export function normalizeDateTime(value) {
  if (!value) return null;

  if (typeof value === 'number') {
    const date = excelSerialToDate(value);
    return date ? formatDateTimeISO(date) : null;
  }

  const str = String(value).trim();
  if (!str || str === '-') return null;

  // DD-MM-YYYY HH:MM:SS
  const dtMatch = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (dtMatch) {
    const [, d, m, y, hh, mm, ss = '00'] = dtMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')} ${hh.padStart(2, '0')}:${mm}:${ss}`;
  }

  // ISO datetime
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : formatDateTimeISO(d);
  }

  // Date only — append midnight
  const dateOnly = normalizeDate(str);
  return dateOnly ? `${dateOnly} 00:00:00` : null;
}

function excelSerialToDate(serial) {
  // Excel epoch: Jan 1 1900 (with leap year bug offset)
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  return new Date(utc_value * 1000);
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateTimeISO(date) {
  return `${formatDateISO(date)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

// ── Enum normalizers ──────────────────────────────────────────────────────────

const VALID_KUNJUNGAN = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8'];

export function normalizeJenisKunjungan(value) {
  if (!value) return null;
  const upper = String(value).trim().toUpperCase();
  return VALID_KUNJUNGAN.includes(upper) ? upper : null;
}

const VALID_TT = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5'];

export function normalizeStatusTT(value) {
  if (!value) return null;
  const upper = String(value).trim().toUpperCase();
  return VALID_TT.includes(upper) ? upper : null;
}

/**
 * Normalize +/- / Y/N / text values to iBundaCare screening enums.
 * Returns: 'Reaktif' | 'Non-Reaktif' | 'Belum Diperiksa'
 */
export function normalizeScreeningResult(value) {
  if (!value || String(value).trim() === '' || String(value).trim() === '-') {
    return 'Belum Diperiksa';
  }
  const v = String(value).trim().toUpperCase();
  if (['+', 'Y', 'YA', 'POSITIF', 'REAKTIF', '1', 'TRUE'].includes(v)) return 'Reaktif';
  if (['-', 'N', 'TIDAK', 'NEGATIF', 'NON-REAKTIF', 'NON REAKTIF', '0', 'FALSE'].includes(v)) return 'Non-Reaktif';
  return 'Belum Diperiksa';
}

/**
 * Normalize TB result to: 'Negatif' | 'Positif' | 'Suspek' | 'Belum Diperiksa'
 */
export function normalizeTBResult(value) {
  if (!value || String(value).trim() === '' || String(value).trim() === '-') {
    return 'Belum Diperiksa';
  }
  const v = String(value).trim().toUpperCase();
  if (['+', 'POSITIF', 'Y', 'YA', '1'].includes(v)) return 'Positif';
  if (['-', 'NEGATIF', 'N', 'TIDAK', '0'].includes(v)) return 'Negatif';
  if (['SUSPEK', 'SUSPECT'].includes(v)) return 'Suspek';
  return 'Belum Diperiksa';
}

/**
 * Normalize malaria status to: 'Positif' | 'Negatif' | 'Belum Diperiksa'
 */
export function normalizeMalariaStatus(value) {
  if (!value || String(value).trim() === '' || String(value).trim() === '-') {
    return 'Belum Diperiksa';
  }
  const v = String(value).trim().toUpperCase();
  if (['+', 'POSITIF', 'Y', '1'].includes(v)) return 'Positif';
  if (['-', 'NEGATIF', 'N', '0'].includes(v)) return 'Negatif';
  return 'Belum Diperiksa';
}

/**
 * Normalize kecacingan status to: 'Positif' | 'Negatif' | 'Belum Diperiksa'
 */
export function normalizeKecacinganStatus(value) {
  return normalizeMalariaStatus(value); // same enum
}

/**
 * Normalize protein urine to enum: 'Negatif' | '+1' | '+2' | '+3' | '+4'
 */
export function normalizeProteinUrine(value) {
  if (!value || String(value).trim() === '' || String(value).trim() === '-') return null;
  const v = String(value).trim().toUpperCase();
  if (['-', 'NEGATIF', 'NEG', '0'].includes(v)) return 'Negatif';
  if (['+1', '1+', '+'].includes(v)) return '+1';
  if (['+2', '2+', '++'].includes(v)) return '+2';
  if (['+3', '3+', '+++'].includes(v)) return '+3';
  if (['+4', '4+', '++++'].includes(v)) return '+4';
  return null;
}

/**
 * Normalize status_art to enum: 'Belum ART' | 'Sedang ART' | 'Putus ART' | 'Tidak Diketahui' | null
 */
export function normalizeStatusART(value) {
  if (!value || String(value).trim() === '' || String(value).trim() === '-') return null;
  const v = String(value).trim().toUpperCase();
  if (['YA', 'Y', '1', 'TRUE', 'SEDANG ART', 'ART'].includes(v)) return 'Sedang ART';
  if (['TIDAK', 'N', '0', 'FALSE', 'BELUM ART', 'BELUM'].includes(v)) return 'Belum ART';
  if (['PUTUS', 'PUTUS ART', 'STOP'].includes(v)) return 'Putus ART';
  return 'Tidak Diketahui';
}

/**
 * Normalize Ya/Tidak boolean fields.
 * Returns: 'Ya' | 'Tidak'
 */
export function normalizeYaTidak(value) {
  if (!value) return 'Tidak';
  const v = String(value).trim().toUpperCase();
  if (['YA', 'Y', '1', 'TRUE', '✓', 'V'].includes(v)) return 'Ya';
  return 'Tidak';
}

// ── Full record normalizer ────────────────────────────────────────────────────

/**
 * Normalize all fields in a mapped import record.
 * Mutates and returns the record.
 * @param {Object} record - output from mapToImportRecord()
 * @returns {Object} normalized record
 */
export function normalizeRecord(record) {
  // ibu
  record.ibu.tanggal_lahir = normalizeDate(record.ibu.tanggal_lahir);
  // tinggi_badan comes from the ibu section of the mapper (col S)
  if (record.ibu.tinggi_badan !== null && record.ibu.tinggi_badan !== undefined) {
    record.ibu.tinggi_badan = parseFloat(record.ibu.tinggi_badan) || null;
  }

  // kehamilan
  record.kehamilan.haid_terakhir = normalizeDate(record.kehamilan.haid_terakhir);
  record.kehamilan.taksiran_persalinan = normalizeDate(record.kehamilan.taksiran_persalinan);

  // anc — mapper already does parseFloat/parseInt, normalizer only handles enums/dates
  record.anc.tanggal_kunjungan = normalizeDateTime(record.anc.tanggal_kunjungan);
  record.anc.jenis_kunjungan = normalizeJenisKunjungan(record.anc.jenis_kunjungan);
  record.anc.status_imunisasi_tt = normalizeStatusTT(record.anc.status_imunisasi_tt);

  // lab — enums only; numeric fields already parsed by mapper
  // HB of 0 means "not measured" in this source — treat as null so it doesn't trigger low-HB warnings
  record.lab.hasil_lab_hb = (record.lab.hasil_lab_hb === 0 || record.lab.hasil_lab_hb === null)
    ? null
    : record.lab.hasil_lab_hb;
  record.lab.skrining_hiv = normalizeScreeningResult(record.lab.skrining_hiv);
  record.lab.status_art = normalizeStatusART(record.lab.status_art);
  record.lab.skrining_sifilis = normalizeScreeningResult(record.lab.skrining_sifilis);
  record.lab.skrining_hbsag = normalizeScreeningResult(record.lab.skrining_hbsag);
  record.lab.skrining_tb = normalizeTBResult(record.lab.skrining_tb);
  record.lab.status_malaria = normalizeMalariaStatus(record.lab.status_malaria);
  record.lab.status_kecacingan = normalizeKecacinganStatus(record.lab.status_kecacingan);
  record.lab.lab_protein_urine = normalizeProteinUrine(record.lab.lab_protein_urine);
  record.lab.malaria_diberi_kelambu = normalizeYaTidak(record.lab.malaria_diberi_kelambu);

  // komplikasi dates
  record.komplikasi = record.komplikasi.map(k => ({
    ...k,
    tanggal_diagnosis: normalizeDate(k.tanggal_diagnosis),
  }));

  return record;
}

// ── Validation flags ──────────────────────────────────────────────────────────

/**
 * Validate a normalized record and return an array of warning objects.
 * Warnings are shown as highlights in the preview table.
 * @param {Object} record - normalized record
 * @returns {Array<{field, level, message}>} warnings
 */
export function validateRecord(record) {
  const warnings = [];

  const warn = (field, level, message) => warnings.push({ field, level, message });

  // Required fields
  if (!record.ibu.nik_ibu) warn('nik', 'error', 'NIK kosong — baris tidak dapat diimpor');
  if (!record.ibu.nama_lengkap) warn('nama', 'error', 'Nama ibu kosong');
  if (!record.kehamilan.haid_terakhir) warn('hpht', 'error', 'HPHT kosong — kehamilan tidak dapat dibuat');
  if (!record.anc.tanggal_kunjungan) warn('tanggal', 'error', 'Tanggal kunjungan kosong');
  if (!record.anc.jenis_kunjungan) warn('kunjungan', 'error', 'Jenis kunjungan tidak valid (harus K1–K8)');

  // Data quality warnings
  if (!record.ibu.tanggal_lahir) warn('tanggal_lahir', 'warning', 'Tanggal lahir kosong');
  if (!record.ibu.no_hp) warn('no_hp', 'info', 'Nomor HP kosong');
  if (!record.anc.berat_badan) warn('bb', 'error', 'Berat badan tidak tercatat');
  if (!record.ibu.tinggi_badan) warn('tinggi_badan', 'error', 'Tinggi badan tidak tercatat');

  // HB check
  if (record.lab.hasil_lab_hb !== null && record.lab.hasil_lab_hb < 8) {
    warn('hb', 'warning', `HB rendah: ${record.lab.hasil_lab_hb} gr/dl — perlu perhatian`);
  }

  // Tekanan darah tinggi
  if (record.anc.tekanan_darah) {
    const parts = record.anc.tekanan_darah.split('/');
    if (parts.length === 2) {
      const systolic = parseInt(parts[0]);
      if (systolic >= 140) {
        warn('td', 'warning', `Tekanan darah tinggi: ${record.anc.tekanan_darah}`);
      }
    }
  }

  // Reactive screenings
  if (record.lab.skrining_hiv === 'Reaktif') warn('hiv', 'warning', 'HIV Reaktif');
  if (record.lab.skrining_sifilis === 'Reaktif') warn('sifilis', 'warning', 'Sifilis Reaktif');
  if (record.lab.skrining_hbsag === 'Reaktif') warn('hbsag', 'warning', 'HBsAg Reaktif');
  if (record.lab.skrining_tb === 'Positif') warn('tb', 'warning', 'TB Positif');
  if (record.lab.status_malaria === 'Positif') warn('malaria', 'warning', 'Malaria Positif');

  // Komplikasi
  if (record.komplikasi.length > 0) {
    warn('komplikasi', 'warning', `${record.komplikasi.length} komplikasi terdeteksi`);
  }

  return warnings;
}

/**
 * Check if a record has any blocking errors (cannot be imported).
 */
export function hasBlockingErrors(warnings) {
  return warnings.some(w => w.level === 'error');
}
