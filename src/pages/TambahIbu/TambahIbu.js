import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TambahIbuPresenter from './TambahIbu-presenter';
import './TambahIbu.css';

const TambahIbu = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const isEditMode = !!editId;
  
  const [formData, setFormData] = useState({
    id: '',
    nik_ibu: '',
    nama_lengkap: '',
    tanggal_lahir: '',
    no_hp: '',
    gol_darah: '',
    rhesus: '+',
    buku_kia: 'Ada',
    pekerjaan: '',
    pendidikan: '',
    kelurahan: '',
    alamat_lengkap: ''
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);

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
      
      setFormData({
        id: data.id,
        nik_ibu: data.nik_ibu || '',
        nama_lengkap: data.nama_lengkap || '',
        tanggal_lahir: formattedDate,
        no_hp: data.no_hp || '',
        gol_darah: data.gol_darah || '',
        rhesus: data.rhesus || '+',
        buku_kia: data.buku_kia || 'Ada',
        pekerjaan: data.pekerjaan || '',
        pendidikan: data.pendidikan || '',
        kelurahan: data.kelurahan || '',
        alamat_lengkap: data.alamat_lengkap || ''
      });
      setLoadingData(false);
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
    
    // Load data if in edit mode
    if (isEditMode && editId) {
      presenter.loadIbuData(editId);
    }
  }, [presenter, isEditMode, editId]);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await presenter.handleSubmit(formData);
  };

  const handleCancel = () => {
    navigate('/data-ibu');
  };

  const handleLogout = () => {
    presenter.handleLogout();
  };

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
            <form onSubmit={handleSubmit}>
              {/* Hidden ID field for edit mode */}
              {isEditMode && (
                <input type="hidden" name="id" value={formData.id} />
              )}
              
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
                <div className="form-group full-width">
                  <label htmlFor="kelurahan">Kelurahan</label>
                  <select
                    id="kelurahan"
                    name="kelurahan"
                    value={formData.kelurahan}
                    onChange={handleChange}
                  >
                    <option value="">Pilih Kelurahan</option>
                    <option value="Rawa Makmur">Rawa Makmur</option>
                    <option value="Bantuas">Bantuas</option>
                    <option value="Handil Bakti">Handil Bakti</option>
                    <option value="Simpang Pasir">Simpang Pasir</option>
                    <option value="Bukuan">Bukuan</option>
                  </select>
                </div>
              </div>

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
