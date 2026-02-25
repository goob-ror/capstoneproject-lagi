/**
 * Neonatal Risk Scoring Utility
 * Automatic risk assessment for newborn babies at delivery
 */

/**
 * Calculate comprehensive neonatal risk score
 * @param {object} params - Parameters object containing all risk factors
 * @returns {object} Risk score and factors
 */
export const calculateNeonatalRiskScore = ({
  babyData,
  deliveryData
}) => {
  let score = 0;
  const factors = [];
  const criticalFactors = [];
  
  // 1. BIRTH WEIGHT RISK (Max: 25 points)
  if (babyData?.berat_badan_lahir) {
    const weight = parseInt(babyData.berat_badan_lahir);
    if (!isNaN(weight)) {
      if (weight < 1500) {
        score += 25;
        factors.push(`Berat lahir ${weight}g (BBLSR - Sangat Rendah) → +25 poin`);
        criticalFactors.push('BBLSR (<1500g)');
      } else if (weight < 2500) {
        score += 20;
        factors.push(`Berat lahir ${weight}g (BBLR) → +20 poin`);
        criticalFactors.push('BBLR (<2500g)');
      } else if (weight > 4000) {
        score += 15;
        factors.push(`Berat lahir ${weight}g (Makrosomia) → +15 poin`);
      }
    }
  }
  
  // 2. APGAR SCORE RISK (Max: 30 points)
  // APGAR 1 minute
  if (babyData?.apgar_menit1 !== undefined && babyData?.apgar_menit1 !== null) {
    const apgar1 = parseInt(babyData.apgar_menit1);
    if (!isNaN(apgar1)) {
      if (apgar1 <= 3) {
        score += 20;
        factors.push(`APGAR 1 menit: ${apgar1} (Asfiksia berat) → +20 poin`);
        criticalFactors.push('Asfiksia berat (APGAR 1\' ≤3)');
      } else if (apgar1 <= 6) {
        score += 15;
        factors.push(`APGAR 1 menit: ${apgar1} (Asfiksia sedang) → +15 poin`);
      } else if (apgar1 <= 7) {
        score += 10;
        factors.push(`APGAR 1 menit: ${apgar1} (Asfiksia ringan) → +10 poin`);
      }
    }
  }
  
  // APGAR 5 minutes
  if (babyData?.apgar_menit5 !== undefined && babyData?.apgar_menit5 !== null) {
    const apgar5 = parseInt(babyData.apgar_menit5);
    if (!isNaN(apgar5)) {
      if (apgar5 <= 3) {
        score += 20;
        factors.push(`APGAR 5 menit: ${apgar5} (Asfiksia berat persisten) → +20 poin`);
        criticalFactors.push('Asfiksia berat persisten (APGAR 5\' ≤3)');
      } else if (apgar5 <= 6) {
        score += 10;
        factors.push(`APGAR 5 menit: ${apgar5} (Pemulihan lambat) → +10 poin`);
      }
    }
  }
  
  // 3. ASPHYXIA STATUS (Max: 20 points)
  if (babyData?.asfiksia) {
    if (babyData.asfiksia === 'Berat') {
      score += 20;
      factors.push('Asfiksia Berat → +20 poin');
      criticalFactors.push('Asfiksia Berat');
    } else if (babyData.asfiksia === 'Ringan') {
      score += 10;
      factors.push('Asfiksia Ringan → +10 poin');
    }
  }
  
  // 4. PREMATURITY RISK (Max: 20 points)
  if (babyData?.prematur === 1 || babyData?.prematur === true) {
    score += 20;
    factors.push('Bayi Prematur → +20 poin');
    criticalFactors.push('Prematur');
  }
  
  // 5. RESPIRATORY DISTRESS (Max: 20 points)
  if (babyData?.gangguan_napas === 1 || babyData?.gangguan_napas === true) {
    score += 20;
    factors.push('Gangguan Napas → +20 poin');
    criticalFactors.push('Gangguan Napas');
  }
  
  // 6. BABY CONDITION (Max: 25 points)
  if (babyData?.kondisi) {
    if (babyData.kondisi === 'Meninggal') {
      score += 25;
      factors.push('Kondisi: Meninggal → +25 poin');
      criticalFactors.push('Meninggal');
    } else if (babyData.kondisi === 'Sakit') {
      score += 15;
      factors.push('Kondisi: Sakit → +15 poin');
      criticalFactors.push('Sakit');
    }
  }
  
  // 7. DELIVERY METHOD RISK (Max: 15 points)
  if (deliveryData?.jenis_persalinan) {
    if (deliveryData.jenis_persalinan === 'Sectio Caesarea') {
      score += 10;
      factors.push('Persalinan SC → +10 poin');
    } else if (deliveryData.jenis_persalinan === 'Vakum' || deliveryData.jenis_persalinan === 'Forceps') {
      score += 15;
      factors.push(`Persalinan ${deliveryData.jenis_persalinan} (Tindakan) → +15 poin`);
    }
  }
  
  // 8. DELIVERY COMPLICATIONS (Max: 15 points)
  if (deliveryData?.komplikasi_persalinan) {
    const komplikasi = deliveryData.komplikasi_persalinan.toLowerCase();
    if (komplikasi.includes('perdarahan') || komplikasi.includes('gawat janin') || 
        komplikasi.includes('distosia') || komplikasi.includes('prolaps')) {
      score += 15;
      factors.push('Komplikasi persalinan → +15 poin');
    }
  }
  
  // 9. CONGENITAL ANOMALIES (Max: 20 points)
  if (babyData?.keterangan) {
    const keterangan = babyData.keterangan.toLowerCase();
    if (keterangan.includes('kelainan') || keterangan.includes('anomali') || 
        keterangan.includes('cacat') || keterangan.includes('sindrom')) {
      score += 20;
      factors.push('Kelainan kongenital terdeteksi → +20 poin');
      criticalFactors.push('Kelainan kongenital');
    }
  }
  
  // 10. MULTIPLE BIRTH RISK (Max: 10 points)
  if (babyData?.urutan_bayi && parseInt(babyData.urutan_bayi) > 1) {
    score += 10;
    factors.push(`Kelahiran kembar (bayi ke-${babyData.urutan_bayi}) → +10 poin`);
  }
  
  return {
    score,
    factors,
    criticalFactors,
    maxScore: 200
  };
};

