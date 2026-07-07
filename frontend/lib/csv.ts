import Papa from 'papaparse';
import type { PreviewData } from './types';

const PREVIEW_LIMIT = 50;

/**
 * Parses a CSV file client-side and returns headers plus the first PREVIEW_LIMIT rows.
 * Uses PapaParse with streaming so large files don't block the thread.
 *
 * @param file - The CSV File object from the file picker or drop zone.
 * @returns PreviewData with headers, preview rows, and total row count.
 */
export async function parseCSVPreview(file: File): Promise<PreviewData> {
  return new Promise((resolve, reject) => {
    let headers: string[] = [];
    const rows: Record<string, string>[] = [];
    let totalRows = 0;
    let headersSet = false;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      step(result) {
        if (!headersSet) {
          headers = result.meta.fields ?? [];
          headersSet = true;
        }
        totalRows += 1;
        if (rows.length < PREVIEW_LIMIT) {
          rows.push(result.data);
        }
      },
      complete() {
        resolve({ headers, rows, totalRows });
      },
      error(err) {
        reject(new Error(`CSV parse error: ${err.message}`));
      },
    });
  });
}
