/**
 * import-mapper.js
 * Maps raw Excel row data to structured JSON matching the iBundaCare DB schema.
 * The external file has a 3-row merged header — this mapper works on pre-parsed
 * flat objects where keys are the resolved column names.
 */

/**
 * Resolve the multi-row merged header from the external Excel file into
 * a flat array of column key names, in order.
 * This is the canonical column index → key mapping for the external ANC register.
 */
export const COLUMN_KEYS = [
  'no',                                  // A  (0)  — No urut
  'tanggal_register',                    // B  (1)  — Tanggal kunjungan (datetime)
  'nik',                                 // C  (2)  — NIK ibu
  'no_ibu',                              // D  (3)  — No. Ibu (external system ID)
  'nama_ibu',                            // E  (4)  — Nama ibu
  'umur',                                // F  (5)  — Umur (calculated, discarded)
  'tanggal_lahir',                       // G  (6)  — Tanggal lahir
  'no_telp',                             // H  (7)  — No. telepon
  'alamat',                              // I  (8)  — Alamat
  'jamkesmas',                           // J  (9)  — Jamkesmas (discarded)
  'hpht',                                // K  (10) — Tanggal HPHT
  'taksiran_persalinan',                 // L  (11) — Taksiran persalinan
  'usia_kehamilan',                      // M  (12) — Usia kehamilan (calculated, discarded)
  'trimester',                           // N  (13) — Trimester ke- (calculated, discarded)
  'kunjungan',                           // O  (14) — Jenis kunjungan (K1–K6)
  'faskes_asal',                         // P  (15) — Faskes asal
  'anamnesis',                           // Q  (16) — Anamnesis
  'bb',                                  // R  (17) — Berat badan (kg)
  'tinggi_badan',                        // S  (18) — Tinggi badan (cm)
  'tekanan_darah',                       // T  (19) — Tekanan darah (mmHg)
  'lila',                                // U  (20) — LILA (cm)
  'status_gizi',                         // V  (21) — Status gizi
  'tfu',                                 // W  (22) — Tinggi fundus uteri (cm)
  'refleks_patella',                     // X  (23) — Refleks patella (not stored)
  'djj_tunggal',                         // Y  (24) — DJJ janin tunggal (x/menit)
  'kepala_pap_tunggal',                  // Z  (25) — Kepala thd PAP tunggal (not stored)
  'tbj_tunggal',                         // AA (26) — TBJ tunggal (gr) → hasil_usg text
  'presentasi_tunggal',                  // AB (27) — Presentasi tunggal → hasil_usg text
  'djj_jamak',                           // AC (28) — DJJ janin jamak
  'kepala_pap_jamak',                    // AD (29) — Kepala thd PAP jamak
  'tbj_jamak',                           // AE (30) — TBJ jamak
  'presentasi_jamak',                    // AF (31) — Presentasi jamak
  'jumlah_janin',                        // AG (32) — Jumlah janin
  'konseling',                           // AH (33) — Konseling
  'status_imunisasi_tt',                 // AI (34) — Status imunisasi TT (T0–T5)
  'injeksi_tt',                          // AJ (35) — Ceklis injeksi TT
  'catat_buku_kia',                      // AK (36) — Catat di buku KIA
  'fe',                                  // AL (37) — Fe (Tab/Botol)
  'periksa_hb',                          // AM (38) — Periksa HB (boolean)
  'hasil_hb',                            // AN (39) — Hasil HB (gr/dl)
  'protein_urine',                       // AO (40) — Protein uria (+/-)
  'gula_darah',                          // AP (41) — Gula darah
  'thalasemia',                          // AQ (42) — Thalasemia (+/-) → hasil_lab_lainnya
  'sifilis',                             // AR (43) — Sifilis (+/-)
  'hbsag',                               // AS (44) — HBsAg (+/-)
  'anemia',                              // AT (45) — Anemia (+/-) (derived, not stored)
  'hiv_datang',                          // AU (46) — Datang dengan HIV (+/-)
  'hiv_ditawarkan',                      // AV (47) — Ditawarkan tes HIV
  'hiv_dilakukan',                       // AW (48) — Dilakukan tes HIV
  'hiv_hasil',                           // AX (49) — Hasil tes HIV (+/-)
  'hiv_art',                             // AY (50) — Mendapatkan ART
  'ibu_hamil_hiv_persalinan_vagina',     // AZ (51) — Ibu hamil HIV: persalinan pervaginam
  'ibu_hamil_hiv_persalinan_abdominal',  // BA (52) — Ibu hamil HIV: persalinan abdominal
  'malaria_kelambu',                     // BB (53) — Diberikan kelambu berinsektisida
  'malaria_darah_diperiksa',             // BC (54) — Darah malaria diperiksa
  'malaria_rdt',                         // BD (55) — Diperiksa RDT malaria
  'malaria_mikroskopis',                 // BE (56) — Diperiksa mikroskopis malaria
  'ibu_hamil_malaria',                   // BF (57) — Ibu hamil malaria
  'malaria_hasil',                       // BG (58) — Hasil tes darah malaria (+/-)
  'malaria_obat',                        // BH (59) — Obat Kina/ACT
  'tb_dahak',                            // BI (60) — Diperiksa dahak TB
  'tb_hasil',                            // BJ (61) — TBC (+/-)
  'tb_obat',                             // BK (62) — Obat TB
  'kecacingan_diperiksa',                // BL (63) — Diperiksa ankylostoma
  'kecacingan_hasil',                    // BM (64) — Ibu hamil tes kecacingan (+/-)
  'ims_diperiksa',                       // BN (65) — Diperiksa IMS
  'ims_hasil',                           // BO (66) — Hasil tes IMS (+/-)
  'ims_diterapi',                        // BP (67) — Diterapi IMS
  'hepatitis_diperiksa',                 // BQ (68) — Diperiksa hepatitis
  'hepatitis_hasil',                     // BR (69) — Hasil tes hepatitis (+/-)
  'risiko_pasien',                       // BS (70) — Risiko terdeteksi oleh: Pasien
  'risiko_keluarga',                     // BT (71) — Risiko terdeteksi oleh: Keluarga
  'risiko_masyarakat',                   // BU (72) — Risiko terdeteksi oleh: Masyarakat
  'risiko_dukun',                        // BV (73) — Risiko terdeteksi oleh: Dukun
  'risiko_kader',                        // BW (74) — Risiko terdeteksi oleh: Kader
  'risiko_bidan',                        // BX (75) — Risiko terdeteksi oleh: Bidan
  'risiko_perawat',                      // BY (76) — Risiko terdeteksi oleh: Perawat
  'risiko_dokter',                       // BZ (77) — Risiko terdeteksi oleh: Dokter
  'risiko_dsog',                         // CA (78) — Risiko terdeteksi oleh: DSOG
  'risiko_hdk',                          // CB (79) — Risiko terdeteksi oleh: HDK
  'komplikasi_abortus',                  // CC (80) — Komplikasi: Abortus
  'komplikasi_pendarahan',               // CD (81) — Komplikasi: Pendarahan
  'komplikasi_infeksi',                  // CE (82) — Komplikasi: Infeksi
  'komplikasi_kpd',                      // CF (83) — Komplikasi: KPD
  'komplikasi_lainnya',                  // CG (84) — Komplikasi: Lainnya
  'rujukan_puskesmas',                   // CH (85) — Rujukan: Puskesmas
  'rujukan_klinik',                      // CI (86) — Rujukan: Klinik
  'rujukan_rb',                          // CJ (87) — Rujukan: RB
  'rujukan_rsia',                        // CK (88) — Rujukan: RSIA/RSB
  'rujukan_rs',                          // CL (89) — Rujukan: RS
  'rujukan_lainnya',                     // CM (90) — Rujukan: Lainnya
  'keadaan_tiba',                        // CN (91) — Keadaan tiba (H/M)
  'keadaan_pulang',                      // CO (92) — Keadaan pulang (H/M)
];

