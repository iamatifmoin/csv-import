import { parse } from 'csv-parse';
import type { RawRecord } from '../types/crm.types';

/**
 * Parses a CSV buffer into an array of raw records.
 * Column headers become object keys; all values are strings.
 * @param buffer - The raw CSV file buffer from multer.
 * @returns Array of RawRecord objects.
 */
export async function parseCSV(buffer: Buffer): Promise<RawRecord[]> {
  try {
    return await new Promise((resolve, reject) => {
      parse(
        buffer,
        {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          bom: true,
          relax_column_count: true,
        },
        (err, records: RawRecord[]) => {
          if (err) {
            reject(new Error(`CSV parse error: ${err.message}`));
          } else {
            resolve(records);
          }
        },
      );
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown CSV parse error.';
    throw new Error(message);
  }
}
