# Data Import Compatibility Report
**Project:** iBundaCare  
**Source:** External ANC Register Export (notes.txt)  
**Target:** ibundacaresv2 Database Schema  
**Date:** April 11, 2026  
**Prepared by:** Kiro Analysis

---

## 1. Overview

The external data is a flat-table ANC (Antenatal Care) register export from a similar maternal health system (likely Puskesmas SIMPUS/e-Kohort). Each row represents **one ANC visit** and contains denormalized data spanning what iBundaCare stores across **multiple relational tables**.

The iBundaCare schema is normalized into **14 tables**. Importing the external data requires mapping one flat row into records across several of those tables simultaneously.

---

## 2. External Data Column Map

The external export has the following column groups (reconstructed from the multi-row header):

| Group | Columns |
|---|---|
| Register | Tanggal, NIK, No Ibu, Nama Ibu, Umur, Tanggal Lahir, No Telp, Alamat, Jamkesmas |
| Kehamilan | Tanggal HPHT, Taksiran Persalinan, Usia Kehamilan, Trisemester ke-, Kunjungan, Faskes Asal |
| Pemeriksaan Ibu | Anamnesis, BB(kg), Tinggi Badan, TD(mmHg), LILA(cm), Status Gizi, TFU(cm), Refleks Patella |
| Pemeriksaan Bayi (Tunggal) | DJJ(x/menit), Kepala thd PAP, TBJ(gr), Presentasi |
| Pemeriksaan Bayi (Jamak) | DJJ(x/menit), Kepala thd PAP, TBJ(gr), Presentasi |
| Jumlah Janin | Jumlah Janin |
| Konseling | Catat dibuku KIA |
| Imunisasi TT | Injeksi TT, Status TT |
| Pelayanan | Fe(Tab/Botol) |
| Laboratorium | Periksa HB, Hasil(gr/dl), Protein Uria, Gula Darah, Thalasemia, Sifilis, HBsAg, Anemia |
| PPIA (HIV) | Datang dengan HIV, Ditawarkan Tes, Dilakukan Tes, Hasil Tes HIV, Mendapatkan ART, Ibu Hamil HIV |
| PMDK (Malaria) | Diberikan Kelambu, Darah Malaria Diperiksa, Ibu Hamil Malaria, Hasil Tes Darah Malaria, Obat Kina/ACT, Diperiksa RDT, Mikroskopis |
| TB | Diperiksa dahak, TBC(+/-), Obat |
| Kecacingan | Diperiksa Ankylostoma, Ibu Hamil Tes(+/-) |
| IMS | Diperiksa IMS, Hasil Tes(+/-), Diterapi |
| Hepatitis | Diperiksa Hepatitis, Hasil Tes(+/-) |
| Risiko Terdeteksi Oleh | Pasien, Keluarga, Masyarakat, Dukun, Kader, Bidan, Perawat, Dokter, DSOG, HDK |
| Komplikasi | Abortus, Pendarahan, Infeksi, KPD, Lainnya |
| Kegiatan Rujukan | Puskesmas, Klinik, RB, RSIA/RSB, RS, Lainnya |
| Keadaan | Keadaan Tiba(H/M), Keadaan Pulang(H/M) |

---

## 3. Table-by-Table Compatibility Analysis

---

### 3.1 `ibu` — MUST FILL | HIGH SIMILARITY ✅

**Role:** Core patient identity. Every import row requires a matching or new `ibu` record.