/**
 * Map a raw Excel row array (values by column index) to a flat key-value object.
 * @param {Array} rowValues - Array of cell values from the Excel row
 * @returns {Object}  flat object with COLUMN_KEYS as keys
 */
export function mapRowToObject(rowValues) {
  const obj = {};
  COLUMN_KEYS.forEach((key, idx) => {
    obj[key] = rowValues[idx] !== undefined ? rowValues[idx] : null;
  });
  return obj;
}

/**
 * Map a flat row object to the structured JSON shape used by iBundaCare.
 * Returns { ibu, kehamilan, anc, lab, komplikasi[], meta }
 * @param {Object} row - flat row object from mapRowToObject
 * @returns {Object} structured import record
 */
export function mapToImportRecord(row) {
  return {
    // ── ibu ──────────────────────────────────────────────────
    ibu: {
      nik_ibu: row.nik ? String(row.nik).trim() : null,
      nama_lengkap: row.nama_ibu ? String(row.nama_ibu).trim() : null,
      tanggal_lahir: row.tanggal_lahir || null,
      no_hp: row.no_telp ? String(row.no_telp).trim() : null,
      alamat_lengkap: row.alamat ? String(row.alamat).trim() : null,
      tinggi_badan: _safeFloat(row.tinggi_badan),
      // Fields not in source — left null, filled by defaulter
      gol_darah: null,
      rhesus: null,
      buku_kia: null,
      pekerjaan: null,
      pendidikan: null,
      kelurahan_id: null,
      rt: null,
      posyandu_id: null,
    },

    // ── kehamilan ─────────────────────────────────────────────
    kehamilan: {
      haid_terakhir: row.hpht || null,
      taksiran_persalinan: row.taksiran_persalinan || null,
      // Not in source — filled by defaulter
      gravida: null,
      partus: null,
      abortus: null,
      status_kehamilan: 'Hamil',
    },

    // ── antenatal_care ────────────────────────────────────────
    anc: {
      tanggal_kunjungan: row.tanggal_register || null,
      jenis_kunjungan: row.kunjungan ? String(row.kunjungan).trim().toUpperCase() : null,
      berat_badan: _safeFloat(row.bb),
      tekanan_darah: row.tekanan_darah ? String(row.tekanan_darah).trim() : null,
      lila: _safeFloat(row.lila),
      tinggi_fundus: _safeFloat(row.tfu),
      denyut_jantung_janin: _safeInt(row.djj_tunggal),
      status_imunisasi_tt: row.status_imunisasi_tt ? String(row.status_imunisasi_tt).trim().toUpperCase() : null,
      beri_tablet_fe: _safeBool(row.fe),
      // Compose hasil_usg from fetal presentation data
      hasil_usg: _buildHasilUsg(row),
      // Compose keterangan from misc fields
      keterangan_anc: _buildKeterangan(row),
      hasil_temu_wicara: row.anamnesis ? String(row.anamnesis).trim() : null,
      // Defaults — filled by defaulter
      jenis_akses: null,
      pemeriksa: null,
      confirm_usg: 0,
      status_risiko_visit: null,
      tata_laksana_kasus: null,
    },

    // ── lab_screening ─────────────────────────────────────────
    lab: {
      hasil_lab_hb: _safeFloat(row.hasil_hb),
      lab_protein_urine: row.protein_urine || null,
      lab_gula_darah: row.gula_darah ? String(row.gula_darah).trim() : null,
      hasil_lab_lainnya: row.thalasemia ? `Thalasemia: ${row.thalasemia}` : null,
      skrining_hiv: row.hiv_hasil || null,
      status_art: row.hiv_art || null,
      skrining_sifilis: row.sifilis || null,
      skrining_hbsag: row.hbsag || null,
      skrining_tb: row.tb_hasil || null,
      malaria_diberi_kelambu: row.malaria_kelambu || null,
      terapi_malaria: _safeBool(row.malaria_obat),
      status_malaria: row.malaria_hasil || null,
      status_kecacingan: row.kecacingan_hasil || null,
      terapi_kecacingan: 0,
      skrining_gonorea: 'Belum Diperiksa',
      skrining_klamidia: 'Belum Diperiksa',
    },

    // ── komplikasi (array — one entry per checked flag) ───────
    komplikasi: _buildKomplikasi(row),

    // ── meta (import tracking, not stored in DB) ──────────────
    meta: {
      no_ibu_external: row.no_ibu,
      faskes_asal: row.faskes_asal,
      keadaan_tiba: row.keadaan_tiba,
      keadaan_pulang: row.keadaan_pulang,
      row_number: row.no,
    },
  };

}
/**
 * Safely parse a numeric value from any cell type.
 * Handles: numbers, numeric strings, NaN from symbols (✓, V, -), null/undefined.
 * Returns the parsed float or null — never NaN.
 */
