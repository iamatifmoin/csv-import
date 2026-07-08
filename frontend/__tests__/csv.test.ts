import { describe, it, expect, vi, beforeEach } from 'vitest';
import Papa from 'papaparse';
import { parseCSVPreview } from '../lib/csv';

vi.mock('papaparse');

describe('parseCSVPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns headers, rows, and totalRows for a standard CSV', async () => {
    (vi.mocked(Papa.parse).mockImplementation as any)((_file: unknown, options: unknown) => {
      const opts = options as { step?: (result: { data: Record<string, string>; meta: { fields: string[] } }) => void; complete?: () => void };
      opts.step?.({ data: { Name: 'John', Email: 'john@test.com' }, meta: { fields: ['Name', 'Email'] } });
      opts.step?.({ data: { Name: 'Jane', Email: 'jane@test.com' }, meta: { fields: ['Name', 'Email'] } });
      opts.complete?.();
    });

    const file = new File([''], 'test.csv', { type: 'text/csv' });
    const result = await parseCSVPreview(file);

    expect(result.headers).toEqual(['Name', 'Email']);
    expect(result.rows).toHaveLength(2);
    expect(result.totalRows).toBe(2);
    expect(result.rows[0].Name).toBe('John');
  });

  it('limits preview rows to 50 but counts all rows in totalRows', async () => {
    (vi.mocked(Papa.parse).mockImplementation as any)((_file: unknown, options: unknown) => {
      const opts = options as { step?: (result: { data: Record<string, string>; meta: { fields: string[] } }) => void; complete?: () => void };
      for (let i = 0; i < 100; i += 1) {
        opts.step?.({ data: { Name: `Person ${i}` }, meta: { fields: ['Name'] } });
      }
      opts.complete?.();
    });

    const file = new File([''], 'big.csv', { type: 'text/csv' });
    const result = await parseCSVPreview(file);

    expect(result.rows).toHaveLength(50);
    expect(result.totalRows).toBe(100);
  });

  it('rejects with a descriptive error on parse failure', async () => {
    (vi.mocked(Papa.parse).mockImplementation as any)((_file: unknown, options: unknown) => {
      const opts = options as { error?: (err: { message: string }) => void };
      opts.error?.({ message: 'Unexpected token' });
    });

    const file = new File([''], 'bad.csv', { type: 'text/csv' });
    await expect(parseCSVPreview(file)).rejects.toThrow('CSV parse error: Unexpected token');
  });

  it('returns empty rows and zero totalRows for a CSV with no data', async () => {
    (vi.mocked(Papa.parse).mockImplementation as any)((_file: unknown, options: unknown) => {
      const opts = options as { complete?: () => void };
      opts.complete?.();
    });

    const file = new File([''], 'empty.csv', { type: 'text/csv' });
    const result = await parseCSVPreview(file);

    expect(result.rows).toHaveLength(0);
    expect(result.totalRows).toBe(0);
    expect(result.headers).toEqual([]);
  });
});