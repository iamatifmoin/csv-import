export type CRMStatus =
  | 'GOOD_LEAD_FOLLOW_UP'
  | 'DID_NOT_CONNECT'
  | 'BAD_LEAD'
  | 'SALE_DONE';

export type DataSource =
  | 'leads_on_demand'
  | 'meridian_tower'
  | 'eden_park'
  | 'varah_swamy'
  | 'sarjapur_plots'
  | '';

export interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CRMStatus | '';
  crm_note: string;
  data_source: DataSource;
  possession_time: string;
  description: string;
}

export type RawRecord = Record<string, string>;

export interface SkippedRecord {
  row: number;
  reason: string;
  data: RawRecord;
}

export interface BatchProgress {
  batchNumber: number;
  totalBatches: number;
  extractedInBatch: number;
  skippedInBatch: number;
}

export interface ExtractionResult {
  extracted: CRMRecord[];
  skipped: SkippedRecord[];
  meta: {
    total: number;
    extracted: number;
    skipped: number;
    batches: number;
    processingTimeMs: number;
  };
}

export type SSEEvent =
  | { type: 'start'; totalBatches: number; totalRecords: number }
  | ({ type: 'batch' } & BatchProgress)
  | { type: 'complete'; result: ExtractionResult }
  | { type: 'error'; message: string };
