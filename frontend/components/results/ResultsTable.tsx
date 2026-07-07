'use client';

import { useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { CRMRecord } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';

interface ResultsTableProps {
  records: CRMRecord[];
}

const COLUMN_ORDER: (keyof CRMRecord)[] = [
  'name',
  'email',
  'mobile_without_country_code',
  'country_code',
  'crm_status',
  'company',
  'city',
  'state',
  'country',
  'lead_owner',
  'data_source',
  'crm_note',
  'created_at',
  'possession_time',
  'description',
];

const COLUMN_LABELS: Record<keyof CRMRecord, string> = {
  name: 'Name',
  email: 'Email',
  mobile_without_country_code: 'Mobile',
  country_code: 'CC',
  crm_status: 'Status',
  company: 'Company',
  city: 'City',
  state: 'State',
  country: 'Country',
  lead_owner: 'Lead Owner',
  data_source: 'Source',
  crm_note: 'Note',
  created_at: 'Created',
  possession_time: 'Possession',
  description: 'Description',
};

const COLUMN_WIDTHS: Partial<Record<keyof CRMRecord, number>> = {
  name: 160,
  email: 200,
  crm_status: 120,
  crm_note: 220,
  description: 220,
  created_at: 160,
};

export default function ResultsTable({ records }: ResultsTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const columnHelper = createColumnHelper<CRMRecord>();

  const columns = COLUMN_ORDER.map((key) =>
    columnHelper.accessor(key, {
      id: key,
      header: () => (
        <span className="whitespace-nowrap text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          {COLUMN_LABELS[key]}
        </span>
      ),
      cell: (info) => {
        const value = info.getValue();

        if (key === 'crm_status') {
          return <StatusBadge status={value as CRMRecord['crm_status']} />;
        }

        if (!value) {
          return <span className="text-zinc-700 text-xs">—</span>;
        }

        return (
          <span
            className="text-xs text-zinc-300 block truncate"
            title={value}
            style={{ maxWidth: COLUMN_WIDTHS[key] ?? 140 }}
          >
            {value}
          </span>
        );
      },
      size: COLUMN_WIDTHS[key] ?? 140,
    }),
  );

  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows: tableRows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalHeight - virtualRows[virtualRows.length - 1].end : 0;

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-zinc-600 border border-zinc-800 rounded-lg">
        No records extracted.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-auto rounded-lg border border-zinc-800 max-h-[60vh]"
    >
      <table className="w-full border-collapse" style={{ minWidth: COLUMN_ORDER.length * 140 }}>
        <thead className="sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-zinc-900 border-b border-zinc-800">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2.5 text-left"
                  style={{ width: header.column.getSize(), minWidth: header.column.getSize() }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: paddingTop }} colSpan={columns.length} />
            </tr>
          )}
          {virtualRows.map((virtualRow) => {
            const row = tableRows[virtualRow.index];
            return (
              <tr
                key={row.id}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors"
                style={{ height: 44 }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-2"
                    style={{ width: cell.column.getSize(), minWidth: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: paddingBottom }} colSpan={columns.length} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
