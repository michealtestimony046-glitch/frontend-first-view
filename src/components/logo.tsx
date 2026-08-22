import { Link } from "@tanstack/react-router";

export function MatrixMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
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
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`}>
      <MatrixMark size={size} />
      <span className="font-display text-[15px] font-semibold tracking-tight">
        Matrix<span className="text-primary">QA</span>
      </span>
    </Link>
  );
}
