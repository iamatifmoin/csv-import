'use client';

import { useState } from 'react';
import type { SkippedRecord } from '@/lib/types';

interface SkippedRecordsProps {
  records: SkippedRecord[];
}

export default function SkippedRecords({ records }: SkippedRecordsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (records.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center">
            <span className="text-[9px] font-bold text-red-400">{records.length}</span>
          </div>
          <span className="text-sm font-medium text-zinc-300">
            {records.length} skipped {records.length === 1 ? 'record' : 'records'}
          </span>
          <span className="text-xs text-zinc-600">Missing email and phone</span>
        </div>
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-zinc-800 divide-y divide-zinc-800/60">
          {records.map((record, i) => (
            <div key={i} className="px-4 py-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-zinc-600">Row {record.row}</span>
                <span className="text-xs text-red-400">{record.reason}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {Object.entries(record.data)
                  .filter(([, value]) => value)
                  .slice(0, 6)
                  .map(([key, value]) => (
                    <span key={key} className="text-[11px] text-zinc-500">
                      <span className="text-zinc-700">{key}:</span> {value}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
