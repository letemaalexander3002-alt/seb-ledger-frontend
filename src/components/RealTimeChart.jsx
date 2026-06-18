import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Activity, Info, Loader2 } from "lucide-react";
import { pollEvery } from "../utils/api";

const RANGES = [
  { key: "24h", label: "24H" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
];

function formatAxisLabel(isoString, range) {
  const d = new Date(isoString);
  if (range === "24h") return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function formatTzsShort(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${Math.round(value)}`;
}

function buildPath(values, width, height, padding, maxValue) {
  if (values.length === 0) return "";
  const usableWidth  = width - padding * 2;
  const usableHeight = height - padding * 2;
  const stepX = values.length > 1 ? usableWidth / (values.length - 1) : 0;
  return values
    .map((v, i) => {
      const x = padding + i * stepX;
      const y = padding + usableHeight - ((v / maxValue) * usableHeight);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

async function loadTimeseries(range, signal) {
  const r = await fetch(`${API_BASE}/analytics/timeseries?range=${range}`, { signal });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export default function RealTimeChart() {
  const [range, setRange]         = useState("24h");
  const [series, setSeries]       = useState([]);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive]       = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async (signal) => {
    try {
      setIsLoading(true);
      const data = await loadTimeseries(range, signal);
      if (data?.success && Array.isArray(data.points)) {
        setSeries(data.points);
        setIsLive(true);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setIsLive(false);
      setSeries([]);
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    const unsubscribe = pollEvery(() => fetchData(controller.signal), 15000);
    return () => { controller.abort(); unsubscribe(); };
  }, [fetchData]);

  const width   = 760;
  const height  = 220;
  const padding = 28;

  const maxValue = useMemo(() => {
    if (!series.length) return 1;
    const allValues = series.flatMap((p) => [p.inflow, p.net]);
    return Math.max(...allValues, 1) * 1.15;
  }, [series]);

  const inflowPath = useMemo(
    () => buildPath(series.map((p) => p.inflow), width, height, padding, maxValue),
    [series, maxValue]
  );
  const netPath = useMemo(
    () => buildPath(series.map((p) => p.net), width, height, padding, maxValue),
    [series, maxValue]
  );

  const areaPath = useMemo(() => {
    if (!inflowPath || series.length === 0) return "";
    const usableWidth = width - padding * 2;
    const stepX = series.length > 1 ? usableWidth / (series.length - 1) : 0;
    const lastX = padding + (series.length - 1) * stepX;
    return `${inflowPath} L${lastX.toFixed(2)},${height - padding} L${padding},${height - padding} Z`;
  }, [inflowPath, series.length]);

  const hovered = hoverIndex !== null ? series[hoverIndex] : null;
  const stepX   = series.length > 1 ? (width - padding * 2) / (series.length - 1) : 0;

  const isEmpty = !isLoading && series.every((p) => p.inflow === 0 && p.net === 0);

  return (
    <section className="border-b ledger-divider">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b ledger-divider">
        <div className="flex items-center gap-2.5">
          <Activity size={16} strokeWidth={1.75} className="text-seb-gold" />
          <h2 className="text-sm font-medium text-seb-platinum tracking-wide">Settlement Flow</h2>
          {isLoading && <Loader2 size={13} className="animate-spin text-seb-mist" />}
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px] font-mono text-seb-mist hidden sm:block">
              Updated {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <div className="flex items-center border ledger-divider">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 text-[11px] font-mono tracking-wide transition-colors ${
                  range === r.key
                    ? "bg-seb-gold text-seb-obsidian"
                    : "text-seb-mist hover:text-seb-platinum hover:bg-seb-ledgerlight"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-5">
        <div className="flex items-center gap-6 mb-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-seb-emerald">
            <span className="inline-block w-2.5 h-[2px] bg-seb-emerald" /> Gross Inflow
          </span>
          <span className="flex items-center gap-1.5 text-seb-gold">
            <span className="inline-block w-2.5 h-[2px] bg-seb-gold" style={{ borderTop: "1px dashed" }} /> Net Settlement
          </span>
          {isLive ? (
            <span className="ml-auto flex items-center gap-1.5 text-seb-emerald text-[11px]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-seb-emerald" />
              Live — seb-ledger-core
            </span>
          ) : (
            <span className="ml-auto flex items-center gap-1.5 text-seb-rust text-[11px]">
              <Info size={12} /> Backend unreachable
            </span>
          )}
        </div>

        {isEmpty && !isLoading ? (
          <div className="flex items-center justify-center h-[220px] text-seb-mist text-xs font-mono">
            No completed transactions in this window yet — dispatch a webhook to see data.
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-[220px] min-w-[480px]"
              preserveAspectRatio="none"
              role="img"
              aria-label="Live settlement inflow and net volume over selected time range"
            >
              <defs>
                <linearGradient id="sebAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#3FA973" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#3FA973" stopOpacity="0"    />
                </linearGradient>
              </defs>

              {[0.25, 0.5, 0.75, 1].map((frac) => (
                <line
                  key={frac}
                  x1={padding} x2={width - padding}
                  y1={padding + (height - padding * 2) * frac}
                  y2={padding + (height - padding * 2) * frac}
                  stroke="#8A7233" strokeOpacity="0.14" strokeWidth="1"
                />
              ))}

              {areaPath && <path d={areaPath} fill="url(#sebAreaFill)" stroke="none" />}
              {inflowPath && <path d={inflowPath} fill="none" stroke="#3FA973" strokeWidth="1.75" />}
              {netPath    && <path d={netPath}    fill="none" stroke="#C9A24B" strokeWidth="1.5" strokeDasharray="4 3" />}

              {series.map((p, i) => (
                <rect
                  key={p.t}
                  x={padding + i * stepX - stepX / 2}
                  y={0}
                  width={stepX || width}
                  height={height}
                  fill="transparent"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              ))}

              {hovered && (
                <line
                  x1={padding + hoverIndex * stepX} x2={padding + hoverIndex * stepX}
                  y1={padding} y2={height - padding}
                  stroke="#C9A24B" strokeOpacity="0.5" strokeWidth="1"
                />
              )}
            </svg>

            {hovered && (
              <div
                className="absolute top-2 -translate-x-1/2 bg-seb-ledger border ledger-divider px-3 py-2 text-[11px] font-mono pointer-events-none z-10"
                style={{ left: `${(hoverIndex / Math.max(series.length - 1, 1)) * 100}%` }}
              >
                <div className="text-seb-mist mb-1">{formatAxisLabel(hovered.t, range)}</div>
                <div className="text-seb-emerald">Gross: TZS {formatTzsShort(hovered.inflow)}</div>
                <div className="text-seb-gold">Net: TZS {formatTzsShort(hovered.net)}</div>
                <div className="text-seb-mist">{hovered.count} txn{hovered.count !== 1 ? "s" : ""}</div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between mt-2 text-[10px] font-mono text-seb-mist">
          <span>{series[0]                  ? formatAxisLabel(series[0].t, range)                  : ""}</span>
          <span>{series[series.length - 1] ? formatAxisLabel(series[series.length - 1].t, range) : ""}</span>
        </div>
      </div>
    </section>
  );
}
