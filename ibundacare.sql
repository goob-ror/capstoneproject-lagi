-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 21, 2025 at 12:12 PM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ibundacare`
--

-- --------------------------------------------------------

--
-- Table structure for table `antenatal_care`
--

CREATE TABLE `antenatal_care` (
  `id` int NOT NULL,
  `tanggal_kunjungan` datetime NOT NULL,
  `jenis_kunjungan` enum('K1','K2','K3','K4','K5','K6') NOT NULL,
  `jenis_akses` enum('Murni','Akses') NOT NULL,
  `pemeriksa` enum('Bidan','Dokter') NOT NULL,
  `berat_badan` decimal(5,2) DEFAULT NULL,
  `tekanan_darah` varchar(10) DEFAULT NULL,
  `lila` decimal(4,2) DEFAULT NULL,
  `tinggi_fundus` decimal(4,2) DEFAULT NULL,
  `denyut_jantung_janin` int DEFAULT NULL,
  `status_imunisasi_tt` enum('T1','T2','T3','T4','T5') DEFAULT NULL,
  `beri_tablet_fe` tinyint(1) DEFAULT '0',
  `hasil_lab_hb` decimal(4,2) DEFAULT NULL,
  `lab_protein_urine` enum('Negatif','+1','+2','+3','+4') DEFAULT NULL,
  `lab_gula_darah` varchar(20) DEFAULT NULL,
  `hasil_lab_lainnya` text,
  `skrining_hiv` enum('Non-Reaktif','Reaktif','Belum Diperiksa') DEFAULT 'Belum Diperiksa',
  `skrining_sifilis` enum('Non-Reaktif','Reaktif','Belum Diperiksa') DEFAULT 'Belum Diperiksa',
  `skrining_hbsag` enum('Non-Reaktif','Reaktif','Belum Diperiksa') DEFAULT 'Belum Diperiksa',
  `skrining_tb` enum('Negatif','Positif','Suspek','Belum Diperiksa') DEFAULT 'Belum Diperiksa',
  `terapi_malaria` tinyint(1) DEFAULT '0',
  `terapi_kecacingan` tinyint(1) DEFAULT '0',
  `hasil_usg` text,
  `status_kmk_usg` enum('Sesuai','Tidak Sesuai') DEFAULT NULL,
  `status_risiko_visit` enum('Normal','Risiko Tinggi') NOT NULL,
  `skrining_jiwa` text,
  `hasil_temu_wicara` text,
  `tata_laksana_kasus` text,
  `keterangan_anc` text,
  `forkey_hamil` int NOT NULL,
  `forkey_bidan` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `antenatal_care`
--

INSERT INTO `antenatal_care` (`id`, `tanggal_kunjungan`, `jenis_kunjungan`, `jenis_akses`, `pemeriksa`, `berat_badan`, `tekanan_darah`, `lila`, `tinggi_fundus`, `denyut_jantung_janin`, `status_imunisasi_tt`, `beri_tablet_fe`, `hasil_lab_hb`, `lab_protein_urine`, `lab_gula_darah`, `hasil_lab_lainnya`, `skrining_hiv`, `skrining_sifilis`, `skrining_hbsag`, `skrining_tb`, `terapi_malaria`, `terapi_kecacingan`, `hasil_usg`, `status_kmk_usg`, `status_risiko_visit`, `skrining_jiwa`, `hasil_temu_wicara`, `tata_laksana_kasus`, `keterangan_anc`, `forkey_hamil`, `forkey_bidan`, `created_at`, `updated_at`) VALUES
(1, '2024-05-20 09:00:00', 'K1', 'Murni', 'Bidan', 55.50, '120/80', 23.50, 16.00, 140, 'T1', 1, 11.50, 'Negatif', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 0, 0, NULL, NULL, 'Normal', NULL, NULL, NULL, NULL, 1, 1, '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(2, '2024-05-25 10:00:00', 'K1', 'Murni', 'Bidan', 58.00, '118/76', 24.00, 15.50, 145, 'T1', 1, 12.00, 'Negatif', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 0, 0, NULL, NULL, 'Normal', NULL, NULL, NULL, NULL, 2, 2, '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(3, '2024-07-15 08:30:00', 'K2', 'Murni', 'Bidan', 57.00, '122/78', 23.80, 24.00, 142, 'T2', 1, 11.80, 'Negatif', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 0, 0, NULL, NULL, 'Normal', NULL, NULL, NULL, NULL, 1, 1, '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(4, '2024-08-10 09:15:00', 'K2', 'Murni', 'Bidan', 59.50, '125/80', 24.20, 23.50, 138, 'T2', 1, 12.20, 'Negatif', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 0, 0, NULL, NULL, 'Normal', NULL, NULL, NULL, NULL, 2, 2, '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(5, '2024-09-10 10:00:00', 'K3', 'Murni', 'Bidan', 58.50, '130/85', 24.00, 28.00, 140, 'T3', 1, 11.20, '+1', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 0, 0, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, NULL, 1, 1, '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(6, '2024-10-05 11:00:00', 'K3', 'Murni', 'Bidan', 61.00, '118/75', 24.50, 27.50, 143, 'T3', 1, 12.50, 'Negatif', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 0, 0, NULL, NULL, 'Normal', NULL, NULL, NULL, NULL, 2, 2, '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(7, '2024-10-25 08:00:00', 'K4', 'Murni', 'Bidan', 59.00, '135/90', 23.80, 30.00, 136, 'T4', 1, 10.80, '+2', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 0, 0, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, NULL, 1, 1, '2025-11-18 12:20:23', '2025-11-18 12:20:23');

-- --------------------------------------------------------

--
-- Table structure for table `bidan`
--

CREATE TABLE `bidan` (
  `id` int NOT NULL,
  `username` varchar(30) NOT NULL,
  `password` varchar(100) NOT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `role` enum('Bidan','Koordinator','Admin') DEFAULT 'Bidan',
  `isAuth` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `bidan`
--

INSERT INTO `bidan` (`id`, `username`, `password`, `nama_lengkap`, `no_hp`, `role`, `isAuth`, `created_at`, `updated_at`) VALUES
(4, 'adminBidan', '$2b$12$SaoM5A9bM1UXnIEN3T.bPuH.nr84uBlMWJ3wbn8DMYzc2PUiOvNJy', 'User Admin', '081122334455', 'Bidan', 1, '2025-11-21 12:10:39', '2025-11-21 12:10:39');

-- --------------------------------------------------------

--
-- Table structure for table `ibu`
--

CREATE TABLE `ibu` (
  `id` int NOT NULL,
  `nik_ibu` varchar(16) NOT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `gol_darah` varchar(2) DEFAULT NULL,
  `rhesus` varchar(8) DEFAULT NULL,
  `buku_kia` varchar(10) DEFAULT NULL,
  `pekerjaan` varchar(50) DEFAULT NULL,
  `pendidikan` varchar(50) DEFAULT NULL,
  `kelurahan` varchar(50) DEFAULT NULL,
  `alamat_lengkap` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ibu`
