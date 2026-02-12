/**
 * Excel Template Generator - Creates complete template with all placeholders
 * This generates a new Excel file with all required placeholders for IBundaCare reports
 */

const XlsxPopulate = require('xlsx-populate');
const path = require('path');

class ExcelTemplateGenerator {
  constructor() {
    this.outputPath = path.join(__dirname, 'template_laporan_complete.xlsx');
  }

  /**
   * Generate complete Excel template with all placeholders
   */
  async generateCompleteTemplate() {
    try {
      console.log('🏗️  Creating complete Excel template with all placeholders...');
      
      // Create new workbook
      const workbook = await XlsxPopulate.fromBlankAsync();
      
      // Create all required sheets first
      const sheet1 = workbook.addSheet('Data Pasien');
      const sheet2 = workbook.addSheet('ANC');
      const sheet3 = workbook.addSheet('ANC Terpadu');
      const sheet4 = workbook.addSheet('Persalinan Nifas');
      const sheet5 = workbook.addSheet('Komplikasi Kebidanan');
      
      // Remove default sheet after creating new ones
      workbook.deleteSheet('Sheet1');
      
      // Generate each sheet
      await this.generateSheet1_DataPasien(sheet1);
      await this.generateSheet2_ANC(sheet2);
      await this.generateSheet3_ANCTerpadu(sheet3);
      await this.generateSheet4_PersalinanNifas(sheet4);
      await this.generateSheet5_Komplikasi(sheet5);
      
      // Save the workbook
      await workbook.toFileAsync(this.outputPath);
      
      console.log(`✅ Complete template generated: ${this.outputPath}`);
      return {
        success: true,
        filePath: this.outputPath,
        message: 'Complete Excel template with all placeholders generated successfully'
      };
      
    } catch (error) {
      console.error('❌ Error generating template:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate complete Excel template'
      };
    }
  }

  /**
   * Generate Sheet 1 - Data Pasien (Patient Data)
   */
  async generateSheet1_DataPasien(sheet) {
    console.log('📄 Generating Sheet 1 - Data Pasien...');
    
    // Header information
    sheet.cell('A1').value('LAPORAN BULANAN KESEHATAN IBU DAN ANAK').style('bold', true);
    sheet.cell('C1').value(': {tanggal_laporan}');
    sheet.cell('A2').value('{nama_puskesmas}').style('bold', true);
    
    // Table headers (row 4)
    const headers = [
      'No.', 'Nama Pasien', 'NIK', 'Tanggal Lahir', 'Gol Darah', 'Nomor HP', 
      'Kelurahan', 'Posyandu', 'Nama Suami', 'Suami Perokok', 'Pendidikan', 
      'Pekerjaan', 'BMI', 'HPHT', 'GPA', 'TP'
    ];
    
    headers.forEach((header, index) => {
      sheet.cell(4, index + 1).value(header).style('bold', true);
    });
    
    // Sample data rows with placeholders (rows 5-10)
    for (let row = 5; row <= 10; row++) {
      const patientNum = row - 4;
      sheet.cell(row, 1).value(`{patient_${patientNum}_no}`);
      sheet.cell(row, 2).value(`{patient_${patientNum}_nama}`);
      sheet.cell(row, 3).value(`{patient_${patientNum}_nik}`);
      sheet.cell(row, 4).value(`{patient_${patientNum}_tanggal_lahir}`);
      sheet.cell(row, 5).value(`{patient_${patientNum}_gol_darah}`);
      sheet.cell(row, 6).value(`{patient_${patientNum}_no_hp}`);
      sheet.cell(row, 7).value(`{patient_${patientNum}_kelurahan}`);
      sheet.cell(row, 8).value(`{patient_${patientNum}_posyandu}`);
      sheet.cell(row, 9).value(`{patient_${patientNum}_nama_suami}`);
      sheet.cell(row, 10).value(`{patient_${patientNum}_suami_perokok}`);
      sheet.cell(row, 11).value(`{patient_${patientNum}_pendidikan}`);
      sheet.cell(row, 12).value(`{patient_${patientNum}_pekerjaan}`);
      sheet.cell(row, 13).value(`{patient_${patientNum}_bmi}`);
      sheet.cell(row, 14).value(`{patient_${patientNum}_hpht}`);
      sheet.cell(row, 15).value(`{patient_${patientNum}_gpa}`);
      sheet.cell(row, 16).value(`{patient_${patientNum}_tp}`);
    }
    
    // Auto-fit columns
    sheet.column('A').width(5);
    sheet.column('B').width(20);
    sheet.column('C').width(18);
    sheet.column('D').width(15);
    sheet.column('E').width(10);
    sheet.column('F').width(15);
    sheet.column('G').width(15);
    sheet.column('H').width(15);
    sheet.column('I').width(20);
    sheet.column('J').width(12);
    sheet.column('K').width(12);
    sheet.column('L').width(12);
    sheet.column('M').width(8);
    sheet.column('N').width(12);
    sheet.column('O').width(8);
    sheet.column('P').width(12);
  }

