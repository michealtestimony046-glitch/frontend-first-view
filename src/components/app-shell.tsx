import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  Bug,
  Settings,
  Radio,
  Terminal,
  Sparkles,
  ChevronDown,
  Search,
} from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "./logo";

type NavItem = {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  badge?: string;
};

const nav: NavItem[] = [
  { label: "Runs", to: "/app", icon: LayoutDashboard },
  { label: "Projects", to: "/app", icon: FolderKanban },
  { label: "Bugs", to: "/app", icon: Bug, badge: "3" },
  { label: "Console", to: "/app", icon: Terminal },
  { label: "Live workers", to: "/app", icon: Radio },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface/60 backdrop-blur md:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Logo />
        </div>

        <div className="border-b border-border px-3 py-3">
          <button className="flex w-full items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent">
            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-primary to-primary/40 font-mono text-[10px] font-bold text-primary-foreground">
                A
              </span>
              <span>
                <span className="block text-foreground">Acme Inc</span>
                <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  workspace
                </span>
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {nav.map((item) => {
            const active =
              (item.to === "/app" && pathname === "/app") ||
              (item.to !== "/app" && pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                {item.badge && (
                  <span className="rounded-md bg-destructive/15 px-1.5 py-0.5 font-mono text-[10px] font-medium text-destructive">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="rounded-lg border border-border bg-gradient-to-b from-primary/10 to-transparent p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-display text-sm font-semibold">
                v1 Preview
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Core engine proof. Sequential browser worker + evidence capture.
            </p>
          </div>

          <button className="mt-3 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <div className="md:hidden">
            <Logo />
          </div>
          <div className="hidden flex-1 md:block">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search runs, bugs, scenarios…"
                className="w-full rounded-md border border-border bg-surface-2/50 py-1.5 pl-9 pr-16 text-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-border bg-surface/60 px-2.5 py-1 text-[11px] text-muted-foreground md:inline-flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-success/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              <span className="font-mono">1 worker online</span>
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/70 to-primary/20 font-mono text-[11px] font-semibold text-primary-foreground">
              JC
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
