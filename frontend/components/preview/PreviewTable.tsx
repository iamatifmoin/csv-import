'use client';

import { useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { PreviewData } from '@/lib/types';

interface PreviewTableProps {
  data: PreviewData;
  onConfirm: () => void;
  onReset: () => void;
}

export default function PreviewTable({ data, onConfirm, onReset }: PreviewTableProps) {
  const { headers, rows, totalRows } = data;
  const containerRef = useRef<HTMLDivElement>(null);

  const columnHelper = createColumnHelper<Record<string, string>>();

  const columns = headers.map((header) =>
    columnHelper.accessor(header, {
      id: header,
      header: () => (
        <span className="whitespace-nowrap text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          {header}
        </span>
      ),
      cell: (info) => (
        <span className="text-xs text-zinc-300 whitespace-nowrap max-w-[200px] truncate block">
          {info.getValue() ?? ''}
        </span>
      ),
    }),
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows: tableRows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalHeight - virtualRows[virtualRows.length - 1].end : 0;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-100">
            {totalRows.toLocaleString()} {totalRows === 1 ? 'row' : 'rows'}
          </span>
          {totalRows > rows.length && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              Showing first {rows.length}
            </span>
          )}
          <span className="text-xs text-zinc-600">
            {headers.length} columns
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg border border-zinc-700 hover:border-zinc-600"
          >
            Upload Different File
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 text-xs font-semibold bg-zinc-100 text-zinc-950 hover:bg-white rounded-lg transition-colors"
          >
            Confirm Import
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="overflow-auto rounded-lg border border-zinc-800 max-h-[55vh]"
      >
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2.5 text-left bg-zinc-900 whitespace-nowrap"
                    style={{ minWidth: 140 }}
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
                  className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors"
                  style={{ height: 40 }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2" style={{ minWidth: 140 }}>
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
    </div>
  );
}
