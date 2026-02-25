/**
 * ANC Risk Scoring Utility
 * Automatic risk assessment for antenatal care visits
 */

/**
 * Calculate age from birth date
 * @param {string} birthDate - Date string in format YYYY-MM-DD
 * @returns {number} Age in years
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

/**
 * Parse blood pressure string
 * @param {string} bp - Blood pressure string (e.g., "120/80")
 * @returns {object} Object with systolic and diastolic values
 */
export const parseBP = (bp) => {
  if (!bp || typeof bp !== 'string') return { systolic: null, diastolic: null };
  
  const parts = bp.split('/');
  if (parts.length !== 2) return { systolic: null, diastolic: null };
  
  return {
    systolic: parseInt(parts[0]) || null,
    diastolic: parseInt(parts[1]) || null
  };
};

/**
 * Calculate comprehensive risk score for ANC visit
 * @param {object} params - Parameters object containing all risk factors
 * @returns {object} Risk score and factors
 */
export const calculateRiskScore = ({
  motherData,
  formData,
  labScreeningData
}) => {
  let score = 0;
  const factors = [];
  const criticalFactors = [];
  
  // 1. MATERNAL AGE RISK (Max: 15 points)
  if (motherData?.tanggal_lahir) {
    const age = calculateAge(motherData.tanggal_lahir);
    if (age !== null) {
      if (age < 18) {
        score += 15;
        factors.push(`Usia ${age} tahun (< 18) → +15 poin`);
        criticalFactors.push('Usia < 18 tahun');
      } else if (age >= 18 && age < 20) {
        score += 10;
        factors.push(`Usia ${age} tahun (18-20) → +10 poin`);
      } else if (age >= 35 && age <= 40) {
        score += 10;
        factors.push(`Usia ${age} tahun (35-40) → +10 poin`);
      } else if (age > 40) {
        score += 15;
        factors.push(`Usia ${age} tahun (> 40) → +15 poin`);
        criticalFactors.push('Usia > 40 tahun');
      }
    }
  }
  
  // 2. PARITY RISK (Max: 15 points)
  if (motherData?.kehamilan) {
    const gravida = parseInt(motherData.kehamilan.gravida) || 0;
    const partus = parseInt(motherData.kehamilan.partus) || 0;
    const abortus = parseInt(motherData.kehamilan.abortus) || 0;
    
    if (gravida === 1) {
      score += 5;
      factors.push('Primigravida (G1) → +5 poin');
    } else if (partus >= 4) {
      score += 15;
      factors.push(`Grande multipara (P${partus}) → +15 poin`);
      criticalFactors.push('Grande multipara');
    }
    
    // Abortion history
    if (abortus >= 1) {
      score += 10;
      factors.push(`Riwayat abortus ${abortus}x → +10 poin`);
    }
  }
  
  // 3. BLOOD PRESSURE RISK (Max: 20 points)
  if (formData?.tekanan_darah) {
    const bp = parseBP(formData.tekanan_darah);
    if (bp.systolic !== null && bp.diastolic !== null) {
      if (bp.systolic >= 160 || bp.diastolic >= 110) {
        score += 20;
        factors.push(`TD ${formData.tekanan_darah} (Hipertensi berat) → +20 poin`);
        criticalFactors.push('Hipertensi berat');
      } else if (bp.systolic >= 140 || bp.diastolic >= 90) {
        score += 15;
        factors.push(`TD ${formData.tekanan_darah} (Hipertensi ringan-sedang) → +15 poin`);
      } else if (bp.systolic >= 130 || bp.diastolic >= 85) {
        score += 10;
        factors.push(`TD ${formData.tekanan_darah} (Hipertensi borderline) → +10 poin`);
      } else if (bp.systolic < 90 || bp.diastolic < 60) {
        score += 10;
        factors.push(`TD ${formData.tekanan_darah} (Hipotensi) → +10 poin`);
      }
    }
  }
  
  // 4. LILA RISK (Max: 15 points)
  if (formData?.lila) {
    const lila = parseFloat(formData.lila);
    if (!isNaN(lila)) {
      if (lila < 23.5) {
        score += 15;
        factors.push(`LILA ${lila} cm (KEK) → +15 poin`);
      } else if (lila < 25) {
        score += 10;
        factors.push(`LILA ${lila} cm (Borderline) → +10 poin`);
      }
    }
  }
  
  // 5. HEMOGLOBIN RISK (Max: 20 points)
  if (labScreeningData?.hasil_lab_hb) {
    const hb = parseFloat(labScreeningData.hasil_lab_hb);
    if (!isNaN(hb)) {
      if (hb < 7) {
        score += 20;
        factors.push(`HB ${hb} g/dL (Anemia berat) → +20 poin`);
        criticalFactors.push('Anemia berat');
      } else if (hb < 9) {
        score += 15;
        factors.push(`HB ${hb} g/dL (Anemia sedang) → +15 poin`);
      } else if (hb < 11) {
        score += 10;
        factors.push(`HB ${hb} g/dL (Anemia ringan) → +10 poin`);
      }
    }
  }
  
  // 6. PROTEIN URINE RISK (Max: 20 points)
  if (labScreeningData?.lab_protein_urine) {
    const protein = labScreeningData.lab_protein_urine;
    if (protein === '+4') {
      score += 20;
      factors.push('Proteinuria +4 (Berat) → +20 poin');
      criticalFactors.push('Proteinuria berat');
    } else if (protein === '+3') {
      score += 15;
      factors.push('Proteinuria +3 (Sedang) → +15 poin');
    } else if (protein === '+2') {
      score += 10;
      factors.push('Proteinuria +2 (Ringan) → +10 poin');
    } else if (protein === '+1') {
      score += 5;
      factors.push('Proteinuria +1 (Minimal) → +5 poin');
    }
  }
  
  // 7. INFECTIOUS DISEASE SCREENING (Max: 25 points cumulative)
  let infectionScore = 0;
  if (labScreeningData?.skrining_hiv === 'Reaktif') {
    infectionScore += 15;
    factors.push('HIV Reaktif → +15 poin');
    criticalFactors.push('HIV Reaktif');
  }
  if (labScreeningData?.skrining_sifilis === 'Reaktif') {
    infectionScore += 15;
    factors.push('Sifilis Reaktif → +15 poin');
    criticalFactors.push('Sifilis Reaktif');
  }
  if (labScreeningData?.skrining_hbsag === 'Reaktif') {
    infectionScore += 10;
    factors.push('HBsAg Reaktif → +10 poin');
  }
  if (labScreeningData?.skrining_tb === 'Positif' || labScreeningData?.skrining_tb === 'Suspek') {
    infectionScore += 10;
    factors.push(`TB ${labScreeningData.skrining_tb} → +10 poin`);
  }
  if (labScreeningData?.skrining_gonorea === 'Reaktif') {
    infectionScore += 5;
    factors.push('Gonorea Reaktif → +5 poin');
  }
  if (labScreeningData?.skrining_klamidia === 'Reaktif') {
    infectionScore += 5;
    factors.push('Klamidia Reaktif → +5 poin');
  }
  // Cap infection score at 25
  const cappedInfectionScore = Math.min(infectionScore, 25);
  score += cappedInfectionScore;
  if (infectionScore > 25) {
    factors.push(`(Skor infeksi dibatasi: ${infectionScore} → 25 poin)`);
  }
  
  // 8. WEIGHT GAIN RISK (Max: 10 points)
  if (formData?.selisih_beratbadan) {
    const weightDiff = parseFloat(formData.selisih_beratbadan);
    if (!isNaN(weightDiff)) {
      if (weightDiff < 0) {
        score += 10;
        factors.push(`Penurunan BB ${Math.abs(weightDiff)} kg → +10 poin`);
      } else if (weightDiff > 2) {
        score += 10;
        factors.push(`Kenaikan BB berlebih ${weightDiff} kg → +10 poin`);
      }
    }
  }
  
  // 9. FETAL HEART RATE RISK (Max: 10 points)
  if (formData?.denyut_jantung_janin) {
    const fhr = parseInt(formData.denyut_jantung_janin);
    if (!isNaN(fhr)) {
      if (fhr < 110) {
        score += 10;
        factors.push(`DJJ ${fhr} bpm (Bradikardia) → +10 poin`);
      } else if (fhr > 160) {
        score += 10;
        factors.push(`DJJ ${fhr} bpm (Takikardia) → +10 poin`);
      }
    }
  }
  
  return {
    score,
    factors,
    criticalFactors,
    maxScore: 160
  };
};