/**
 * Determine neonatal risk level based on score
 * @param {number} score - Risk score
 * @returns {object} Risk level information
 */
export const getNeonatalRiskLevel = (score) => {
  if (score >= 50) {
    return {
      level: 'berat',
      label: 'Risiko Berat',
      color: 'danger',
      status: 'Berat',
      recommendation: 'Rujukan segera ke NICU/RS. Monitoring intensif diperlukan.'
    };
  } else if (score >= 30) {
    return {
      level: 'sedang',
      label: 'Risiko Sedang',
      color: 'warning',
      status: 'Sedang',
      recommendation: 'Observasi ketat. Pertimbangkan rujukan ke RS.'
    };
  } else if (score >= 15) {
    return {
      level: 'ringan',
      label: 'Risiko Ringan',
      color: 'info',
      status: 'Ringan',
      recommendation: 'Monitoring rutin. Perhatikan tanda bahaya.'
    };
  } else {
    return {
      level: 'normal',
      label: 'Normal',
      color: 'success',
      status: 'Normal',
      recommendation: 'Perawatan bayi baru lahir rutin.'
    };
  }
};

/**
 * Check if any critical factors are present
 * @param {array} criticalFactors - Array of critical factor strings
 * @returns {boolean} True if critical factors present
 */
export const hasNeonatalCriticalFactors = (criticalFactors) => {
  return criticalFactors && criticalFactors.length > 0;
};

/**
 * Get automatic neonatal risk status based on score and critical factors
 * @param {number} score - Risk score
 * @param {array} criticalFactors - Array of critical factors
 * @returns {string} 'Normal', 'Ringan', 'Sedang', or 'Berat'
 */
export const getAutomaticNeonatalRiskStatus = (score, criticalFactors) => {
  // Critical factors automatically trigger high risk
  if (hasNeonatalCriticalFactors(criticalFactors)) {
    // Check severity of critical factors
    const severeCritical = ['BBLSR (<1500g)', 'Asfiksia berat (APGAR 1\' ≤3)', 
                            'Asfiksia berat persisten (APGAR 5\' ≤3)', 
                            'Asfiksia Berat', 'Meninggal'];
    
    const hasSevereCritical = criticalFactors.some(factor => 
      severeCritical.some(severe => factor.includes(severe))
    );
    
    if (hasSevereCritical) {
      return 'Berat';
    }
    
    // Other critical factors
    if (score >= 50) {
      return 'Berat';
    } else if (score >= 30) {
      return 'Sedang';
    } else {
      return 'Ringan';
    }
  }
  
  // Score-based classification
  if (score >= 50) {
    return 'Berat';
  } else if (score >= 30) {
    return 'Sedang';
  } else if (score >= 15) {
    return 'Ringan';
  }
  
  return 'Normal';
};

/**
 * Format neonatal risk score for display
 * @param {object} riskScore - Risk score object from calculateNeonatalRiskScore
 * @returns {string} Formatted string
 */
export const formatNeonatalRiskScore = (riskScore) => {
  if (!riskScore) return 'N/A';
  return `${riskScore.score} / ${riskScore.maxScore} poin`;
};

/**
 * Get neonatal risk percentage
 * @param {number} score - Risk score
 * @param {number} maxScore - Maximum possible score
 * @returns {number} Percentage (0-100)
 */
export const getNeonatalRiskPercentage = (score, maxScore = 200) => {
  return Math.round((score / maxScore) * 100);
};

/**
 * Get risk color class for styling
 * @param {string} status - Risk status
 * @returns {string} CSS class name
 */
export const getNeonatalRiskColorClass = (status) => {
  switch (status) {
    case 'Berat':
      return 'risk-berat';
    case 'Sedang':
      return 'risk-sedang';
    case 'Ringan':
      return 'risk-ringan';
    case 'Normal':
    default:
      return 'risk-normal';
  }
};