| External Column | DB Column | Match |
|---|---|---|
| NIK | `nik_ibu` | ✅ Direct |
| Nama Ibu | `nama_lengkap` | ✅ Direct |
| Tanggal Lahir | `tanggal_lahir` | ✅ Direct |
| No Telp | `no_hp` | ✅ Direct |
| Alamat | `alamat_lengkap` | ✅ Direct (partial — no RT/kelurahan split) |
| Tinggi Badan (from ANC row) | `tinggi_badan` | ⚠️ Available but in ANC row, not patient register |
| — | `gol_darah` | ❌ Not in external data |
| — | `buku_kia` | ❌ Not in external data |
| — | `pekerjaan` | ❌ Not in external data |
| — | `pendidikan` | ❌ Not in external data |
| — | `kelurahan_id` | ❌ Only raw address string available |
| — | `posyandu_id` | ❌ Not in external data |
| — | `rhesus` | ❌ Not in external data |
| — | `status_hepatitis` | ⚠️ Partially derivable from Hepatitis screening columns |

**Verdict:** 4 columns map directly. 9 columns will be NULL or require manual enrichment. The NIK is present and unique — deduplication is possible. **Minimum viable import works.**

---

### 3.2 `kehamilan` — MUST FILL | HIGH SIMILARITY ✅

**Role:** Pregnancy episode. Required before any ANC visit can be saved.

| External Column | DB Column | Match |
|---|---|---|
| Tanggal HPHT | `haid_terakhir` | ✅ Direct |
| Taksiran Persalinan | `taksiran_persalinan` | ✅ Direct |
| — | `gravida` | ❌ Not in external data |
| — | `partus` | ❌ Not in external data |
| — | `abortus` | ❌ Not in external data (Komplikasi column "Abortus" is event-based, not obstetric history) |
| — | `status_kehamilan` | ⚠️ Can be inferred as 'Hamil' for all active rows |
| — | `cara_persalinan` | ❌ Not in external data |

**Verdict:** 2 direct matches. `gravida/partus/abortus` are obstetric history fields not captured in the external export. Default to 1/0/0 on import. `status_kehamilan` defaults to 'Hamil'. **Minimum viable import works.**

---

### 3.3 `antenatal_care` — MUST FILL | VERY HIGH SIMILARITY ✅✅

**Role:** The core of each row in the external data. This is the primary target table.

| External Column | DB Column | Match |
|---|---|---|
| Tanggal (visit date) | `tanggal_kunjungan` | ✅ Direct |
| Kunjungan (K1–K6) | `jenis_kunjungan` | ✅ Direct |
| BB(kg) | `berat_badan` | ✅ Direct |
| TD(mmHg) | `tekanan_darah` | ✅ Direct |
| LILA(cm) | `lila` | ✅ Direct |
| TFU(cm) | `tinggi_fundus` | ✅ Direct |
| DJJ Tunggal | `denyut_jantung_janin` | ✅ Direct |
| Status TT (T0–T5) | `status_imunisasi_tt` | ✅ Direct |
| Fe(Tab/Botol) | `beri_tablet_fe` | ✅ Direct (boolean) |
| Catat dibuku KIA | *(no direct column)* | ⚠️ Could go in `keterangan_anc` |
| Faskes Asal | *(no direct column)* | ⚠️ No column — could go in `keterangan_anc` |
| Anamnesis | *(no direct column)* | ⚠️ Could map to `hasil_temu_wicara` |
| Refleks Patella | *(no direct column)* | ❌ Not stored in iBundaCare |
| Kepala thd PAP / Presentasi / TBJ | *(no direct column)* | ❌ Not stored — iBundaCare uses USG result text |
| — | `jenis_akses` | ❌ Not in external data — default 'Murni' |
| — | `pemeriksa` | ❌ Not in external data — default 'Bidan' |
| — | `confirm_usg` | ❌ Not in external data — default 0 |
| — | `status_risiko_visit` | ❌ Not in external data — default 'Normal' |
| Keadaan Tiba/Pulang | `keterangan_anc` | ⚠️ Can be stored as text note |

**Verdict:** 8 columns map directly and cleanly. 4 can be approximated. 3 external columns have no home in iBundaCare (Refleks Patella, Presentasi, TBJ detail). **This is the most import-ready table.**

---

### 3.4 `lab_screening` — MUST FILL (when lab data exists) | HIGH SIMILARITY ✅

