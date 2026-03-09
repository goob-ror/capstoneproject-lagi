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

    // Calculate totals
    const total = {
        kelurahan: 'TOTAL',
        total_bumil: 0,
        total_bersalin: 0,
        tm1: 0,
        tm2: 0,
        tm3: 0,
        anemia_jumlah: 0,
        kek_jumlah: 0,
        preeklamsia_jumlah: 0,
        infeksi_jumlah: 0,
        tb_jumlah: 0,
        malaria_jumlah: 0,
        hiv_jumlah: 0,
        jantung_jumlah: 0,
        diabetes_jumlah: 0,
        obesitas_jumlah: 0,
        keguguran_jumlah: 0,
        lainnya_jumlah: 0,
        total_bumil_komplikasi: 0,
        rujuk_rs_jumlah: 0
    };

    // Fill data for each kelurahan and calculate totals
    data.forEach(kelData => {
        const rowIndex = kelurahanRowMap[kelData.kelurahan];
        if (!rowIndex) return;

        const row = worksheet.getRow(rowIndex);
        fillKomplikasiRow(row, kelData, formatPercent);
        row.commit();

        // Sum for totals
        total.total_bumil += kelData.total_bumil || 0;
        total.total_bersalin += kelData.total_bersalin || 0;
        total.tm1 += kelData.tm1 || 0;
        total.tm2 += kelData.tm2 || 0;
        total.tm3 += kelData.tm3 || 0;
        total.anemia_jumlah += kelData.anemia_jumlah || 0;
        total.kek_jumlah += kelData.kek_jumlah || 0;
        total.preeklamsia_jumlah += kelData.preeklamsia_jumlah || 0;
        total.infeksi_jumlah += kelData.infeksi_jumlah || 0;
        total.tb_jumlah += kelData.tb_jumlah || 0;
        total.malaria_jumlah += kelData.malaria_jumlah || 0;
        total.hiv_jumlah += kelData.hiv_jumlah || 0;
        total.jantung_jumlah += kelData.jantung_jumlah || 0;
        total.diabetes_jumlah += kelData.diabetes_jumlah || 0;
        total.obesitas_jumlah += kelData.obesitas_jumlah || 0;
        total.keguguran_jumlah += kelData.keguguran_jumlah || 0;
        total.lainnya_jumlah += kelData.lainnya_jumlah || 0;
        total.total_bumil_komplikasi += kelData.total_bumil_komplikasi || 0;
        total.rujuk_rs_jumlah += kelData.rujuk_rs_jumlah || 0;
    });

    // Calculate total percentages
    const calcPercent = (value) => total.total_bumil > 0 ? ((value / total.total_bumil) * 100).toFixed(1) : '0.0';
    total.anemia_persen = calcPercent(total.anemia_jumlah);
    total.kek_persen = calcPercent(total.kek_jumlah);
    total.preeklamsia_persen = calcPercent(total.preeklamsia_jumlah);
    total.infeksi_persen = calcPercent(total.infeksi_jumlah);
    total.tb_persen = calcPercent(total.tb_jumlah);
    total.malaria_persen = calcPercent(total.malaria_jumlah);
    total.hiv_persen = calcPercent(total.hiv_jumlah);
    total.jantung_persen = calcPercent(total.jantung_jumlah);
    total.diabetes_persen = calcPercent(total.diabetes_jumlah);
    total.obesitas_persen = calcPercent(total.obesitas_jumlah);
    total.keguguran_persen = calcPercent(total.keguguran_jumlah);
    total.lainnya_persen = calcPercent(total.lainnya_jumlah);
    total.total_bumil_komplikasi_persen = calcPercent(total.total_bumil_komplikasi);
    total.rujuk_rs_persen = calcPercent(total.rujuk_rs_jumlah);

    // Fill total row (row 10)
    const totalRow = worksheet.getRow(10);
    fillKomplikasiRow(totalRow, total, formatPercent);
    totalRow.commit();
};

const fillKomplikasiRow = (row, kelData, formatPercent) => {
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
};

module.exports = { fillKomplikasiWorksheet };
