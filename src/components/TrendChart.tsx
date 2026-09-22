"use client";

interface Point {
  x: number;
  y: number;
}

interface TrendChartProps {
  points: Point[];
  height?: number;
  formatY?: (y: number) => string;
  color?: string;
}

/**
 * A small hand-rolled SVG line chart. Deliberately not a charting library —
 * the plan's engineering standards call for a lightweight approach given
 * this is a mobile PWA, and a handful of line/area charts don't need one.
 */
export function TrendChart({ points, height = 160, formatY, color = "#2563eb" }: TrendChartProps) {
  if (points.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400 dark:border-slate-700"
        style={{ height }}
      >
        Not enough data yet
      </div>
    );
  }

  const width = 600;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys, 1);

  const scaleX = (x: number) => ((x - minX) / (maxX - minX || 1)) * (width - 20) + 10;
  const scaleY = (y: number) => height - 10 - (y / maxY) * (height - 20);

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(p.x).toFixed(1)} ${scaleY(p.y).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Trend chart">
      <path d={path} fill="none" stroke={color} strokeWidth={2} />
      <circle cx={scaleX(last.x)} cy={scaleY(last.y)} r={4} fill={color} />
      {formatY && (
        <text x={scaleX(last.x)} y={Math.max(scaleY(last.y) - 10, 12)} textAnchor="end" fontSize={12} fill={color}>
          {formatY(last.y)}
        </text>
      )}
    </svg>
  );
}
