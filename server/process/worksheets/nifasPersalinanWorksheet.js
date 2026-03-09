// Nifas Persalinan Worksheet Filler
const fillNifasPersalinanWorksheet = async (workbook, data, tanggal_laporan, nama_puskesmas) => {
    const worksheet = workbook.getWorksheet('Persalinan Nifas');
    if (!worksheet) {
        console.error('Worksheet "Persalinan Nifas" not found');
        return;
    }

    // Fill header data
    worksheet.getCell('C1').value = tanggal_laporan;
    worksheet.getCell('A2').value = nama_puskesmas;
    worksheet.getCell('B2').value = nama_puskesmas;
    worksheet.getCell('C2').value = nama_puskesmas;
    worksheet.getCell('A3').value = nama_puskesmas;
    worksheet.getCell('B3').value = nama_puskesmas;
    worksheet.getCell('C3').value = nama_puskesmas;

    if (!data || !data.kelurahan) return;

    // Helper function to format percentage
    const formatPercent = (value) => {
        const num = parseFloat(value) || 0;
        return num + '%';
    };

    // Kelurahan name mapping (lowercase, no spaces for placeholder)
    const kelurahanPlaceholderMap = {
        'Simpang Pasir': 'simpangpasir',
        'Rawa Makmur': 'rawamakmur',
        'Handil Bakti': 'handilbakti'
    };

    // Iterate through all cells and replace placeholders
    worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
            if (cell.value && typeof cell.value === 'string' && cell.value.includes('{')) {
                let cellValue = cell.value;

                // Replace for each kelurahan
                data.kelurahan.forEach(kelData => {
                    const kelPlaceholder = kelurahanPlaceholderMap[kelData.kelurahan];
                    if (!kelPlaceholder) return;

                    cellValue = replacePlaceholders(cellValue, kelPlaceholder, kelData, formatPercent);
                });

                // Replace totals
                if (data.total) {
                    cellValue = replacePlaceholders(cellValue, 'total', data.total, formatPercent);
                }

                cell.value = cellValue;
            }
        });
    });
};

