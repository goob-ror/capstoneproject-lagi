// Data Pasien Worksheet Filler
const fillDataPasienWorksheet = async (workbook, data, tanggal_laporan, nama_puskesmas) => {
    const worksheet = workbook.getWorksheet('Data Pasien');
    if (!worksheet) return;

    // Fill header data
    worksheet.getCell('C1').value = tanggal_laporan;
    worksheet.getCell('A2').value = nama_puskesmas;

    // Fill patient data starting from row 5
    if (data && data.data && data.data.length > 0) {
        const templateRowIndex = 5; // Row 5 is the template row with styling
        const templateRow = worksheet.getRow(templateRowIndex);
        
        // Store template row styling
        const templateStyles = [];
        for (let col = 1; col <= 16; col++) {
            const cell = templateRow.getCell(col);
            templateStyles[col] = {
                font: cell.font ? { ...cell.font } : undefined,
                alignment: cell.alignment ? { ...cell.alignment } : undefined,
                border: cell.border ? { ...cell.border } : undefined,
                fill: cell.fill ? { ...cell.fill } : undefined,
                numFmt: cell.numFmt
            };
        }

        data.data.forEach((patient, index) => {
            const rowIndex = templateRowIndex + index;
            const row = worksheet.getRow(rowIndex);
            
            // Copy styling from template to each cell
            for (let col = 1; col <= 16; col++) {
                const cell = row.getCell(col);
                const style = templateStyles[col];
                
                if (style.font) cell.font = style.font;
                if (style.alignment) cell.alignment = style.alignment;
                if (style.border) cell.border = style.border;
                if (style.fill) cell.fill = style.fill;
                if (style.numFmt) cell.numFmt = style.numFmt;
            }

            // Fill data
            row.getCell(1).value = index + 1; // No
            row.getCell(2).value = patient.datapasien_namapasien || '';
            row.getCell(3).value = patient.datapasien_nik || '';
            row.getCell(4).value = patient.datapasien_tanggallahir || '';
            row.getCell(5).value = patient.datapasien_goldarah || '';
            row.getCell(6).value = patient.datapasien_nomorhp || '';
            row.getCell(7).value = patient.datapasien_kelurahan || '';
            row.getCell(8).value = patient.datapasien_posyandu || '';
            row.getCell(9).value = patient.datapasien_namasuami || '';
            row.getCell(10).value = patient.datapasien_suamiperokok || '';
            row.getCell(11).value = patient.datapasien_pendidikan || '';
            row.getCell(12).value = patient.datapasien_pekerjaan || '';
            row.getCell(13).value = patient.datapasien_bmi || '';
            row.getCell(14).value = patient.datapasien_hpht || '';
            row.getCell(15).value = patient.datapasien_gpa || '';
            row.getCell(16).value = patient.datapasien_tp || '';
            
            row.commit();
        });
    }
};

module.exports = { fillDataPasienWorksheet };
