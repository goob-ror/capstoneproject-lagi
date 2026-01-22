-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jan 14, 2026 at 08:38 AM
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
  `status_risiko_visit` enum('Normal','Risiko Tinggi') NOT NULL,
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

--
-- Dumping data for table `antenatal_care`
--

INSERT INTO `antenatal_care` (`id`, `tanggal_kunjungan`, `jenis_kunjungan`, `jenis_akses`, `pemeriksa`, `berat_badan`, `tekanan_darah`, `lila`, `selisih_beratbadan`, `tinggi_fundus`, `denyut_jantung_janin`, `detak_jantung`, `confirm_usg`, `status_imunisasi_tt`, `beri_tablet_fe`, `hasil_usg`, `status_kmk_usg`, `status_risiko_visit`, `hasil_temu_wicara`, `tata_laksana_kasus`, `keterangan_anc`, `forkey_hamil`, `forkey_bidan`, `forkey_lab_screening`, `forkey_jiwa_screening`, `created_at`, `updated_at`) VALUES
(1, '2025-03-20 09:00:00', 'K1', 'Murni', 'Bidan', 51.00, '110/70', 24.50, NULL, NULL, NULL, NULL, 0, 'T0', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 1, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(2, '2025-04-25 10:15:00', 'K2', 'Akses', 'Bidan', 53.50, '115/75', 25.00, NULL, 16.00, 138, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 1, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(3, '2025-06-18 08:30:00', 'K4', 'Murni', 'Bidan', 57.00, '120/80', 26.50, NULL, 26.00, 145, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 1, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(4, '2025-08-10 09:45:00', 'K6', 'Akses', 'Dokter', 61.50, '130/85', 28.00, NULL, 34.00, 152, NULL, 0, 'T2', 1, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, 1, 4, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(5, '2025-02-15 10:00:00', 'K1', 'Murni', 'Bidan', 50.00, '108/70', 24.00, NULL, NULL, NULL, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 2, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(6, '2025-04-10 09:30:00', 'K3', 'Akses', 'Bidan', 54.50, '118/78', 25.50, NULL, 20.00, 140, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 2, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(7, '2025-06-05 11:00:00', 'K5', 'Murni', 'Dokter', 59.00, '135/90', 27.50, NULL, 30.00, 148, NULL, 0, 'T2', 1, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, 2, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(8, '2025-09-01 08:45:00', 'K1', 'Murni', 'Bidan', 52.00, '112/72', 24.80, NULL, NULL, NULL, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 3, 4, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(9, '2025-09-20 10:30:00', 'K2', 'Akses', 'Bidan', 55.00, '122/80', 26.00, NULL, 18.00, 142, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 3, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(10, '2025-07-12 09:15:00', 'K1', 'Murni', 'Bidan', 49.50, '110/70', 24.00, NULL, NULL, NULL, NULL, 0, 'T0', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 4, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(11, '2025-08-18 10:45:00', 'K3', 'Akses', 'Bidan', 53.00, '116/76', 25.20, NULL, 22.00, 144, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 4, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(12, '2025-10-22 08:20:00', 'K6', 'Murni', 'Dokter', 60.00, '138/92', 28.50, NULL, 36.00, 158, NULL, 0, 'T2', 1, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, 4, 4, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(13, '2025-05-10 09:30:00', 'K1', 'Murni', 'Bidan', 53.50, '114/74', 25.50, NULL, NULL, NULL, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 5, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(14, '2025-06-08 11:15:00', 'K4', 'Akses', 'Dokter', 58.00, '132/88', 27.80, NULL, 32.00, 150, NULL, 0, 'T2', 1, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, 5, 4, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(15, '2025-04-05 10:00:00', 'K1', 'Murni', 'Bidan', 51.50, '110/70', 24.20, NULL, NULL, NULL, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 6, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(16, '2025-05-20 09:45:00', 'K2', 'Akses', 'Bidan', 54.00, '118/78', 25.80, NULL, 19.00, 141, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 6, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(17, '2025-07-15 08:55:00', 'K4', 'Murni', 'Bidan', 57.50, '124/82', 27.00, NULL, 28.00, 146, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 6, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(18, '2025-06-01 10:20:00', 'K1', 'Murni', 'Bidan', 50.00, '108/68', 24.00, NULL, NULL, NULL, NULL, 0, 'T0', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 7, 4, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(19, '2025-07-25 09:10:00', 'K3', 'Akses', 'Bidan', 54.50, '120/80', 26.00, NULL, 24.00, 143, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 7, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(20, '2025-09-10 11:30:00', 'K5', 'Murni', 'Dokter', 59.00, '134/90', 28.00, NULL, 33.00, 155, NULL, 0, 'T2', 1, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, 7, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(21, '2025-08-05 10:00:00', 'K1', 'Murni', 'Bidan', 52.00, '112/72', 24.80, NULL, NULL, NULL, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 8, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(22, '2025-09-15 09:30:00', 'K2', 'Akses', 'Bidan', 55.50, '122/80', 26.50, NULL, 20.00, 142, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 8, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(23, '2025-10-25 08:45:00', 'K4', 'Murni', 'Dokter', 61.00, '140/95', 29.00, NULL, 36.00, 160, NULL, 0, 'T2', 1, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, 8, 4, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(24, '2025-05-12 10:15:00', 'K1', 'Murni', 'Bidan', 51.00, '110/70', 24.50, NULL, NULL, NULL, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 9, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(25, '2025-06-28 09:20:00', 'K3', 'Akses', 'Bidan', 55.00, '118/76', 26.00, NULL, 23.00, 144, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 9, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(26, '2025-08-20 11:00:00', 'K5', 'Murni', 'Bidan', 59.50, '128/84', 27.50, NULL, 31.00, 149, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 9, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(27, '2025-07-08 10:40:00', 'K1', 'Murni', 'Bidan', 53.00, '114/74', 25.00, NULL, NULL, NULL, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 10, 4, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(28, '2025-08-15 09:15:00', 'K2', 'Akses', 'Dokter', 56.00, '130/88', 26.80, NULL, 25.00, 147, NULL, 0, 'T2', 1, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, 10, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(29, '2025-04-18 10:30:00', 'K1', 'Murni', 'Bidan', 50.50, '108/70', 24.30, NULL, NULL, NULL, NULL, 0, 'T0', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 11, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(30, '2025-05-30 09:45:00', 'K2', 'Akses', 'Bidan', 53.00, '116/76', 25.50, NULL, 18.00, 140, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 11, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(31, '2025-07-22 08:20:00', 'K4', 'Murni', 'Bidan', 56.50, '122/80', 26.80, NULL, 27.00, 146, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 11, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(32, '2025-09-05 11:10:00', 'K6', 'Akses', 'Dokter', 62.00, '136/90', 29.00, NULL, 35.00, 158, NULL, 0, 'T2', 1, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, 11, 4, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(33, '2025-05-25 10:00:00', 'K1', 'Murni', 'Bidan', 51.50, '110/70', 24.60, NULL, NULL, NULL, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 12, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(34, '2025-07-10 09:30:00', 'K3', 'Akses', 'Bidan', 55.00, '120/78', 26.20, NULL, 23.00, 143, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 12, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(35, '2025-08-28 10:45:00', 'K5', 'Murni', 'Dokter', 60.00, '132/88', 28.50, NULL, 32.00, 150, NULL, 0, 'T2', 1, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, 12, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(36, '2025-06-15 09:15:00', 'K1', 'Murni', 'Bidan', 52.00, '112/72', 24.90, NULL, NULL, NULL, NULL, 0, 'T0', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 13, 4, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(37, '2025-07-30 10:20:00', 'K2', 'Akses', 'Bidan', 54.50, '118/76', 26.00, NULL, 21.00, 142, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 13, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(38, '2025-09-18 08:40:00', 'K4', 'Murni', 'Bidan', 58.00, '126/82', 27.50, NULL, 30.00, 148, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 13, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(39, '2025-04-22 11:00:00', 'K1', 'Murni', 'Bidan', 50.00, '108/68', 24.10, NULL, NULL, NULL, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 14, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(40, '2025-06-05 09:50:00', 'K3', 'Akses', 'Bidan', 53.50, '116/74', 25.80, NULL, 22.00, 144, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 14, 4, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(41, '2025-08-12 10:30:00', 'K5', 'Murni', 'Dokter', 59.00, '134/90', 28.00, NULL, 33.00, 156, NULL, 0, 'T2', 1, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, 14, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(42, '2025-05-08 09:20:00', 'K1', 'Murni', 'Bidan', 51.00, '110/70', 24.40, NULL, NULL, NULL, NULL, 0, 'T0', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 15, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(43, '2025-06-20 10:45:00', 'K2', 'Akses', 'Bidan', 54.00, '120/80', 26.00, NULL, 19.00, 140, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 15, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(44, '2025-08-08 00:00:00', 'K4', 'Murni', 'Dokter', 58.50, '138/92', 28.50, NULL, 35.00, 159, NULL, 0, 'T2', 1, NULL, 'Sesuai', 'Risiko Tinggi', NULL, NULL, NULL, 15, 4, NULL, NULL, '2025-11-23 14:23:38', '2025-11-24 19:52:33'),
(45, '2025-06-10 10:00:00', 'K1', 'Murni', 'Bidan', 52.50, '112/72', 25.00, NULL, NULL, NULL, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 16, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(46, '2025-07-25 09:30:00', 'K3', 'Akses', 'Bidan', 56.00, '122/80', 26.50, NULL, 25.00, 145, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 16, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(47, '2025-09-05 11:15:00', 'K5', 'Murni', 'Bidan', 60.50, '128/84', 28.00, NULL, 32.00, 150, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 16, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(48, '2025-07-01 09:45:00', 'K1', 'Murni', 'Bidan', 51.00, '110/70', 24.50, NULL, NULL, NULL, NULL, 0, 'T0', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 17, 4, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(49, '2025-08-15 10:20:00', 'K2', 'Akses', 'Bidan', 53.50, '116/76', 25.80, NULL, 20.00, 141, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 17, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(50, '2025-10-01 08:30:00', 'K4', 'Murni', 'Dokter', 59.00, '136/90', 28.50, NULL, 36.00, 160, NULL, 0, 'T2', 1, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, 17, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(51, '2025-05-15 11:00:00', 'K1', 'Murni', 'Bidan', 50.50, '108/68', 24.20, NULL, NULL, NULL, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 18, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(52, '2025-06-28 09:10:00', 'K3', 'Akses', 'Bidan', 54.00, '118/78', 26.00, NULL, 23.00, 143, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 18, 4, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(53, '2025-08-20 10:40:00', 'K5', 'Murni', 'Dokter', 58.50, '132/88', 28.00, NULL, 34.00, 157, NULL, 0, 'T2', 1, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, 18, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(54, '2025-04-30 09:55:00', 'K1', 'Murni', 'Bidan', 51.50, '110/70', 24.70, NULL, NULL, NULL, NULL, 0, 'T0', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 19, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(55, '2025-06-12 10:25:00', 'K2', 'Akses', 'Bidan', 54.50, '120/80', 26.20, NULL, 21.00, 142, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 19, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(56, '2025-08-05 08:50:00', 'K4', 'Murni', 'Bidan', 58.00, '126/82', 27.50, NULL, 30.00, 148, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 19, 4, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(57, '2025-05-20 10:15:00', 'K1', 'Murni', 'Bidan', 52.00, '112/72', 24.90, NULL, NULL, NULL, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 20, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(58, '2025-07-05 09:40:00', 'K3', 'Akses', 'Bidan', 55.50, '122/80', 26.50, NULL, 24.00, 144, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 20, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(59, '2025-08-25 11:20:00', 'K5', 'Murni', 'Dokter', 61.00, '138/92', 29.00, NULL, 37.00, 161, NULL, 0, 'T2', 1, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, 20, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(60, '2025-06-05 09:00:00', 'K1', 'Murni', 'Bidan', 50.00, '108/70', 24.00, NULL, NULL, NULL, NULL, 0, 'T0', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 21, 4, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(61, '2025-07-18 10:30:00', 'K2', 'Akses', 'Bidan', 52.50, '114/74', 25.50, NULL, 19.00, 140, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 21, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(62, '2025-09-10 08:15:00', 'K4', 'Murni', 'Bidan', 56.00, '120/78', 27.00, NULL, 28.00, 146, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 21, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(63, '2025-05-01 11:45:00', 'K1', 'Murni', 'Bidan', 51.00, '110/70', 24.40, NULL, NULL, NULL, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 22, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(64, '2025-06-15 09:20:00', 'K3', 'Akses', 'Bidan', 54.50, '118/76', 26.00, NULL, 22.00, 143, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 22, 4, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(65, '2025-08-08 00:00:00', 'K5', 'Murni', 'Dokter', 59.00, '134/90', 28.50, NULL, 35.00, 159, NULL, 0, 'T2', 1, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, 22, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-24 19:53:26'),
(66, '2025-07-20 09:35:00', 'K1', 'Murni', 'Bidan', 52.50, '112/72', 25.10, NULL, NULL, NULL, NULL, 0, 'T0', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 23, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(67, '2025-08-30 10:10:00', 'K2', 'Akses', 'Bidan', 55.00, '122/80', 26.80, NULL, 25.00, 145, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 23, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(68, '2025-10-15 08:25:00', 'K4', 'Murni', 'Dokter', 60.50, '140/95', 29.50, NULL, 38.00, 162, NULL, 0, 'T2', 1, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, 23, 4, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(69, '2025-06-25 11:00:00', 'K1', 'Murni', 'Bidan', 51.50, '110/70', 24.60, NULL, NULL, NULL, NULL, 0, 'T1', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 24, 1, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(70, '2025-08-05 09:55:00', 'K3', 'Akses', 'Bidan', 55.00, '120/78', 26.50, NULL, 26.00, 147, NULL, 0, 'T2', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 24, 2, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(71, '2025-09-20 10:40:00', 'K5', 'Murni', 'Bidan', 59.50, '130/86', 28.00, NULL, 34.00, 155, NULL, 0, 'T2', 1, NULL, NULL, 'Risiko Tinggi', NULL, NULL, NULL, 24, 3, NULL, NULL, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(72, '2025-11-25 00:00:00', 'K1', 'Murni', 'Bidan', 60.00, '112/72', 25.00, NULL, 10.00, 129, NULL, 0, 'T0', 0, NULL, 'Sesuai', 'Normal', NULL, NULL, NULL, 51, 6, NULL, NULL, '2025-11-24 17:16:26', '2025-11-24 17:16:26'),
(73, '2025-11-24 00:00:00', 'K3', 'Murni', 'Bidan', 60.00, '112/72', 25.00, NULL, 25.00, 139, NULL, 0, 'T1', 1, NULL, 'Sesuai', 'Normal', NULL, NULL, NULL, 53, 6, NULL, NULL, '2025-11-24 17:33:22', '2025-11-24 17:34:12'),
(74, '2025-11-25 00:00:00', 'K3', 'Murni', 'Bidan', 60.00, '125/82', 25.00, NULL, 19.00, 132, NULL, 0, 'T0', 1, NULL, NULL, 'Normal', NULL, NULL, NULL, 10, 6, NULL, NULL, '2025-11-24 17:37:45', '2025-11-24 17:37:45'),
(75, '2025-12-09 00:00:00', 'K1', 'Murni', 'Bidan', 60.00, '138/92', 25.00, NULL, 20.00, 140, NULL, 0, 'T0', 1, NULL, 'Sesuai', 'Normal', NULL, NULL, NULL, 51, 6, NULL, NULL, '2025-12-08 16:25:07', '2025-12-08 16:25:07');

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
(1, 'bidan_siti', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bd. Siti Aminah, S.Tr.Keb', '081250501001', 'Koordinator', 1, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(2, 'bidan_nurul', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bd. Nurul Hidayah, A.Md.Keb', '081340402002', 'Bidan', 1, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(3, 'bidan_ratna', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bd. Ratna Sari, A.Md.Keb', '082190903003', 'Bidan', 1, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(4, 'bidan_eka', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bd. Eka Yuliana, S.Tr.Keb', '085280804004', 'Bidan', 1, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(5, 'admin_puskes', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Rina Wati, S.K.M.', '081170705005', 'Admin', 1, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(6, 'adminBidan', '$2b$12$sq5JJ7vq2i.z/YQdKBs/muZYtBLeIbCExNZF3fq.2C8dmOs.ZJTYe', 'adminBidan', NULL, 'Bidan', 1, '2025-11-23 14:35:00', '2025-11-23 14:35:17');

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

--
-- Dumping data for table `ibu`
--

INSERT INTO `ibu` (`id`, `nik_ibu`, `nama_lengkap`, `tanggal_lahir`, `no_hp`, `gol_darah`, `tinggi_badan`, `beratbadan`, `status_hepatitis`, `rhesus`, `buku_kia`, `pekerjaan`, `pendidikan`, `kelurahan_id`, `rt`, `alamat_lengkap`, `posyandu_id`, `created_at`, `updated_at`) VALUES
(1, '6472014501900001', 'Andi Rina Hartati', '1990-05-12', '081234567001', 'A', 155.50, 52, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'SMA', 1, NULL, 'Jl. Kamboja No. 12 RT. 05', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(2, '6472015002920002', 'Siti Julaeha', '1992-08-23', '081234567002', 'O', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Swasta', 'S1', 2, NULL, 'Jl. Poros Bantuas No. 45 RT. 01', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(3, '6472016203950003', 'Dayang Nurul Hikmah', '1995-03-15', '081234567003', 'B', 162.00, 58, 'Belum Diperiksa', '+', 'Ada', 'PNS', 'S1', 3, NULL, 'Jl. Flamboyan No. 08 RT. 12', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(4, '6472015504980004', 'Sri Wahyuni', '1998-11-02', '081234567004', 'AB', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'SMP', 2, NULL, 'Jl. Gotong Royong No. 22 RT. 03', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(5, '6472016005910005', 'Syarifah Aisyah', '1991-07-19', '081234567005', 'O', 158.50, 55, 'Belum Diperiksa', '+', 'Ada', 'Dagang', 'SMA', 3, NULL, 'Jl. Pangeran Diponegoro No. 10 RT. 07', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(6, '6472014206930006', 'Yuni Shara', '1993-02-10', '081234567006', 'A', NULL, NULL, 'Belum Diperiksa', '+', 'Hilang', 'Swasta', 'D3', 1, NULL, 'Jl. Melati No. 33 RT. 02', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(7, '6472014807960007', 'Nor Hasanah', '1996-09-28', '081234567007', 'B', 160.00, 60, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'SD', 2, NULL, 'Gg. Kenangan No. 5 RT. 04', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(8, '6472015108890008', 'Fitriani', '1989-12-05', '081234567008', 'O', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Honorer', 'S1', 3, NULL, 'Jl. Pendidikan No. 15 RT. 09', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(9, '6472016509940009', 'Indah Permatasari', '1994-04-21', '081234567009', 'A', 157.00, 53, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'SMA', 2, NULL, 'Jl. Adi Sucipto No. 88 RT. 06', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(10, '6472015810970010', 'Wati Sulistiawati', '1997-06-14', '081234567010', 'B', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Swasta', 'SMK', 3, NULL, 'Jl. Nahkoda No. 02 RT. 11', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(11, '6472014611900011', 'Jumainah', '1990-01-30', '081234567011', 'AB', 163.50, 62, 'Belum Diperiksa', '+', 'Ada', 'Petani', 'SD', 1, NULL, 'Jl. Tani Makmur No. 66 RT. 08', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(12, '6472015312920012', 'Ratih Purwasih', '1992-10-11', '081234567012', 'O', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'PNS', 'S2', 2, NULL, 'Perumahan Pesona No. A1 RT. 02', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(13, '6472016101950013', 'Dewi Sartika', '1995-05-05', '081234567013', 'A', 159.00, 57, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'SMA', 3, NULL, 'Jl. Mawar Merah No. 14 RT. 10', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(14, '6472014902990014', 'Putri Handayani', '1999-08-17', '081234567014', 'O', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Mahasiswa', 'SMA', 2, NULL, 'Jl. Stadion Utama No. 99 RT. 01', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(15, '6472015703910015', 'Halimah', '1991-03-25', '081234567015', 'B', 156.50, 54, 'Belum Diperiksa', '+', 'Tidak', 'Dagang', 'SMP', 3, NULL, 'Pasar Palaran Blok C No. 4', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(16, '6472014404930016', 'Eka Susanti', '1993-11-09', '081234567016', 'A', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Karyawan', 'D3', 1, NULL, 'Jl. Ampera No. 21 RT. 04', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(17, '6472015205960017', 'Nurlaila', '1996-07-03', '081234567017', 'O', 161.00, 59, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'SMA', 2, NULL, 'Jl. Olah Bebaya No. 7 RT. 05', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(18, '6472016406880018', 'Marlina', '1988-12-20', '081234567018', 'AB', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Swasta', 'S1', 3, NULL, 'Jl. Kenanga No. 11 RT. 13', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(19, '6472015607940019', 'Siska Amelia', '1994-09-12', '081234567019', 'B', 154.00, 51, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'SMK', 2, NULL, 'Jl. Manunggal No. 34 RT. 02', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(20, '6472015908970020', 'Rahmawati', '1997-02-27', '081234567020', 'A', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Guru', 'S1', 3, NULL, 'Jl. Pelabuhan No. 09 RT. 08', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(21, '6472014709900021', 'Kartika Sari', '1990-06-15', '081234567021', 'O', 165.00, 65, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'SMA', 1, NULL, 'Jl. Cempaka No. 55 RT. 03', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(22, '6472016310920022', 'Salmah', '1992-04-08', '081234567022', 'B', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Buruh', 'SD', 2, NULL, 'Jl. Al-Hasani No. 10 RT. 01', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(23, '6472015411950023', 'Dian Sastro', '1995-01-22', '081234567023', 'A', 158.00, 56, 'Belum Diperiksa', '+', 'Ada', 'Swasta', 'S1', 3, NULL, 'Jl. Kebun Agung No. 100 RT. 15', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(24, '6472016612980024', 'Vina Panduwinata', '1998-10-30', '081234567024', 'O', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'SMA', 2, NULL, 'Jl. Palaran Indah No. 2 RT. 04', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(25, '6472014301910025', 'Zaskia Gotik', '1991-12-01', '081234567025', 'AB', 160.50, 61, 'Belum Diperiksa', '+', 'Ada', 'Seniman', 'SMA', 3, NULL, 'Jl. Gaya Baru No. 77 RT. 09', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(26, '6472015002930026', 'Lestari', '1993-08-14', '081234567026', 'B', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'SMP', 1, NULL, 'Gg. Bakti No. 3 RT. 01', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(27, '6472016203960027', 'Hj. Faridah', '1996-05-27', '081234567027', 'O', 157.50, 54, 'Belum Diperiksa', '+', 'Ada', 'Dagang', 'SMA', 2, NULL, 'Pasar Bantuas Kios No. 5', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(28, '6472015504890028', 'Rini Wulandari', '1989-03-09', '081234567028', 'A', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'PNS', 'S1', 3, NULL, 'Jl. Sekolah No. 20 RT. 06', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(29, '6472016005940029', 'Yuliana', '1994-11-18', '081234567029', 'O', 162.50, 63, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'SMK', 2, NULL, 'Jl. Barito No. 4 RT. 07', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(30, '6472014206970030', 'Nur Aini', '1997-09-02', '081234567030', 'B', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Swasta', 'D3', 3, NULL, 'Jl. Karet No. 12 RT. 10', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(31, '6472014807900031', 'Widya Astuti', '1990-07-07', '081234567031', 'A', 159.50, 58, 'Belum Diperiksa', '+', 'Ada', 'Bidan', 'D4', 1, NULL, 'Klinik Permata Bunda', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(32, '6472015108920032', 'Ida Royani', '1992-02-25', '081234567032', 'O', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'SD', 2, NULL, 'Jl. Masjid Raya No. 1 RT. 03', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(33, '6472016509950033', 'Sari Simorangkir', '1995-10-10', '081234567033', 'AB', 156.00, 52, 'Belum Diperiksa', '+', 'Ada', 'Swasta', 'S1', 3, NULL, 'Jl. Gereja No. 9 RT. 14', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(34, '6472015810980034', 'Mega Mustika', '1998-06-21', '081234567034', 'B', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Mahasiswa', 'SMA', 2, NULL, 'Jl. Pemuda No. 44 RT. 05', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(35, '6472014611910035', 'Lilis Suryani', '1991-01-13', '081234567035', 'A', 164.00, 64, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'SMP', 3, NULL, 'Jl. Dermaga No. 5 RT. 12', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(36, '6472015312930036', 'Desi Ratnasari', '1993-04-16', '081234567036', 'O', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Politisi', 'S2', 1, NULL, 'Perum Palaran City Blok F', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(37, '6472016101960037', 'Masnah', '1996-12-08', '081234567037', 'B', 158.50, 57, 'Belum Diperiksa', '+', 'Ada', 'Petani', 'SD', 2, NULL, 'Jl. Sawah Lebar No. 8 RT. 06', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(38, '6472014902890038', 'Kiki Amalia', '1989-08-30', '081234567038', 'A', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Swasta', 'SMA', 3, NULL, 'Jl. Dahlia No. 3 RT. 11', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(39, '6472015703940039', 'Poppy Mercury', '1994-03-03', '081234567039', 'O', 161.50, 60, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'SMK', 2, NULL, 'Jl. Stadion Timur No. 12 RT. 02', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(40, '6472014404970040', 'Nike Ardilla', '1997-11-25', '081234567040', 'AB', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Swasta', 'D3', 3, NULL, 'Jl. Samudera No. 88 RT. 07', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(41, '6472015205900041', 'Ernawati', '1990-09-19', '081234567041', 'B', 155.00, 50, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'SMA', 1, NULL, 'Jl. Tanjung No. 5 RT. 06', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(42, '6472016406920042', 'Rusmini', '1992-05-11', '081234567042', 'A', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Dagang', 'SD', 2, NULL, 'Gg. Damai No. 2 RT. 02', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(43, '6472015607950043', 'Tuti Wibowo', '1995-07-29', '081234567043', 'O', 163.00, 62, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'SMP', 3, NULL, 'Jl. Anggrek No. 15 RT. 08', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(44, '6472015908980044', 'Uut Permatasari', '1998-01-17', '081234567044', 'B', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Swasta', 'SMA', 2, NULL, 'Jl. Olahraga No. 20 RT. 05', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(45, '6472014709910045', 'Inul Daratista', '1991-10-05', '081234567045', 'A', 159.00, 56, 'Belum Diperiksa', '+', 'Ada', 'Seniman', 'SMA', 3, NULL, 'Jl. Niaga No. 90 RT. 11', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(46, '6472016310930046', 'Mariam Bellina', '1993-06-12', '081234567046', 'O', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'S1', 1, NULL, 'Jl. Cendana No. 7 RT. 07', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(47, '6472015411960047', 'Paramitha Rusady', '1996-02-14', '081234567047', 'AB', 157.00, 55, 'Belum Diperiksa', '+', 'Ada', 'PNS', 'S1', 2, NULL, 'Jl. Kantor Lurah No. 1 RT. 04', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(48, '6472016612890048', 'Lydia Kandou', '1989-12-22', '081234567048', 'B', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Wiraswasta', 'SMA', 3, NULL, 'Jl. Perjuangan No. 45 RT. 12', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(49, '6472014301940049', 'Nafa Urbach', '1994-08-08', '081234567049', 'A', 160.00, 59, 'Belum Diperiksa', '+', 'Ada', 'IRT', 'SMK', 2, NULL, 'Jl. Sejati No. 6 RT. 01', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(50, '6472015002970050', 'Mulan Jameela', '1997-04-01', '081234567050', 'O', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Swasta', 'S1', 3, NULL, 'Jl. Patimura No. 3 RT. 10', NULL, '2025-11-23 14:21:48', '2025-12-25 05:06:13'),
(51, '6472021109050007', 'Fiqri Abna', '2000-09-09', '080001111100', 'AB', NULL, NULL, 'Belum Diperiksa', '+', 'Ada', 'Guru', 'SMP', 2, NULL, 'Jalan Daeng Mangkona, Citra 3', NULL, '2025-11-23 16:31:35', '2025-12-25 05:06:13'),
(52, '6472022210050015', 'Asep Bumida', '2000-01-09', '0812312312312', 'B', 165.00, 50, 'Belum Diperiksa', '+', 'Tidak', 'Lainnya', 'SMK', 3, 8, 'Jalan Jalan di RT Sebelah', 25, '2025-11-24 16:56:24', '2025-12-25 15:49:53');

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

--
-- Dumping data for table `jiwa_screening`
--

INSERT INTO `jiwa_screening` (`id`, `skrining_jiwa`, `forkey_hamil`, `created_at`, `updated_at`) VALUES
(1, NULL, 1, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(2, NULL, 2, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(3, NULL, 3, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(4, NULL, 4, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(5, NULL, 5, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(6, NULL, 6, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(7, NULL, 7, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(8, NULL, 8, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(9, NULL, 9, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(10, NULL, 10, '2025-11-24 17:37:45', '2025-11-24 17:37:45'),
(11, NULL, 11, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(12, NULL, 12, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(13, NULL, 13, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(14, NULL, 14, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(15, NULL, 15, '2025-11-23 14:23:38', '2025-11-24 19:52:33'),
(16, NULL, 16, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(17, NULL, 17, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(18, NULL, 18, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(19, NULL, 19, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(20, NULL, 20, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(21, NULL, 21, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(22, NULL, 22, '2025-11-23 14:23:38', '2025-11-24 19:53:26'),
(23, NULL, 23, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(24, NULL, 24, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(25, NULL, 51, '2025-12-08 16:25:07', '2025-12-08 16:25:07'),
(26, NULL, 53, '2025-11-24 17:33:22', '2025-11-24 17:34:12');

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

--
-- Dumping data for table `kehamilan`
--

INSERT INTO `kehamilan` (`id`, `gravida`, `partus`, `abortus`, `haid_pertama`, `haid_terakhir`, `taksiran_persalinan`, `status_kehamilan`, `cara_persalinan`, `forkey_ibu`, `created_at`, `updated_at`) VALUES
(1, 1, 0, 0, NULL, '2025-02-10', '2025-11-17', 'Hamil', NULL, 1, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(2, 2, 1, 0, NULL, '2025-03-15', '2025-12-22', 'Hamil', NULL, 2, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(3, 1, 0, 0, NULL, '2025-04-20', '2026-01-27', 'Hamil', NULL, 3, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(4, 3, 2, 0, NULL, '2025-05-05', '2026-02-12', 'Hamil', NULL, 4, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(5, 1, 0, 0, NULL, '2025-06-01', '2026-03-08', 'Hamil', NULL, 5, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(6, 2, 0, 1, NULL, '2025-01-20', '2025-10-27', 'Hamil', NULL, 6, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(7, 1, 0, 0, NULL, '2025-07-10', '2026-04-17', 'Hamil', NULL, 7, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(8, 4, 3, 0, NULL, '2025-03-01', '2025-12-08', 'Hamil', NULL, 8, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(9, 1, 0, 0, NULL, '2025-08-15', '2026-05-22', 'Hamil', NULL, 9, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(10, 2, 1, 0, NULL, '2025-02-28', '2025-12-05', 'Hamil', NULL, 10, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(11, 1, 0, 0, NULL, '2025-04-10', '2026-01-17', 'Hamil', NULL, 11, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(12, 3, 1, 1, NULL, '2025-05-20', '2026-02-27', 'Hamil', NULL, 12, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(13, 1, 0, 0, NULL, '2025-06-15', '2026-03-22', 'Hamil', NULL, 13, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(14, 2, 1, 0, NULL, '2025-01-10', '2025-10-17', 'Hamil', NULL, 14, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(15, 1, 0, 0, NULL, '2025-09-01', '2026-06-08', 'Hamil', NULL, 15, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(16, 2, 0, 1, NULL, '2025-03-20', '2025-12-27', 'Hamil', NULL, 16, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(17, 1, 0, 0, NULL, '2025-04-05', '2026-01-12', 'Hamil', NULL, 17, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(18, 3, 2, 0, NULL, '2025-07-01', '2026-04-08', 'Hamil', NULL, 18, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(19, 1, 0, 0, NULL, '2025-08-20', '2026-05-27', 'Hamil', NULL, 19, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(20, 2, 1, 0, NULL, '2025-02-14', '2025-11-21', 'Selesai', NULL, 20, '2025-11-23 14:21:48', '2025-11-24 17:47:41'),
(21, 1, 0, 0, NULL, '2025-05-12', '2026-02-19', 'Hamil', NULL, 21, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(22, 4, 2, 1, NULL, '2025-01-05', '2025-10-12', 'Hamil', NULL, 22, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(23, 1, 0, 0, NULL, '2025-06-25', '2026-04-01', 'Hamil', NULL, 23, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(24, 2, 1, 0, NULL, '2025-09-10', '2026-06-17', 'Hamil', NULL, 24, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(25, 1, 0, 0, NULL, '2025-03-30', '2026-01-06', 'Hamil', NULL, 25, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(26, 1, 0, 0, NULL, '2024-12-01', '2025-09-08', 'Nifas', NULL, 26, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(27, 2, 1, 0, NULL, '2024-11-15', '2025-08-22', 'Nifas', NULL, 27, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(28, 3, 2, 0, NULL, '2025-01-10', '2025-10-17', 'Nifas', NULL, 28, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(29, 1, 0, 0, NULL, '2024-12-20', '2025-09-27', 'Nifas', NULL, 29, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(30, 2, 0, 1, NULL, '2025-01-05', '2025-10-12', 'Nifas', NULL, 30, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(31, 1, 0, 0, NULL, '2024-11-01', '2025-08-08', 'Nifas', NULL, 31, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(32, 4, 3, 0, NULL, '2024-12-10', '2025-09-17', 'Nifas', NULL, 32, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(33, 1, 0, 0, NULL, '2025-01-25', '2025-11-01', 'Nifas', NULL, 33, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(34, 2, 1, 0, NULL, '2024-11-25', '2025-09-01', 'Nifas', NULL, 34, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(35, 1, 0, 0, NULL, '2024-12-15', '2025-09-22', 'Nifas', NULL, 35, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(36, 3, 1, 1, NULL, '2025-01-15', '2025-10-22', 'Nifas', NULL, 36, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(37, 1, 0, 0, NULL, '2024-11-10', '2025-08-17', 'Nifas', NULL, 37, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(38, 2, 1, 0, NULL, '2024-12-05', '2025-09-12', 'Nifas', NULL, 38, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(39, 1, 0, 0, NULL, '2025-02-01', '2025-11-08', 'Nifas', NULL, 39, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(40, 2, 0, 1, NULL, '2024-11-20', '2025-08-27', 'Nifas', NULL, 40, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(41, 1, 0, 0, NULL, '2024-12-25', '2025-10-01', 'Nifas', NULL, 41, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(42, 3, 2, 0, NULL, '2025-01-01', '2025-10-08', 'Nifas', NULL, 42, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(43, 1, 0, 0, NULL, '2024-11-05', '2025-08-12', 'Nifas', NULL, 43, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(44, 2, 1, 0, NULL, '2024-12-30', '2025-10-06', 'Nifas', NULL, 44, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(45, 1, 0, 0, NULL, '2025-01-20', '2025-10-27', 'Nifas', NULL, 45, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(46, 2, 2, 0, NULL, '2024-01-10', '2024-10-17', 'Selesai', NULL, 46, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(47, 1, 1, 0, NULL, '2024-02-15', '2024-11-22', 'Selesai', NULL, 47, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(48, 3, 3, 0, NULL, '2024-03-20', '2024-12-27', 'Selesai', NULL, 48, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(49, 2, 2, 0, NULL, '2024-01-05', '2024-10-12', 'Selesai', NULL, 49, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(50, 1, 1, 0, NULL, '2024-02-01', '2024-11-08', 'Selesai', NULL, 50, '2025-11-23 14:21:48', '2025-11-23 14:21:48'),
(51, 1, 0, 0, NULL, '2025-10-27', '2026-08-03', 'Hamil', NULL, 52, '2025-11-24 17:14:14', '2025-12-25 15:49:53'),
(52, 1, 1, 0, NULL, '2024-07-16', '2025-04-22', 'Selesai', NULL, 50, '2025-11-24 17:25:40', '2025-11-24 17:30:27'),
(53, 2, 1, 0, NULL, '2025-04-20', '2026-01-25', 'Hamil', NULL, 50, '2025-11-24 17:31:01', '2025-11-24 17:31:01');

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

--
-- Dumping data for table `kelurahan`
--

INSERT INTO `kelurahan` (`id`, `nama_kelurahan`, `created_at`, `updated_at`) VALUES
(1, 'Rawa Makmur', '2025-12-24 18:37:24', '2025-12-24 18:37:24'),
(2, 'Simpang Pasir', '2025-12-24 18:37:24', '2025-12-24 18:37:24'),
(3, 'Handil Bakti', '2025-12-24 18:37:25', '2025-12-24 18:37:25');

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

--
-- Dumping data for table `komplikasi`
--

INSERT INTO `komplikasi` (`id`, `nama_komplikasi`, `kejadian`, `tanggal_diagnosis`, `rujuk_rs`, `nama_rs`, `tanggal_rujukan`, `tekanan_darah`, `protein_urine`, `gejala_penyerta`, `terapi_diberikan`, `tingkat_keparahan`, `status_penanganan`, `keterangan`, `forkey_hamil`, `forkey_anc`, `created_at`, `updated_at`) VALUES
(1, 'Hipertensi Gestasional', 'Saat Hamil', '2025-07-20', 1, NULL, NULL, '150/100', '+2', 'Sakit kepala', 'Methyldopa', 'Sedang', 'Dirujuk', 'Dirujuk ke RSUD', 2, 7, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(2, 'Preeklamsia Berat', 'Saat Hamil', '2025-08-15', 1, NULL, NULL, '170/110', '+3', 'Penglihatan kabur, edema', 'MgSO4 + Labetalol', 'Berat', 'Dirujuk', 'Eklamsia imminent', 4, 12, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(3, 'Plasenta Previa Totalis', 'Saat Hamil', '2025-09-10', 1, NULL, NULL, '120/80', NULL, 'Perdarahan banyak', 'Transfusi + observasi', 'Berat', 'Dirujuk', 'Perdarahan 800cc', 35, 52, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(4, 'Perdarahan Pasca Salin', 'Saat Bersalin', '2025-06-08', 0, NULL, NULL, '90/60', NULL, 'Atonia uteri', 'Misoprostol + masase', 'Berat', 'Ditangani', 'Perdarahan 1200cc', 5, NULL, '2025-11-23 14:24:13', '2026-01-01 02:35:36'),
(5, 'Emboli Cairan Amnion', 'Saat Bersalin', '2025-07-08', 1, NULL, NULL, '80/50', NULL, 'Sesak napas mendadak', 'Oksigen + ICU', 'Berat', 'Dirujuk', 'Syok anafilaktoid', 15, NULL, '2025-11-23 14:24:13', '2026-01-01 02:35:36'),
(6, 'Solutio Plasenta', 'Saat Hamil', '2025-05-15', 1, NULL, NULL, '110/70', NULL, 'Nyeri perut hebat', 'Observasi RS', 'Berat', 'Dirujuk', 'Janin IUGR', 48, 67, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(7, 'Diabetes Gestasional', 'Saat Hamil', '2025-07-01', 0, NULL, NULL, '130/85', NULL, 'Gula darah puasa 140', 'Diet + insulin', 'Sedang', 'Ditangani', 'Kontrol rutin', 8, 21, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(8, 'Anemia Berat', 'Saat Hamil', '2025-06-10', 0, NULL, NULL, '115/75', NULL, 'Pucat, lemas', 'Transfusi darah', 'Berat', 'Ditangani', 'Hb 7.2 g/dL', 18, 33, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(9, 'eklamsia', 'Saat Bersalin', '2025-11-25', 1, NULL, '2025-11-25', '180/120', '+4', 'Kejang', 'MgSO4', 'Berat', 'Dirujuk', 'Kejang 2x', 3, NULL, '2025-11-23 14:24:13', '2026-01-01 02:35:36'),
(10, 'Abrupsio Plasenta', 'Saat Hamil', '2025-06-27', 1, NULL, NULL, '100/60', NULL, 'Nyeri + perdarahan', 'SC darurat', 'Berat', 'Dirujuk', 'Janin meninggal', 20, NULL, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(11, 'Kehamilan Multipel', 'Saat Hamil', '2025-05-22', 0, NULL, NULL, '125/80', NULL, 'Kembar dua', 'Observasi ketat', 'Sedang', 'Ditangani', 'Kembar DCDA', 10, 25, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(12, 'Polihidramnion', 'Saat Hamil', '2025-07-17', 1, NULL, NULL, '135/90', NULL, 'Perut sangat besar', 'Indometasin', 'Sedang', 'Dirujuk', 'AFI 35 cm', 35, 55, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(13, 'IUGR', 'Saat Hamil', '2025-06-01', 0, NULL, NULL, '120/80', NULL, 'Pertumbuhan terhambat', 'Observasi', 'Ringan', 'Ditangani', 'BBJ 1800g usia 36 minggu', 40, 60, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(14, 'HIV Positif', 'Saat Hamil', '2025-08-05', 0, NULL, NULL, '118/76', NULL, 'Skrining reaktif', 'ARV sejak 14 minggu', 'Sedang', 'Ditangani', 'Viral load rendah', 8, 22, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(15, 'Infeksi Saluran Kemih', 'Saat Hamil', '2025-07-10', 0, NULL, NULL, '122/80', NULL, 'Demam, nyeri buang air', 'Antibiotik', 'Ringan', 'Ditangani', 'E.coli sensitif', 13, 29, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(16, 'Persalinan Prematur', 'Saat Bersalin', '2025-09-16', 1, NULL, NULL, '130/85', NULL, 'Kontraksi 32 minggu', 'Tocolytic', 'Berat', 'Dirujuk', 'PPROM', 48, NULL, '2025-11-23 14:24:13', '2026-01-01 02:35:36'),
(17, 'Distosia Bahu', 'Saat Bersalin', '2025-06-01', 0, NULL, NULL, '115/75', NULL, 'Makrosomia', 'Manuver McRoberts', 'Sedang', 'Ditangani', 'BBL 4200g', 50, NULL, '2025-11-23 14:24:13', '2026-01-01 02:35:36'),
(18, 'Infeksi Nifas', 'Saat Nifas', '2025-06-15', 1, NULL, NULL, '140/90', NULL, 'Demam tinggi', 'Antibiotik IV', 'Berat', 'Dirujuk', 'Endometritis', 5, NULL, '2025-11-23 14:24:13', '2026-01-01 02:36:09'),
(19, 'Oligohidramnion', 'Saat Hamil', '2025-07-22', 0, NULL, NULL, '128/82', NULL, 'Cairan ketuban sedikit', 'Observasi', 'Sedang', 'Ditangani', 'AFI 4 cm', 25, 43, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(20, 'Hiperemesis Gravidarum', 'Saat Hamil', '2025-04-01', 0, NULL, NULL, '110/70', NULL, 'Muntah berat', 'Infus + ondansetron', 'Sedang', 'Ditangani', 'BB turun 5kg', 1, 2, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(21, 'Edema Gestasional', 'Saat Hamil', '2025-08-10', 0, NULL, NULL, '135/88', '+1', 'Bengkak kaki', 'Istirahat', 'Ringan', 'Ditangani', 'Normal', 2, 6, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(22, 'TB Paru', 'Saat Hamil', '2025-06-20', 1, NULL, NULL, '130/85', NULL, 'Batuk >2 minggu', 'OAT kategori 1', 'Berat', 'Dirujuk', 'BTA positif', 18, 34, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(23, 'Sifilis', 'Saat Hamil', '2025-07-05', 0, NULL, NULL, '120/80', NULL, 'Reaktif', 'Penisilin 2.4 juta', 'Sedang', 'Ditangani', 'TPHA positif', 28, 47, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(24, 'Hepatitis B', 'Saat Hamil', '2025-05-18', 0, NULL, NULL, '118/76', NULL, 'HBsAg reaktif', 'Tenofovir', 'Sedang', 'Ditangani', 'Vaksin bayi saat lahir', 8, 23, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(25, 'Hematoma Plasenta', 'Saat Hamil', '2025-08-27', 1, NULL, NULL, '105/65', NULL, 'Nyeri perut', 'SC darurat', 'Berat', 'Dirujuk', 'Syok hipovolemik', 38, NULL, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(26, 'Persalinan Macet', 'Saat Bersalin', '2025-07-27', 1, NULL, NULL, '140/90', NULL, 'Tidak ada kemajuan', 'SC', 'Berat', 'Dirujuk', 'CPD', 38, NULL, '2025-11-23 14:24:13', '2026-01-01 02:35:36'),
(27, 'Ruptur Uteri', 'Saat Bersalin', '2025-06-22', 1, NULL, NULL, '80/50', NULL, 'Nyeri hebat mendadak', 'Laparotomi', 'Berat', 'Dirujuk', 'Riwayat SC klasik', 15, NULL, '2025-11-23 14:24:13', '2026-01-01 02:35:36'),
(28, 'Robekan Perineum Derajat 3', 'Saat Bersalin', '2025-09-07', 0, NULL, NULL, '115/75', NULL, 'Perineum robek', 'Jahit lapis', 'Sedang', 'Ditangani', 'Perbaikan sfingter', 28, NULL, '2025-11-23 14:24:13', '2026-01-01 02:35:36'),
(29, 'Sepsis Puerperalis', 'Saat Nifas', '2025-06-15', 1, NULL, NULL, '150/100', NULL, 'Demam tinggi', 'Antibiotik broad spectrum', 'Berat', 'Dirujuk', 'Syok septik', 5, NULL, '2025-11-23 14:24:13', '2026-01-01 02:36:09'),
(30, 'Mual Muntah Ringan', 'Saat Hamil', '2025-03-25', 0, NULL, NULL, '110/70', NULL, 'Mual pagi', 'Vitamin B6', 'Ringan', 'Ditangani', 'Normal', 1, 1, '2025-11-23 14:24:13', '2025-11-23 14:24:13'),
(31, 'Dehidrasi', 'Saat Hamil', '2025-11-25', 0, NULL, NULL, '112/72', 'Negatif', NULL, 'Banyak minum', 'Ringan', 'Ditangani', NULL, 51, 72, '2025-11-24 17:17:35', '2025-11-24 17:17:35'),
(32, 'Stunting', 'Saat Hamil', '2025-11-25', 0, NULL, NULL, '112/72', 'Negatif', NULL, 'Vitamin ', 'Ringan', 'Ditangani', NULL, 51, 72, '2025-11-24 17:18:36', '2025-11-24 17:18:36'),
(33, 'Demam', 'Saat Nifas', '2026-01-04', 1, 'RS Hermina', '2026-01-04', '122/80', '+1', 'kaburr', 'terapii', 'Sedang', 'Dirujuk', 'cepat sembuh', 3, 9, '2026-01-03 08:28:52', '2026-01-03 08:28:52');

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

--
-- Dumping data for table `kunjungan_nifas`
--

INSERT INTO `kunjungan_nifas` (`id`, `tanggal_kunjungan`, `hari_nifas`, `pemeriksa`, `tekanan_darah`, `suhu_badan`, `involusio_uteri`, `lochea`, `payudara`, `konseling_asi`, `berat_badan_bayi`, `suhu_bayi`, `pemberian_asi`, `keterangan`, `forkey_hamil`, `forkey_bidan`, `created_at`) VALUES
(1, '2025-09-09 09:00:00', 1, 'Bidan', '110/70', 36.50, 'Baik', 'Rubra', 'Normal', 1, 3.10, 36.60, 'ASI Eksklusif', 'Kondisi ibu baik', 26, 2, '2025-11-23 14:27:43'),
(2, '2025-09-15 10:00:00', 7, 'Bidan', '110/70', 36.60, 'Baik', 'Seroza', 'Bengkak', 1, 3.20, 36.70, 'ASI Eksklusif', 'Kompres payudara hangat', 26, 3, '2025-11-23 14:27:43'),
(3, '2025-10-08 09:30:00', 30, 'Bidan', '120/80', 36.50, 'Baik', 'Alba', 'Normal', 1, 3.90, 36.50, 'ASI Eksklusif', 'Ibu sehat', 26, 2, '2025-11-23 14:27:43'),
(4, '2025-08-23 08:00:00', 1, 'Bidan', '120/80', 36.70, 'Baik', 'Rubra', 'Normal', 1, 2.90, 36.80, 'ASI Eksklusif', 'Observasi perdarahan', 27, 4, '2025-11-23 14:27:43'),
(5, '2025-08-29 09:00:00', 7, 'Dokter', '110/70', 36.50, 'Baik', 'Seroza', 'Normal', 1, 3.00, 36.70, 'ASI Eksklusif', 'Luka jahitan kering', 27, 1, '2025-11-23 14:27:43'),
(6, '2025-09-22 10:00:00', 31, 'Bidan', '110/70', 36.60, 'Baik', 'Normal', 'Normal', 1, 3.80, 36.60, 'ASI Eksklusif', 'KB Konseling', 27, 4, '2025-11-23 14:27:43'),
(7, '2025-10-18 11:00:00', 1, 'Bidan', '130/80', 36.80, 'Baik', 'Rubra', 'Normal', 1, 3.50, 36.50, 'ASI Eksklusif', 'TD sedikit tinggi, pantau', 28, 2, '2025-11-23 14:27:43'),
(8, '2025-10-24 09:00:00', 7, 'Bidan', '120/80', 36.50, 'Baik', 'Seroza', 'Puting Lecet', 1, 3.60, 36.60, 'ASI Eksklusif', 'Ajarkan posisi menyusui', 28, 3, '2025-11-23 14:27:43'),
(9, '2025-11-15 08:00:00', 29, 'Bidan', '110/70', 36.50, 'Baik', 'Alba', 'Normal', 1, 4.20, 36.70, 'ASI Eksklusif', 'Bayi tumbuh sehat', 28, 2, '2025-11-23 14:27:43'),
(10, '2025-09-28 14:00:00', 1, 'Bidan', '110/70', 36.50, 'Baik', 'Rubra', 'Normal', 1, 3.00, 36.60, 'ASI Eksklusif', NULL, 29, 5, '2025-11-23 14:27:43'),
(11, '2025-10-04 10:00:00', 7, 'Bidan', '110/70', 36.60, 'Baik', 'Seroza', 'Normal', 1, 3.15, 36.50, 'ASI Eksklusif', NULL, 29, 5, '2025-11-23 14:27:43'),
(12, '2025-10-27 09:00:00', 30, 'Dokter', '120/80', 36.70, 'Baik', 'Alba', 'Normal', 1, 3.80, 36.60, 'ASI Eksklusif', 'Rencana KB suntik', 29, 1, '2025-11-23 14:27:43'),
(13, '2025-10-13 07:00:00', 1, 'Bidan', '100/60', 36.40, 'Baik', 'Rubra', 'Normal', 1, 2.80, 36.90, 'Formula', 'ASI belum keluar lancar', 30, 3, '2025-11-23 14:27:43'),
(14, '2025-10-19 09:00:00', 7, 'Bidan', '110/70', 36.50, 'Baik', 'Seroza', 'Normal', 1, 2.90, 36.80, 'ASI + Formula', 'ASI mulai lancar', 30, 3, '2025-11-23 14:27:43'),
(15, '2025-11-12 10:30:00', 31, 'Bidan', '110/80', 36.60, 'Baik', 'Alba', 'Normal', 1, 3.50, 36.70, 'ASI Eksklusif', 'Full ASI sekarang', 30, 2, '2025-11-23 14:27:43'),
(16, '2025-08-09 13:00:00', 1, 'Bidan', '120/80', 36.60, 'Baik', 'Rubra', 'Normal', 1, 3.20, 36.50, 'ASI Eksklusif', NULL, 31, 4, '2025-11-23 14:27:43'),
(17, '2025-08-15 09:00:00', 7, 'Bidan', '110/70', 36.50, 'Baik', 'Seroza', 'Normal', 1, 3.30, 36.60, 'ASI Eksklusif', NULL, 31, 4, '2025-11-23 14:27:43'),
(18, '2025-09-08 10:00:00', 31, 'Bidan', '120/70', 36.50, 'Baik', 'Alba', 'Normal', 1, 4.00, 36.50, 'ASI Eksklusif', NULL, 31, 2, '2025-11-23 14:27:43'),
(19, '2025-09-18 10:00:00', 1, 'Bidan', '130/90', 37.00, 'Lambat', 'Rubra', 'Normal', 1, 3.40, 36.70, 'ASI Eksklusif', 'Kontraksi uterus kurang keras', 32, 1, '2025-11-23 14:27:43'),
(20, '2025-09-24 11:00:00', 7, 'Dokter', '120/80', 36.60, 'Baik', 'Seroza', 'Normal', 1, 3.50, 36.60, 'ASI Eksklusif', 'Involusio membaik', 32, 1, '2025-11-23 14:27:43'),
(21, '2025-10-17 09:00:00', 30, 'Bidan', '120/80', 36.50, 'Baik', 'Alba', 'Normal', 1, 4.10, 36.50, 'ASI Eksklusif', 'Ibu sehat', 32, 2, '2025-11-23 14:27:43'),
(22, '2025-11-02 08:00:00', 1, 'Bidan', '110/70', 36.50, 'Baik', 'Rubra', 'Normal', 1, 3.10, 36.60, 'ASI Eksklusif', NULL, 33, 5, '2025-11-23 14:27:43'),
(23, '2025-11-08 09:00:00', 7, 'Bidan', '110/70', 36.60, 'Baik', 'Seroza', 'Bengkak', 1, 3.25, 36.50, 'ASI Eksklusif', 'Bendungan ASI', 33, 5, '2025-11-23 14:27:43'),
(24, '2025-11-23 10:00:00', 22, 'Bidan', '110/70', 36.50, 'Baik', 'Alba', 'Normal', 1, 3.80, 36.60, 'ASI Eksklusif', 'Sembuh', 33, 3, '2025-11-23 14:27:43'),
(25, '2025-09-02 09:00:00', 1, 'Bidan', '120/80', 36.50, 'Baik', 'Rubra', 'Normal', 1, 3.00, 36.70, 'ASI Eksklusif', NULL, 34, 2, '2025-11-23 14:27:43'),
(26, '2025-09-08 10:00:00', 7, 'Bidan', '110/70', 36.60, 'Baik', 'Seroza', 'Normal', 1, 3.10, 36.60, 'ASI Eksklusif', NULL, 34, 2, '2025-11-23 14:27:43'),
(27, '2025-10-01 11:00:00', 30, 'Bidan', '110/70', 36.50, 'Baik', 'Alba', 'Normal', 1, 3.75, 36.50, 'ASI Eksklusif', NULL, 34, 4, '2025-11-23 14:27:43'),
(28, '2025-09-23 08:30:00', 1, 'Bidan', '110/70', 36.60, 'Baik', 'Rubra', 'Normal', 1, 3.30, 36.60, 'ASI Eksklusif', NULL, 35, 3, '2025-11-23 14:27:43'),
(29, '2025-09-29 09:30:00', 7, 'Bidan', '110/70', 36.50, 'Baik', 'Seroza', 'Normal', 1, 3.40, 36.50, 'ASI Eksklusif', NULL, 35, 3, '2025-11-23 14:27:43'),
(30, '2025-10-22 10:00:00', 30, 'Bidan', '120/80', 36.50, 'Baik', 'Alba', 'Normal', 1, 4.10, 36.60, 'ASI Eksklusif', NULL, 35, 1, '2025-11-23 14:27:43'),
(31, '2025-10-23 11:00:00', 1, 'Bidan', '120/80', 36.80, 'Baik', 'Rubra', 'Mastitis', 1, 3.00, 36.80, 'Formula', 'Ibu demam, mastitis', 36, 1, '2025-11-23 14:27:43'),
(32, '2025-10-29 10:00:00', 7, 'Dokter', '120/80', 36.60, 'Baik', 'Seroza', 'Bengkak', 1, 3.10, 36.70, 'ASI + Formula', 'Sudah diobati', 36, 1, '2025-11-23 14:27:43'),
(33, '2025-11-20 09:00:00', 29, 'Bidan', '110/70', 36.50, 'Baik', 'Alba', 'Normal', 1, 3.70, 36.60, 'ASI Eksklusif', 'Sudah sembuh total', 36, 2, '2025-11-23 14:27:43'),
(34, '2025-08-18 09:00:00', 1, 'Bidan', '110/70', 36.50, 'Baik', 'Rubra', 'Normal', 1, 3.10, 36.60, 'ASI Eksklusif', NULL, 37, 5, '2025-11-23 14:27:43'),
(35, '2025-08-24 10:00:00', 7, 'Bidan', '110/70', 36.50, 'Baik', 'Seroza', 'Normal', 1, 3.20, 36.50, 'ASI Eksklusif', NULL, 37, 5, '2025-11-23 14:27:43'),
(36, '2025-09-17 11:00:00', 31, 'Bidan', '110/70', 36.50, 'Baik', 'Alba', 'Normal', 1, 3.90, 36.60, 'ASI Eksklusif', NULL, 37, 4, '2025-11-23 14:27:43'),
(37, '2025-09-13 15:00:00', 1, 'Bidan', '120/80', 36.60, 'Baik', 'Rubra', 'Normal', 1, 2.95, 36.70, 'ASI Eksklusif', NULL, 38, 2, '2025-11-23 14:27:43'),
(38, '2025-09-19 16:00:00', 7, 'Bidan', '110/80', 36.50, 'Baik', 'Seroza', 'Normal', 1, 3.10, 36.60, 'ASI Eksklusif', NULL, 38, 2, '2025-11-23 14:27:43'),
(39, '2025-10-12 09:00:00', 30, 'Bidan', '120/80', 36.60, 'Baik', 'Alba', 'Normal', 1, 3.80, 36.50, 'ASI Eksklusif', NULL, 38, 3, '2025-11-23 14:27:43'),
(40, '2025-11-09 07:30:00', 1, 'Bidan', '110/70', 36.50, 'Baik', 'Rubra', 'Normal', 1, 3.20, 36.60, 'ASI Eksklusif', NULL, 39, 4, '2025-11-23 14:27:43'),
(41, '2025-11-15 08:30:00', 7, 'Bidan', '110/70', 36.60, 'Baik', 'Seroza', 'Normal', 1, 3.30, 36.50, 'ASI Eksklusif', NULL, 39, 4, '2025-11-23 14:27:43'),
(42, '2025-11-23 09:00:00', 15, 'Bidan', '110/70', 36.50, 'Baik', 'Alba', 'Normal', 1, 3.50, 36.60, 'ASI Eksklusif', 'Kunjungan dipercepat', 39, 4, '2025-11-23 14:27:43'),
(43, '2025-08-28 10:00:00', 1, 'Bidan', '130/85', 36.70, 'Baik', 'Rubra', 'Normal', 1, 3.40, 36.70, 'ASI Eksklusif', 'Riwayat PEB', 40, 1, '2025-11-23 14:27:43'),
(44, '2025-09-03 11:00:00', 7, 'Dokter', '125/80', 36.60, 'Baik', 'Seroza', 'Normal', 1, 3.50, 36.60, 'ASI Eksklusif', 'TD Terkontrol', 40, 1, '2025-11-23 14:27:43'),
(45, '2025-09-27 10:00:00', 31, 'Bidan', '120/80', 36.50, 'Baik', 'Alba', 'Normal', 1, 4.20, 36.50, 'ASI Eksklusif', 'Sehat', 40, 2, '2025-11-23 14:27:43'),
(46, '2025-10-02 12:00:00', 1, 'Bidan', '110/70', 36.50, 'Baik', 'Rubra', 'Normal', 1, 3.05, 36.60, 'ASI Eksklusif', NULL, 41, 5, '2025-11-23 14:27:43'),
(47, '2025-10-08 10:00:00', 7, 'Bidan', '110/70', 36.50, 'Baik', 'Seroza', 'Normal', 1, 3.15, 36.50, 'ASI Eksklusif', NULL, 41, 5, '2025-11-23 14:27:43'),
(48, '2025-11-01 09:00:00', 31, 'Bidan', '110/70', 36.60, 'Baik', 'Alba', 'Normal', 1, 3.80, 36.60, 'ASI Eksklusif', NULL, 41, 3, '2025-11-23 14:27:43'),
(49, '2025-10-09 08:00:00', 1, 'Bidan', '120/80', 36.50, 'Baik', 'Rubra', 'Normal', 1, 3.10, 36.70, 'ASI Eksklusif', NULL, 42, 2, '2025-11-23 14:27:43'),
(50, '2025-10-15 09:00:00', 7, 'Bidan', '120/80', 36.60, 'Baik', 'Seroza', 'Normal', 1, 3.20, 36.60, 'ASI Eksklusif', NULL, 42, 2, '2025-11-23 14:27:43'),
(51, '2025-11-08 10:00:00', 31, 'Bidan', '110/80', 36.50, 'Baik', 'Alba', 'Normal', 1, 3.90, 36.50, 'ASI Eksklusif', NULL, 42, 4, '2025-11-23 14:27:43'),
(52, '2025-08-13 14:00:00', 1, 'Bidan', '110/70', 36.50, 'Baik', 'Rubra', 'Normal', 1, 2.90, 36.60, 'ASI Eksklusif', NULL, 43, 3, '2025-11-23 14:27:43'),
(53, '2025-08-19 10:00:00', 7, 'Bidan', '110/70', 36.50, 'Baik', 'Seroza', 'Normal', 1, 3.00, 36.50, 'ASI Eksklusif', NULL, 43, 3, '2025-11-23 14:27:43'),
(54, '2025-09-12 11:00:00', 31, 'Bidan', '110/70', 36.60, 'Baik', 'Alba', 'Normal', 1, 3.70, 36.60, 'ASI Eksklusif', NULL, 43, 5, '2025-11-23 14:27:43'),
(55, '2025-10-07 09:00:00', 1, 'Bidan', '120/80', 36.60, 'Baik', 'Rubra', 'Puting Lecet', 1, 3.30, 36.70, 'ASI Eksklusif', 'Ibu kesakitan saat menyusui', 44, 4, '2025-11-23 14:27:43'),
(56, '2025-10-13 10:00:00', 7, 'Bidan', '110/70', 36.50, 'Baik', 'Seroza', 'Normal', 1, 3.40, 36.60, 'ASI Eksklusif', 'Lecet sembuh', 44, 4, '2025-11-23 14:27:43'),
(57, '2025-11-06 11:00:00', 31, 'Bidan', '110/70', 36.50, 'Baik', 'Alba', 'Normal', 1, 4.05, 36.50, 'ASI Eksklusif', NULL, 44, 1, '2025-11-23 14:27:43'),
(58, '2025-10-28 08:00:00', 1, 'Bidan', '110/70', 36.50, 'Baik', 'Rubra', 'Normal', 1, 3.10, 36.60, 'ASI Eksklusif', NULL, 45, 5, '2025-11-23 14:27:43'),
(59, '2025-11-03 09:00:00', 7, 'Bidan', '110/70', 36.60, 'Baik', 'Seroza', 'Normal', 1, 3.20, 36.50, 'ASI Eksklusif', NULL, 45, 2, '2025-11-23 14:27:43'),
(60, '2025-11-23 10:00:00', 27, 'Bidan', '110/70', 36.50, 'Baik', 'Alba', 'Normal', 1, 3.80, 36.60, 'ASI Eksklusif', NULL, 45, 3, '2025-11-23 14:27:43');

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

--
-- Dumping data for table `lab_screening`
--

INSERT INTO `lab_screening` (`id`, `hasil_lab_hb`, `lab_protein_urine`, `lab_gula_darah`, `hasil_lab_lainnya`, `skrining_gonorea`, `skrining_klamidia`, `skrining_hiv`, `status_art`, `skrining_sifilis`, `skrining_hbsag`, `skrining_tb`, `malaria_diberi_kelambu`, `terapi_malaria`, `status_malaria`, `terapi_kecacingan`, `status_kecacingan`, `forkey_hamil`, `created_at`, `updated_at`) VALUES
(1, 10.90, '+1', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 1, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(2, 10.30, '+2', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 2, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(3, 11.40, 'Negatif', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 3, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(4, 10.10, '+2', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 4, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(5, 10.20, '+1', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 5, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(6, 11.00, 'Negatif', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 6, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(7, 10.40, '+1', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 7, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(8, 9.80, '+3', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 8, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(9, 10.90, 'Negatif', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 9, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(10, 12.00, 'Negatif', '95', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Non-Reaktif', 'Non-Reaktif', 'Negatif', 'Tidak', 0, NULL, 0, NULL, 10, '2025-11-24 17:37:45', '2025-11-24 17:37:45'),
(11, 10.50, '+2', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 11, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(12, 10.80, '+1', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 12, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(13, 11.00, 'Negatif', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 13, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(14, 10.30, '+2', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 14, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(15, 9.90, '+3', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Non-Reaktif', 'Non-Reaktif', 'Negatif', 'Tidak', 0, NULL, 0, NULL, 15, '2025-11-23 14:23:38', '2025-11-24 19:52:33'),
(16, 10.80, 'Negatif', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 16, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(17, 10.20, '+2', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 17, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(18, 10.50, '+1', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 18, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(19, 11.10, 'Negatif', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 19, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(20, 10.00, '+2', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 20, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(21, 11.40, 'Negatif', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 21, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(22, 10.30, '+1', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Non-Reaktif', 'Reaktif', 'Negatif', 'Tidak', 0, NULL, 0, NULL, 22, '2025-11-23 14:23:38', '2025-11-24 19:53:26'),
(23, 9.70, '+3', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 23, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(24, 10.60, '+1', NULL, NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Belum Diperiksa', 'Tidak', 0, NULL, 0, NULL, 24, '2025-11-23 14:23:38', '2025-11-23 14:23:38'),
(25, 13.00, 'Negatif', '90', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Non-Reaktif', 'Non-Reaktif', 'Negatif', 'Tidak', 0, NULL, 0, NULL, 51, '2025-12-08 16:25:07', '2025-12-08 16:25:07'),
(26, 12.00, 'Negatif', '100', NULL, 'Belum Diperiksa', 'Belum Diperiksa', 'Non-Reaktif', NULL, 'Non-Reaktif', 'Non-Reaktif', 'Negatif', 'Tidak', 0, NULL, 0, NULL, 53, '2025-11-24 17:33:22', '2025-11-24 17:34:12');

-- --------------------------------------------------------

--
-- Table structure for table `persalinan`
--

CREATE TABLE `persalinan` (
  `id` int NOT NULL,
  `tanggal_persalinan` datetime NOT NULL,
  `tempat_persalinan` enum('RS','Puskesmas','Rumah','Klinik') NOT NULL,
  `penolong` enum('Bidan','Dokter','Keluarga','Lainnya') NOT NULL,
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
  `beri_ttd` tinyint(1) DEFAULT '0',
  `salep_mata` tinyint(1) DEFAULT '0',
  `keterangan` text,
  `forkey_hamil` int NOT NULL,
  `forkey_bidan` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `persalinan`
--

INSERT INTO `persalinan` (`id`, `tanggal_persalinan`, `tempat_persalinan`, `penolong`, `cara_persalinan`, `komplikasi_ibu`, `perdarahan`, `robekan_jalan_lahir`, `jumlah_bayi`, `jenis_kelamin_bayi`, `berat_badan_bayi`, `panjang_badan_bayi`, `kondisi_bayi`, `asfiksia`, `keterangan_bayi`, `inisiasi_menyusui_dini`, `vitamin_k1`, `salep_mata`, `keterangan`, `forkey_hamil`, `forkey_bidan`, `created_at`) VALUES
(1, '2025-09-08 22:00:00', 'Puskesmas', 'Bidan', 'Spontan', NULL, 'Tidak', 'Perineum', 1, 'Laki-laki', 3.20, 49.00, 'Sehat', 'Tidak', 'Bayi menangis kuat', 1, 1, 1, 'Persalinan lancar', 26, 2, '2025-11-23 14:29:05'),
(2, '2025-08-22 15:30:00', 'Klinik', 'Bidan', 'Spontan', NULL, 'Ringan', 'Tidak', 1, 'Perempuan', 3.00, 48.00, 'Sehat', 'Tidak', 'Bayi bugar', 1, 1, 1, 'Lancar', 27, 4, '2025-11-23 14:29:05'),
(3, '2025-10-17 20:00:00', 'Rumah', 'Bidan', 'Spontan', NULL, 'Tidak', 'Vagina', 1, 'Laki-laki', 3.60, 50.00, 'Sehat', 'Tidak', 'Bayi besar, sehat', 1, 1, 1, 'Lahir di PMB', 28, 2, '2025-11-23 14:29:05'),
(4, '2025-09-27 10:00:00', 'RS', 'Dokter', 'Sectio', 'KPD', 'Sedang', 'Tidak', 1, 'Perempuan', 3.10, 49.00, 'Sehat', 'Ringan', 'Ketuban pecah dini', 0, 1, 1, 'Rujuk RS karena KPD', 29, 5, '2025-11-23 14:29:05'),
(5, '2025-10-12 18:45:00', 'Puskesmas', 'Bidan', 'Spontan', NULL, 'Tidak', 'Perineum', 1, 'Perempuan', 2.90, 47.00, 'Sehat', 'Tidak', 'Normal', 1, 1, 1, 'Anak kedua', 30, 3, '2025-11-23 14:29:05'),
(6, '2025-08-08 23:15:00', 'Klinik', 'Bidan', 'Spontan', NULL, 'Tidak', 'Tidak', 1, 'Laki-laki', 3.30, 50.00, 'Sehat', 'Tidak', 'Normal', 1, 1, 1, 'Tanpa jahitan', 31, 4, '2025-11-23 14:29:05'),
(7, '2025-09-17 14:00:00', 'RS', 'Dokter', 'Vakum', 'Partus Lama', 'Sedang', 'Perineum', 1, 'Laki-laki', 3.50, 51.00, 'Sehat', 'Ringan', 'Sempat asfiksia ringan', 0, 1, 1, 'Kala II memanjang', 32, 1, '2025-11-23 14:29:05'),
(8, '2025-11-01 21:00:00', 'Puskesmas', 'Bidan', 'Spontan', NULL, 'Tidak', 'Serviks', 1, 'Perempuan', 3.15, 48.50, 'Sehat', 'Tidak', 'Normal', 1, 1, 1, 'Luka jahit serviks', 33, 5, '2025-11-23 14:29:05'),
(9, '2025-09-01 16:30:00', 'Rumah', 'Bidan', 'Spontan', NULL, 'Tidak', 'Vagina', 1, 'Perempuan', 3.05, 48.00, 'Sehat', 'Tidak', 'Normal', 1, 1, 1, 'Lahir di PMB', 34, 2, '2025-11-23 14:29:05'),
(10, '2025-09-22 19:20:00', 'Puskesmas', 'Bidan', 'Spontan', NULL, 'Tidak', 'Tidak', 1, 'Laki-laki', 3.40, 50.00, 'Sehat', 'Tidak', 'Normal', 1, 1, 1, 'Utuh', 35, 3, '2025-11-23 14:29:05'),
(11, '2025-10-22 08:00:00', 'RS', 'Dokter', 'Sectio', 'Sungsang', 'Tidak', 'Tidak', 1, 'Perempuan', 3.00, 49.00, 'Sehat', 'Tidak', 'Posisi Sungsang', 0, 1, 1, 'SC Elektif', 36, 1, '2025-11-23 14:29:05'),
(12, '2025-08-17 22:50:00', 'Puskesmas', 'Bidan', 'Spontan', NULL, 'Tidak', 'Perineum', 1, 'Laki-laki', 3.20, 49.50, 'Sehat', 'Tidak', 'Normal', 1, 1, 1, 'Jahitan jelujur', 37, 5, '2025-11-23 14:29:05'),
(13, '2025-09-12 12:00:00', 'Klinik', 'Bidan', 'Spontan', NULL, 'Tidak', 'Tidak', 1, 'Perempuan', 3.00, 48.00, 'Sehat', 'Tidak', 'Normal', 1, 1, 1, 'Anak pertama', 38, 2, '2025-11-23 14:29:05'),
(14, '2025-11-08 17:40:00', 'Puskesmas', 'Bidan', 'Spontan', NULL, 'Tidak', 'Perineum', 1, 'Laki-laki', 3.35, 50.00, 'Sehat', 'Tidak', 'Normal', 1, 1, 1, 'Lancar', 39, 4, '2025-11-23 14:29:05'),
(15, '2025-08-27 05:00:00', 'RS', 'Dokter', 'Sectio', 'Pre-eklampsia Berat', 'Sedang', 'Tidak', 1, 'Perempuan', 3.50, 49.00, 'Sehat', 'Ringan', 'Observasi ketat', 0, 1, 1, 'Cito SC karena PEB', 40, 1, '2025-11-23 14:29:05'),
(16, '2025-10-01 14:15:00', 'Puskesmas', 'Bidan', 'Spontan', NULL, 'Tidak', 'Vagina', 1, 'Laki-laki', 3.10, 49.00, 'Sehat', 'Tidak', 'Normal', 1, 1, 1, 'Lahir normal', 41, 5, '2025-11-23 14:29:05'),
(17, '2025-10-08 06:30:00', 'Rumah', 'Bidan', 'Spontan', NULL, 'Tidak', 'Perineum', 1, 'Perempuan', 3.20, 48.50, 'Sehat', 'Tidak', 'Normal', 1, 1, 1, 'Partus presipitatus', 42, 2, '2025-11-23 14:29:05'),
(18, '2025-08-12 11:20:00', 'Klinik', 'Bidan', 'Spontan', NULL, 'Tidak', 'Tidak', 1, 'Laki-laki', 3.00, 49.00, 'Sehat', 'Tidak', 'Normal', 1, 1, 1, 'Utuh', 43, 3, '2025-11-23 14:29:05'),
(19, '2025-10-06 19:50:00', 'Puskesmas', 'Bidan', 'Spontan', NULL, 'Tidak', 'Serviks', 1, 'Laki-laki', 3.40, 51.00, 'Sehat', 'Tidak', 'Normal', 1, 1, 1, 'Bayi cukup besar', 44, 4, '2025-11-23 14:29:05'),
(20, '2025-10-27 23:45:00', 'Puskesmas', 'Bidan', 'Spontan', NULL, 'Tidak', 'Perineum', 1, 'Perempuan', 3.15, 48.00, 'Sehat', 'Tidak', 'Normal', 1, 1, 1, 'Lancar', 45, 5, '2025-11-23 14:29:05');

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

--
-- Dumping data for table `riwayat_penyakit`
--

INSERT INTO `riwayat_penyakit` (`id`, `nama_penyakit`, `kategori_penyakit`, `tahun_diagnosis`, `status_penyakit`, `keterangan`, `forkey_ibu`, `created_at`, `updated_at`) VALUES
(1, 'Hipertensi', 'Penyakit Tidak Menular', '2020', 'Dalam Pengobatan', 'Tekanan darah terkontrol dengan obat', 2, '2025-12-08 17:30:16', '2025-12-08 17:30:16'),
(2, 'Diabetes Mellitus Tipe 2', 'Penyakit Kronis', '2019', 'Dalam Pengobatan', 'Gula darah terkontrol dengan diet dan obat', 4, '2025-12-08 17:30:16', '2025-12-08 17:30:16'),
(3, 'Asma', 'Penyakit Kronis', '2015', 'Dalam Pengobatan', 'Menggunakan inhaler saat kambuh', 8, '2025-12-08 17:30:16', '2025-12-08 17:30:16'),
(4, 'Alergi Seafood', 'Alergi', '2010', 'Kronis', 'Hindari makanan laut', 12, '2025-12-08 17:30:16', '2025-12-08 17:30:16'),
(5, 'Operasi Appendix', 'Operasi', '2018', 'Sembuh', 'Operasi appendektomi', 15, '2025-12-08 17:30:16', '2025-12-08 17:30:16'),
(6, 'Anemia', 'Penyakit Tidak Menular', '2021', 'Sembuh', 'Sudah normal setelah konsumsi Fe', 18, '2025-12-08 17:30:16', '2025-12-08 17:30:16'),
(7, 'Hepatitis B', 'Penyakit Menular', '2017', 'Kronis', 'Carrier HBsAg positif', 22, '2025-12-08 17:30:16', '2025-12-08 17:30:16'),
(8, 'Tuberkulosis', 'Penyakit Menular', '2020', 'Sembuh', 'Sudah selesai pengobatan OAT 6 bulan', 25, '2025-12-08 17:30:16', '2025-12-08 17:30:16'),
(9, 'Hipertensi', 'Penyakit Tidak Menular', '2019', 'Dalam Pengobatan', 'Konsumsi obat rutin', 28, '2025-12-08 17:30:16', '2025-12-08 17:30:16'),
(10, 'Alergi Obat Penisilin', 'Alergi', '2015', 'Kronis', 'Hindari antibiotik golongan penisilin', 30, '2025-12-08 17:30:16', '2025-12-08 17:30:16'),
(11, 'Operasi Caesar', 'Operasi', '2022', 'Sembuh', 'SC pada kehamilan pertama', 32, '2025-12-08 17:30:16', '2025-12-08 17:30:16'),
(12, 'Diabetes Gestasional', 'Penyakit Tidak Menular', '2023', 'Sembuh', 'Pada kehamilan sebelumnya', 35, '2025-12-08 17:30:16', '2025-12-08 17:30:16'),
(13, 'Asma', 'Penyakit Kronis', '2016', 'Dalam Pengobatan', 'Terkontrol dengan obat', 38, '2025-12-08 17:30:16', '2025-12-08 17:30:16'),
(14, 'Hipertensi', 'Penyakit Tidak Menular', '2021', 'Dalam Pengobatan', 'Pre-eklampsia pada kehamilan lalu', 40, '2025-12-08 17:30:16', '2025-12-08 17:30:16'),
(15, 'Anemia', 'Penyakit Tidak Menular', '2022', 'Sembuh', 'Hb sudah normal', 42, '2025-12-08 17:30:16', '2025-12-08 17:30:16'),
(17, 'Hipertensi', 'Lainnya', '2020', 'Sembuh', NULL, 52, '2025-12-25 15:49:53', '2025-12-25 15:49:53');

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

--
-- Dumping data for table `suami`
--

INSERT INTO `suami` (`id`, `nik_suami`, `nama_lengkap`, `tanggal_lahir`, `no_hp`, `gol_darah`, `pekerjaan`, `pendidikan`, `isPerokok`, `forkey_ibu`, `created_at`, `updated_at`) VALUES
(1, '6472011001850001', 'Budi Santoso', '1985-01-10', '081345678001', 'B', 'Wiraswasta', 'SMA', 0, 1, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(2, '6472012002880002', 'Ahmad Faisal', '1988-02-20', '081345678002', 'O', 'Karyawan Tambang', 'S1', 1, 2, '2025-11-23 14:31:06', '2025-12-12 19:46:05'),
(3, '6472013003900003', 'H. M. Yusuf', '1990-03-30', '081345678003', 'A', 'PNS', 'S2', 1, 3, '2025-11-23 14:31:06', '2025-12-12 19:46:05'),
(4, '6472014004920004', 'Eko Prasetyo', '1992-04-15', '081345678004', 'AB', 'Buruh', 'SMP', 1, 4, '2025-11-23 14:31:06', '2025-12-12 19:46:05'),
(5, '6472015005890005', 'Dedi Kurniawan', '1989-05-25', '081345678005', 'O', 'Swasta', 'D3', 0, 6, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(6, '6472016006870006', 'Syamsul Arifin', '1987-06-12', '081345678006', 'B', 'Petani', 'SD', 0, 7, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(7, '6472017007860007', 'M. Ridwan', '1986-07-22', '081345678007', 'A', 'Karyawan Swasta', 'S1', 1, 8, '2025-11-23 14:31:06', '2025-12-12 19:46:05'),
(8, '6472018008910008', 'Agus Setiawan', '1991-08-05', '081345678008', 'O', 'Buruh Pelabuhan', 'SMA', 1, 9, '2025-11-23 14:31:06', '2025-12-12 19:46:05'),
(9, '6472019009930009', 'Hendra Gunawan', '1993-09-18', '081345678009', 'AB', 'Ojek Online', 'SMA', 0, 10, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(10, '6472010110880010', 'Supriyadi', '1988-10-28', '081345678010', 'B', 'Petani', 'SD', 0, 11, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(11, '6472011111850011', 'Bambang Pamungkas', '1985-11-11', '081345678011', 'O', 'PNS', 'S1', 0, 12, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(12, '6472012112900012', 'Arif Hidayat', '1990-12-05', '081345678012', 'A', 'Wiraswasta', 'SMK', 1, 13, '2025-11-23 14:31:06', '2025-12-12 19:46:05'),
(13, '6472013101950013', 'Riki Subagja', '1995-01-15', '081345678013', 'B', 'Mahasiswa', 'SMA', 0, 14, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(14, '6472014102910014', 'Joko Susilo', '1991-02-25', '081345678014', 'O', 'Karyawan Tambang', 'SMA', 0, 16, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(15, '6472015103880015', 'Iwan Fals', '1988-03-05', '081345678015', 'A', 'Seniman', 'S1', 0, 17, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(16, '6472016104860016', 'Dani Pedrosa', '1986-04-12', '081345678016', 'B', 'Mekanik', 'STM', 1, 18, '2025-11-23 14:31:06', '2025-12-12 19:46:05'),
(17, '6472017105920017', 'Fajar Alfian', '1992-05-20', '081345678017', 'AB', 'Atlet', 'S1', 0, 19, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(18, '6472018106890018', 'Kevin Sanjaya', '1989-06-30', '081345678018', 'O', 'Guru', 'S1', 1, 20, '2025-11-23 14:31:06', '2025-12-12 19:46:05'),
(19, '6472019107870019', 'Taufik Hidayat', '1987-07-07', '081345678019', 'A', 'Wiraswasta', 'SMA', 0, 21, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(20, '6472010208900020', 'Slamet Riyadi', '1990-08-17', '081345678020', 'B', 'Buruh', 'SD', 0, 22, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(21, '6472011209940021', 'Asep Sunandar', '1994-09-09', '081345678021', 'O', 'Swasta', 'SMK', 0, 23, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(22, '6472012210850022', 'Denny Cagur', '1985-10-10', '081345678022', 'A', 'Pedagang', 'SMP', 1, 24, '2025-11-23 14:31:06', '2025-12-12 19:46:05'),
(23, '6472013211880023', 'Sule Priatna', '1988-11-20', '081345678023', 'B', 'Supir Truk', 'SMP', 0, 26, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(24, '6472014212910024', 'Andre Taulany', '1991-12-30', '081345678024', 'O', 'PNS', 'S1', 0, 27, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(25, '6472015201930025', 'Parto Patrio', '1993-01-05', '081345678025', 'AB', 'Swasta', 'SMA', 0, 28, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(26, '6472016202860026', 'Azis Gagap', '1986-02-15', '081345678026', 'A', 'Buruh', 'SD', 1, 29, '2025-11-23 14:31:06', '2025-12-12 19:46:05'),
(27, '6472017203890027', 'Nunung Srimulat', '1989-03-25', '081345678027', 'B', 'Pedagang', 'SMP', 0, 30, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(28, '6472018204920028', 'Desta Mahendra', '1992-04-04', '081345678028', 'O', 'Dokter', 'S2', 1, 31, '2025-11-23 14:31:06', '2025-12-12 19:46:05'),
(29, '6472019205950029', 'Vincent Rompies', '1995-05-05', '081345678029', 'A', 'Seniman', 'S1', 0, 32, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(30, '6472010306870030', 'Tora Sudiro', '1987-06-15', '081345678030', 'B', 'Swasta', 'SMA', 0, 33, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(31, '6472011307900031', 'Indro Warkop', '1990-07-25', '081345678031', 'O', 'Pensiunan', 'S1', 0, 34, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(32, '6472012308940032', 'Dono Pradana', '1994-08-10', '081345678032', 'AB', 'Komika', 'S1', 1, 36, '2025-11-23 14:31:06', '2025-12-12 19:46:05'),
(33, '6472013309880033', 'Kasino Hadiwibowo', '1988-09-20', '081345678033', 'A', 'PNS', 'S1', 0, 37, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(34, '6472014310910034', 'Benyamin Sueb', '1991-10-30', '081345678034', 'B', 'Seniman', 'SMA', 0, 38, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(35, '6472015311860035', 'Mandra Naih', '1986-11-05', '081345678035', 'O', 'Buruh', 'SD', 0, 39, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(36, '6472016312930036', 'Rano Karno', '1993-12-15', '081345678036', 'A', 'Politisi', 'S2', 1, 40, '2025-11-23 14:31:06', '2025-12-12 19:46:05'),
(37, '6472017301900037', 'Basuki Tjahaja', '1990-01-25', '081345678037', 'B', 'Wiraswasta', 'S1', 0, 41, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(38, '6472018302950038', 'Djarot Saiful', '1995-02-14', '081345678038', 'O', 'PNS', 'S2', 1, 42, '2025-11-23 14:31:06', '2025-12-12 19:46:05'),
(39, '6472019303890039', 'Anies Baswedan', '1989-03-03', '081345678039', 'AB', 'Dosen', 'S3', 0, 43, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(40, '6472010404920040', 'Sandiaga Uno', '1992-04-12', '081345678040', 'A', 'Pengusaha', 'S2', 0, 44, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(41, '6472011405870041', 'Ganjar Pranowo', '1987-05-22', '081345678041', 'B', 'PNS', 'S2', 0, 46, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(42, '6472012406900042', 'Ridwan Kamil', '1990-06-01', '081345678042', 'O', 'Arsitek', 'S2', 1, 47, '2025-11-23 14:31:06', '2025-12-12 19:46:05'),
(43, '6472013407940043', 'Khofifah Indar', '1994-07-10', '081345678043', 'A', 'PNS', 'S1', 0, 48, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(44, '6472014408860044', 'Erick Thohir', '1986-08-20', '081345678044', 'AB', 'BUMN', 'S2', 0, 49, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(45, '6472015409910045', 'Nadiem Makarim', '1991-09-30', '081345678045', 'B', 'Tech Lead', 'S2', 0, 50, '2025-11-23 14:31:06', '2025-11-23 14:31:06'),
(46, '6472021837324578', 'Asep Bumida Laki', '1998-03-15', '080001111112', 'B', 'Karyawan', 'D4', 1, 52, '2025-12-08 18:55:45', '2025-12-25 15:49:53');

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
-- Dumping data for table `wilker_posyandu`
--

INSERT INTO `wilker_posyandu` (`id`, `nama_posyandu`, `kelurahan_id`, `rt`, `created_at`, `updated_at`) VALUES
(1, 'Amanah', 2, '10,11,12,13,14,25', '2025-12-24 18:27:38', '2025-12-24 18:54:30'),
(2, 'Anggrek Bulan', 2, '21,22,23,24', '2025-12-24 18:27:38', '2025-12-24 18:54:30'),
(3, 'Mawar merah', 2, '15,16,17,18,19,20', '2025-12-24 18:27:38', '2025-12-24 18:54:30'),
(4, 'Sumber Waras', 2, '01,02,03,04,05,06,07,08,09', '2025-12-24 18:27:38', '2025-12-24 18:54:30'),
(5, 'Rukun Makmur', 1, '12', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(6, 'Melati', 1, '29,30,31,32,33', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(7, 'Sehat Ceria', 1, '04,05,51,52', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(8, 'Harmoni', 1, '41,42,43,44', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(9, 'Anggrek Hitam', 1, '46', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(10, 'Widuri', 1, '21', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(11, 'Kasih Ibu', 1, '20,48', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(12, 'Wijaya Kusuma', 1, '45,49', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(13, 'Nusa Indah', 1, '18,19,22', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(14, 'Rahmat Jaya', 1, '27,28', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(15, 'Kenanga', 1, '39,40', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(16, 'Anggrek Putih', 1, '09,10,11', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(17, 'Tunas Harapan', 1, '02,34', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(18, 'Cempaka Putih', 1, '26,38', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(19, 'Mekar Harum', 1, '23,24,25', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(20, 'Flamboyan', 1, '35,36', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(21, 'Sutra Ungu', 1, '08,13,14,16,50', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(22, 'Sri Rejeki', 1, '15,17', '2025-12-24 18:27:38', '2025-12-24 18:53:34'),
(23, 'Kemuning', 3, '01,02,03,04,07,28', '2025-12-24 18:27:38', '2025-12-24 18:54:30'),
(24, 'Menuju Sehat', 3, '12,14,23,24', '2025-12-24 18:27:38', '2025-12-24 18:54:30'),
(25, 'Teratai', 3, '05,06,08,09,21,22', '2025-12-24 18:27:38', '2025-12-24 18:54:30'),
(26, 'Harapan Sehat', 3, '18,19,20', '2025-12-24 18:27:38', '2025-12-24 18:54:30'),
(27, 'Cerah Ceria', 3, '26,27', '2025-12-24 18:27:38', '2025-12-24 18:54:30'),
(28, 'Mawar Kuning', 3, '10,11,25,32', '2025-12-24 18:27:38', '2025-12-24 18:54:30'),
(29, 'Cendrawasih', 3, '13,15,16,17,29,30,31', '2025-12-24 18:27:38', '2025-12-24 18:54:30');

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=76;

--
-- AUTO_INCREMENT for table `bidan`
--
ALTER TABLE `bidan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `ibu`
--
ALTER TABLE `ibu`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `jiwa_screening`
--
ALTER TABLE `jiwa_screening`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `kehamilan`
--
ALTER TABLE `kehamilan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `kelurahan`
--
ALTER TABLE `kelurahan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `komplikasi`
--
ALTER TABLE `komplikasi`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `kunjungan_nifas`
--
ALTER TABLE `kunjungan_nifas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `lab_screening`
--
ALTER TABLE `lab_screening`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `persalinan`
--
ALTER TABLE `persalinan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `riwayat_penyakit`
--
ALTER TABLE `riwayat_penyakit`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `suami`
--
ALTER TABLE `suami`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `wilker_posyandu`
--
ALTER TABLE `wilker_posyandu`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

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
