/**
 * Perfect Excel Report Generator with Full Formatting Preservation
 * Uses xlsx-populate which is specifically designed for template manipulation
 */

const XlsxPopulate = require('xlsx-populate');
const path = require('path');
const fs = require('fs');
const ExcelDataService = require('./excelDataService');

class PerfectExcelReportGenerator {
  constructor() {
    this.templatePath = path.join(__dirname, 'template_laporan_puskesmas.xlsx');
    this.placeholderPattern = /\{([^}]+)\}/g;
  }

  /**
   * Generate Excel report with perfect formatting preservation
   */
  async generateReport(filters = {}, outputPath = null) {
    try {
      console.log('🎯 Generating Excel report with PERFECT formatting preservation...');
      console.log('Filters:', filters);
      
      // 1. Load template workbook
      const workbook = await XlsxPopulate.fromFileAsync(this.templatePath);
      
      // 2. Generate data
      const dataService = new ExcelDataService();
      const reportData = await dataService.generateAllData(filters);
      
      console.log(`📊 Generated data for ${Object.keys(reportData).length} placeholders`);
      
      // 3. Process each worksheet
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
                
                // Log replacement for debugging
                if (cellValue !== newValue) {
                  console.log(`   📝 ${sheet.name()}[${row},${col}]: "${cellValue}" → "${newValue}"`);
                }
              }
            }
          }
        }
        
        console.log(`   ✅ ${sheetReplacements} replacements in ${sheet.name()}`);
      });
      
      console.log(`🔄 Total replacements: ${totalReplacements}`);
      
      // 4. Generate output filename if not provided
      if (!outputPath) {
        const timestamp = new Date().toISOString().split('T')[0];
        const kelurahanSuffix = filters.kelurahan ? `_${filters.kelurahan.replace(/\s+/g, '')}` : '';
        const yearSuffix = filters.year ? `_${filters.year}` : '';
        const monthSuffix = filters.month ? `_${this.getMonthName(filters.month)}` : '';
        outputPath = path.join(__dirname, `laporan_perfect${kelurahanSuffix}${yearSuffix}${monthSuffix}_${timestamp}.xlsx`);
      }
      
      // 5. Save the workbook with PERFECT formatting preservation
      await workbook.toFileAsync(outputPath);
      
      console.log(`✅ PERFECT formatted report generated: ${outputPath}`);
      
      return {
        success: true,
        filePath: outputPath,
        dataFields: Object.keys(reportData).length,
        replacements: totalReplacements,
        sheets: sheets.length,
        reportData,
        message: 'Excel report with PERFECT formatting preservation generated successfully'
      };
      
    } catch (error) {
      console.error('❌ Error generating PERFECT Excel report:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate PERFECT Excel report'
      };
    }
  }

  /**
   * Analyze template structure and placeholders
   */
  async analyzeTemplate() {
    try {
      console.log('🔍 Analyzing template structure...');
      
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
      
      console.log('📊 Template Analysis Results:');
      console.log(`   Total sheets: ${analysis.totalSheets}`);
      console.log(`   Total placeholders: ${analysis.totalPlaceholders}`);
      console.log(`   Unique placeholders: ${analysis.uniquePlaceholders.length}`);
      
      analysis.sheets.forEach(sheet => {
        console.log(`   ${sheet.name}: ${sheet.placeholders.length} placeholders, ${sheet.cellsWithData} cells with data`);
      });
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Error analyzing template:', error);
      throw error;
    }
  }

  /**
   * Generate report with detailed validation
   */
  async generateReportWithValidation(filters = {}) {
    try {
      console.log('🔍 Generating report with validation...');
      
      // 1. Analyze template first
      const analysis = await this.analyzeTemplate();
      
      // 2. Generate data
      const dataService = new ExcelDataService();
      const reportData = await dataService.generateAllData(filters);
      
      // 3. Validate data coverage
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
      
      console.log('📊 Data Validation:');
      console.log(`   Coverage: ${coverage}% (${validation.coveredPlaceholders}/${validation.totalPlaceholders})`);
      console.log(`   Missing: ${validation.missingPlaceholders.length}`);
      console.log(`   Extra data: ${validation.extraData.length}`);
      
      if (validation.missingPlaceholders.length > 0) {
        console.log('❌ Missing placeholders:');
        validation.missingPlaceholders.forEach(p => console.log(`     - {${p}}`));
      }
      
      // 4. Generate the actual report
      const result = await this.generateReport(filters);
      
      return {
        ...result,
        analysis,
        validation,
        coverage
      };
      
    } catch (error) {
      console.error('❌ Error in validation:', error);
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
    console.log('📋 Generating sample report with PERFECT formatting...');
    
    const sampleFilters = {
      kelurahan: null,
      year: '2024',
      month: null
    };
    
    return await this.generateReportWithValidation(sampleFilters);
  }
}

// Export for use in other files
module.exports = PerfectExcelReportGenerator;

// Run if called directly
if (require.main === module) {
  const generator = new PerfectExcelReportGenerator();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--validate')) {
    // Generate with full validation
    generator.generateSampleReportWithValidation()
      .then(result => {
        if (result.success) {
          console.log('\n🎉 PERFECT Excel report with validation generated!');
          console.log(`📁 File: ${result.filePath}`);
          console.log(`🔄 Replacements: ${result.replacements}`);
          console.log(`📊 Data coverage: ${result.coverage}%`);
          console.log(`📄 Sheets: ${result.sheets}`);
          console.log('\n✨ ALL original formatting, colors, borders, and styling PERFECTLY preserved!');
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
    generator.analyzeTemplate()
      .then(analysis => {
        console.log('\n📊 Template analysis completed!');
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
          console.log('\n🎉 PERFECT Excel report generated successfully!');
          console.log(`📁 File: ${result.filePath}`);
          console.log(`🔄 Replacements: ${result.replacements}`);
          console.log(`📊 Data fields: ${result.dataFields}`);
          console.log(`📄 Sheets: ${result.sheets}`);
          if (result.coverage) {
            console.log(`📈 Coverage: ${result.coverage}%`);
          }
          console.log('\n✨ ALL original formatting, colors, borders, and styling PERFECTLY preserved!');
          console.log('\n💡 Usage examples:');
          console.log('   node server/excelReportGeneratorPerfect.js --validate');
          console.log('   node server/excelReportGeneratorPerfect.js --analyze');
          console.log('   node server/excelReportGeneratorPerfect.js --kelurahan "Simpang Pasir" --year 2024');
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