  /**
   * Generate Sheet 2 - ANC (Basic ANC Data)
   */
  async generateSheet2_ANC(sheet) {
    console.log('📄 Generating Sheet 2 - ANC...');
    
    // Header information
    sheet.cell('A1').value('LAPORAN ANC BULANAN').style('bold', true);
    sheet.cell('C1').value(': {tanggal_laporan}');
    sheet.cell('A2').value('{nama_puskesmas}').style('bold', true);
    
    // Column headers
    const headers = [
      'Kelurahan', 'Jumlah Bumil', 'Jumlah Bersalin', 'Jumlah Resti', 
      'Bumil Memiliki Buku KIA', '%', 'Bumil Dilayani Sesuai Standar 12 T', '%',
      'Bumil Dengan 4 Terlalu', '%', 'K1 Murni', '%', 'K1 Akses', '%',
      'K1 Dokter', '%', 'K1 USG', '%', 'K4', '%'
    ];
    
    headers.forEach((header, index) => {
      sheet.cell(6, index + 1).value(header).style('bold', true);
    });
    
    // Kelurahan data rows
    const kelurahanList = ['Simpang Pasir', 'Rawa Makmur', 'Handil Bakti', 'TOTAL'];
    const kelurahanKeys = ['simpangpasir', 'rawamakmur', 'handilbakti', 'total'];
    
    kelurahanList.forEach((kelurahan, index) => {
      const row = 7 + index;
      const key = kelurahanKeys[index];
      
      sheet.cell(row, 1).value(kelurahan);
      sheet.cell(row, 2).value(`{${key}_jumlahbumil}`);
      sheet.cell(row, 3).value(`{${key}_jumlahbersalin}`);
      sheet.cell(row, 4).value(`{${key}_jumlahresti}`);
      sheet.cell(row, 5).value(`{${key}_jumlah_milikibukukia}`);
      sheet.cell(row, 6).value(`{${key}_persen_milikibukukia}`);
      sheet.cell(row, 7).value(`{${key}_jumlah_standar12t}`);
      sheet.cell(row, 8).value(`{${key}_persen_standar12t}`);
      sheet.cell(row, 9).value(`{${key}_jumlah_4terlalu}`);
      sheet.cell(row, 10).value(`{${key}_persen_4terlalu}`);
      sheet.cell(row, 11).value(`{${key}_jumlah_k1murni}`);
      sheet.cell(row, 12).value(`{${key}_persen_k1murni}`);
      sheet.cell(row, 13).value(`{${key}_jumlah_k1akses}`);
      sheet.cell(row, 14).value(`{${key}_persen_k1akses}`);
      sheet.cell(row, 15).value(`{${key}_jumlah_k1dokter}`);
      sheet.cell(row, 16).value(`{${key}_persen_k1dokter}`);
      sheet.cell(row, 17).value(`{${key}_jumlah_k1usg}`);
      sheet.cell(row, 18).value(`{${key}_persen_k1usg}`);
      sheet.cell(row, 19).value(`{${key}_jumlah_k4}`);
      sheet.cell(row, 20).value(`{${key}_persen_k4}`);
    });
    
    // Auto-fit columns
    for (let col = 1; col <= 20; col++) {
      sheet.column(col).width(12);
    }
  }

