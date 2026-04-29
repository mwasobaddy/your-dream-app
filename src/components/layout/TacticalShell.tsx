import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CamoBackground } from "@/components/layout/CamoBackground";

interface TacticalShellProps {
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}

/**
 * Full-viewport shell with camo background and glass content area.
 * Replaces AppShell for the dark tactical redesign.
 */
export function TacticalShell({
  children,
  showBack,
  onBack,
  title,
  subtitle,
}: TacticalShellProps) {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      <CamoBackground />

      {/* Content area — scrollable, z-index above camo */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        {/* Header */}
        <header
          className="glass"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            borderBottom: "1px solid hsl(var(--border) / 0.3)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              margin: "0 auto",
              maxWidth: "42rem",
              width: "100%",
              padding: "0.75rem 1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
              {showBack ? (
                <button
                  onClick={onBack}
                  style={{
                    borderRadius: "50%",
                    padding: "0.5rem",
                    marginLeft: "-0.5rem",
                    color: "hsl(var(--muted-foreground))",
                    transition: "color 0.15s",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  aria-label="Back"
                >
                  <ArrowLeft style={{ width: "1.25rem", height: "1.25rem" }} />
                </button>
              ) : (
                <Link
                  to="/"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}
                  aria-label="Home"
                >
                  <div
                    className="bg-gradient-brand shadow-glow"
                    style={{
                      height: "2rem",
                      width: "2rem",
                      borderRadius: "0.5rem",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <span
                      style={{
                        color: "hsl(var(--brand-foreground))",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        letterSpacing: "-0.025em",
                      }}
                    >
                      SI
                    </span>
                  </div>
                </Link>
              )}
              {title && (
                <div style={{ marginLeft: "0.5rem", minWidth: 0 }}>
                  <h1
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {title}
                  </h1>
                  {subtitle && (
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "hsl(var(--muted-foreground))",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
            {!isHome && !showBack && (
              <Link
                to="/"
                style={{
                  fontSize: "0.75rem",
                  color: "hsl(var(--muted-foreground))",
                  textDecoration: "none",
                }}
              >
                Home
              </Link>
            )}
          </div>
        </header>

        {/* Main content */}
        <main
          style={{
            margin: "0 auto",
            maxWidth: "42rem",
            width: "100%",
            padding: "1.5rem 1rem 6rem",
            flex: 1,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}