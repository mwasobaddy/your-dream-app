import { useEffect, useState } from "react";
import { TacticalShell } from "@/components/layout/TacticalShell";
import { sessionStorageService } from "@/services/storage/sessionStorageService";
import { jsonExportService } from "@/services/export/jsonExportService";
import { csvExportService } from "@/services/export/csvExportService";
import { pdfExportService } from "@/services/export/pdfExportService";
import { getOrCreateDeviceUUID } from "@/lib/identity";
import { APP_CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Database, Smartphone, Trash2, Download, FileJson, FileText, Table } from "lucide-react";

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

type ExportFormat = "pdf" | "csv" | "json";

const SettingsPage = () => {
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null);
  const [deviceUuid, setDeviceUuid] = useState("");
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  useEffect(() => {
    setDeviceUuid(getOrCreateDeviceUUID());
    sessionStorageService.getStorageEstimate().then(setUsage);
  }, []);

  const handleExportAll = async (format: ExportFormat) => {
    setExportingFormat(format);
    try {
      const sessions = await sessionStorageService.getAll();
      if (sessions.length === 0) {
        toast.info("No sessions to export");
        return;
      }

      switch (format) {
        case "json":
          jsonExportService.downloadAll(sessions);
          break;
        case "csv":
          csvExportService.downloadAll(sessions);
          break;
        case "pdf":
          await pdfExportService.downloadAll(sessions);
          break;
      }

      toast.success(`Exported ${sessions.length} session(s) as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Export failed:', err);
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setExportingFormat(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Delete ALL sessions on this device? This cannot be undone.")) return;
    await sessionStorageService.deleteAll();
    toast.success("All sessions deleted");
    sessionStorageService.getStorageEstimate().then(setUsage);
  };

  const pct = usage && usage.quota > 0 ? (usage.usage / usage.quota) * 100 : 0;

  return (
    <TacticalShell>
      <div className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Storage, device, and data controls.
          </p>
        </header>

        <section className="rounded-2xl bg-card border border-border/60 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Database className="h-4 w-4 text-brand" /> Storage
          </div>
          {usage ? (
            <>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-brand"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Using {formatBytes(usage.usage)} of {formatBytes(usage.quota)}{" "}
                ({pct.toFixed(2)}%)
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Storage estimate not available on this browser.
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-card border border-border/60 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Smartphone className="h-4 w-4 text-brand" /> Device
          </div>
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              Anonymous device ID
            </p>
            <p className="font-mono text-xs break-all bg-muted rounded-md p-2">
              {deviceUuid}
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            App {APP_CONFIG.APP_VERSION} · Schema v{APP_CONFIG.SCHEMA_VERSION}
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border/60 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Download className="h-4 w-4 text-brand" /> Export all data
          </div>
          <p className="text-xs text-muted-foreground">
            Download every session on this device. Choose your preferred format.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportAll("pdf")}
              disabled={exportingFormat !== null}
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              {exportingFormat === "pdf" ? "Preparing PDF…" : "Export as PDF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportAll("csv")}
              disabled={exportingFormat !== null}
            >
              <Table className="mr-1.5 h-3.5 w-3.5" />
              {exportingFormat === "csv" ? "Preparing CSV…" : "Export as CSV"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportAll("json")}
              disabled={exportingFormat !== null}
            >
              <FileJson className="mr-1.5 h-3.5 w-3.5" />
              {exportingFormat === "json" ? "Preparing JSON…" : "Export as JSON"}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-destructive/20 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <Trash2 className="h-4 w-4" /> Danger zone
          </div>
          <p className="text-xs text-muted-foreground">
            Permanently remove every session record from this device.
          </p>
          <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
            Delete all sessions
          </Button>
        </section>
      </div>
    </TacticalShell>
  );
};

export default SettingsPage;
