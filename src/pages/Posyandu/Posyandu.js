import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PosyanduPresenter from './Posyandu-presenter';
import './Posyandu.css';
import $ from 'jquery';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import 'datatables.net';

const Posyandu = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [posyanduData, setPosyanduData] = useState([]);
  const [kelurahanData, setKelurahanData] = useState([]);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPosyandu, setEditingPosyandu] = useState(null);
  const [selectedKelurahan, setSelectedKelurahan] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    nama_posyandu: '',
    kelurahan_id: '',
    rt: ''
  });

  const [presenter] = useState(() => new PosyanduPresenter({
    setLoading,
    setError,
    setSuccess,
    clearError: () => setError(''),
    clearSuccess: () => setSuccess(''),
    displayPosyanduData: (data) => {
      setPosyanduData(data);
      updateDataTable(data);
    },
    displayKelurahanData: (data) => setKelurahanData(data),
    onLogout: () => navigate('/login'),
    onSuccess: (message) => {
      setSuccess(message || 'Operasi berhasil!');
      setShowModal(false);
      setEditingPosyandu(null);
      setFormData({
        nama_posyandu: '',
        kelurahan_id: '',
        rt: ''
      });
    }
  }));

  useEffect(() => {
    const userData = presenter.model?.getUser() || presenter.getUser();
    setUser(userData);
    presenter.loadPosyanduData();
    presenter.loadKelurahanData();
  }, [presenter]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Initialize DataTable
  useEffect(() => {
    if (posyanduData.length > 0 && tableRef.current && !dataTableRef.current) {
      dataTableRef.current = $(tableRef.current).DataTable({
        data: posyanduData,
        columns: [
          { 
            data: null,
            render: (data, type, row, meta) => meta.row + 1
          },
          { data: 'nama_posyandu' },
          { data: 'nama_kelurahan' },
          { 
            data: 'rt',
            render: (data) => {
              if (!data) return '-';
              return data.split(',').map(rt => `<span class="rt-tag">RT ${rt.trim()}</span>`).join(' ');
            }
          },
          { 
            data: 'created_at',
            render: (data) => data ? new Date(data).toLocaleDateString('id-ID') : '-'
          },
          {
            data: null,
            render: (data, type, row) => {
              return `
                <div class="action-buttons">
                  <button class="btn-edit" data-id="${row.id}" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                    </svg>
                  </button>
                  <button class="btn-delete" data-id="${row.id}" title="Hapus">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
              `;
            }
          }
        ],
        pageLength: 10,
        lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]],
        language: {
          lengthMenu: 'Tampilkan _MENU_ data',
          info: 'Menampilkan _START_ sampai _END_ dari _TOTAL_ data',
          infoEmpty: 'Tidak ada data',
          infoFiltered: '(difilter dari _MAX_ total data)',
          paginate: {
            first: 'Pertama',
            last: 'Terakhir',
            next: 'Selanjutnya',
            previous: 'Sebelumnya'
          },
          zeroRecords: 'Tidak ada data yang ditemukan'
        },
        dom: '<"table-controls"l>rt<"table-footer"ip>',
        ordering: true,
        searching: false,
        responsive: true
      });

      // Handle action button clicks
      $(tableRef.current).on('click', '.btn-edit', function() {
        const id = $(this).data('id');
        const posyandu = posyanduData.find(p => p.id === id);
        if (posyandu) {
          handleEdit(posyandu);
        }
      });

      $(tableRef.current).on('click', '.btn-delete', function() {
        const id = $(this).data('id');
        handleDelete(id);
      });
    }

    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, [posyanduData]);

  // Update DataTable data
  const updateDataTable = (data) => {
    if (dataTableRef.current) {
      dataTableRef.current.clear();
      dataTableRef.current.rows.add(data);
      dataTableRef.current.draw();
    }
  };

  // Filter functionality
  useEffect(() => {
    if (posyanduData.length > 0) {
      let filteredData = posyanduData;

      // Filter by kelurahan
      if (selectedKelurahan) {
        filteredData = filteredData.filter(p => p.kelurahan_id.toString() === selectedKelurahan);
      }

      // Filter by search term
      if (searchTerm) {
        filteredData = filteredData.filter(p => 
          p.nama_posyandu.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.nama_kelurahan.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.rt.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      updateDataTable(filteredData);
    }
  }, [selectedKelurahan, searchTerm, posyanduData]);

  const handleLogout = () => {
    presenter.handleLogout();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingPosyandu) {
      await presenter.updatePosyandu(editingPosyandu.id, formData);
    } else {
      await presenter.createPosyandu(formData);
    }
  };

  const handleAdd = () => {
    setEditingPosyandu(null);
    setFormData({
      nama_posyandu: '',
      kelurahan_id: '',
      rt: ''
    });
    setShowModal(true);
  };

  const handleEdit = (posyandu) => {
    setEditingPosyandu(posyandu);
    setFormData({
      nama_posyandu: posyandu.nama_posyandu,
      kelurahan_id: posyandu.kelurahan_id.toString(),
      rt: posyandu.rt
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus posyandu ini?')) {
      await presenter.deletePosyandu(id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPosyandu(null);
    setFormData({
      nama_posyandu: '',
      kelurahan_id: '',
      rt: ''
    });
  };

  const handleKelurahanFilter = (e) => {
    setSelectedKelurahan(e.target.value);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Memuat data posyandu...</p>
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
          <a href="/komplikasi" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" fill="currentColor"/>
            </svg>
            Komplikasi
          </a>
          <a href="/posyandu" className="nav-item active">
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
            <h1>Posyandu</h1>
            <p>Kelola data posyandu dan wilayah kerja</p>
          </div>
          <button className="btn-add" onClick={handleAdd}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
            </svg>
            Tambah Posyandu
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

        <div className="posyandu-section">
          <div className="filters-container">
            <div className="search-bar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
              </svg>
              <input
                type="text"
                placeholder="Cari berdasarkan nama posyandu, kelurahan, atau RT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-section">
              <label htmlFor="kelurahan-filter">Kelurahan:</label>
              <select
                id="kelurahan-filter"
                value={selectedKelurahan}
                onChange={handleKelurahanFilter}
              >
                <option value="">Semua Kelurahan</option>
                {kelurahanData.map(kelurahan => (
                  <option key={kelurahan.id} value={kelurahan.id}>
                    {kelurahan.nama_kelurahan}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-card">
            <table ref={tableRef} className="display" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Posyandu</th>
                  <th>Kelurahan</th>
                  <th>Wilayah Kerja</th>
                  <th>Tanggal Dibuat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingPosyandu ? 'Edit Posyandu' : 'Tambah Posyandu'}</h3>
                <button className="modal-close" onClick={handleCloseModal}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label htmlFor="nama_posyandu">Nama Posyandu <span className="required">*</span></label>
                  <input
                    type="text"
                    id="nama_posyandu"
                    name="nama_posyandu"
                    value={formData.nama_posyandu}
                    onChange={handleChange}
                    placeholder="Masukkan nama posyandu"
                    required
                  />
                </div>

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
                    {kelurahanData.map(kelurahan => (
                      <option key={kelurahan.id} value={kelurahan.id}>
                        {kelurahan.nama_kelurahan}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="rt">Wilayah Kerja <span className="required">*</span></label>
                  <input
                    type="text"
                    id="rt"
                    name="rt"
                    value={formData.rt}
                    onChange={handleChange}
                    placeholder="Contoh: 01,02,03"
                    pattern="^(\d{2})(,\d{2})*$"
                    required
                  />
                  <small>Format: 01,02,03 (pisahkan dengan koma)</small>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                    Batal
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Menyimpan...' : (editingPosyandu ? 'Update' : 'Simpan')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Posyandu;