**Role:** Linked to `antenatal_care` via `forkey_lab_screening`. Only created when lab data is present in the row.

| External Column | DB Column | Match |
|---|---|---|
| Hasil HB (gr/dl) | `hasil_lab_hb` | ✅ Direct |
| Protein Uria (+/-) | `lab_protein_urine` | ⚠️ Needs value mapping (+/- → Negatif/+1/+2/+3/+4) |
| Gula Darah | `lab_gula_darah` | ✅ Direct (stored as varchar) |
| Sifilis(+/-) | `skrining_sifilis` | ⚠️ Needs value mapping (+/- → Reaktif/Non-Reaktif) |
| HBsAg(+/-) | `skrining_hbsag` | ⚠️ Needs value mapping |
| Hasil Tes HIV(+/-) | `skrining_hiv` | ⚠️ Needs value mapping |
| Mendapatkan ART | `status_art` | ⚠️ Boolean → enum mapping needed |
| Diberikan Kelambu | `malaria_diberi_kelambu` | ✅ Direct (Ya/Tidak) |
| Hasil Tes Darah Malaria | `status_malaria` | ⚠️ Needs value mapping |
| Obat Kina/ACT | `terapi_malaria` | ✅ Direct (boolean) |
| TBC(+/-) | `skrining_tb` | ⚠️ Needs value mapping |
| Ibu Hamil Tes Kecacingan | `status_kecacingan` | ⚠️ Needs value mapping |
| Diterapi (IMS) | `terapi_kecacingan` | ⚠️ Partial — IMS therapy not directly mapped |
| Diperiksa Hepatitis | *(no direct column)* | ⚠️ Result goes to `ibu.status_hepatitis` |
| — | `skrining_gonorea` | ❌ Not in external data |
| — | `skrining_klamidia` | ❌ Not in external data |
| Thalasemia(+/-) | `hasil_lab_lainnya` | ⚠️ No dedicated column — store as text |

**Verdict:** 3 direct matches, 9 need value transformation (enum mapping), 2 have no home. A value-mapping layer is required during import. **Workable but needs a transformation script.**

---

### 3.5 `komplikasi` — OPTIONAL | PARTIAL SIMILARITY ⚠️

**Role:** Complication events. The external data has a "Komplikasi" section with checkboxes: Abortus, Pendarahan, Infeksi, KPD, Lainnya.

| External Column | DB Column | Match |
|---|---|---|
| Abortus / Pendarahan / Infeksi / KPD / Lainnya | `nama_komplikasi` | ⚠️ Checkbox → text name mapping |
| Tanggal (visit date) | `tanggal_diagnosis` | ⚠️ Use visit date as proxy |
| Kegiatan Rujukan (Puskesmas/RS/etc.) | `rujuk_rs`, `nama_rs` | ⚠️ Partial — destination type maps to boolean + name |
| — | `kejadian` | ⚠️ Default 'Saat Hamil' for ANC rows |
| — | `tingkat_keparahan` | ❌ Not in external data |
| — | `tekanan_darah` | ⚠️ Available from ANC row |
| — | `protein_urine` | ⚠️ Available from lab row |

**Verdict:** Komplikasi rows only exist for a small subset of records (most rows have empty komplikasi columns in the sample). When present, the data is checkbox-style and needs to be exploded into individual komplikasi rows. **Import is possible but conditional and requires logic.**

---

### 3.6 `persalinan` — NOT IN EXTERNAL DATA | NO MATCH ❌

**Role:** Birth delivery record.

The external data is purely an ANC visit register. There is no delivery date, delivery method, place of birth, or birth attendant in the export. This table **cannot be populated from this data source**.

**Verdict:** Skip entirely during import. Must be entered manually or from a separate delivery register.

---

### 3.7 `bayi` — NOT IN EXTERNAL DATA | NO MATCH ❌

**Role:** Newborn data linked to `persalinan`.

