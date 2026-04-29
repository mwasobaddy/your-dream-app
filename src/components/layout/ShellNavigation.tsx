import { NavLink } from "react-router-dom";
import { Home, ListChecks, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/history", label: "Session", icon: ListChecks },
  { to: "/settings", label: "Settings", icon: Settings2 },
] as const;

export function ShellNavigation() {
  return (
    <nav aria-label="Primary navigation">
      <ul className="flex items-center gap-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <li key={label}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                  isActive
                    ? "border-border/80 bg-muted/70 text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border/80 hover:bg-muted/70 hover:text-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden md:inline">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
