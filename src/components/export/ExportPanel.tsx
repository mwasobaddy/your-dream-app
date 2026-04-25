import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, FileText, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';
import { pdfExportService } from '@/services/export/pdfExportService';
import { csvExportService } from '@/services/export/csvExportService';
import { jsonExportService } from '@/services/export/jsonExportService';
import type { SightSession } from '@/types/session';

type ExportFormat = 'pdf' | 'csv' | 'json';

interface ExportPanelProps {
  session: SightSession;
  /** Label variant — 'card' for compact in-list export, 'page' for full-width on detail view */
  variant?: 'card' | 'page';
}

export function ExportPanel({ session, variant = 'card' }: ExportPanelProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [open, setOpen] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    try {
      switch (format) {
        case 'pdf':
          await pdfExportService.downloadSession(session);
          break;
        case 'csv':
          csvExportService.downloadSession(session);
          break;
        case 'json':
          jsonExportService.downloadSession(session);
          break;
      }
    } catch (err) {
      console.error(`Export (${format}) failed:`, err);
    } finally {
      setExporting(null);
      setOpen(false);
    }
  };

  const triggerLabel = exporting ? 'Exporting…' : 'Export';
  const triggerIcon = exporting ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <FileDown className="h-4 w-4" />
  );

  if (variant === 'page') {
    // Full-width variant — three buttons side by side
    return (
      <div className="flex flex-wrap gap-2">
        {(['pdf', 'csv', 'json'] as const).map((fmt) => {
          const isBusy = exporting === fmt;
          return (
            <Button
              key={fmt}
              variant="outline"
              size="sm"
              onClick={() => handleExport(fmt)}
              disabled={!!exporting}
              className="gap-2"
            >
              {isBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : fmt === 'pdf' ? (
                <FileText className="h-4 w-4" />
              ) : fmt === 'csv' ? (
                <FileSpreadsheet className="h-4 w-4" />
              ) : (
                <FileJson className="h-4 w-4" />
              )}
              {fmt.toUpperCase()}
            </Button>
          );
        })}
      </div>
    );
  }

  // Compact variant — dropdown trigger
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        disabled={!!exporting}
        className="gap-2 text-xs"
      >
        {triggerIcon}
        {triggerLabel}
      </Button>

      {open && (
        <>
          {/* Backdrop to close on click outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-xl border border-border/60 bg-card p-1 shadow-lg">
            {(['pdf', 'csv', 'json'] as const).map((fmt) => {
              const isBusy = exporting === fmt;
              return (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt)}
                  disabled={!!exporting}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {isBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : fmt === 'pdf' ? (
                    <FileText className="h-3.5 w-3.5" />
                  ) : fmt === 'csv' ? (
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                  ) : (
                    <FileJson className="h-3.5 w-3.5" />
                  )}
                  {fmt.toUpperCase()} file
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
