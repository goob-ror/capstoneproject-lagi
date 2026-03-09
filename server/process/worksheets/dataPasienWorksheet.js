// Data Pasien Worksheet Filler
const fillDataPasienWorksheet = async (workbook, data, tanggal_laporan, nama_puskesmas) => {
    const worksheet = workbook.getWorksheet('Data Pasien');
    if (!worksheet) return;

    // Fill header data
    worksheet.getCell('C1').value = tanggal_laporan;
    worksheet.getCell('A2').value = nama_puskesmas;

    // Fill patient data starting from row 5
    if (data && data.data && data.data.length > 0) {
        let rowIndex = 5;
        data.data.forEach((patient, index) => {
            const row = worksheet.getRow(rowIndex);
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
            rowIndex++;
        });
    }
};

module.exports = { fillDataPasienWorksheet };
