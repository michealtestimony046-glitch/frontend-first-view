import { Link } from "@tanstack/react-router";

export function MatrixMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Matrix QA"
      shapeRendering="geometricPrecision"
    >
      <defs>
        <linearGradient id="matrixqa-brand-mark" x1="10" y1="10" x2="54" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff6b83" />
          <stop offset="38%" stopColor="#ff9b62" />
          <stop offset="68%" stopColor="#ffd166" />
          <stop offset="100%" stopColor="#7c83ff" />
        </linearGradient>
      </defs>
      <path fill="url(#matrixqa-brand-mark)" d="M12 10h14v26h24v14H26c-7.732 0-14-6.268-14-14V10Z" />
      <path fill="#f7fbff" fillOpacity=".28" d="M19 17h7v18h17v7H25c-3.314 0-6-2.686-6-6V17Z" />
    </svg>
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
