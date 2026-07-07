import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload.middleware';
import { parseCSV } from '../services/csv.service';
import { extractRecords } from '../services/ai.service';
import type { SSEEvent } from '../types/crm.types';

export const importRouter = Router();

/**
 * Writes a single SSE event to the response.
 */
function writeSSE(res: Response, event: SSEEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

/**
 * GET /api/health
 * Health check endpoint.
 */
importRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * POST /api/extract
 * Accepts a CSV file and streams extraction progress as SSE events.
 * Sends: start → batch × N → complete (or error).
 */
importRouter.post(
  '/extract',
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      if (!req.file) {
        writeSSE(res, { type: 'error', message: 'No file uploaded.' });
        res.end();
        return;
      }

      const rawRecords = await parseCSV(req.file.buffer);

      if (rawRecords.length === 0) {
        writeSSE(res, { type: 'error', message: 'The CSV file contains no records.' });
        res.end();
        return;
      }

      const totalBatches = Math.ceil(rawRecords.length / 15);
      writeSSE(res, { type: 'start', totalBatches, totalRecords: rawRecords.length });

      const result = await extractRecords(
        rawRecords,
        (batchNumber, totalBatches, extractedInBatch, skippedInBatch) => {
          writeSSE(res, { type: 'batch', batchNumber, totalBatches, extractedInBatch, skippedInBatch });
        },
      );

      writeSSE(res, { type: 'complete', result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error during extraction.';
      writeSSE(res, { type: 'error', message });
    } finally {
      res.end();
    }
  },
);
