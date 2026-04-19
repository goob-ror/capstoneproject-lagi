/**
 * import-defaulter-fill.js
 * Fills required fields that have no source in the external Excel data.
 * All defaults are editable here — change them before running an import batch.
 *
 * HOW TO EDIT:
 *   1. Change the values in IMPORT_DEFAULTS below.
 *   2. The ImportData page also exposes a UI to override these at runtime
 *      before committing to the database.
 */

// ── Editable defaults ─────────────────────────────────────────────────────────

export const IMPORT_DEFAULTS = {
  /**
   * Default buku_kia value for ibu records.
   */
  buku_kia: 'Ada',

  /**
   * Default pekerjaan for ibu records.
   */
  pekerjaan: 'IRT',

  /**
   * Default pendidikan for ibu records.
   */
  pendidikan: 'SMA',

  /**
   * The bidan ID to assign as forkey_bidan for all imported ANC records.
   * Must match an existing bidan.id in the database.
   * Set this to your designated "Import" bidan account ID.
   */
  forkey_bidan: 1,

  /**
   * Default jenis_akses for ANC visits.
   * Options: 'Murni' | 'Akses'
   */
  jenis_akses: 'Murni',

  /**
   * Default pemeriksa for ANC visits.
   * Options: 'Bidan' | 'Dokter'
   */
  pemeriksa: 'Bidan',

  /**
   * Default status_risiko_visit for ANC visits.
   * Options: 'Normal' | 'Ringan' | 'Sedang' | 'Tinggi'
   */
  status_risiko_visit: 'Normal',

  /**
   * Default gravida (pregnancy count) when not available.
   */
  gravida: 1,

  /**
   * Default partus (delivery count) when not available.
   */
  partus: 0,

  /**
   * Default abortus count when not available.
   */
  abortus: 0,

  /**
   * Default status_kehamilan for new kehamilan records.
   * Options: 'Hamil' | 'Bersalin' | 'Nifas' | 'Selesai' | 'Keguguran'
   */
  status_kehamilan: 'Hamil',

  /**
   * Default lab screening values for fields not present in source.
   */
  lab_defaults: {
    skrining_gonorea: 'Belum Diperiksa',
    skrining_klamidia: 'Belum Diperiksa',
    terapi_kecacingan: 0,
  },
};

// ── Filler function ───────────────────────────────────────────────────────────

/**
 * Apply defaults to a normalized import record.
 * Only fills fields that are null/undefined — never overwrites existing values.
 *
 * @param {Object} record - normalized record from normalizeRecord()
 * @param {Object} overrides - optional runtime overrides (from UI settings panel)
 * @returns {Object} record with defaults applied
 */
export function applyDefaults(record, overrides = {}) {
  // Deep merge lab_defaults separately so runtime overrides work on nested keys
  const defaults = {
    ...IMPORT_DEFAULTS,
    ...overrides,
    lab_defaults: {
      ...IMPORT_DEFAULTS.lab_defaults,
      ...(overrides.lab_defaults || {}),
    },
  };

  // ── ibu defaults ──────────────────────────────────────────────────────────
  if (!record.ibu.buku_kia) record.ibu.buku_kia = defaults.buku_kia;
  if (!record.ibu.pekerjaan) record.ibu.pekerjaan = defaults.pekerjaan;
  if (!record.ibu.pendidikan) record.ibu.pendidikan = defaults.pendidikan;

  // ── kehamilan defaults ────────────────────────────────────
  if (record.kehamilan.gravida === null || record.kehamilan.gravida === undefined) {
    record.kehamilan.gravida = defaults.gravida;
  }
  if (record.kehamilan.partus === null || record.kehamilan.partus === undefined) {
    record.kehamilan.partus = defaults.partus;
  }
  if (record.kehamilan.abortus === null || record.kehamilan.abortus === undefined) {
    record.kehamilan.abortus = defaults.abortus;
  }
  if (!record.kehamilan.status_kehamilan) {
    record.kehamilan.status_kehamilan = defaults.status_kehamilan;
  }

  // ── anc defaults ──────────────────────────────────────────
  if (!record.anc.jenis_akses) {
    record.anc.jenis_akses = defaults.jenis_akses;
  }
  if (!record.anc.pemeriksa) {
    record.anc.pemeriksa = defaults.pemeriksa;
  }
  if (!record.anc.status_risiko_visit) {
    record.anc.status_risiko_visit = defaults.status_risiko_visit;
  }
  if (record.anc.confirm_usg === null || record.anc.confirm_usg === undefined) {
    record.anc.confirm_usg = 0;
  }
  if (record.anc.beri_tablet_fe === null || record.anc.beri_tablet_fe === undefined) {
    record.anc.beri_tablet_fe = 0;
  }

  // forkey_bidan is injected at commit time, stored in meta for preview
  record.meta.forkey_bidan = defaults.forkey_bidan;

  // ── lab defaults ──────────────────────────────────────────
  const labDef = defaults.lab_defaults;
  if (!record.lab.skrining_gonorea) {
    record.lab.skrining_gonorea = labDef.skrining_gonorea;
  }
  if (!record.lab.skrining_klamidia) {
    record.lab.skrining_klamidia = labDef.skrining_klamidia;
  }
  if (record.lab.terapi_kecacingan === null || record.lab.terapi_kecacingan === undefined) {
    record.lab.terapi_kecacingan = labDef.terapi_kecacingan;
  }

  return record;
}

/**
 * Check whether a lab record has any meaningful data worth inserting.
 * If all lab fields are null/default, skip creating a lab_screening row.
 */
export function hasLabData(lab) {
  return !!(
    lab.hasil_lab_hb ||
    lab.lab_protein_urine ||
    lab.lab_gula_darah ||
    lab.hasil_lab_lainnya ||
    lab.skrining_hiv !== 'Belum Diperiksa' ||
    lab.skrining_sifilis !== 'Belum Diperiksa' ||
    lab.skrining_hbsag !== 'Belum Diperiksa' ||
    lab.skrining_tb !== 'Belum Diperiksa' ||
    lab.skrining_gonorea !== 'Belum Diperiksa' ||
    lab.skrining_klamidia !== 'Belum Diperiksa' ||
    lab.status_malaria !== 'Belum Diperiksa' ||
    lab.status_kecacingan !== 'Belum Diperiksa' ||
    lab.malaria_diberi_kelambu === 'Ya' ||
    lab.terapi_malaria === 1
  );
}
