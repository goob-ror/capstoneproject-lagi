// Helper function to get cell text
function getCellText(cell) {
  const cellValue = cell.value;
  if (typeof cellValue === 'string') {
    return cellValue;
  } else if (cellValue && typeof cellValue === 'object' && cellValue.richText) {
    return cellValue.richText.map(rt => rt.text).join('');
  } else if (cellValue && typeof cellValue === 'object' && cellValue.text) {
    return cellValue.text;
  }
  return '';
}

// Helper function to replace placeholders with actual data
function replacePlaceholders(text, data) {
  let result = text;
  const regex = /\{([^}]+)\}/g;
  result = result.replace(regex, (match, key) => {
    if (data.hasOwnProperty(key)) {
      return data[key] !== undefined && data[key] !== null ? data[key] : '';
    }
    return match;
  });
  return result;
}

// Helper function to format date
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to populate a statistics row
function populateStatsRow(row, data, kelurahanPrefix) {
  row.eachCell({ includeEmpty: false }, (cell) => {
    const cellValue = cell.value;
    if (typeof cellValue !== 'string' || !cellValue.includes('{')) return;
    
    const match = cellValue.match(/\{([^}]+)\}/);
    if (!match) return;
    
    const placeholder = match[1];
    
    // Check if placeholder starts with kelurahan prefix
    if (!placeholder.startsWith(kelurahanPrefix + '_')) return;
    
    // Extract metric name (remove kelurahan prefix)
    const metric = placeholder.substring(kelurahanPrefix.length + 1);
    
    // Determine if it's a percentage or count
    const isPercentage = metric.includes('persen');
    const baseMetric = metric.replace('_persen', '').replace('persen_', '');
    
    if (isPercentage) {
      // Calculate percentage
      const countKey = baseMetric + '_jumlah';
      const count = data[countKey] || data[baseMetric] || 0;
      const denominator = data.jumlahbumil || 1;
      cell.value = denominator > 0 ? Math.round((count / denominator) * 100) : 0;
    } else {
      // It's a count
      const countKey = baseMetric + '_jumlah';
      cell.value = data[countKey] || data[baseMetric] || 0;
    }
  });
}

module.exports = {
  getCellText,
  replacePlaceholders,
  formatDate,
  populateStatsRow
};
