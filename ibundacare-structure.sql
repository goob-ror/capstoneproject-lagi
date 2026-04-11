-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 09, 2026 at 12:56 PM
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
-- Database: `ibundacaresv2`
--

-- --------------------------------------------------------

--
-- Table structure for table `antenatal_care`
--

CREATE TABLE `antenatal_care` (
  `id` int NOT NULL,
  `tanggal_kunjungan` datetime NOT NULL,
  `jenis_kunjungan` enum('K1','K2','K3','K4','K5','K6','K7','K8') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `jenis_akses` enum('Murni','Akses') NOT NULL,
  `pemeriksa` enum('Bidan','Dokter') NOT NULL,
  `berat_badan` decimal(5,2) DEFAULT NULL,
  `tekanan_darah` varchar(10) DEFAULT NULL,
  `lila` decimal(4,2) DEFAULT NULL,
  `selisih_beratbadan` decimal(4,2) DEFAULT NULL,
  `tinggi_fundus` decimal(4,2) DEFAULT NULL,
  `denyut_jantung_janin` int DEFAULT NULL,
  `detak_jantung` int DEFAULT NULL,
  `confirm_usg` tinyint(1) NOT NULL DEFAULT '0',
  `status_imunisasi_tt` enum('T0','T1','T2','T3','T4','T5') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `beri_tablet_fe` tinyint(1) DEFAULT '0',
  `hasil_usg` text,
  `status_kmk_usg` enum('Sesuai','Tidak Sesuai') DEFAULT NULL,
  `status_risiko_visit` enum('Normal','Ringan','Sedang','Tinggi') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Normal',
  `hasil_temu_wicara` text,
  `tata_laksana_kasus` text,
  `keterangan_anc` text,
  `forkey_hamil` int NOT NULL,
  `forkey_bidan` int NOT NULL,
  `forkey_lab_screening` int DEFAULT NULL,
  `forkey_jiwa_screening` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bayi`
--

CREATE TABLE `bayi` (
  `id` int NOT NULL,
  `forkey_persalinan` int NOT NULL,
  `urutan_bayi` int NOT NULL,
  `jenis_kelamin` enum('Laki-laki','Perempuan') NOT NULL,
  `berat_badan_lahir` int DEFAULT NULL,
  `panjang_badan_lahir` decimal(4,1) DEFAULT NULL,
  `apgar_menit1` tinyint DEFAULT NULL,
  `apgar_menit5` tinyint DEFAULT NULL,
  `asfiksia` enum('Tidak','Ringan','Berat') DEFAULT 'Tidak',
  `prematur` tinyint(1) DEFAULT '0',
  `gangguan_napas` tinyint(1) DEFAULT NULL,
  `kondisi` enum('Sehat','Sakit','Meninggal') DEFAULT 'Sehat',
  `imunisasi_hb0` tinyint(1) DEFAULT NULL,
  `inisiasi_menyusui_dini` tinyint(1) DEFAULT '0',
  `vitamin_k1` tinyint(1) DEFAULT '0',
  `salep_mata` tinyint(1) DEFAULT '0',
  `status_risiko` enum('Normal','Ringan','Sedang','Berat') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `keterangan` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
  `tinggi_badan` decimal(5,2) DEFAULT NULL COMMENT 'Tinggi badan dalam cm',
  `beratbadan` int DEFAULT NULL,
  `status_hepatitis` enum('Negatif','Hepatitis A','Hepatitis B','Hepatitis C','Belum Diperiksa') DEFAULT 'Belum Diperiksa' COMMENT 'Status hepatitis ibu',
  `rhesus` varchar(8) DEFAULT NULL,
  `buku_kia` varchar(10) DEFAULT NULL,
  `pekerjaan` varchar(50) DEFAULT NULL,
  `pendidikan` varchar(50) DEFAULT NULL,
  `kelurahan_id` int DEFAULT NULL,
  `rt` int DEFAULT NULL,
  `alamat_lengkap` text,
  `posyandu_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jiwa_screening`
--

CREATE TABLE `jiwa_screening` (
  `id` int NOT NULL,
  `skrining_jiwa` text,
  `forkey_hamil` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
  `status_kehamilan` enum('Hamil','Bersalin','Nifas','Selesai','Keguguran') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'Hamil',
  `cara_persalinan` enum('Normal','Caesar','Vakum','Forceps','Lainnya') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `forkey_ibu` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kelurahan`
--

CREATE TABLE `kelurahan` (
  `id` int NOT NULL,
  `nama_kelurahan` varchar(30) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `komplikasi`
--

CREATE TABLE `komplikasi` (
  `id` int NOT NULL,
  `nama_komplikasi` varchar(100) NOT NULL,
  `kejadian` enum('Saat Hamil','Saat Bersalin','Saat Nifas','Bayi') DEFAULT NULL,
  `tanggal_diagnosis` date NOT NULL,
  `rujuk_rs` tinyint(1) DEFAULT '0',
  `nama_rs` text,
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

-- --------------------------------------------------------

--
-- Table structure for table `kunjungan_nifas`
--

CREATE TABLE `kunjungan_nifas` (
  `id` int NOT NULL,
  `tanggal_kunjungan` datetime NOT NULL,
  `jenis_kunjungan` enum('KF1','KF2','KF3','KF4') DEFAULT NULL,
  `pemeriksa` enum('Bidan','Dokter') NOT NULL,
  `tekanan_darah` varchar(10) DEFAULT NULL,
  `berat_badan` decimal(4,2) DEFAULT NULL,
  `suhu_badan` decimal(4,2) DEFAULT NULL,
  `involusio_uteri` enum('Baik','Lambat','Infeksi') DEFAULT NULL,
  `lochea` enum('Rubra','Seroza','Alba','Normal','Bau') DEFAULT NULL,
  `payudara` enum('Normal','Bengkak','Puting Lecet','Mastitis') DEFAULT NULL,
  `konseling_asi` tinyint(1) DEFAULT '0',
  `forkey_hamil` int NOT NULL,
  `forkey_bidan` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kunjungan_nifas_bayi`
--

CREATE TABLE `kunjungan_nifas_bayi` (
  `id` int NOT NULL,
  `forkey_kunjungan_nifas` int NOT NULL COMMENT 'Foreign key to kunjungan_nifas',
  `urutan_bayi` tinyint NOT NULL DEFAULT '1' COMMENT 'Baby order: 1 for first baby, 2 for second (twins)',
  `berat_badan` decimal(4,2) DEFAULT NULL COMMENT 'Baby weight in kg',
  `panjang_badan` decimal(4,1) DEFAULT NULL COMMENT 'Baby length in cm',
  `pemberian_asi` enum('ASI Eksklusif','ASI + Formula','Formula') DEFAULT NULL COMMENT 'Feeding type',
  `kondisi_bayi` enum('Sehat','Sakit','Rujuk') DEFAULT 'Sehat' COMMENT 'Baby health condition',
  `keterangan` text COMMENT 'Additional notes about baby',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Baby data for each kunjungan nifas visit';

-- --------------------------------------------------------

--
-- Table structure for table `lab_screening`
--

CREATE TABLE `lab_screening` (
  `id` int NOT NULL,
  `hasil_lab_hb` decimal(4,2) DEFAULT NULL,
  `lab_protein_urine` enum('Negatif','+1','+2','+3','+4') DEFAULT NULL,
  `lab_gula_darah` varchar(20) DEFAULT NULL,
  `hasil_lab_lainnya` text,
  `skrining_gonorea` enum('Non-Reaktif','Reaktif','Belum Diperiksa') DEFAULT 'Belum Diperiksa',
  `skrining_klamidia` enum('Non-Reaktif','Reaktif','Belum Diperiksa') DEFAULT 'Belum Diperiksa',
  `skrining_hiv` enum('Non-Reaktif','Reaktif','Belum Diperiksa') DEFAULT 'Belum Diperiksa',
  `status_art` enum('Belum ART','Sedang ART','Putus ART','Tidak Diketahui') DEFAULT NULL,
  `skrining_sifilis` enum('Non-Reaktif','Reaktif','Belum Diperiksa') DEFAULT 'Belum Diperiksa',
  `skrining_hbsag` enum('Non-Reaktif','Reaktif','Belum Diperiksa') DEFAULT 'Belum Diperiksa',
  `skrining_tb` enum('Negatif','Positif','Suspek','Belum Diperiksa') DEFAULT 'Belum Diperiksa',
  `malaria_diberi_kelambu` enum('Ya','Tidak') DEFAULT 'Tidak',
  `terapi_malaria` tinyint(1) DEFAULT '0',
  `status_malaria` enum('Positif','Negatif','Belum Diperiksa') DEFAULT 'Belum Diperiksa',
  `terapi_kecacingan` tinyint(1) DEFAULT '0',
  `status_kecacingan` enum('Positif','Negatif','Belum Diperiksa') DEFAULT 'Belum Diperiksa',
  `forkey_hamil` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `persalinan`
--

CREATE TABLE `persalinan` (
  `id` int NOT NULL,
  `tanggal_persalinan` datetime NOT NULL,
  `tempat_persalinan` enum('RS','Puskesmas','Rumah','Klinik') NOT NULL,
  `penolong` enum('Bidan','Dokter','Keluarga','Lainnya') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `cara_persalinan` enum('Spontan','Vakum','Forceps','Sectio') NOT NULL,
  `komplikasi_ibu` text,
  `perdarahan` enum('Tidak','Ringan','Sedang','Berat') DEFAULT 'Tidak',
  `robekan_jalan_lahir` enum('Tidak','Perineum','Serviks','Vagina') DEFAULT NULL,
  `jumlah_bayi` int DEFAULT '1',
  `beri_ttd` tinyint(1) DEFAULT '0',
  `keterangan` text,
  `forkey_hamil` int NOT NULL,
  `forkey_bidan` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `riwayat_penyakit`
--

CREATE TABLE `riwayat_penyakit` (
  `id` int NOT NULL,
  `nama_penyakit` varchar(100) NOT NULL,
  `kategori_penyakit` enum('Penyakit Menular','Penyakit Tidak Menular','Penyakit Kronis','Alergi','Operasi','Lainnya') DEFAULT 'Lainnya',
  `tahun_diagnosis` year DEFAULT NULL,
  `status_penyakit` enum('Sembuh','Dalam Pengobatan','Kronis') DEFAULT 'Sembuh',
  `keterangan` text,
  `forkey_ibu` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Tabel riwayat penyakit ibu - dapat menyimpan multiple penyakit per ibu';

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
  `isPerokok` tinyint(1) NOT NULL DEFAULT '0',
  `forkey_ibu` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wilker_posyandu`
--

CREATE TABLE `wilker_posyandu` (
  `id` int NOT NULL,
  `nama_posyandu` varchar(100) NOT NULL,
  `kelurahan_id` int NOT NULL,
  `rt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
  ADD KEY `idx_anc_risiko` (`status_risiko_visit`),
  ADD KEY `forkey_lab_screening` (`forkey_lab_screening`),
  ADD KEY `forkey_jiwa_screening` (`forkey_jiwa_screening`);

--
-- Indexes for table `bayi`
--
ALTER TABLE `bayi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `forkey_persalinan` (`forkey_persalinan`);

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
  ADD KEY `idx_ibu_kelurahan` (`kelurahan_id`),
  ADD KEY `posyandu_id` (`posyandu_id`);

--
-- Indexes for table `jiwa_screening`
--
ALTER TABLE `jiwa_screening`
  ADD PRIMARY KEY (`id`),
  ADD KEY `forkey_hamil` (`forkey_hamil`);

--
-- Indexes for table `kehamilan`
--
ALTER TABLE `kehamilan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_kehamilan_ibu` (`forkey_ibu`),
  ADD KEY `idx_kehamilan_status` (`status_kehamilan`),
  ADD KEY `idx_kehamilan_haid` (`haid_terakhir`);

--
-- Indexes for table `kelurahan`
--
ALTER TABLE `kelurahan`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `kunjungan_nifas_bayi`
--
ALTER TABLE `kunjungan_nifas_bayi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_kunjungan_nifas` (`forkey_kunjungan_nifas`),
  ADD KEY `idx_urutan` (`urutan_bayi`);

--
-- Indexes for table `lab_screening`
--
ALTER TABLE `lab_screening`
  ADD PRIMARY KEY (`id`),
  ADD KEY `forkey_hamil` (`forkey_hamil`);

--
-- Indexes for table `persalinan`
--
ALTER TABLE `persalinan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `forkey_hamil` (`forkey_hamil`),
  ADD KEY `forkey_bidan` (`forkey_bidan`);

--
-- Indexes for table `riwayat_penyakit`
--
ALTER TABLE `riwayat_penyakit`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_riwayat_ibu` (`forkey_ibu`),
  ADD KEY `idx_riwayat_kategori` (`kategori_penyakit`),
  ADD KEY `idx_riwayat_status` (`status_penyakit`);

--
-- Indexes for table `suami`
--
ALTER TABLE `suami`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nik_suami` (`nik_suami`),
  ADD KEY `forkey_ibu` (`forkey_ibu`);

--
-- Indexes for table `wilker_posyandu`
--
ALTER TABLE `wilker_posyandu`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kelurahan_id` (`kelurahan_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `antenatal_care`
--
ALTER TABLE `antenatal_care`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bayi`
--
ALTER TABLE `bayi`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bidan`
--
ALTER TABLE `bidan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ibu`
--
ALTER TABLE `ibu`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jiwa_screening`
--
ALTER TABLE `jiwa_screening`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kehamilan`
--
ALTER TABLE `kehamilan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kelurahan`
--
ALTER TABLE `kelurahan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `komplikasi`
--
ALTER TABLE `komplikasi`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kunjungan_nifas`
--
ALTER TABLE `kunjungan_nifas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kunjungan_nifas_bayi`
--
ALTER TABLE `kunjungan_nifas_bayi`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lab_screening`
--
ALTER TABLE `lab_screening`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `persalinan`
--
ALTER TABLE `persalinan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `riwayat_penyakit`
--
ALTER TABLE `riwayat_penyakit`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `suami`
--
ALTER TABLE `suami`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wilker_posyandu`
--
ALTER TABLE `wilker_posyandu`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `antenatal_care`
--
ALTER TABLE `antenatal_care`
  ADD CONSTRAINT `antenatal_care_ibfk_1` FOREIGN KEY (`forkey_hamil`) REFERENCES `kehamilan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `antenatal_care_ibfk_2` FOREIGN KEY (`forkey_bidan`) REFERENCES `bidan` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `antenatal_care_ibfk_3` FOREIGN KEY (`forkey_lab_screening`) REFERENCES `lab_screening` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `antenatal_care_ibfk_4` FOREIGN KEY (`forkey_jiwa_screening`) REFERENCES `jiwa_screening` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `bayi`
--
ALTER TABLE `bayi`
  ADD CONSTRAINT `bayi_ibfk_1` FOREIGN KEY (`forkey_persalinan`) REFERENCES `persalinan` (`id`);

--
-- Constraints for table `ibu`
--
ALTER TABLE `ibu`
  ADD CONSTRAINT `ibu_ibfk_1` FOREIGN KEY (`posyandu_id`) REFERENCES `wilker_posyandu` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `ibu_ibfk_2` FOREIGN KEY (`kelurahan_id`) REFERENCES `kelurahan` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `jiwa_screening`
--
ALTER TABLE `jiwa_screening`
  ADD CONSTRAINT `jiwa_screening_ibfk_1` FOREIGN KEY (`forkey_hamil`) REFERENCES `kehamilan` (`id`) ON DELETE CASCADE;

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
  ADD CONSTRAINT `kunjungan_nifas_ibfk_2` FOREIGN KEY (`forkey_bidan`) REFERENCES `bidan` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `kunjungan_nifas_bayi`
--
ALTER TABLE `kunjungan_nifas_bayi`
  ADD CONSTRAINT `fk_nifas_bayi_kunjungan` FOREIGN KEY (`forkey_kunjungan_nifas`) REFERENCES `kunjungan_nifas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `lab_screening`
--
ALTER TABLE `lab_screening`
  ADD CONSTRAINT `lab_screening_ibfk_1` FOREIGN KEY (`forkey_hamil`) REFERENCES `kehamilan` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `persalinan`
--
ALTER TABLE `persalinan`
  ADD CONSTRAINT `persalinan_ibfk_1` FOREIGN KEY (`forkey_hamil`) REFERENCES `kehamilan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `persalinan_ibfk_2` FOREIGN KEY (`forkey_bidan`) REFERENCES `bidan` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `riwayat_penyakit`
--
ALTER TABLE `riwayat_penyakit`
  ADD CONSTRAINT `riwayat_penyakit_ibfk_1` FOREIGN KEY (`forkey_ibu`) REFERENCES `ibu` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `suami`
--
ALTER TABLE `suami`
  ADD CONSTRAINT `suami_ibfk_1` FOREIGN KEY (`forkey_ibu`) REFERENCES `ibu` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wilker_posyandu`
--
ALTER TABLE `wilker_posyandu`
  ADD CONSTRAINT `wilker_posyandu_ibfk_1` FOREIGN KEY (`kelurahan_id`) REFERENCES `kelurahan` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
