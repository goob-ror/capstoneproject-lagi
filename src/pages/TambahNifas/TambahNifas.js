import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Select from 'react-select';
import TambahNifasPresenter from './TambahNifas-presenter';
import './TambahNifas.css';

const TambahNifas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const isEdit = Boolean(editId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deliveredMothers, setDeliveredMothers] = useState([]);
  const [user, setUser] = useState(null);
  const [motherData, setMotherData] = useState(null);
  const [activeTab, setActiveTab] = useState('kunjungan-nifas');

  const [formData, setFormData] = useState({
    tanggal_kunjungan: '',
    jenis_kunjungan: 'KF1',
    pemeriksa: 'Bidan',
    tekanan_darah: '',
    suhu_badan: '',
    involusio_uteri: 'Baik',
    lochea: 'Rubra',
    payudara: 'Normal',
    konseling_asi: false,
    berat_badan_bayi: '',
    suhu_bayi: '',
    pemberian_asi: 'ASI Eksklusif',
    keterangan: '',
    forkey_hamil: '',
    forkey_bidan: ''
  });

  // Complications form data
  const [complications, setComplications] = useState([{
    nama_komplikasi: '',
    kejadian: 'Saat Nifas',
    tanggal_diagnosis: '',
    rujuk_rs: false,
    nama_rs: '',
    tanggal_rujukan: '',
    tekanan_darah: '',
    protein_urine: '',
    gejala_penyerta: '',
    terapi_diberikan: '',
    tingkat_keparahan: 'Ringan',
    status_penanganan: 'Ditangani',
    keterangan: ''
  }]);

  const [presenter] = useState(() => new TambahNifasPresenter({
    setLoading,
    setError,
    clearError: () => setError(''),
    setDeliveredMothers,
    setMotherData,
    populateForm: (data) => {
      setFormData({
        tanggal_kunjungan: data.tanggal_kunjungan ? data.tanggal_kunjungan.split('T')[0] : '',
        jenis_kunjungan: data.jenis_kunjungan || 'KF1',
        pemeriksa: data.pemeriksa || 'Bidan',
        tekanan_darah: data.tekanan_darah || '',
        suhu_badan: data.suhu_badan || '',
        involusio_uteri: data.involusio_uteri || 'Baik',
        lochea: data.lochea || 'Rubra',
        payudara: data.payudara || 'Normal',
        konseling_asi: data.konseling_asi || false,
        berat_badan_bayi: data.berat_badan_bayi || '',
        suhu_bayi: data.suhu_bayi || '',
        pemberian_asi: data.pemberian_asi || 'ASI Eksklusif',
        keterangan: data.keterangan || '',
        forkey_hamil: data.forkey_hamil || '',
        forkey_bidan: data.forkey_bidan || ''
      });
    },
    onSuccess: (message) => {
      alert(message);
      navigate('/kunjungan-nifas');
    },
    onLogout: () => navigate('/login')
  }));

  useEffect(() => {
    const userData = presenter.getUser();
    setUser(userData);
    
    if (userData) {
      setFormData(prev => ({ ...prev, forkey_bidan: userData.id }));
    }

    presenter.loadDeliveredMothers();

    if (isEdit && editId) {
      presenter.loadNifasData(editId);
    }
  }, [presenter, isEdit, editId]);

  // Load mother data when pregnancy is selected
  useEffect(() => {
    if (formData.forkey_hamil) {
      presenter.loadMotherData(formData.forkey_hamil);
    } else {
      setMotherData(null);
    }
  }, [formData.forkey_hamil, presenter]);

  // Complications handling functions
  const addComplication = () => {
    setComplications([...complications, {
      nama_komplikasi: '',
      kejadian: 'Saat Bersalin',
      tanggal_diagnosis: formData.tanggal_persalinan || '',
      rujuk_rs: false,
      nama_rs: '',
      tanggal_rujukan: '',
      tekanan_darah: '',
      protein_urine: '',
      gejala_penyerta: '',
      terapi_diberikan: '',
      tingkat_keparahan: 'Ringan',
      status_penanganan: 'Ditangani',
      keterangan: ''
    }]);
  };

  const removeComplication = (index) => {
    if (complications.length > 1) {
      setComplications(complications.filter((_, i) => i !== index));
    }
  };

  const updateComplication = (index, field, value) => {
    const updated = [...complications];
    updated[index] = { ...updated[index], [field]: value };
    setComplications(updated);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Check if we have complications to submit
    const hasComplications = activeTab === 'komplikasi' && complications.some(comp => 
      comp.nama_komplikasi.trim() !== ''
    );

    const validComplications = hasComplications ? complications.filter(comp => comp.nama_komplikasi.trim() !== '') : [];
    
    await presenter.handleSubmit(formData, validComplications, isEdit, editId);
  };

  const handleLogout = () => {
    presenter.handleLogout();
  };

  // Prepare options for react-select
  const motherOptions = deliveredMothers.map(mother => ({
    value: mother.id,
    label: `${mother.nama_ibu} (NIK: ${mother.nik_ibu}) - Persalinan: ${new Date(mother.tanggal_persalinan).toLocaleDateString('id-ID')}`
  }));

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      padding: '2px 6px',
      border: '2px solid #E5E7EB',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: "'Montserrat', sans-serif",
      borderColor: state.isFocused ? '#22C55E' : '#E5E7EB',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(34, 197, 94, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#22C55E'
      }
    }),
    menu: (base) => ({
      ...base,
      zIndex: 100
    })
  };

  if (loading && isEdit) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Memuat data...</p>
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
          <a href="/kunjungan-nifas" className="nav-item active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/>
            </svg>
            Kunjungan Nifas
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
          <a href="/rekapitulasi" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="currentColor"/>
            </svg>
            Rekapitulasi
          </a>
          <a href="/user-management" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/>
            </svg>
            Manajemen User
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
            <h1>{isEdit ? 'Edit' : 'Tambah'} Kunjungan Nifas</h1>
            <p>Lengkapi form data kunjungan masa nifas</p>
          </div>
          <button className="btn-back" onClick={() => navigate('/kunjungan-nifas')}>
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

        <div className="form-tabs-container" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
          <button
            type="button"
            className={`form-tab-button ${activeTab === 'kunjungan-nifas' ? 'active' : ''}`}
            onClick={() => setActiveTab('kunjungan-nifas')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
            Data Kunjungan
          </button>
          <button
            type="button"
            className={`form-tab-button ${activeTab === 'komplikasi' ? 'active' : ''}`}
            onClick={() => setActiveTab('komplikasi')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
            </svg>
            Komplikasi
          </button>
        </div>

        <form onSubmit={handleSubmit} className="nifas-form">
          {activeTab === `kunjungan-nifas` && (
            <>
              <div className="form-section">
                <h3>Informasi Dasar</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="forkey_hamil">Pilih Ibu Nifas *</label>
                    <Select
                      id="forkey_hamil"
                      name="forkey_hamil"
                      value={motherOptions.find(opt => opt.value === formData.forkey_hamil) || null}
                      onChange={(selectedOption) => setFormData(prev => ({ ...prev, forkey_hamil: selectedOption ? selectedOption.value : '' }))}
                      options={motherOptions}
                      placeholder="-- Cari Ibu Nifas --"
                      isClearable
                      isSearchable
                      isDisabled={isEdit}
                      styles={customSelectStyles}
                      noOptionsMessage={() => "Tidak ada ibu nifas yang tersedia"}
                    />
                    <small style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      Hanya menampilkan ibu yang sudah melahirkan
                    </small>
                  </div>

                  {motherData && (
                    <div className="mother-info-card">
                      <h4>Informasi Ibu</h4>
                      <div className="mother-info-grid">
                        <div className="mother-info-item">
                          <span className="mother-info-label">Nama:</span>
                          <span className="mother-info-value">{motherData.nama_lengkap}</span>
                        </div>
                        <div className="mother-info-item">
                          <span className="mother-info-label">NIK:</span>
                          <span className="mother-info-value">{motherData.nik_ibu}</span>
                        </div>
                        <div className="mother-info-item">
                          <span className="mother-info-label">Tanggal Persalinan:</span>
                          <span className="mother-info-value">{new Date(motherData.tanggal_persalinan).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="mother-info-item">
                          <span className="mother-info-label">Tempat Persalinan:</span>
                          <span className="mother-info-value">{motherData.tempat_persalinan}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="tanggal_kunjungan">Tanggal & Waktu Kunjungan *</label>
                    <input
                      type="datetime-local"
                      id="tanggal_kunjungan"
                      name="tanggal_kunjungan"
                      value={formData.tanggal_kunjungan}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="jenis_kunjungan">Jenis Kunjungan *</label>
                    <select
                      id="jenis_kunjungan"
                      name="jenis_kunjungan"
                      value={formData.jenis_kunjungan}
                      onChange={handleChange}
                      required
                    >
                      <option value="KF1">KF1 (6-48 jam)</option>
                      <option value="KF2">KF2 (3-7 hari)</option>
                      <option value="KF3">KF3 (8-28 hari)</option>
                      <option value="KF4">KF4 (29-42 hari)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="pemeriksa">Pemeriksa *</label>
                    <select
                      id="pemeriksa"
                      name="pemeriksa"
                      value={formData.pemeriksa}
                      onChange={handleChange}
                      required
                    >
                      <option value="Bidan">Bidan</option>
                      <option value="Dokter">Dokter</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Pemeriksaan Ibu</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="tekanan_darah">Tekanan Darah</label>
                    <input
                      type="text"
                      id="tekanan_darah"
                      name="tekanan_darah"
                      value={formData.tekanan_darah}
                      onChange={handleChange}
                      placeholder="Contoh: 120/80"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="suhu_badan">Suhu Badan (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      id="suhu_badan"
                      name="suhu_badan"
                      value={formData.suhu_badan}
                      onChange={handleChange}
                      placeholder="Contoh: 36.5"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="involusio_uteri">Involusio Uteri</label>
                    <select
                      id="involusio_uteri"
                      name="involusio_uteri"
                      value={formData.involusio_uteri}
                      onChange={handleChange}
                    >
                      <option value="Baik">Baik</option>
                      <option value="Lambat">Lambat</option>
                      <option value="Infeksi">Infeksi</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="lochea">Lochea</label>
                    <select
                      id="lochea"
                      name="lochea"
                      value={formData.lochea}
                      onChange={handleChange}
                    >
                      <option value="Rubra">Rubra</option>
                      <option value="Seroza">Seroza</option>
                      <option value="Alba">Alba</option>
                      <option value="Normal">Normal</option>
                      <option value="Bau">Bau</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="payudara">Kondisi Payudara</label>
                    <select
                      id="payudara"
                      name="payudara"
                      value={formData.payudara}
                      onChange={handleChange}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Bengkak">Bengkak</option>
                      <option value="Puting Lecet">Puting Lecet</option>
                      <option value="Mastitis">Mastitis</option>
                    </select>
                  </div>

                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="konseling_asi"
                        checked={formData.konseling_asi}
                        onChange={handleChange}
                      />
                      Konseling ASI
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Data Bayi</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="berat_badan_bayi">Berat Badan Bayi (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      id="berat_badan_bayi"
                      name="berat_badan_bayi"
                      value={formData.berat_badan_bayi}
                      onChange={handleChange}
                      placeholder="Contoh: 3.2"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="suhu_bayi">Suhu Bayi (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      id="suhu_bayi"
                      name="suhu_bayi"
                      value={formData.suhu_bayi}
                      onChange={handleChange}
                      placeholder="Contoh: 36.5"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="pemberian_asi">Pemberian ASI</label>
                    <select
                      id="pemberian_asi"
                      name="pemberian_asi"
                      value={formData.pemberian_asi}
                      onChange={handleChange}
                    >
                      <option value="ASI Eksklusif">ASI Eksklusif</option>
                      <option value="ASI + Formula">ASI + Formula</option>
                      <option value="Formula">Formula</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="keterangan">Keterangan</label>
                    <textarea
                      id="keterangan"
                      name="keterangan"
                      value={formData.keterangan}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Keterangan tambahan tentang kunjungan nifas..."
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === `komplikasi` && (
            <>
              <div className="anc-complications-section">
                <div className="form-section">
                  <div className="anc-section-header">
                    <h3>Komplikasi Persalinan</h3>
                    <button type="button" className="btn-add-complication" onClick={addComplication}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
                      </svg>
                      Tambah Komplikasi
                    </button>
                  </div>

                  {complications.map((comp, index) => (
                    <div key={index} className="anc-complication-card">
                      <div className="anc-complication-header">
                        <h4>Komplikasi {index + 1}</h4>
                        {complications.length > 1 && (
                          <button 
                            type="button" 
                            className="btn-remove-complication"
                            onClick={() => removeComplication(index)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                            </svg>
                            Hapus
                          </button>
                        )}
                      </div>

                      <div className="form-grid">
                        <div className="form-group">
                          <label>Nama Komplikasi *</label>
                          <input
                            type="text"
                            value={comp.nama_komplikasi}
                            onChange={(e) => updateComplication(index, 'nama_komplikasi', e.target.value)}
                            placeholder="Contoh: Perdarahan Post Partum"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Waktu Kejadian</label>
                          <select
                            value={comp.kejadian}
                            onChange={(e) => updateComplication(index, 'kejadian', e.target.value)}
                          >
                            <option value="Saat Nifas">Saat Nifas</option>
                            <option value="Saat Bersalin">Saat Bersalin</option>
                            <option value="Saat Hamil">Saat Hamil</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Tanggal Diagnosis</label>
                          <input
                            type="date"
                            value={comp.tanggal_diagnosis}
                            onChange={(e) => updateComplication(index, 'tanggal_diagnosis', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label>Tingkat Keparahan</label>
                          <select
                            value={comp.tingkat_keparahan}
                            onChange={(e) => updateComplication(index, 'tingkat_keparahan', e.target.value)}
                          >
                            <option value="Ringan">Ringan</option>
                            <option value="Sedang">Sedang</option>
                            <option value="Berat">Berat</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Status Penanganan</label>
                          <select
                            value={comp.status_penanganan}
                            onChange={(e) => updateComplication(index, 'status_penanganan', e.target.value)}
                          >
                            <option value="Ditangani">Ditangani</option>
                            <option value="Dirujuk">Dirujuk</option>
                            <option value="Selesai">Selesai</option>
                          </select>
                        </div>

                        <div className="form-group checkbox-group">
                          <label>
                            <input
                              type="checkbox"
                              checked={comp.rujuk_rs}
                              onChange={(e) => updateComplication(index, 'rujuk_rs', e.target.checked)}
                            />
                            Dirujuk ke Rumah Sakit
                          </label>
                        </div>

                        {comp.rujuk_rs && (
                          <>
                            <div className="form-group">
                              <label>Nama Rumah Sakit</label>
                              <select
                                value={comp.nama_rs}
                                onChange={(e) => updateComplication(index, 'nama_rs', e.target.value)}
                              >
                                <option value="">-- Pilih Rumah Sakit --</option>
                                <option value="RS MOEIS">RS MOEIS</option>
                                <option value="RS Samarinda Medika Citra">RS Samarinda Medika Citra</option>
                                <option value="RS Hermina">RS Hermina</option>
                                <option value="RS Aisyiyah">RS Aisyiyah</option>
                                <option value="RS Jimmy Medika Borneo">RS Jimmy Medika Borneo</option>
                                <option value="RS Abdoel Wahab Sjahranie">RS Abdoel Wahab Sjahranie</option>
                              </select>
                            </div>

                            <div className="form-group">
                              <label>Tanggal Rujukan</label>
                              <input
                                type="date"
                                value={comp.tanggal_rujukan}
                                onChange={(e) => updateComplication(index, 'tanggal_rujukan', e.target.value)}
                              />
                            </div>
                          </>
                        )}

                        <div className="form-group">
                          <label>Tekanan Darah</label>
                          <input
                            type="text"
                            value={comp.tekanan_darah}
                            onChange={(e) => updateComplication(index, 'tekanan_darah', e.target.value)}
                            placeholder="Contoh: 150/100"
                          />
                        </div>

                        <div className="form-group">
                          <label>Protein Urine</label>
                          <select
                            value={comp.protein_urine}
                            onChange={(e) => updateComplication(index, 'protein_urine', e.target.value)}
                          >
                            <option value="">-- Pilih --</option>
                            <option value="Negatif">Negatif</option>
                            <option value="+1">+1</option>
                            <option value="+2">+2</option>
                            <option value="+3">+3</option>
                            <option value="+4">+4</option>
                          </select>
                        </div>

                        <div className="form-group full-width">
                          <label>Gejala Penyerta</label>
                          <textarea
                            value={comp.gejala_penyerta}
                            onChange={(e) => updateComplication(index, 'gejala_penyerta', e.target.value)}
                            rows="2"
                            placeholder="Gejala yang menyertai komplikasi..."
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Terapi yang Diberikan</label>
                          <textarea
                            value={comp.terapi_diberikan}
                            onChange={(e) => updateComplication(index, 'terapi_diberikan', e.target.value)}
                            rows="2"
                            placeholder="Terapi atau pengobatan yang diberikan..."
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Keterangan</label>
                          <textarea
                            value={comp.keterangan}
                            onChange={(e) => updateComplication(index, 'keterangan', e.target.value)}
                            rows="2"
                            placeholder="Keterangan tambahan..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/kunjungan-nifas')}>
              Batal
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Menyimpan...' : (isEdit ? 'Update Data' : 'Simpan Data')}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default TambahNifas;