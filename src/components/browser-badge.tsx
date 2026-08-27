type BrowserBadgeProps = {
  className?: string;
  compact?: boolean;
};

export function BrowserBadge({ className = "", compact = false }: BrowserBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} aria-label="Browser: Chrome">
      <img
        src="/chrome-logo.png"
        alt=""
        aria-hidden="true"
        className={compact ? "h-3.5 w-3.5 object-contain" : "h-4 w-4 object-contain"}
      />
      <span>Chrome</span>
    </span>
  );
}
