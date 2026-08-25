import { Link } from "@tanstack/react-router";

export function MatrixMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/matrixqa-favicon.png"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      alt="Matrix QA"
      draggable={false}
    />
  );
}

export function Logo({
  className = "",
  size = 26,
  tone = "dark",
}: {
  className?: string;
  size?: number;
  tone?: "dark" | "light";
}) {
  return (
    <Link to="/" aria-label="Matrix QA" className={`inline-flex items-center gap-2.5 ${className}`}>
      <MatrixMark size={size} />
      <span
        aria-hidden="true"
        className="inline-flex items-baseline whitespace-nowrap font-display text-[15px] font-medium uppercase leading-none"
      >
        <span
          className={`tracking-[0.26em] ${tone === "light" ? "text-[#17201b]" : "text-foreground"}`}
        >
          MATRIX
        </span>
        <span className="ml-2 bg-gradient-to-r from-primary via-emerald-300 to-cyan-400 bg-clip-text tracking-[0.18em] text-transparent">
          QA
        </span>
      </span>
    </Link>
  );
}
