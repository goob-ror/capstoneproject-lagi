// ANC Worksheet Filler
const fillANCWorksheet = async (workbook, data, tanggal_laporan, nama_puskesmas) => {
    const worksheet = workbook.getWorksheet('ANC');
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

    // Map kelurahan names to row indices (based on template)
    const kelurahanRowMap = {
        'Simpang Pasir': 7,
        'Rawa Makmur': 8,
        'Handil Bakti': 9
    };

    // Helper function to format percentage
    const formatPercent = (value) => {
        const num = parseFloat(value) || 0;
        return num;
    };

    // Fill data for each kelurahan
    data.kelurahan.forEach(kelData => {
        const rowIndex = kelurahanRowMap[kelData.kelurahan];
        if (!rowIndex) return;

        const row = worksheet.getRow(rowIndex);
        let colIndex = 2; // Start from column B

        // Fill all ANC metrics
        row.getCell(colIndex++).value = kelData.jumlah_bumil || 0;
        row.getCell(colIndex++).value = kelData.jumlah_bersalin || 0;
        row.getCell(colIndex++).value = kelData.jumlahresti || 0;
        row.getCell(colIndex++).value = kelData.jumlah_milikibukukia || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_milikibukukia) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_standar12t || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_standar12t) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_4terlalu || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_4terlalu) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_k1murni || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_k1murni) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_k1akses || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_k1akses) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_k1dokter || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_k1dokter) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_k1usg || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_k1usg) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_k4 || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_k4) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_k5 || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_k5) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_k5dokter || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_k5dokter) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_k5usg || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_k5usg) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_k6 || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_k6) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_k8 || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_k8) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_t1 || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_t1) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_t2 || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_t2) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_t3 || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_t3) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_t4 || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_t4) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_t5 || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_t5) + '%';
        row.getCell(colIndex++).value = kelData['jumlah_t2+'] || 0;
        row.getCell(colIndex++).value = formatPercent(kelData['persen_t2+']) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_fe30 || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_fe30) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_fe90 || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_fe90) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_maternal || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_maternal) + '%';
        row.getCell(colIndex++).value = kelData.jumlah_neonatal || 0;
        row.getCell(colIndex++).value = formatPercent(kelData.persen_neonatal) + '%';

        row.commit();
    });

    // Fill total row (row 10)
    if (data.total) {
        const totalRow = worksheet.getRow(10);
        let colIndex = 2;

        totalRow.getCell(colIndex++).value = data.total.jumlah_bumil || 0;
        totalRow.getCell(colIndex++).value = data.total.jumlah_bersalin || 0;
        totalRow.getCell(colIndex++).value = data.total.jumlahresti || 0;
        totalRow.getCell(colIndex++).value = data.total.jumlah_milikibukukia || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_milikibukukia) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_standar12t || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_standar12t) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_4terlalu || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_4terlalu) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_k1murni || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_k1murni) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_k1akses || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_k1akses) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_k1dokter || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_k1dokter) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_k1usg || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_k1usg) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_k4 || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_k4) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_k5 || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_k5) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_k5dokter || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_k5dokter) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_k5usg || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_k5usg) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_k6 || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_k6) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_k8 || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_k8) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_t1 || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_t1) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_t2 || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_t2) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_t3 || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_t3) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_t4 || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_t4) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_t5 || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_t5) + '%';
        totalRow.getCell(colIndex++).value = data.total['jumlah_t2+'] || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total['persen_t2+']) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_fe30 || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_fe30) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_fe90 || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_fe90) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_maternal || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_maternal) + '%';
        totalRow.getCell(colIndex++).value = data.total.jumlah_neonatal || 0;
        totalRow.getCell(colIndex++).value = formatPercent(data.total.persen_neonatal) + '%';

        totalRow.commit();
    }
};

module.exports = { fillANCWorksheet };
