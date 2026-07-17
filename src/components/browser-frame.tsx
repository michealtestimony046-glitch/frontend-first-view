import type { ReactNode } from "react";

export function BrowserFrame({
  url,
  children,
  className = "",
}: {
  url: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-border bg-surface-2 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] ${className}`}
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-surface px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <div className="ml-2 flex-1 truncate rounded border border-border bg-background/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          {url}
        </div>
      </div>
      <div className="relative aspect-[16/10] w-full">{children}</div>
    </div>
  );
}
