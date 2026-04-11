import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import RekapitulasiPresenter from './Rekapitulasi-presenter';
import LoadingSplash from '../../components/LoadingSplash/LoadingSplash';
import Sidebar from '../../components/Sidebar/Sidebar';
import './Rekapitulasi.css';

const Rekapitulasi = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedKelurahan, setSelectedKelurahan] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('');
  const [excelLoading, setExcelLoading] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.export-dropdown-container')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

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

  const handleExportExcelTemplate = async (type = 'lengkap') => {
    try {
      setExcelLoading(true);
      setShowExportDropdown(false);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Anda harus login terlebih dahulu');
        setExcelLoading(false);
        return;
      }

      // Validate required parameters
      if (!selectedYear) {
        setError('Silakan pilih tahun terlebih dahulu');
        setExcelLoading(false);
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (selectedKelurahan) params.append('kelurahan_id', selectedKelurahan);
      params.append('year', selectedYear);
      if (selectedMonth && type === 'normal') params.append('month', selectedMonth);

      // Choose endpoint based on type
      const endpoint = type === 'lengkap' 
        ? '/api/excel-report-bulanan/generate'  // New comprehensive template
        : '/api/excel-export/generate';         // Original template

      // Make request to server
      const response = await axios.get(`${endpoint}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob' // Important for file download
      });

      // Create blob and download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const kelurahanName = selectedKelurahan ? `_${selectedKelurahan}` : '_Semua';
      const yearName = selectedYear ? `_${selectedYear}` : '';
      const monthName = selectedMonth && type === 'normal' ? `_${getMonthName(selectedMonth)}` : '';
      const typeLabel = type === 'lengkap' ? '_Komprehensif' : '_Standar';
      const filename = `Laporan_Puskesmas${kelurahanName}${yearName}${monthName}${typeLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setExcelLoading(false);
    } catch (error) {
      setError('Gagal mengekspor file Excel: ' + (error.response?.data?.message || error.message));
      setExcelLoading(false);
    }
  };

  const handleLogout = () => {
    presenter.handleLogout();
  };

  const getMonthName = (month) => {
    const months = {
      '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
      '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
      '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
    };
    return months[month] || month;
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const startYear = 2020; // Starting year for the system
    const years = [];
    
    // Generate years from current year down to start year
    for (let year = currentYear; year >= startYear; year--) {
      years.push(year);
    }
    
    return years;
  };

  const getPreeklamsiaEklamsiaTotal = () => {
    const preeklamsia = Number(summaryData?.preeklamsiaStatistics?.preeklamsia_count || 0);
    const eklamsia = Number(summaryData?.preeklamsiaStatistics?.eklamsia_count || 0);
    return preeklamsia + eklamsia;
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
      {excelLoading && <LoadingSplash message="Menghasilkan file Excel..." />}
      
      <Sidebar user={user} onLogout={handleLogout} />

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
                {getYearOptions().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
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
              <div className="export-dropdown-container">
                <button 
                  className="btn-export" 
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" fill="currentColor"/>
                  </svg>
                  Export Excel
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                  </svg>
                </button>
                {showExportDropdown && (
                  <div className="export-dropdown-menu">
                    <button 
                      className="export-dropdown-item"
                      onClick={() => handleExportExcelTemplate('lengkap')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                      </svg>
                      Laporan Tahunan
                    </button>
                    <button 
                      className="export-dropdown-item"
                      onClick={() => handleExportExcelTemplate('normal')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" fill="currentColor"/>
                      </svg>
                      Laporan Lengkap
                    </button>
                  </div>
                )}
              </div>
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
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>Kunjungan Nifas</h3>
                  <p className="card-value">{summaryData.totalNifas || 0}</p>
                  <p className="card-label">Total Kunjungan</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon orange">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>KEK (LILA &lt; 23.5)</h3>
                  <p className="card-value">{summaryData.kekStatistics?.total_kek_given || 0}</p>
                  <p className="card-label">{summaryData.kekStatistics?.percentage_kek || 0}% dari kunjungan</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="card-icon teal">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>HIV Positif</h3>
                  <p className="card-value">{summaryData.hivStatistics?.hiv_positive || 0}</p>
                  <p className="card-label">{summaryData.hivStatistics?.hiv_percentage || 0}% dari yang diskrining</p>
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
                  <p className="card-value">{getPreeklamsiaEklamsiaTotal()}</p>
                  <p className="card-label">
                    {summaryData?.preeklamsiaStatistics?.eklamsia_count || 0} eklamsia, 
                    {summaryData?.preeklamsiaStatistics?.preeklamsia_count || 0} preeklamsia
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
            <h3>Rekapitulasi Kunjungan Nifas</h3>
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
                  {summaryData?.nifasByType?.map(item => (
                    <tr key={item.jenis_kunjungan}>
                      <td>
                        <span className={`status-badge ${
                          item.jenis_kunjungan === 'KF1' ? 'badge-info' : 
                          item.jenis_kunjungan === 'KF2' ? 'badge-success' : 
                          item.jenis_kunjungan === 'KF3' ? 'badge-warning' : 'badge-primary'
                        }`}>
                          {item.jenis_kunjungan}
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
