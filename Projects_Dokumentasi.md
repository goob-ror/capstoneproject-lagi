# iBundaCare — Dokumentasi Proyek

> **Versi Dokumentasi:** 1.0  
> **Tanggal:** April 2026  
> **Status Proyek:** Aktif (Development / Production)

---

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Tujuan dan Latar Belakang](#2-tujuan-dan-latar-belakang)
3. [Arsitektur Sistem](#3-arsitektur-sistem)
4. [Teknologi yang Digunakan](#4-teknologi-yang-digunakan)
5. [Struktur Direktori](#5-struktur-direktori)
6. [Skema Database](#6-skema-database)
7. [API Endpoints](#7-api-endpoints)
8. [Fitur Utama](#8-fitur-utama)
9. [Keamanan](#9-keamanan)
10. [PWA dan Offline Support](#10-pwa-dan-offline-support)
11. [Fitur Import Data](#11-fitur-import-data)
12. [Algoritma Penilaian Risiko Maternal](#12-algoritma-penilaian-risiko-maternal)
13. [Manajemen Pengguna](#13-manajemen-pengguna)
14. [Laporan dan Rekapitulasi](#14-laporan-dan-rekapitulasi)
15. [Konfigurasi dan Deployment](#15-konfigurasi-dan-deployment)
16. [Panduan Pengembangan](#16-panduan-pengembangan)
17. [Referensi](#17-referensi)

---

## 1. Gambaran Umum

**iBundaCare** adalah aplikasi web berbasis **Progressive Web App (PWA)** yang dirancang untuk mendukung pelayanan kesehatan ibu dan anak di tingkat **Puskesmas** dan **Posyandu**. Aplikasi ini membantu tenaga kesehatan (bidan, koordinator, admin) dalam mencatat, memantau, dan menganalisis data kesehatan ibu hamil secara digital.

Aplikasi ini dikembangkan sebagai **Capstone Project** dengan target pengguna utama adalah bidan dan tenaga kesehatan di wilayah kerja Puskesmas, khususnya di **Kota Samarinda, Kalimantan Timur** (berdasarkan konfigurasi domain `samarindakota.go.id`).

### Fitur Ringkas

| Fitur | Deskripsi |
|-------|-----------|
| Data Ibu | Manajemen data pasien ibu hamil lengkap |
| Kunjungan ANC | Pencatatan kunjungan antenatal care (K1–K8) |
| Persalinan | Pencatatan data persalinan dan data bayi |
| Kunjungan Nifas | Pencatatan kunjungan pasca persalinan (KF1–KF4) |
| Komplikasi | Pencatatan dan pemantauan komplikasi kehamilan |
| Dashboard | Visualisasi statistik dan grafik kesehatan ibu |
| Rekapitulasi | Laporan komprehensif per kelurahan/periode |
| Import Data | Import massal dari file Excel eksternal |
| Export Excel | Ekspor laporan bulanan ke format Excel |
| Posyandu | Manajemen data wilayah kerja posyandu |
| User Management | Manajemen akun pengguna sistem |

---

## 2. Tujuan dan Latar Belakang

### Latar Belakang

Pelayanan Antenatal Care (ANC) merupakan komponen penting dalam upaya penurunan Angka Kematian Ibu (AKI) dan Angka Kematian Bayi (AKB) di Indonesia. Berdasarkan **Permenkes No. 21 Tahun 2021** tentang Pelayanan Kesehatan Masa Sebelum Hamil, Masa Hamil, Persalinan, dan Masa Sesudah Melahirkan, setiap ibu hamil berhak mendapatkan minimal **6 kali kunjungan ANC** (K1–K6) selama kehamilan.

Pencatatan manual menggunakan buku register rentan terhadap:
- Kehilangan data
- Kesulitan analisis dan pelaporan
- Keterlambatan deteksi risiko tinggi
- Duplikasi data

**iBundaCare** hadir sebagai solusi digital untuk mengatasi permasalahan tersebut.

### Tujuan

1. **Digitalisasi** pencatatan data kesehatan ibu hamil
2. **Deteksi dini** risiko kehamilan melalui sistem skoring otomatis
3. **Pemantauan** cakupan pelayanan ANC per wilayah
4. **Pelaporan** otomatis dalam format yang sesuai standar Puskesmas
5. **Aksesibilitas** data meski dalam kondisi offline (PWA)
6. **Migrasi data** dari sistem lama melalui fitur import Excel

---

## 3. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React 19 SPA (PWA)                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │  │
│  │  │  Pages   │  │Components│  │    Services/Utils  │ │  │
│  │  │ (MVP     │  │(Sidebar, │  │ (AuthModel,        │ │  │
│  │  │ Pattern) │  │ Offline  │  │  SessionManager,   │ │  │
│  │  │          │  │Indicator)│  │  IndexedDB,        │ │  │
│  │  └──────────┘  └──────────┘  │  RiskScoring)      │ │  │
│  │                              └────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │         Service Worker (PWA Cache)              │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │ HTTP/HTTPS (REST API)
                              │ Proxy: localhost:6969 → 6767
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js/Express)                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Express.js v5                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │  │
│  │  │  Routes  │  │Middleware│  │    Controllers      │ │  │
│  │  │ (14 modul│  │ (Auth,   │  │ (Excel Export,     │ │  │
│  │  │  route)  │  │  Rate    │  │  ANC Terpadu,      │ │  │
│  │  │          │  │  Limiter,│  │  Komplikasi, dll)  │ │  │
│  │  │          │  │  Input   │  │                    │ │  │
│  │  │          │  │  Validator│ │                    │ │  │
│  │  └──────────┘  └──────────┘  └────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │ mysql2 (Connection Pool)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL 8.0)                      │
│                                                             │
│   ibu │ kehamilan │ antenatal_care │ lab_screening          │
│   persalinan │ bayi │ kunjungan_nifas │ komplikasi          │
│   bidan │ kelurahan │ wilker_posyandu │ suami               │
│   riwayat_penyakit │ jiwa_screening │ kunjungan_nifas_bayi  │
└─────────────────────────────────────────────────────────────┘
```

### Pola Arsitektur Frontend

Frontend menggunakan pola **MVP (Model-View-Presenter)**:

- **Model** (`*-model.js`): Logika bisnis dan komunikasi API via `axios`
- **Presenter** (`*-presenter.js`): Jembatan antara View dan Model, mengelola state
- **View** (`*.js`): Komponen React yang hanya menangani rendering UI

Contoh: `TambahANC.js` (View) → `TambahANC-presenter.js` (Presenter) → `TambahANC-model.js` (Model) → API

---

## 4. Teknologi yang Digunakan

### Frontend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| React | 19.2.0 | UI Framework |
| React Router DOM | 7.9.6 | Client-side routing |
| Axios | 1.13.5 | HTTP client |
| Chart.js + react-chartjs-2 | 4.5.1 / 5.3.1 | Visualisasi grafik dashboard |
| React Select | 5.10.2 | Dropdown dengan pencarian |
| SweetAlert2 | 11.26.18 | Dialog/notifikasi interaktif |
| XLSX | 0.18.5 | Parsing file Excel (import) |
| DataTables.net | 2.3.5 | Tabel data interaktif |
| jQuery | 3.7.1 | Dependensi DataTables |
| react-google-recaptcha-v3 | 1.11.0 | Proteksi bot pada form login/register |

### Backend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Node.js | LTS | Runtime JavaScript server |
| Express.js | 5.1.0 | Web framework |
| mysql2 | 3.15.3 | Driver MySQL dengan Promise support |
| jsonwebtoken | 9.0.2 | Autentikasi JWT |
| bcryptjs | 3.0.3 | Hashing password |
| express-rate-limit | 8.3.1 | Rate limiting global API |
| ExcelJS | 4.4.0 | Generate laporan Excel |
| xlsx-populate | 1.21.0 | Manipulasi template Excel |
| dotenv | 17.2.3 | Manajemen environment variables |
| cors | 2.8.5 | Cross-Origin Resource Sharing |
| nodemon | 3.1.11 | Auto-restart server (development) |
| concurrently | 8.2.2 | Jalankan frontend + backend bersamaan |

### Database

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| MySQL | 8.0.30 | Relational database |
| Connection Pool | 10 koneksi | Manajemen koneksi efisien |

### DevOps / Deployment

| Teknologi | Fungsi |
|-----------|--------|
| PM2 (ecosystem.config.js) | Process manager untuk production |
| Apache (.htaccess) | Web server / reverse proxy |
| Service Worker | PWA caching dan offline support |

---

## 5. Struktur Direktori

```
ibundacare/
├── public/                          # Static assets
│   ├── index.html                   # HTML entry point
│   ├── service-worker.js            # PWA Service Worker
│   ├── manifest.json                # PWA manifest
│   └── images/                      # Logo dan gambar
│
├── src/                             # Source code frontend (React)
│   ├── App.js                       # Root component + routing
│   ├── index.js                     # Entry point + PWA registration
│   │
│   ├── components/                  # Komponen reusable
│   │   ├── Sidebar/                 # Navigasi sidebar
│   │   ├── LoadingSplash/           # Loading screen
│   │   └── OfflineIndicator/        # Indikator status offline
│   │
│   ├── pages/                       # Halaman-halaman aplikasi (MVP pattern)
│   │   ├── LoginPage/               # Halaman login
│   │   ├── RegisterPage/            # Halaman registrasi
│   │   ├── AuthPage/                # Halaman menunggu persetujuan
│   │   ├── Dashboard/               # Dashboard statistik
│   │   ├── DataIbu/                 # Daftar data ibu
│   │   ├── TambahIbu/               # Form tambah/edit ibu
│   │   ├── DetailIbu/               # Detail profil ibu
│   │   ├── KunjunganANC/            # Daftar kunjungan ANC
│   │   ├── TambahANC/               # Form tambah/edit kunjungan ANC
│   │   ├── Persalinan/              # Daftar data persalinan
│   │   ├── TambahPersalinan/        # Form tambah/edit persalinan
│   │   ├── KunjunganNifas/          # Daftar kunjungan nifas
│   │   ├── TambahNifas/             # Form tambah/edit kunjungan nifas
│   │   ├── Komplikasi/              # Daftar komplikasi
│   │   ├── TambahKomplikasi/        # Form tambah/edit komplikasi
│   │   ├── Posyandu/                # Manajemen posyandu
│   │   ├── Rekapitulasi/            # Laporan rekapitulasi
│   │   ├── UserManagement/          # Manajemen pengguna
│   │   ├── ImportData/              # Import data dari Excel
│   │   └── ImportDraft/             # Preview draft import
│   │
│   ├── services/                    # Service layer
│   │   ├── AuthModel.js             # Model autentikasi
│   │   ├── sessionManager.js        # Manajemen sesi online/offline
│   │   └── indexedDBService.js      # Layanan IndexedDB
│   │
│   ├── hooks/                       # Custom React hooks
│   │   └── useFormCache.js          # Cache form data
│   │
│   └── utils/                       # Utilitas
│       ├── maternalRiskScoring.js   # Algoritma skoring risiko maternal
│       ├── import-processor.js      # Orkestrasi pipeline import Excel
│       ├── import-mapper.js         # Mapping kolom Excel ke skema DB
│       ├── import-normalizer.js     # Normalisasi dan validasi data import
│       ├── import-defaulter-fill.js # Pengisian nilai default data import
│       ├── import-kunjungan-solver.js # Solver jenis kunjungan ANC
│       ├── import-risk-scorer.js    # Skoring risiko untuk data import
│       └── indexedDB.js             # Operasi IndexedDB low-level
│
├── server/                          # Source code backend (Node.js)
│   ├── server.js                    # Entry point server
│   │
│   ├── database/
│   │   └── db.js                    # Konfigurasi MySQL connection pool
│   │
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication middleware
│   │   ├── inputValidator.js        # Validasi & sanitasi input (XSS/SQLi)
│   │   └── rateLimiter.js           # Rate limiter login progresif
│   │
│   ├── routes/                      # API route handlers
│   │   ├── authRoutes.js            # /api/auth (login, register)
│   │   ├── ibuRoutes.js             # /api/ibu (CRUD data ibu)
│   │   ├── ancRoutes.js             # /api/anc (CRUD kunjungan ANC)
│   │   ├── persalinanRoutes.js      # /api/persalinan (CRUD persalinan)
│   │   ├── nifasRoutes.js           # /api/nifas (CRUD kunjungan nifas)
│   │   ├── komplikasiRoutes.js      # /api/komplikasi (CRUD komplikasi)
│   │   ├── dashboardRoutes.js       # /api/dashboard (statistik)
│   │   ├── rekapitulasiRoutes.js    # /api/rekapitulasi (laporan)
│   │   ├── posyanduRoutes.js        # /api/posyandu (CRUD posyandu)
│   │   ├── kelurahanRoutes.js       # /api/kelurahan (data kelurahan)
│   │   ├── userRoutes.js            # /api/users (manajemen user)
│   │   ├── excelExportRoutes.js     # /api/excel-export
│   │   ├── excelReportBulananRoutes.js # /api/excel-report-bulanan
│   │   ├── reportDataRoutes.js      # /api/report-data
│   │   └── importRoutes.js          # /api/import (import data)
│   │
│   └── process/                     # Business logic controllers
│       ├── ancController.js         # Logika ANC
│       ├── ancTerpaduController.js  # Logika ANC Terpadu
│       ├── commonController.js      # Logika umum
│       ├── dataPasienController.js  # Logika data pasien
│       ├── excelExportController.js # Logika export Excel
│       ├── komplikasiController.js  # Logika komplikasi
│       ├── nifasPersalinanController.js # Logika nifas & persalinan
│       └── worksheets/              # Template worksheet Excel
│           ├── ancWorksheet.js
│           ├── ancTerpaduWorksheet.js
│           ├── dataPasienWorksheet.js
│           ├── komplikasiWorksheet.js
│           ├── monthlyDataWorksheet.js
│           └── nifasPersalinanWorksheet.js
│
├── .env                             # Environment variables (tidak di-commit)
├── example.env                      # Template environment variables
├── package.json                     # Dependencies dan scripts
├── ecosystem.config.js              # Konfigurasi PM2
├── postcss.config.js                # Konfigurasi PostCSS
├── .htaccess                        # Konfigurasi Apache
├── ibundacare-structure.sql         # Skema database (DDL)
└── ibundacare.sql                   # Data database lengkap
