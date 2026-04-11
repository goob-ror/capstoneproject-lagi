class TambahNifasModel {
  constructor() {
    this.baseURL = '/api/nifas';
  }

  // Validation methods
  validateForm(formData) {
    const errors = [];

    if (!formData.forkey_hamil) {
      errors.push('Pilih ibu nifas terlebih dahulu');
    }

    if (!formData.tanggal_kunjungan) {
      errors.push('Tanggal kunjungan harus diisi');
    }

    if (!formData.jenis_kunjungan) {
      errors.push('Jenis kunjungan harus dipilih');
    }

    if (!formData.pemeriksa) {
      errors.push('Pemeriksa harus dipilih');
    }

    return errors;
  }

  // Format data for API
  formatFormData(formData) {
    return {
      ...formData,
      suhu_badan: formData.suhu_badan ? parseFloat(formData.suhu_badan) : null,
      berat_badan_bayi: formData.berat_badan_bayi ? parseFloat(formData.berat_badan_bayi) : null,
      suhu_bayi: formData.suhu_bayi ? parseFloat(formData.suhu_bayi) : null,
      konseling_asi: Boolean(formData.konseling_asi)
    };
  }

  // Get visit type description
  getVisitTypeDescription(jenis_kunjungan) {
    const descriptions = {
      'KF1': 'Kunjungan Nifas 1 (0-48 jam)',
      'KF2': 'Kunjungan Nifas 2 (3-7 hari)',
      'KF3': 'Kunjungan Nifas 3 (8-28 hari)',
      'KF4': 'Kunjungan Nifas 4 (29-42 hari)'
    };
    return descriptions[jenis_kunjungan] || jenis_kunjungan;
  }
}

export default TambahNifasModel;