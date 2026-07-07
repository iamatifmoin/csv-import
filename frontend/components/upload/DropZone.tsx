'use client';

import { useState, useCallback, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

interface DropZoneProps {
  onFileAccepted: (file: File) => void;
  isLoading?: boolean;
}

export default function DropZone({ onFileAccepted, isLoading = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
        setError('Please upload a CSV file (.csv)');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('File is too large. Maximum size is 10 MB.');
        return;
      }

      setSelectedFile(file);
      onFileAccepted(file);
    },
    [onFileAccepted],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isLoading && inputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200
          ${isDragging ? 'border-zinc-400 bg-zinc-800/60' : 'border-zinc-700 bg-zinc-900/40 hover:border-zinc-600 hover:bg-zinc-900/60'}
          ${isLoading ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv,application/vnd.ms-excel"
          className="hidden"
          onChange={handleInputChange}
          disabled={isLoading}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-100">{selectedFile.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{formatFileSize(selectedFile.size)}</p>
            </div>
            <p className="text-xs text-zinc-600">Click to change file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-colors ${isDragging ? 'bg-zinc-700 border-zinc-500' : 'bg-zinc-800 border-zinc-700'}`}>
              <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                {isDragging ? 'Drop it here' : 'Drop your CSV here'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">or click to browse — max 10 MB</p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {['Facebook Leads', 'Google Ads', 'Real Estate CRM', 'Sales Reports', 'Excel Exports'].map((label) => (
                <span key={label} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700/50">
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2.5 text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