  /**
   * Generate Sheet 3 - ANC Terpadu (Comprehensive ANC Data)
   */
  async generateSheet3_ANCTerpadu(sheet) {
    console.log('📄 Generating Sheet 3 - ANC Terpadu...');
    
    // Header information
    sheet.cell('A1').value('LAPORAN ANC TERPADU').style('bold', true);
    sheet.cell('C1').value(': {tanggal_laporan}');
    sheet.cell('A2').value('{nama_puskesmas}').style('bold', true);
    
    // Section 1: Hemoglobin Analysis by Trimester
    sheet.cell('A5').value('LAPORAN HEMOGLOBIN').style('bold', true);
    
    const hbHeaders = [
      'Kelurahan', 'TM1 Diperiksa', 'TM1 Anemia Berat', 'TM1 Anemia Sedang', 'TM1 Anemia Ringan', 'TM1 Jumlah Anemia',
      'TM2 Diperiksa', 'TM2 Anemia Berat', 'TM2 Anemia Sedang', 'TM2 Anemia Ringan', 'TM2 Jumlah Anemia',
      'TM3 Diperiksa', 'TM3 Anemia Berat', 'TM3 Anemia Sedang', 'TM3 Anemia Ringan', 'TM3 Jumlah Anemia'
    ];
    
    hbHeaders.forEach((header, index) => {
      sheet.cell(6, index + 1).value(header).style('bold', true);
    });
    
    const kelurahanKeys = ['simpangpasir', 'rawamakmur', 'handilbakti', 'total'];
    const kelurahanNames = ['Simpang Pasir', 'Rawa Makmur', 'Handil Bakti', 'TOTAL'];
    
    kelurahanKeys.forEach((key, index) => {
      const row = 7 + index;
      sheet.cell(row, 1).value(kelurahanNames[index]);
      
      // TM1 data
      sheet.cell(row, 2).value(`{${key}_tm1_diperiksa}`);
      sheet.cell(row, 3).value(`{${key}_tm1_anemia_berat}`);
      sheet.cell(row, 4).value(`{${key}_tm1_anemia_sedang}`);
      sheet.cell(row, 5).value(`{${key}_tm1_anemia_ringan}`);
      sheet.cell(row, 6).value(`{${key}_tm1_jumlah_anemia}`);
      
      // TM2 data
      sheet.cell(row, 7).value(`{${key}_tm2_diperiksa}`);
      sheet.cell(row, 8).value(`{${key}_tm2_anemia_berat}`);
      sheet.cell(row, 9).value(`{${key}_tm2_anemia_sedang}`);
      sheet.cell(row, 10).value(`{${key}_tm2_anemia_ringan}`);
      sheet.cell(row, 11).value(`{${key}_tm2_jumlah_anemia}`);
      
      // TM3 data
      sheet.cell(row, 12).value(`{${key}_tm3_diperiksa}`);
      sheet.cell(row, 13).value(`{${key}_tm3_anemia_berat}`);
      sheet.cell(row, 14).value(`{${key}_tm3_anemia_sedang}`);
      sheet.cell(row, 15).value(`{${key}_tm3_anemia_ringan}`);
      sheet.cell(row, 16).value(`{${key}_tm3_jumlah_anemia}`);
    });
    
    // Section 2: KEK Analysis
    sheet.cell('A12').value('LAPORAN KEKURANGAN ENERGI KRONIK (KEK)').style('bold', true);
    
    const kekHeaders = ['Kelurahan', 'LILA Diperiksa', 'KEK (LILA < 23.5)', 'KEK Mendapat Gizi'];
    kekHeaders.forEach((header, index) => {
      sheet.cell(13, index + 1).value(header).style('bold', true);
    });
    
    kelurahanKeys.forEach((key, index) => {
      const row = 14 + index;
      sheet.cell(row, 1).value(kelurahanNames[index]);
      sheet.cell(row, 2).value(`{${key}_lila_diperiksa}`);
      sheet.cell(row, 3).value(`{${key}_kek_count}`);
      sheet.cell(row, 4).value(`{${key}_kek_mendapat_gizi}`);
    });
    
    // Section 3: BMI Analysis by Trimester
    sheet.cell('A19').value('LAPORAN BMI').style('bold', true);
    
    const bmiHeaders = [
      'Kelurahan', 'TM1 BMI Diperiksa', 'TM1 Kurus', 'TM1 Normal', 'TM1 Gemuk', 'TM1 Obesitas',
      'TM2 BMI Diperiksa', 'TM2 Kurus', 'TM2 Normal', 'TM2 Gemuk', 'TM2 Obesitas',
      'TM3 BMI Diperiksa', 'TM3 Kurus', 'TM3 Normal', 'TM3 Gemuk', 'TM3 Obesitas'
    ];
    
    bmiHeaders.forEach((header, index) => {
      sheet.cell(20, index + 1).value(header).style('bold', true);
    });
    
    kelurahanKeys.forEach((key, index) => {
      const row = 21 + index;
      sheet.cell(row, 1).value(kelurahanNames[index]);
      
      // TM1 BMI
      sheet.cell(row, 2).value(`{${key}_tm1_bmi_diperiksa}`);
      sheet.cell(row, 3).value(`{${key}_tm1_bmi_kurus}`);
      sheet.cell(row, 4).value(`{${key}_tm1_bmi_normal}`);
      sheet.cell(row, 5).value(`{${key}_tm1_bmi_gemuk}`);
      sheet.cell(row, 6).value(`{${key}_tm1_bmi_obesitas}`);
      
      // TM2 BMI
      sheet.cell(row, 7).value(`{${key}_tm2_bmi_diperiksa}`);
      sheet.cell(row, 8).value(`{${key}_tm2_bmi_kurus}`);
      sheet.cell(row, 9).value(`{${key}_tm2_bmi_normal}`);
      sheet.cell(row, 10).value(`{${key}_tm2_bmi_gemuk}`);
      sheet.cell(row, 11).value(`{${key}_tm2_bmi_obesitas}`);
      
      // TM3 BMI
      sheet.cell(row, 12).value(`{${key}_tm3_bmi_diperiksa}`);
      sheet.cell(row, 13).value(`{${key}_tm3_bmi_kurus}`);
      sheet.cell(row, 14).value(`{${key}_tm3_bmi_normal}`);
      sheet.cell(row, 15).value(`{${key}_tm3_bmi_gemuk}`);
      sheet.cell(row, 16).value(`{${key}_tm3_bmi_obesitas}`);
    });
    
    // Section 4: Screening Tests
    sheet.cell('A26').value('LAPORAN SCREENING TESTS').style('bold', true);
    
    const screeningHeaders = [
      'Kelurahan', 'Protein Urine Diperiksa', 'Protein +1', 'Protein +2', 'Protein +3', 'Protein +4',
      'Gula Darah Diperiksa', 'GD Normal', 'GD Sedang', 'GD Tinggi',
      'HIV Diperiksa', 'HIV Positif', 'HIV Dapat ART',
      'Malaria Diperiksa', 'Malaria Positif', 'Malaria Kelambu',
      'Kecacingan Diperiksa', 'Kecacingan Positif', 'Kecacingan Terapi',
      'Sifilis Diperiksa', 'Sifilis Positif',
      'Hepatitis Diperiksa', 'Hepatitis Positif'
    ];
    
    screeningHeaders.forEach((header, index) => {
      sheet.cell(27, index + 1).value(header).style('bold', true);
    });
    
    kelurahanKeys.forEach((key, index) => {
      const row = 28 + index;
      sheet.cell(row, 1).value(kelurahanNames[index]);
      
      let col = 2;
      // Protein Urine
      sheet.cell(row, col++).value(`{${key}_protein_urine_diperiksa}`);
      sheet.cell(row, col++).value(`{${key}_protein_urine_plus1}`);
      sheet.cell(row, col++).value(`{${key}_protein_urine_plus2}`);
      sheet.cell(row, col++).value(`{${key}_protein_urine_plus3}`);
      sheet.cell(row, col++).value(`{${key}_protein_urine_plus4}`);
      
      // Gula Darah
      sheet.cell(row, col++).value(`{${key}_gula_darah_diperiksa}`);
      sheet.cell(row, col++).value(`{${key}_gula_darah_normal}`);
      sheet.cell(row, col++).value(`{${key}_gula_darah_sedang}`);
      sheet.cell(row, col++).value(`{${key}_gula_darah_tinggi}`);
      
      // HIV
      sheet.cell(row, col++).value(`{${key}_hiv_diperiksa}`);
      sheet.cell(row, col++).value(`{${key}_hiv_positif}`);
      sheet.cell(row, col++).value(`{${key}_hiv_dapat_art}`);
      
      // Malaria
      sheet.cell(row, col++).value(`{${key}_malaria_diperiksa}`);
      sheet.cell(row, col++).value(`{${key}_malaria_positif}`);
      sheet.cell(row, col++).value(`{${key}_malaria_kelambu}`);
      
      // Kecacingan
      sheet.cell(row, col++).value(`{${key}_kecacingan_diperiksa}`);
      sheet.cell(row, col++).value(`{${key}_kecacingan_positif}`);
      sheet.cell(row, col++).value(`{${key}_kecacingan_terapi}`);
      
      // Sifilis
      sheet.cell(row, col++).value(`{${key}_sifilis_diperiksa}`);
      sheet.cell(row, col++).value(`{${key}_sifilis_positif}`);
      
      // Hepatitis
      sheet.cell(row, col++).value(`{${key}_hepatitis_diperiksa}`);
      sheet.cell(row, col++).value(`{${key}_hepatitis_positif}`);
    });
    
    // Auto-fit columns
    for (let col = 1; col <= 25; col++) {
      sheet.column(col).width(10);
    }
  }

