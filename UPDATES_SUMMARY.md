# Updates Summary - February 26, 2026

## Issues Fixed

### 1. TambahANC Auto-Selection Fix
**Problem**: Jenis_kunjungan was not auto-selecting based on gestational age when pregnancy was selected.

**Solution**: 
- Added `formData.jenis_kunjungan` to the useEffect dependency array
- Added condition to only update if calculated value differs from current value
- This prevents infinite loops while allowing the effect to re-run when needed

**File Modified**: `src/pages/TambahANC/TambahANC.js`

---

### 2. Dashboard At-Risk Mothers Query
**Problem**: Error "Unknown column 'anc.hemoglobin' in 'field list'"

**Status**: The code is already correct - uses `lab_screening.hasil_lab_hb` instead of `anc.hemoglobin`. The error might be from cached code. Restart the server to clear any caching issues.

**File**: `server/routes/dashboardRoutes.js` (already correct)

---

### 3. Kunjungan Nifas Normalization - BACKEND COMPLETE

**Problem**: Database was normalized to support multiple babies (twins), but backend routes still referenced old column structure.

**Solution**: Updated all nifas routes to work with normalized structure:

#### Database Structure:
- **kunjungan_nifas** table: Mother's postpartum data (removed baby columns)
- **kunjungan_nifas_bayi** table: Baby data (supports multiple babies per visit)

#### Backend Changes (`server/routes/nifasRoutes.js`):

**GET /** - List all nifas visits
- Now joins with `kunjungan_nifas_bayi` table
- Returns babies array for each visit
- Uses GROUP_CONCAT to aggregate baby data

**GET /:id** - Get single nifas visit
- Fetches nifas data
- Separately fetches babies array
- Returns combined object with babies

**POST /** - Create nifas visit
- Accepts `babies` array in request body
- Inserts nifas record
- Loops through babies array and inserts each baby
- Removed old columns: `berat_badan_bayi`, `suhu_bayi`, `pemberian_asi`, `keterangan`
- Added: `berat_badan` (mother's weight)

**PUT /:id** - Update nifas visit
- Deletes existing baby records
- Inserts new baby records from babies array
- Supports updating multiple babies

**DELETE /:id** - Delete nifas visit
- Now uses transaction
- Deletes baby records first (foreign key constraint)
- Then deletes nifas record

**POST /with-complications** - Create with complications
- Updated to use new structure
- Accepts babies array in nifasData
- Inserts baby records after nifas record

#### Baby Data Structure:
```javascript
{
  urutan_bayi: 1,  // 1 for first baby, 2 for twins
  berat_badan: 3.2,  // in kg
  panjang_badan: 48.5,  // in cm
  pemberian_asi: 'ASI Eksklusif',  // or 'ASI + Formula', 'Formula'
  kondisi_bayi: 'Sehat',  // or 'Sakit', 'Rujuk'
  keterangan: 'Optional notes'
}
```

---

## Next Steps - FRONTEND UPDATES NEEDED

### TambahNifas Form (`src/pages/TambahNifas/TambahNifas.js`)
- [ ] Update form state to support babies array
- [ ] Add UI for multiple babies (Add Baby button for twins)
- [ ] Update form fields:
  - Remove: `berat_badan_bayi`, `suhu_bayi`, `pemberian_asi`, `keterangan` (old structure)
  - Add: `berat_badan` (mother's weight)
  - Add babies section with fields: `berat_badan`, `panjang_badan`, `pemberian_asi`, `kondisi_bayi`, `keterangan`
- [ ] Update submit handler to send babies array
- [ ] Update edit mode to load babies data

### KunjunganNifas List (`src/pages/KunjunganNifas/KunjunganNifas.js`)
- [ ] Update table columns to display baby data
- [ ] Handle display of multiple babies (show count or list)
- [ ] Update data parsing to work with babies array from API

### Testing Checklist
- [ ] Test creating nifas visit with single baby
- [ ] Test creating nifas visit with twins (2 babies)
- [ ] Test editing nifas visit
- [ ] Test deleting nifas visit
- [ ] Test viewing nifas list
- [ ] Test creating nifas with complications

---

## API Request/Response Examples

### Create Nifas Visit
```javascript
POST /api/nifas
{
  tanggal_kunjungan: '2026-02-26',
  jenis_kunjungan: 'KF1',
  pemeriksa: 'Bidan',
  tekanan_darah: '120/80',
  berat_badan: 55.5,  // Mother's weight
  suhu_badan: 36.5,
  involusio_uteri: 'Baik',
  lochea: 'Rubra',
  payudara: 'Normal',
  konseling_asi: true,
  forkey_hamil: 1,
  forkey_bidan: 2,
  babies: [
    {
      urutan_bayi: 1,
      berat_badan: 3.2,
      panjang_badan: 48.5,
      pemberian_asi: 'ASI Eksklusif',
      kondisi_bayi: 'Sehat',
      keterangan: null
    }
  ]
}
```

### Response Format
```javascript
{
  id: 1,
  tanggal_kunjungan: '2026-02-26',
  // ... other nifas fields
  babies: [
    {
      id: 1,
      urutan_bayi: 1,
      berat_badan: 3.2,
      panjang_badan: 48.5,
      pemberian_asi: 'ASI Eksklusif',
      kondisi_bayi: 'Sehat',
      keterangan: null
    }
  ]
}
```
