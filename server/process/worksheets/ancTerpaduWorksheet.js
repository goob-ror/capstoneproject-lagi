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

    // Anemia Summary (V-AK)
    row.getCell(colIndex++).value = kelData.jumlah_bumilanemia || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_bumilanemia);
    row.getCell(colIndex++).value = kelData.jumlah_anemiaberat || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_anemiaberat);
    row.getCell(colIndex++).value = kelData.jumlah_anemiasedang || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_anemiasedang);
    row.getCell(colIndex++).value = kelData.jumlah_anemiaringan || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_anemiaringan);
    row.getCell(colIndex++).value = kelData.jumlah_anemiasedangberat || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_anemiasedangberat);
    row.getCell(colIndex++).value = kelData.jumlah_sedangberat_tatalaksana || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_sedangberat_tatalaksana);
    row.getCell(colIndex++).value = kelData.jumlah_anemiaringan_naikhb || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_anemiaringan_naikhb);
    row.getCell(colIndex++).value = kelData.jumlah_anemiaberat_rujukrs || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_anemiaberat_rujukrs);

    // LILA & KEK (AL-AQ)
    row.getCell(colIndex++).value = kelData.jumlah_diperiksalila || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_diperiksalila);
    row.getCell(colIndex++).value = kelData.jumlah_kek || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_kek);
    row.getCell(colIndex++).value = kelData.jumlah_kek_gizi || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_kek_gizi);

    // BMI (AR-BI)
    row.getCell(colIndex++).value = kelData.jumlah_diperiksa_bmi || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_diperiksa_bmi);
    row.getCell(colIndex++).value = kelData.jumlah_bmikurus || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_bmikurus);
    row.getCell(colIndex++).value = kelData.jumlah_bminormal || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_bminormal);
    row.getCell(colIndex++).value = kelData.jumlah_bmigemuk || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_bmigemuk);
    row.getCell(colIndex++).value = kelData.jumlah_bmiobesitas || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_bmiobesitas);
    row.getCell(colIndex++).value = kelData.jumlah_bmikurus_naik || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_bmikurus_naik);
    row.getCell(colIndex++).value = kelData.jumlah_bminormal_naik || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_bminormal_naik);
    row.getCell(colIndex++).value = kelData.jumlah_bminormal_turun || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_bminormal_turun);
    row.getCell(colIndex++).value = kelData.jumlah_kek_tatalaksana || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_kek_tatalaksana);

    // BMI TM1 (BJ-BN)
    row.getCell(colIndex++).value = kelData.tm1_liladiperiksa || 0;
    row.getCell(colIndex++).value = kelData.tm1_bmikurus || 0;
    row.getCell(colIndex++).value = kelData.tm1_bminormal || 0;
    row.getCell(colIndex++).value = kelData.tm1_bmigemuk || 0;
    row.getCell(colIndex++).value = kelData.tm1_bmiobesitas || 0;

    // BMI TM2 (BO-BS)
    row.getCell(colIndex++).value = kelData.tm2_liladiperiksa || 0;
    row.getCell(colIndex++).value = kelData.tm2_bmikurus || 0;
    row.getCell(colIndex++).value = kelData.tm2_bminormal || 0;
    row.getCell(colIndex++).value = kelData.tm2_bmigemuk || 0;
    row.getCell(colIndex++).value = kelData.tm2_bmiobesitas || 0;

    // BMI TM3 (BT-BX)
    row.getCell(colIndex++).value = kelData.tm3_liladiperiksa || 0;
    row.getCell(colIndex++).value = kelData.tm3_bmikurus || 0;
    row.getCell(colIndex++).value = kelData.tm3_bminormal || 0;
    row.getCell(colIndex++).value = kelData.tm3_bmigemuk || 0;
    row.getCell(colIndex++).value = kelData.tm3_bmiobesitas || 0;

    // Protein Urin (BY-CH)
    row.getCell(colIndex++).value = kelData.jumlah_skriningproteinurin || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_skriningproteinurin);
    row.getCell(colIndex++).value = kelData['jumlah_positif+1'] || 0;
    row.getCell(colIndex++).value = formatPercent(kelData['persen_positif+1']);
    row.getCell(colIndex++).value = kelData['jumlah_positif+2'] || 0;
    row.getCell(colIndex++).value = formatPercent(kelData['persen_positif+2']);
    row.getCell(colIndex++).value = kelData['jumlah_positif+3'] || 0;
    row.getCell(colIndex++).value = formatPercent(kelData['persen_positif+3']);
    row.getCell(colIndex++).value = kelData['jumlah_positif+4'] || 0;
    row.getCell(colIndex++).value = formatPercent(kelData['persen_positif+4']);

    // Gula Darah (CI-CP)
    row.getCell(colIndex++).value = kelData.jumlah_diperiksaguladarah || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_diperiksaguladarah);
    row.getCell(colIndex++).value = kelData.jumlah_guladarah_ringan || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_guladarah_ringan);
    row.getCell(colIndex++).value = kelData.jumlah_guladarah_sedang || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_guladarah_sedang);
    row.getCell(colIndex++).value = kelData.jumlah_guladarah_berat || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_guladarah_berat);

    // HIV (CQ-CX)
    row.getCell(colIndex++).value = kelData.jumlah_diperiksaahiv || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_diperiksaahiv);
    row.getCell(colIndex++).value = kelData.jumlah_hivpositif || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_hivpositif);
    row.getCell(colIndex++).value = kelData.jumlah_bumil_mendapatart || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_bumil_mendapatart);
    row.getCell(colIndex++).value = kelData.hiv_persalinannormal || 0;
    row.getCell(colIndex++).value = kelData.hiv_persalinansectio || 0;

    // Malaria (CY-DD)
    row.getCell(colIndex++).value = kelData.jumlah_diperiksamalaria || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_diperiksamalaria);
    row.getCell(colIndex++).value = kelData.jumlah_positifmalaria || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_positifmalaria);
    row.getCell(colIndex++).value = kelData.jumlah_malariatatalaksana || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_malariatatalaksana);

    // Cacingan (DE-DJ)
    row.getCell(colIndex++).value = kelData.jumlah_diperiksacacingan || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_diperiksacacingan);
    row.getCell(colIndex++).value = kelData.jumlah_positifcacingan || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_positifcacingan);
    row.getCell(colIndex++).value = kelData.jumlah_cacingantatalaksana || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_cacingantatalaksana);

    // IMS (DK-DP)
    row.getCell(colIndex++).value = kelData.jumlah_diperiksaims || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_diperiksaims);
    row.getCell(colIndex++).value = kelData.jumlah_positifims || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_positifims);
    row.getCell(colIndex++).value = kelData.jumlah_imstatalaksana || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_imstatalaksana);

    // HBsAg (DQ-DV)
    row.getCell(colIndex++).value = kelData.jumlah_diperiksahbsag || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_diperiksahbsag);
    row.getCell(colIndex++).value = kelData.jumlah_positifhbsag || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_positifhbsag);
    row.getCell(colIndex++).value = kelData.jumlah_hbsagtatalaksana || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.persen_hbsagtatalaksana);

    // Komplikasi ANC (DW-EX)
    row.getCell(colIndex++).value = kelData.komplikasi_anc_anemia_jumlah || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komplikasi_anc_anemia_persen);
    row.getCell(colIndex++).value = kelData.komplikasi_anc_kek_jumlah || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komplikasi_anc_kek_persen);
    row.getCell(colIndex++).value = kelData['komplikasi_anc_preeklamsia/eklamsia_jumlah'] || 0;
    row.getCell(colIndex++).value = formatPercent(kelData['komplikasi_anc_preeklamsia/eklamsia_persen']);
    row.getCell(colIndex++).value = kelData.komplikasi_anc_infeksi_jumlah || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komplikasi_anc_infeksi_persen);
    row.getCell(colIndex++).value = kelData.komplikasi_anc_tuberculosis_jumlah || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komplikasi_anc_tuberculosis_persen);
    row.getCell(colIndex++).value = kelData.komplikasi_anc_malaria_jumlah || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komplikasi_anc_malaria_persen);
    row.getCell(colIndex++).value = kelData.komplikasi_anc_hiv_jumlah || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komplikasi_anc_hiv_persen);
    row.getCell(colIndex++).value = kelData.komplikasi_anc_jantung_jumlah || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komplikasi_anc_jantung_persen);
    row.getCell(colIndex++).value = kelData.komplikasi_anc_diabetes_melitus_jumlah || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komplikasi_anc_diabetes_melitus_persen);
    row.getCell(colIndex++).value = kelData.komplikasi_anc_obesitas_jumlah || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komplikasi_anc_obesitas_persen);
    row.getCell(colIndex++).value = kelData.komplikasi_anc_keguguran_jumlah || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komplikasi_anc_keguguran_persen);
    row.getCell(colIndex++).value = kelData.komplikasi_anc_lainlain_jumlah || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komplikasi_anc_lainlain_persen);
    row.getCell(colIndex++).value = kelData.komplikasi_anc_bumil_jumlah || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komplikasi_anc_bumil_persen);
    row.getCell(colIndex++).value = kelData.komplikasi_anc_bumil_rujukrs_jumlah || 0;
    row.getCell(colIndex++).value = formatPercent(kelData.komplikasi_anc_bumil_rujukrs_persen);
};

module.exports = { fillANCTerpaduWorksheet };
