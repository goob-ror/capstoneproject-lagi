/**
 * import-risk-scorer.js
 *
 * Thin adapter between the import record shape and calculateRiskScore().
 * Runs after applyDefaults so all fields are filled.
 */

import { calculateRiskScore, getAutomaticRiskStatus } from './maternalRiskScoring';

const PARITY_DEFAULTS = { gravida: 1, partus: 0, abortus: 0 };

/**
 * Score a single normalized+defaulted import record.
 *
 * @param {Object} record
 * @returns {{ status, score, factors, criticalFactors, parityDefaulted }}
 */
export function scoreImportRecord(record) {
  const { ibu, kehamilan, anc, lab } = record;

  const motherData = {
    tanggal_lahir: ibu?.tanggal_lahir || null,
    kehamilan: {
      gravida: kehamilan?.gravida ?? PARITY_DEFAULTS.gravida,
      partus:  kehamilan?.partus  ?? PARITY_DEFAULTS.partus,
      abortus: kehamilan?.abortus ?? PARITY_DEFAULTS.abortus,
    },
  };

  const formData = {
    tekanan_darah:        anc?.tekanan_darah        || null,
    lila:                 anc?.lila                 || null,
    selisih_beratbadan:   anc?.selisih_beratbadan   || null,
    denyut_jantung_janin: anc?.denyut_jantung_janin || null,
  };

  const labScreeningData = {
    hasil_lab_hb:      lab?.hasil_lab_hb      || null,
    lab_protein_urine: lab?.lab_protein_urine  || null,
    skrining_hiv:      lab?.skrining_hiv      || 'Belum Diperiksa',
    skrining_sifilis:  lab?.skrining_sifilis  || 'Belum Diperiksa',
    skrining_hbsag:    lab?.skrining_hbsag    || 'Belum Diperiksa',
    skrining_tb:       lab?.skrining_tb       || 'Belum Diperiksa',
    skrining_gonorea:  lab?.skrining_gonorea  || 'Belum Diperiksa',
    skrining_klamidia: lab?.skrining_klamidia || 'Belum Diperiksa',
  };

  const { score, factors, criticalFactors } = calculateRiskScore({
    motherData,
    formData,
    labScreeningData,
  });

  const status = getAutomaticRiskStatus(score, criticalFactors);

  const parityDefaulted =
    (kehamilan?.gravida ?? PARITY_DEFAULTS.gravida) === PARITY_DEFAULTS.gravida &&
    (kehamilan?.partus  ?? PARITY_DEFAULTS.partus)  === PARITY_DEFAULTS.partus  &&
    (kehamilan?.abortus ?? PARITY_DEFAULTS.abortus) === PARITY_DEFAULTS.abortus;

  return { status, score, factors: factors || [], criticalFactors: criticalFactors || [], parityDefaulted };
}

/**
 * Apply risk scoring to a record in-place.
 * Sets anc.status_risiko_visit, stores breakdown in _riskScore,
 * and appends a parity warning chip if parity was defaulted.
 *
 * @param {Object} record - import record (after applyDefaults)
 * @returns {Object} same record mutated
 */
export function applyRiskScore(record) {
  const { status, score, factors, criticalFactors, parityDefaulted } = scoreImportRecord(record);

  record.anc.status_risiko_visit = status;

  // Store full breakdown so the badge popup can display it
  record._riskScore = { score, factors, criticalFactors, parityDefaulted };

  // Append parity warning chip if data was defaulted
  if (parityDefaulted) {
    const alreadyHas = (record._warnings || []).some(w => w.field === 'paritas');
    if (!alreadyHas) {
      record._warnings = record._warnings || [];
      record._warnings.push({
        field: 'paritas',
        level: 'info',
        message: 'Paritas tidak diketahui — skor risiko mungkin lebih rendah dari sebenarnya',
      });
    }
  }

  return record;
}