No birth data exists in the external export. The "Bayi" columns in the external data refer to fetal presentation during ANC (DJJ, TBJ, Presentasi) — not postnatal baby records.

**Verdict:** Skip entirely. Cannot be populated from this source.

---

### 3.8 `kunjungan_nifas` — NOT IN EXTERNAL DATA | NO MATCH ❌

**Role:** Postnatal (nifas) visit records.

The external data is an ANC register only. No postnatal visit data is present.

**Verdict:** Skip entirely.

---

### 3.9 `kunjungan_nifas_bayi` — NOT IN EXTERNAL DATA | NO MATCH ❌

Same as above — no postnatal data in source.

**Verdict:** Skip entirely.

---

### 3.10 `suami` — NOT IN EXTERNAL DATA | NO MATCH ❌

**Role:** Husband/partner data.

No husband information (NIK suami, nama, pekerjaan, etc.) is present in the external export.

**Verdict:** Skip entirely. Must be entered manually.

---

### 3.11 `riwayat_penyakit` — NOT IN EXTERNAL DATA | NO MATCH ❌

**Role:** Medical history of the mother.

No past medical history is captured in the external export.

**Verdict:** Skip entirely.

---

### 3.12 `jiwa_screening` — NOT IN EXTERNAL DATA | NO MATCH ❌

**Role:** Mental health screening linked to an ANC visit.

No mental health screening data in the external export.

**Verdict:** Skip entirely.

---

### 3.13 `kelurahan` — REFERENCE TABLE | INDIRECT MATCH ⚠️

**Role:** Lookup table for village/kelurahan names.

The external data has a raw `Alamat` string (e.g., "JL.TELAGA SARI", "JL.TRIKORA"). There is no structured kelurahan field. Matching would require fuzzy address parsing or manual mapping.

**Verdict:** Cannot be auto-populated from this data. Must be pre-seeded manually. `ibu.kelurahan_id` will be NULL on import.

---

### 3.14 `wilker_posyandu` — REFERENCE TABLE | NO MATCH ❌

**Role:** Posyandu working area lookup.

No posyandu information in the external export.

**Verdict:** Pre-seeded separately. `ibu.posyandu_id` will be NULL on import.

---

### 3.15 `bidan` — SYSTEM TABLE | NO MATCH (but required) ⚠️

**Role:** The midwife/user who recorded the visit. Required as `forkey_bidan` in `antenatal_care`.

The external data has no bidan identity. A default/import bidan account must exist in the system before import.

**Verdict:** Create a dedicated "Import" bidan account and use its ID as the default `forkey_bidan` for all imported records.

---

## 4. Summary Table

| Table | Must Fill? | Similarity | Import Feasibility | Notes |
|---|---|---|---|---|
| `ibu` | ✅ YES | High (4/13 direct) | ✅ Feasible | NIK deduplication needed |
| `kehamilan` | ✅ YES | High (2/7 direct) | ✅ Feasible | Default gravida/partus/abortus |
| `antenatal_care` | ✅ YES | Very High (8/15 direct) | ✅ Best match | Core target table |
| `lab_screening` | ✅ YES (conditional) | High (3/16 direct, 9 transformable) | ⚠️ Needs mapping | Only create when lab data present |
| `komplikasi` | ⚠️ OPTIONAL | Partial | ⚠️ Conditional | Only for rows with komplikasi checked |
| `bidan` | ✅ YES (system) | N/A | ⚠️ Pre-seed required | Create import account |
| `kelurahan` | ⚠️ OPTIONAL | Indirect | ⚠️ Manual mapping | Raw address only |
| `wilker_posyandu` | ⚠️ OPTIONAL | None | ❌ Skip | Pre-seed separately |
| `persalinan` | ⚠️ OPTIONAL | None | ❌ Skip | Different data source |
| `bayi` | ⚠️ OPTIONAL | None | ❌ Skip | Different data source |
| `kunjungan_nifas` | ⚠️ OPTIONAL | None | ❌ Skip | Different data source |
| `kunjungan_nifas_bayi` | ⚠️ OPTIONAL | None | ❌ Skip | Different data source |
| `suami` | ⚠️ OPTIONAL | None | ❌ Skip | Not in source |
| `riwayat_penyakit` | ⚠️ OPTIONAL | None | ❌ Skip | Not in source |
| `jiwa_screening` | ⚠️ OPTIONAL | None | ❌ Skip | Not in source |

