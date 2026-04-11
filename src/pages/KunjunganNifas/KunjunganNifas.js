import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import KunjunganNifasPresenter from './KunjunganNifas-presenter';
import Sidebar from '../../components/Sidebar/Sidebar';
import './KunjunganNifas.css';
import $ from 'jquery';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import 'datatables.net';

const KunjunganNifas = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nifasData, setNifasData] = useState([]);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [showBabyModal, setShowBabyModal] = useState(false);
  const [selectedBabies, setSelectedBabies] = useState([]);

  const [presenter] = useState(() => new KunjunganNifasPresenter({
    setLoading,
    setError,
    clearError: () => setError(''),
    displayNifasData: (data) => setNifasData(data),
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
    presenter.loadNifasData(selectedYear);
  }, [presenter, selectedYear]);

  useEffect(() => {
    const handleEdit = (id) => {
      navigate(`/tambah-nifas?id=${id}`);
    };

    const handleDelete = async (id) => {
      if (window.confirm('Apakah Anda yakin ingin menghapus data kunjungan nifas ini?')) {
        await presenter.deleteNifas(id);
      }
    };

    const handleShowBabies = (babies) => {
      setSelectedBabies(babies);
      setShowBabyModal(true);
    };

    if (nifasData.length > 0 && tableRef.current && !dataTableRef.current) {
      dataTableRef.current = $(tableRef.current).DataTable({
        data: nifasData,
        columns: [
          {
            data: null,
            render: (data, type, row, meta) => meta.row + 1
          },
          {
            data: 'jenis_kunjungan',
            render: (data) => {
              if (!data) return '-';
              const badgeClass = data === 'KF1' ? 'badge-primary' :
                data === 'KF2' ? 'badge-info' :
                data === 'KF3' ? 'badge-warning' : 'badge-success';
              return `<span class="visit-badge ${badgeClass}">${data}</span>`;
            }
          },
          {
            data: 'tanggal_kunjungan',
            render: (data) => data ? new Date(data).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : '-'
          },
          { data: 'nama_ibu' },
          {
            data: 'berat_badan',
            render: (data) => data ? `${data} kg` : '-'
          },
          {
            data: 'babies',
            render: (data, type, row) => {
              if (!data || data.length === 0) return '-';
              if (data.length === 1) {
                const baby = data[0];
                return baby.berat_badan ? `${baby.berat_badan} kg` : '-';
              }
              return `<button class="btn-show-babies" data-row-id="${row.id}" style="color: #22C55E; text-decoration: underline; cursor: pointer; border: none; background: none; font-size: 14px;">${data.length} bayi</button>`;
            }
          },
          {
            data: 'babies',
            render: (data, type, row) => {
              if (!data || data.length === 0) return '-';
              if (data.length === 1) {
                const baby = data[0];
                return baby.panjang_badan ? `${baby.panjang_badan} cm` : '-';
              }
              return `<button class="btn-show-babies" data-row-id="${row.id}" style="color: #22C55E; text-decoration: underline; cursor: pointer; border: none; background: none; font-size: 14px;">${data.length} bayi</button>`;
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
        order: [[2, 'desc']]
      });

      $(tableRef.current).on('click', '.btn-edit', function () {
        const id = $(this).data('id');
        handleEdit(id);
      });

      $(tableRef.current).on('click', '.btn-delete', function () {
        const id = $(this).data('id');
        handleDelete(id);
      });

      $(tableRef.current).on('click', '.btn-show-babies', function () {
        const rowId = $(this).data('row-id');
        const rowData = nifasData.find(item => item.id === rowId);
        if (rowData && rowData.babies) {
          handleShowBabies(rowData.babies);
        }
      });
    }

    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, [nifasData, navigate, presenter]);

  useEffect(() => {
    if (dataTableRef.current) {
      presenter.searchNifasData(searchTerm);
    }
  }, [searchTerm, presenter]);

  const handleLogout = () => {
    presenter.handleLogout();
  };

  const handleAddNew = () => {
    navigate('/tambah-nifas');
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
          <p>Memuat data kunjungan nifas...</p>
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
            <h1>Kunjungan Nifas</h1>
            <p>Kelola data kunjungan masa nifas</p>
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
              Tambah Kunjungan Nifas
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <div className="nifas-section">
          <div className="search-bar-container">
            <div className="search-bar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor" />
              </svg>
              <input
                type="text"
                placeholder="Cari berdasarkan nama ibu, jenis kunjungan..."
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
                  <th>Jenis</th>
                  <th>Tanggal</th>
                  <th>Nama Ibu</th>
                  <th>BB Ibu</th>
                  <th>BB Bayi</th>
                  <th>Panjang Bayi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
              </tbody>
            </table>
          </div>
        </div>

        {/* Baby Modal */}
        {showBabyModal && (
          <div className="modal-overlay" onClick={() => setShowBabyModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Data Bayi</h3>
                <button className="modal-close" onClick={() => setShowBabyModal(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                {selectedBabies.map((baby, index) => (
                  <div key={index} className="baby-info-card">
                    <h4>Bayi {baby.urutan_bayi}</h4>
                    <div className="baby-info-grid">
                      <div className="baby-info-item">
                        <span className="baby-info-label">Berat Badan:</span>
                        <span className="baby-info-value">{baby.berat_badan ? `${baby.berat_badan} kg` : '-'}</span>
                      </div>
                      <div className="baby-info-item">
                        <span className="baby-info-label">Panjang Badan:</span>
                        <span className="baby-info-value">{baby.panjang_badan ? `${baby.panjang_badan} cm` : '-'}</span>
                      </div>
                      <div className="baby-info-item">
                        <span className="baby-info-label">Pemberian ASI:</span>
                        <span className="baby-info-value">{baby.pemberian_asi || '-'}</span>
                      </div>
                      <div className="baby-info-item">
                        <span className="baby-info-label">Kondisi:</span>
                        <span className={`baby-info-value badge ${baby.kondisi_bayi === 'Sehat' ? 'badge-success' : baby.kondisi_bayi === 'Sakit' ? 'badge-warning' : 'badge-danger'}`}>
                          {baby.kondisi_bayi || '-'}
                        </span>
                      </div>
                      {baby.keterangan && (
                        <div className="baby-info-item full-width">
                          <span className="baby-info-label">Keterangan:</span>
                          <span className="baby-info-value">{baby.keterangan}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default KunjunganNifas;