/**
 * Determine risk level based on score
 * @param {number} score - Risk score
 * @returns {object} Risk level information
 */
export const getRiskLevel = (score) => {
  if (score >= 50) {
    return {
      level: 'high',
      label: 'Risiko Tinggi',
      color: 'danger',
      status: 'Tinggi',
      recommendation: 'Rujukan ke dokter/RS direkomendasikan. Monitoring ketat diperlukan.'
    };
  } else if (score >= 30) {
    return {
      level: 'moderate',
      label: 'Risiko Sedang',
      color: 'warning',
      status: 'Sedang',
      recommendation: 'Monitoring ketat diperlukan. Pertimbangkan konsultasi dokter.'
    };
  } else if (score >= 15) {
    return {
      level: 'mild',
      label: 'Risiko Ringan',
      color: 'info',
      status: 'Ringan',
      recommendation: 'Perhatikan faktor risiko. Monitoring rutin.'
    };
  } else {
    return {
      level: 'low',
      label: 'Normal',
      color: 'success',
      status: 'Normal',
      recommendation: 'Lanjutkan perawatan ANC rutin.'
    };
  }
};

/**
 * Check if any critical factors are present that automatically trigger high risk
 * @param {array} criticalFactors - Array of critical factor strings
 * @returns {boolean} True if critical factors present
 */
export const hasCriticalFactors = (criticalFactors) => {
  return criticalFactors && criticalFactors.length > 0;
};

/**
 * Get automatic risk status based on score and critical factors
 * @param {number} score - Risk score
 * @param {array} criticalFactors - Array of critical factors
 * @returns {string} 'Normal', 'Ringan', 'Sedang', or 'Tinggi'
 */
export const getAutomaticRiskStatus = (score, criticalFactors) => {
  // Automatic high risk if critical factors present
  if (hasCriticalFactors(criticalFactors)) {
    return 'Tinggi';
  }
  
  // Otherwise use score thresholds
  if (score >= 50) {
    return 'Tinggi';
  } else if (score >= 30) {
    return 'Sedang';
  } else if (score >= 15) {
    return 'Ringan';
  } else {
    return 'Normal';
  }
};

/**
 * Format risk score for display
 * @param {object} riskScore - Risk score object from calculateRiskScore
 * @returns {string} Formatted string
 */
export const formatRiskScore = (riskScore) => {
  if (!riskScore) return 'N/A';
  return `${riskScore.score} / ${riskScore.maxScore} poin`;
};

/**
 * Get risk percentage
 * @param {number} score - Risk score
 * @param {number} maxScore - Maximum possible score
 * @returns {number} Percentage (0-100)
 */
export const getRiskPercentage = (score, maxScore = 160) => {
  return Math.round((score / maxScore) * 100);
};
