import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import RekapitulasiPresenter from './Rekapitulasi-presenter';
import './Rekapitulasi.css';

const Rekapitulasi = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedKelurahan, setSelectedKelurahan] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const [presenter] = useState(() => new RekapitulasiPresenter({
    setLoading,
    setError,
    clearError: () => setError(''),
    displaySummaryData: (data) => {
      setSummaryData(data);
      if (data.selectedKelurahan) {
        setSelectedKelurahan(data.selectedKelurahan);
      }
    },
    onLogout: () => navigate('/login')
  }));

  useEffect(() => {
    const userData = presenter.getUser();
    setUser(userData);
    presenter.loadSummaryData();
  }, [presenter]);

  const handleKelurahanChange = (e) => {
    const kelurahan = e.target.value;
    setSelectedKelurahan(kelurahan);
    presenter.loadSummaryData(kelurahan || null, selectedYear || null, selectedMonth || null);
  };

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    presenter.loadSummaryData(selectedKelurahan || null, year || null, selectedMonth || null);
  };

  const handleMonthChange = (e) => {
    const month = e.target.value;
    setSelectedMonth(month);
    presenter.loadSummaryData(selectedKelurahan || null, selectedYear || null, month || null);
  };

  const handleLogout = () => {
    presenter.handleLogout();
  };

  const handleExportExcel = () => {
    if (!summaryData) return;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary Statistics
    const summarySheet = [
      ['REKAPITULASI DATA IBUNDACARE'],
      ['Tanggal Export:', new Date().toLocaleDateString('id-ID')],
      ['Kelurahan:', selectedKelurahan || 'Semua Kelurahan'],
      ['Tahun:', selectedYear || 'Semua Tahun'],
      ['Bulan:', selectedMonth ? getMonthName(selectedMonth) : 'Semua Bulan'],
      [],
      ['STATISTIK UMUM'],
      ['Total Ibu Terdaftar', summaryData.totalIbu || 0],
      ['Ibu Hamil Aktif', summaryData.totalHamil || 0],
      ['Total Kunjungan ANC', summaryData.totalANC || 0],
      ['Total Komplikasi', summaryData.totalKomplikasi || 0],
      [],
      ['STATISTIK KESEHATAN'],
      ['Obesitas (BMI ≥30)', summaryData.obesityStatistics?.obese_count || 0, `${summaryData.obesityStatistics?.obese_percentage || 0}%`],
      ['Preeklamsia', summaryData.preeklamsiaStatistics?.preeklamsia_count || 0],
      ['Eklamsia', summaryData.preeklamsiaStatistics?.eklamsia_count || 0],
      ['Hepatitis B Positif', summaryData.hepatitisStatistics?.hepatitis_b_positive || 0, `${summaryData.hepatitisStatistics?.hepatitis_percentage || 0}%`],
      ['Rata-rata Hb', `${summaryData.hbStatistics?.avg_hb || 0} g/dL`],
      [],
      ['TRIMESTER 1 (0-13 minggu)'],
      ['Normal (≥ 11)', summaryData.hbStatistics?.trimester1_normal || 0],
      ['Anemia Ringan (10.0-10.9)', summaryData.hbStatistics?.trimester1_ringan || 0],
      ['Anemia Sedang (8.0-9.9)', summaryData.hbStatistics?.trimester1_sedang || 0],
      ['Anemia Berat (<7.9)', summaryData.hbStatistics?.trimester1_berat || 0],
      [],
      ['TRIMESTER 2 (14-27 minggu)'],
      ['Normal (≥ 11)', summaryData.hbStatistics?.trimester2_normal || 0],
      ['Anemia Ringan (10.0-10.9)', summaryData.hbStatistics?.trimester2_ringan || 0],
      ['Anemia Sedang (8.0-9.9)', summaryData.hbStatistics?.trimester2_sedang || 0],
      ['Anemia Berat (<7.9)', summaryData.hbStatistics?.trimester2_berat || 0],
      [],
      ['TRIMESTER 3 (28+ minggu)'],
      ['Normal (≥ 11)', summaryData.hbStatistics?.trimester3_normal || 0],
      ['Anemia Ringan (10.0-10.9)', summaryData.hbStatistics?.trimester3_ringan || 0],
      ['Anemia Sedang (8.0-9.9)', summaryData.hbStatistics?.trimester3_sedang || 0],
      ['Anemia Berat (<7.9)', summaryData.hbStatistics?.trimester3_berat || 0],
      [],
      ['Tablet Fe Diberikan', summaryData.feStatistics?.total_fe_given || 0, `${summaryData.feStatistics?.percentage_fe || 0}%`],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summarySheet);
    XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan');

    // Sheet 2: ANC by Type
    if (summaryData.ancByType && summaryData.ancByType.length > 0) {
      const ancData = [
        ['KUNJUNGAN ANC BERDASARKAN JENIS'],
        ['Jenis Kunjungan', 'Jumlah', 'Persentase'],
        ...summaryData.ancByType.map(item => [
          item.jenis_kunjungan,
          item.count,
          `${item.percentage}%`
        ])
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(ancData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Kunjungan ANC');
    }

    // Sheet 3: Complications by Severity
    if (summaryData.complicationsBySeverity && summaryData.complicationsBySeverity.length > 0) {
      const compData = [
        ['KOMPLIKASI BERDASARKAN TINGKAT KEPARAHAN'],
        ['Tingkat Keparahan', 'Jumlah', 'Persentase'],
        ...summaryData.complicationsBySeverity.map(item => [
          item.tingkat_keparahan,
          item.count,
          `${item.percentage}%`
        ])
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(compData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Komplikasi');
    }

    // Sheet 4: Ibu by Kelurahan
    if (summaryData.ibuByKelurahan && summaryData.ibuByKelurahan.length > 0) {
      const kelurahanData = [
        ['IBU BERDASARKAN KELURAHAN'],
        ['Kelurahan', 'Total Ibu', 'Ibu Hamil', 'Persentase'],
        ...summaryData.ibuByKelurahan.map(item => [
          item.kelurahan,
          item.total,
          item.hamil,
          `${item.percentage}%`
        ])
      ];
      const ws4 = XLSX.utils.aoa_to_sheet(kelurahanData);
      XLSX.utils.book_append_sheet(wb, ws4, 'Per Kelurahan');
    }

    // Generate filename
    const kelurahanName = selectedKelurahan ? `_${selectedKelurahan}` : '_Semua';
    const yearName = selectedYear ? `_${selectedYear}` : '';
    const monthName = selectedMonth ? `_${getMonthName(selectedMonth)}` : '';
    const filename = `Rekapitulasi_IBundaCare${kelurahanName}${yearName}${monthName}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  const getMonthName = (month) => {
    const months = {
      '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
      '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
      '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
    };
    return months[month] || month;
  };

  const handleExportCSV = () => {
    if (!summaryData) return;

    // Create CSV content
    let csvContent = 'REKAPITULASI DATA IBUNDACARE\n';
    csvContent += `Tanggal Export:,${new Date().toLocaleDateString('id-ID')}\n`;
    csvContent += `Kelurahan:,${selectedKelurahan || 'Semua Kelurahan'}\n`;
    csvContent += `Tahun:,${selectedYear || 'Semua Tahun'}\n`;
    csvContent += `Bulan:,${selectedMonth ? getMonthName(selectedMonth) : 'Semua Bulan'}\n\n`;
    
    csvContent += 'STATISTIK UMUM\n';
    csvContent += `Total Ibu Terdaftar,${summaryData.totalIbu || 0}\n`;
    csvContent += `Ibu Hamil Aktif,${summaryData.totalHamil || 0}\n`;
    csvContent += `Total Kunjungan ANC,${summaryData.totalANC || 0}\n`;
    csvContent += `Total Komplikasi,${summaryData.totalKomplikasi || 0}\n\n`;
    
    csvContent += 'STATISTIK KESEHATAN\n';
    csvContent += `Obesitas (BMI ≥30),${summaryData.obesityStatistics?.obese_count || 0},${summaryData.obesityStatistics?.obese_percentage || 0}%\n`;
    csvContent += `Preeklamsia,${summaryData.preeklamsiaStatistics?.preeklamsia_count || 0}\n`;
    csvContent += `Eklamsia,${summaryData.preeklamsiaStatistics?.eklamsia_count || 0}\n`;
    csvContent += `Hepatitis B Positif,${summaryData.hepatitisStatistics?.hepatitis_b_positive || 0},${summaryData.hepatitisStatistics?.hepatitis_percentage || 0}%\n`;
    csvContent += `Rata-rata Hb,${summaryData.hbStatistics?.avg_hb || 0} g/dL\n\n`;
    
    csvContent += 'HEMOGLOBIN TRIMESTER 1 (0-13 minggu)\n';
    csvContent += `Normal (≥ 11),${summaryData.hbStatistics?.trimester1_normal || 0}\n`;
    csvContent += `Anemia Ringan (10.0-10.9),${summaryData.hbStatistics?.trimester1_ringan || 0}\n`;
    csvContent += `Anemia Sedang (8.0-9.9),${summaryData.hbStatistics?.trimester1_sedang || 0}\n`;
    csvContent += `Anemia Berat (<7.9),${summaryData.hbStatistics?.trimester1_berat || 0}\n\n`;
    
    csvContent += 'HEMOGLOBIN TRIMESTER 2 (14-27 minggu)\n';
    csvContent += `Normal (≥ 11),${summaryData.hbStatistics?.trimester2_normal || 0}\n`;
    csvContent += `Anemia Ringan (10.0-10.9),${summaryData.hbStatistics?.trimester2_ringan || 0}\n`;
    csvContent += `Anemia Sedang (8.0-9.9),${summaryData.hbStatistics?.trimester2_sedang || 0}\n`;
    csvContent += `Anemia Berat (<7.9),${summaryData.hbStatistics?.trimester2_berat || 0}\n\n`;
    
    csvContent += 'HEMOGLOBIN TRIMESTER 3 (28+ minggu)\n';
    csvContent += `Normal (≥ 11),${summaryData.hbStatistics?.trimester3_normal || 0}\n`;
    csvContent += `Anemia Ringan (10.0-10.9),${summaryData.hbStatistics?.trimester3_ringan || 0}\n`;
    csvContent += `Anemia Sedang (8.0-9.9),${summaryData.hbStatistics?.trimester3_sedang || 0}\n`;
    csvContent += `Anemia Berat (<7.9),${summaryData.hbStatistics?.trimester3_berat || 0}\n\n`;
    
    csvContent += `Tablet Fe Diberikan,${summaryData.feStatistics?.total_fe_given || 0},${summaryData.feStatistics?.percentage_fe || 0}%\n\n`;

    // Add ANC data
    if (summaryData.ancByType && summaryData.ancByType.length > 0) {
      csvContent += 'KUNJUNGAN ANC BERDASARKAN JENIS\n';
      csvContent += 'Jenis Kunjungan,Jumlah,Persentase\n';
      summaryData.ancByType.forEach(item => {
        csvContent += `${item.jenis_kunjungan},${item.count},${item.percentage}%\n`;
      });
      csvContent += '\n';
    }

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const kelurahanName = selectedKelurahan ? `_${selectedKelurahan}` : '_Semua';
    const yearName = selectedYear ? `_${selectedYear}` : '';
    const monthName = selectedMonth ? `_${getMonthName(selectedMonth)}` : '';
    const filename = `Rekapitulasi_IBundaCare${kelurahanName}${yearName}${monthName}_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Memuat data rekapitulasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/images/logo-withText.png" alt="iBundaCare Logo" className="sidebar-logo" />
          <h2>iBundaCare</h2>
        </div>

        <nav className="sidebar-nav">
          <a href="/dashboard" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
            </svg>
            Dashboard
          </a>
          <a href="/data-ibu" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
            </svg>
            Data Ibu
          </a>
          <a href="/kunjungan-anc" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor"/>
            </svg>
            Kunjungan ANC
          </a>
          <a href="/persalinan" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
            Persalinan
          </a>
          <a href="/komplikasi" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" fill="currentColor"/>
            </svg>
            Komplikasi
          </a>
          <a href="/posyandu" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
            </svg>
            Posyandu
          </a>
          <a href="/rekapitulasi" className="nav-item active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="currentColor"/>
            </svg>
            Rekapitulasi
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.nama_lengkap?.charAt(0) || 'U'}
            </div>
            <div className="user-details">
              <p className="user-name">{user?.nama_lengkap || user?.username}</p>
              <p className="user-role">{user?.role}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-header">
          <div style={{
            width: '100%'
          }}>
            <h1>Rekapitulasi</h1>
            <p>
              Laporan dan ringkasan data kesehatan ibu
              {selectedKelurahan && (
                <span className="filter-indicator"> - Kelurahan: <strong>{selectedKelurahan}</strong></span>
              )}
              {selectedYear && (
                <span className="filter-indicator"> - Tahun: <strong>{selectedYear}</strong></span>
              )}
              {selectedMonth && (
                <span className="filter-indicator"> - Bulan: <strong>{getMonthName(selectedMonth)}</strong></span>
              )}
            </p>
          </div>
          <div className="header-actions">
            <div className="filter-section">
              <label htmlFor="year-filter" className="filter-label">Tahun:</label>
              <select 
                id="year-filter"
                className="filter-select"
                value={selectedYear}
                onChange={handleYearChange}
              >
                <option value="">Semua Tahun</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2026">2026</option>
              </select>
            </div>
            <div className="filter-section">
              <label htmlFor="month-filter" className="filter-label">Bulan:</label>
              <select 
                id="month-filter"
                className="filter-select"
                value={selectedMonth}
                onChange={handleMonthChange}
              >
                <option value="">Semua Bulan</option>
                <option value="01">Januari</option>
                <option value="02">Februari</option>
                <option value="03">Maret</option>
                <option value="04">April</option>
                <option value="05">Mei</option>
                <option value="06">Juni</option>
                <option value="07">Juli</option>
                <option value="08">Agustus</option>
                <option value="09">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>
            </div>
            <div className="filter-section">
              <label htmlFor="kelurahan-filter" className="filter-label">Kelurahan:</label>
              <select 
                id="kelurahan-filter"
                className="filter-select"
                value={selectedKelurahan}
                onChange={handleKelurahanChange}
              >
                <option value="">Semua Kelurahan</option>
                {summaryData?.kelurahanList?.map(kelurahan => (
                  <option key={kelurahan} value={kelurahan}>
                    {kelurahan}
                  </option>
                ))}
              </select>
            </div>
            <div className="export-buttons">
              <button className="btn-export excel" onClick={handleExportExcel} title="Export ke Excel">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" fill="currentColor"/>
                  <path d="M9.5 13.5l1.5 2 1.5-2 1.5 2 1.5-2" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                Excel
              </button>
              <button className="btn-export csv" onClick={handleExportCSV} title="Export ke CSV">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" fill="currentColor"/>
                </svg>
                CSV
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <div className="summary-grid">
          {summaryData && (
            <>
              <div className="summary-card">
                <div className="card-icon blue">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>Total Ibu</h3>
                  <p className="card-value">{summaryData.totalIbu || 0}</p>
                  <p className="card-label">Terdaftar</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon green">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>Ibu Hamil</h3>
                  <p className="card-value">{summaryData.totalHamil || 0}</p>
                  <p className="card-label">Aktif</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon purple">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>Kunjungan ANC</h3>
                  <p className="card-value">{summaryData.totalANC || 0}</p>
                  <p className="card-label">Total Kunjungan</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon red">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>Komplikasi</h3>
                  <p className="card-value">{summaryData.totalKomplikasi || 0}</p>
                  <p className="card-label">Kasus Tercatat</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon orange">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 18H6v-2h6v2zm0-4H6v-2h6v2zm0-4H6V8h6v2zm6 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V8h4v2z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>Tablet Fe</h3>
                  <p className="card-value">{summaryData.feStatistics?.total_fe_given || 0}</p>
                  <p className="card-label">{summaryData.feStatistics?.percentage_fe || 0}% dari kunjungan</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon teal">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>Rata-rata Hb</h3>
                  <p className="card-value">{summaryData.hbStatistics?.avg_hb || 0}</p>
                  <p className="card-label">g/dL ({(summaryData.hbStatistics?.total_checked || 0) - ((summaryData.hbStatistics?.trimester1_normal || 0) + (summaryData.hbStatistics?.trimester2_normal || 0) + (summaryData.hbStatistics?.trimester3_normal || 0))} anemia)</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon purple">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>Obesitas (BMI ≥30)</h3>
                  <p className="card-value">{summaryData.obesityStatistics?.obese_count || 0}</p>
                  <p className="card-label">{summaryData.obesityStatistics?.obese_percentage || 0}% dari ibu hamil</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon danger">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>Preeklamsia/Eklamsia</h3>
                  <p className="card-value">{(summaryData.preeklamsiaStatistics?.preeklamsia_count || 0) + (summaryData.preeklamsiaStatistics?.eklamsia_count || 0)}</p>
                  <p className="card-label">
                    {summaryData.preeklamsiaStatistics?.eklamsia_count || 0} eklamsia, 
                    {summaryData.preeklamsiaStatistics?.preeklamsia_count || 0} preeklamsia
                  </p>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon warning">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>Hepatitis B</h3>
                  <p className="card-value">{summaryData.hepatitisStatistics?.hepatitis_b_positive || 0}</p>
                  <p className="card-label">{summaryData.hepatitisStatistics?.hepatitis_percentage || 0}% dari yang diskrining</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="report-section">
          <div className="report-card">
            <h3>Rekapitulasi Kunjungan ANC</h3>
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Jenis Kunjungan</th>
                    <th>Jumlah</th>
                    <th>Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData?.ancByType?.map(item => (
                    <tr key={item.jenis_kunjungan}>
                      <td>{item.jenis_kunjungan}</td>
                      <td>{item.count}</td>
                      <td>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                          <span className="progress-text">{item.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="report-card">
            <h3>Rekapitulasi Komplikasi</h3>
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Tingkat Keparahan</th>
                    <th>Jumlah</th>
                    <th>Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData?.complicationsBySeverity?.map(item => (
                    <tr key={item.tingkat_keparahan}>
                      <td>
                        <span className={`status-badge ${
                          item.tingkat_keparahan === 'Berat' ? 'badge-danger' : 
                          item.tingkat_keparahan === 'Sedang' ? 'badge-warning' : 'badge-success'
                        }`}>
                          {item.tingkat_keparahan}
                        </span>
                      </td>
                      <td>{item.count}</td>
                      <td>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                          <span className="progress-text">{item.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="report-section">
          <div className="report-card">
            <h3>Status Risiko Kehamilan</h3>
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Status Risiko</th>
                    <th>Jumlah</th>
                    <th>Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData?.riskDistribution?.map(item => (
                    <tr key={item.status_risiko_visit}>
                      <td>
                        <span className={`status-badge ${
                          item.status_risiko_visit === 'Risiko Tinggi' ? 'badge-danger' : 'badge-success'
                        }`}>
                          {item.status_risiko_visit}
                        </span>
                      </td>
                      <td>{item.count}</td>
                      <td>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                          <span className="progress-text">{item.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="report-card">
            <h3>Status Imunisasi TT</h3>
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Status TT</th>
                    <th>Jumlah</th>
                    <th>Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData?.ttImmunization?.map(item => (
                    <tr key={item.status_imunisasi_tt}>
                      <td>
                        <span className="status-badge badge-info">
                          {item.status_imunisasi_tt}
                        </span>
                      </td>
                      <td>{item.count}</td>
                      <td>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                          <span className="progress-text">{item.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="report-section">
          <div className="report-card full-width">
            <h3>Kategori Hemoglobin (Hb) Berdasarkan Trimester</h3>
            <div className="hb-category-summary">
              <div className="hb-summary-item">
                <span className="hb-summary-label">Rata-rata Hb:</span>
                <span className="hb-summary-value">{summaryData?.hbStatistics?.avg_hb || 0} g/dL</span>
              </div>
              <div className="hb-summary-item">
                <span className="hb-summary-label">Total Diperiksa:</span>
                <span className="hb-summary-value">{summaryData?.hbStatistics?.total_checked || 0} kunjungan</span>
              </div>
            </div>

            {/* Trimester Grid */}
            <div className="trimester-grid">
              {/* Trimester 1 */}
              <div className="trimester-card">
                <h4 className="trimester-title">Trimester 1 (0-13 minggu)</h4>
                <div className="trimester-total">
                  Total: <strong>{summaryData?.hbStatistics?.trimester1_total || 0}</strong> kunjungan
                </div>
                <div className="table-responsive">
                  <table className="report-table hb-category-table">
                    <thead>
                      <tr>
                        <th>Kategori</th>
                        <th>Rentang Hb</th>
                        <th>Jumlah</th>
                        <th>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="status-badge badge-success">Normal</span></td>
                        <td>≥ 11.0</td>
                        <td>{summaryData?.hbStatistics?.trimester1_normal || 0}</td>
                        <td>{summaryData?.hbStatistics?.trimester1_total > 0 ? Math.round((summaryData?.hbStatistics?.trimester1_normal || 0) * 100 / summaryData?.hbStatistics?.trimester1_total) : 0}%</td>
                      </tr>
                      <tr>
                        <td><span className="status-badge badge-warning-light">Anemia Ringan</span></td>
                        <td>10.0 - 10.9</td>
                        <td>{summaryData?.hbStatistics?.trimester1_ringan || 0}</td>
                        <td>{summaryData?.hbStatistics?.trimester1_total > 0 ? Math.round((summaryData?.hbStatistics?.trimester1_ringan || 0) * 100 / summaryData?.hbStatistics?.trimester1_total) : 0}%</td>
                      </tr>
                      <tr>
                        <td><span className="status-badge badge-warning">Anemia Sedang</span></td>
                        <td>8.0 - 9.9</td>
                        <td>{summaryData?.hbStatistics?.trimester1_sedang || 0}</td>
                        <td>{summaryData?.hbStatistics?.trimester1_total > 0 ? Math.round((summaryData?.hbStatistics?.trimester1_sedang || 0) * 100 / summaryData?.hbStatistics?.trimester1_total) : 0}%</td>
                      </tr>
                      <tr>
                        <td><span className="status-badge badge-danger">Anemia Berat</span></td>
                        <td>&lt; 7.9</td>
                        <td>{summaryData?.hbStatistics?.trimester1_berat || 0}</td>
                        <td>{summaryData?.hbStatistics?.trimester1_total > 0 ? Math.round((summaryData?.hbStatistics?.trimester1_berat || 0) * 100 / summaryData?.hbStatistics?.trimester1_total) : 0}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Trimester 2 */}
              <div className="trimester-card">
                <h4 className="trimester-title">Trimester 2 (14-27 minggu)</h4>
                <div className="trimester-total">
                  Total: <strong>{summaryData?.hbStatistics?.trimester2_total || 0}</strong> kunjungan
                </div>
                <div className="table-responsive">
                  <table className="report-table hb-category-table">
                    <thead>
                      <tr>
                        <th>Kategori</th>
                        <th>Rentang Hb</th>
                        <th>Jumlah</th>
                        <th>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="status-badge badge-success">Normal</span></td>
                        <td>≥ 11.0</td>
                        <td>{summaryData?.hbStatistics?.trimester2_normal || 0}</td>
                        <td>{summaryData?.hbStatistics?.trimester2_total > 0 ? Math.round((summaryData?.hbStatistics?.trimester2_normal || 0) * 100 / summaryData?.hbStatistics?.trimester2_total) : 0}%</td>
                      </tr>
                      <tr>
                        <td><span className="status-badge badge-warning-light">Anemia Ringan</span></td>
                        <td>10.0 - 10.9</td>
                        <td>{summaryData?.hbStatistics?.trimester2_ringan || 0}</td>
                        <td>{summaryData?.hbStatistics?.trimester2_total > 0 ? Math.round((summaryData?.hbStatistics?.trimester2_ringan || 0) * 100 / summaryData?.hbStatistics?.trimester2_total) : 0}%</td>
                      </tr>
                      <tr>
                        <td><span className="status-badge badge-warning">Anemia Sedang</span></td>
                        <td>8.0 - 9.9</td>
                        <td>{summaryData?.hbStatistics?.trimester2_sedang || 0}</td>
                        <td>{summaryData?.hbStatistics?.trimester2_total > 0 ? Math.round((summaryData?.hbStatistics?.trimester2_sedang || 0) * 100 / summaryData?.hbStatistics?.trimester2_total) : 0}%</td>
                      </tr>
                      <tr>
                        <td><span className="status-badge badge-danger">Anemia Berat</span></td>
                        <td>&lt; 7.9</td>
                        <td>{summaryData?.hbStatistics?.trimester2_berat || 0}</td>
                        <td>{summaryData?.hbStatistics?.trimester2_total > 0 ? Math.round((summaryData?.hbStatistics?.trimester2_berat || 0) * 100 / summaryData?.hbStatistics?.trimester2_total) : 0}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Trimester 3 */}
              <div className="trimester-card">
                <h4 className="trimester-title">Trimester 3 (28+ minggu)</h4>
                <div className="trimester-total">
                  Total: <strong>{summaryData?.hbStatistics?.trimester3_total || 0}</strong> kunjungan
                </div>
                <div className="table-responsive">
                  <table className="report-table hb-category-table">
                    <thead>
                      <tr>
                        <th>Kategori</th>
                        <th>Rentang Hb</th>
                        <th>Jumlah</th>
                        <th>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="status-badge badge-success">Normal</span></td>
                        <td>≥ 11.0</td>
                        <td>{summaryData?.hbStatistics?.trimester3_normal || 0}</td>
                        <td>{summaryData?.hbStatistics?.trimester3_total > 0 ? Math.round((summaryData?.hbStatistics?.trimester3_normal || 0) * 100 / summaryData?.hbStatistics?.trimester3_total) : 0}%</td>
                      </tr>
                      <tr>
                        <td><span className="status-badge badge-warning-light">Anemia Ringan</span></td>
                        <td>10.0 - 10.9</td>
                        <td>{summaryData?.hbStatistics?.trimester3_ringan || 0}</td>
                        <td>{summaryData?.hbStatistics?.trimester3_total > 0 ? Math.round((summaryData?.hbStatistics?.trimester3_ringan || 0) * 100 / summaryData?.hbStatistics?.trimester3_total) : 0}%</td>
                      </tr>
                      <tr>
                        <td><span className="status-badge badge-warning">Anemia Sedang</span></td>
                        <td>8.0 - 9.9</td>
                        <td>{summaryData?.hbStatistics?.trimester3_sedang || 0}</td>
                        <td>{summaryData?.hbStatistics?.trimester3_total > 0 ? Math.round((summaryData?.hbStatistics?.trimester3_sedang || 0) * 100 / summaryData?.hbStatistics?.trimester3_total) : 0}%</td>
                      </tr>
                      <tr>
                        <td><span className="status-badge badge-danger">Anemia Berat</span></td>
                        <td>&lt; 7.9</td>
                        <td>{summaryData?.hbStatistics?.trimester3_berat || 0}</td>
                        <td>{summaryData?.hbStatistics?.trimester3_total > 0 ? Math.round((summaryData?.hbStatistics?.trimester3_berat || 0) * 100 / summaryData?.hbStatistics?.trimester3_total) : 0}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="report-section">
          <div className="report-card full-width">
            <h3>Distribusi Ibu per Kelurahan</h3>
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Kelurahan</th>
                    <th>Total Ibu</th>
                    <th>Ibu Hamil</th>
                    <th>Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData?.ibuByKelurahan?.map(item => (
                    <tr key={item.kelurahan}>
                      <td>{item.kelurahan}</td>
                      <td>{item.total}</td>
                      <td>{item.hamil}</td>
                      <td>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                          <span className="progress-text">{item.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Rekapitulasi;
