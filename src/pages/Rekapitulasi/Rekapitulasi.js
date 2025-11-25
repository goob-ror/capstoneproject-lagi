import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RekapitulasiPresenter from './Rekapitulasi-presenter';
import './Rekapitulasi.css';

const Rekapitulasi = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedKelurahan, setSelectedKelurahan] = useState('');

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
    presenter.loadSummaryData(kelurahan || null);
  };

  const handleLogout = () => {
    presenter.handleLogout();
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
          <a href="/komplikasi" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" fill="currentColor"/>
            </svg>
            Komplikasi
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
          <div>
            <h1>Rekapitulasi</h1>
            <p>
              Laporan dan ringkasan data kesehatan ibu
              {selectedKelurahan && (
                <span className="filter-indicator"> - Kelurahan: <strong>{selectedKelurahan}</strong></span>
              )}
            </p>
          </div>
          <div className="filter-section">
            <label htmlFor="kelurahan-filter" className="filter-label">Filter Kelurahan:</label>
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
                  <p className="card-label">g/dL ({summaryData.hbStatistics?.anemia_count || 0} anemia)</p>
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
            <h3>Statistik Hemoglobin (Hb)</h3>
            <div className="hb-stats-grid">
              <div className="hb-stat-item">
                <div className="hb-stat-label">Rata-rata Hb</div>
                <div className="hb-stat-value">{summaryData?.hbStatistics?.avg_hb || 0} g/dL</div>
              </div>
              <div className="hb-stat-item">
                <div className="hb-stat-label">Hb Minimum</div>
                <div className="hb-stat-value">{summaryData?.hbStatistics?.min_hb || 0} g/dL</div>
              </div>
              <div className="hb-stat-item">
                <div className="hb-stat-label">Hb Maximum</div>
                <div className="hb-stat-value">{summaryData?.hbStatistics?.max_hb || 0} g/dL</div>
              </div>
              <div className="hb-stat-item">
                <div className="hb-stat-label">Kasus Anemia (Hb &lt; 11)</div>
                <div className="hb-stat-value danger">
                  {summaryData?.hbStatistics?.anemia_count || 0} 
                  <span className="hb-stat-percentage">({summaryData?.hbStatistics?.anemia_percentage || 0}%)</span>
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
