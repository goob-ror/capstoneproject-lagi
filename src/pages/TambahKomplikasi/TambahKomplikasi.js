import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Select from 'react-select';
import TambahKomplikasiPresenter from './TambahKomplikasi-presenter';
import './TambahKomplikasi.css';

const TambahKomplikasi = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const isEdit = Boolean(editId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pregnancies, setPregnancies] = useState([]);
  const [ancVisits, setAncVisits] = useState([]);
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    kode_diagnosis: '',
    nama_komplikasi: '',
    waktu_kejadian: 'Saat Hamil',
    tanggal_diagnosis: '',
    rujuk_rs: false,
    tanggal_rujukan: '',
    tekanan_darah: '',
    protein_urine: '',
    gejala_penyerta: '',
    terapi_diberikan: '',
    tingkat_keparahan: 'Ringan',
    status_penanganan: 'Ditangani',
    keterangan: '',
    forkey_hamil: '',
    forkey_anc: ''
  });

  const [presenter] = useState(() => new TambahKomplikasiPresenter({
    setLoading,
    setError,
    clearError: () => setError(''),
    setPregnancies,
    setAncVisits,
    populateForm: (data) => {
      setFormData({
        kode_diagnosis: data.kode_diagnosis || '',
        nama_komplikasi: data.nama_komplikasi || '',
        waktu_kejadian: data.waktu_kejadian || 'Saat Hamil',
        tanggal_diagnosis: data.tanggal_diagnosis || '',
        rujuk_rs: data.rujuk_rs || false,
        tanggal_rujukan: data.tanggal_rujukan || '',
        tekanan_darah: data.tekanan_darah || '',
        protein_urine: data.protein_urine || '',
        gejala_penyerta: data.gejala_penyerta || '',
        terapi_diberikan: data.terapi_diberikan || '',
        tingkat_keparahan: data.tingkat_keparahan || 'Ringan',
        status_penanganan: data.status_penanganan || 'Ditangani',
        keterangan: data.keterangan || '',
        forkey_hamil: data.forkey_hamil || '',
        forkey_anc: data.forkey_anc || ''
      });
    },
    onSuccess: (message) => {
      alert(message);
      navigate('/komplikasi');
    },
    onLogout: () => navigate('/login')
  }));

  useEffect(() => {
    const userData = presenter.getUser();
    setUser(userData);

    presenter.loadPregnancies();

    if (isEdit && editId) {
      presenter.loadKomplikasiData(editId);
    }
  }, [presenter, isEdit, editId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePregnancyChange = async (selectedOption) => {
    const pregnancyId = selectedOption ? selectedOption.value : '';
    setFormData(prev => ({
      ...prev,
      forkey_hamil: pregnancyId,
      forkey_anc: ''
    }));

    if (pregnancyId) {
      await presenter.loadAncVisits(pregnancyId);
    } else {
      setAncVisits([]);
    }
  };

  const handleAncChange = (selectedOption) => {
    const ancId = selectedOption ? selectedOption.value : '';
    setFormData(prev => ({
      ...prev,
      forkey_anc: ancId
    }));

    // Auto-populate clinical data from selected ANC visit
    if (ancId) {
      const selectedAnc = ancVisits.find(anc => anc.id === parseInt(ancId));
      if (selectedAnc) {
        setFormData(prev => ({
          ...prev,
          tekanan_darah: selectedAnc.tekanan_darah || prev.tekanan_darah,
          protein_urine: selectedAnc.lab_protein_urine || prev.protein_urine
        }));
      }
    }
  };

  // Prepare options for react-select
  const pregnancyOptions = pregnancies.map(preg => ({
    value: preg.id,
    label: `${preg.nama_ibu} (NIK: ${preg.nik_ibu}) - Gravida ${preg.gravida}`
  }));

  const ancOptions = ancVisits.map(anc => ({
    value: anc.id,
    label: `${anc.jenis_kunjungan} - ${new Date(anc.tanggal_kunjungan).toLocaleDateString('id-ID')}`
  }));

  const proteinUrineOptions = [
    { value: '', label: '-- Pilih --' },
    { value: 'Negatif', label: 'Negatif' },
    { value: '+1', label: '+1' },
    { value: '+2', label: '+2' },
    { value: '+3', label: '+3' },
    { value: '+4', label: '+4' }
  ];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    await presenter.handleSubmit(formData, isEdit, editId);
  };

  const handleLogout = () => {
    presenter.handleLogout();
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
          <a href="/komplikasi" className="nav-item active">
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
            <h1>{isEdit ? 'Edit' : 'Tambah'} Komplikasi</h1>
            <p>Lengkapi form data komplikasi kehamilan</p>
          </div>
          <button className="btn-back" onClick={() => navigate('/komplikasi')}>
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

        <form onSubmit={handleSubmit} className="komplikasi-form">
          <div className="form-section">
            <h3>Informasi Dasar</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="forkey_hamil">Pilih Ibu Hamil *</label>
                <Select
                  id="forkey_hamil"
                  name="forkey_hamil"
                  value={pregnancyOptions.find(opt => opt.value === formData.forkey_hamil) || null}
                  onChange={handlePregnancyChange}
                  options={pregnancyOptions}
                  placeholder="-- Cari Ibu Hamil --"
                  isClearable
                  isSearchable
                  isDisabled={isEdit}
                  styles={customSelectStyles}
                  noOptionsMessage={() => "Tidak ada data"}
                />
              </div>

              <div className="form-group">
                <label htmlFor="forkey_anc">Kunjungan ANC (Opsional)</label>
                <Select
                  id="forkey_anc"
                  name="forkey_anc"
                  value={ancOptions.find(opt => opt.value === formData.forkey_anc) || null}
                  onChange={handleAncChange}
                  options={ancOptions}
                  placeholder="-- Tidak Terkait ANC --"
                  isClearable
                  isSearchable
                  isDisabled={!formData.forkey_hamil}
                  styles={customSelectStyles}
                  noOptionsMessage={() => "Tidak ada data"}
                />
              </div>

              <div className="form-group">
                <label htmlFor="kode_diagnosis">Kode Diagnosis (ICD-10)</label>
                <input
                  type="text"
                  id="kode_diagnosis"
                  name="kode_diagnosis"
                  value={formData.kode_diagnosis}
                  onChange={handleChange}
                  placeholder="Contoh: O13, O14.1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="nama_komplikasi">Nama Komplikasi *</label>
                <input
                  type="text"
                  id="nama_komplikasi"
                  name="nama_komplikasi"
                  value={formData.nama_komplikasi}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Hipertensi Gestasional"
                />
              </div>

              <div className="form-group">
                <label htmlFor="waktu_kejadian">Waktu Kejadian *</label>
                <select
                  id="waktu_kejadian"
                  name="waktu_kejadian"
                  value={formData.waktu_kejadian}
                  onChange={handleChange}
                  required
                >
                  <option value="Saat Hamil">Saat Hamil</option>
                  <option value="Bersalin">Bersalin</option>
                  <option value="Nifas">Nifas</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tanggal_diagnosis">Tanggal Diagnosis *</label>
                <input
                  type="date"
                  id="tanggal_diagnosis"
                  name="tanggal_diagnosis"
                  value={formData.tanggal_diagnosis}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tingkat_keparahan">Tingkat Keparahan</label>
                <select
                  id="tingkat_keparahan"
                  name="tingkat_keparahan"
                  value={formData.tingkat_keparahan}
                  onChange={handleChange}
                >
                  <option value="Ringan">Ringan</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Berat">Berat</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="status_penanganan">Status Penanganan *</label>
                <select
                  id="status_penanganan"
                  name="status_penanganan"
                  value={formData.status_penanganan}
                  onChange={handleChange}
                  required
                >
                  <option value="Ditangani">Ditangani</option>
                  <option value="Dirujuk">Dirujuk</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Pemeriksaan Klinis</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="tekanan_darah">Tekanan Darah</label>
                <input
                  type="text"
                  id="tekanan_darah"
                  name="tekanan_darah"
                  value={formData.tekanan_darah}
                  onChange={handleChange}
                  placeholder="Contoh: 150/100"
                />
              </div>

              <div className="form-group">
                <label htmlFor="protein_urine">Protein Urine</label>
                <Select
                  id="protein_urine"
                  name="protein_urine"
                  value={proteinUrineOptions.find(opt => opt.value === formData.protein_urine) || null}
                  onChange={(selectedOption) => setFormData(prev => ({ ...prev, protein_urine: selectedOption ? selectedOption.value : '' }))}
                  options={proteinUrineOptions}
                  placeholder="-- Pilih Protein Urine --"
                  isClearable
                  isSearchable
                  styles={customSelectStyles}
                  noOptionsMessage={() => "Tidak ada data"}
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="gejala_penyerta">Gejala Penyerta</label>
                <textarea
                  id="gejala_penyerta"
                  name="gejala_penyerta"
                  value={formData.gejala_penyerta}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Contoh: Sakit kepala, penglihatan kabur, edema..."
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="terapi_diberikan">Terapi yang Diberikan</label>
                <textarea
                  id="terapi_diberikan"
                  name="terapi_diberikan"
                  value={formData.terapi_diberikan}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Contoh: Methyldopa 3x500mg, MgSO4..."
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Rujukan</h3>
            <div className="form-grid">
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="rujuk_rs"
                    checked={formData.rujuk_rs}
                    onChange={handleChange}
                  />
                  Dirujuk ke Rumah Sakit
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="tanggal_rujukan">Tanggal Rujukan</label>
                <input
                  type="date"
                  id="tanggal_rujukan"
                  name="tanggal_rujukan"
                  value={formData.tanggal_rujukan}
                  onChange={handleChange}
                  disabled={!formData.rujuk_rs}
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="keterangan">Keterangan</label>
                <textarea
                  id="keterangan"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Keterangan tambahan..."
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/komplikasi')}>
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

export default TambahKomplikasi;
