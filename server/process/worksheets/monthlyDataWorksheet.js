// Monthly Data Worksheet Filler
// Handles filling monthly worksheets (Januari, Februari, etc.) with patient data

const fillMonthlyDataWorksheet = async (workbook, yearlyData, tanggal_laporan, nama_puskesmas) => {
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // Process each month
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const monthName = monthNames[monthIndex];
        const worksheet = workbook.getWorksheet(monthName);
        
        if (!worksheet) {
            continue;
        }

        // Get data for this month (monthIndex + 1 because months are 1-based in yearlyData)
        let monthData = [];
        if (yearlyData && yearlyData[monthIndex + 1]) {
            monthData = yearlyData[monthIndex + 1];
            if (monthData.length > 0) {
            }
        } else {
            console.log(`No data available for ${monthName}`);
        }

        // Fill the worksheet with data
        await fillMonthWorksheet(worksheet, monthData, monthName.toLowerCase(), tanggal_laporan, nama_puskesmas);
    }
};

const fillMonthWorksheet = async (worksheet, monthData, monthPrefix, tanggal_laporan, nama_puskesmas) => {
    // Fill header information if placeholders exist
    worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
            if (cell.value && typeof cell.value === 'string') {
                if (cell.value.includes('{tanggal_kunjungan}')) {
                    cell.value = cell.value.replace('{tanggal_kunjungan}', tanggal_laporan);
                }
            }
        });
    });

    if (!monthData || monthData.length === 0) {
        // Clear placeholders even if no data
        clearPlaceholders(worksheet, monthPrefix);
        return;
    }


    // Helper function to format dates
    function formatDateDDMMYYYY(date) {
        if (!date) return '-';
        const d = new Date(date);
        if (isNaN(d)) return '-';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Find the template row (first row with placeholders)
    let templateRowIndex = null;
    let templateRow = null;

    for (let i = 1; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        let hasPlaceholder = false;
        
        row.eachCell((cell) => {
            if (cell.value && typeof cell.value === 'string' && cell.value.includes(`{${monthPrefix}_no_data}`)) {
                hasPlaceholder = true;
            }
        });
        
        if (hasPlaceholder) {
            templateRowIndex = i;
            templateRow = row;
            break;
        }
    }

    if (!templateRowIndex || !templateRow) {
        return;
    }

    // Store template row styling
    const templateStyles = [];
    const columnCount = templateRow.cellCount || 20; // Updated to 20 columns for new fields
    
    for (let colNum = 1; colNum <= columnCount; colNum++) {
        const cell = templateRow.getCell(colNum);
        templateStyles[colNum] = {
            font: cell.font ? JSON.parse(JSON.stringify(cell.font)) : undefined,
            fill: cell.fill ? JSON.parse(JSON.stringify(cell.fill)) : undefined,
            border: cell.border ? JSON.parse(JSON.stringify(cell.border)) : undefined,
            alignment: cell.alignment ? JSON.parse(JSON.stringify(cell.alignment)) : undefined,
            numFmt: cell.numFmt,
        };
    }

    const templateHeight = templateRow.height;

    // Clear the template row
    for (let colNum = 1; colNum <= columnCount; colNum++) {
        templateRow.getCell(colNum).value = null;
    }
    templateRow.commit();

    // Insert data rows
    monthData.forEach((data, index) => {
        const rowIndex = templateRowIndex + index;
        const row = worksheet.getRow(rowIndex);
        
        // Set row height
        if (templateHeight) {
            row.height = templateHeight;
        }

        // Prepare data values - using the correct field names from the queries
        const golDarahRhesus = data.gol_darah || data.rhesus 
            ? `${data.gol_darah || '-'}${data.rhesus ? ` (${data.rhesus})` : ''}`
            : '-';
        const gpa = `G${data.gravida || 0}P${data.partus || 0}A${data.abortus || 0}`;
        
        // Use the fields from the query results
        const kategoriAnemia = data.kategori_anemia || '-';
        const kek = data.kek || '-';
        const hipertensi = data.hipertensi || 'Normal';
        const diabetes = data.diabetes || 'Normal';
        const hiv = data.hiv || 'Non-Reaktif';
        const hbsag = data.hbsag || 'Non-Reaktif';
        const sifilis = data.sifilis || 'Non-Reaktif';
        const jenisKunjungan = data.jenis_kunjungan || '-';

        // Helper function to format dates
        function formatDateDDMMYYYY(date) {
            if (!date) return '-';
            const d = new Date(date);
            if (isNaN(d)) return '-';
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        }

        const values = [
            null, // placeholder for index 0
            index + 1, // no_data
            data.nama_lengkap || '-', // nama_lengkap
            data.nik || '-', // nik
            formatDateDDMMYYYY(data.tanggal_lahir), // tanggalLahir
            golDarahRhesus, // golDarah_rhesus
            data.no_hp || '-', // nohp
            data.kelurahan || '-', // kelurahan
            data.posyandu || '-', // posyandu
            formatDateDDMMYYYY(data.hpht), // hpht
            gpa, // gpa
            formatDateDDMMYYYY(data.tp), // tp
            kategoriAnemia, // kategori_anemia
            kek, // kek
            hipertensi, // hipertensi
            diabetes, // diabetes
            hiv, // hiv
            hbsag, // hbsag
            sifilis, // sifilis
            jenisKunjungan // jenisKunjungan
        ];

        // Apply values and styles to each cell
        for (let colNum = 1; colNum <= columnCount; colNum++) {
            const cell = row.getCell(colNum);
            const style = templateStyles[colNum];
            
            // Set value
            if (values[colNum] !== undefined && values[colNum] !== null) {
                cell.value = values[colNum];
            } else {
                cell.value = '-';
            }
            
            // Apply styling
            if (style) {
                if (style.font) cell.font = style.font;
                if (style.fill) cell.fill = style.fill;
                if (style.border) cell.border = style.border;
                if (style.alignment) cell.alignment = style.alignment;
                if (style.numFmt) cell.numFmt = style.numFmt;
            }
        }

        row.commit();
    });

    // Clear any remaining placeholder rows
    const lastDataRow = templateRowIndex + monthData.length - 1;
    for (let i = lastDataRow + 1; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        let hasPlaceholder = false;
        
        row.eachCell((cell) => {
            if (cell.value && cell.value.toString().includes(`{${monthPrefix}_`)) {
                hasPlaceholder = true;
            }
        });
        
        if (hasPlaceholder) {
            for (let colNum = 1; colNum <= columnCount; colNum++) {
                row.getCell(colNum).value = null;
            }
            row.commit();
        }
    }
};

const clearPlaceholders = (worksheet, monthPrefix) => {
    worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
            if (cell.value && typeof cell.value === 'string' && cell.value.includes(`{${monthPrefix}_`)) {
                cell.value = null;
            }
        });
    });
};

// Helper function to determine anemia category
function getKategoriAnemia(hb) {
    if (!hb) return '-';
    if (hb < 8) return 'Berat';
    if (hb < 10) return 'Sedang';
    if (hb < 11) return 'Ringan';
    return 'Normal';
}

module.exports = { fillMonthlyDataWorksheet };