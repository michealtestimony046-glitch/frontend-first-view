import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Bug,
  FileText,
  Settings,
  ScrollText,
  ChevronDown,
  Bell,
  HelpCircle,
  Menu,
  X,
  MoreHorizontal,
  CreditCard,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo, MatrixMark } from "./logo";

type NavItem = {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
};

const nav: NavItem[] = [
  { label: "Overview", to: "/app", icon: LayoutDashboard },
  { label: "Projects", to: "/app", icon: FolderKanban },
  { label: "Test Runs", to: "/app", icon: ListChecks },
  { label: "Issues", to: "/app", icon: Bug },
  { label: "Audit Log", to: "/app", icon: ScrollText },
  { label: "Reports", to: "/app", icon: FileText },
  { label: "Billing", to: "/app/settings/billing", icon: CreditCard },
  { label: "Settings", to: "/app", icon: Settings },
];

const mobileTabs: NavItem[] = [
  { label: "Overview", to: "/app", icon: LayoutDashboard },
  { label: "Projects", to: "/app", icon: FolderKanban },
  { label: "Runs", to: "/app", icon: ListChecks },
  { label: "Issues", to: "/app", icon: Bug },
];

export function AppShell({
  children,
  title = "Overview",
}: {
  children: ReactNode;
  title?: string;
}) {
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (item: NavItem, index: number) => {
    if (item.to === "/app/settings/billing") return pathname.startsWith("/app/settings/billing");
    return index === 0 && pathname === "/app";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* --- Desktop sidebar --- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface/70 backdrop-blur md:flex">
        <SidebarBody isActive={isActive} />
      </aside>

      {/* --- Mobile drawer --- */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-surface shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <Logo />
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarBody isActive={isActive} onNavigate={() => setDrawerOpen(false)} hideHeader />
          </aside>
        </div>
      )}

      {/* --- Main column --- */}
      <div className="flex min-h-screen flex-col md:pl-60">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <MatrixMark size={22} />
            <span className="truncate font-display text-sm font-semibold">
              {title}
            </span>
          </div>
          <button
            aria-label="Notifications"
            className="relative rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>
        </header>

        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        {/* Mobile bottom tab bar */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur md:hidden">
          <ul className="grid grid-cols-5">
            {mobileTabs.map((t, i) => {
              const Icon = t.icon;
              const active = i === 0 && pathname === "/app";
              return (
                <li key={t.label}>
                  <Link
                    to={t.to}
                    className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                    {t.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <button className="flex w-full flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground">
                <MoreHorizontal className="h-[18px] w-[18px]" />
                More
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

function SidebarBody({
  isActive,
  onNavigate,
  hideHeader,
}: {
  isActive: (item: NavItem, index: number) => boolean;
  onNavigate?: () => void;
  hideHeader?: boolean;
}) {
  return (
    <>
      {!hideHeader && (
        <div className="flex h-14 items-center border-b border-border px-4">
          <Logo />
        </div>
      )}

      <div className="px-3 pb-3 pt-4">
        <p className="mb-2 px-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Workspace
        </p>
        <button className="flex w-full items-center justify-between rounded-md border border-border bg-surface-2/60 px-3 py-2 text-left text-sm transition-colors hover:bg-accent">
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-primary to-primary/40 font-mono text-[10px] font-bold text-primary-foreground">
              A
            </span>
            <span className="truncate">My Workspace</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 px-2">
        {nav.map((item, i) => {
          const active = isActive(item, i);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onNavigate}
              className={`relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              }`}
            >
              {active && (
                <span className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-primary" />
              )}
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-md p-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/70 to-primary/20 font-mono text-[11px] font-semibold text-primary-foreground">
            MJ
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">
              Michael Johnson
            </div>
            <div className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Admin
            </div>
          </div>
          <button
            aria-label="Help"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
