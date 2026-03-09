// ANC Terpadu Worksheet Filler
const fillANCTerpaduWorksheet = async (workbook, data, tanggal_laporan, nama_puskesmas) => {
    const worksheet = workbook.getWorksheet('ANC Terpadu');
    if (!worksheet) return;

    // Fill header data
    worksheet.getCell('C1').value = tanggal_laporan;
    worksheet.getCell('A2').value = nama_puskesmas;
    worksheet.getCell('B2').value = nama_puskesmas;
    worksheet.getCell('C2').value = nama_puskesmas;
    worksheet.getCell('A3').value = nama_puskesmas;
    worksheet.getCell('B3').value = nama_puskesmas;
    worksheet.getCell('C3').value = nama_puskesmas;

    if (!data || !data.kelurahan) return;

    const kelurahanRowMap = {
        'Simpang Pasir': 7,
        'Rawa Makmur': 8,
        'Handil Bakti': 9
    };

    // Helper function to format percentage
    const formatPercent = (value) => {
        const num = parseFloat(value) || 0;
        return num + '%';
    };

    // Fill data for each kelurahan
    data.kelurahan.forEach(kelData => {
        const rowIndex = kelurahanRowMap[kelData.kelurahan];
        if (!rowIndex) return;

        const row = worksheet.getRow(rowIndex);
        fillKelurahanRow(row, kelData, formatPercent);
        row.commit();
    });

    // Fill total row (row 10)
    if (data.total) {
        const totalRow = worksheet.getRow(10);
        fillKelurahanRow(totalRow, data.total, formatPercent);
        totalRow.commit();
    }
};

