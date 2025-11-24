import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Select from 'react-select';
import TambahANCPresenter from './TambahANC-presenter';
import './TambahANC.css';

const TambahANC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const isEdit = Boolean(editId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pregnancies, setPregnancies] = useState([]);
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    tanggal_kunjungan: '',
    jenis_kunjungan: 'K1',
    jenis_akses: 'Murni',
    pemeriksa: 'Bidan',
    berat_badan: '',
    tekanan_darah: '',
    lila: '',
    tinggi_fundus: '',
    denyut_jantung_janin: '',
    status_imunisasi_tt: 'T0',
    beri_tablet_fe: false,
    hasil_lab_hb: '',
    lab_protein_urine: 'Negatif',
    lab_gula_darah: '',
    hasil_lab_lainnya: '',
    skrining_hiv: 'Belum Diperiksa',
    skrining_sifilis: 'Belum Diperiksa',
    skrining_hbsag: 'Belum Diperiksa',
    skrining_tb: 'Belum Diperiksa',
    terapi_malaria: false,
    terapi_kecacingan: false,
    hasil_usg: '',
    status_kmk_usg: '',
    status_risiko_visit: 'Normal',
    skrining_jiwa: '',
    hasil_temu_wicara: '',
    tata_laksana_kasus: '',
    keterangan_anc: '',
    forkey_hamil: '',
    forkey_bidan: ''
  });

  const [presenter] = useState(() => new TambahANCPresenter({
    setLoading,
    setError,
    clearError: () => setError(''),
    setPregnancies,
    populateForm: (data) => {
      setFormData({
        tanggal_kunjungan: data.tanggal_kunjungan ? data.tanggal_kunjungan.split('T')[0] : '',
        jenis_kunjungan: data.jenis_kunjungan || 'K1',
        jenis_akses: data.jenis_akses || 'Murni',
        pemeriksa: data.pemeriksa || 'Bidan',
        berat_badan: data.berat_badan || '',
        tekanan_darah: data.tekanan_darah || '',
        lila: data.lila || '',
        tinggi_fundus: data.tinggi_fundus || '',
        denyut_jantung_janin: data.denyut_jantung_janin || '',
        status_imunisasi_tt: data.status_imunisasi_tt || 'T0',
        beri_tablet_fe: data.beri_tablet_fe || false,
        hasil_lab_hb: data.hasil_lab_hb || '',
        lab_protein_urine: data.lab_protein_urine || 'Negatif',
        lab_gula_darah: data.lab_gula_darah || '',
        hasil_lab_lainnya: data.hasil_lab_lainnya || '',
        skrining_hiv: data.skrining_hiv || 'Belum Diperiksa',
        skrining_sifilis: data.skrining_sifilis || 'Belum Diperiksa',
        skrining_hbsag: data.skrining_hbsag || 'Belum Diperiksa',
        skrining_tb: data.skrining_tb || 'Belum Diperiksa',
        terapi_malaria: data.terapi_malaria || false,
        terapi_kecacingan: data.terapi_kecacingan || false,
        hasil_usg: data.hasil_usg || '',
        status_kmk_usg: data.status_kmk_usg || '',
        status_risiko_visit: data.status_risiko_visit || 'Normal',
        skrining_jiwa: data.skrining_jiwa || '',
        hasil_temu_wicara: data.hasil_temu_wicara || '',
        tata_laksana_kasus: data.tata_laksana_kasus || '',
        keterangan_anc: data.keterangan_anc || '',
        forkey_hamil: data.forkey_hamil || '',
        forkey_bidan: data.forkey_bidan || ''
      });
    },
    onSuccess: (message) => {
      alert(message);
      navigate('/kunjungan-anc');
    },
    onLogout: () => navigate('/login')
  }));

  useEffect(() => {
    const userData = presenter.getUser();
    setUser(userData);
    
    if (userData) {
      setFormData(prev => ({ ...prev, forkey_bidan: userData.id }));
    }

    presenter.loadPregnancies();

    if (isEdit && editId) {
      presenter.loadAncData(editId);
    }
  }, [presenter, isEdit, editId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await presenter.handleSubmit(formData, isEdit, editId);
  };

  const handleLogout = () => {
    presenter.handleLogout();
  };

  // Prepare options for react-select
  const pregnancyOptions = pregnancies.map(preg => ({
    value: preg.id,
    label: `${preg.nama_ibu} (NIK: ${preg.nik_ibu}) - Gravida ${preg.gravida}`
  }));

  const proteinUrineOptions = [
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
          <a href="/kunjungan-anc" className="nav-item active">
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
            <h1>{isEdit ? 'Edit' : 'Tambah'} Kunjungan ANC</h1>
            <p>Lengkapi form kunjungan antenatal care</p>
          </div>
          <button className="btn-back" onClick={() => navigate('/kunjungan-anc')}>
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

        <form onSubmit={handleSubmit} className="anc-form">
          <div className="form-section">
            <h3>Informasi Dasar</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="forkey_hamil">Pilih Ibu Hamil *</label>
                <Select
                  id="forkey_hamil"
                  name="forkey_hamil"
                  value={pregnancyOptions.find(opt => opt.value === formData.forkey_hamil) || null}
                  onChange={(selectedOption) => setFormData(prev => ({ ...prev, forkey_hamil: selectedOption ? selectedOption.value : '' }))}
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
                <label htmlFor="tanggal_kunjungan">Tanggal Kunjungan *</label>
                <input
                  type="date"
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
                  <option value="K1">K1</option>
                  <option value="K2">K2</option>
                  <option value="K3">K3</option>
                  <option value="K4">K4</option>
                  <option value="K5">K5</option>
                  <option value="K6">K6</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="jenis_akses">Jenis Akses *</label>
                <select
                  id="jenis_akses"
                  name="jenis_akses"
                  value={formData.jenis_akses}
                  onChange={handleChange}
                  required
                >
                  <option value="Murni">Murni</option>
                  <option value="Akses">Akses</option>
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

              <div className="form-group">
                <label htmlFor="status_risiko_visit">Status Risiko *</label>
                <select
                  id="status_risiko_visit"
                  name="status_risiko_visit"
                  value={formData.status_risiko_visit}
                  onChange={handleChange}
                  required
                >
                  <option value="Normal">Normal</option>
                  <option value="Risiko Tinggi">Risiko Tinggi</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Pemeriksaan Fisik</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="berat_badan">Berat Badan (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  id="berat_badan"
                  name="berat_badan"
                  value={formData.berat_badan}
                  onChange={handleChange}
                  placeholder="Contoh: 55.5"
                />
              </div>

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
                <label htmlFor="lila">LILA (cm)</label>
                <input
                  type="number"
                  step="0.01"
                  id="lila"
                  name="lila"
                  value={formData.lila}
                  onChange={handleChange}
                  placeholder="Contoh: 24.5"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tinggi_fundus">Tinggi Fundus (cm)</label>
                <input
                  type="number"
                  step="0.01"
                  id="tinggi_fundus"
                  name="tinggi_fundus"
                  value={formData.tinggi_fundus}
                  onChange={handleChange}
                  placeholder="Contoh: 20"
                />
              </div>

              <div className="form-group">
                <label htmlFor="denyut_jantung_janin">Denyut Jantung Janin (bpm)</label>
                <input
                  type="number"
                  id="denyut_jantung_janin"
                  name="denyut_jantung_janin"
                  value={formData.denyut_jantung_janin}
                  onChange={handleChange}
                  placeholder="Contoh: 140"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Imunisasi & Terapi</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="status_imunisasi_tt">Status Imunisasi TT</label>
                <select
                  id="status_imunisasi_tt"
                  name="status_imunisasi_tt"
                  value={formData.status_imunisasi_tt}
                  onChange={handleChange}
                >
                  <option value="T0">T0</option>
                  <option value="T1">T1</option>
                  <option value="T2">T2</option>
                  <option value="T3">T3</option>
                  <option value="T4">T4</option>
                  <option value="T5">T5</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="beri_tablet_fe"
                    checked={formData.beri_tablet_fe}
                    onChange={handleChange}
                  />
                  Beri Tablet FE
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="terapi_malaria"
                    checked={formData.terapi_malaria}
                    onChange={handleChange}
                  />
                  Terapi Malaria
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="terapi_kecacingan"
                    checked={formData.terapi_kecacingan}
                    onChange={handleChange}
                  />
                  Terapi Kecacingan
                </label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Pemeriksaan Laboratorium</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="hasil_lab_hb">Hasil Lab HB (g/dL)</label>
                <input
                  type="number"
                  step="0.01"
                  id="hasil_lab_hb"
                  name="hasil_lab_hb"
                  value={formData.hasil_lab_hb}
                  onChange={handleChange}
                  placeholder="Contoh: 11.5"
                />
              </div>

              <div className="form-group">
                <label htmlFor="lab_protein_urine">Protein Urine</label>
                <Select
                  id="lab_protein_urine"
                  name="lab_protein_urine"
                  value={proteinUrineOptions.find(opt => opt.value === formData.lab_protein_urine) || null}
                  onChange={(selectedOption) => setFormData(prev => ({ ...prev, lab_protein_urine: selectedOption ? selectedOption.value : 'Negatif' }))}
                  options={proteinUrineOptions}
                  placeholder="-- Pilih Protein Urine --"
                  isClearable
                  isSearchable
                  styles={customSelectStyles}
                  noOptionsMessage={() => "Tidak ada data"}
                />
              </div>

              <div className="form-group">
                <label htmlFor="lab_gula_darah">Gula Darah</label>
                <input
                  type="text"
                  id="lab_gula_darah"
                  name="lab_gula_darah"
                  value={formData.lab_gula_darah}
                  onChange={handleChange}
                  placeholder="Contoh: 90 mg/dL"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="hasil_lab_lainnya">Hasil Lab Lainnya</label>
                <textarea
                  id="hasil_lab_lainnya"
                  name="hasil_lab_lainnya"
                  value={formData.hasil_lab_lainnya}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Hasil pemeriksaan laboratorium lainnya..."
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Skrining Penyakit</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="skrining_hiv">Skrining HIV</label>
                <select
                  id="skrining_hiv"
                  name="skrining_hiv"
                  value={formData.skrining_hiv}
                  onChange={handleChange}
                >
                  <option value="Belum Diperiksa">Belum Diperiksa</option>
                  <option value="Non-Reaktif">Non-Reaktif</option>
                  <option value="Reaktif">Reaktif</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="skrining_sifilis">Skrining Sifilis</label>
                <select
                  id="skrining_sifilis"
                  name="skrining_sifilis"
                  value={formData.skrining_sifilis}
                  onChange={handleChange}
                >
                  <option value="Belum Diperiksa">Belum Diperiksa</option>
                  <option value="Non-Reaktif">Non-Reaktif</option>
                  <option value="Reaktif">Reaktif</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="skrining_hbsag">Skrining HBsAg</label>
                <select
                  id="skrining_hbsag"
                  name="skrining_hbsag"
                  value={formData.skrining_hbsag}
                  onChange={handleChange}
                >
                  <option value="Belum Diperiksa">Belum Diperiksa</option>
                  <option value="Non-Reaktif">Non-Reaktif</option>
                  <option value="Reaktif">Reaktif</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="skrining_tb">Skrining TB</label>
                <select
                  id="skrining_tb"
                  name="skrining_tb"
                  value={formData.skrining_tb}
                  onChange={handleChange}
                >
                  <option value="Belum Diperiksa">Belum Diperiksa</option>
                  <option value="Negatif">Negatif</option>
                  <option value="Positif">Positif</option>
                  <option value="Suspek">Suspek</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>USG & Pemeriksaan Lainnya</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="hasil_usg">Hasil USG</label>
                <textarea
                  id="hasil_usg"
                  name="hasil_usg"
                  value={formData.hasil_usg}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Hasil pemeriksaan USG..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="status_kmk_usg">Status KMK USG</label>
                <select
                  id="status_kmk_usg"
                  name="status_kmk_usg"
                  value={formData.status_kmk_usg}
                  onChange={handleChange}
                >
                  <option value="">-- Pilih Status --</option>
                  <option value="Sesuai">Sesuai</option>
                  <option value="Tidak Sesuai">Tidak Sesuai</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label htmlFor="skrining_jiwa">Skrining Jiwa</label>
                <textarea
                  id="skrining_jiwa"
                  name="skrining_jiwa"
                  value={formData.skrining_jiwa}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Hasil skrining kesehatan jiwa..."
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="hasil_temu_wicara">Hasil Temu Wicara</label>
                <textarea
                  id="hasil_temu_wicara"
                  name="hasil_temu_wicara"
                  value={formData.hasil_temu_wicara}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Hasil temu wicara dengan ibu hamil..."
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="tata_laksana_kasus">Tata Laksana Kasus</label>
                <textarea
                  id="tata_laksana_kasus"
                  name="tata_laksana_kasus"
                  value={formData.tata_laksana_kasus}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Tata laksana kasus jika ada..."
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="keterangan_anc">Keterangan</label>
                <textarea
                  id="keterangan_anc"
                  name="keterangan_anc"
                  value={formData.keterangan_anc}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Keterangan tambahan..."
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/kunjungan-anc')}>
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

export default TambahANC;
