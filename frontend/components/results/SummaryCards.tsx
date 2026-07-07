import type { ExtractionResult } from '@/lib/types';

interface SummaryCardsProps {
  result: ExtractionResult;
}

export default function SummaryCards({ result }: SummaryCardsProps) {
  const { meta } = result;
  const successRate = meta.total > 0 ? Math.round((meta.extracted / meta.total) * 100) : 0;
  const timeSeconds = (meta.processingTimeMs / 1000).toFixed(1);

  const cards = [
    {
      label: 'Imported',
      value: meta.extracted.toLocaleString(),
      sub: `${successRate}% success rate`,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
      bg: 'bg-emerald-500/5',
    },
    {
      label: 'Skipped',
      value: meta.skipped.toLocaleString(),
      sub: meta.skipped === 0 ? 'No issues found' : 'Missing email & phone',
      color: meta.skipped > 0 ? 'text-red-400' : 'text-zinc-500',
      borderColor: meta.skipped > 0 ? 'border-red-500/20' : 'border-zinc-700',
      bg: meta.skipped > 0 ? 'bg-red-500/5' : 'bg-zinc-800/40',
    },
    {
      label: 'Total Rows',
      value: meta.total.toLocaleString(),
      sub: `${meta.batches} AI ${meta.batches === 1 ? 'batch' : 'batches'}`,
      color: 'text-zinc-300',
      borderColor: 'border-zinc-700',
      bg: 'bg-zinc-800/40',
    },
    {
      label: 'Time',
      value: `${timeSeconds}s`,
      sub: 'Total processing time',
      color: 'text-zinc-300',
      borderColor: 'border-zinc-700',
      bg: 'bg-zinc-800/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-lg border p-4 ${card.borderColor} ${card.bg}`}
        >
          <p className="text-xs text-zinc-500 font-medium mb-1">{card.label}</p>
          <p className={`text-2xl font-semibold tracking-tight ${card.color}`}>{card.value}</p>
          <p className="text-[11px] text-zinc-600 mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