const fillKelurahanRow = (row, kelData, formatPercent) => {
    let colIndex = 2;

    // Basic counts (B-F)
    row.getCell(colIndex++).value = kelData.jumlah_bumil || 0;
    row.getCell(colIndex++).value = kelData.jumlah_bersalin || 0;
    row.getCell(colIndex++).value = kelData.tm1 || 0;
    row.getCell(colIndex++).value = kelData.tm2 || 0;
    row.getCell(colIndex++).value = kelData.tm3 || 0;

    // Anemia TM1 (G-K)
    row.getCell(colIndex++).value = kelData.anemia_tm1_diperiksa || 0;
    row.getCell(colIndex++).value = kelData.anemia_tm1_berat || 0;
    row.getCell(colIndex++).value = kelData.anemia_tm1_sedang || 0;
    row.getCell(colIndex++).value = kelData.anemia_tm1_ringan || 0;
    row.getCell(colIndex++).value = kelData.anemia_tm1_total || 0;

    // Anemia TM2 (L-P)
    row.getCell(colIndex++).value = kelData.anemia_tm2_diperiksa || 0;
    row.getCell(colIndex++).value = kelData.anemia_tm2_berat || 0;
    row.getCell(colIndex++).value = kelData.anemia_tm2_sedang || 0;
    row.getCell(colIndex++).value = kelData.anemia_tm2_ringan || 0;
    row.getCell(colIndex++).value = kelData.anemia_tm2_total || 0;

    // Anemia TM3 (Q-U)
    row.getCell(colIndex++).value = kelData.anemia_tm3_diperiksa || 0;
    row.getCell(colIndex++).value = kelData.anemia_tm3_berat || 0;
    row.getCell(colIndex++).value = kelData.anemia_tm3_sedang || 0;
    row.getCell(colIndex++).value = kelData.anemia_tm3_ringan || 0;
    row.getCell(colIndex++).value = kelData.anemia_tm3_total || 0;

    // Anemia Summary (V-AK) - These fields need to be calculated or come from controller
    const totalAnemia = (kelData.anemia_tm1_total || 0) + (kelData.anemia_tm2_total || 0) + (kelData.anemia_tm3_total || 0);
    const totalBerat = (kelData.anemia_tm1_berat || 0) + (kelData.anemia_tm2_berat || 0) + (kelData.anemia_tm3_berat || 0);
    const totalSedang = (kelData.anemia_tm1_sedang || 0) + (kelData.anemia_tm2_sedang || 0) + (kelData.anemia_tm3_sedang || 0);
    const totalRingan = (kelData.anemia_tm1_ringan || 0) + (kelData.anemia_tm2_ringan || 0) + (kelData.anemia_tm3_ringan || 0);
    const bumil = kelData.jumlah_bumil || 1;
    
    row.getCell(colIndex++).value = totalAnemia;
    row.getCell(colIndex++).value = formatPercent((totalAnemia / bumil * 100).toFixed(1));
    row.getCell(colIndex++).value = totalBerat;
    row.getCell(colIndex++).value = formatPercent((totalBerat / bumil * 100).toFixed(1));
    row.getCell(colIndex++).value = totalSedang;
    row.getCell(colIndex++).value = formatPercent((totalSedang / bumil * 100).toFixed(1));
    row.getCell(colIndex++).value = totalRingan;
    row.getCell(colIndex++).value = formatPercent((totalRingan / bumil * 100).toFixed(1));
    row.getCell(colIndex++).value = totalBerat + totalSedang;
    row.getCell(colIndex++).value = formatPercent(((totalBerat + totalSedang) / bumil * 100).toFixed(1));
    row.getCell(colIndex++).value = 0; // sedangberat_tatalaksana - not in controller
    row.getCell(colIndex++).value = '0%';
    row.getCell(colIndex++).value = 0; // anemiaringan_naikhb - not in controller
    row.getCell(colIndex++).value = '0%';
    row.getCell(colIndex++).value = 0; // anemiaberat_rujukrs - not in controller
    row.getCell(colIndex++).value = '0%';

    // LILA & KEK (AL-BI)
    row.getCell(colIndex++).value = kelData.lila_diperiksa_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.lila_diperiksa_persen);
    row.getCell(colIndex++).value = kelData.kek_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.kek_persen);
    row.getCell(colIndex++).value = kelData.kek_gizi_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.kek_gizi_persen);

    // BMI (AR-BI)
    row.getCell(colIndex++).value = kelData.bmi_diperiksa_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.bmi_diperiksa_persen);
    row.getCell(colIndex++).value = kelData.bmi_kurus_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.bmi_kurus_persen);
    row.getCell(colIndex++).value = kelData.bmi_normal_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.bmi_normal_persen);
    row.getCell(colIndex++).value = kelData.bmi_gemuk_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.bmi_gemuk_persen);
    row.getCell(colIndex++).value = kelData.bmi_obesitas_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.bmi_obesitas_persen);
    row.getCell(colIndex++).value = 0; // bmikurus_naik - not in controller
    row.getCell(colIndex++).value = '0%';
    row.getCell(colIndex++).value = 0; // bminormal_naik - not in controller
    row.getCell(colIndex++).value = '0%';
    row.getCell(colIndex++).value = 0; // bminormal_turun - not in controller
    row.getCell(colIndex++).value = '0%';
    row.getCell(colIndex++).value = kelData.kek_tatalaksana_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.kek_tatalaksana_persen);

    // BMI TM1 (BJ-BN) - not in controller, use 0
    row.getCell(colIndex++).value = 0; // tm1_liladiperiksa
    row.getCell(colIndex++).value = 0; // tm1_bmikurus
    row.getCell(colIndex++).value = 0; // tm1_bminormal
    row.getCell(colIndex++).value = 0; // tm1_bmigemuk
    row.getCell(colIndex++).value = 0; // tm1_bmiobesitas

    // BMI TM2 (BO-BS) - not in controller, use 0
    row.getCell(colIndex++).value = 0; // tm2_liladiperiksa
    row.getCell(colIndex++).value = 0; // tm2_bmikurus
    row.getCell(colIndex++).value = 0; // tm2_bminormal
    row.getCell(colIndex++).value = 0; // tm2_bmigemuk
    row.getCell(colIndex++).value = 0; // tm2_bmiobesitas

    // BMI TM3 (BT-BX) - not in controller, use 0
    row.getCell(colIndex++).value = 0; // tm3_liladiperiksa
    row.getCell(colIndex++).value = 0; // tm3_bmikurus
    row.getCell(colIndex++).value = 0; // tm3_bminormal
    row.getCell(colIndex++).value = 0; // tm3_bmigemuk
    row.getCell(colIndex++).value = 0; // tm3_bmiobesitas

    // Protein Urin (BY-CH)
    row.getCell(colIndex++).value = kelData.protein_diperiksa_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.protein_diperiksa_persen);
    row.getCell(colIndex++).value = kelData.protein_1_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.protein_1_persen);
    row.getCell(colIndex++).value = kelData.protein_2_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.protein_2_persen);
    row.getCell(colIndex++).value = kelData.protein_3_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.protein_3_persen);
    row.getCell(colIndex++).value = 0; // positif+4 - not in controller
    row.getCell(colIndex++).value = '0%';

    // Gula Darah (CI-CP)
    row.getCell(colIndex++).value = kelData.gula_diperiksa_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.gula_diperiksa_persen);
    row.getCell(colIndex++).value = kelData.gula_ringan_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.gula_ringan_persen);
    row.getCell(colIndex++).value = kelData.gula_sedang_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.gula_sedang_persen);
    row.getCell(colIndex++).value = 0; // guladarah_berat - not in controller
    row.getCell(colIndex++).value = '0%';

    // HIV (CQ-CX)
    row.getCell(colIndex++).value = kelData.hiv_diperiksa_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.hiv_diperiksa_persen);
    row.getCell(colIndex++).value = kelData.hiv_positif_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.hiv_positif_persen);
    row.getCell(colIndex++).value = kelData.hiv_art_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.hiv_art_persen);
    row.getCell(colIndex++).value = kelData.hiv_normal || 0;
    row.getCell(colIndex++).value = kelData.hiv_sectio || 0;

    // Malaria (CY-DD)
    row.getCell(colIndex++).value = kelData.malaria_diperiksa_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.malaria_diperiksa_persen);
    row.getCell(colIndex++).value = kelData.malaria_positif_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.malaria_positif_persen);
    row.getCell(colIndex++).value = kelData.malaria_tatalaksana_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.malaria_tatalaksana_persen);

    // Cacingan (DE-DJ)
    row.getCell(colIndex++).value = kelData.kecacingan_diperiksa_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.kecacingan_diperiksa_persen);
    row.getCell(colIndex++).value = kelData.kecacingan_positif_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.kecacingan_positif_persen);
    row.getCell(colIndex++).value = kelData.kecacingan_tatalaksana_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.kecacingan_tatalaksana_persen);

    // IMS (DK-DP)
    row.getCell(colIndex++).value = kelData.ims_diperiksa_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.ims_diperiksa_persen);
    row.getCell(colIndex++).value = kelData.ims_positif_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.ims_positif_persen);
    row.getCell(colIndex++).value = kelData.ims_tatalaksana_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.ims_tatalaksana_persen);

    // HBsAg (DQ-DV)
    row.getCell(colIndex++).value = kelData.hbsag_diperiksa_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.hbsag_diperiksa_persen);
    row.getCell(colIndex++).value = kelData.hbsag_positif_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.hbsag_positif_persen);
    row.getCell(colIndex++).value = kelData.hbsag_tatalaksana_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.hbsag_tatalaksana_persen);

    // Komplikasi ANC (DW-EX)
    row.getCell(colIndex++).value = kelData.komp_anemia_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komp_anemia_persen);
    row.getCell(colIndex++).value = kelData.komp_kek_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komp_kek_persen);
    row.getCell(colIndex++).value = kelData.komp_preeklampsia_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komp_preeklampsia_persen);
    row.getCell(colIndex++).value = kelData.komp_infeksi_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komp_infeksi_persen);
    row.getCell(colIndex++).value = kelData.komp_tb_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komp_tb_persen);
    row.getCell(colIndex++).value = kelData.komp_malaria_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komp_malaria_persen);
    row.getCell(colIndex++).value = kelData.komp_hiv_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komp_hiv_persen);
    row.getCell(colIndex++).value = kelData.komp_jantung_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komp_jantung_persen);
    row.getCell(colIndex++).value = kelData.komp_diabetes_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komp_diabetes_persen);
    row.getCell(colIndex++).value = kelData.komp_obesitas_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komp_obesitas_persen);
    row.getCell(colIndex++).value = kelData.komp_keguguran_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komp_keguguran_persen);
    row.getCell(colIndex++).value = kelData.komp_lainnya_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komp_lainnya_persen);
    row.getCell(colIndex++).value = kelData.komp_total_jml || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komp_total_persen);
    row.getCell(colIndex++).value = 0; // bumil_rujukrs - not in controller
    row.getCell(colIndex++).value = '0%';
};

module.exports = { fillANCTerpaduWorksheet };
