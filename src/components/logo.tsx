import { Link } from "@tanstack/react-router";

export function MatrixMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  // Hexagon vertices (pointy-top-flat-side style matching the reference)
  // ViewBox 64x64, hexagon fills tight with a small inner padding.
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Matrix QA"
    >
      <defs>
        <linearGradient id="mqa-hex" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="oklch(0.86 0.19 148)" />
          <stop offset="100%" stopColor="oklch(0.78 0.14 200)" />
        </linearGradient>
      </defs>

      {/* Hex outline */}
      <polygon
        points="32,4 58,18 58,46 32,60 6,46 6,18"
        fill="none"
        stroke="url(#mqa-hex)"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Hex corner nodes */}
      {[
        [32, 4],
        [58, 18],
        [58, 46],
        [32, 60],
        [6, 46],
        [6, 18],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={3}
          fill="url(#mqa-hex)"
        />
      ))}

      {/* Dashed inner grid connectors */}
      <g stroke="oklch(0.86 0.19 148 / 0.45)" strokeWidth="1" strokeDasharray="1.5 2" strokeLinecap="round">
        {/* horizontals */}
        <line x1="20" y1="22" x2="44" y2="22" />
        <line x1="20" y1="32" x2="44" y2="32" />
        <line x1="20" y1="42" x2="44" y2="42" />
        {/* verticals */}
        <line x1="20" y1="22" x2="20" y2="42" />
        <line x1="32" y1="22" x2="32" y2="42" />
        <line x1="44" y1="22" x2="44" y2="42" />
      </g>

      {/* 3x3 grid nodes */}
      {[20, 32, 44].flatMap((x) =>
        [22, 32, 42].map((y) => {
          const isCenter = x === 32 && y === 32;
          return (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r={isCenter ? 3 : 2.4}
              fill={isCenter ? "oklch(0.86 0.19 148)" : "oklch(0.98 0.005 250)"}
            />
          );
        }),
      )}
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
