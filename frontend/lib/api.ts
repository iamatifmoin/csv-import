import type { CRMRecord, ExtractionResult, SSEEvent } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Sends a CSV file to the backend and streams extraction progress via SSE.
 * Uses fetch + ReadableStream because EventSource doesn't support POST.
 *
 * @param file - The full CSV File object (not just the preview slice).
 * @param onProgress - Called for every SSE event: start, batch, complete, error.
 * @returns The final ExtractionResult from the 'complete' event.
 * @throws Error if the server returns non-200 or if an 'error' SSE event is received.
 */
export async function extractCSV(
  file: File,
  onProgress: (event: SSEEvent) => void,
): Promise<ExtractionResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/api/extract`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Server error ${response.status}${text ? `: ${text}` : ''}`);
  }

  if (!response.body) {
    throw new Error('Response body is empty - SSE stream unavailable.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: ExtractionResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const messages = buffer.split(/\r?\n\r?\n/);
    buffer = messages.pop() ?? '';

    for (const message of messages) {
      const lines = message.split(/\r?\n/);
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        const rawJson = line.slice(6).trim();
        if (!rawJson) continue;

        let event: SSEEvent;
        try {
          event = JSON.parse(rawJson) as SSEEvent;
        } catch {
          continue;
        }

        onProgress(event);

        if (event.type === 'complete') {
          result = event.result;
        }

        if (event.type === 'error') {
          throw new Error(event.message);
        }
      }
    }
  }

  if (!result) {
    throw new Error('Stream ended without a complete event. The server may have crashed mid-batch.');
  }

  return result;
}

/**
 * Converts an array of CRM records into a downloadable CSV file and triggers download.
 * @param records - Extracted CRM records.
 * @param filename - Download filename (without extension).
 */
export function downloadResultsCSV(records: CRMRecord[], filename?: string): void {
  if (records.length === 0) return;

  const headers = Object.keys(records[0]) as (keyof CRMRecord)[];
  const csvRows = [
    headers.join(','),
    ...records.map((record) =>
      headers
        .map((header) => `"${String(record[header] ?? '').replace(/"/g, '""')}"`)
        .join(','),
    ),
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filename ?? 'groweasy-crm'}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
