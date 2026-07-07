import { parseCSV } from '../src/services/csv.service';

describe('parseCSV', () => {
  it('parses a standard CSV buffer into RawRecord array', async () => {
    const csv = 'Name,Email,Phone\nJohn Doe,john@example.com,9876543210';
    const result = await parseCSV(Buffer.from(csv));

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      Name: 'John Doe',
      Email: 'john@example.com',
      Phone: '9876543210',
    });
  });

  it('trims whitespace from values', async () => {
    const csv = 'Name,Email\n  John  ,  john@example.com  ';
    const result = await parseCSV(Buffer.from(csv));

    expect(result[0].Name).toBe('John');
    expect(result[0].Email).toBe('john@example.com');
  });

  it('skips empty lines', async () => {
    const csv = 'Name,Email\nJohn,john@example.com\n\n\nJane,jane@example.com\n';
    const result = await parseCSV(Buffer.from(csv));

    expect(result).toHaveLength(2);
  });

  it('returns empty array when CSV has only headers and no rows', async () => {
    const csv = 'Name,Email,Phone';
    const result = await parseCSV(Buffer.from(csv));

    expect(result).toHaveLength(0);
  });

  it('handles BOM prefix present in Excel CSV exports', async () => {
    const csv = '\uFEFFName,Email\nJohn,john@example.com';
    const result = await parseCSV(Buffer.from(csv, 'utf8'));

    expect(result[0]).toHaveProperty('Name');
    expect(result[0].Name).toBe('John');
  });

  it('handles quoted values containing commas', async () => {
    const csv = 'Name,Note\nJohn Doe,"Sales lead, follow up required"';
    const result = await parseCSV(Buffer.from(csv));

    expect(result[0].Note).toBe('Sales lead, follow up required');
  });

  it('handles multiple rows correctly', async () => {
    const csv = [
      'Name,Email',
      'Alice,alice@example.com',
      'Bob,bob@example.com',
      'Charlie,charlie@example.com',
    ].join('\n');

    const result = await parseCSV(Buffer.from(csv));
    expect(result).toHaveLength(3);
    expect(result[2].Name).toBe('Charlie');
  });

  it('handles columns with different capitalisation styles', async () => {
    const csv = 'full_name,email_address,PHONE\nJohn,john@test.com,9876543210';
    const result = await parseCSV(Buffer.from(csv));

    expect(result[0]).toHaveProperty('full_name');
    expect(result[0]).toHaveProperty('email_address');
    expect(result[0]).toHaveProperty('PHONE');
  });
});
