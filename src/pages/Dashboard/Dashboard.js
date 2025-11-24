import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import DashboardPresenter from './Dashboard-presenter';
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
  const [user, setUser] = useState(null);

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
    onLogout: () => navigate('/login')
  }));

  useEffect(() => {
    const userData = presenter.model.getUser();
    setUser(userData);
    presenter.loadDashboardData();
  }, [presenter]);

  const handleLogout = () => {
    presenter.handleLogout();
  };

  const handleRefresh = () => {
    presenter.handleRefresh();
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
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/images/logo-withText.png" alt="iBundaCare Logo" className="sidebar-logo" />
          <h2>iBundaCare</h2>
        </div>

        <nav className="sidebar-nav">
          <a href="/dashboard" className="nav-item active">
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
            <h1>Dashboard</h1>
            <p>Selamat datang, <strong>{user?.nama_lengkap || user?.username}</strong></p>
          </div>
          <button className="refresh-btn" onClick={handleRefresh}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
            </svg>
            Refresh
          </button>
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
          </div>

          <div className="pie-section">
            {riskDistributionChart && (
              <div className="chart-card">
                <h3 className="chart-title">Distribusi Risiko Kehamilan</h3>
                <div className="chart-container-pie">
                  <Pie data={riskDistributionChart} options={chartOptions} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="table-section">
          <h3 className="table-title">Daftar Ibu Hamil - Taksiran Persalinan (Diurutkan dari Terdekat)</h3>
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
                {nearingDueDates && nearingDueDates.length > 0 ? (
                  nearingDueDates.map((item, index) => {
                    const dueDateInfo = formatDueDate(item.days_until_due);
                    return (
                      <tr key={index}>
                        <td>{index + 1}</td>
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
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