const replacePlaceholders = (cellValue, prefix, data, formatPercent) => {
    // Basic counts
    cellValue = cellValue.replace(`{${prefix}_jumlahbumil}`, data.jumlah_bumil || 0);
    cellValue = cellValue.replace(`{${prefix}_jumlahbersalin}`, data.jumlah_bersalin || 0);
    cellValue = cellValue.replace(`{${prefix}_bumil_tm1}`, data.tm1 || 0);
    cellValue = cellValue.replace(`{${prefix}_bumil_tm2}`, data.tm2 || 0);
    cellValue = cellValue.replace(`{${prefix}_bumil_tm3}`, data.tm3 || 0);

    // Persalinan ditolongnakes
    cellValue = cellValue.replace(`{${prefix}_persalinan_ditolongnakes_jumlah}`, data.jumlah_nakes || 0);
    cellValue = cellValue.replace(`{${prefix}_persalinan_ditolongnakes_persen}`, formatPercent(data.persen_nakes));

    // Persalinan ditolongnonnakes
    const jumlah_nonnakes = (data.jumlah_bersalin || 0) - (data.jumlah_nakes || 0);
    const persen_nonnakes = data.jumlah_bersalin > 0 ? ((jumlah_nonnakes / data.jumlah_bersalin) * 100).toFixed(1) : 0;
    cellValue = cellValue.replace(`{${prefix}_persalinan_ditolongnonnakes_jumlah}`, jumlah_nonnakes);
    cellValue = cellValue.replace(`{${prefix}_persalinan_ditolongnonnakes_persen}`, formatPercent(persen_nonnakes));

    // Persalinan di faskes
    cellValue = cellValue.replace(`{${prefix}_persalinan_di_faskes_jumlah}`, data.jumlah_faskes || 0);
    cellValue = cellValue.replace(`{${prefix}_persalinan_di_faskes_persen}`, formatPercent(data.persen_faskes));

    // Persalinan di nonfaskes
    const jumlah_nonfaskes = (data.jumlah_bersalin || 0) - (data.jumlah_faskes || 0);
    const persen_nonfaskes = data.jumlah_bersalin > 0 ? ((jumlah_nonfaskes / data.jumlah_bersalin) * 100).toFixed(1) : 0;
    cellValue = cellValue.replace(`{${prefix}_persalinan_di_nonfaskes_jumlah}`, jumlah_nonfaskes);
    cellValue = cellValue.replace(`{${prefix}_persalinan_di_nonfaskes_persen}`, formatPercent(persen_nonfaskes));

    // Pelayanan Nifas KF1-KF4
    cellValue = cellValue.replace(`{${prefix}_pelayanan_nifas_kf1_jumlah}`, data.jumlah_kf1 || 0);
    cellValue = cellValue.replace(`{${prefix}_pelayanan_nifas_kf1_persen}`, formatPercent(data.persen_kf1));
    cellValue = cellValue.replace(`{${prefix}_pelayanan_nifas_kf2_jumlah}`, data.jumlah_kf2 || 0);
    cellValue = cellValue.replace(`{${prefix}_pelayanan_nifas_kf2_persen}`, formatPercent(data.persen_kf2));
    cellValue = cellValue.replace(`{${prefix}_pelayanan_nifas_kf3_jumlah}`, data.jumlah_kf3 || 0);
    cellValue = cellValue.replace(`{${prefix}_pelayanan_nifas_kf3_persen}`, formatPercent(data.persen_kf3));
    cellValue = cellValue.replace(`{${prefix}_pelayanan_nifas_kf4_jumlah}`, data.jumlah_kf_lengkap || 0);
    cellValue = cellValue.replace(`{${prefix}_pelayanan_nifas_kf4_persen}`, formatPercent(data.persen_kf_lengkap));

    // Mendapat Vitamin A (not in data, use 0)
    cellValue = cellValue.replace(`{${prefix}_pelayanan_nifas_mendapat_vitaminA_jumlah}`, 0);
    cellValue = cellValue.replace(`{${prefix}_pelayanan_nifas_mendapat_vitaminA_persen}`, '0%');

    // Mendapat TTD
    cellValue = cellValue.replace(`{${prefix}_pelayanan_nifas_mendapat_ttd_jumlah}`, data.jumlah_ttd || 0);
    cellValue = cellValue.replace(`{${prefix}_pelayanan_nifas_mendapat_ttd_persen}`, formatPercent(data.persen_ttd));

    // Komplikasi Persalinan/Nifas
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_anemia_jumlah}`, data.jumlah_anemia || 0);
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_anemia_persen}`, formatPercent(data.persen_anemia));
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_kek_jumlah}`, data.jumlah_kek || 0);
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_kek_persen}`, formatPercent(data.persen_kek));
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_preeklamsia/eklamsia_jumlah}`, data.jumlah_eklamsia || 0);
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_preeklamsia/eklamsia_persen}`, formatPercent(data.persen_eklamsia));
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_infeksi_jumlah}`, data.jumlah_infeksi || 0);
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_infeksi_persen}`, formatPercent(data.persen_infeksi));
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_tuberculosis_jumlah}`, data.jumlah_tb || 0);
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_tuberculosis_persen}`, formatPercent(data.persen_tb));
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_malaria_jumlah}`, data.jumlah_malaria || 0);
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_malaria_persen}`, formatPercent(data.persen_malaria));
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_hiv_jumlah}`, data.jumlah_hiv || 0);
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_hiv_persen}`, formatPercent(data.persen_hiv));
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_jantung_jumlah}`, data.jumlah_jantung || 0);
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_jantung_persen}`, formatPercent(data.persen_jantung));
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_diabetes_melitus_jumlah}`, data.jumlah_diabetes || 0);
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_diabetes_melitus_persen}`, formatPercent(data.persen_diabetes));
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_obesitas_jumlah}`, data.jumlah_obesitas || 0);
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_obesitas_persen}`, formatPercent(data.persen_obesitas));
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_keguguran_jumlah}`, data.jumlah_keguguran || 0);
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_keguguran_persen}`, formatPercent(data.persen_keguguran));
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_lainlain_jumlah}`, data.jumlah_lainnya || 0);
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_lainlain_persen}`, formatPercent(data.persen_lainnya));
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_bumil_jumlah}`, data.jumlah_bumil_komplikasi || 0);
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_bumil_persen}`, formatPercent(data.persen_bumil_komplikasi));
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_bumil_rujukrs_jumlah}`, data.jumlah_rujuk_rs || 0);
    cellValue = cellValue.replace(`{${prefix}_komplikasi_persalinannifas_bumil_rujukrs_persen}`, formatPercent(data.persen_rujuk_rs));

    return cellValue;
};

module.exports = { fillNifasPersalinanWorksheet };
