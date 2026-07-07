'use client';

import { useCallback, useState } from 'react';
import StepIndicator from '@/components/ui/StepIndicator';
import DropZone from '@/components/upload/DropZone';
import PreviewTable from '@/components/preview/PreviewTable';
import ProcessingState from '@/components/processing/ProcessingState';
import SummaryCards from '@/components/results/SummaryCards';
import ResultsTable from '@/components/results/ResultsTable';
import SkippedRecords from '@/components/results/SkippedRecords';
import { parseCSVPreview } from '@/lib/csv';
import { extractCSV, downloadResultsCSV } from '@/lib/api';
import type { PreviewData, ExtractionResult, SSEEvent } from '@/lib/types';

type Step = 'upload' | 'preview' | 'processing' | 'results';

const STEP_NUMBER: Record<Step, 1 | 2 | 3 | 4> = {
  upload: 1,
  preview: 2,
  processing: 3,
  results: 4,
};

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function Home() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsingPreview, setIsParsingPreview] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, totalRecords: 0 });
  const [toast, setToast] = useState<Toast | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleFileAccepted = useCallback(async (acceptedFile: File) => {
    setFile(acceptedFile);
    setError(null);
    setIsParsingPreview(true);

    try {
      const data = await parseCSVPreview(acceptedFile);
      if (data.totalRows === 0) {
        setError('This CSV file has no data rows.');
        return;
      }
      setPreviewData(data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file.');
    } finally {
      setIsParsingPreview(false);
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!file) return;
    setStep('processing');
    setError(null);
    setBatchProgress({ current: 0, total: 0, totalRecords: 0 });

    try {
      const extracted = await extractCSV(file, (event: SSEEvent) => {
        if (event.type === 'start') {
          setBatchProgress({ current: 0, total: event.totalBatches, totalRecords: event.totalRecords });
        }
        if (event.type === 'batch') {
          setBatchProgress((progress) => ({ ...progress, current: event.batchNumber }));
        }
      });

      setResult(extracted);
      setStep('results');
      showToast(`${extracted.meta.extracted} records imported successfully`, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Extraction failed. Please try again.';
      setError(message);
      setStep('preview');
      showToast(message, 'error');
    }
  }, [file, showToast]);

  const handleReset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setPreviewData(null);
    setResult(null);
    setError(null);
    setBatchProgress({ current: 0, total: 0, totalRecords: 0 });
  }, []);

  const handleDownloadCSV = useCallback(() => {
    if (!result) return;
    downloadResultsCSV(result.extracted, 'groweasy-crm');
    showToast('CSV downloaded');
  }, [result, showToast]);

  const handleCopyJSON = useCallback(async () => {
    if (!result || isCopying) return;
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.extracted, null, 2));
      showToast('Copied to clipboard');
    } catch {
      showToast('Failed to copy', 'error');
    } finally {
      setIsCopying(false);
    }
  }, [result, isCopying, showToast]);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12">
      {toast && (
        <div
          className={`
            fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl border transition-all
            ${toast.type === 'success'
              ? 'bg-zinc-900 border-emerald-500/30 text-emerald-400'
              : 'bg-zinc-900 border-red-500/30 text-red-400'}
          `}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        <div className="flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-400 font-medium">GrowEasy CRM</span>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight text-center">
            CSV Importer
          </h1>
          <p className="text-sm text-zinc-500 text-center max-w-md">
            Upload any CSV - Facebook leads, Google Ads exports, real estate CRMs. AI maps your columns automatically.
          </p>
        </div>

        <div className="flex justify-center">
          <StepIndicator currentStep={STEP_NUMBER[step]} />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-start gap-2.5">
            <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8">
          {step === 'upload' && (
            <DropZone onFileAccepted={handleFileAccepted} isLoading={isParsingPreview} />
          )}

          {step === 'preview' && previewData && (
            <PreviewTable
              data={previewData}
              onConfirm={handleConfirm}
              onReset={handleReset}
            />
          )}

          {step === 'processing' && (
            <ProcessingState
              currentBatch={batchProgress.current}
              totalBatches={batchProgress.total}
              totalRecords={batchProgress.totalRecords}
            />
          )}

          {step === 'results' && result && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-base font-semibold text-zinc-100">Extraction Complete</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    AI processed your CSV using {result.meta.batches} {result.meta.batches === 1 ? 'batch' : 'batches'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJSON}
                    disabled={isCopying}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isCopying ? 'Copying…' : 'Copy JSON'}
                  </button>
                  <button
                    onClick={handleDownloadCSV}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors"
                  >
                    Download CSV
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 py-1.5 text-xs font-semibold bg-zinc-100 text-zinc-950 hover:bg-white rounded-lg transition-colors"
                  >
                    Import Another
                  </button>
                </div>
              </div>

              <SummaryCards result={result} />

              {result.extracted.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Extracted Records
                  </p>
                  <ResultsTable records={result.extracted} />
                </div>
              )}

              {result.skipped.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Skipped Records
                  </p>
                  <SkippedRecords records={result.skipped} />
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-zinc-700">
          Powered by Claude AI - GrowEasy CRM Importer
        </p>
      </div>
    </main>
  );
}