--

INSERT INTO `ibu` (`id`, `nik_ibu`, `nama_lengkap`, `tanggal_lahir`, `no_hp`, `gol_darah`, `rhesus`, `buku_kia`, `pekerjaan`, `pendidikan`, `kelurahan`, `alamat_lengkap`, `created_at`, `updated_at`) VALUES
(1, '3275012304950001', 'Siti Rahma', '1995-04-23', '081234567890', 'A', 'Positif', 'BK001', 'Ibu Rumah Tangga', 'SMA', 'Menteng', 'Jl. Melati No. 15, RT 01/RW 02', '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(2, '3275011508920002', 'Diana Sari', '1992-08-15', '081234567891', 'B', 'Positif', 'BK002', 'Guru', 'S1', 'Kebayoran', 'Jl. Mawar No. 25, RT 03/RW 01', '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(3, '3275012001970003', 'Rina Wijaya', '1997-01-20', '081234567892', 'O', 'Positif', 'BK003', 'Karyawan Swasta', 'D3', 'Cempaka', 'Jl. Anggrek No. 8, RT 02/RW 03', '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(4, '3275011003960004', 'Maya Dewi', '1996-03-10', '081234567893', 'AB', 'Negatif', 'BK004', 'PNS', 'S1', 'Pasar Minggu', 'Jl. Kenanga No. 5, RT 04/RW 02', '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(5, '3275010508940005', 'Ani Lestari', '1994-08-05', '081234567894', 'A', 'Positif', 'BK005', 'Wiraswasta', 'SMA', 'Tanah Abang', 'Jl. Flamboyan No. 12, RT 05/RW 01', '2025-11-18 12:20:23', '2025-11-18 12:20:23');

-- --------------------------------------------------------

--
-- Table structure for table `kehamilan`
--

CREATE TABLE `kehamilan` (
  `id` int NOT NULL,
  `gravida` int DEFAULT '1',
  `partus` int DEFAULT '0',
  `abortus` int DEFAULT '0',
  `haid_pertama` date DEFAULT NULL,
  `haid_terakhir` date NOT NULL,
  `taksiran_persalinan` date DEFAULT NULL,
  `status_kehamilan` enum('Hamil','Bersalin','Nifas','Selesai') DEFAULT 'Hamil',
  `forkey_ibu` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `kehamilan`
--

INSERT INTO `kehamilan` (`id`, `gravida`, `partus`, `abortus`, `haid_pertama`, `haid_terakhir`, `taksiran_persalinan`, `status_kehamilan`, `forkey_ibu`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 0, '2024-02-01', '2024-02-15', '2024-11-22', 'Hamil', 1, '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(2, 1, 0, 0, '2024-01-20', '2024-02-05', '2024-11-12', 'Hamil', 2, '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(3, 3, 2, 0, '2024-03-01', '2024-03-15', '2024-12-20', 'Hamil', 3, '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(4, 1, 0, 0, '2024-04-10', '2024-04-25', '2025-02-01', 'Hamil', 4, '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(5, 2, 1, 0, '2024-01-15', '2024-02-01', '2024-11-08', 'Hamil', 5, '2025-11-18 12:20:23', '2025-11-18 12:20:23');

-- --------------------------------------------------------

--
-- Table structure for table `komplikasi`
--

CREATE TABLE `komplikasi` (
  `id` int NOT NULL,
  `kode_diagnosis` varchar(10) DEFAULT NULL,
  `nama_komplikasi` varchar(100) NOT NULL,
  `waktu_kejadian` enum('Saat Hamil','Bersalin','Nifas') NOT NULL,
  `tanggal_diagnosis` date NOT NULL,
  `rujuk_rs` tinyint(1) DEFAULT '0',
  `tanggal_rujukan` date DEFAULT NULL,
  `tekanan_darah` varchar(10) DEFAULT NULL,
  `protein_urine` varchar(20) DEFAULT NULL,
  `gejala_penyerta` text,
  `terapi_diberikan` text,
  `tingkat_keparahan` enum('Ringan','Sedang','Berat') DEFAULT NULL,
  `status_penanganan` enum('Ditangani','Dirujuk','Selesai') DEFAULT 'Ditangani',
  `keterangan` text,
  `forkey_hamil` int NOT NULL,
  `forkey_anc` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `komplikasi`
--

INSERT INTO `komplikasi` (`id`, `kode_diagnosis`, `nama_komplikasi`, `waktu_kejadian`, `tanggal_diagnosis`, `rujuk_rs`, `tanggal_rujukan`, `tekanan_darah`, `protein_urine`, `gejala_penyerta`, `terapi_diberikan`, `tingkat_keparahan`, `status_penanganan`, `keterangan`, `forkey_hamil`, `forkey_anc`, `created_at`, `updated_at`) VALUES
(1, 'O14.1', 'Pre-eklampsia berat', 'Saat Hamil', '2024-10-25', 1, '2024-10-25', '150/100', '+2', 'Sakit kepala, pandangan kabur', NULL, 'Berat', 'Dirujuk', 'Diberikan MgSO4 loading dose sebelum rujuk ke RSUD', 1, 6, '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(2, 'O99.0', 'Anemia ibu hamil', 'Saat Hamil', '2024-09-10', 0, NULL, '120/80', 'Negatif', 'Lemah, lesu, pucat', NULL, 'Sedang', 'Ditangani', 'Diberikan tablet Fe 2x1 dan konsumsi makanan tinggi zat besi', 1, 5, '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(3, 'O13', 'Hipertensi gestasional', 'Saat Hamil', '2024-08-10', 0, NULL, '140/90', 'Negatif', 'Tidak ada gejala spesifik', NULL, 'Ringan', 'Ditangani', 'Pemantauan tekanan darah ketat dan modifikasi gaya hidup', 2, 4, '2025-11-18 12:20:23', '2025-11-18 12:20:23');

-- --------------------------------------------------------

--
-- Table structure for table `kunjungan_nifas`
--

CREATE TABLE `kunjungan_nifas` (
  `id` int NOT NULL,
  `tanggal_kunjungan` datetime NOT NULL,
  `hari_nifas` int DEFAULT NULL,
  `pemeriksa` enum('Bidan','Dokter') NOT NULL,
  `tekanan_darah` varchar(10) DEFAULT NULL,
  `suhu_badan` decimal(4,2) DEFAULT NULL,
  `involusio_uteri` enum('Baik','Lambat','Infeksi') DEFAULT NULL,
  `lochea` enum('Rubra','Seroza','Alba','Normal','Bau') DEFAULT NULL,
  `payudara` enum('Normal','Bengkak','Puting Lecet','Mastitis') DEFAULT NULL,
  `konseling_asi` tinyint(1) DEFAULT '0',
  `berat_badan_bayi` decimal(4,2) DEFAULT NULL,
  `suhu_bayi` decimal(4,2) DEFAULT NULL,
  `pemberian_asi` enum('ASI Eksklusif','ASI + Formula','Formula') DEFAULT NULL,
  `keterangan` text,
  `forkey_hamil` int NOT NULL,
  `forkey_bidan` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `persalinan`
--

CREATE TABLE `persalinan` (
  `id` int NOT NULL,
  `tanggal_persalinan` datetime NOT NULL,
  `tempat_persalinan` enum('RS','Puskesmas','Rumah','Klinik') NOT NULL,
  `penolong` enum('Bidan','Dokter','Dukun','Lainnya') NOT NULL,
  `cara_persalinan` enum('Spontan','Vakum','Forceps','Sectio') NOT NULL,
  `komplikasi_ibu` text,
  `perdarahan` enum('Tidak','Ringan','Sedang','Berat') DEFAULT 'Tidak',
  `robekan_jalan_lahir` enum('Tidak','Perineum','Serviks','Vagina') DEFAULT NULL,
  `jumlah_bayi` int DEFAULT '1',
  `jenis_kelamin_bayi` enum('Laki-laki','Perempuan','Kembar Campur') DEFAULT NULL,
  `berat_badan_bayi` decimal(4,2) DEFAULT NULL,
  `panjang_badan_bayi` decimal(4,2) DEFAULT NULL,
  `kondisi_bayi` enum('Sehat','Sakit','Meninggal') DEFAULT NULL,
  `asfiksia` enum('Tidak','Ringan','Berat') DEFAULT NULL,
  `keterangan_bayi` text,
  `inisiasi_menyusui_dini` tinyint(1) DEFAULT '0',
  `vitamin_k1` tinyint(1) DEFAULT '0',
  `salep_mata` tinyint(1) DEFAULT '0',
  `keterangan` text,
  `forkey_hamil` int NOT NULL,
  `forkey_bidan` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `suami`
--

CREATE TABLE `suami` (
  `id` int NOT NULL,
  `nik_suami` varchar(16) DEFAULT NULL,
  `nama_lengkap` varchar(100) DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `gol_darah` varchar(2) DEFAULT NULL,
  `pekerjaan` varchar(50) DEFAULT NULL,
  `pendidikan` varchar(50) DEFAULT NULL,
  `forkey_ibu` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `suami`
--

INSERT INTO `suami` (`id`, `nik_suami`, `nama_lengkap`, `tanggal_lahir`, `no_hp`, `gol_darah`, `pekerjaan`, `pendidikan`, `forkey_ibu`, `created_at`, `updated_at`) VALUES
(1, '3275011508850001', 'Budi Santoso', '1985-08-15', '081234567895', 'A', 'PNS', 'S1', 1, '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(2, '3275012008900002', 'Ahmad Wijaya', '1990-08-20', '081234567896', 'B', 'Karyawan Swasta', 'D3', 2, '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(3, '3275011203920003', 'Rudi Hermawan', '1992-03-12', '081234567897', 'O', 'Wiraswasta', 'SMA', 3, '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(4, '3275012507880004', 'Dedi Pratama', '1988-07-25', '081234567898', 'AB', 'Dokter', 'S2', 4, '2025-11-18 12:20:23', '2025-11-18 12:20:23'),
(5, '3275011809910005', 'Eko Susilo', '1991-09-18', '081234567899', 'A', 'Engineer', 'S1', 5, '2025-11-18 12:20:23', '2025-11-18 12:20:23');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `antenatal_care`
--
ALTER TABLE `antenatal_care`
  ADD PRIMARY KEY (`id`),
  ADD KEY `forkey_bidan` (`forkey_bidan`),
  ADD KEY `idx_anc_kehamilan` (`forkey_hamil`),
  ADD KEY `idx_anc_tanggal` (`tanggal_kunjungan`),
  ADD KEY `idx_anc_jenis` (`jenis_kunjungan`),
  ADD KEY `idx_anc_risiko` (`status_risiko_visit`);

--
-- Indexes for table `bidan`
--
ALTER TABLE `bidan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `ibu`
--
ALTER TABLE `ibu`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nik_ibu` (`nik_ibu`),
  ADD KEY `idx_ibu_nik` (`nik_ibu`),
  ADD KEY `idx_ibu_nama` (`nama_lengkap`),
  ADD KEY `idx_ibu_kelurahan` (`kelurahan`);

--
-- Indexes for table `kehamilan`
--
ALTER TABLE `kehamilan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_kehamilan_ibu` (`forkey_ibu`),
  ADD KEY `idx_kehamilan_status` (`status_kehamilan`),
  ADD KEY `idx_kehamilan_haid` (`haid_terakhir`);

--
-- Indexes for table `komplikasi`
--
ALTER TABLE `komplikasi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `forkey_anc` (`forkey_anc`),
  ADD KEY `idx_komplikasi_kehamilan` (`forkey_hamil`),
  ADD KEY `idx_komplikasi_tanggal` (`tanggal_diagnosis`),
  ADD KEY `idx_komplikasi_nama` (`nama_komplikasi`);

--
-- Indexes for table `kunjungan_nifas`
--
ALTER TABLE `kunjungan_nifas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `forkey_hamil` (`forkey_hamil`),
  ADD KEY `forkey_bidan` (`forkey_bidan`);

--
-- Indexes for table `persalinan`
--
ALTER TABLE `persalinan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `forkey_hamil` (`forkey_hamil`),
  ADD KEY `forkey_bidan` (`forkey_bidan`);

--
-- Indexes for table `suami`
--
ALTER TABLE `suami`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nik_suami` (`nik_suami`),
  ADD KEY `forkey_ibu` (`forkey_ibu`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `antenatal_care`
--
ALTER TABLE `antenatal_care`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `bidan`
--
ALTER TABLE `bidan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `ibu`
--
ALTER TABLE `ibu`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `kehamilan`
--
ALTER TABLE `kehamilan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `komplikasi`
--
ALTER TABLE `komplikasi`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `kunjungan_nifas`
--
ALTER TABLE `kunjungan_nifas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `persalinan`
--
ALTER TABLE `persalinan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `suami`
--
ALTER TABLE `suami`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `antenatal_care`
--
ALTER TABLE `antenatal_care`
  ADD CONSTRAINT `antenatal_care_ibfk_1` FOREIGN KEY (`forkey_hamil`) REFERENCES `kehamilan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `antenatal_care_ibfk_2` FOREIGN KEY (`forkey_bidan`) REFERENCES `bidan` (`id`);

--
-- Constraints for table `kehamilan`
--
ALTER TABLE `kehamilan`
  ADD CONSTRAINT `kehamilan_ibfk_1` FOREIGN KEY (`forkey_ibu`) REFERENCES `ibu` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `komplikasi`
--
ALTER TABLE `komplikasi`
  ADD CONSTRAINT `komplikasi_ibfk_1` FOREIGN KEY (`forkey_hamil`) REFERENCES `kehamilan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `komplikasi_ibfk_2` FOREIGN KEY (`forkey_anc`) REFERENCES `antenatal_care` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `kunjungan_nifas`
--
ALTER TABLE `kunjungan_nifas`
  ADD CONSTRAINT `kunjungan_nifas_ibfk_1` FOREIGN KEY (`forkey_hamil`) REFERENCES `kehamilan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kunjungan_nifas_ibfk_2` FOREIGN KEY (`forkey_bidan`) REFERENCES `bidan` (`id`);

--
-- Constraints for table `persalinan`
--
ALTER TABLE `persalinan`
  ADD CONSTRAINT `persalinan_ibfk_1` FOREIGN KEY (`forkey_hamil`) REFERENCES `kehamilan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `persalinan_ibfk_2` FOREIGN KEY (`forkey_bidan`) REFERENCES `bidan` (`id`);

--
-- Constraints for table `suami`
--
ALTER TABLE `suami`
  ADD CONSTRAINT `suami_ibfk_1` FOREIGN KEY (`forkey_ibu`) REFERENCES `ibu` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