  /**
   * Generate Sheet 4 - Persalinan Nifas
   */
  async generateSheet4_PersalinanNifas(sheet) {
    console.log('📄 Generating Sheet 4 - Persalinan Nifas...');
    
    // Header information
    sheet.cell('A1').value('LAPORAN PERSALINAN DAN NIFAS').style('bold', true);
    sheet.cell('C1').value(': {tanggal_laporan}');
    sheet.cell('A2').value('{nama_puskesmas}').style('bold', true);
    
    // Persalinan section
    sheet.cell('A5').value('LAPORAN PERSALINAN').style('bold', true);
    
    const persalinanHeaders = [
      'Kelurahan', 'Persalinan Nakes', '%', 'Persalinan Non-Nakes', '%',
      'Persalinan Fasyankes', '%', 'Persalinan Non-Fasyankes', '%'
    ];
    
    persalinanHeaders.forEach((header, index) => {
      sheet.cell(6, index + 1).value(header).style('bold', true);
    });
    
    const kelurahanKeys = ['simpangpasir', 'rawamakmur', 'handilbakti', 'total'];
    const kelurahanNames = ['Simpang Pasir', 'Rawa Makmur', 'Handil Bakti', 'TOTAL'];
    
    kelurahanKeys.forEach((key, index) => {
      const row = 7 + index;
      sheet.cell(row, 1).value(kelurahanNames[index]);
      sheet.cell(row, 2).value(`{${key}_persalinan_nakes}`);
      sheet.cell(row, 3).value(`{${key}_persen_persalinan_nakes}`);
      sheet.cell(row, 4).value(`{${key}_persalinan_non_nakes}`);
      sheet.cell(row, 5).value(`{${key}_persen_persalinan_non_nakes}`);
      sheet.cell(row, 6).value(`{${key}_persalinan_fasyankes}`);
      sheet.cell(row, 7).value(`{${key}_persen_persalinan_fasyankes}`);
      sheet.cell(row, 8).value(`{${key}_persalinan_non_fasyankes}`);
      sheet.cell(row, 9).value(`{${key}_persen_persalinan_non_fasyankes}`);
    });
    
    // Nifas section
    sheet.cell('A12').value('LAPORAN PELAYANAN NIFAS').style('bold', true);
    
    const nifasHeaders = [
      'Kelurahan', 'KF1', '%', 'KF2', '%', 'KF3', '%', 'KF4', '%', 'ASI Eksklusif', '%'
    ];
    
    nifasHeaders.forEach((header, index) => {
      sheet.cell(13, index + 1).value(header).style('bold', true);
    });
    
    kelurahanKeys.forEach((key, index) => {
      const row = 14 + index;
      sheet.cell(row, 1).value(kelurahanNames[index]);
      sheet.cell(row, 2).value(`{${key}_kf1}`);
      sheet.cell(row, 3).value(`{${key}_persen_kf1}`);
      sheet.cell(row, 4).value(`{${key}_kf2}`);
      sheet.cell(row, 5).value(`{${key}_persen_kf2}`);
      sheet.cell(row, 6).value(`{${key}_kf3}`);
      sheet.cell(row, 7).value(`{${key}_persen_kf3}`);
      sheet.cell(row, 8).value(`{${key}_kf4}`);
      sheet.cell(row, 9).value(`{${key}_persen_kf4}`);
      sheet.cell(row, 10).value(`{${key}_asi_eksklusif}`);
      sheet.cell(row, 11).value(`{${key}_persen_asi_eksklusif}`);
    });
    
    // Auto-fit columns
    for (let col = 1; col <= 11; col++) {
      sheet.column(col).width(12);
    }
  }

