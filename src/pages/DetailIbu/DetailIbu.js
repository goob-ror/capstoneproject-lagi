import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DetailIbuPresenter from './DetailIbu-presenter';
import './DetailIbu.css';

const DetailIbu = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ibuData, setIbuData] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  const [presenter] = useState(() => new DetailIbuPresenter({
    setLoading,
    setError,
    clearError: () => setError(''),
    displayIbuDetail: (data) => setIbuData(data),
    onLogout: () => navigate('/login')
  }));

  useEffect(() => {
    const userData = presenter.getUser();
    setUser(userData);
    
    if (id) {
      presenter.loadIbuDetail(id);
    }
  }, [presenter, id]);

  const handleLogout = () => {
    presenter.handleLogout();
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} tahun`;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Memuat detail ibu...</p>
        </div>
      </div>
    );
  }

  if (!ibuData) {
    return (
      <div className="dashboard-container">
        <div className="error-container">
          <p>Data tidak ditemukan</p>
          <button onClick={() => navigate('/data-ibu')} className="btn-back">
            Kembali ke Data Ibu
          </button>
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
          <a href="/data-ibu" className="nav-item active">
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
          <a href="/rekapitulasi" className="nav-item">
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
            <h1>Detail Ibu Hamil</h1>
            <p>Informasi lengkap data ibu, kehamilan, ANC, dan komplikasi</p>
          </div>
          <button className="btn-back" onClick={() => navigate('/data-ibu')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
            </svg>
            Kembali
          </button>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <div className="detail-container">
          {/* Header Card with Mother's Basic Info */}
          <div className="header-card">
            <div className="profile-section">
              <div className="profile-avatar">
                {ibuData.ibu.nama_lengkap.charAt(0)}
              </div>
              <div className="profile-info">
                <h2>{ibuData.ibu.nama_lengkap}</h2>
                <p className="nik">NIK: {ibuData.ibu.nik_ibu}</p>
                <div className="quick-stats">
                  <span className="stat-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
                    </svg>
                    {calculateAge(ibuData.ibu.tanggal_lahir)}
                  </span>
                  <span className="stat-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                    </svg>
                    {ibuData.ibu.kelurahan}
                  </span>
                  {ibuData.kehamilan && (
                    <span className="stat-item pregnancy-badge">
                      Gravida {ibuData.kehamilan.gravida}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {ibuData.kehamilan && (
              <div className="pregnancy-status">
                <span className={`status-badge ${ibuData.kehamilan.status_kehamilan === 'Hamil' ? 'badge-success' : 'badge-info'}`}>
                  {ibuData.kehamilan.status_kehamilan}
                </span>
                {ibuData.kehamilan.status_kehamilan === 'Hamil' && (
                  <p className="due-date">
                    Taksiran Persalinan: <strong>{formatDate(ibuData.kehamilan.taksiran_persalinan)}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="tabs-container">
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
                </svg>
                Informasi Dasar
              </button>
              <button 
                className={`tab ${activeTab === 'pregnancy' ? 'active' : ''}`}
                onClick={() => setActiveTab('pregnancy')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" fill="currentColor"/>
                </svg>
                Data Kehamilan
              </button>
              <button 
                className={`tab ${activeTab === 'anc' ? 'active' : ''}`}
                onClick={() => setActiveTab('anc')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor"/>
                </svg>
                Kunjungan ANC ({ibuData.ancVisits?.length || 0})
              </button>
              <button 
                className={`tab ${activeTab === 'complications' ? 'active' : ''}`}
                onClick={() => setActiveTab('complications')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                </svg>
                Komplikasi ({ibuData.complications?.length || 0})
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'info' && (
                <div className="info-grid">
                  <div className="info-card">
                    <h3>Data Pribadi</h3>
                    <div className="info-row">
                      <span className="label">Nama Lengkap:</span>
                      <span className="value">{ibuData.ibu.nama_lengkap}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">NIK:</span>
                      <span className="value">{ibuData.ibu.nik_ibu}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Tanggal Lahir:</span>
                      <span className="value">{formatDate(ibuData.ibu.tanggal_lahir)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Usia:</span>
                      <span className="value">{calculateAge(ibuData.ibu.tanggal_lahir)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">No. HP:</span>
                      <span className="value">{ibuData.ibu.no_hp || '-'}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Golongan Darah:</span>
                      <span className="value">{ibuData.ibu.gol_darah} {ibuData.ibu.rhesus}</span>
                    </div>
                  </div>

                  <div className="info-card">
                    <h3>Data Sosial</h3>
                    <div className="info-row">
                      <span className="label">Pekerjaan:</span>
                      <span className="value">{ibuData.ibu.pekerjaan || '-'}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Pendidikan:</span>
                      <span className="value">{ibuData.ibu.pendidikan || '-'}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Kelurahan:</span>
                      <span className="value">{ibuData.ibu.kelurahan || '-'}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Alamat:</span>
                      <span className="value">{ibuData.ibu.alamat_lengkap || '-'}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Buku KIA:</span>
                      <span className="value">{ibuData.ibu.buku_kia || '-'}</span>
                    </div>
                  </div>

                  {ibuData.suami && (
                    <div className="info-card">
                      <h3>Data Suami</h3>
                      <div className="info-row">
                        <span className="label">Nama:</span>
                        <span className="value">{ibuData.suami.nama_lengkap || '-'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">NIK:</span>
                        <span className="value">{ibuData.suami.nik_suami || '-'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Tanggal Lahir:</span>
                        <span className="value">{formatDate(ibuData.suami.tanggal_lahir)}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">No. HP:</span>
                        <span className="value">{ibuData.suami.no_hp || '-'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Pekerjaan:</span>
                        <span className="value">{ibuData.suami.pekerjaan || '-'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Pendidikan:</span>
                        <span className="value">{ibuData.suami.pendidikan || '-'}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'pregnancy' && ibuData.kehamilan && (
                <div className="info-grid">
                  <div className="info-card">
                    <h3>Informasi Kehamilan</h3>
                    <div className="info-row">
                      <span className="label">Gravida:</span>
                      <span className="value">{ibuData.kehamilan.gravida}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Partus:</span>
                      <span className="value">{ibuData.kehamilan.partus}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Abortus:</span>
                      <span className="value">{ibuData.kehamilan.abortus}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">HPHT:</span>
                      <span className="value">{formatDate(ibuData.kehamilan.haid_terakhir)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Taksiran Persalinan:</span>
                      <span className="value">{formatDate(ibuData.kehamilan.taksiran_persalinan)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Status:</span>
                      <span className={`status-badge ${ibuData.kehamilan.status_kehamilan === 'Hamil' ? 'badge-success' : 'badge-info'}`}>
                        {ibuData.kehamilan.status_kehamilan}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'anc' && (
                <div className="anc-list">
                  {ibuData.ancVisits && ibuData.ancVisits.length > 0 ? (
                    ibuData.ancVisits.map((anc, index) => (
                      <div key={anc.id} className="anc-card">
                        <div className="anc-header">
                          <div>
                            <h4>{anc.jenis_kunjungan} - {anc.jenis_akses}</h4>
                            <p className="anc-date">{formatDate(anc.tanggal_kunjungan)}</p>
                          </div>
                          <span className={`status-badge ${anc.status_risiko_visit === 'Risiko Tinggi' ? 'badge-danger' : 'badge-success'}`}>
                            {anc.status_risiko_visit}
                          </span>
                        </div>
                        <div className="anc-details">
                          <div className="detail-grid">
                            <div className="detail-item">
                              <span className="detail-label">Pemeriksa:</span>
                              <span className="detail-value">{anc.pemeriksa}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Berat Badan:</span>
                              <span className="detail-value">{anc.berat_badan ? `${anc.berat_badan} kg` : '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Tekanan Darah:</span>
                              <span className="detail-value">{anc.tekanan_darah || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">LILA:</span>
                              <span className="detail-value">{anc.lila ? `${anc.lila} cm` : '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Tinggi Fundus:</span>
                              <span className="detail-value">{anc.tinggi_fundus ? `${anc.tinggi_fundus} cm` : '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">DJJ:</span>
                              <span className="detail-value">{anc.denyut_jantung_janin ? `${anc.denyut_jantung_janin} bpm` : '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">HB:</span>
                              <span className="detail-value">{anc.hasil_lab_hb ? `${anc.hasil_lab_hb} g/dL` : '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Protein Urine:</span>
                              <span className="detail-value">{anc.lab_protein_urine || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Imunisasi TT:</span>
                              <span className="detail-value">{anc.status_imunisasi_tt || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Tablet FE:</span>
                              <span className="detail-value">{anc.beri_tablet_fe ? 'Ya' : 'Tidak'}</span>
                            </div>
                          </div>
                          {anc.keterangan_anc && (
                            <div className="anc-notes">
                              <strong>Keterangan:</strong> {anc.keterangan_anc}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" fill="currentColor" opacity="0.3"/>
                      </svg>
                      <p>Belum ada data kunjungan ANC</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'complications' && (
                <div className="complications-list">
                  {ibuData.complications && ibuData.complications.length > 0 ? (
                    ibuData.complications.map((comp, index) => (
                      <div key={comp.id} className="complication-card">
                        <div className="complication-header">
                          <div>
                            <h4>{comp.nama_komplikasi}</h4>
                            {comp.kode_diagnosis && (
                              <span className="diagnosis-code">{comp.kode_diagnosis}</span>
                            )}
                          </div>
                          <div className="badges">
                            <span className={`status-badge ${
                              comp.tingkat_keparahan === 'Berat' ? 'badge-danger' : 
                              comp.tingkat_keparahan === 'Sedang' ? 'badge-warning' : 'badge-success'
                            }`}>
                              {comp.tingkat_keparahan}
                            </span>
                            <span className={`status-badge ${
                              comp.status_penanganan === 'Dirujuk' ? 'badge-info' : 
                              comp.status_penanganan === 'Selesai' ? 'badge-success' : 'badge-warning'
                            }`}>
                              {comp.status_penanganan}
                            </span>
                          </div>
                        </div>
                        <div className="complication-details">
                          <div className="detail-grid">
                            <div className="detail-item">
                              <span className="detail-label">Tanggal Diagnosis:</span>
                              <span className="detail-value">{formatDate(comp.tanggal_diagnosis)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Waktu Kejadian:</span>
                              <span className="detail-value">{comp.waktu_kejadian}</span>
                            </div>
                            {comp.tekanan_darah && (
                              <div className="detail-item">
                                <span className="detail-label">Tekanan Darah:</span>
                                <span className="detail-value">{comp.tekanan_darah}</span>
                              </div>
                            )}
                            {comp.protein_urine && (
                              <div className="detail-item">
                                <span className="detail-label">Protein Urine:</span>
                                <span className="detail-value">{comp.protein_urine}</span>
                              </div>
                            )}
                            {comp.rujuk_rs && (
                              <div className="detail-item">
                                <span className="detail-label">Rujuk RS:</span>
                                <span className="detail-value">Ya</span>
                              </div>
                            )}
                          </div>
                          {comp.gejala_penyerta && (
                            <div className="complication-section">
                              <strong>Gejala Penyerta:</strong>
                              <p>{comp.gejala_penyerta}</p>
                            </div>
                          )}
                          {comp.terapi_diberikan && (
                            <div className="complication-section">
                              <strong>Terapi:</strong>
                              <p>{comp.terapi_diberikan}</p>
                            </div>
                          )}
                          {comp.keterangan && (
                            <div className="complication-section">
                              <strong>Keterangan:</strong>
                              <p>{comp.keterangan}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor" opacity="0.3"/>
                      </svg>
                      <p>Tidak ada komplikasi tercatat</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DetailIbu;
