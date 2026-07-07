import Anthropic from '@anthropic-ai/sdk';
import type {
  RawRecord,
  CRMRecord,
  SkippedRecord,
  ExtractionResult,
} from '../types/crm.types';
import { buildExtractionPrompt } from '../prompts/extraction';

const BATCH_SIZE = 15;
const MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 1000;



export type ProgressCallback = (
  batchNumber: number,
  totalBatches: number,
  extractedInBatch: number,
  skippedInBatch: number,
) => void;

/**
 * Splits an array into chunks of the given size.
 * @param arr - Array to chunk.
 * @param size - Maximum chunk size.
 * @returns Chunked arrays.
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }

  return chunks;
}

/**
 * Sleeps for the given number of milliseconds.
 * @param ms - Delay duration.
 * @returns Promise that resolves after the delay.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ResponseBlock = {
  type: string;
  text?: string;
};

/**
 * Extracts a text payload from the Anthropic response content blocks.
 * @param content - Anthropic content blocks.
 * @returns Concatenated text content.
 */
function getResponseText(content: readonly ResponseBlock[]): string {
  return content
    .filter((block): block is ResponseBlock & { type: 'text'; text: string } => {
      return block.type === 'text' && typeof block.text === 'string';
    })
    .map((block) => block.text)
    .join('');
}

/**
 * Cleans a Claude response so it can be parsed as JSON.
 * @param raw - Raw text content from the model.
 * @returns Trimmed JSON string.
 */
function cleanResponse(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

/**
 * Calls Claude to extract CRM records from a single batch of raw records.
 * Retries up to MAX_RETRIES times with exponential backoff on failure.
 *
 * @param batch - Raw records in this batch.
 * @param batchIndex - 0-indexed batch number.
 * @returns Partial extraction result for this batch.
 */
async function extractBatch(
  batch: RawRecord[],
  batchIndex: number,
): Promise<{ extracted: CRMRecord[]; skipped: SkippedRecord[] }> {

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const headers = batch.length > 0 ? Object.keys(batch[0]) : [];
  const { system, user } = buildExtractionPrompt(headers, batch);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system,
        messages: [{ role: 'user', content: user }],
      });

      const raw = getResponseText(response.content);
      const cleaned = cleanResponse(raw);
      const parsed = JSON.parse(cleaned) as {
        extracted?: CRMRecord[];
        skipped?: SkippedRecord[];
      };

      if (!Array.isArray(parsed.extracted) || !Array.isArray(parsed.skipped)) {
        throw new Error('AI response missing extracted or skipped arrays.');
      }

      return {
        extracted: parsed.extracted,
        skipped: parsed.skipped,
      };
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `[AI] Batch ${batchIndex + 1} attempt ${attempt + 1} failed. Retrying in ${delay}ms...`,
          lastError.message,
        );
        await sleep(delay);
      }
    }
  }

  console.error(
    `[AI] Batch ${batchIndex + 1} failed after ${MAX_RETRIES + 1} attempts. Marking as skipped.`,
    lastError?.message,
  );

  const skipped: SkippedRecord[] = batch.map((data, rowIndex) => ({
    row: rowIndex + 1,
    reason: `AI extraction failed: ${lastError?.message ?? 'Unknown error'}`,
    data,
  }));

  return { extracted: [], skipped };
}

/**
 * Extracts CRM records from all raw CSV rows using Claude AI.
 * Processes records in batches of BATCH_SIZE (15).
 * Streams progress via the onBatchProgress callback.
 *
 * @param rawRecords - All parsed CSV rows.
 * @param onBatchProgress - Called after each batch completes (for SSE streaming).
 * @returns Full extraction result with extracted records, skipped records, and meta.
 */
export async function extractRecords(
  rawRecords: RawRecord[],
  onBatchProgress?: ProgressCallback,
): Promise<ExtractionResult> {
  const startTime = Date.now();
  const batches = chunkArray(rawRecords, BATCH_SIZE);
  const totalBatches = batches.length;
  const allExtracted: CRMRecord[] = [];
  const allSkipped: SkippedRecord[] = [];

  try {
    for (let i = 0; i < batches.length; i += 1) {
      const { extracted, skipped } = await extractBatch(batches[i], i);
      allExtracted.push(...extracted);
      allSkipped.push(...skipped);
      onBatchProgress?.(i + 1, totalBatches, extracted.length, skipped.length);
    }

    return {
      extracted: allExtracted,
      skipped: allSkipped,
      meta: {
        total: rawRecords.length,
        extracted: allExtracted.length,
        skipped: allSkipped.length,
        batches: totalBatches,
        processingTimeMs: Date.now() - startTime,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown extraction error.';
    throw new Error(message);
  }
}

// Exported for unit testing only
export { chunkArray };
