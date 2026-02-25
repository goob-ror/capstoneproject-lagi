const { getCellText, replacePlaceholders, formatDate } = require('./helpers');

async function populateDataPasien(workbook, pool, filters) {
  const worksheet = workbook.getWorksheet('Data Pasien');
  if (!worksheet) {
    console.log('Data Pasien worksheet not found');
    return;
  }

  // Build filter query
  const kelurahanFilter = filters.kelurahan ? 'AND kel.nama_kelurahan = ?' : '';
  const kelurahanParams = filters.kelurahan ? [filters.kelurahan] : [];

  // Fetch patient data
  const patientQuery = `
    SELECT 
      i.id,
      i.nama_lengkap,
      i.nik_ibu as nik,
      i.tanggal_lahir,
      i.gol_darah as golongan_darah,
      i.no_hp as nomor_hp,
      kel.nama_kelurahan as kelurahan,
      pos.nama_posyandu as posyandu,
      s.nama_lengkap as nama_suami,
      CASE WHEN s.isPerokok = 1 THEN 'Ya' ELSE 'Tidak' END as suami_perokok,
      i.pendidikan,
      i.pekerjaan,
      CASE 
        WHEN i.beratbadan IS NOT NULL AND i.tinggi_badan IS NOT NULL 
        THEN ROUND(i.beratbadan / POWER(i.tinggi_badan / 100, 2), 1)
        ELSE NULL
      END as bmi,
      k.haid_terakhir as hpht,
      CONCAT('G', k.gravida, 'P', k.partus, 'A', k.abortus) as gpa,
      DATE_ADD(k.haid_terakhir, INTERVAL 280 DAY) as tp
    FROM ibu i
    LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
    LEFT JOIN wilker_posyandu pos ON i.posyandu_id = pos.id
    LEFT JOIN suami s ON s.forkey_ibu = i.id
    LEFT JOIN kehamilan k ON k.forkey_ibu = i.id AND k.status_kehamilan = 'Hamil'
    WHERE 1=1 ${kelurahanFilter}
    ORDER BY i.id
  `;
  
  const [patients] = await pool.query(patientQuery, kelurahanParams);

  if (patients.length === 0) {
    console.log('No patient data found');
    return;
  }

  // Find template row
  let templateRowNumber = null;
  worksheet.eachRow((row, rowNumber) => {
    if (templateRowNumber) return;
    row.eachCell((cell) => {
      const cellText = getCellText(cell);
      if (cellText.includes('{datapasien_')) {
        templateRowNumber = rowNumber;
        return false;
      }
    });
  });

  if (!templateRowNumber) {
    console.log('Template row not found in Data Pasien sheet');
    return;
  }

  // Store template structure
  const templateRow = worksheet.getRow(templateRowNumber);
  const templateStructure = [];
  
  templateRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    templateStructure.push({
      colNumber,
      value: cell.value,
      style: {
        font: cell.font ? { ...cell.font } : undefined,
        alignment: cell.alignment ? { ...cell.alignment } : undefined,
        border: cell.border ? { ...cell.border } : undefined,
        fill: cell.fill ? { ...cell.fill } : undefined,
        numFmt: cell.numFmt
      }
    });
  });

  // Insert additional rows
  for (let i = 1; i < patients.length; i++) {
    worksheet.insertRow(templateRowNumber + i, []);
  }

  // Fill each row with patient data
  patients.forEach((patient, index) => {
    const currentRowNumber = templateRowNumber + index;
    const currentRow = worksheet.getRow(currentRowNumber);
    
    const data = {
      datapasien_no: index + 1,
      datapasien_namapasien: patient.nama_lengkap || '',
      datapasien_nik: patient.nik || '',
      datapasien_tanggallahir: patient.tanggal_lahir ? formatDate(patient.tanggal_lahir) : '',
      datapasien_goldarah: patient.golongan_darah || '',
      datapasien_nomorhp: patient.nomor_hp || '',
      datapasien_kelurahan: patient.kelurahan || '',
      datapasien_posyandu: patient.posyandu || '',
      datapasien_namasuami: patient.nama_suami || '',
      datapasien_suamiperokok: patient.suami_perokok || '',
      datapasien_pendidikan: patient.pendidikan || '',
      datapasien_pekerjaan: patient.pekerjaan || '',
      datapasien_bmi: patient.bmi || '',
      datapasien_hpht: patient.hpht ? formatDate(patient.hpht) : '',
      datapasien_gpa: patient.gpa || '',
      datapasien_tp: patient.tp ? formatDate(patient.tp) : ''
    };

    templateStructure.forEach(template => {
      const cell = currentRow.getCell(template.colNumber);
      let cellValue = template.value;
      
      if (typeof cellValue === 'string') {
        cellValue = replacePlaceholders(cellValue, data);
      }
      
      cell.value = cellValue;
      if (template.style.font) cell.font = template.style.font;
      if (template.style.alignment) cell.alignment = template.style.alignment;
      if (template.style.border) cell.border = template.style.border;
      if (template.style.fill) cell.fill = template.style.fill;
      if (template.style.numFmt) cell.numFmt = template.style.numFmt;
    });
  });

  console.log(`Populated ${patients.length} patient records`);
}

module.exports = { populateDataPasien };
