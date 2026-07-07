// Re-export shared types so all component imports use this path.
export type {
  CRMRecord,
  CRMStatus,
  DataSource,
  RawRecord,
  SkippedRecord,
  BatchProgress,
  ExtractionResult,
  SSEEvent,
} from '@groweasy/shared';

// Frontend-only types
export interface PreviewData {
  headers: string[];
  /** First 50 rows for display. */
  rows: Record<string, string>[];
  /** Total rows in the full CSV (may exceed rows.length). */
  totalRows: number;
}
