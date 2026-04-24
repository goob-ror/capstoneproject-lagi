import { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import AuthModel from '../../services/AuthModel';
import Swal from 'sweetalert2';
import apiClient from '../../services/apiClient';
import {
  processImportFile,
  loadImportPreview,
  clearImportPreview,
} from '../../utils/import-processor';
import { IMPORT_DEFAULTS } from '../../utils/import-defaulter-fill';
import { addToDrafts, pendingDraftCount } from '../../utils/import-draft-store';
import { applyRiskScore } from '../../utils/import-risk-scorer';
import './ImportData.css';

const PAGE_SIZE = 20;

// ── Location Modal ────────────────────────────────────────────────────────────
const LocationModal = ({ record, onSave, onClose }) => {
  const [kelurahanList, setKelurahanList] = useState([]);
  const [rtList, setRtList] = useState([]);
  const [selectedKelurahan, setSelectedKelurahan] = useState('');
  const [selectedRt, setSelectedRt] = useState('');
  const [posyandu, setPosyandu] = useState(null);
  const [loadingRt, setLoadingRt] = useState(false);
  const [loadingPosyandu, setLoadingPosyandu] = useState(false);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Load kelurahan list on mount
  useEffect(() => {
    fetch('/api/kelurahan', { headers })
      .then(r => r.json())
      .then(d => setKelurahanList(d.data || []))
      .catch(() => {});
  }, []); // eslint-disable-line

  // Load RT options when kelurahan changes
  useEffect(() => {
    if (!selectedKelurahan) { setRtList([]); setSelectedRt(''); setPosyandu(null); return; }
    setLoadingRt(true);
    fetch(`/api/kelurahan/rt-options/${selectedKelurahan}`, { headers })
      .then(r => r.json())
      .then(d => { setRtList(d.data?.availableRT || []); setSelectedRt(''); setPosyandu(null); })
      .catch(() => {})
      .finally(() => setLoadingRt(false));
  }, [selectedKelurahan]); // eslint-disable-line

  // Auto-assign posyandu when RT changes
  useEffect(() => {
    if (!selectedKelurahan || !selectedRt) { setPosyandu(null); return; }
    setLoadingPosyandu(true);
    fetch(`/api/kelurahan/posyandu-assignment/${selectedKelurahan}/${selectedRt}`, { headers })
      .then(r => r.json())
      .then(d => setPosyandu(d.data || null))
      .catch(() => setPosyandu(null))
      .finally(() => setLoadingPosyandu(false));
  }, [selectedKelurahan, selectedRt]); // eslint-disable-line

  const canSave = selectedKelurahan && selectedRt;

  const handleSave = () => {
    onSave({
      kelurahan_id: parseInt(selectedKelurahan),
      kelurahan_nama: kelurahanList.find(k => String(k.id) === selectedKelurahan)?.nama_kelurahan || '',
      rt: parseInt(selectedRt),
      posyandu_id: posyandu?.id || null,
      posyandu_nama: posyandu?.nama_posyandu || null,
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="location-modal">
        <h3>Atur Lokasi</h3>
        <p className="modal-subtitle">
          {record.ibu?.nama_lengkap} — {record.ibu?.nik_ibu}
        </p>

        <div className="modal-field">
          <label>Kelurahan</label>
          <select value={selectedKelurahan} onChange={e => setSelectedKelurahan(e.target.value)}>
            <option value="">— Pilih Kelurahan —</option>
            {kelurahanList.map(k => (
              <option key={k.id} value={k.id}>{k.nama_kelurahan}</option>
            ))}
          </select>
        </div>

        <div className="modal-field">
          <label>RT</label>
          <select
            value={selectedRt}
            onChange={e => setSelectedRt(e.target.value)}
            disabled={!selectedKelurahan || loadingRt}
          >
            <option value="">— Pilih RT —</option>
            {rtList.map(rt => (
              <option key={rt} value={rt}>RT {rt}</option>
            ))}
          </select>
        </div>

        <div className="modal-field">
          <label>Posyandu (otomatis)</label>
          {loadingPosyandu ? (
            <div style={{ fontSize: 12, color: '#6B7280', padding: '8px 0' }}>Mencari posyandu...</div>
          ) : posyandu ? (
            <div className="posyandu-result">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
              </svg>
              {posyandu.nama_posyandu}
            </div>
          ) : selectedRt ? (
            <div className="posyandu-result not-found">Tidak ada posyandu untuk RT ini</div>
          ) : (
            <div style={{ fontSize: 12, color: '#9CA3AF', padding: '8px 0' }}>Pilih RT untuk melihat posyandu</div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-modal-cancel" onClick={onClose}>Batal</button>
          <button className="btn-modal-save" onClick={handleSave} disabled={!canSave}>
            Simpan Lokasi
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Inline Edit Modal ─────────────────────────────────────────────────────────
// Pops up when user clicks a warning chip for NIK, BB, or Tinggi Badan.
const EDITABLE_FIELDS = {
  nik: {
    label: 'NIK',
    inputType: 'text',
    placeholder: '16 digit NIK',
    validate: v => /^\d{16}$/.test(v.trim()) ? null : 'NIK harus tepat 16 digit angka',
    hint: (record) => record.ibu?.no_hp
      ? `📞 No. HP pasien: ${record.ibu.no_hp} — hubungi untuk konfirmasi NIK`
      : null,
  },
  bb: {
    label: 'Berat Badan (kg)',
    inputType: 'number',
    placeholder: 'Contoh: 65.5',
    validate: v => {
      const n = parseFloat(v);
      if (isNaN(n) || n <= 0 || n > 200) return 'Masukkan berat badan yang valid (1–200 kg)';
      return null;
    },
    hint: () => null,
  },
  tinggi_badan: {
    label: 'Tinggi Badan (cm)',
    inputType: 'number',
    placeholder: 'Contoh: 158',
    validate: v => {
      const n = parseFloat(v);
      if (isNaN(n) || n < 100 || n > 220) return 'Masukkan tinggi badan yang valid (100–220 cm)';
      return null;
    },
    hint: () => null,
  },
};

const InlineEditModal = ({ record, field, onSave, onClose }) => {
  const config = EDITABLE_FIELDS[field];
  const currentValue =
    field === 'nik'          ? (record.ibu?.nik_ibu || '') :
    field === 'bb'           ? (record.anc?.berat_badan || '') :
    field === 'tinggi_badan' ? (record.ibu?.tinggi_badan || '') : '';

  const [value, setValue] = useState(String(currentValue));
  const [validationError, setValidationError] = useState('');

  const hint = config.hint(record);

  const handleSave = () => {
    const err = config.validate(value);
    if (err) { setValidationError(err); return; }
    onSave(field, value.trim());
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="location-modal" style={{ maxWidth: 400 }}>
        <h3>Isi {config.label}</h3>
        <p className="modal-subtitle">{record.ibu?.nama_lengkap} — Baris {record._rowIndex}</p>

        {hint && (
          <div style={{
            background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8,
            padding: '10px 14px', fontSize: 12, color: '#15803D', marginBottom: 16,
          }}>
            {hint}
          </div>
        )}

        <div className="modal-field">
          <label>{config.label}</label>
          <input
            type={config.inputType}
            placeholder={config.placeholder}
            value={value}
            autoFocus
            onChange={e => { setValue(e.target.value); setValidationError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            style={{
              width: '100%', padding: '9px 12px', border: '2px solid #E5E7EB',
              borderRadius: 8, fontSize: 13, fontFamily: 'Montserrat, sans-serif',
              boxSizing: 'border-box',
            }}
          />
          {validationError && (
            <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block' }}>
              {validationError}
            </span>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-modal-cancel" onClick={onClose}>Batal</button>
          <button className="btn-modal-save" onClick={handleSave}>Simpan</button>
        </div>
      </div>
    </div>
  );
};

// ── Status badge component ────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    new:               { cls: 'badge-new',       label: '✓ Baru' },
    error:             { cls: 'badge-error',      label: '✕ Error' },
    duplicate_in_file: { cls: 'badge-duplicate',  label: '⚠ Duplikat' },
    skip:              { cls: 'badge-skip',        label: '— Lewati' },
  };
  const { cls, label } = map[status] || { cls: 'badge-skip', label: status };
  return <span className={`import-badge ${cls}`}>{label}</span>;
};

// ── Warning chips (clickable for editable fields) ────────────────────────────
const CLICKABLE_FIELDS = new Set(['nik', 'bb', 'tinggi_badan']);

const WarningChips = ({ warnings, onChipClick }) => {
  if (!warnings || warnings.length === 0) return null;
  return (
    <div className="warning-chips">
      {warnings.map((w, i) => {
        const isClickable = CLICKABLE_FIELDS.has(w.field);
        return (
          <span
            key={i}
            className={`warning-chip chip-${w.level}${isClickable ? ' chip-clickable' : ''}`}
            title={isClickable ? `Klik untuk mengisi ${w.field}` : w.message}
            onClick={isClickable && onChipClick ? (e) => { e.stopPropagation(); onChipClick(w.field); } : undefined}
          >
            {isClickable && '✏ '}{w.message}
          </span>
        );
      })}
    </div>
  );
};

// ── Cell renderer ─────────────────────────────────────────────────────────────
const Cell = ({ value, warnFields, field }) => {
  if (value === null || value === undefined || value === '') {
    return <span className="cell-null">—</span>;
  }
  const hasWarn = warnFields?.some(w => w.field === field && w.level === 'warning');
  const hasErr  = warnFields?.some(w => w.field === field && w.level === 'error');
  if (hasErr)  return <span className="cell-highlight-error">{String(value)}</span>;
  if (hasWarn) return <span className="cell-highlight-warn">{String(value)}</span>;
  return <>{String(value)}</>;
};

// ── Sortable header ───────────────────────────────────────────────────────────
const SortTh = ({ label, sortKey, currentSort, onSort }) => {
  const isActive = currentSort.key === sortKey;
  return (
    <th onClick={() => onSort(sortKey)}>
      {label}
      <span className={`sort-icon${isActive ? ' active' : ''}`}>
        {isActive ? (currentSort.dir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
      </span>
    </th>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const ImportData = () => {
  const authModel = new AuthModel();
  const user = authModel.getUser();

  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  // Phased loader: null | 'parsing' | 'kunjungan' | 'risiko' | 'done'
  const [processingPhase, setProcessingPhase] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [previewData, setPreviewData] = useState(null);

  // Defaults overrides (editable in UI)
  const [defaults, setDefaults] = useState({
    forkey_bidan: IMPORT_DEFAULTS.forkey_bidan,
    jenis_akses: IMPORT_DEFAULTS.jenis_akses,
    pemeriksa: IMPORT_DEFAULTS.pemeriksa,
    status_risiko_visit: IMPORT_DEFAULTS.status_risiko_visit,
    gravida: IMPORT_DEFAULTS.gravida,
    partus: IMPORT_DEFAULTS.partus,
    abortus: IMPORT_DEFAULTS.abortus,
    buku_kia: IMPORT_DEFAULTS.buku_kia,
    pekerjaan: IMPORT_DEFAULTS.pekerjaan,
    pendidikan: IMPORT_DEFAULTS.pendidikan,
  });

  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState({ key: '_rowIndex', dir: 'asc' });
  const [page, setPage] = useState(1);

  // Location assignments: { [rowIndex]: { kelurahan_id, kelurahan_nama, rt, posyandu_id, posyandu_nama } }
  const [locationMap, setLocationMap] = useState({});
  // Modal state
  const [modalRecord, setModalRecord] = useState(null);
  // Defaults panel collapsed by default
  const [showDefaults, setShowDefaults] = useState(false);
  // Inline field edit: { record, field }
  const [inlineEdit, setInlineEdit] = useState(null);

  // Load cached preview on mount
  useEffect(() => {
    const cached = loadImportPreview();
    if (cached) setPreviewData(cached);
  }, []);

  const handleLogout = () => {
    authModel.removeToken();
    authModel.removeUser();
    window.location.href = '/login';
  };

  // ── File selection ──────────────────────────────────────────────────────────
  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    setSelectedFile(file);
    setError('');
    setSuccessMsg('');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  // ── Process file ────────────────────────────────────────────────────────────
  const handleProcess = async () => {
    if (!selectedFile) { setError('Pilih file Excel terlebih dahulu.'); return; }
    setProcessing(true);
    setProcessingPhase('parsing');
    setError('');
    setSuccessMsg('');
    try {
      // Advance phase labels with small delays so the user sees each step
      const phaseTimer1 = setTimeout(() => setProcessingPhase('kunjungan'), 400);
      const phaseTimer2 = setTimeout(() => setProcessingPhase('risiko'), 900);

      const result = await processImportFile(selectedFile, defaults);

      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      setProcessingPhase('done');

      // Brief pause on "done" before showing the table
      await new Promise(r => setTimeout(r, 350));

      setPreviewData(result);
      setPage(1);
      setSearchTerm('');
      setStatusFilter('all');
      setSuccessMsg(`File berhasil diproses. ${result.summary.importable} baris siap diimpor dari ${result.summary.total} total baris.`);
    } catch (err) {
      setError(err.message || 'Gagal memproses file.');
    } finally {
      setProcessing(false);
      setProcessingPhase(null);
    }
  };

  // ── Clear preview ───────────────────────────────────────────────────────────
  const handleClear = () => {
    clearImportPreview();
    setPreviewData(null);
    setSelectedFile(null);
    setError('');
    setSuccessMsg('');
    setPage(1);
    setLocationMap({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Sorting ─────────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    setSort(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
    setPage(1);
  };

  // ── Inline field save ───────────────────────────────────────────────────────
  const handleInlineSave = (rowIndex, field, value) => {
    setPreviewData(prev => {
      const updated = {
        ...prev,
        records: prev.records.map(r => {
          if (r._rowIndex !== rowIndex) return r;

          // Apply the value to the correct nested path
          let patched = { ...r };
          if (field === 'nik') {
            patched = { ...patched, ibu: { ...patched.ibu, nik_ibu: value } };
          } else if (field === 'bb') {
            patched = { ...patched, anc: { ...patched.anc, berat_badan: parseFloat(value) } };
          } else if (field === 'tinggi_badan') {
            patched = { ...patched, ibu: { ...patched.ibu, tinggi_badan: parseFloat(value) } };
          }

          // Remove the resolved warning for this field
          patched._warnings = (patched._warnings || []).filter(w => w.field !== field);

          // Re-run risk scoring — the edited value may change the risk level
          // (e.g. filling in BB doesn't affect risk, but TD or HB edits would)
          patched = applyRiskScore({ ...patched, _warnings: patched._warnings });

          // Re-evaluate import status — if no more errors, promote to 'new'
          const stillHasErrors = patched._warnings.some(w => w.level === 'error');
          if (!stillHasErrors && patched._importStatus === 'error') {
            patched._importStatus = 'new';
          }

          return patched;
        }),
      };

      // Recalculate summary
      updated.summary = {
        ...updated.summary,
        errors: updated.records.filter(r => r._importStatus === 'error').length,
        importable: updated.records.filter(r =>
          r._importStatus !== 'error' && r._importStatus !== 'duplicate_in_file'
        ).length,
      };

      localStorage.setItem('ibundacare_import_preview', JSON.stringify(updated));
      return updated;
    });
    setInlineEdit(null);
  };
  const filteredRecords = previewData?.records
    ? previewData.records
        .filter(r => {
          if (statusFilter === 'warning') {
            return r._warnings?.some(w => w.level === 'warning');
          }
          if (statusFilter !== 'all' && r._importStatus !== statusFilter) return false;
          if (!searchTerm) return true;
          const q = searchTerm.toLowerCase();
          return (
            (r.ibu?.nik_ibu || '').toLowerCase().includes(q) ||
            (r.ibu?.nama_lengkap || '').toLowerCase().includes(q) ||
            (r.anc?.jenis_kunjungan || '').toLowerCase().includes(q)
          );
        })
        .sort((a, b) => {
          const { key, dir } = sort;
          const getVal = (rec) => {
            if (key === '_rowIndex') return rec._rowIndex;
            if (key === 'nik') return rec.ibu?.nik_ibu || '';
            if (key === 'nama') return rec.ibu?.nama_lengkap || '';
            if (key === 'kunjungan') return rec.anc?.jenis_kunjungan || '';
            if (key === 'tanggal') return rec.anc?.tanggal_kunjungan || '';
            if (key === 'hpht') return rec.kehamilan?.haid_terakhir || '';
            if (key === 'status') return rec._importStatus || '';
            if (key === 'risiko') {
              const order = { 'Tinggi': 4, 'Sedang': 3, 'Ringan': 2, 'Normal': 1 };
              return order[rec.anc?.status_risiko_visit] || 0;
            }
            return '';
          };
          const va = getVal(a), vb = getVal(b);
          if (va < vb) return dir === 'asc' ? -1 : 1;
          if (va > vb) return dir === 'asc' ? 1 : -1;
          return 0;
        })
    : [];

  const totalPages = Math.ceil(filteredRecords.length / PAGE_SIZE);
  const pagedRecords = filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const { summary } = previewData || {};

  // ── Commit validation chain ───────────────────────────────────────────────
  const handleCommit = async () => {
    const records = previewData?.records || [];
    const fileName = previewData?.fileName || '';

    // ── Step 1: Block on errors ─────────────────────────────────────────────
    const errorRecords = records.filter(r => r._importStatus === 'error');
    if (errorRecords.length > 0) {
      // Build a breakdown of error causes for the dialog
      const nikErrors   = errorRecords.filter(r => r._warnings?.some(w => w.field === 'nik'       && w.level === 'error'));
      const namaErrors  = errorRecords.filter(r => r._warnings?.some(w => w.field === 'nama'      && w.level === 'error'));
      const hphtErrors  = errorRecords.filter(r => r._warnings?.some(w => w.field === 'hpht'      && w.level === 'error'));
      const tglErrors   = errorRecords.filter(r => r._warnings?.some(w => w.field === 'tanggal'   && w.level === 'error'));
      const kunjErrors  = errorRecords.filter(r => r._warnings?.some(w => w.field === 'kunjungan' && w.level === 'error'));

      const breakdownRows = [
        nikErrors.length   && `<tr><td style="padding:3px 8px;color:#374151">NIK kosong</td><td style="padding:3px 8px;font-weight:700;color:#DC2626">${nikErrors.length} baris</td></tr>`,
        namaErrors.length  && `<tr><td style="padding:3px 8px;color:#374151">Nama kosong</td><td style="padding:3px 8px;font-weight:700;color:#DC2626">${namaErrors.length} baris</td></tr>`,
        hphtErrors.length  && `<tr><td style="padding:3px 8px;color:#374151">HPHT kosong</td><td style="padding:3px 8px;font-weight:700;color:#DC2626">${hphtErrors.length} baris</td></tr>`,
        tglErrors.length   && `<tr><td style="padding:3px 8px;color:#374151">Tanggal kunjungan kosong</td><td style="padding:3px 8px;font-weight:700;color:#DC2626">${tglErrors.length} baris</td></tr>`,
        kunjErrors.length  && `<tr><td style="padding:3px 8px;color:#374151">Jenis kunjungan tidak valid</td><td style="padding:3px 8px;font-weight:700;color:#DC2626">${kunjErrors.length} baris</td></tr>`,
      ].filter(Boolean).join('');

      const result = await Swal.fire({
        title: `${errorRecords.length} Data Bermasalah`,
        html: `
          <p style="font-size:14px;color:#374151;margin-bottom:12px">
            Terdapat <strong>${errorRecords.length} baris</strong> dengan error yang tidak dapat diimpor langsung.
          </p>
          ${breakdownRows ? `
            <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:13px">
              ${breakdownRows}
            </table>
          ` : ''}
          <p style="font-size:13px;color:#6B7280">
            Pindahkan semua data bermasalah ke <strong>Draf</strong> untuk diperbaiki nanti,
            atau lihat dan perbaiki langsung di tabel preview.
          </p>
        `,
        icon: 'error',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: `Pindah Semua ke Draf (${errorRecords.length})`,
        denyButtonText: 'Lihat Data Error',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#F59E0B',
        denyButtonColor: '#DC2626',
        cancelButtonColor: '#6B7280',
      });

      if (result.isConfirmed) {
        // Draft all error records with their specific reason
        const toNikDraft   = nikErrors.filter(r => !namaErrors.includes(r) && !hphtErrors.includes(r));
        const toOtherDraft = errorRecords.filter(r => !toNikDraft.includes(r));

        if (toNikDraft.length)   addToDrafts(toNikDraft,   'nik_missing', fileName);
        if (toOtherDraft.length) addToDrafts(toOtherDraft, 'has_errors',  fileName);

        // Remove all error rows from the live preview
        const draftedIndexes = new Set(errorRecords.map(r => r._rowIndex));
        const updatedRecords = records.filter(r => !draftedIndexes.has(r._rowIndex));
        const updatedPreview = {
          ...previewData,
          records: updatedRecords,
          summary: {
            ...previewData.summary,
            total: updatedRecords.length,
            errors: 0,
            importable: updatedRecords.filter(r =>
              r._importStatus !== 'error' && r._importStatus !== 'duplicate_in_file'
            ).length,
          },
        };
        localStorage.setItem('ibundacare_import_preview', JSON.stringify(updatedPreview));
        setPreviewData(updatedPreview);

        Swal.fire({
          icon: 'success',
          title: 'Dipindahkan ke Draf',
          html: `${errorRecords.length} data dipindahkan ke <a href="/import-draft" style="color:#22C55E;font-weight:600">halaman Draf</a> untuk diperbaiki.`,
          confirmButtonColor: '#22C55E',
        });
        return;
      } else if (result.isDenied) {
        setStatusFilter('error');
        setPage(1);
        return;
      } else {
        return;
      }
    }

    // ── Step 2: Warn on "Perlu Perhatian" ───────────────────────────────────
    const warningRecords = records.filter(r =>
      r._importStatus !== 'error' &&
      r._warnings?.some(w => w.level === 'warning')
    );
    if (warningRecords.length > 0) {
      const result = await Swal.fire({
        title: `${warningRecords.length} Data Perlu Perhatian`,
        html: `
          <p style="font-size:14px;color:#374151;margin-bottom:8px">
            Terdapat <strong>${warningRecords.length} baris</strong> dengan peringatan (tekanan darah tinggi, HB rendah, skrining reaktif, dll).
          </p>
          <p style="font-size:13px;color:#6B7280">Apakah Anda ingin memeriksa ulang atau tetap melanjutkan?</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Lewati',
        cancelButtonText: 'Cek Ulang',
        confirmButtonColor: '#22C55E',
        cancelButtonColor: '#F59E0B',
      });

      if (!result.isConfirmed) {
        // User chose "Cek Ulang" — show warning filter
        setStatusFilter('warning');
        setPage(1);
        return;
      }
    }

    // ── Step 3: Warn on missing Kelurahan/Posyandu ──────────────────────────
    const importableRecords = records.filter(r =>
      r._importStatus !== 'error' && r._importStatus !== 'duplicate_in_file'
    );
    const missingLocation = importableRecords.filter(r => {
      const loc = locationMap[r._rowIndex];
      return !loc?.kelurahan_id;
    });

    if (missingLocation.length > 0) {
      const result = await Swal.fire({
        title: 'Data Lokasi Tidak Lengkap',
        html: `
          <p style="font-size:14px;color:#374151;margin-bottom:8px">
            <strong>${missingLocation.length} pasien</strong> belum memiliki data Kelurahan / RT / Posyandu.
          </p>
          <p style="font-size:13px;color:#6B7280">
            Pasien tanpa lokasi tidak akan terhubung ke Posyandu secara otomatis.
          </p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Lewati',
        cancelButtonText: 'Atur Lokasi Dulu',
        confirmButtonColor: '#22C55E',
        cancelButtonColor: '#F59E0B',
      });

      if (!result.isConfirmed) return;

      // User chose "Lewati" — confirm once more
      const confirm2 = await Swal.fire({
        title: 'Apakah Anda yakin?',
        text: 'Data Posyandu tidak akan dipasang ke pasien yang tidak memiliki lokasi.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Lanjutkan Tanpa Posyandu',
        cancelButtonText: 'Kembali',
        confirmButtonColor: '#22C55E',
        cancelButtonColor: '#6B7280',
      });

      if (!confirm2.isConfirmed) return;
    }

    // ── Step 4: Final confirmation ──────────────────────────────────────────
    const draftCount = pendingDraftCount();
    const finalResult = await Swal.fire({
      title: 'Konfirmasi Import',
      html: `
        <p style="font-size:14px;color:#374151;margin-bottom:8px">
          Siap mengimpor <strong>${summary.importable} baris</strong> ke database.
        </p>
        ${draftCount > 0 ? `<p style="font-size:12px;color:#F59E0B">⏳ ${draftCount} data masih ada di Draf dan tidak akan diimpor sekarang.</p>` : ''}
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Import Sekarang',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#2563EB',
      cancelButtonColor: '#6B7280',
    });

    if (!finalResult.isConfirmed) return;

    // ── Step 5: Commit to database ───────────────────────────────────────────
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // Show progress indicator
    Swal.fire({
      title: 'Menyimpan ke Database...',
      html: `Mengimpor <strong>${summary.importable}</strong> baris. Mohon tunggu.`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    let commitResult;
    try {
      const resp = await apiClient.post('/api/import/commit', {
        records: previewData.records,
        locationMap,
      });

      commitResult = await resp.json();

      if (!resp.ok) {
        throw new Error(commitResult.message || `HTTP ${resp.status}`);
      }
    } catch (fetchErr) {
      if (fetchErr.status === 401) return;
      Swal.fire({
        icon: 'error',
        title: 'Import Gagal',
        text: fetchErr.message || 'Tidak dapat terhubung ke server.',
        confirmButtonColor: '#DC2626',
      });
      return;
    }

    const r = commitResult.result;
    const errorCount = r.errors?.length || 0;

    Swal.fire({
      icon: errorCount > 0 ? 'warning' : 'success',
      title: errorCount > 0 ? 'Import Selesai dengan Peringatan' : 'Import Berhasil',
      html: `
        <div style="text-align:left;font-size:13px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:3px 8px;color:#374151">Kunjungan ANC disimpan</td><td style="padding:3px 8px;font-weight:700;color:#15803D">${r.inserted.anc}</td></tr>
            <tr><td style="padding:3px 8px;color:#374151">Pasien baru</td><td style="padding:3px 8px;font-weight:700;color:#15803D">${r.inserted.ibu}</td></tr>
            <tr><td style="padding:3px 8px;color:#374151">Kehamilan baru</td><td style="padding:3px 8px;font-weight:700;color:#15803D">${r.inserted.kehamilan}</td></tr>
            <tr><td style="padding:3px 8px;color:#374151">Lab screening disimpan</td><td style="padding:3px 8px;font-weight:700;color:#15803D">${r.inserted.lab}</td></tr>
            <tr><td style="padding:3px 8px;color:#374151">Komplikasi disimpan</td><td style="padding:3px 8px;font-weight:700;color:#15803D">${r.inserted.komplikasi}</td></tr>
            <tr><td style="padding:3px 8px;color:#374151">Kunjungan sudah ada (dilewati)</td><td style="padding:3px 8px;font-weight:700;color:#6B7280">${r.skipped.anc}</td></tr>
            ${errorCount > 0 ? `<tr><td style="padding:3px 8px;color:#DC2626">Baris gagal</td><td style="padding:3px 8px;font-weight:700;color:#DC2626">${errorCount}</td></tr>` : ''}
          </table>
        </div>
      `,
      confirmButtonText: 'Selesai',
      confirmButtonColor: '#22C55E',
    }).then(() => {
      // Clear the preview after successful import
      handleClear();
    });
  };

  return (
    <div className="dashboard-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        {/* ── Header ── */}
        <div className="content-header">
          <div>
            <h1>Import Data</h1>
            <p>Impor data ANC dari file Excel eksternal ke sistem iBundaCare</p>
          </div>
        </div>

        {/* ── Banners ── */}
        {error && <div className="error-banner">{error}</div>}
        {successMsg && <div className="success-banner">{successMsg}</div>}

        {/* ── Summary cards (shown after processing) ── */}
        {summary && (
          <div className="import-summary-grid">
            <div className="summary-card">
              <span className="sc-label">Total Baris</span>
              <span className="sc-value">{summary.total}</span>
            </div>
            <div className="summary-card sc-green">
              <span className="sc-label">Siap Impor</span>
              <span className="sc-value">{summary.importable}</span>
            </div>
            <div className="summary-card sc-red">
              <span className="sc-label">Error</span>
              <span className="sc-value">{summary.errors}</span>
            </div>
            <div className="summary-card sc-yellow">
              <span className="sc-label">Duplikat</span>
              <span className="sc-value">{summary.duplicatesInFile}</span>
            </div>
            <div className="summary-card sc-yellow">
              <span className="sc-label">Perlu Perhatian</span>
              <span className="sc-value">{summary.withWarnings}</span>
            </div>
            <div className="summary-card sc-blue">
              <span className="sc-label">Pasien Unik</span>
              <span className="sc-value">{summary.uniquePatients}</span>
            </div>
            <div className="summary-card sc-purple">
              <span className="sc-label">Ada Lab</span>
              <span className="sc-value">{summary.withLab}</span>
            </div>
            <div className="summary-card sc-red">
              <span className="sc-label">Ada Komplikasi</span>
              <span className="sc-value">{summary.withKomplikasi}</span>
            </div>
            <div className="summary-card sc-blue">
              <span className="sc-label">Kunjungan Auto</span>
              <span className="sc-value">{summary.autoSolved}</span>
            </div>
          </div>
        )}

        {/* ── Upload zone ── */}
        <div className="upload-section">
          <div
            className={`upload-zone${dragOver ? ' drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8zm0-4h8v2H8z" fill="currentColor"/>
            </svg>
            <p>Klik atau seret file Excel ke sini</p>
            <span>Format: .xlsx atau .xls — Maks. 5MB</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
          </div>

          {selectedFile && (
            <div className="file-selected-info">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
              </svg>
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">{formatFileSize(selectedFile.size)}</span>
            </div>
          )}
        </div>

        {/* ── Defaults panel ── */}
        <div className="defaults-panel">
          <button
            className="defaults-panel-toggle"
            onClick={() => setShowDefaults(v => !v)}
          >
            <span>Pengaturan Default Import</span>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              style={{ transform: showDefaults ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <path d="M7 10l5 5 5-5H7z" fill="currentColor"/>
            </svg>
          </button>

          {showDefaults && (
            <>
              <p className="panel-desc">
                Nilai berikut digunakan untuk mengisi kolom yang tidak tersedia di file Excel.
                Ubah sesuai kebutuhan sebelum memproses.
              </p>
              <div className="defaults-grid">
                <div className="default-field">
                  <label>ID Bidan (forkey_bidan)</label>
                  <input
                    type="number"
                    min="1"
                    value={defaults.forkey_bidan}
                    onChange={e => setDefaults(d => ({ ...d, forkey_bidan: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="default-field">
                  <label>Jenis Akses</label>
                  <select value={defaults.jenis_akses} onChange={e => setDefaults(d => ({ ...d, jenis_akses: e.target.value }))}>
                    <option value="Murni">Murni</option>
                    <option value="Akses">Akses</option>
                  </select>
                </div>
                <div className="default-field">
                  <label>Pemeriksa</label>
                  <select value={defaults.pemeriksa} onChange={e => setDefaults(d => ({ ...d, pemeriksa: e.target.value }))}>
                    <option value="Bidan">Bidan</option>
                    <option value="Dokter">Dokter</option>
                  </select>
                </div>
                <div className="default-field">
                  <label>Status Risiko Default</label>
                  <select value={defaults.status_risiko_visit} onChange={e => setDefaults(d => ({ ...d, status_risiko_visit: e.target.value }))}>
                    <option value="Normal">Normal</option>
                    <option value="Ringan">Ringan</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi">Tinggi</option>
                  </select>
                </div>
                <div className="default-field">
                  <label>Gravida Default</label>
                  <input type="number" min="1" value={defaults.gravida} onChange={e => setDefaults(d => ({ ...d, gravida: parseInt(e.target.value) || 1 }))} />
                </div>
                <div className="default-field">
                  <label>Partus Default</label>
                  <input type="number" min="0" value={defaults.partus} onChange={e => setDefaults(d => ({ ...d, partus: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="default-field">
                  <label>Abortus Default</label>
                  <input type="number" min="0" value={defaults.abortus} onChange={e => setDefaults(d => ({ ...d, abortus: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="default-field">
                  <label>Buku KIA</label>
                  <select value={defaults.buku_kia} onChange={e => setDefaults(d => ({ ...d, buku_kia: e.target.value }))}>
                    <option value="Ada">Ada</option>
                    <option value="Tidak Ada">Tidak Ada</option>
                  </select>
                </div>
                <div className="default-field">
                  <label>Pekerjaan Default</label>
                  <input type="text" value={defaults.pekerjaan} onChange={e => setDefaults(d => ({ ...d, pekerjaan: e.target.value }))} />
                </div>
                <div className="default-field">
                  <label>Pendidikan Default</label>
                  <input type="text" value={defaults.pendidikan} onChange={e => setDefaults(d => ({ ...d, pendidikan: e.target.value }))} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div className="import-actions">
          <button
            className="btn-process"
            onClick={handleProcess}
            disabled={!selectedFile || processing}
          >
            {processing ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Memproses...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                </svg>
                Proses & Preview
              </>
            )}
          </button>

          {previewData && summary?.importable > 0 && (
            <button
              className="btn-next"
              onClick={() => handleCommit(previewData, summary, locationMap, setStatusFilter, setPage)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
              </svg>
              Selanjutnya ({summary.importable} baris)
            </button>
          )}

          {previewData && (
            <button className="btn-clear" onClick={handleClear}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
              </svg>
              Hapus Preview
            </button>
          )}
        </div>

        {/* ── Preview table ── */}
        {processing && (
          <div className="preview-section">
            <div className="processing-overlay">
              <div className="spinner" />
              <div className="phase-steps">
                <div className={`phase-step ${processingPhase === 'parsing'   ? 'active' : ['kunjungan','risiko','done'].includes(processingPhase) ? 'done' : ''}`}>
                  <span className="phase-dot" />
                  <span>Membaca & memetakan data Excel</span>
                </div>
                <div className={`phase-step ${processingPhase === 'kunjungan' ? 'active' : ['risiko','done'].includes(processingPhase) ? 'done' : ''}`}>
                  <span className="phase-dot" />
                  <span>Menentukan jenis kunjungan otomatis</span>
                </div>
                <div className={`phase-step ${processingPhase === 'risiko'    ? 'active' : processingPhase === 'done' ? 'done' : ''}`}>
                  <span className="phase-dot" />
                  <span>Menghitung skor risiko ibu</span>
                </div>
                <div className={`phase-step ${processingPhase === 'done' ? 'active' : ''}`}>
                  <span className="phase-dot" />
                  <span>Menyiapkan tabel preview</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!processing && previewData && (
          <div className="preview-section">
            <h2>
              Preview Data — {previewData.fileName}
              <span style={{ fontSize: 12, fontWeight: 400, color: '#6B7280', marginLeft: 10 }}>
                {new Date(previewData.processedAt).toLocaleString('id-ID')}
              </span>
            </h2>

            {/* Filter controls */}
            <div className="preview-controls">
              <div className="search-bar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
                </svg>
                <input
                  type="text"
                  placeholder="Cari NIK, nama, kunjungan..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                />
              </div>

              <select
                className="filter-select"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="all">Semua Status</option>
                <option value="new">Baru</option>
                <option value="error">Error</option>
                <option value="duplicate_in_file">Duplikat</option>
                <option value="skip">Lewati</option>
                <option value="warning">Perlu Perhatian</option>
              </select>

              <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 'auto' }}>
                {filteredRecords.length} baris ditampilkan
              </span>
            </div>

            {/* Table */}
            <div className="table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    <SortTh label="Baris" sortKey="_rowIndex" currentSort={sort} onSort={handleSort} />
                    <th>Status</th>
                    <SortTh label="NIK" sortKey="nik" currentSort={sort} onSort={handleSort} />
                    <SortTh label="Nama Ibu" sortKey="nama" currentSort={sort} onSort={handleSort} />
                    <SortTh label="Tgl Lahir" sortKey="tgl_lahir" currentSort={sort} onSort={handleSort} />
                    <SortTh label="HPHT" sortKey="hpht" currentSort={sort} onSort={handleSort} />
                    <SortTh label="Kunjungan" sortKey="kunjungan" currentSort={sort} onSort={handleSort} />
                    <SortTh label="Tgl Kunjungan" sortKey="tanggal" currentSort={sort} onSort={handleSort} />
                    <th>BB (kg)</th>
                    <th>TD</th>
                    <th>LILA</th>
                    <th>TFU</th>
                    <th>Status TT</th>
                    <th>HB</th>
                    <SortTh label="Risiko" sortKey="risiko" currentSort={sort} onSort={handleSort} />
                    <th>Lokasi</th>
                    <th>Peringatan</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={16}>
                        <div className="empty-state">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z" fill="currentColor"/>
                          </svg>
                          <p>Tidak ada data yang cocok dengan filter.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagedRecords.map((record, i) => {
                      const loc = locationMap[record._rowIndex];
                      const rowClass = [
                        loc ? 'row-location-filled' :
                        record._importStatus === 'error' ? 'row-error' :
                        record._importStatus === 'duplicate_in_file' ? 'row-duplicate' :
                        record._importStatus === 'skip' ? 'row-skip' :
                        record._warnings?.some(w => w.level === 'warning') ? 'row-warning' : '',
                        record._importStatus !== 'error' ? 'row-clickable' : '',
                      ].filter(Boolean).join(' ');

                      const w = record._warnings || [];

                      return (
                        <tr
                          key={i}
                          className={rowClass}
                          onClick={() => record._importStatus !== 'error' && setModalRecord(record)}
                          title={record._importStatus !== 'error' ? 'Klik untuk mengatur lokasi' : undefined}
                        >
                          <td style={{ color: '#9CA3AF', fontSize: 11 }}>{record._rowIndex}</td>
                          <td><StatusBadge status={record._importStatus} /></td>
                          <td>
                            <Cell value={record.ibu?.nik_ibu} warnFields={w} field="nik" />
                          </td>
                          <td style={{ fontWeight: 500, color: '#111827' }}>
                            <Cell value={record.ibu?.nama_lengkap} warnFields={w} field="nama" />
                          </td>
                          <td>
                            <Cell value={record.ibu?.tanggal_lahir} warnFields={w} field="tanggal_lahir" />
                          </td>
                          <td>
                            <Cell value={record.kehamilan?.haid_terakhir} warnFields={w} field="hpht" />
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            <Cell value={record.anc?.jenis_kunjungan} warnFields={w} field="kunjungan" />
                            {record._autoSolved && (
                              <span className="import-badge badge-warning" style={{ marginLeft: 4, fontSize: 9 }} title={record._solverNote}>
                                AUTO
                              </span>
                            )}
                          </td>
                          <td>
                            <Cell value={record.anc?.tanggal_kunjungan?.substring(0, 10)} warnFields={w} field="tanggal" />
                          </td>
                          <td>
                            <Cell value={record.anc?.berat_badan} warnFields={w} field="bb" />
                          </td>
                          <td>
                            <Cell value={record.anc?.tekanan_darah} warnFields={w} field="td" />
                          </td>
                          <td>
                            <Cell value={record.anc?.lila} warnFields={w} field="lila" />
                          </td>
                          <td>
                            <Cell value={record.anc?.tinggi_fundus} warnFields={w} field="tfu" />
                          </td>
                          <td>
                            <Cell value={record.anc?.status_imunisasi_tt} warnFields={w} field="tt" />
                          </td>
                          <td>
                            <Cell value={record.lab?.hasil_lab_hb} warnFields={w} field="hb" />
                          </td>
                          <td>
                            {record.anc?.status_risiko_visit ? (
                              <span
                                className={`risk-badge risk-${(record.anc.status_risiko_visit || 'Normal').toLowerCase()} risk-badge-clickable`}
                                title="Klik untuk melihat detail skor risiko"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rs = record._riskScore;
                                  const status = record.anc.status_risiko_visit;
                                  const scoreText = rs ? `${rs.score} / 160 poin` : '—';
                                  const factorRows = rs?.factors?.length
                                    ? rs.factors.map(f => `<li style="margin:3px 0;font-size:12px;color:#374151">${f}</li>`).join('')
                                    : '<li style="color:#9CA3AF;font-size:12px">Tidak ada faktor risiko terdeteksi</li>';
                                  const criticalHtml = rs?.criticalFactors?.length
                                    ? `<div style="margin-top:10px;padding:8px 12px;background:#FEE2E2;border-radius:6px;font-size:12px;color:#B91C1C">
                                        ⚠ Faktor kritis: ${rs.criticalFactors.join(', ')}
                                       </div>`
                                    : '';
                                  const parityNote = rs?.parityDefaulted
                                    ? `<div style="margin-top:8px;padding:8px 12px;background:#DBEAFE;border-radius:6px;font-size:11px;color:#1D4ED8">
                                        ℹ Data paritas tidak tersedia — skor mungkin lebih rendah dari sebenarnya
                                       </div>`
                                    : '';
                                  Swal.fire({
                                    title: `Skor Risiko: ${status}`,
                                    html: `
                                      <div style="text-align:left">
                                        <p style="font-size:13px;color:#6B7280;margin:0 0 10px 0">
                                          Total skor: <strong style="color:#111827">${scoreText}</strong>
                                        </p>
                                        <p style="font-size:12px;font-weight:600;color:#374151;margin:0 0 6px 0">Faktor yang berkontribusi:</p>
                                        <ul style="margin:0;padding-left:18px">${factorRows}</ul>
                                        ${criticalHtml}
                                        ${parityNote}
                                      </div>
                                    `,
                                    icon: status === 'Tinggi' ? 'error' : status === 'Sedang' ? 'warning' : status === 'Ringan' ? 'info' : 'success',
                                    confirmButtonText: 'Tutup',
                                    confirmButtonColor: '#22C55E',
                                  });
                                }}
                              >
                                {record.anc.status_risiko_visit}
                              </span>
                            ) : (
                              <span className="cell-null">—</span>
                            )}
                          </td>
                          <td>
                            {loc ? (
                              <span className="location-filled-badge">
                                📍 {loc.kelurahan_nama} RT {String(loc.rt).padStart(2,'0')}
                                {loc.posyandu_nama && ` · ${loc.posyandu_nama}`}
                              </span>
                            ) : (
                              <span className="cell-null" style={{ fontSize: 11 }}>Klik untuk atur</span>
                            )}
                          </td>
                          <td>
                            <WarningChips
                              warnings={w}
                              onChipClick={(field) => setInlineEdit({ record, field })}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="table-pagination">
                <span className="pagination-info">
                  Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredRecords.length)} dari {filteredRecords.length} baris
                </span>
                <div className="pagination-buttons">
                  <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
                  <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                    const p = start + i;
                    return (
                      <button
                        key={p}
                        className={`page-btn${p === page ? ' active' : ''}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
                  <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
                </div>
              </div>
            )}
          </div>
        )}

        {!processing && !previewData && (
          <div className="preview-section">
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8zm0-4h8v2H8z" fill="currentColor"/>
              </svg>
              <p>Upload file Excel dan klik "Proses & Preview" untuk melihat data sebelum diimpor.</p>
            </div>
          </div>
        )}
      </main>

      {/* ── Location modal ── */}
      {modalRecord && (
        <LocationModal
          record={modalRecord}
          onSave={(loc) => {
            setLocationMap(prev => ({ ...prev, [modalRecord._rowIndex]: loc }));
            setModalRecord(null);
          }}
          onClose={() => setModalRecord(null)}
        />
      )}

      {/* ── Inline field edit modal ── */}
      {inlineEdit && (
        <InlineEditModal
          record={inlineEdit.record}
          field={inlineEdit.field}
          onSave={(field, value) => handleInlineSave(inlineEdit.record._rowIndex, field, value)}
          onClose={() => setInlineEdit(null)}
        />
      )}
    </div>
  );
};

export default ImportData;
