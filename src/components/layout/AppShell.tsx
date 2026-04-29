import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { APP_CONFIG } from "@/lib/config";
import { ShellNavigation } from "@/components/layout/ShellNavigation";

interface AppShellProps {
  children: React.ReactNode;
  /** When true, shows a back arrow that calls onBack or navigates to "/" */
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}

export function AppShell({
  children,
  showBack,
  onBack,
  title,
  subtitle,
}: AppShellProps) {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {showBack ? (
              <button
                onClick={onBack}
                className="rounded-full p-2 -ml-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <Link to="/" className="flex items-center gap-2" aria-label="Home">
                <div className="h-8 w-8 rounded-lg bg-gradient-brand grid place-items-center shadow-glow">
                  <span className="text-brand-foreground text-xs font-bold tracking-tight">SL</span>
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">{APP_CONFIG.APP_NAME}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    v{APP_CONFIG.APP_VERSION} · Research
                  </div>
                </div>
              </Link>
            )}
            {title && (
              <div className="ml-2 min-w-0">
                <h1 className="text-sm font-semibold truncate">{title}</h1>
                {subtitle && (
                  <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end min-w-0">
            <ShellNavigation />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-24">{children}</main>
    </div>
  );
}
