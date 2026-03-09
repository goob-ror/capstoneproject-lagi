// Komplikasi Worksheet Filler
const fillKomplikasiWorksheet = async (workbook, data, tanggal_laporan, nama_puskesmas) => {
    const worksheet = workbook.getWorksheet('Komplikasi Kebidanan');
    if (!worksheet) return;

    // Fill header data
    worksheet.getCell('C1').value = tanggal_laporan;
    worksheet.getCell('A2').value = nama_puskesmas;
    worksheet.getCell('B2').value = nama_puskesmas;
    worksheet.getCell('C2').value = nama_puskesmas;
    worksheet.getCell('A3').value = nama_puskesmas;
    worksheet.getCell('B3').value = nama_puskesmas;
    worksheet.getCell('C3').value = nama_puskesmas;

    if (!data || data.length === 0) return;

    // Helper function to format percentage
    const formatPercent = (value) => {
        const num = parseFloat(value) || 0;
        return num + '%';
    };

    const kelurahanRowMap = {
        'Simpang Pasir': 7,
        'Rawa Makmur': 8,
        'Handil Bakti': 9
    };

    // Fill data for each kelurahan
    data.forEach(kelData => {
        const rowIndex = kelurahanRowMap[kelData.kelurahan];
        if (!rowIndex) return;

        const row = worksheet.getRow(rowIndex);
        let colIndex = 2;

        row.getCell(colIndex++).value = kelData.total_bumil || 0;
        row.getCell(colIndex++).value = kelData.total_bersalin || 0;
        row.getCell(colIndex++).value = kelData.tm1 || 0;
        row.getCell(colIndex++).value = kelData.tm2 || 0;
        row.getCell(colIndex++).value = kelData.tm3 || 0;
        row.getCell(colIndex++).value = kelData.anemia_jumlah || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.anemia_persen);
        row.getCell(colIndex++).value = kelData.kek_jumlah || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.kek_persen);
        row.getCell(colIndex++).value = kelData.preeklamsia_jumlah || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.preeklamsia_persen);
        row.getCell(colIndex++).value = kelData.infeksi_jumlah || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.infeksi_persen);
        row.getCell(colIndex++).value = kelData.tb_jumlah || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.tb_persen);
        row.getCell(colIndex++).value = kelData.malaria_jumlah || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.malaria_persen);
        row.getCell(colIndex++).value = kelData.hiv_jumlah || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.hiv_persen);
        row.getCell(colIndex++).value = kelData.jantung_jumlah || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.jantung_persen);
        row.getCell(colIndex++).value = kelData.diabetes_jumlah || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.diabetes_persen);
        row.getCell(colIndex++).value = kelData.obesitas_jumlah || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.obesitas_persen);
        row.getCell(colIndex++).value = kelData.keguguran_jumlah || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.keguguran_persen);
        row.getCell(colIndex++).value = kelData.lainnya_jumlah || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.lainnya_persen);
        row.getCell(colIndex++).value = kelData.total_bumil_komplikasi || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.total_bumil_komplikasi_persen);
        row.getCell(colIndex++).value = kelData.rujuk_rs_jumlah || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.rujuk_rs_persen);

        row.commit();
    });
};

module.exports = { fillKomplikasiWorksheet };
