import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import DashboardPresenter from './Dashboard-presenter';
import Sidebar from '../../components/Sidebar/Sidebar';
import apiClient from '../../services/apiClient';
import './Dashboard.css';
// Tailwind migration: Dashboard.css kept for badge animations and rekomendasi colors

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
      <div className="min-h-screen bg-[#EAEAEA] font-montserrat flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-[50px] h-[50px] border-4 border-gray-200 border-t-[#22C55E] rounded-full spinner-anim"></div>
          <p className="mt-5 text-gray-500 text-[14px]">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EAEAEA] font-montserrat">
      <Sidebar user={user} onLogout={handleLogout} />

      {/* Main content — offset for sidebar */}
      <main className="lg:ml-[280px] max-lg:ml-[70px] max-[480px]:ml-0 max-[480px]:pt-[70px] p-[25px] max-[768px]:p-[15px] max-[480px]:p-3 box-border min-h-screen">

        {/* Header */}
        <div className="flex justify-between items-center mb-[25px] flex-wrap gap-3">
          <div>
            <h1 className="text-[28px] max-[480px]:text-[22px] font-bold text-[#22C55E] m-0 mb-[5px]">Dashboard</h1>
            <p className="text-[14px] text-gray-500 m-0">
              Selamat datang, <strong>{user?.nama_lengkap || user?.username}</strong>
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg mb-5 text-[13px]">
            {error}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-4 max-[1400px]:grid-cols-2 max-[480px]:grid-cols-1 gap-[15px] mb-[25px]">
            {/* Total Ibu Hamil */}
            <div className="bg-white rounded-[10px] p-[18px] max-[768px]:p-[14px] flex items-center gap-[15px] shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="w-[50px] h-[50px] rounded-[10px] flex items-center justify-center flex-shrink-0 bg-[#DCFCE7] text-[#22C55E]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-gray-500 m-0 mb-1 font-medium">Total Ibu Hamil</p>
                <h3 className="text-[26px] max-[768px]:text-[22px] max-[480px]:text-[20px] font-bold text-gray-900 m-0">{stats.totalIbuHamil || 0}</h3>
              </div>
            </div>

            {/* Risiko Tinggi */}
            <div className="bg-white rounded-[10px] p-[18px] max-[768px]:p-[14px] flex items-center gap-[15px] shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="w-[50px] h-[50px] rounded-[10px] flex items-center justify-center flex-shrink-0 bg-[#FEE2E2] text-[#EF4444]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-gray-500 m-0 mb-1 font-medium">Ibu Hamil Risiko Tinggi</p>
                <h3 className="text-[26px] max-[768px]:text-[22px] max-[480px]:text-[20px] font-bold text-gray-900 m-0">{stats.ibuHamilRisikoTinggi || 0}</h3>
              </div>
            </div>

            {/* Cakupan K1 */}
            <div className="bg-white rounded-[10px] p-[18px] max-[768px]:p-[14px] flex items-center gap-[15px] shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="w-[50px] h-[50px] rounded-[10px] flex items-center justify-center flex-shrink-0 bg-[#DBEAFE] text-[#3B82F6]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" fill="currentColor"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-gray-500 m-0 mb-1 font-medium">Cakupan K1</p>
                <h3 className="text-[26px] max-[768px]:text-[22px] max-[480px]:text-[20px] font-bold text-gray-900 m-0">{stats.cakupanK1 || 0}%</h3>
              </div>
            </div>

            {/* Komplikasi Dirujuk */}
            <div className="bg-white rounded-[10px] p-[18px] max-[768px]:p-[14px] flex items-center gap-[15px] shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="w-[50px] h-[50px] rounded-[10px] flex items-center justify-center flex-shrink-0 bg-[#FEF3C7] text-[#F59E0B]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" fill="currentColor"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-gray-500 m-0 mb-1 font-medium">Komplikasi Dirujuk RS</p>
                <h3 className="text-[26px] max-[768px]:text-[22px] max-[480px]:text-[20px] font-bold text-gray-900 m-0">{stats.komplikasiDirujuk || 0}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Charts + Sidebar panels */}
        <div className="grid grid-cols-[4fr_1fr] max-[1400px]:grid-cols-1 gap-5 mb-[25px]">
          <div className="grid grid-cols-2 max-[1024px]:grid-cols-1 gap-[15px]">
            {ibuByKelurahanChart && (
              <div className="bg-white rounded-[10px] p-4 shadow-sm overflow-hidden">
                <h3 className="text-[14px] font-semibold text-gray-900 m-0 mb-3">Jumlah Ibu Hamil per Kelurahan</h3>
                <div className="h-[200px] max-[768px]:h-[180px] relative">
                  <Bar data={ibuByKelurahanChart} options={barChartOptions} />
                </div>
              </div>
            )}

            {ageDistributionChart && (
              <div className="bg-white rounded-[10px] p-4 shadow-sm overflow-hidden">
                <h3 className="text-[14px] font-semibold text-gray-900 m-0 mb-3">Distribusi Umur Ibu Hamil</h3>
                <div className="h-[200px] max-[768px]:h-[180px] relative">
                  <Bar data={ageDistributionChart} options={barChartOptions} />
                </div>
              </div>
            )}

            {ancPerMonthChart && (
              <div className="bg-white rounded-[10px] p-4 shadow-sm overflow-hidden">
                <h3 className="text-[14px] font-semibold text-gray-900 m-0 mb-3">Kunjungan ANC per Bulan</h3>
                <div className="h-[200px] max-[768px]:h-[180px] relative">
                  <Bar data={ancPerMonthChart} options={stackedBarOptions} />
                </div>
              </div>
            )}

            {immunizationChart && (
              <div className="bg-white rounded-[10px] p-4 shadow-sm overflow-hidden">
                <h3 className="text-[14px] font-semibold text-gray-900 m-0 mb-3">Cakupan Imunisasi TT/Fe 90 per Kelurahan</h3>
                <div className="h-[200px] max-[768px]:h-[180px] relative">
                  <Bar data={immunizationChart} options={barChartOptions} />
                </div>
              </div>
            )}

            {suamiPerokokChart && (
              <div className="bg-white rounded-[10px] p-4 shadow-sm overflow-hidden">
                <h3 className="text-[14px] font-semibold text-gray-900 m-0 mb-3">Status Merokok Suami per Kelurahan</h3>
                <div className="h-[200px] max-[768px]:h-[180px] relative">
                  <Bar data={suamiPerokokChart} options={stackedBarOptions} />
                </div>
              </div>
            )}

            {imtDistributionChart && (
              <div className="bg-white rounded-[10px] p-4 shadow-sm overflow-hidden">
                <h3 className="text-[14px] font-semibold text-gray-900 m-0 mb-3">Distribusi IMT Ibu per Kelurahan</h3>
                <div className="h-[200px] max-[768px]:h-[180px] relative">
                  <Bar data={imtDistributionChart} options={stackedBarOptions} />
                </div>
              </div>
            )}
          </div>

          {/* Right panel: at-risk + pie */}
          <div className="flex flex-col gap-5">
            {/* At-risk mothers card */}
            <div className="bg-white rounded-[10px] p-4 shadow-sm flex flex-col overflow-x-hidden">
              <h3 className="text-[14px] font-semibold text-gray-900 m-0 mb-1">Ibu Berisiko - Perlu Perhatian</h3>
              <p className="text-[12px] text-gray-500 mb-4 mt-0">Anemia dan/atau KEK (LILA &lt; 24 cm)</p>
              {visibleAtRiskMothers && visibleAtRiskMothers.length > 0 ? (
                <>
                  <div className="flex flex-col gap-3 overflow-y-auto overflow-x-hidden max-h-[300px]" style={{scrollbarWidth:'thin',scrollbarColor:'#22C55E #F3F4F6'}}>
                    {getPaginatedData(visibleAtRiskMothers, atRiskPage, atRiskRowsPerPage).map((mother, index) => {
                      const rekState = rekomendasiState[mother.kehamilan_id];
                      const isExpanded = rekState?.expanded;
                      return (
                        <div key={mother.id} className={`p-3 bg-gray-50 rounded-lg${rekState?.data?.shouldAutoArchive ? ' border border-dashed border-gray-300 opacity-85' : ''}`}>
                          <div className="flex items-center gap-[10px] mb-2">
                            <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-[11px] font-bold flex-shrink-0">
                              {((atRiskPage - 1) * atRiskRowsPerPage) + index + 1}
                            </span>
                            <div className="flex flex-col gap-0.5 flex-1">
                              {mother.no_hp ? (
                                <a href={`https://wa.me/${mother.no_hp.replace(/\D/g, '').replace(/^0/, '62')}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="text-[13px] font-semibold text-[#16A34A] no-underline hover:underline hover:text-[#15803D]">
                                  {mother.nama_lengkap}
                                </a>
                              ) : (
                                <strong className="text-[13px] text-gray-900 font-semibold">{mother.nama_lengkap}</strong>
                              )}
                              <span className="text-[11px] text-gray-500">{mother.nik_ibu}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 ml-[34px]">
                            <div className="flex flex-wrap gap-1.5">
                              {mother.status_anemia !== 'Normal' && (
                                <span className={`px-2 py-0.5 rounded-xl text-[10px] font-semibold uppercase tracking-wide ${
                                  mother.status_anemia === 'Anemia Berat' ? 'bg-red-100 text-red-800' :
                                  mother.status_anemia === 'Anemia Sedang' ? 'bg-amber-100 text-amber-800' : 'bg-yellow-50 text-yellow-800'
                                }`}>
                                  {mother.status_anemia} (Hb: {mother.hemoglobin} g/dL)
                                </span>
                              )}
                              {mother.status_kek === 'KEK' && (
                                <span className="px-2 py-0.5 rounded-xl text-[10px] font-semibold uppercase tracking-wide bg-orange-100 text-orange-800">
                                  KEK (LILA: {mother.lila} cm)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                              <span>{mother.nama_kelurahan || 'Tidak Diketahui'}</span>
                              <span>•</span>
                              <span>{mother.usia_kehamilan_minggu} minggu</span>
                            </div>
                          </div>
                          <button
                            className={`flex items-center gap-[5px] mt-2 ml-[34px] px-[10px] py-1 bg-transparent border border-gray-300 rounded-md text-[11px] font-semibold text-gray-500 cursor-pointer font-montserrat transition-all duration-200 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700${isExpanded ? ' bg-blue-50 border-blue-400 text-blue-700' : ''}`}
                            onClick={() => handleToggleRekomendasi(mother)}
                            aria-expanded={isExpanded}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/></svg>
                            Rekomendasi Aksi
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                              <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                            </svg>
                          </button>
                          {isExpanded && (
                            <div className="mt-[10px] ml-[34px] p-[10px] bg-slate-50 border border-slate-200 rounded-lg">
                              {rekState?.loading && (
                                <div className="flex items-center gap-2 text-[11px] text-gray-500 py-1.5">
                                  <div className="w-[14px] h-[14px] border-2 border-gray-200 border-t-blue-500 rounded-full flex-shrink-0 rekomendasi-spinner-anim"></div>
                                  <span>Menganalisis data kunjungan...</span>
                                </div>
                              )}
                              {rekState?.error && <p className="text-[11px] text-red-600 m-0">{rekState.error}</p>}
                              {rekState?.data && (
                                <>
                                  <div className="flex flex-wrap gap-[5px] mb-2">
                                    {rekState.data.latestHb !== null && (
                                      <span className={`px-2 py-0.5 rounded-[10px] text-[10px] font-semibold trend-chip trend-${rekState.data.hbTrend}`}>
                                        Hb {rekState.data.hbTrend === 'improving' ? '↑' : rekState.data.hbTrend === 'worsening' ? '↓' : '→'} {rekState.data.hbTrend === 'improving' ? 'Membaik' : rekState.data.hbTrend === 'worsening' ? 'Memburuk' : rekState.data.hbTrend === 'stable' ? 'Stabil' : 'Belum cukup data'}
                                      </span>
                                    )}
                                    {rekState.data.latestLila !== null && (
                                      <span className={`px-2 py-0.5 rounded-[10px] text-[10px] font-semibold trend-chip trend-${rekState.data.lilaTrend}`}>
                                        LILA {rekState.data.lilaTrend === 'improving' ? '↑' : rekState.data.lilaTrend === 'worsening' ? '↓' : '→'} {rekState.data.lilaTrend === 'improving' ? 'Membaik' : rekState.data.lilaTrend === 'worsening' ? 'Memburuk' : rekState.data.lilaTrend === 'stable' ? 'Stabil' : 'Belum cukup data'}
                                      </span>
                                    )}
                                    {rekState.data.daysSinceLastVisit !== null && (
                                      <span className={`px-2 py-0.5 rounded-[10px] text-[10px] font-semibold trend-chip trend-${rekState.data.isStale ? 'worsening' : 'improving'}`}>
                                        Kunjungan {rekState.data.daysSinceLastVisit}h lalu
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    {rekState.data.recommendations.map((rec, i) => {
                                      const cfg = rekomendasiTypeConfig[rec.type] || rekomendasiTypeConfig.monitor;
                                      return (
                                        <div key={i} className={`flex items-start gap-2 px-[10px] py-2 rounded-md rekomendasi-item ${cfg.color}`}>
                                          <span className="text-[13px] flex-shrink-0 leading-[1.4]">{cfg.icon}</span>
                                          <div className="flex flex-col gap-0.5 flex-1">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.5px] opacity-70">{cfg.label}</span>
                                            <p className="text-[11px] leading-[1.5] m-0">{rec.message}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {rekState.data.shouldAutoArchive && (
                                    <button
                                      className="flex items-center justify-center gap-1.5 mt-[10px] px-3 py-[5px] bg-gray-100 border border-gray-300 rounded-md text-[11px] font-semibold text-gray-500 cursor-pointer font-montserrat w-full transition-all duration-200 hover:bg-red-100 hover:border-red-300 hover:text-red-600"
                                      onClick={() => handleDismiss(mother.kehamilan_id)}
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6H16V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4v2h1l1 14h12l1-14h1V6zM10 4h4v2h-4V4zm6 16H8l-.9-12h9.8L14 20z" fill="currentColor"/></svg>
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
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                      <button onClick={() => setAtRiskPage(Math.max(1, atRiskPage - 1))} disabled={atRiskPage === 1}
                        className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md text-[12px] font-medium text-gray-700 cursor-pointer font-montserrat transition-all duration-200 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                        ‹ Sebelumnya
                      </button>
                      <span className="text-[12px] text-gray-500 font-medium">
                        Halaman {atRiskPage} dari {Math.ceil(visibleAtRiskMothers.length / atRiskRowsPerPage)}
                      </span>
                      <button onClick={() => setAtRiskPage(Math.min(Math.ceil(visibleAtRiskMothers.length / atRiskRowsPerPage), atRiskPage + 1))}
                        disabled={atRiskPage >= Math.ceil(visibleAtRiskMothers.length / atRiskRowsPerPage)}
                        className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md text-[12px] font-medium text-gray-700 cursor-pointer font-montserrat transition-all duration-200 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                        Selanjutnya ›
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-5 text-center text-gray-400">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mb-3"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#22C55E"/></svg>
                  <p className="m-0 text-[13px]">Tidak ada ibu dengan anemia atau KEK</p>
                </div>
              )}
            </div>

            {/* Risk distribution pie */}
            <div className="bg-white rounded-[10px] p-4 shadow-sm">
              <h3 className="text-[14px] font-semibold text-gray-900 m-0 mb-3">Distribusi Risiko Kehamilan</h3>
              {riskDistributionChart && (
                <div className="h-[420px] max-[1400px]:h-[350px] relative">
                  <Pie data={riskDistributionChart} options={chartOptions} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Due dates table */}
        <div className="bg-white rounded-[10px] p-5 shadow-sm mt-[5px] mb-5">
          <div className="flex justify-between items-center mb-[15px] flex-wrap gap-3 max-[768px]:flex-col max-[768px]:items-start">
            <h3 className="text-[16px] font-semibold text-gray-900 m-0 pb-[10px] border-b-2 border-[#22C55E]">
              Daftar Ibu Hamil - Taksiran Persalinan (Diurutkan dari Terdekat)
            </h3>
            <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-2 bg-gray-50 border border-gray-200 rounded-md transition-all duration-200 hover:bg-gray-100 max-[768px]:w-full max-[768px]:justify-center">
              <input type="checkbox" checked={hideDueDateOverdue} onChange={(e) => setHideDueDateOverdue(e.target.checked)} className="w-4 h-4 cursor-pointer accent-[#22C55E]" />
              <span className={`text-[13px] font-medium ${hideDueDateOverdue ? 'text-[#22C55E] font-semibold' : 'text-gray-700'}`}>Sembunyikan Terlewatkan</span>
            </label>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse text-[13px] max-[768px]:text-[11px]">
              <thead className="bg-gradient-to-b from-gray-50 to-gray-100">
                <tr>
                  {['No','Nama Ibu','Kelurahan','No. HP','Taksiran Persalinan','Sisa Hari','Status Risiko'].map(h => (
                    <th key={h} className="px-[14px] py-3 max-[768px]:px-2 text-left font-semibold text-gray-700 border-b-2 border-gray-200 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedDueDates && paginatedDueDates.length > 0 ? (
                  paginatedDueDates.map((item, index) => {
                    const dueDateInfo = formatDueDate(item.days_until_due);
                    const actualIndex = (dueDatePage - 1) * rowsPerPage + index + 1;
                    return (
                      <tr key={index} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-[14px] py-3 max-[768px]:px-2 text-gray-500">{actualIndex}</td>
                        <td className="px-[14px] py-3 max-[768px]:px-2 text-gray-500">{item.nama_lengkap}</td>
                        <td className="px-[14px] py-3 max-[768px]:px-2 text-gray-500">{item.kelurahan || '-'}</td>
                        <td className="px-[14px] py-3 max-[768px]:px-2 text-gray-500">{item.no_hp || '-'}</td>
                        <td className="px-[14px] py-3 max-[768px]:px-2 text-gray-500">{new Date(item.taksiran_persalinan).toLocaleDateString('id-ID')}</td>
                        <td className="px-[14px] py-3 max-[768px]:px-2">
                          <span className={`days-badge inline-block px-3 py-[5px] rounded-[14px] text-[12px] font-semibold whitespace-nowrap ${dueDateInfo.color}${dueDateInfo.color === 'urgent' ? ' days-badge-urgent' : ''}`}>{dueDateInfo.text}</span>
                        </td>
                        <td className="px-[14px] py-3 max-[768px]:px-2">
                          <span className={`inline-block px-3 py-[5px] rounded-[14px] text-[12px] font-semibold ${item.status_risiko === 'Risiko Tinggi' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-green-100 text-green-700 border border-green-300'}`}>{item.status_risiko}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="7" className="text-center py-5 text-gray-400">Tidak ada data ibu hamil</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {dueDateTotalPages > 1 && (
            <div className="flex justify-between items-center px-5 py-[15px] bg-gray-50 border-t border-gray-200 rounded-b-xl -mx-5 -mb-5 mt-0 max-[768px]:flex-col max-[768px]:gap-3">
              <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-md text-gray-700 text-[13px] font-medium cursor-pointer font-montserrat transition-all duration-200 hover:bg-[#22C55E] hover:border-[#22C55E] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed max-[768px]:w-full max-[768px]:justify-center"
                onClick={() => setDueDatePage(prev => Math.max(1, prev - 1))} disabled={dueDatePage === 1}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/></svg>
                Sebelumnya
              </button>
              <span className="text-[13px] text-gray-500 font-medium max-[768px]:order-first max-[768px]:text-center">
                Halaman {dueDatePage} dari {dueDateTotalPages} ({filteredDueDates?.length || 0} data{hideDueDateOverdue ? ' (terlewatkan disembunyikan)' : ''})
              </span>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-md text-gray-700 text-[13px] font-medium cursor-pointer font-montserrat transition-all duration-200 hover:bg-[#22C55E] hover:border-[#22C55E] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed max-[768px]:w-full max-[768px]:justify-center"
                onClick={() => setDueDatePage(prev => Math.min(dueDateTotalPages, prev + 1))} disabled={dueDatePage === dueDateTotalPages}>
                Selanjutnya
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/></svg>
              </button>
            </div>
          )}
        </div>

        {/* ANC schedule table */}
        <div className="bg-white rounded-[10px] p-5 shadow-sm mb-5">
          <div className="flex justify-between items-center mb-[15px] flex-wrap gap-3 max-[768px]:flex-col max-[768px]:items-start">
            <h3 className="text-[16px] font-semibold text-gray-900 m-0 pb-[10px] border-b-2 border-[#22C55E]">
              Jadwal Kunjungan ANC Berikutnya
            </h3>
            <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-2 bg-gray-50 border border-gray-200 rounded-md transition-all duration-200 hover:bg-gray-100 max-[768px]:w-full max-[768px]:justify-center">
              <input type="checkbox" checked={hideANCOverdue} onChange={(e) => setHideANCOverdue(e.target.checked)} className="w-4 h-4 cursor-pointer accent-[#22C55E]" />
              <span className={`text-[13px] font-medium ${hideANCOverdue ? 'text-[#22C55E] font-semibold' : 'text-gray-700'}`}>Sembunyikan Terlewatkan</span>
            </label>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse text-[13px] max-[768px]:text-[11px]">
              <thead className="bg-gradient-to-b from-gray-50 to-gray-100">
                <tr>
                  {['No','Nama Ibu','Kelurahan','No. HP','Usia Kehamilan','Kunjungan Terakhir','Kunjungan Berikutnya','Tanggal Rekomendasi','Sisa Hari','Status Risiko'].map(h => (
                    <th key={h} className="px-[14px] py-3 max-[768px]:px-2 text-left font-semibold text-gray-700 border-b-2 border-gray-200 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedANCSchedule && paginatedANCSchedule.length > 0 ? (
                  paginatedANCSchedule.map((item, index) => {
                    const dueDateInfo = formatDueDate(item.days_until_next_visit);
                    const actualIndex = (ancSchedulePage - 1) * rowsPerPage + index + 1;
                    return (
                      <tr key={index} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-[14px] py-3 max-[768px]:px-2 text-gray-500">{actualIndex}</td>
                        <td className="px-[14px] py-3 max-[768px]:px-2 text-gray-500">{item.nama_lengkap}</td>
                        <td className="px-[14px] py-3 max-[768px]:px-2 text-gray-500">{item.kelurahan || '-'}</td>
                        <td className="px-[14px] py-3 max-[768px]:px-2 text-gray-500">{item.no_hp || '-'}</td>
                        <td className="px-[14px] py-3 max-[768px]:px-2 text-gray-500">{item.gestational_weeks} minggu</td>
                        <td className="px-[14px] py-3 max-[768px]:px-2">
                          <span className="inline-block px-[10px] py-1 bg-indigo-100 text-indigo-800 text-[12px] font-semibold rounded-md text-center">{item.last_visit_type || 'Belum ada'}</span>
                        </td>
                        <td className="px-[14px] py-3 max-[768px]:px-2">
                          <span className="inline-block px-[10px] py-1 bg-blue-100 text-blue-800 text-[12px] font-semibold rounded-md text-center">{item.next_visit_type}</span>
                        </td>
                        <td className="px-[14px] py-3 max-[768px]:px-2 text-gray-500">{item.recommended_visit_date ? new Date(item.recommended_visit_date).toLocaleDateString('id-ID') : '-'}</td>
                        <td className="px-[14px] py-3 max-[768px]:px-2">
                          <span className={`days-badge inline-block px-3 py-[5px] rounded-[14px] text-[12px] font-semibold whitespace-nowrap ${dueDateInfo.color}${dueDateInfo.color === 'urgent' ? ' days-badge-urgent' : ''}`}>{dueDateInfo.text}</span>
                        </td>
                        <td className="px-[14px] py-3 max-[768px]:px-2">
                          <span className={`inline-block px-3 py-[5px] rounded-[14px] text-[12px] font-semibold ${item.status_risiko === 'Risiko Tinggi' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-green-100 text-green-700 border border-green-300'}`}>{item.status_risiko}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="10" className="text-center py-5 text-gray-400">Tidak ada jadwal kunjungan ANC</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {ancScheduleTotalPages > 1 && (
            <div className="flex justify-between items-center px-5 py-[15px] bg-gray-50 border-t border-gray-200 rounded-b-xl -mx-5 -mb-5 mt-0 max-[768px]:flex-col max-[768px]:gap-3">
              <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-md text-gray-700 text-[13px] font-medium cursor-pointer font-montserrat transition-all duration-200 hover:bg-[#22C55E] hover:border-[#22C55E] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed max-[768px]:w-full max-[768px]:justify-center"
                onClick={() => setANCSchedulePage(prev => Math.max(1, prev - 1))} disabled={ancSchedulePage === 1}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/></svg>
                Sebelumnya
              </button>
              <span className="text-[13px] text-gray-500 font-medium max-[768px]:order-first max-[768px]:text-center">
                Halaman {ancSchedulePage} dari {ancScheduleTotalPages} ({filteredANCSchedule?.length || 0} data{hideANCOverdue ? ' (terlewatkan disembunyikan)' : ''})
              </span>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-md text-gray-700 text-[13px] font-medium cursor-pointer font-montserrat transition-all duration-200 hover:bg-[#22C55E] hover:border-[#22C55E] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed max-[768px]:w-full max-[768px]:justify-center"
                onClick={() => setANCSchedulePage(prev => Math.min(ancScheduleTotalPages, prev + 1))} disabled={ancSchedulePage === ancScheduleTotalPages}>
                Selanjutnya
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/></svg>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
