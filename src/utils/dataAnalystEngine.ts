import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export type ColumnType = 'numeric' | 'categorical' | 'date' | 'boolean' | 'text';

export interface ColumnInfo {
  name: string;
  type: ColumnType;
  sampleValues: any[];
  nonNullCount: number;
  nullCount: number;
  uniqueCount: number;
}

export interface NumericStats {
  count: number;
  nullCount: number;
  sum: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  range: number;
  stdDev: number;
  q1: number;
  q3: number;
  iqr: number;
}

export interface CategoricalStats {
  count: number;
  nullCount: number;
  uniqueCount: number;
  topCategories: Array<{ category: string; count: number; percentage: number }>;
}

export interface DateStats {
  count: number;
  nullCount: number;
  minDate: string;
  maxDate: string;
}

export interface DataQualityReport {
  totalRows: number;
  totalColumns: number;
  totalCells: number;
  missingCells: number;
  missingPercentage: number;
  duplicateRowsCount: number;
  duplicateRowIndices: number[];
  outlierCount: number;
  outliersByColumn: Record<string, number[]>; // column -> row indices
  constantColumns: string[];
  qualityScore: number; // 0 - 100
}

export interface ParsedDataset {
  fileName: string;
  fileSize: number;
  sheets: string[];
  currentSheet: string;
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
  totalColumns: number;
  columnsInfo: ColumnInfo[];
  qualityReport: DataQualityReport;
}

/**
 * 1. PARSE FILE (CSV or XLSX)
 */
export async function parseDataFile(file: File, selectedSheet?: string): Promise<ParsedDataset> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (extension === 'csv' || file.type === 'text/csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: 'greedy',
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            reject(new Error('The uploaded CSV file contains no data rows.'));
            return;
          }
          const rows = results.data as Record<string, any>[];
          const headers = Object.keys(rows[0] || {}).filter(Boolean);
          const columnsInfo = analyzeColumns(headers, rows);
          const qualityReport = evaluateDataQuality(headers, columnsInfo, rows);

          resolve({
            fileName: file.name,
            fileSize: file.size,
            sheets: ['Default'],
            currentSheet: 'Default',
            headers,
            rows,
            totalRows: rows.length,
            totalColumns: headers.length,
            columnsInfo,
            qualityReport,
          });
        },
        error: (err) => {
          reject(new Error(`CSV Parsing error: ${err.message}`));
        },
      });
    });
  } else if (extension === 'xlsx' || extension === 'xls' || file.type.includes('sheet') || file.type.includes('excel')) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('The uploaded Excel file contains no worksheets.');
    }

    const sheets = workbook.SheetNames;
    const sheetToUse = selectedSheet && sheets.includes(selectedSheet) ? selectedSheet : sheets[0];
    const worksheet = workbook.Sheets[sheetToUse];

    const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });

    if (!rawJson || rawJson.length === 0) {
      throw new Error(`Worksheet "${sheetToUse}" is empty.`);
    }

    const headers = Object.keys(rawJson[0] || {}).filter(Boolean);
    const columnsInfo = analyzeColumns(headers, rawJson);
    const qualityReport = evaluateDataQuality(headers, columnsInfo, rawJson);

    return {
      fileName: file.name,
      fileSize: file.size,
      sheets,
      currentSheet: sheetToUse,
      headers,
      rows: rawJson,
      totalRows: rawJson.length,
      totalColumns: headers.length,
      columnsInfo,
      qualityReport,
    };
  } else {
    throw new Error(`Unsupported file type ".${extension}". Please upload a .csv, .xlsx, or .xls file.`);
  }
}

/**
 * 2. DETECT COLUMN TYPES & SUMMARIZE
 */
