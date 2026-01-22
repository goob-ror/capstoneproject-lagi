import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TambahIbuPresenter from './TambahIbu-presenter';
import { calculateBMI, getBMICategory, getBMICategoryColor } from '../../utils/bmiCalculator';
import './TambahIbu.css';

const TambahIbu = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const isEditMode = !!editId;
  const [activeTab, setActiveTab] = useState('data-ibu');
  
  const [formData, setFormData] = useState({
    id: '',
    nik_ibu: '',
    nama_lengkap: '',
    tanggal_lahir: '',
    no_hp: '',
    gol_darah: '',
    rhesus: '+',
    tinggi_badan: '',
    beratbadan: '',
    buku_kia: 'Ada',
    pekerjaan: '',
    pendidikan: '',
    kelurahan_id: '',
    rt: '',
    alamat_lengkap: '',
    // Data Kehamilan
    gravida: '1',
    partus: '0',
    abortus: '0',
    haid_terakhir: '',
    status_kehamilan: 'Hamil'
  });

  // Data Suami
  const [suamiData, setSuamiData] = useState({
    nik_suami: '',
    nama_lengkap: '',
    tanggal_lahir: '',
    no_hp: '',
    gol_darah: '',
    pekerjaan: '',
    pendidikan: '',
    isPerokok: false
  });

  // Riwayat Penyakit
  const [riwayatPenyakit, setRiwayatPenyakit] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [isAddingNewPregnancy, setIsAddingNewPregnancy] = useState(false);
  const [originalPregnancyStatus, setOriginalPregnancyStatus] = useState(null);
  const [kelurahanOptions, setKelurahanOptions] = useState([]);
  const [rtOptions, setRtOptions] = useState([]);
  const [assignedPosyandu, setAssignedPosyandu] = useState(null);
  const [loadingRT, setLoadingRT] = useState(false);

  const [presenter] = useState(() => new TambahIbuPresenter({
    setLoading,
    setError,
    setSuccess,
    clearError: () => setError(''),
    clearSuccess: () => setSuccess(''),
    displayIbuData: (data) => {
      // Format date for input field
      const formattedDate = data.tanggal_lahir 
        ? new Date(data.tanggal_lahir).toISOString().split('T')[0]
        : '';
      
      const formattedHaidTerakhir = data.kehamilan?.haid_terakhir
        ? new Date(data.kehamilan.haid_terakhir).toISOString().split('T')[0]
        : '';
      
      // Store original pregnancy status to determine if we can add new pregnancy
      const pregnancyStatus = data.kehamilan?.status_kehamilan || null;
      setOriginalPregnancyStatus(pregnancyStatus);
      
      setFormData({
        id: data.id,
        nik_ibu: data.nik_ibu || '',
        nama_lengkap: data.nama_lengkap || '',
        tanggal_lahir: formattedDate,
        no_hp: data.no_hp || '',
        gol_darah: data.gol_darah || '',
        rhesus: data.rhesus || '+',
        tinggi_badan: data.tinggi_badan || '',
        beratbadan: data.beratbadan || '',
        buku_kia: data.buku_kia || 'Ada',
        pekerjaan: data.pekerjaan || '',
        pendidikan: data.pendidikan || '',
        kelurahan_id: data.kelurahan_id || '',
        rt: data.rt || '',
        alamat_lengkap: data.alamat_lengkap || '',
        // Data Kehamilan
        gravida: data.kehamilan?.gravida?.toString() || '1',
        partus: data.kehamilan?.partus?.toString() || '0',
        abortus: data.kehamilan?.abortus?.toString() || '0',
        haid_terakhir: formattedHaidTerakhir,
        status_kehamilan: data.kehamilan?.status_kehamilan || 'Hamil'
      });

      // Load suami data if exists
      if (data.suami) {
        const formattedSuamiDate = data.suami.tanggal_lahir 
          ? new Date(data.suami.tanggal_lahir).toISOString().split('T')[0]
          : '';
        
        setSuamiData({
          nik_suami: data.suami.nik_suami || '',
          nama_lengkap: data.suami.nama_lengkap || '',
          tanggal_lahir: formattedSuamiDate,
          no_hp: data.suami.no_hp || '',
          gol_darah: data.suami.gol_darah || '',
          pekerjaan: data.suami.pekerjaan || '',
          pendidikan: data.suami.pendidikan || '',
          isPerokok: data.suami.isPerokok || false
        });
      }

      // Load riwayat penyakit if exists
      if (data.riwayat_penyakit && data.riwayat_penyakit.length > 0) {
        setRiwayatPenyakit(data.riwayat_penyakit.map(rp => ({
          id: rp.id,
          nama_penyakit: rp.nama_penyakit || '',
          kategori_penyakit: rp.kategori_penyakit || 'Lainnya',
          tahun_diagnosis: rp.tahun_diagnosis || '',
          status_penyakit: rp.status_penyakit || 'Sembuh',
          keterangan: rp.keterangan || ''
        })));
      }
      
      setLoadingData(false);
      
      // Load RT options and posyandu assignment if kelurahan is set
      if (data.kelurahan_id) {
        loadRTOptions(data.kelurahan_id);
        if (data.rt) {
          checkPosyanduAssignment(data.kelurahan_id, data.rt);
        }
      }
    },
    onSuccess: (message) => {
      setSuccess(message || (isEditMode ? 'Data ibu berhasil diperbarui!' : 'Data ibu berhasil ditambahkan!'));
      setTimeout(() => {
        navigate('/data-ibu');
      }, 2000);
    },
    onLogout: () => navigate('/login')
  }));

  useEffect(() => {
    const userData = presenter.getUser();
    setUser(userData);
    
    // Load kelurahan options
    loadKelurahanOptions();
    
    // Load data if in edit mode
    if (isEditMode && editId) {
      presenter.loadIbuData(editId);
    }
  }, [presenter, isEditMode, editId]);

  const loadKelurahanOptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/kelurahan', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setKelurahanOptions(result.data || []);
      } else {
        console.error('Failed to load kelurahan options');
      }
    } catch (error) {
      console.error('Error loading kelurahan options:', error);
    }
  };

  const loadRTOptions = async (kelurahanId) => {
    if (!kelurahanId) {
      setRtOptions([]);
      setAssignedPosyandu(null);
      return;
    }

    setLoadingRT(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/kelurahan/rt-options/${kelurahanId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setRtOptions(result.data.availableRT || []);
      } else {
        console.error('Failed to load RT options');
        setRtOptions([]);
      }
    } catch (error) {
      console.error('Error loading RT options:', error);
      setRtOptions([]);
    } finally {
      setLoadingRT(false);
    }
  };

  const checkPosyanduAssignment = async (kelurahanId, rt) => {
    if (!kelurahanId || !rt) {
      setAssignedPosyandu(null);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/kelurahan/posyandu-assignment/${kelurahanId}/${rt}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setAssignedPosyandu(result.data);
      } else {
        console.error('Failed to get posyandu assignment');
        setAssignedPosyandu(null);
      }
    } catch (error) {
      console.error('Error getting posyandu assignment:', error);
      setAssignedPosyandu(null);
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Handle kelurahan change - load RT options
    if (name === 'kelurahan_id') {
      loadRTOptions(value);
      // Reset RT and posyandu when kelurahan changes
      setFormData(prev => ({
        ...prev,
        kelurahan_id: value,
        rt: ''
      }));
      setAssignedPosyandu(null);
    }

    // Handle RT change - check posyandu assignment
    if (name === 'rt') {
      checkPosyanduAssignment(formData.kelurahan_id, value);
    }
  };

  const handleSuamiChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSuamiData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddRiwayatPenyakit = () => {
    setRiwayatPenyakit(prev => [...prev, {
      id: null,
      nama_penyakit: '',
      kategori_penyakit: 'Lainnya',
      tahun_diagnosis: '',
      status_penyakit: 'Sembuh',
      keterangan: ''
    }]);
  };

  const handleRemoveRiwayatPenyakit = (index) => {
    setRiwayatPenyakit(prev => prev.filter((_, i) => i !== index));
  };

  const handleRiwayatPenyakitChange = (index, field, value) => {
    setRiwayatPenyakit(prev => prev.map((rp, i) => 
      i === index ? { ...rp, [field]: value } : rp
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Add flag to indicate if we're adding a new pregnancy
    const submitData = {
      ...formData,
      isAddingNewPregnancy,
      suami: suamiData,
      riwayat_penyakit: riwayatPenyakit
    };
    await presenter.handleSubmit(submitData);
  };

  const handleCancel = () => {
    navigate('/data-ibu');
  };

  const handleLogout = () => {
    presenter.handleLogout();
  };

  const handleAddNewPregnancy = () => {
    setIsAddingNewPregnancy(true);
    // Reset pregnancy fields for new pregnancy
    setFormData(prev => ({
      ...prev,
      gravida: (parseInt(prev.gravida) + 1).toString(),
      partus: prev.status_kehamilan === 'Selesai' ? (parseInt(prev.partus) + 1).toString() : prev.partus,
      haid_terakhir: '',
      status_kehamilan: 'Hamil'
    }));
  };

  const handleCancelNewPregnancy = () => {
    setIsAddingNewPregnancy(false);
    // Reload original data
    if (editId) {
      presenter.loadIbuData(editId);
    }
  };

  // Determine if pregnancy fields should be read-only
  // Read-only if pregnancy is completed (Selesai or Keguguran) and not adding new pregnancy
  const isCompletedPregnancy = ['Selesai', 'Keguguran'].includes(originalPregnancyStatus);
  const isPregnancyReadOnly = isEditMode && !isAddingNewPregnancy && isCompletedPregnancy;
  
  // Show "Add New Pregnancy" button only in edit mode when status is completed and not already adding
  const showAddPregnancyButton = isEditMode && isCompletedPregnancy && !isAddingNewPregnancy;

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
            <h1>{isEditMode ? 'Edit Data Ibu' : 'Tambah Data Ibu'}</h1>
            <p>{isEditMode ? 'Perbarui data ibu hamil' : 'Tambahkan data ibu hamil baru'}</p>
          </div>
          <button className="btn-cancel" onClick={handleCancel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
            Batal
          </button>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {success && (
          <div className="success-banner">
            {success}
          </div>
        )}

        {loadingData ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Memuat data...</p>
          </div>
        ) : (
          <div className="form-section">
            {/* Tabs Navigation */}
            <div className="form-tabs-container">
              <button
                type="button"
                className={`form-tab-button ${activeTab === 'data-ibu' ? 'active' : ''}`}
                onClick={() => setActiveTab('data-ibu')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                </svg>
                Data Ibu
              </button>
              <button
                type="button"
                className={`form-tab-button ${activeTab === 'data-suami' ? 'active' : ''}`}
                onClick={() => setActiveTab('data-suami')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/>
                </svg>
                Data Suami
              </button>
              <button
                type="button"
                className={`form-tab-button ${activeTab === 'riwayat-penyakit' ? 'active' : ''}`}
                onClick={() => setActiveTab('riwayat-penyakit')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" fill="currentColor"/>
                </svg>
                Riwayat Penyakit
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Hidden ID field for edit mode */}
              {isEditMode && (
                <input type="hidden" name="id" value={formData.id} />
              )}
              
              {/* Tab Content: Data Ibu */}
              {activeTab === 'data-ibu' && (
                <>
              <div className="form-card">
                <h3 className="form-section-title">Data Pribadi</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="nik_ibu">NIK <span className="required">*</span></label>
                    <input
                      type="text"
                      id="nik_ibu"
                      name="nik_ibu"
                      value={formData.nik_ibu}
                      onChange={handleChange}
                      placeholder="Masukkan NIK (16 digit)"
                      maxLength="16"
                      pattern="[0-9]{16}"
                      required
                      disabled={isEditMode}
                    />
                    <small>16 digit angka {isEditMode && '(tidak dapat diubah)'}</small>
                  </div>

                <div className="form-group">
                  <label htmlFor="nama_lengkap">Nama Lengkap <span className="required">*</span></label>
                  <input
                    type="text"
                    id="nama_lengkap"
                    name="nama_lengkap"
                    value={formData.nama_lengkap}
                    onChange={handleChange}
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tanggal_lahir">Tanggal Lahir <span className="required">*</span></label>
                  <input
                    type="date"
                    id="tanggal_lahir"
                    name="tanggal_lahir"
                    value={formData.tanggal_lahir}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="no_hp">No. HP</label>
                  <input
                    type="tel"
                    id="no_hp"
                    name="no_hp"
                    value={formData.no_hp}
                    onChange={handleChange}
                    placeholder="Contoh: 081234567890"
                    pattern="[0-9]{10,13}"
                  />
                  <small>10-13 digit angka</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gol_darah">Golongan Darah</label>
                  <select
                    id="gol_darah"
                    name="gol_darah"
                    value={formData.gol_darah}
                    onChange={handleChange}
                  >
                    <option value="">Pilih Golongan Darah</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="rhesus">Rhesus</label>
                  <select
                    id="rhesus"
                    name="rhesus"
                    value={formData.rhesus}
                    onChange={handleChange}
                  >
                    <option value="+">Positif (+)</option>
                    <option value="-">Negatif (-)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="tinggi_badan">Tinggi Badan</label>
                  <input
                    type="number"
                    id="tinggi_badan"
                    name="tinggi_badan"
                    value={formData.tinggi_badan}
                    onChange={handleChange}
                    placeholder="Contoh: 160"
                    min="100"
                    max="250"
                    step="0.1"
                  />
                  <small>Dalam cm</small>
                </div>

                <div className="form-group">
                  <label htmlFor="beratbadan">Berat Badan Sebelum Hamil</label>
                  <input
                    type="number"
                    id="beratbadan"
                    name="beratbadan"
                    value={formData.beratbadan}
                    onChange={handleChange}
                    placeholder="Contoh: 55"
                    min="20"
                    max="200"
                    step="0.1"
                  />
                  <small>Dalam kg</small>
                </div>
              </div>

              {formData.tinggi_badan && formData.beratbadan && (
                <div className="form-row">
                  <div className="form-group">
                    <label>IMT (Indeks Massa Tubuh)</label>
                    <div className="bmi-display">
                      <span className="bmi-value">
                        {calculateBMI(parseFloat(formData.beratbadan), parseFloat(formData.tinggi_badan))}
                      </span>
                      <span className={`bmi-category ${getBMICategoryColor(getBMICategory(calculateBMI(parseFloat(formData.beratbadan), parseFloat(formData.tinggi_badan))))}`}>
                        {getBMICategory(calculateBMI(parseFloat(formData.beratbadan), parseFloat(formData.tinggi_badan)))}
                      </span>
                    </div>
                    <small>Kurus: &lt;18.5 | Normal: 18.5-24.9 | Gemuk: 25-29.9 | Obese: ≥30</small>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="buku_kia">Buku KIA</label>
                  <select
                    id="buku_kia"
                    name="buku_kia"
                    value={formData.buku_kia}
                    onChange={handleChange}
                  >
                    <option value="Ada">Ada</option>
                    <option value="Tidak">Tidak</option>
                    <option value="Hilang">Hilang</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-card">
              <h3 className="form-section-title">Data Sosial</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pekerjaan">Pekerjaan</label>
                  <select
                    id="pekerjaan"
                    name="pekerjaan"
                    value={formData.pekerjaan}
                    onChange={handleChange}
                  >
                    <option value="">Pilih Pekerjaan</option>
                    <option value="IRT">IRT (Ibu Rumah Tangga)</option>
                    <option value="PNS">PNS</option>
                    <option value="Swasta">Swasta</option>
                    <option value="Wiraswasta">Wiraswasta</option>
                    <option value="Petani">Petani</option>
                    <option value="Buruh">Buruh</option>
                    <option value="Pedagang">Pedagang</option>
                    <option value="Guru">Guru</option>
                    <option value="Bidan">Bidan</option>
                    <option value="Perawat">Perawat</option>
                    <option value="Dokter">Dokter</option>
                    <option value="Karyawan">Karyawan</option>
                    <option value="Honorer">Honorer</option>
                    <option value="Mahasiswa">Mahasiswa</option>
                    <option value="Seniman">Seniman</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="pendidikan">Pendidikan</label>
                  <select
                    id="pendidikan"
                    name="pendidikan"
                    value={formData.pendidikan}
                    onChange={handleChange}
                  >
                    <option value="">Pilih Pendidikan</option>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                    <option value="SMK">SMK</option>
                    <option value="D3">D3</option>
                    <option value="D4">D4</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="kelurahan_id">Kelurahan <span className="required">*</span></label>
                  <select
                    id="kelurahan_id"
                    name="kelurahan_id"
                    value={formData.kelurahan_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Pilih Kelurahan</option>
                    {kelurahanOptions.map(kelurahan => (
                      <option key={kelurahan.id} value={kelurahan.id}>
                        {kelurahan.nama_kelurahan}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="rt">RT <span className="required">*</span></label>
                  <select
                    id="rt"
                    name="rt"
                    value={formData.rt}
                    onChange={handleChange}
                    disabled={!formData.kelurahan_id || loadingRT}
                    required
                  >
                    <option value="">
                      {!formData.kelurahan_id ? 'Pilih Kelurahan dulu' : 
                       loadingRT ? 'Memuat RT...' : 'Pilih RT'}
                    </option>
                    {rtOptions.map(rt => (
                      <option key={rt} value={rt}>
                        RT {rt}
                      </option>
                    ))}
                  </select>
                  <small>RT akan menentukan Posyandu secara otomatis</small>
                </div>
              </div>

              {assignedPosyandu && (
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Posyandu yang Ditugaskan</label>
                    <div className="posyandu-assignment">
                      <div className="posyandu-info">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                        </svg>
                        <div>
                          <strong>{assignedPosyandu.nama_posyandu}</strong>
                          <small>Melayani RT: {assignedPosyandu.rt_coverage}</small>
                        </div>
                      </div>
                    </div>
                    <small>Ibu akan otomatis terdaftar di Posyandu ini berdasarkan alamat RT</small>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="alamat_lengkap">Alamat Lengkap</label>
                  <textarea
                    id="alamat_lengkap"
                    name="alamat_lengkap"
                    value={formData.alamat_lengkap}
                    onChange={handleChange}
                    placeholder="Masukkan alamat lengkap (Jalan, RT/RW, dll)"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            <div className="form-card">
              <div className="form-section-header">
                <h3 className="form-section-title">
                  Data Kehamilan
                  {isAddingNewPregnancy && (
                    <span className="badge-new-pregnancy">Kehamilan Baru</span>
                  )}
                </h3>
                {showAddPregnancyButton && (
                  <button 
                    type="button" 
                    className="btn-add-pregnancy"
                    onClick={handleAddNewPregnancy}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
                    </svg>
                    Tambah Kehamilan Baru
                  </button>
                )}
                {isAddingNewPregnancy && (
                  <button 
                    type="button" 
                    className="btn-cancel-pregnancy"
                    onClick={handleCancelNewPregnancy}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                    </svg>
                    Batal
                  </button>
                )}
              </div>

              {isPregnancyReadOnly && (
                <div className="info-banner">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                  </svg>
                  <span>Data kehamilan sebelumnya sudah {originalPregnancyStatus === 'Keguguran' ? 'mengalami keguguran' : 'selesai'}. Klik "Tambah Kehamilan Baru" untuk menambah kehamilan baru.</span>
                </div>
              )}
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gravida">Gravida (G) <span className="required">*</span></label>
                  <input
                    type="number"
                    id="gravida"
                    name="gravida"
                    value={formData.gravida}
                    onChange={handleChange}
                    min="1"
                    max="20"
                    required
                    readOnly={isPregnancyReadOnly}
                    disabled={isPregnancyReadOnly}
                  />
                  <small>Jumlah kehamilan</small>
                </div>

                <div className="form-group">
                  <label htmlFor="partus">Partus (P) <span className="required">*</span></label>
                  <input
                    type="number"
                    id="partus"
                    name="partus"
                    value={formData.partus}
                    onChange={handleChange}
                    min="0"
                    max="20"
                    required
                    readOnly={isPregnancyReadOnly}
                    disabled={isPregnancyReadOnly}
                  />
                  <small>Jumlah persalinan</small>
                </div>

                <div className="form-group">
                  <label htmlFor="abortus">Abortus (A) <span className="required">*</span></label>
                  <input
                    type="number"
                    id="abortus"
                    name="abortus"
                    value={formData.abortus}
                    onChange={handleChange}
                    min="0"
                    max="20"
                    required
                    readOnly={isPregnancyReadOnly}
                    disabled={isPregnancyReadOnly}
                  />
                  <small>Jumlah keguguran</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="haid_terakhir">Haid Terakhir (HPHT) <span className="required">*</span></label>
                  <input
                    type="date"
                    id="haid_terakhir"
                    name="haid_terakhir"
                    value={formData.haid_terakhir}
                    onChange={handleChange}
                    required
                    readOnly={isPregnancyReadOnly}
                    disabled={isPregnancyReadOnly}
                  />
                  <small>Hari Pertama Haid Terakhir</small>
                </div>

                <div className="form-group">
                  <label htmlFor="status_kehamilan">Status Kehamilan <span className="required">*</span></label>
                  <select
                    id="status_kehamilan"
                    name="status_kehamilan"
                    value={formData.status_kehamilan}
                    onChange={handleChange}
                    required
                    disabled={isPregnancyReadOnly}
                  >
                    <option value="Hamil">Hamil</option>
                    <option value="Bersalin">Bersalin</option>
                    <option value="Nifas">Nifas</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Keguguran">Keguguran</option>
                  </select>
                </div>
              </div>
            </div>
                </>
              )}

              {/* Tab Content: Data Suami */}
              {activeTab === 'data-suami' && (
                <div className="form-card">
                  <h3 className="form-section-title">Data Suami</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="suami_nik">NIK Suami</label>
                      <input
                        type="text"
                        id="suami_nik"
                        name="nik_suami"
                        value={suamiData.nik_suami}
                        onChange={handleSuamiChange}
                        placeholder="Masukkan NIK (16 digit)"
                        maxLength="16"
                        pattern="[0-9]{16}"
                      />
                      <small>16 digit angka</small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="suami_nama">Nama Lengkap Suami</label>
                      <input
                        type="text"
                        id="suami_nama"
                        name="nama_lengkap"
                        value={suamiData.nama_lengkap}
                        onChange={handleSuamiChange}
                        placeholder="Masukkan nama lengkap suami"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="suami_tanggal_lahir">Tanggal Lahir</label>
                      <input
                        type="date"
                        id="suami_tanggal_lahir"
                        name="tanggal_lahir"
                        value={suamiData.tanggal_lahir}
                        onChange={handleSuamiChange}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="suami_no_hp">No. HP</label>
                      <input
                        type="tel"
                        id="suami_no_hp"
                        name="no_hp"
                        value={suamiData.no_hp}
                        onChange={handleSuamiChange}
                        placeholder="Contoh: 081234567890"
                        pattern="[0-9]{10,13}"
                      />
                      <small>10-13 digit angka</small>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="suami_gol_darah">Golongan Darah</label>
                      <select
                        id="suami_gol_darah"
                        name="gol_darah"
                        value={suamiData.gol_darah}
                        onChange={handleSuamiChange}
                      >
                        <option value="">Pilih Golongan Darah</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="AB">AB</option>
                        <option value="O">O</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="suami_pekerjaan">Pekerjaan</label>
                      <select
                        id="suami_pekerjaan"
                        name="pekerjaan"
                        value={suamiData.pekerjaan}
                        onChange={handleSuamiChange}
                      >
                        <option value="">Pilih Pekerjaan</option>
                        <option value="PNS">PNS</option>
                        <option value="Swasta">Swasta</option>
                        <option value="Wiraswasta">Wiraswasta</option>
                        <option value="Petani">Petani</option>
                        <option value="Buruh">Buruh</option>
                        <option value="Pedagang">Pedagang</option>
                        <option value="Guru">Guru</option>
                        <option value="Dokter">Dokter</option>
                        <option value="Karyawan">Karyawan</option>
                        <option value="Honorer">Honorer</option>
                        <option value="Seniman">Seniman</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="suami_pendidikan">Pendidikan</label>
                      <select
                        id="suami_pendidikan"
                        name="pendidikan"
                        value={suamiData.pendidikan}
                        onChange={handleSuamiChange}
                      >
                        <option value="">Pilih Pendidikan</option>
                        <option value="SD">SD</option>
                        <option value="SMP">SMP</option>
                        <option value="SMA">SMA</option>
                        <option value="SMK">SMK</option>
                        <option value="D3">D3</option>
                        <option value="D4">D4</option>
                        <option value="S1">S1</option>
                        <option value="S2">S2</option>
                        <option value="S3">S3</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="isPerokok"
                          checked={suamiData.isPerokok}
                          onChange={handleSuamiChange}
                        />
                        <span>Perokok</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Riwayat Penyakit */}
              {activeTab === 'riwayat-penyakit' && (
                <div className="form-card">
                  <div className="form-section-header">
                    <h3 className="form-section-title">Riwayat Penyakit</h3>
                    <button 
                      type="button" 
                      className="btn-add-item"
                      onClick={handleAddRiwayatPenyakit}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
                      </svg>
                      Tambah Riwayat Penyakit
                    </button>
                  </div>

                  {riwayatPenyakit.length === 0 ? (
                    <div className="empty-state">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" fill="currentColor" opacity="0.3"/>
                      </svg>
                      <p>Belum ada riwayat penyakit</p>
                      <small>Klik tombol "Tambah Riwayat Penyakit" untuk menambahkan</small>
                    </div>
                  ) : (
                    riwayatPenyakit.map((rp, index) => (
                      <div key={index} className="riwayat-item">
                        <div className="riwayat-item-header">
                          <h4>Riwayat Penyakit #{index + 1}</h4>
                          <button
                            type="button"
                            className="btn-remove-item"
                            onClick={() => handleRemoveRiwayatPenyakit(index)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                            </svg>
                            Hapus
                          </button>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Nama Penyakit</label>
                            <input
                              type="text"
                              value={rp.nama_penyakit}
                              onChange={(e) => handleRiwayatPenyakitChange(index, 'nama_penyakit', e.target.value)}
                              placeholder="Contoh: Hipertensi, Diabetes, dll"
                            />
                          </div>

                          <div className="form-group">
                            <label>Kategori Penyakit</label>
                            <select
                              value={rp.kategori_penyakit}
                              onChange={(e) => handleRiwayatPenyakitChange(index, 'kategori_penyakit', e.target.value)}
                            >
                              <option value="Penyakit Menular">Penyakit Menular</option>
                              <option value="Penyakit Tidak Menular">Penyakit Tidak Menular</option>
                              <option value="Penyakit Kronis">Penyakit Kronis</option>
                              <option value="Alergi">Alergi</option>
                              <option value="Operasi">Operasi</option>
                              <option value="Lainnya">Lainnya</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Tahun Diagnosis</label>
                            <input
                              type="number"
                              value={rp.tahun_diagnosis}
                              onChange={(e) => handleRiwayatPenyakitChange(index, 'tahun_diagnosis', e.target.value)}
                              placeholder="Contoh: 2020"
                              min="1900"
                              max={new Date().getFullYear()}
                            />
                          </div>

                          <div className="form-group">
                            <label>Status Penyakit</label>
                            <select
                              value={rp.status_penyakit}
                              onChange={(e) => handleRiwayatPenyakitChange(index, 'status_penyakit', e.target.value)}
                            >
                              <option value="Sembuh">Sembuh</option>
                              <option value="Dalam Pengobatan">Dalam Pengobatan</option>
                              <option value="Kronis">Kronis</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group full-width">
                            <label>Keterangan</label>
                            <textarea
                              value={rp.keterangan}
                              onChange={(e) => handleRiwayatPenyakitChange(index, 'keterangan', e.target.value)}
                              placeholder="Keterangan tambahan tentang penyakit"
                              rows="2"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Menyimpan...' : (isEditMode ? 'Perbarui Data' : 'Simpan Data')}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default TambahIbu;
