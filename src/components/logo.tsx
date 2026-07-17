import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary/90 to-primary/40 shadow-[0_0_20px_-4px_var(--primary)]">
        <span className="font-mono text-[11px] font-bold text-primary-foreground">
          M
        </span>
        <span className="absolute inset-0 rounded-md ring-1 ring-inset ring-white/10" />
      </span>
      <span className="font-display text-[15px] font-semibold tracking-tight">
        Matrix<span className="text-primary">QA</span>
      </span>
    </Link>
  );
}