function analyzeColumns(headers: string[], rows: Record<string, any>[]): ColumnInfo[] {
  return headers.map((header) => {
    let nonNullCount = 0;
    let nullCount = 0;
    const uniqueValues = new Set<any>();
    const samples: any[] = [];

    let numericCount = 0;
    let dateCount = 0;
    let boolCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const val = rows[i][header];
      if (val === null || val === undefined || val === '' || String(val).trim() === '') {
        nullCount++;
      } else {
        nonNullCount++;
        uniqueValues.add(val);
        if (samples.length < 5) samples.push(val);

        // Check types
        if (typeof val === 'number' && !isNaN(val)) {
          numericCount++;
        } else if (typeof val === 'boolean' || String(val).toLowerCase() === 'true' || String(val).toLowerCase() === 'false') {
          boolCount++;
        } else if (val instanceof Date || (!isNaN(Date.parse(String(val))) && /^\d{4}[-/]\d{2}[-/]\d{2}/.test(String(val)))) {
          dateCount++;
        } else if (typeof val === 'string') {
          // Check if string is formatted number e.g. "$1,200.50" or "45%"
          const cleanNum = Number(String(val).replace(/[\$,%]/g, '').trim());
          if (!isNaN(cleanNum) && String(val).trim() !== '') {
            numericCount++;
          }
        }
      }
    }

    let detectedType: ColumnType = 'text';
    const totalValid = nonNullCount || 1;

    if (numericCount / totalValid > 0.7) {
      detectedType = 'numeric';
    } else if (dateCount / totalValid > 0.7) {
      detectedType = 'date';
    } else if (boolCount / totalValid > 0.7) {
      detectedType = 'boolean';
    } else if (uniqueValues.size <= Math.min(30, Math.max(5, rows.length * 0.2))) {
      detectedType = 'categorical';
    }

    return {
      name: header,
      type: detectedType,
      sampleValues: samples,
      nonNullCount,
      nullCount,
      uniqueCount: uniqueValues.size,
    };
  });
}

/**
 * 3. CALCULATE NUMERIC STATISTICS
 */
export function computeNumericStats(column: string, rows: Record<string, any>[]): NumericStats {
  const vals: number[] = [];
  let nullCount = 0;

  for (const r of rows) {
    const raw = r[column];
    if (raw === null || raw === undefined || raw === '' || String(raw).trim() === '') {
      nullCount++;
      continue;
    }
    const num = typeof raw === 'number' ? raw : Number(String(raw).replace(/[\$,%]/g, '').trim());
    if (!isNaN(num)) {
      vals.push(num);
    } else {
      nullCount++;
    }
  }

  if (vals.length === 0) {
    return {
      count: 0,
      nullCount,
      sum: 0,
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      range: 0,
      stdDev: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
    };
  }

  vals.sort((a, b) => a - b);
  const count = vals.length;
  const sum = vals.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  const min = vals[0];
  const max = vals[count - 1];
  const range = max - min;

  // Median
  const mid = Math.floor(count / 2);
  const median = count % 2 !== 0 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;

  // Quartiles
  const q1 = vals[Math.floor(count * 0.25)];
  const q3 = vals[Math.floor(count * 0.75)];
  const iqr = q3 - q1;

  // Variance & StdDev
  const variance = vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (count > 1 ? count - 1 : 1);
  const stdDev = Math.sqrt(variance);

  return {
    count,
    nullCount,
    sum: Number(sum.toFixed(2)),
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    range: Number(range.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    q1: Number(q1.toFixed(2)),
    q3: Number(q3.toFixed(2)),
    iqr: Number(iqr.toFixed(2)),
  };
}

/**
 * 4. CALCULATE CATEGORICAL STATISTICS
 */
export function computeCategoricalStats(column: string, rows: Record<string, any>[]): CategoricalStats {
  const freqs: Record<string, number> = {};
  let nullCount = 0;
  let totalValid = 0;

  for (const r of rows) {
    const raw = r[column];
    if (raw === null || raw === undefined || raw === '' || String(raw).trim() === '') {
      nullCount++;
    } else {
      const key = String(raw).trim();
      freqs[key] = (freqs[key] || 0) + 1;
      totalValid++;
    }
  }

  const sortedCategories = Object.entries(freqs)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      count,
      percentage: Number(((count / (totalValid || 1)) * 100).toFixed(1)),
    }));

  return {
    count: totalValid,
    nullCount,
    uniqueCount: Object.keys(freqs).length,
    topCategories: sortedCategories.slice(0, 10),
  };
}

/**
 * 5. CALCULATE PEARSON CORRELATION MATRIX
 */
export function computeCorrelationMatrix(numericCols: string[], rows: Record<string, any>[]): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};

  for (const col1 of numericCols) {
    matrix[col1] = {};
    const stats1 = computeNumericStats(col1, rows);

    for (const col2 of numericCols) {
      if (col1 === col2) {
        matrix[col1][col2] = 1.0;
        continue;
      }

      const stats2 = computeNumericStats(col2, rows);
      if (stats1.count === 0 || stats2.count === 0) {
        matrix[col1][col2] = 0;
        continue;
      }

      let numSum = 0;
      let denX = 0;
      let denY = 0;
      let validPairs = 0;

      for (const r of rows) {
        const v1 = Number(String(r[col1]).replace(/[\$,%]/g, ''));
        const v2 = Number(String(r[col2]).replace(/[\$,%]/g, ''));

        if (!isNaN(v1) && !isNaN(v2)) {
          const diffX = v1 - stats1.mean;
          const diffY = v2 - stats2.mean;
          numSum += diffX * diffY;
          denX += diffX * diffX;
          denY += diffY * diffY;
          validPairs++;
        }
      }

      const denom = Math.sqrt(denX * denY);
      const corr = denom === 0 ? 0 : numSum / denom;
      matrix[col1][col2] = Number(corr.toFixed(3));
    }
  }

  return matrix;
}

