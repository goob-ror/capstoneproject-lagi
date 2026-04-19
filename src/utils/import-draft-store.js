/**
 * import-draft-store.js
 * Manages soft-deleted / deferred import rows in localStorage.
 * Drafts persist until the user explicitly resolves or discards them.
 */

const DRAFT_KEY = 'ibundacare_import_drafts';

/**
 * Load all drafts.
 * @returns {Array<DraftRecord>}
 */
export function loadDrafts() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save the full drafts array.
 */
function saveDrafts(drafts) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  } catch (e) {
    console.warn('Draft save failed (quota?):', e);
  }
}

/**
 * Add one or more records to the draft store.
 * Each record gets a draftId, draftedAt timestamp, and draftReason.
 *
 * @param {Array|Object} records  - single record or array
 * @param {string}       reason   - why it was drafted ('nik_missing', 'user_deferred', etc.)
 * @param {string}       [sourceFile] - original filename
 */
export function addToDrafts(records, reason, sourceFile = '') {
  const existing = loadDrafts();
  const toAdd = Array.isArray(records) ? records : [records];

  const newDrafts = toAdd.map(r => ({
    ...r,
    _draftId: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    _draftedAt: new Date().toISOString(),
    _draftReason: reason,
    _sourceFile: sourceFile,
    _draftStatus: 'pending', // 'pending' | 'resolved' | 'discarded'
  }));

  saveDrafts([...existing, ...newDrafts]);
  return newDrafts;
}

/**
 * Update a draft record by draftId (e.g. after user fills in NIK).
 */
export function updateDraft(draftId, updates) {
  const drafts = loadDrafts();
  const idx = drafts.findIndex(d => d._draftId === draftId);
  if (idx === -1) return;
  drafts[idx] = { ...drafts[idx], ...updates };
  saveDrafts(drafts);
}

/**
 * Mark a draft as discarded (soft delete within drafts).
 */
export function discardDraft(draftId) {
  updateDraft(draftId, { _draftStatus: 'discarded' });
}

/**
 * Permanently remove a draft.
 */
export function removeDraft(draftId) {
  const drafts = loadDrafts().filter(d => d._draftId !== draftId);
  saveDrafts(drafts);
}

/**
 * Clear all drafts.
 */
export function clearAllDrafts() {
  localStorage.removeItem(DRAFT_KEY);
}

/**
 * Get count of pending drafts.
 */
export function pendingDraftCount() {
  return loadDrafts().filter(d => d._draftStatus === 'pending').length;
}