---

## 5. Columns in External Data With No Home in iBundaCare

These external columns carry data that iBundaCare does not store in any dedicated column:

| External Column | Recommendation |
|---|---|
| No Ibu (external system ID) | Store in `keterangan_anc` as reference note |
| Jamkesmas | No insurance field in iBundaCare — discard or store in `keterangan_anc` |
| Faskes Asal | Store in `keterangan_anc` |
| Refleks Patella | Discard — not clinically stored |
| Kepala thd PAP | Discard or store in `hasil_usg` text |
| TBJ (Taksiran Berat Janin) | Store in `hasil_usg` text |
| Presentasi Janin | Store in `hasil_usg` text |
| Anamnesis | Map to `hasil_temu_wicara` |
| Catat dibuku KIA | Map to `keterangan_anc` |
| Resiko Terdeteksi Oleh (Pasien/Keluarga/etc.) | No column — store in `keterangan_anc` |
| Keadaan Tiba / Keadaan Pulang | Store in `keterangan_anc` |
| Thalasemia(+/-) | Store in `hasil_lab_lainnya` |
| IMS Diperiksa / Hasil / Diterapi | Partial — no dedicated IMS table; store in `hasil_lab_lainnya` |

---

## 6. Data Quality Observations from Sample

- **Duplicate rows exist:** Rows 20 & 21 (DINI ARDITA LESTARI) and rows 33 & 34 (MERY LESTARI) are exact duplicates. Deduplication by NIK + Tanggal + Kunjungan is required before import.
- **Incomplete lab data:** Most K2–K6 rows have empty lab columns. `lab_screening` records should only be created when at least one lab value is present.
- **LILA only on K1:** LILA is populated only for first-trimester visits (K1), which is clinically correct. Expect NULL for most K2+ rows.
- **TFU/DJJ only on K2+:** Fundal height and fetal heart rate appear only from second trimester onward. Expect NULL for K1 rows.
- **Status TT only on K1:** Immunization status is recorded only at K1 visits. Subsequent visits leave it blank.
- **Umur is calculated, not stored:** The external "Umur" column is derived from Tanggal Lahir. iBundaCare does not store age — it calculates it. Discard this column.

---

## 7. Recommended Import Order

Due to foreign key constraints, records must be inserted in this order:

```
1. kelurahan       (pre-seed if needed)
2. wilker_posyandu (pre-seed if needed)
3. bidan           (create import account)
4. ibu             (one per unique NIK)
5. kehamilan       (one per unique NIK + HPHT combination)
6. lab_screening   (one per ANC row that has lab data)
7. antenatal_care  (one per row, linking to kehamilan + bidan + lab_screening)
8. komplikasi      (only for rows with komplikasi flags)
```

---

## 8. Final Verdict

The external data is **highly compatible** with the iBundaCare schema for the core ANC workflow. The three tables that matter most — `ibu`, `kehamilan`, and `antenatal_care` — all have strong column matches and can be populated with minimal transformation. The `lab_screening` table requires a value-mapping layer (boolean/+- flags → enum values) but is otherwise straightforward.

The remaining tables (`persalinan`, `bayi`, `kunjungan_nifas`, `suami`, `riwayat_penyakit`, `jiwa_screening`) are simply out of scope for this data source and should be left empty until populated through normal app usage.

A well-written import script targeting these 4–5 tables would successfully migrate this external data with high fidelity.