/**
 * 6. EVALUATE DATA QUALITY REPORT
 */
function evaluateDataQuality(headers: string[], columnsInfo: ColumnInfo[], rows: Record<string, any>[]): DataQualityReport {
  const totalRows = rows.length;
  const totalColumns = headers.length;
  const totalCells = totalRows * totalColumns;

  let missingCells = 0;
  columnsInfo.forEach((col) => {
    missingCells += col.nullCount;
  });

  const missingPercentage = Number(((missingCells / (totalCells || 1)) * 100).toFixed(1));

  // Detect duplicates
  const rowStrings = new Set<string>();
  const duplicateIndices: number[] = [];

  rows.forEach((r, idx) => {
    const str = JSON.stringify(r);
    if (rowStrings.has(str)) {
      duplicateIndices.push(idx);
    } else {
      rowStrings.add(str);
    }
  });

  // Outliers by IQR method
  const outliersByColumn: Record<string, number[]> = {};
  let totalOutliers = 0;

  columnsInfo.forEach((col) => {
    if (col.type === 'numeric') {
      const stats = computeNumericStats(col.name, rows);
      if (stats.iqr > 0) {
        const lowerBound = stats.q1 - 1.5 * stats.iqr;
        const upperBound = stats.q3 + 1.5 * stats.iqr;
        const outlierRows: number[] = [];

        rows.forEach((r, idx) => {
          const val = Number(String(r[col.name]).replace(/[\$,%]/g, ''));
          if (!isNaN(val) && (val < lowerBound || val > upperBound)) {
            outlierRows.push(idx);
          }
        });

        if (outlierRows.length > 0) {
          outliersByColumn[col.name] = outlierRows;
          totalOutliers += outlierRows.length;
        }
      }
    }
  });

  // Constant columns
  const constantColumns = columnsInfo.filter((c) => c.uniqueCount <= 1).map((c) => c.name);

  // Score calculation
  let score = 100;
  score -= Math.min(30, Math.round(missingPercentage));
  score -= Math.min(25, duplicateIndices.length * 2);
  score -= Math.min(20, Math.round((totalOutliers / (totalRows || 1)) * 100));
  score = Math.max(10, Math.min(100, score));

  return {
    totalRows,
    totalColumns,
    totalCells,
    missingCells,
    missingPercentage,
    duplicateRowsCount: duplicateIndices.length,
    duplicateRowIndices: duplicateIndices,
    outlierCount: totalOutliers,
    outliersByColumn,
    constantColumns,
    qualityScore: score,
  };
}

/**
 * 7. AGGREGATE DATA FOR CHARTS
 */
export function aggregateDataForChart(params: {
  rows: Record<string, any>[];
  xAxis: string;
  yAxis: string;
  aggType: 'sum' | 'mean' | 'count' | 'min' | 'max';
}): Array<{ label: string; value: number }> {
  const { rows, xAxis, yAxis, aggType } = params;
  const groups: Record<string, number[]> = {};

  for (const r of rows) {
    const xVal = r[xAxis] !== null && r[xAxis] !== undefined ? String(r[xAxis]).trim() : 'Unknown';
    if (!groups[xVal]) groups[xVal] = [];

    if (aggType === 'count') {
      groups[xVal].push(1);
    } else {
      const yVal = Number(String(r[yAxis]).replace(/[\$,%]/g, ''));
      if (!isNaN(yVal)) {
        groups[xVal].push(yVal);
      }
    }
  }

  const result = Object.entries(groups).map(([label, values]) => {
    let computedVal = 0;
    if (values.length > 0) {
      if (aggType === 'sum') {
        computedVal = values.reduce((a, b) => a + b, 0);
      } else if (aggType === 'mean') {
        computedVal = values.reduce((a, b) => a + b, 0) / values.length;
      } else if (aggType === 'count') {
        computedVal = values.length;
      } else if (aggType === 'min') {
        computedVal = Math.min(...values);
      } else if (aggType === 'max') {
        computedVal = Math.max(...values);
      }
    }
    return {
      label,
      value: Number(computedVal.toFixed(2)),
    };
  });

  return result.slice(0, 30); // Limit to top 30 categories to prevent overcrowded charts
}
