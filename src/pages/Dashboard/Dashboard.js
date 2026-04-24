import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import DashboardPresenter from './Dashboard-presenter';
import Sidebar from '../../components/Sidebar/Sidebar';
import apiClient from '../../services/apiClient';
import './Dashboard.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [ibuByKelurahan, setIbuByKelurahan] = useState(null);
  const [ageDistribution, setAgeDistribution] = useState(null);
  const [ancPerMonth, setANCPerMonth] = useState(null);
  const [immunizationCoverage, setImmunizationCoverage] = useState(null);
  const [riskDistribution, setRiskDistribution] = useState(null);
  const [nearingDueDates, setNearingDueDates] = useState(null);
  const [ancSchedule, setANCSchedule] = useState(null);
  const [suamiPerokokKelurahan, setSuamiPerokokKelurahan] = useState(null);
  const [imtDistributionKelurahan, setImtDistributionKelurahan] = useState(null);
  const [atRiskMothers, setAtRiskMothers] = useState(null);
  const [user, setUser] = useState(null);
  const [dueDatePage, setDueDatePage] = useState(1);
  const [ancSchedulePage, setANCSchedulePage] = useState(1);
  const [atRiskPage, setAtRiskPage] = useState(1);
  const [hideDueDateOverdue, setHideDueDateOverdue] = useState(
    () => localStorage.getItem('dashboard_hideDueDateOverdue') === 'true'
  );
  const [hideANCOverdue, setHideANCOverdue] = useState(
    () => localStorage.getItem('dashboard_hideANCOverdue') === 'true'
  );
  // Rekomendasi Aksi state: { [kehamilanId]: { loading, data, error, expanded } }
  const [rekomendasiState, setRekomendasiState] = useState({});
  // Dismissed (auto-archived) mother IDs
  const [dismissedIds, setDismissedIds] = useState([]);
  const rowsPerPage = 20;
  const atRiskRowsPerPage = 5;

  const [presenter] = useState(() => new DashboardPresenter({
    setLoading,
    setError,
    clearError: () => setError(''),
    displayStats: (data) => setStats(data),
    displayIbuByKelurahan: (data) => setIbuByKelurahan(data),
    displayAgeDistribution: (data) => setAgeDistribution(data),
    displayANCPerMonth: (data) => setANCPerMonth(data),
    displayImmunizationCoverage: (data) => setImmunizationCoverage(data),
    displayRiskDistribution: (data) => setRiskDistribution(data),
    displayNearingDueDates: (data) => setNearingDueDates(data),
    displayANCSchedule: (data) => setANCSchedule(data),
    displaySuamiPerokokKelurahan: (data) => setSuamiPerokokKelurahan(data),
    displayImtDistributionKelurahan: (data) => setImtDistributionKelurahan(data),
    displayAtRiskMothers: (data) => setAtRiskMothers(data),
    onLogout: () => navigate('/login')
  }));

  useEffect(() => {
    const userData = presenter.model.getUser();
    setUser(userData);
    
    // Auto-update pregnancy statuses on dashboard load
    const autoUpdateStatuses = async () => {
      try {
        await apiClient.post('/api/dashboard/auto-update-statuses', {});
      } catch (error) {
        // non-critical background task, ignore errors
      }
    };
    
    autoUpdateStatuses();
    presenter.loadDashboardData();
  }, [presenter]);

  const handleLogout = () => {
    presenter.handleLogout();
  };

  const formatDueDate = (daysUntilDue) => {
    if (daysUntilDue < 0) {
      return { text: 'Terlewatkan', color: 'overdue' };
    } else if (daysUntilDue === 0) {
      return { text: '0 Hari', color: 'urgent' };
    } else if (daysUntilDue <= 7) {
      return { text: `${daysUntilDue} Hari`, color: 'urgent' };
    } else if (daysUntilDue <= 30) {
      const weeks = Math.floor(daysUntilDue / 7);
      return { text: `${weeks} Minggu`, color: 'warning' };
    } else {
      const months = Math.floor(daysUntilDue / 30);
      return { text: `${months} Bulan`, color: 'normal' };
    }
  };

  // Pagination helpers
  const getPaginatedData = (data, page, customRowsPerPage = rowsPerPage) => {
    if (!data) return [];
    const startIndex = (page - 1) * customRowsPerPage;
    const endIndex = startIndex + customRowsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => {
    if (!data) return 0;
    return Math.ceil(data.length / rowsPerPage);
  };

  // Filter overdue entries if checkbox is checked
  const filteredDueDates = hideDueDateOverdue 
    ? nearingDueDates?.filter(item => item.days_until_due >= 0)
    : nearingDueDates;

  const filteredANCSchedule = hideANCOverdue
    ? ancSchedule?.filter(item => item.days_until_next_visit >= 0)
    : ancSchedule;

  const paginatedDueDates = getPaginatedData(filteredDueDates, dueDatePage);
  const dueDateTotalPages = getTotalPages(filteredDueDates);

  const paginatedANCSchedule = getPaginatedData(filteredANCSchedule, ancSchedulePage);
  const ancScheduleTotalPages = getTotalPages(filteredANCSchedule);

  // Reset to page 1 when filter changes
  useEffect(() => {
    localStorage.setItem('dashboard_hideDueDateOverdue', hideDueDateOverdue);
    setDueDatePage(1);
  }, [hideDueDateOverdue]);

  useEffect(() => {
    localStorage.setItem('dashboard_hideANCOverdue', hideANCOverdue);
    setANCSchedulePage(1);
  }, [hideANCOverdue]);

  // Fetch and toggle Rekomendasi Aksi for a given mother
  const handleToggleRekomendasi = async (mother) => {
    const id = mother.kehamilan_id;
    const current = rekomendasiState[id];

    // If already loaded, just toggle expanded
    if (current && current.data) {
      setRekomendasiState(prev => ({
        ...prev,
        [id]: { ...prev[id], expanded: !prev[id].expanded }
      }));
      return;
    }

    // Start loading
    setRekomendasiState(prev => ({
      ...prev,
      [id]: { loading: true, data: null, error: null, expanded: true }
    }));

    try {
      const data = await presenter.model.getActionRecommendation(id);
      setRekomendasiState(prev => ({
        ...prev,
        [id]: { loading: false, data, error: null, expanded: true }
      }));
    } catch (err) {
      setRekomendasiState(prev => ({
        ...prev,
        [id]: { loading: false, data: null, error: 'Gagal memuat rekomendasi.', expanded: true }
      }));
    }
  };

  // Dismiss (archive) a mother from the at-risk list
  const handleDismiss = (kehamilanId) => {
    setDismissedIds(prev => [...prev, kehamilanId]);
    setRekomendasiState(prev => {
      const next = { ...prev };
      delete next[kehamilanId];
      return next;
    });
  };

  // Visible at-risk mothers (excluding dismissed)
  const visibleAtRiskMothers = atRiskMothers
    ? atRiskMothers.filter(m => !dismissedIds.includes(m.kehamilan_id))
    : null;

  const rekomendasiTypeConfig = {
    urgent:        { color: 'rekomendasi-urgent',   icon: '🚨', label: 'Segera' },
    action:        { color: 'rekomendasi-action',   icon: '⚡', label: 'Tindakan' },
    monitor:       { color: 'rekomendasi-monitor',  icon: '👁️', label: 'Pantau' },
    overdue_visit: { color: 'rekomendasi-overdue',  icon: '📅', label: 'Kunjungan Terlambat' },
    archive:       { color: 'rekomendasi-archive',  icon: '📦', label: 'Arsipkan' },
    resolved:      { color: 'rekomendasi-resolved', icon: '✅', label: 'Membaik' },
  };

  const ibuByKelurahanChart = ibuByKelurahan ? {
    labels: ibuByKelurahan.map(item => item.kelurahan),
    datasets: [{
      label: 'Jumlah Ibu Hamil',
      data: ibuByKelurahan.map(item => item.count),
      backgroundColor: '#22C55E',
      borderRadius: 6
    }]
  } : null;

  const ageDistributionChart = ageDistribution ? {
    labels: ageDistribution.map(item => item.age_group),
    datasets: [{
      label: 'Jumlah Ibu',
      data: ageDistribution.map(item => item.count),
      backgroundColor: '#3B82F6',
      borderRadius: 6
    }]
  } : null;

  const ancPerMonthChart = ancPerMonth ? (() => {
    const months = [...new Set(ancPerMonth.map(item => item.month))];
    const visitTypes = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6'];
    const colors = ['#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444'];
    
    const datasets = visitTypes.map((type, index) => ({
      label: type,
      data: months.map(month => {
        const found = ancPerMonth.find(item => item.month === month && item.jenis_kunjungan === type);
        return found ? found.count : 0;
      }),
      backgroundColor: colors[index],
      borderRadius: 4
    }));

    return {
      labels: months.map(m => {
        const [year, month] = m.split('-');
        return `${month}/${year.slice(2)}`;
      }),
      datasets
    };
  })() : null;

  const immunizationChart = immunizationCoverage ? {
    labels: immunizationCoverage.map(item => item.kelurahan),
    datasets: [
      {
        label: 'TT (%)',
        data: immunizationCoverage.map(item => item.tt_percentage),
        backgroundColor: '#8B5CF6',
        borderRadius: 4
      },
      {
        label: 'Fe 90 (%)',
        data: immunizationCoverage.map(item => item.fe_percentage),
        backgroundColor: '#EC4899',
        borderRadius: 4
      }
    ]
  } : null;

  const riskDistributionChart = riskDistribution ? {
    labels: riskDistribution.map(item => item.risk_category),
    datasets: [{
      data: riskDistribution.map(item => item.count),
      backgroundColor: ['#22C55E', '#EF4444'],
      borderWidth: 0
    }]
  } : null;

  const suamiPerokokChart = suamiPerokokKelurahan ? {
    labels: suamiPerokokKelurahan.map(item => item.kelurahan),
    datasets: [
      {
        label: 'Perokok',
        data: suamiPerokokKelurahan.map(item => item.perokok_count),
        backgroundColor: '#EF4444',
        borderRadius: 4
      },
      {
        label: 'Non-Perokok',
        data: suamiPerokokKelurahan.map(item => item.non_perokok_count),
        backgroundColor: '#22C55E',
        borderRadius: 4
      }
    ]
  } : null;

  const imtDistributionChart = imtDistributionKelurahan ? {
    labels: imtDistributionKelurahan.map(item => item.kelurahan),
    datasets: [
      {
        label: 'Kurus',
        data: imtDistributionKelurahan.map(item => item.underweight_count),
        backgroundColor: '#3B82F6',
        borderRadius: 4
      },
      {
        label: 'Normal',
        data: imtDistributionKelurahan.map(item => item.normal_count),
        backgroundColor: '#22C55E',
        borderRadius: 4
      },
      {
        label: 'Gemuk',
        data: imtDistributionKelurahan.map(item => item.overweight_count),
        backgroundColor: '#F59E0B',
        borderRadius: 4
      },
      {
        label: 'Obesitas',
        data: imtDistributionKelurahan.map(item => item.obesitas_count),
        backgroundColor: '#EF4444',
        borderRadius: 4
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 8,
          font: {
            family: "'Montserrat', sans-serif",
            size: 10
          },
          boxWidth: 12
        }
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 9 }
        }
      },
      x: {
        ticks: {
          font: { size: 9 }
        }
      }
    }
  };

  const stackedBarOptions = {
    ...barChartOptions,
    scales: {
      ...barChartOptions.scales,
      x: {
        ...barChartOptions.scales.x,
        stacked: true
      },
      y: {
        ...barChartOptions.scales.y,
        stacked: true
      }
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <div className="content-header">
          <div>
            <h1>Dashboard</h1>
            <p>Selamat datang, <strong>{user?.nama_lengkap || user?.username}</strong></p>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {stats && (
          <div className="stats-grid">
            <div className="stat-card stat-success">
              <div className="stat-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                </svg>
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Ibu Hamil</p>
                <h3 className="stat-value">{stats.totalIbuHamil || 0}</h3>
              </div>
            </div>

            <div className="stat-card stat-danger">
              <div className="stat-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/>
                </svg>
              </div>
              <div className="stat-content">
                <p className="stat-label">Ibu Hamil Risiko Tinggi</p>
                <h3 className="stat-value">{stats.ibuHamilRisikoTinggi || 0}</h3>
              </div>
            </div>

            <div className="stat-card stat-primary">
              <div className="stat-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" fill="currentColor"/>
                </svg>
              </div>
              <div className="stat-content">
                <p className="stat-label">Cakupan K1</p>
                <h3 className="stat-value">{stats.cakupanK1 || 0}%</h3>
              </div>
            </div>

            <div className="stat-card stat-warning">
              <div className="stat-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" fill="currentColor"/>
                </svg>
              </div>
              <div className="stat-content">
                <p className="stat-label">Komplikasi Dirujuk RS</p>
                <h3 className="stat-value">{stats.komplikasiDirujuk || 0}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-layout">
          <div className="charts-section">
            {ibuByKelurahanChart && (
              <div className="chart-card">
                <h3 className="chart-title">Jumlah Ibu Hamil per Kelurahan</h3>
                <div className="chart-container-small">
                  <Bar data={ibuByKelurahanChart} options={barChartOptions} />
                </div>
              </div>
            )}

            {ageDistributionChart && (
              <div className="chart-card">
                <h3 className="chart-title">Distribusi Umur Ibu Hamil</h3>
                <div className="chart-container-small">
                  <Bar data={ageDistributionChart} options={barChartOptions} />
                </div>
              </div>
            )}

            {ancPerMonthChart && (
              <div className="chart-card">
                <h3 className="chart-title">Kunjungan ANC per Bulan</h3>
                <div className="chart-container-small">
                  <Bar data={ancPerMonthChart} options={stackedBarOptions} />
                </div>
              </div>
            )}

            {immunizationChart && (
              <div className="chart-card">
                <h3 className="chart-title">Cakupan Imunisasi TT/Fe 90 per Kelurahan</h3>
                <div className="chart-container-small">
                  <Bar data={immunizationChart} options={barChartOptions} />
                </div>
              </div>
            )}

            {suamiPerokokChart && (
              <div className="chart-card">
                <h3 className="chart-title">Status Merokok Suami per Kelurahan</h3>
                <div className="chart-container-small">
                  <Bar data={suamiPerokokChart} options={stackedBarOptions} />
                </div>
              </div>
            )}

            {imtDistributionChart && (
              <div className="chart-card">
                <h3 className="chart-title">Distribusi IMT Ibu per Kelurahan</h3>
                <div className="chart-container-small">
                  <Bar data={imtDistributionChart} options={stackedBarOptions} />
                </div>
              </div>
            )}
          </div>

          <div className="pie-section">
            <div className="chart-card at-risk-card">
              <h3 className="chart-title">Ibu Berisiko - Perlu Perhatian</h3>
              <p className="at-risk-subtitle">Anemia dan/atau KEK (LILA &lt; 24 cm)</p>
              {visibleAtRiskMothers && visibleAtRiskMothers.length > 0 ? (
                <>
                  <div className="at-risk-list">
                    {getPaginatedData(visibleAtRiskMothers, atRiskPage, atRiskRowsPerPage).map((mother, index) => {
                      const rekState = rekomendasiState[mother.kehamilan_id];
                      const isExpanded = rekState?.expanded;
                      return (
                        <div key={mother.id} className={`at-risk-item${rekState?.data?.shouldAutoArchive ? ' at-risk-item-archive' : ''}`}>
                          <div className="at-risk-header">
                            <span className="at-risk-number">{((atRiskPage - 1) * atRiskRowsPerPage) + index + 1}</span>
                            <div className="at-risk-info">
                              {mother.no_hp ? (
                                <a
                                  href={`https://wa.me/${mother.no_hp.replace(/\D/g, '').replace(/^0/, '62')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="at-risk-name-link"
                                >
                                  {mother.nama_lengkap}
                                </a>
                              ) : (
                                <strong>{mother.nama_lengkap}</strong>
                              )}
                              <span className="at-risk-nik">{mother.nik_ibu}</span>
                            </div>
                          </div>
                          <div className="at-risk-details">
                            <div className="at-risk-badges">
                              {mother.status_anemia !== 'Normal' && (
                                <span className={`badge badge-${
                                  mother.status_anemia === 'Anemia Berat' ? 'danger' :
                                  mother.status_anemia === 'Anemia Sedang' ? 'warning' : 'warning-light'
                                }`}>
                                  {mother.status_anemia} (Hb: {mother.hemoglobin} g/dL)
                                </span>
                              )}
                              {mother.status_kek === 'KEK' && (
                                <span className="badge badge-orange">
                                  KEK (LILA: {mother.lila} cm)
                                </span>
                              )}
                            </div>
                            <div className="at-risk-meta">
                              <span>{mother.nama_kelurahan || 'Tidak Diketahui'}</span>
                              <span>•</span>
                              <span>{mother.usia_kehamilan_minggu} minggu</span>
                            </div>
                          </div>

                          {/* Rekomendasi Aksi toggle button */}
                          <button
                            className={`rekomendasi-toggle-btn${isExpanded ? ' active' : ''}`}
                            onClick={() => handleToggleRekomendasi(mother)}
                            aria-expanded={isExpanded}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
                            </svg>
                            Rekomendasi Aksi
                            <svg
                              width="12" height="12" viewBox="0 0 24 24" fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                            >
                              <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                            </svg>
                          </button>

                          {/* Rekomendasi Aksi panel */}
                          {isExpanded && (
                            <div className="rekomendasi-panel">
                              {rekState?.loading && (
                                <div className="rekomendasi-loading">
                                  <div className="rekomendasi-spinner"></div>
                                  <span>Menganalisis data kunjungan...</span>
                                </div>
                              )}
                              {rekState?.error && (
                                <p className="rekomendasi-error">{rekState.error}</p>
                              )}
                              {rekState?.data && (
                                <>
                                  {/* Trend summary */}
                                  <div className="rekomendasi-trend-row">
                                    {rekState.data.latestHb !== null && (
                                      <span className={`trend-chip trend-${rekState.data.hbTrend}`}>
                                        Hb {rekState.data.hbTrend === 'improving' ? '↑' : rekState.data.hbTrend === 'worsening' ? '↓' : '→'} {rekState.data.hbTrend === 'improving' ? 'Membaik' : rekState.data.hbTrend === 'worsening' ? 'Memburuk' : rekState.data.hbTrend === 'stable' ? 'Stabil' : 'Belum cukup data'}
                                      </span>
                                    )}
                                    {rekState.data.latestLila !== null && (
                                      <span className={`trend-chip trend-${rekState.data.lilaTrend}`}>
                                        LILA {rekState.data.lilaTrend === 'improving' ? '↑' : rekState.data.lilaTrend === 'worsening' ? '↓' : '→'} {rekState.data.lilaTrend === 'improving' ? 'Membaik' : rekState.data.lilaTrend === 'worsening' ? 'Memburuk' : rekState.data.lilaTrend === 'stable' ? 'Stabil' : 'Belum cukup data'}
                                      </span>
                                    )}
                                    {rekState.data.daysSinceLastVisit !== null && (
                                      <span className={`trend-chip trend-${rekState.data.isStale ? 'worsening' : 'improving'}`}>
                                        Kunjungan {rekState.data.daysSinceLastVisit}h lalu
                                      </span>
                                    )}
                                  </div>

                                  {/* Recommendation items */}
                                  <div className="rekomendasi-list">
                                    {rekState.data.recommendations.map((rec, i) => {
                                      const cfg = rekomendasiTypeConfig[rec.type] || rekomendasiTypeConfig.monitor;
                                      return (
                                        <div key={i} className={`rekomendasi-item ${cfg.color}`}>
                                          <span className="rekomendasi-icon">{cfg.icon}</span>
                                          <div className="rekomendasi-content">
                                            <span className="rekomendasi-label">{cfg.label}</span>
                                            <p className="rekomendasi-message">{rec.message}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Auto-archive / dismiss button */}
                                  {rekState.data.shouldAutoArchive && (
                                    <button
                                      className="rekomendasi-dismiss-btn"
                                      onClick={() => handleDismiss(mother.kehamilan_id)}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 6H16V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4v2h1l1 14h12l1-14h1V6zM10 4h4v2h-4V4zm6 16H8l-.9-12h9.8L14 20z" fill="currentColor"/>
                                      </svg>
                                      Arsipkan dari daftar ini
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {visibleAtRiskMothers.length > atRiskRowsPerPage && (
                    <div className="pagination">
                      <button 
                        onClick={() => setAtRiskPage(Math.max(1, atRiskPage - 1))}
                        disabled={atRiskPage === 1}
                        className="pagination-btn"
                      >
                        ‹ Sebelumnya
                      </button>
                      <span className="pagination-info">
                        Halaman {atRiskPage} dari {Math.ceil(visibleAtRiskMothers.length / atRiskRowsPerPage)}
                      </span>
                      <button 
                        onClick={() => setAtRiskPage(Math.min(Math.ceil(visibleAtRiskMothers.length / atRiskRowsPerPage), atRiskPage + 1))}
                        disabled={atRiskPage >= Math.ceil(visibleAtRiskMothers.length / atRiskRowsPerPage)}
                        className="pagination-btn"
                      >
                        Selanjutnya ›
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="at-risk-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#22C55E"/>
                  </svg>
                  <p>Tidak ada ibu dengan anemia atau KEK</p>
                </div>
              )}
            </div>

            <div className="chart-card">
              <h3 className="chart-title">Distribusi Risiko Kehamilan</h3>
              {riskDistributionChart && (
                <div className="chart-container-pie">
                  <Pie data={riskDistributionChart} options={chartOptions} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="table-section">
          <div className="table-header">
            <h3 className="table-title">Daftar Ibu Hamil - Taksiran Persalinan (Diurutkan dari Terdekat)</h3>
            <label className="filter-checkbox">
              <input 
                type="checkbox" 
                checked={hideDueDateOverdue}
                onChange={(e) => setHideDueDateOverdue(e.target.checked)}
              />
              <span>Sembunyikan Terlewatkan</span>
            </label>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Ibu</th>
                  <th>Kelurahan</th>
                  <th>No. HP</th>
                  <th>Taksiran Persalinan</th>
                  <th>Sisa Hari</th>
                  <th>Status Risiko</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDueDates && paginatedDueDates.length > 0 ? (
                  paginatedDueDates.map((item, index) => {
                    const dueDateInfo = formatDueDate(item.days_until_due);
                    const actualIndex = (dueDatePage - 1) * rowsPerPage + index + 1;
                    return (
                      <tr key={index}>
                        <td>{actualIndex}</td>
                        <td>{item.nama_lengkap}</td>
                        <td>{item.kelurahan || '-'}</td>
                        <td>{item.no_hp || '-'}</td>
                        <td>{new Date(item.taksiran_persalinan).toLocaleDateString('id-ID')}</td>
                        <td>
                          <span className={`days-badge ${dueDateInfo.color}`}>
                            {dueDateInfo.text}
                          </span>
                        </td>
                        <td>
                          <span className={`risk-badge ${item.status_risiko === 'Risiko Tinggi' ? 'high-risk' : 'normal'}`}>
                            {item.status_risiko}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF' }}>
                      Tidak ada data ibu hamil
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {dueDateTotalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn" 
                onClick={() => setDueDatePage(prev => Math.max(1, prev - 1))}
                disabled={dueDatePage === 1}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
                </svg>
                Sebelumnya
              </button>
              <span className="pagination-info">
                Halaman {dueDatePage} dari {dueDateTotalPages} ({filteredDueDates?.length || 0} data{hideDueDateOverdue ? ' (terlewatkan disembunyikan)' : ''})
              </span>
              <button 
                className="pagination-btn" 
                onClick={() => setDueDatePage(prev => Math.min(dueDateTotalPages, prev + 1))}
                disabled={dueDatePage === dueDateTotalPages}
              >
                Selanjutnya
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="table-section">
          <div className="table-header">
            <h3 className="table-title">Jadwal Kunjungan ANC Berikutnya</h3>
            <label className="filter-checkbox">
              <input 
                type="checkbox" 
                checked={hideANCOverdue}
                onChange={(e) => setHideANCOverdue(e.target.checked)}
              />
              <span>Sembunyikan Terlewatkan</span>
            </label>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Ibu</th>
                  <th>Kelurahan</th>
                  <th>No. HP</th>
                  <th>Usia Kehamilan</th>
                  <th>Kunjungan Terakhir</th>
                  <th>Kunjungan Berikutnya</th>
                  <th>Tanggal Rekomendasi</th>
                  <th>Sisa Hari</th>
                  <th>Status Risiko</th>
                </tr>
              </thead>
              <tbody>
                {paginatedANCSchedule && paginatedANCSchedule.length > 0 ? (
                  paginatedANCSchedule.map((item, index) => {
                    const dueDateInfo = formatDueDate(item.days_until_next_visit);
                    const actualIndex = (ancSchedulePage - 1) * rowsPerPage + index + 1;
                    return (
                      <tr key={index}>
                        <td>{actualIndex}</td>
                        <td>{item.nama_lengkap}</td>
                        <td>{item.kelurahan || '-'}</td>
                        <td>{item.no_hp || '-'}</td>
                        <td>{item.gestational_weeks} minggu</td>
                        <td>
                          <span className="visit-badge">
                            {item.last_visit_type || 'Belum ada'}
                          </span>
                        </td>
                        <td>
                          <span className="visit-badge next-visit">
                            {item.next_visit_type}
                          </span>
                        </td>
                        <td>{item.recommended_visit_date ? new Date(item.recommended_visit_date).toLocaleDateString('id-ID') : '-'}</td>
                        <td>
                          <span className={`days-badge ${dueDateInfo.color}`}>
                            {dueDateInfo.text}
                          </span>
                        </td>
                        <td>
                          <span className={`risk-badge ${item.status_risiko === 'Risiko Tinggi' ? 'high-risk' : 'normal'}`}>
                            {item.status_risiko}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF' }}>
                      Tidak ada jadwal kunjungan ANC
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {ancScheduleTotalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn" 
                onClick={() => setANCSchedulePage(prev => Math.max(1, prev - 1))}
                disabled={ancSchedulePage === 1}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
                </svg>
                Sebelumnya
              </button>
              <span className="pagination-info">
                Halaman {ancSchedulePage} dari {ancScheduleTotalPages} ({filteredANCSchedule?.length || 0} data{hideANCOverdue ? ' (terlewatkan disembunyikan)' : ''})
              </span>
              <button 
                className="pagination-btn" 
                onClick={() => setANCSchedulePage(prev => Math.min(ancScheduleTotalPages, prev + 1))}
                disabled={ancSchedulePage === ancScheduleTotalPages}
              >
                Selanjutnya
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
