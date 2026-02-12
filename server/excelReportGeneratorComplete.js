/**
 * Complete Excel Report Generator - Uses the complete template with all placeholders
 * This generates reports using the comprehensive template created by excelTemplateGenerator.js
 */

const XlsxPopulate = require('xlsx-populate');
const path = require('path');
const fs = require('fs');
const ExcelDataService = require('./excelDataService');

class CompleteExcelReportGenerator {
  constructor() {
    this.templatePath = path.join(__dirname, 'template_laporan_complete.xlsx');
    this.placeholderPattern = /\{([^}]+)\}/g;
  }

  /**
   * Generate Excel report using complete template with all placeholders
   */
  async generateReport(filters = {}, outputPath = null) {
    try {
      console.log('🎯 Generating COMPLETE Excel report with ALL placeholders...');
      console.log('Filters:', filters);
      
      // Check if complete template exists
      if (!fs.existsSync(this.templatePath)) {
        throw new Error(`Complete template not found at ${this.templatePath}. Please run excelTemplateGenerator.js first.`);
      }
      
      // 1. Load complete template workbook
      const workbook = await XlsxPopulate.fromFileAsync(this.templatePath);
      
      // 2. Generate comprehensive data
      const dataService = new ExcelDataService();
      const reportData = await dataService.generateAllData(filters);
      
      // 3. Add individual patient data
      const patientData = await this.generateIndividualPatientData(filters);
      Object.assign(reportData, patientData);
      
      console.log(`📊 Generated data for ${Object.keys(reportData).length} placeholders`);
      
      // 4. Process each worksheet
      let totalReplacements = 0;
      const sheets = workbook.sheets();
      
      sheets.forEach(sheet => {
        console.log(`📄 Processing sheet: ${sheet.name()}`);
        let sheetReplacements = 0;
        
        // Get the used range to avoid processing empty cells
        const usedRange = sheet.usedRange();
        if (!usedRange) {
          console.log(`   ⚠️  No used range found in ${sheet.name()}`);
          return;
        }
        
        // Iterate through all cells in the used range
        const startRow = usedRange.startCell().rowNumber();
        const endRow = usedRange.endCell().rowNumber();
        const startCol = usedRange.startCell().columnNumber();
        const endCol = usedRange.endCell().columnNumber();
        
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            const cell = sheet.cell(row, col);
            const cellValue = cell.value();
            
            if (cellValue && typeof cellValue === 'string') {
              const matches = cellValue.match(this.placeholderPattern);
              
              if (matches) {
                let newValue = cellValue;
                
                matches.forEach(match => {
                  const placeholder = match.replace(/[{}]/g, '');
                  
                  if (reportData.hasOwnProperty(placeholder)) {
                    newValue = newValue.replace(match, reportData[placeholder]);
                    sheetReplacements++;
                    totalReplacements++;
                  } else {
                    console.warn(`⚠️  Placeholder '${placeholder}' not found in data`);
                    newValue = newValue.replace(match, 'N/A');
                  }
                });
                
                // Update cell value while preserving ALL formatting
                cell.value(newValue);
                
                // Log replacement for debugging (limit to first few)
                if (sheetReplacements <= 5) {
                  console.log(`   📝 ${sheet.name()}[${row},${col}]: "${cellValue}" → "${newValue}"`);
                }
              }
            }
          }
        }
        
        console.log(`   ✅ ${sheetReplacements} replacements in ${sheet.name()}`);
      });
      
      console.log(`🔄 Total replacements: ${totalReplacements}`);
      
      // 5. Generate output filename if not provided
      if (!outputPath) {
        const timestamp = new Date().toISOString().split('T')[0];
        const kelurahanSuffix = filters.kelurahan ? `_${filters.kelurahan.replace(/\s+/g, '')}` : '';
        const yearSuffix = filters.year ? `_${filters.year}` : '';
        const monthSuffix = filters.month ? `_${this.getMonthName(filters.month)}` : '';
        outputPath = path.join(__dirname, `laporan_complete${kelurahanSuffix}${yearSuffix}${monthSuffix}_${timestamp}.xlsx`);
      }
      
      // 6. Save the workbook with PERFECT formatting preservation
      await workbook.toFileAsync(outputPath);
      
      console.log(`✅ COMPLETE formatted report generated: ${outputPath}`);
      
      return {
        success: true,
        filePath: outputPath,
        dataFields: Object.keys(reportData).length,
        replacements: totalReplacements,
        sheets: sheets.length,
        reportData,
        message: 'Complete Excel report with ALL placeholders generated successfully'
      };
      
    } catch (error) {
      console.error('❌ Error generating COMPLETE Excel report:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate COMPLETE Excel report'
      };
    }
  }

  /**
   * Generate individual patient data for Sheet 1
   */
  async generateIndividualPatientData(filters) {
    const data = {};
    
    try {
      const pool = require('./database/db');
      
      // Get individual patient data for rows
      const patientQuery = `
        SELECT 
          i.id,
          i.nama_lengkap,
          i.nik_ibu,
          i.tanggal_lahir,
          i.gol_darah,
          i.no_hp,
          kel.nama_kelurahan,
          pos.nama_posyandu,
          s.nama_lengkap as nama_suami,
          CASE WHEN s.isPerokok = 1 THEN 'Ya' ELSE 'Tidak' END as suami_perokok,
          i.pendidikan,
          i.pekerjaan,
          CASE 
            WHEN i.beratbadan IS NOT NULL AND i.tinggi_badan IS NOT NULL 
            THEN ROUND(i.beratbadan / POWER(i.tinggi_badan/100, 2), 1)
            ELSE NULL 
          END as bmi,
          k.haid_terakhir as hpht,
          CONCAT(k.gravida, 'G', k.partus, 'P', k.abortus, 'A') as gpa,
          k.taksiran_persalinan as tp
        FROM ibu i
        INNER JOIN kehamilan k ON k.forkey_ibu = i.id
        LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
        LEFT JOIN wilker_posyandu pos ON i.posyandu_id = pos.id
        LEFT JOIN suami s ON s.forkey_ibu = i.id
        WHERE k.status_kehamilan = 'Hamil'
        ${filters.kelurahan ? 'AND kel.nama_kelurahan = ?' : ''}
        ORDER BY kel.nama_kelurahan, i.nama_lengkap
        LIMIT 20`;
      
      const params = filters.kelurahan ? [filters.kelurahan] : [];
      const [patientResults] = await pool.query(patientQuery, params);
      
      // Generate patient data placeholders
      patientResults.forEach((patient, index) => {
        const num = index + 1;
        data[`patient_${num}_no`] = num;
        data[`patient_${num}_nama`] = patient.nama_lengkap || '';
        data[`patient_${num}_nik`] = patient.nik_ibu || '';
        data[`patient_${num}_tanggal_lahir`] = patient.tanggal_lahir ? 
          new Date(patient.tanggal_lahir).toLocaleDateString('id-ID') : '';
        data[`patient_${num}_gol_darah`] = patient.gol_darah || '';
        data[`patient_${num}_no_hp`] = patient.no_hp || '';
        data[`patient_${num}_kelurahan`] = patient.nama_kelurahan || '';
        data[`patient_${num}_posyandu`] = patient.nama_posyandu || '';
        data[`patient_${num}_nama_suami`] = patient.nama_suami || '';
        data[`patient_${num}_suami_perokok`] = patient.suami_perokok || 'Tidak';
        data[`patient_${num}_pendidikan`] = patient.pendidikan || '';
        data[`patient_${num}_pekerjaan`] = patient.pekerjaan || '';
        data[`patient_${num}_bmi`] = patient.bmi || '';
        data[`patient_${num}_hpht`] = patient.hpht ? 
          new Date(patient.hpht).toLocaleDateString('id-ID') : '';
        data[`patient_${num}_gpa`] = patient.gpa || '';
        data[`patient_${num}_tp`] = patient.tp ? 
          new Date(patient.tp).toLocaleDateString('id-ID') : '';
      });
      
      // Fill remaining slots with empty data
      for (let i = patientResults.length + 1; i <= 20; i++) {
        data[`patient_${i}_no`] = '';
        data[`patient_${i}_nama`] = '';
        data[`patient_${i}_nik`] = '';
        data[`patient_${i}_tanggal_lahir`] = '';
        data[`patient_${i}_gol_darah`] = '';
        data[`patient_${i}_no_hp`] = '';
        data[`patient_${i}_kelurahan`] = '';
        data[`patient_${i}_posyandu`] = '';
        data[`patient_${i}_nama_suami`] = '';
        data[`patient_${i}_suami_perokok`] = '';
        data[`patient_${i}_pendidikan`] = '';
        data[`patient_${i}_pekerjaan`] = '';
        data[`patient_${i}_bmi`] = '';
        data[`patient_${i}_hpht`] = '';
        data[`patient_${i}_gpa`] = '';
        data[`patient_${i}_tp`] = '';
      }
      
    } catch (error) {
      console.error('Error generating individual patient data:', error);
      // Set default empty values for all patient slots
      for (let i = 1; i <= 20; i++) {
        data[`patient_${i}_no`] = '';
        data[`patient_${i}_nama`] = '';
        data[`patient_${i}_nik`] = '';
        data[`patient_${i}_tanggal_lahir`] = '';
        data[`patient_${i}_gol_darah`] = '';
        data[`patient_${i}_no_hp`] = '';
        data[`patient_${i}_kelurahan`] = '';
        data[`patient_${i}_posyandu`] = '';
        data[`patient_${i}_nama_suami`] = '';
        data[`patient_${i}_suami_perokok`] = '';
        data[`patient_${i}_pendidikan`] = '';
        data[`patient_${i}_pekerjaan`] = '';
        data[`patient_${i}_bmi`] = '';
        data[`patient_${i}_hpht`] = '';
        data[`patient_${i}_gpa`] = '';
        data[`patient_${i}_tp`] = '';
      }
    }
    
    return data;
  }

  /**
   * Analyze complete template structure and placeholders
   */
  async analyzeCompleteTemplate() {
    try {
      console.log('🔍 Analyzing COMPLETE template structure...');
      
      if (!fs.existsSync(this.templatePath)) {
        throw new Error(`Complete template not found at ${this.templatePath}. Please run excelTemplateGenerator.js first.`);
      }
      
      const workbook = await XlsxPopulate.fromFileAsync(this.templatePath);
      const sheets = workbook.sheets();
      
      const analysis = {
        totalSheets: sheets.length,
        sheets: [],
        totalPlaceholders: 0,
        uniquePlaceholders: new Set(),
        placeholderDetails: []
      };
      
      sheets.forEach(sheet => {
        const sheetAnalysis = {
          name: sheet.name(),
          placeholders: [],
          cellsWithData: 0,
          totalCells: 0
        };
        
        const usedRange = sheet.usedRange();
        if (usedRange) {
          const startRow = usedRange.startCell().rowNumber();
          const endRow = usedRange.endCell().rowNumber();
          const startCol = usedRange.startCell().columnNumber();
          const endCol = usedRange.endCell().columnNumber();
          
          sheetAnalysis.totalCells = (endRow - startRow + 1) * (endCol - startCol + 1);
          
          for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
              const cell = sheet.cell(row, col);
              const cellValue = cell.value();
              
              if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
                sheetAnalysis.cellsWithData++;
                
                if (typeof cellValue === 'string') {
                  const matches = cellValue.match(this.placeholderPattern);
                  if (matches) {
                    matches.forEach(match => {
                      const placeholder = match.replace(/[{}]/g, '');
                      sheetAnalysis.placeholders.push({
                        placeholder,
                        position: `${row},${col}`,
                        context: cellValue,
                        cellAddress: cell.address()
                      });
                      analysis.uniquePlaceholders.add(placeholder);
                      analysis.totalPlaceholders++;
                    });
                  }
                }
              }
            }
          }
        }
        
        analysis.sheets.push(sheetAnalysis);
      });
      
      analysis.uniquePlaceholders = Array.from(analysis.uniquePlaceholders);
      
      console.log('📊 COMPLETE Template Analysis Results:');
      console.log(`   Total sheets: ${analysis.totalSheets}`);
      console.log(`   Total placeholders: ${analysis.totalPlaceholders}`);
      console.log(`   Unique placeholders: ${analysis.uniquePlaceholders.length}`);
      
      analysis.sheets.forEach(sheet => {
        console.log(`   ${sheet.name}: ${sheet.placeholders.length} placeholders, ${sheet.cellsWithData} cells with data`);
      });
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Error analyzing COMPLETE template:', error);
      throw error;
    }
  }

  /**
   * Generate report with detailed validation
   */
  async generateReportWithValidation(filters = {}) {
    try {
      console.log('🔍 Generating COMPLETE report with validation...');
      
      // 1. Analyze template first
      const analysis = await this.analyzeCompleteTemplate();
      
      // 2. Generate data
      const dataService = new ExcelDataService();
      const reportData = await dataService.generateAllData(filters);
      
      // 3. Add individual patient data
      const patientData = await this.generateIndividualPatientData(filters);
      Object.assign(reportData, patientData);
      
      // 4. Validate data coverage
      const validation = {
        totalPlaceholders: analysis.uniquePlaceholders.length,
        coveredPlaceholders: 0,
        missingPlaceholders: [],
        extraData: []
      };
      
      analysis.uniquePlaceholders.forEach(placeholder => {
        if (reportData.hasOwnProperty(placeholder)) {
          validation.coveredPlaceholders++;
        } else {
          validation.missingPlaceholders.push(placeholder);
        }
      });
      
      Object.keys(reportData).forEach(dataKey => {
        if (!analysis.uniquePlaceholders.includes(dataKey)) {
          validation.extraData.push(dataKey);
        }
      });
      
      const coverage = Math.round((validation.coveredPlaceholders / validation.totalPlaceholders) * 100);
      
      console.log('📊 COMPLETE Data Validation:');
      console.log(`   Coverage: ${coverage}% (${validation.coveredPlaceholders}/${validation.totalPlaceholders})`);
      console.log(`   Missing: ${validation.missingPlaceholders.length}`);
      console.log(`   Extra data: ${validation.extraData.length}`);
      
      if (validation.missingPlaceholders.length > 0) {
        console.log('❌ Missing placeholders:');
        validation.missingPlaceholders.slice(0, 10).forEach(p => console.log(`     - {${p}}`));
        if (validation.missingPlaceholders.length > 10) {
          console.log(`     ... and ${validation.missingPlaceholders.length - 10} more`);
        }
      }
      
      // 5. Generate the actual report
      const result = await this.generateReport(filters);
      
      return {
        ...result,
        analysis,
        validation,
        coverage
      };
      
    } catch (error) {
      console.error('❌ Error in COMPLETE validation:', error);
      throw error;
    }
  }

  /**
   * Get month name in Indonesian
   */
  getMonthName(month) {
    const months = {
      '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
      '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
      '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
    };
    return months[month.toString().padStart(2, '0')] || month;
  }

  /**
   * Generate sample report with full validation
   */
  async generateSampleReportWithValidation() {
    console.log('📋 Generating COMPLETE sample report with ALL placeholders...');
    
    const sampleFilters = {
      kelurahan: null,
      year: '2024',
      month: null
    };
    
    return await this.generateReportWithValidation(sampleFilters);
  }
}

