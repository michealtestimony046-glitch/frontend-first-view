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
  ChevronUp,
  Bell,
  HelpCircle,
  Menu,
  X,
  MoreHorizontal,
  Check,
  Plus,
  Search,
  Cog,
  LogOut,
  KeyRound,
  UserCircle,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo, MatrixMark } from "./logo";
import { currentUser, workspaces } from "@/lib/mock-data";

type NavItem = {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const nav: NavItem[] = [
  { label: "Overview", to: "/app", icon: LayoutDashboard, exact: true },
  { label: "Projects", to: "/app/projects", icon: FolderKanban },
  { label: "Test Runs", to: "/app/runs", icon: ListChecks },
  { label: "Issues", to: "/app/issues", icon: Bug },
  { label: "Audit Log", to: "/app/audit", icon: ScrollText },
  { label: "Reports", to: "/app/reports", icon: FileText },
  { label: "Settings", to: "/app/settings", icon: Settings },
];

const mobileTabs: NavItem[] = [
  { label: "Overview", to: "/app", icon: LayoutDashboard, exact: true },
  { label: "Projects", to: "/app/projects", icon: FolderKanban },
  { label: "Runs", to: "/app/runs", icon: ListChecks },
  { label: "Issues", to: "/app/issues", icon: Bug },
];

function useIsActive() {
  const { pathname } = useLocation();
  return (item: NavItem) => {
    if (item.exact) return pathname === item.to;
    // For /app/settings, match /app/settings and /app/settings/*
    return pathname === item.to || pathname.startsWith(item.to + "/");
  };
}

export function AppShell({
  children,
  title = "Overview",
}: {
  children: ReactNode;
  title?: string;
}) {
  const isActive = useIsActive();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface/70 backdrop-blur md:flex">
        <SidebarBody isActive={isActive} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface shadow-2xl">
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

      {/* Main column */}
      <div className="flex min-h-screen flex-col md:pl-60">
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
            <span className="truncate font-display text-sm font-semibold">{title}</span>
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

        {/* Mobile bottom tabs */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur md:hidden">
          <ul className="grid grid-cols-5">
            {mobileTabs.map((t) => {
              const Icon = t.icon;
              const active = isActive(t);
              return (
                <li key={t.label}>
                  <Link
                    to={t.to}
                    className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {t.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex w-full flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground"
              >
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
  isActive: (item: NavItem) => boolean;
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
        <WorkspaceSwitcher />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {nav.map((item) => {
          const active = isActive(item);
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
        <UserMenu onNavigate={onNavigate} />
      </div>
    </>
  );
}

function useClickAway<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);
  return ref;
}

function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState(
    workspaces.find((w) => w.current)?.id ?? workspaces[0].id,
  );
  const ref = useClickAway<HTMLDivElement>(open, () => setOpen(false));
  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];
  const filtered = workspaces.filter((w) =>
    w.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-md border border-border bg-surface-2/60 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gradient-to-br from-primary to-primary/40 font-mono text-[10px] font-bold text-primary-foreground">
            {active.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm">{active.name}</span>
            <span className="block truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              {active.role} · {active.planTier}
            </span>
          </span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-md border border-border bg-popover shadow-2xl">
          <div className="border-b border-border p-2">
            <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2/60 px-2 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search workspaces…"
                className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto p-1">
            {filtered.map((w) => {
              const isActive = w.id === activeId;
              return (
                <li key={w.id}>
                  <button
                    onClick={() => {
                      setActiveId(w.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
                      isActive ? "bg-primary/10 text-foreground" : "hover:bg-accent"
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-primary to-primary/40 font-mono text-[9px] font-bold text-primary-foreground">
                      {w.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{w.name}</span>
                    {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-2 py-3 text-center text-xs text-muted-foreground">
                No workspaces found
              </li>
            )}
          </ul>
          <div className="border-t border-border p-1">
            <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
              <Plus className="h-3.5 w-3.5" /> Create new workspace
            </button>
            <Link
              to="/app/settings"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Cog className="h-3.5 w-3.5" /> Workspace settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useClickAway<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-accent"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/70 to-primary/20 font-mono text-[11px] font-semibold text-primary-foreground">
          {currentUser.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">
            {currentUser.name}
          </div>
          <div className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {currentUser.systemRole}
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 z-40 mb-2 overflow-hidden rounded-md border border-border bg-popover shadow-2xl">
          <div className="border-b border-border px-3 py-2">
            <div className="truncate text-xs text-muted-foreground">
              {currentUser.email}
            </div>
          </div>
          <ul className="p-1 text-sm">
            <li>
              <Link
                to="/app/settings"
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-foreground hover:bg-accent"
              >
                <UserCircle className="h-4 w-4 text-muted-foreground" /> Account settings
              </Link>
            </li>
            <li>
              <Link
                to="/app/settings"
                search={{ tab: "tokens" }}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-foreground hover:bg-accent"
              >
                <KeyRound className="h-4 w-4 text-muted-foreground" /> Workspace API keys
              </Link>
            </li>
            <li>
              <Link
                to="/app/settings/billing"
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-foreground hover:bg-accent"
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground" /> Billing & usage
              </Link>
            </li>
          </ul>
          <div className="border-t border-border p-1">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-accent"
            >
              <LogOut className="h-4 w-4" /> Log out
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
