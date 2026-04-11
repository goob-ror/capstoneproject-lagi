class KunjunganNifasModel {
  constructor() {
    this.baseURL = '/api/nifas';
  }

  // Format data for display
  formatNifasData(data) {
    return data.map(item => ({
      ...item,
      tanggal_kunjungan_formatted: this.formatDate(item.tanggal_kunjungan),
      suhu_badan_formatted: item.suhu_badan ? `${item.suhu_badan}°C` : '-',
      suhu_bayi_formatted: item.suhu_bayi ? `${item.suhu_bayi}°C` : '-',
      berat_badan_bayi_formatted: item.berat_badan_bayi ? `${item.berat_badan_bayi} kg` : '-'
    }));
  }

  // Format date for display
  formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get visit type badge class
  getVisitBadgeClass(jenis_kunjungan) {
    const classes = {
      'KF1': 'badge-primary',
      'KF2': 'badge-info',
      'KF3': 'badge-warning',
      'KF4': 'badge-success'
    };
    return classes[jenis_kunjungan] || 'badge-secondary';
  }

  // Filter data based on search term
  filterData(data, searchTerm) {
    if (!searchTerm) return data;
    
    const term = searchTerm.toLowerCase();
    return data.filter(item => 
      item.nama_ibu?.toLowerCase().includes(term) ||
      item.nik_ibu?.toLowerCase().includes(term) ||
      item.jenis_kunjungan?.toLowerCase().includes(term) ||
      item.pemeriksa?.toLowerCase().includes(term)
    );
  }
}

export default KunjunganNifasModel;