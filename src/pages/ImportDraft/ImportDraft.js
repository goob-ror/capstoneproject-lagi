import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import AuthModel from '../../services/AuthModel';
import Swal from 'sweetalert2';
import {
  loadDrafts,
  updateDraft,
  discardDraft,
  removeDraft,
  clearAllDrafts,
} from '../../utils/import-draft-store';
import './ImportDraft.css';

// ── NIK Fix Modal ─────────────────────────────────────────────────────────────
const NikFixModal = ({ draft, onSave, onClose }) => {
  const [nik, setNik] = useState(draft.ibu?.nik_ibu || '');

  const isValid = /^\d{16}$/.test(nik.trim());

  return (
    <div className="nik-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="nik-modal">
        <h3>Perbaiki NIK</h3>
        <p className="modal-subtitle">{draft.ibu?.nama_lengkap || '—'}</p>

        {draft.ibu?.no_hp && (
          <div className="nik-modal-info">
            📞 No. HP pasien: <strong>{draft.ibu.no_hp}</strong>
            <br />
            <span style={{ fontSize: 11, opacity: 0.8 }}>Hubungi pasien untuk konfirmasi NIK</span>
          </div>
        )}

        <div className="nik-modal-field">
          <label>NIK (16 digit)</label>
          <input
            type="text"
            maxLength={16}
            placeholder="Masukkan 16 digit NIK"
            value={nik}
            onChange={e => setNik(e.target.value.replace(/\D/g, ''))}
            autoFocus
          />
          {nik.length > 0 && !isValid && (
            <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block' }}>
              NIK harus tepat 16 digit angka ({nik.length}/16)
            </span>
          )}
        </div>

        <div className="nik-modal-actions">
          <button className="btn-nik-cancel" onClick={onClose}>Batal</button>
          <button
            className="btn-nik-save"
            disabled={!isValid}
            onClick={() => onSave(nik.trim())}
          >
            Simpan NIK
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const ImportDraft = () => {
  const authModel = new AuthModel();
  const user = authModel.getUser();

  const [drafts, setDrafts] = useState([]);
  const [fixingDraft, setFixingDraft] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');

  const reload = () => setDrafts(loadDrafts());

  useEffect(() => { reload(); }, []);

  const handleLogout = () => {
    authModel.removeToken();
    authModel.removeUser();
    window.location.href = '/login';
  };

  const handleFixNik = (draft) => {
    setFixingDraft(draft);
  };

  const handleSaveNik = (draftId, newNik) => {
    updateDraft(draftId, {
      ibu: { ...fixingDraft.ibu, nik_ibu: newNik },
      _draftStatus: 'resolved',
      _resolvedAt: new Date().toISOString(),
      _warnings: (fixingDraft._warnings || []).filter(w => w.field !== 'nik'),
    });
    setFixingDraft(null);
    reload();
    Swal.fire({
      icon: 'success',
      title: 'NIK Disimpan',
      text: `NIK ${newNik} berhasil disimpan. Data siap diimpor ulang.`,
      timer: 2000,
      showConfirmButton: false,
      fontFamily: 'Montserrat, sans-serif',
    });
  };

  const handleDiscard = async (draft) => {
    const result = await Swal.fire({
      title: 'Buang data ini?',
      text: `${draft.ibu?.nama_lengkap || 'Data ini'} akan ditandai sebagai dibuang.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Buang',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      fontFamily: 'Montserrat, sans-serif',
    });
    if (result.isConfirmed) {
      discardDraft(draft._draftId);
      reload();
    }
  };

  const handleRemove = async (draft) => {
    const result = await Swal.fire({
      title: 'Hapus permanen?',
      text: 'Data ini akan dihapus dari draf dan tidak dapat dipulihkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
    });
    if (result.isConfirmed) {
      removeDraft(draft._draftId);
      reload();
    }
  };

  const handleClearAll = async () => {
    const result = await Swal.fire({
      title: 'Hapus semua draf?',
      text: 'Semua data draf akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus Semua',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#DC2626',
    });
    if (result.isConfirmed) {
      clearAllDrafts();
      reload();
    }
  };

  const REASON_LABELS = {
    nik_missing:    'NIK Kosong',
    user_deferred:  'Ditunda User',
    has_errors:     'Ada Error',
    default:        'Draf',
  };

  const filtered = drafts.filter(d =>
    statusFilter === 'all' ? true : d._draftStatus === statusFilter
  );

  const pendingCount = drafts.filter(d => d._draftStatus === 'pending').length;

  return (
    <div className="dashboard-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <div className="content-header">
          <div>
            <h1>Draf Import</h1>
            <p>Data yang ditunda atau memerlukan perbaikan sebelum diimpor</p>
          </div>
          <a
            href="/import-data"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', background: '#22C55E', color: 'white',
              borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}
          >
            ← Kembali ke Import
          </a>
        </div>

        <div className="draft-section">
          <div className="draft-toolbar">
            <span className="draft-count-badge">
              ⏳ {pendingCount} draf menunggu
            </span>

            <select
              className="filter-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '7px 10px', fontSize: 12 }}
            >
              <option value="all">Semua</option>
              <option value="pending">Menunggu</option>
              <option value="resolved">Selesai</option>
              <option value="discarded">Dibuang</option>
            </select>

            {drafts.length > 0 && (
              <button className="btn-clear-drafts" onClick={handleClearAll}>
                🗑 Hapus Semua
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
              </svg>
              <p>{statusFilter === 'pending' ? 'Tidak ada draf yang menunggu.' : 'Tidak ada data.'}</p>
            </div>
          ) : (
            <div className="draft-table-wrapper">
              <table className="draft-table">
                <thead>
                  <tr>
                    <th>Nama Ibu</th>
                    <th>NIK</th>
                    <th>No. HP</th>
                    <th>Kunjungan</th>
                    <th>Tgl Kunjungan</th>
                    <th>Alasan Draf</th>
                    <th>Status</th>
                    <th>Sumber File</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(draft => (
                    <tr key={draft._draftId}>
                      <td style={{ fontWeight: 500 }}>{draft.ibu?.nama_lengkap || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {draft.ibu?.nik_ibu || <span style={{ color: '#DC2626', fontWeight: 600 }}>KOSONG</span>}
                      </td>
                      <td>{draft.ibu?.no_hp || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{draft.anc?.jenis_kunjungan || '—'}</td>
                      <td>{draft.anc?.tanggal_kunjungan?.substring(0, 10) || '—'}</td>
                      <td>
                        <span className="draft-reason-badge">
                          {REASON_LABELS[draft._draftReason] || draft._draftReason}
                        </span>
                      </td>
                      <td>
                        <span className={`draft-reason-badge draft-status-${draft._draftStatus}`}>
                          {draft._draftStatus === 'pending'   ? 'Menunggu' :
                           draft._draftStatus === 'resolved'  ? 'Selesai'  : 'Dibuang'}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: '#6B7280' }}>{draft._sourceFile || '—'}</td>
                      <td>
                        <div className="draft-actions">
                          {draft._draftStatus === 'pending' && (
                            <>
                              {draft._draftReason === 'nik_missing' && (
                                <button
                                  className="btn-draft-fix"
                                  onClick={() => handleFixNik(draft)}
                                >
                                  Isi NIK
                                </button>
                              )}
                              <button
                                className="btn-draft-discard"
                                onClick={() => handleDiscard(draft)}
                              >
                                Buang
                              </button>
                            </>
                          )}
                          <button
                            className="btn-draft-discard"
                            style={{ background: '#F3F4F6', color: '#6B7280' }}
                            onClick={() => handleRemove(draft)}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {fixingDraft && (
        <NikFixModal
          draft={fixingDraft}
          onSave={(nik) => handleSaveNik(fixingDraft._draftId, nik)}
          onClose={() => setFixingDraft(null)}
        />
      )}
    </div>
  );
};

export default ImportDraft;
