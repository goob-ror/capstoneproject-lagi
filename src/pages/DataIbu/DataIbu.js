import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataIbuPresenter from './DataIbu-presenter';
import Sidebar from '../../components/Sidebar/Sidebar';
import './DataIbu.css';
import $ from 'jquery';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import 'datatables.net';

const DataIbu = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ibuData, setIbuData] = useState([]);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const [presenter] = useState(() => new DataIbuPresenter({
    setLoading,
    setError,
    clearError: () => setError(''),
    displayIbuData: (data) => setIbuData(data),
    updateTableData: (data) => {
      if (dataTableRef.current) {
        dataTableRef.current.clear();
        dataTableRef.current.rows.add(data);
        dataTableRef.current.draw();
      }
    },
    onLogout: () => navigate('/login')
  }));

  useEffect(() => {
    const userData = presenter.getUser();
    setUser(userData);
    presenter.loadIbuData(selectedYear);
  }, [presenter, selectedYear]);

  useEffect(() => {
    const handleView = (id) => {
      navigate(`/detail-ibu/${id}`);
    };

    const handleEdit = (id) => {
      navigate(`/tambah-ibu?id=${id}`);
    };

    const handleDelete = async (id) => {
      if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
        await presenter.deleteIbu(id);
      }
    };

    if (ibuData.length > 0 && tableRef.current && !dataTableRef.current) {
      // Initialize DataTable
      dataTableRef.current = $(tableRef.current).DataTable({
        data: ibuData,
        columns: [
          { 
            data: null,
            render: (data, type, row, meta) => meta.row + 1
          },
          { data: 'nik_ibu' },
          { data: 'nama_lengkap' },
          { 
            data: 'tanggal_lahir',
            render: (data) => data ? new Date(data).toLocaleDateString('id-ID') : '-'
          },
          { data: 'no_hp' },
          { 
            data: 'kelurahan_nama',
            render: (data) => data || '-'
          },
          { 
            data: 'nama_posyandu',
            render: (data) => data || '-'
          },
          { 
            data: 'current_status',
            render: (data) => {
              if (!data) {
                return '<span class="status-badge status-none">Belum Ada Data</span>';
              }
              
              const statusMap = {
                'Hamil': { class: 'status-hamil', text: 'Hamil' },
                'Bersalin': { class: 'status-bersalin', text: 'Bersalin' },
                'Nifas': { class: 'status-nifas', text: 'Nifas' },
                'Selesai': { class: 'status-selesai', text: 'Selesai' },
                'Keguguran': { class: 'status-keguguran', text: 'Keguguran' }
              };
              
              const status = statusMap[data] || { class: 'status-none', text: data };
              return `<span class="status-badge ${status.class}">${status.text}</span>`;
            }
          },
          { data: 'gol_darah' },
          { data: 'pekerjaan' },
          {
            data: null,
            render: (data, type, row) => {
              return `
                <div class="action-buttons">
                  <button class="btn-view" data-id="${row.id}" title="Lihat Detail">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
                    </svg>
                  </button>
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
        dom: '<"table-controls"l>rt<"table-footer"ip>', // Removed 'f' to hide default search
        ordering: true,
        searching: false, // Disable DataTables search, use custom
        responsive: true
      });

      // Handle action button clicks
      $(tableRef.current).on('click', '.btn-view', function() {
        const id = $(this).data('id');
        handleView(id);
      });

      $(tableRef.current).on('click', '.btn-edit', function() {
        const id = $(this).data('id');
        handleEdit(id);
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
  }, [ibuData, navigate, presenter]);

  // Custom Full-Text Search handler
  useEffect(() => {
    if (ibuData.length > 0) {
      // Use presenter's full-text search algorithm
      presenter.searchIbuData(searchTerm);
    }
  }, [searchTerm, ibuData, presenter]);

  const handleLogout = () => {
    presenter.handleLogout();
  };







  const handleAddNew = () => {
    navigate('/tambah-ibu');
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
  };

  // Generate year options (current year and 5 years back)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i <= 5; i++) {
      years.push(currentYear - i);
    }
    return years;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Memuat data ibu...</p>
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
              <h1>Data Ibu</h1>
              <p>Kelola data ibu hamil dengan sistem penugasan Posyandu otomatis</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="filter-section">
                <label htmlFor="year-filter" className="filter-label">Tahun:</label>
                <select 
                  id="year-filter"
                  className="filter-select"
                  value={selectedYear}
                  onChange={handleYearChange}
                >
                  {getYearOptions().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <button className="btn-add" onClick={handleAddNew}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
              </svg>
              Tambah Data Ibu
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <div className="data-ibu-section">
          <div className="search-bar-container">
            <div className="search-bar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
              </svg>
              <input
                type="text"
                placeholder="Cari berdasarkan NIK, nama, kelurahan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-card">
            <table ref={tableRef} className="display" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIK</th>
                  <th>Nama Lengkap</th>
                  <th>Tanggal Lahir</th>
                  <th>No. HP</th>
                  <th>Kelurahan</th>
                  <th>Posyandu</th>
                  <th>Status</th>
                  <th>Gol. Darah</th>
                  <th>Pekerjaan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DataIbu;
