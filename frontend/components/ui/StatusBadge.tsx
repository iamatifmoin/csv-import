import type { CRMStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: CRMStatus | '';
}

const CONFIG: Record<CRMStatus, { label: string; className: string }> = {
  GOOD_LEAD_FOLLOW_UP: {
    label: 'Follow Up',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  },
  DID_NOT_CONNECT: {
    label: 'No Connect',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  },
  BAD_LEAD: {
    label: 'Bad Lead',
    className: 'bg-red-500/10 text-red-400 border-red-500/25',
  },
  SALE_DONE: {
    label: 'Sale Done',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-zinc-800 text-zinc-500 border-zinc-700">
        —
      </span>
    );
  }

  const config = CONFIG[status];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${config.className}`}
    >
      {config.label}
    </span>
  );
}