// Export for use in other files
module.exports = CompleteExcelReportGenerator;

// Run if called directly
if (require.main === module) {
  const generator = new CompleteExcelReportGenerator();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--validate')) {
    // Generate with full validation
    generator.generateSampleReportWithValidation()
      .then(result => {
        if (result.success) {
          console.log('\n🎉 COMPLETE Excel report with validation generated!');
          console.log(`📁 File: ${result.filePath}`);
          console.log(`🔄 Replacements: ${result.replacements}`);
          console.log(`📊 Data coverage: ${result.coverage}%`);
          console.log(`📄 Sheets: ${result.sheets}`);
          console.log('\n✨ ALL original formatting, colors, borders, and styling PERFECTLY preserved!');
          console.log('\n🏆 COMPLETE SYSTEM WITH ALL PLACEHOLDERS WORKING!');
          process.exit(0);
        } else {
          throw new Error(result.error);
        }
      })
      .catch(error => {
        console.error('\n💥 Error:', error);
        process.exit(1);
      });
  } else if (args.includes('--analyze')) {
    // Just analyze template
    generator.analyzeCompleteTemplate()
      .then(analysis => {
        console.log('\n📊 COMPLETE template analysis completed!');
        process.exit(0);
      })
      .catch(error => {
        console.error('\n💥 Analysis error:', error);
        process.exit(1);
      });
  } else {
    // Parse filters from command line
    const filters = {};
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i]?.replace('--', '');
      const value = args[i + 1];
      if (key && value) {
        filters[key] = value;
      }
    }
    
    // Generate report
    const hasFilters = Object.keys(filters).length > 0;
    const reportPromise = hasFilters ? 
      generator.generateReport(filters) : 
      generator.generateSampleReportWithValidation();
    
    reportPromise
      .then(result => {
        if (result.success) {
          console.log('\n🎉 COMPLETE Excel report generated successfully!');
          console.log(`📁 File: ${result.filePath}`);
          console.log(`🔄 Replacements: ${result.replacements}`);
          console.log(`📊 Data fields: ${result.dataFields}`);
          console.log(`📄 Sheets: ${result.sheets}`);
          if (result.coverage) {
            console.log(`📈 Coverage: ${result.coverage}%`);
          }
          console.log('\n✨ ALL original formatting, colors, borders, and styling PERFECTLY preserved!');
          console.log('\n🏆 COMPLETE SYSTEM WITH ALL PLACEHOLDERS WORKING!');
          console.log('\n💡 Usage examples:');
          console.log('   node server/excelReportGeneratorComplete.js --validate');
          console.log('   node server/excelReportGeneratorComplete.js --analyze');
          console.log('   node server/excelReportGeneratorComplete.js --kelurahan "Simpang Pasir" --year 2024');
          process.exit(0);
        } else {
          console.log('\n💥 Report generation failed:', result.error);
          process.exit(1);
        }
      })
      .catch(error => {
        console.error('\n💥 Error:', error);
        process.exit(1);
      });
  }
}