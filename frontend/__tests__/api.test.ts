import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractCSV } from '../lib/api';

describe('extractCSV', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Builds a mock fetch Response that streams the given SSE events.
   */
  function buildSSEResponse(events: object[]): Response {
    const sseText = events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('');
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseText));
        controller.close();
      },
    });

    return { ok: true, body: stream } as unknown as Response;
  }

  it('throws on a non-200 HTTP response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      }),
    );

    const file = new File([''], 'test.csv', { type: 'text/csv' });
    await expect(extractCSV(file, vi.fn())).rejects.toThrow('Server error 500');
  });

  it('calls onProgress for every SSE event received', async () => {
    const events = [
      { type: 'start', totalBatches: 1, totalRecords: 2 },
      { type: 'batch', batchNumber: 1, totalBatches: 1, extractedInBatch: 2, skippedInBatch: 0 },
      { type: 'complete', result: { extracted: [], skipped: [], meta: { total: 2, extracted: 2, skipped: 0, batches: 1, processingTimeMs: 500 } } },
    ];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(buildSSEResponse(events)));

    const onProgress = vi.fn();
    const file = new File([''], 'test.csv', { type: 'text/csv' });
    await extractCSV(file, onProgress);

    expect(onProgress).toHaveBeenCalledTimes(3);
  });

  it('returns the ExtractionResult from the complete event', async () => {
    const mockResult = {
      extracted: [{ name: 'John', email: 'john@test.com' }],
      skipped: [],
      meta: { total: 1, extracted: 1, skipped: 0, batches: 1, processingTimeMs: 300 },
    };
    const events = [
      { type: 'start', totalBatches: 1, totalRecords: 1 },
      { type: 'complete', result: mockResult },
    ];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(buildSSEResponse(events)));

    const file = new File([''], 'test.csv', { type: 'text/csv' });
    const result = await extractCSV(file, vi.fn());

    expect(result.extracted).toHaveLength(1);
    expect(result.extracted[0].name).toBe('John');
    expect(result.meta.processingTimeMs).toBe(300);
  });

  it('throws the message from an error SSE event', async () => {
    const events = [
      { type: 'start', totalBatches: 1, totalRecords: 1 },
      { type: 'error', message: 'AI service rate limited' },
    ];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(buildSSEResponse(events)));

    const file = new File([''], 'test.csv', { type: 'text/csv' });
    await expect(extractCSV(file, vi.fn())).rejects.toThrow('AI service rate limited');
  });

  it('throws if stream ends without a complete event', async () => {
    const events = [
      { type: 'start', totalBatches: 1, totalRecords: 1 },
    ];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(buildSSEResponse(events)));

    const file = new File([''], 'test.csv', { type: 'text/csv' });
    await expect(extractCSV(file, vi.fn())).rejects.toThrow('Stream ended without a complete event');
  });

  it('silently ignores malformed SSE lines', async () => {
    const encoder = new TextEncoder();
    const sseText = [
      'data: not valid json\n\n',
      `data: ${JSON.stringify({ type: 'start', totalBatches: 1, totalRecords: 1 })}\n\n`,
      `data: ${JSON.stringify({ type: 'complete', result: { extracted: [], skipped: [], meta: { total: 0, extracted: 0, skipped: 0, batches: 1, processingTimeMs: 100 } } })}\n\n`,
    ].join('');

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseText));
        controller.close();
      },
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body: stream }));

    const file = new File([''], 'test.csv', { type: 'text/csv' });
    const result = await extractCSV(file, vi.fn());
    expect(result).toBeDefined();
  });
});