  /**
   * Generate Sheet 5 - Komplikasi Kebidanan
   */
  async generateSheet5_Komplikasi(sheet) {
    console.log('📄 Generating Sheet 5 - Komplikasi Kebidanan...');
    
    // Header information
    sheet.cell('A1').value('LAPORAN KOMPLIKASI KEBIDANAN').style('bold', true);
    sheet.cell('C1').value(': {tanggal_laporan}');
    sheet.cell('A2').value('{nama_puskesmas}').style('bold', true);
    
    const komplikasiTypes = [
      'anemia', 'kek', 'preeklamsia', 'infeksi', 'tuberculosis', 
      'malaria', 'hiv', 'jantung', 'diabetes', 'obesitas', 
      'covid19', 'keguguran', 'total_komplikasi', 'total_rujuk'
    ];
    
    const komplikasiLabels = [
      'Anemia', 'KEK', 'Preeklamsia/Eklamsia', 'Infeksi', 'Tuberculosis',
      'Malaria', 'HIV', 'Jantung', 'Diabetes Melitus', 'Obesitas',
      'Covid-19', 'Keguguran', 'Total Komplikasi', 'Total Rujuk RS'
    ];
    
    const timings = [
      { key: 'hamil', label: 'KOMPLIKASI SAAT HAMIL', startRow: 5 },
      { key: 'bersalin', label: 'KOMPLIKASI SAAT BERSALIN', startRow: 15 },
      { key: 'nifas', label: 'KOMPLIKASI SAAT NIFAS', startRow: 25 }
    ];
    
    const kelurahanKeys = ['simpangpasir', 'rawamakmur', 'handilbakti', 'total'];
    const kelurahanNames = ['Simpang Pasir', 'Rawa Makmur', 'Handil Bakti', 'TOTAL'];
    
    timings.forEach(timing => {
      // Section header
      sheet.cell(timing.startRow, 1).value(timing.label).style('bold', true);
      
      // Column headers
      sheet.cell(timing.startRow + 1, 1).value('Kelurahan').style('bold', true);
      komplikasiLabels.forEach((label, index) => {
        sheet.cell(timing.startRow + 1, index + 2).value(label).style('bold', true);
        sheet.cell(timing.startRow + 1, index + 16).value('%').style('bold', true);
      });
      
      // Data rows
      kelurahanKeys.forEach((key, index) => {
        const row = timing.startRow + 2 + index;
        sheet.cell(row, 1).value(kelurahanNames[index]);
        
        komplikasiTypes.forEach((type, typeIndex) => {
          // Jumlah
          sheet.cell(row, typeIndex + 2).value(`{${key}_${timing.key}_${type}}`);
          // Persen
          sheet.cell(row, typeIndex + 16).value(`{${key}_${timing.key}_persen_${type}}`);
        });
      });
    });
    
    // Auto-fit columns
    for (let col = 1; col <= 30; col++) {
      sheet.column(col).width(10);
    }
  }
}

// Export for use in other files
module.exports = ExcelTemplateGenerator;

// Run if called directly
if (require.main === module) {
  const generator = new ExcelTemplateGenerator();
  
  generator.generateCompleteTemplate()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Complete Excel template generated successfully!');
        console.log(`📁 File: ${result.filePath}`);
        console.log('\n💡 Next steps:');
        console.log('1. Test the new template with the Excel generator');
        console.log('2. Verify all placeholders are properly filled');
        console.log('3. Update the main generator to use this template');
        process.exit(0);
      } else {
        console.log('\n💥 Template generation failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Error:', error);
      process.exit(1);
    });
}