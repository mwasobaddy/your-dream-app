import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TacticalShell } from "@/components/layout/TacticalShell";
import { sessionStorageService } from "@/services/storage/sessionStorageService";
import type { SightSession } from "@/types/session";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationEllipsis,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ExportPanel } from "@/components/export/ExportPanel";
import { CheckCircle2, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

const HistoryPage = () => {
  const [sessions, setSessions] = useState<SightSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    sessionStorageService
      .getAll()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(sessions.length / ITEMS_PER_PAGE));
  const paginatedSessions = useMemo(
    () => sessions.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [sessions, page],
  );

  // Reset to page 1 when sessions change
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  return (
    <TacticalShell>
      <div className="space-y-5">
        <header className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">History</h2>
          <p className="text-sm text-muted-foreground">
            All sessions are stored on this device only.
          </p>
        </header>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">No sessions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Complete your first session to see it here.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link to="/">Start a session</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Showing page {page} of {totalPages} ({sessions.length} total sessions)
            </p>

            <ul className="space-y-2">
              {paginatedSessions.map((s) => (
                <li
                  key={s.session_id}
                  className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {new Date(s.timestamp_start_iso).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        {s.session_id.slice(0, 8)}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider whitespace-nowrap",
                        s.session_completion
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      )}
                    >
                      {s.session_completion ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {s.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                    {(["scan", "identify", "ground_heal", "track"] as const).map((step) => (
                      <span
                        key={step}
                        className={cn(
                          "rounded-full border px-2 py-0.5",
                          s.steps[step]
                            ? "border-success/40 text-success bg-success/5"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        {step.replace("_", " ")}
                      </span>
                    ))}
                  </div>

                  {/* Export controls for completed sessions */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {s.device_metadata?.platform || ''}
                    </span>
                    {s.session_completion && (
                      <ExportPanel session={s} />
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={(e) => {
                        e.preventDefault();
                        goToPage(page - 1);
                      }}
                      href="#"
                      className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      // Show first, last, and pages around current
                      return (
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - page) <= 2
                      );
                    })
                    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                      // Insert ellipsis between gaps
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                        acc.push("...");
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p) =>
                      p === "..." ? (
                        <PaginationItem key={`ellipsis-${Math.random()}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink
                            href="#"
                            isActive={p === page}
                            onClick={(e) => {
                              e.preventDefault();
                              goToPage(p);
                            }}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={(e) => {
                        e.preventDefault();
                        goToPage(page + 1);
                      }}
                      href="#"
                      className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </TacticalShell>
  );
};

export default HistoryPage;
