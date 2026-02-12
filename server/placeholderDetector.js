const XLSX = require('xlsx');
const path = require('path');

/**
 * Simple placeholder detector for Excel templates
 */
class PlaceholderDetector {
  constructor() {
    this.templatePath = path.join(__dirname, 'template_laporan_puskesmas.xlsx');
    this.placeholderPattern = /\{([^}]+)\}/g;
  }

  /**
   * Read Excel template and find all placeholders
   */
  detectPlaceholders() {
    try {
      const workbook = XLSX.readFile(this.templatePath);
      const sheetNames = workbook.SheetNames;
      const allPlaceholders = [];

      sheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: '', 
          raw: false 
        });
        
        sheetData.forEach((row, rowIndex) => {
          if (Array.isArray(row)) {
            row.forEach((cell, colIndex) => {
              if (typeof cell === 'string') {
                const matches = cell.match(this.placeholderPattern);
                if (matches) {
                  matches.forEach(match => {
                    const placeholder = match.replace(/[{}]/g, '');
                    allPlaceholders.push({
                      placeholder,
                      sheet: sheetName,
                      position: { row: rowIndex + 1, col: colIndex + 1 },
                      context: cell,
                      fullMatch: match
                    });
                  });
                }
              }
            });
          }
        });
      });

      return allPlaceholders;
    } catch (error) {
      console.error('Error reading Excel template:', error);
      return [];
    }
  }

  /**
   * Group placeholders by pattern for analysis
   */
  analyzePlaceholders() {
    const placeholders = this.detectPlaceholders();
    
    const analysis = {
      total: placeholders.length,
      bySheet: {},
      byType: {
        kelurahan: {},
        totals: [],
        common: [],
        others: []
      },
      uniquePlaceholders: [...new Set(placeholders.map(p => p.placeholder))]
    };

    // Group by sheet
    placeholders.forEach(p => {
      if (!analysis.bySheet[p.sheet]) {
        analysis.bySheet[p.sheet] = [];
      }
      analysis.bySheet[p.sheet].push(p);
    });

    // Analyze by type
    analysis.uniquePlaceholders.forEach(placeholder => {
      // Kelurahan-specific placeholders
      const kelurahanMatch = placeholder.match(/^(simpangpasir|rawamakmur|handilbakti)_(.+)$/);
      if (kelurahanMatch) {
        const kelurahan = kelurahanMatch[1];
        const metric = kelurahanMatch[2];
        
        if (!analysis.byType.kelurahan[kelurahan]) {
          analysis.byType.kelurahan[kelurahan] = [];
        }
        analysis.byType.kelurahan[kelurahan].push(metric);
      }
      // Total placeholders
      else if (placeholder.startsWith('total_')) {
        analysis.byType.totals.push(placeholder);
      }
      // Common placeholders
      else if (['tanggal_laporan', 'nama_puskesmas'].includes(placeholder)) {
        analysis.byType.common.push(placeholder);
      }
      // Others
      else {
        analysis.byType.others.push(placeholder);
      }
    });

    return analysis;
  }

  /**
   * Display analysis results
   */
  displayAnalysis() {
    console.log('🔍 EXCEL TEMPLATE PLACEHOLDER ANALYSIS');
    console.log('=====================================\n');

    const analysis = this.analyzePlaceholders();
    
    console.log(`📊 SUMMARY:`);
    console.log(`   Total placeholders found: ${analysis.total}`);
    console.log(`   Unique placeholders: ${analysis.uniquePlaceholders.length}`);
    console.log(`   Sheets analyzed: ${Object.keys(analysis.bySheet).length}\n`);

    console.log(`📄 BY SHEET:`);
    Object.keys(analysis.bySheet).forEach(sheet => {
      console.log(`   ${sheet}: ${analysis.bySheet[sheet].length} placeholders`);
    });

    console.log(`\n🏘️ KELURAHAN DATA:`);
    Object.keys(analysis.byType.kelurahan).forEach(kelurahan => {
      console.log(`   ${kelurahan}: ${analysis.byType.kelurahan[kelurahan].length} metrics`);
      analysis.byType.kelurahan[kelurahan].forEach(metric => {
        console.log(`     - ${metric}`);
      });
    });

    console.log(`\n📊 TOTALS: ${analysis.byType.totals.length}`);
    analysis.byType.totals.forEach(total => {
      console.log(`   - ${total}`);
    });

    console.log(`\n🔄 COMMON: ${analysis.byType.common.length}`);
    analysis.byType.common.forEach(common => {
      console.log(`   - ${common}`);
    });

    console.log(`\n📝 OTHERS: ${analysis.byType.others.length}`);
    analysis.byType.others.forEach(other => {
      console.log(`   - ${other}`);
    });

    return analysis;
  }

  /**
   * Generate complete placeholder list for mapping
   */
  generatePlaceholderList() {
    const analysis = this.analyzePlaceholders();
    
    console.log('\n📋 COMPLETE PLACEHOLDER LIST:');
    console.log('============================\n');
    
    analysis.uniquePlaceholders.sort().forEach((placeholder, index) => {
      console.log(`${(index + 1).toString().padStart(2, '0')}. {${placeholder}}`);
    });

    return analysis.uniquePlaceholders;
  }
}

// Export for use in other files
module.exports = PlaceholderDetector;

// Run if called directly
if (require.main === module) {
  const detector = new PlaceholderDetector();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--list')) {
    detector.generatePlaceholderList();
  } else {
    detector.displayAnalysis();
  }
}