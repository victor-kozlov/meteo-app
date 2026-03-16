import React, { useRef, useState, useEffect } from 'react';
import { DailyTemperature } from '../hooks/useTemperatureData';

const PAD_LEFT = 48;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 40;
const CHART_HEIGHT = 280;

interface TooltipState {
  x: number;
  y: number;
  date: string;
  max_temp: number;
  min_temp: number;
}

interface Props {
  data: DailyTemperature[];
}

function formatXLabel(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function niceRange(min: number, max: number): { yMin: number; yMax: number; step: number } {
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = Math.max(1, (max - min) * 0.1);
  const yMin = Math.floor((min - pad) / 5) * 5;
  const yMax = Math.ceil((max + pad) / 5) * 5;
  return { yMin, yMax: yMax === yMin ? yMin + 5 : yMax, step: 5 };
}

export function TemperatureChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(w);
    });
    obs.observe(containerRef.current);
    setWidth(containerRef.current.getBoundingClientRect().width || 600);
    return () => obs.disconnect();
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
        No temperature data available for the last 14 days
      </div>
    );
  }

  const chartW = width - PAD_LEFT - PAD_RIGHT;
  const chartH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const allTemps = data.flatMap(d => [d.min_temp, d.max_temp]);
  const dataMin = Math.min(...allTemps);
  const dataMax = Math.max(...allTemps);
  const { yMin, yMax, step } = niceRange(dataMin, dataMax);

  const toX = (i: number) =>
    PAD_LEFT + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
  const toY = (temp: number) =>
    PAD_TOP + chartH - ((temp - yMin) / (yMax - yMin)) * chartH;

  const maxPoints = data.map((d, i) => ({ x: toX(i), y: toY(d.max_temp), d }));
  const minPoints = data.map((d, i) => ({ x: toX(i), y: toY(d.min_temp), d }));

  const toPolylinePoints = (points: { x: number; y: number }[]) =>
    points.map(p => `${p.x},${p.y}`).join(' ');

  const yTicks: number[] = [];
  for (let t = yMin; t <= yMax; t += step) yTicks.push(t);

  // Determine how many X labels to show based on available space
  const approxLabelWidth = 46;
  const spacing = data.length > 1 ? chartW / (data.length - 1) : chartW;
  const showEvery = Math.max(1, Math.ceil(approxLabelWidth / spacing));

  const tooltipFlipThreshold = width - 150;

  return (
    <div ref={containerRef} style={{ position: 'relative', height: CHART_HEIGHT }}>
      <svg width={width} height={CHART_HEIGHT}>
        {/* Horizontal grid lines + Y labels */}
        {yTicks.map(t => {
          const y = toY(t);
          return (
            <g key={t}>
              <line
                x1={PAD_LEFT} y1={y}
                x2={width - PAD_RIGHT} y2={y}
                stroke="#e5e7eb" strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 6} y={y + 4}
                textAnchor="end"
                fontSize={11}
                fill="#94a3b8"
              >
                {t}°
              </text>
            </g>
          );
        })}

        {/* X axis labels */}
        {data.map((d, i) => {
          if (i % showEvery !== 0 && i !== data.length - 1) return null;
          return (
            <text
              key={d.date}
              x={toX(i)} y={CHART_HEIGHT - 8}
              textAnchor="middle"
              fontSize={11}
              fill="#94a3b8"
            >
              {formatXLabel(d.date)}
            </text>
          );
        })}

        {/* Max temperature polyline */}
        <polyline
          points={toPolylinePoints(maxPoints)}
          fill="none"
          stroke="#ef4444"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Min temperature polyline */}
        <polyline
          points={toPolylinePoints(minPoints)}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Max circles */}
        {maxPoints.map(({ x, y, d }) => (
          <circle
            key={d.date + '-max'}
            cx={x} cy={y} r={4}
            fill="#ef4444"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setTooltip({ x, y, date: d.date, max_temp: d.max_temp, min_temp: d.min_temp })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        {/* Min circles */}
        {minPoints.map(({ x, y, d }) => (
          <circle
            key={d.date + '-min'}
            cx={x} cy={y} r={4}
            fill="#3b82f6"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setTooltip({ x, y, date: d.date, max_temp: d.max_temp, min_temp: d.min_temp })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x > tooltipFlipThreshold ? tooltip.x - 130 : tooltip.x + 12,
            top: Math.max(0, tooltip.y - 16),
            pointerEvents: 'none',
            zIndex: 10,
          }}
          className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm"
        >
          <p className="font-semibold text-slate-800 mb-1">{formatXLabel(tooltip.date)}</p>
          <p className="text-red-500">Max: {tooltip.max_temp.toFixed(1)}°C</p>
          <p className="text-blue-500">Min: {tooltip.min_temp.toFixed(1)}°C</p>
        </div>
      )}
    </div>
  );
}
