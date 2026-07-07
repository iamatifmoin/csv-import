import Anthropic from '@anthropic-ai/sdk';
import { extractRecords, chunkArray } from '../src/services/ai.service';

jest.mock('@anthropic-ai/sdk');

const MockAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;

/**
 * Creates a mock Anthropic instance that returns a given JSON string as the AI response.
 */
function mockAnthropicResponse(json: object): void {
  const mockCreate = jest.fn().mockResolvedValue({
    content: [{ type: 'text', text: JSON.stringify(json) }],
  });

  MockAnthropic.mockImplementation(
    () => ({ messages: { create: mockCreate } }) as unknown as Anthropic,
  );
}

/**
 * Creates a mock Anthropic instance that rejects every call with an error.
 */
function mockAnthropicError(message: string): jest.Mock {
  const mockCreate = jest.fn().mockRejectedValue(new Error(message));
  MockAnthropic.mockImplementation(
    () => ({ messages: { create: mockCreate } }) as unknown as Anthropic,
  );
  return mockCreate;
}

describe('chunkArray', () => {
  it('splits array into chunks of given size', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = chunkArray(arr, 2);
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns single chunk when array is smaller than size', () => {
    const arr = [1, 2];
    expect(chunkArray(arr, 10)).toEqual([[1, 2]]);
  });

  it('returns empty array when input is empty', () => {
    expect(chunkArray([], 5)).toEqual([]);
  });

  it('handles chunk size of 1', () => {
    expect(chunkArray([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });
});

describe('extractRecords', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the AI once for a batch smaller than BATCH_SIZE', async () => {
    const responseData = {
      extracted: [{ name: 'John', email: 'john@test.com' }],
      skipped: [],
    };
    const mockCreate = jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(responseData) }],
    });
    MockAnthropic.mockImplementation(
      () => ({ messages: { create: mockCreate } }) as unknown as Anthropic,
    );

    const records = [{ Name: 'John', Email: 'john@test.com' }];
    await extractRecords(records);

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('splits 20 records into 2 batches (15 + 5)', async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({ extracted: [], skipped: [] }) }],
    });
    MockAnthropic.mockImplementation(
      () => ({ messages: { create: mockCreate } }) as unknown as Anthropic,
    );

    const records = Array.from({ length: 20 }, (_, i) => ({
      Name: `Person ${i}`,
      Email: `person${i}@example.com`,
    }));

    await extractRecords(records);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('marks all records in a failed batch as skipped after retries', async () => {
    mockAnthropicError('API timeout');

    const records = [
      { Name: 'John', Email: 'john@test.com' },
      { Name: 'Jane', Email: 'jane@test.com' },
    ];

    const result = await extractRecords(records);

    expect(result.extracted).toHaveLength(0);
    expect(result.skipped).toHaveLength(2);
    expect(result.skipped[0].reason).toContain('AI extraction failed');
    expect(result.skipped[0].data).toEqual(records[0]);
  }, 15000);

  it('calls onBatchProgress after each batch with correct args', async () => {
    mockAnthropicResponse({ extracted: [{ name: 'A' }], skipped: [] });

    const records = [{ Name: 'A', Email: 'a@test.com' }];
    const onProgress = jest.fn();

    await extractRecords(records, onProgress);

    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(1, 1, expect.any(Number), expect.any(Number));
  });

  it('strips markdown code fences from the AI response before parsing', async () => {
    const data = { extracted: [{ name: 'John', email: 'j@test.com' }], skipped: [] };
    const mockCreate = jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: `\`\`\`json\n${JSON.stringify(data)}\n\`\`\`` }],
    });
    MockAnthropic.mockImplementation(
      () => ({ messages: { create: mockCreate } }) as unknown as Anthropic,
    );

    const result = await extractRecords([{ Name: 'John', Email: 'j@test.com' }]);
    expect(result.extracted).toHaveLength(1);
    expect(result.extracted[0].name).toBe('John');
  });

  it('includes correct meta totals', async () => {
    const responseData = {
      extracted: [{ name: 'John' }, { name: 'Jane' }],
      skipped: [{ row: 3, reason: 'No contact info', data: {} }],
    };
    mockAnthropicResponse(responseData);

    const records = Array.from({ length: 3 }, (_, i) => ({ Name: `P${i}` }));
    const result = await extractRecords(records);

    expect(result.meta.total).toBe(3);
    expect(result.meta.extracted).toBe(2);
    expect(result.meta.skipped).toBe(1);
    expect(result.meta.batches).toBe(1);
    expect(typeof result.meta.processingTimeMs).toBe('number');
  });
});
