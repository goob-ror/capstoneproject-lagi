import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import KunjunganANCPresenter from './KunjunganANC-presenter';
import Sidebar from '../../components/Sidebar/Sidebar';
import './KunjunganANC.css';
import $ from 'jquery';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import 'datatables.net';

const KunjunganANC = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ancData, setAncData] = useState([]);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const [presenter] = useState(() => new KunjunganANCPresenter({
    setLoading,
    setError,
    clearError: () => setError(''),
    displayAncData: (data) => setAncData(data),
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
    presenter.loadAncData(selectedYear);
  }, [presenter, selectedYear]);

  useEffect(() => {
    const handleEdit = (id) => {
      navigate(`/tambah-anc?id=${id}`);
    };

    const handleDelete = async (id) => {
      if (window.confirm('Apakah Anda yakin ingin menghapus data kunjungan ANC ini?')) {
        await presenter.deleteAnc(id);
      }
    };

    if (ancData.length > 0 && tableRef.current && !dataTableRef.current) {
      dataTableRef.current = $(tableRef.current).DataTable({
        data: ancData,
        columns: [
          {
            data: null,
            render: (data, type, row, meta) => meta.row + 1
          },
          {
            data: 'tanggal_kunjungan',
            render: (data) => data ? new Date(data).toLocaleDateString('id-ID') : '-'
          },
          { data: 'nama_ibu' },
          { data: 'jenis_kunjungan' },
          { data: 'jenis_akses' },
          {
            data: 'hemoglobin',
            render: (data) => {
              if (!data) return '-';
              let badgeClass = 'badge-success';
              let status = 'Normal';
              
              if (data < 8.0) {
                badgeClass = 'badge-danger';
                status = 'Berat';
              } else if (data < 10.0) {
                badgeClass = 'badge-warning';
                status = 'Sedang';
              } else if (data < 11.0) {
                badgeClass = 'badge-warning-light';
                status = 'Ringan';
              }
              
              return `<span class="status-badge ${badgeClass}">${status}</span>`;
            }
          },
          {
            data: 'lila',
            render: (data) => {
              if (!data) return '-';
              const badgeClass = data < 23.5 ? 'badge-orange' : 'badge-success';
              return `<span class="status-badge ${badgeClass}">${data} cm</span>`;
            }
          },
          {
            data: null,
            render: (data, type, row) => {
              if (!row.berat_badan || !row.tinggi_badan) return '-';
              
              const tinggiM = row.tinggi_badan / 100;
              const imt = (row.berat_badan / (tinggiM * tinggiM)).toFixed(1);
              
              let category = '';
              let badgeClass = 'badge-success';
              
              if (imt < 18.5) {
                category = 'Kurus';
                badgeClass = 'badge-warning';
              } else if (imt < 25) {
                category = 'Normal';
                badgeClass = 'badge-success';
              } else if (imt < 30) {
                category = 'Gemuk';
                badgeClass = 'badge-warning';
              } else {
                category = 'Obesitas';
                badgeClass = 'badge-danger';
              }
              
              return `<span class="status-badge ${badgeClass}">${category}</span>`;
            }
          },
          {
            data: 'status_risiko_visit',
            render: (data) => {
              let badgeClass = 'badge-success';
              
              if (data === 'Tinggi') {
                badgeClass = 'badge-danger';
              } else if (data === 'Sedang') {
                badgeClass = 'badge-warning';
              } else if (data === 'Ringan') {
                badgeClass = 'badge-warning-light';
              }
              
              return `<span class="status-badge ${badgeClass}">${data}</span>`;
            }
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
        responsive: true,
        order: [[1, 'desc']]
      });

      $(tableRef.current).on('click', '.btn-edit', function () {
        const id = $(this).data('id');
        handleEdit(id);
      });

      $(tableRef.current).on('click', '.btn-delete', function () {
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
  }, [ancData, navigate, presenter]);

  useEffect(() => {
    if (ancData.length > 0) {
      presenter.searchAncData(searchTerm);
    }
  }, [searchTerm, ancData, presenter]);

  const handleLogout = () => {
    presenter.handleLogout();
  };



  const handleAddNew = () => {
    navigate('/tambah-anc');
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
  };

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
          <p>Memuat data kunjungan ANC...</p>
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
            <h1>Kunjungan ANC</h1>
            <p>Kelola data kunjungan antenatal care</p>
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
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor" />
            </svg>
            Tambah Kunjungan ANC
          </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <div className="anc-section">
          <div className="search-bar-container">
            <div className="search-bar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor" />
              </svg>
              <input
                type="text"
                placeholder="Cari berdasarkan nama ibu, jenis kunjungan, pemeriksa..."
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
                  <th>Tanggal</th>
                  <th>Nama Ibu</th>
                  <th>Jenis</th>
                  <th>Akses</th>
                  <th>Anemia</th>
                  <th>LILA</th>
                  <th>IMT</th>
                  <th>Status Risiko</th>
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

export default KunjunganANC;
