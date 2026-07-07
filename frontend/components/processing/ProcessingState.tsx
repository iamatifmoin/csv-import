interface ProcessingStateProps {
  currentBatch: number;
  totalBatches: number;
  totalRecords: number;
}

export default function ProcessingState({
  currentBatch,
  totalBatches,
  totalRecords,
}: ProcessingStateProps) {
  const progressPercent = totalBatches > 0 ? Math.round((currentBatch / totalBatches) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-zinc-300 animate-spin" />
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-sm font-medium text-zinc-100">
          {currentBatch === 0
            ? 'Uploading file…'
            : currentBatch >= totalBatches
            ? 'Finalizing extraction…'
            : `Processing batch ${currentBatch} of ${totalBatches}…`}
        </p>
        <p className="text-xs text-zinc-500">
          {totalRecords > 0 && `${totalRecords.toLocaleString()} records · `}
          Claude AI is mapping your CSV columns to CRM fields
        </p>
      </div>

      {totalBatches > 0 && (
        <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-300 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