function _safeFloat(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  const parsed = parseFloat(String(value).trim().replace(',', '.'));
  return isNaN(parsed) ? null : parsed;
}

/**
 * Safely parse an integer from any cell type.
 * Returns the parsed int or null — never NaN.
 */
function _safeInt(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return isNaN(value) ? null : Math.round(value);
  const parsed = parseInt(String(value).trim(), 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Safely parse a boolean/checkbox cell.
 * Treats ✓, V, v, 1, Ya, Y as true. Everything else false.
 */
function _safeBool(value) {
  if (!value) return 0;
  const v = String(value).trim().toUpperCase();
  return ['✓', 'V', '1', 'TRUE', 'YA', 'Y', 'X'].includes(v) ? 1 : 0;
}

function _buildHasilUsg(row) {
  const parts = [];
  if (row.presentasi_tunggal) parts.push(`Presentasi: ${row.presentasi_tunggal}`);
  if (row.tbj_tunggal) parts.push(`TBJ: ${row.tbj_tunggal}gr`);
  if (row.kepala_pap_tunggal) parts.push(`Kepala thd PAP: ${row.kepala_pap_tunggal}`);
  if (row.djj_jamak) parts.push(`DJJ Jamak: ${row.djj_jamak}`);
  if (row.presentasi_jamak) parts.push(`Presentasi Jamak: ${row.presentasi_jamak}`);
  return parts.length > 0 ? parts.join(', ') : null;
}

function _buildKeterangan(row) {
  const parts = [];
  if (row.faskes_asal) parts.push(`Faskes Asal: ${row.faskes_asal}`);
  // AH (33) konseling — general counselling note
  if (row.konseling) parts.push(`Konseling: ${row.konseling}`);
  // AJ (35) catat_buku_kia — whether recorded in KIA book
  if (row.catat_buku_kia) parts.push(`Buku KIA: ${row.catat_buku_kia}`);
  if (row.keadaan_tiba) parts.push(`Keadaan Tiba: ${row.keadaan_tiba}`);
  if (row.keadaan_pulang) parts.push(`Keadaan Pulang: ${row.keadaan_pulang}`);
  if (row.no_ibu) parts.push(`No. Ibu (Eksternal): ${row.no_ibu}`);
  return parts.length > 0 ? parts.join(' | ') : null;
}

function _buildKomplikasi(row) {
  const list = [];
  const visitDate = row.tanggal_register;

  const flags = [
    { field: 'komplikasi_abortus',    nama: 'Abortus' },
    { field: 'komplikasi_pendarahan', nama: 'Pendarahan' },
    { field: 'komplikasi_infeksi',    nama: 'Infeksi' },
    { field: 'komplikasi_kpd',        nama: 'KPD (Ketuban Pecah Dini)' },
    { field: 'komplikasi_lainnya',    nama: 'Komplikasi Lainnya' },
  ];

  flags.forEach(({ field, nama }) => {
    const val = row[field];
    if (val && String(val).trim() !== '' && String(val).trim() !== '-') {
      list.push({
        nama_komplikasi: nama,
        kejadian: 'Saat Hamil',
        tanggal_diagnosis: visitDate,
        rujuk_rs: _hasRujukan(row) ? 1 : 0,
        nama_rs: _getRujukanNama(row),
        keterangan: String(val).trim() !== '1' ? String(val).trim() : null,
      });
    }
  });

  return list;
}

function _hasRujukan(row) {
  return !!(row.rujukan_rs || row.rujukan_rsia || row.rujukan_rb || row.rujukan_klinik || row.rujukan_puskesmas);
}

function _getRujukanNama(row) {
  if (row.rujukan_rs) return `RS`;
  if (row.rujukan_rsia) return `RSIA/RSB`;
  if (row.rujukan_rb) return `RB`;
  if (row.rujukan_klinik) return `Klinik`;
  if (row.rujukan_puskesmas) return `Puskesmas`;
  return null;
}
