"use client";

import { useState, useEffect, useRef } from "react";
import DottedMap from "dotted-map";
import { supabase } from "@/lib/supabase";
import type { DbService, DbServiceStatus } from "@/lib/supabase";
import { MapIcon } from "lucide-react";

// ─── Static map (computed once outside component to avoid re-renders) ─────────

const map   = new DottedMap({ height: 55, grid: "diagonal" });
const DOTS  = map.getPoints();

// ─── Region → SVG coordinate mapping ─────────────────────────────────────────
// SVG viewBox: "0 0 120 60"  (equirectangular projection, height 55)
// Formula: x = (lon + 180) / 360 * 120,  y = (90 - lat) / 180 * 55
//
// IN-NORTH  → Delhi      77.2°E  28.6°N  → x≈85.7  y≈18.7
// IN-CENTRAL→ Nagpur     79.1°E  21.1°N  → x≈86.3  y≈21.0
// IN-SOUTH  → Bangalore  77.6°E  12.9°N  → x≈85.9  y≈23.5
// IN-EAST   → Kolkata    88.4°E  22.6°N  → x≈89.5  y≈20.4
// IN-WEST   → Mumbai     72.8°E  19.1°N  → x≈83.6  y≈21.6

const REGION_PINS: Record<string, { cx: number; cy: number }> = {
  "IN-NORTH":   { cx: 85.7, cy: 18.7 },
  "IN-CENTRAL": { cx: 86.3, cy: 21.0 },
  "IN-SOUTH":   { cx: 85.9, cy: 23.5 },
  "IN-EAST":    { cx: 89.5, cy: 20.4 },
  "IN-WEST":    { cx: 83.6, cy: 21.6 },
};

const STATUS_SVG_COLOR: Record<string, string> = {
  operational: "#4ade80",
  degraded:    "#facc15",
  outage:      "#f87171",
  unknown:     "#94a3b8",
};

const STATUS_DOT_CLASS: Record<string, string> = {
  operational: "bg-green-400",
  degraded:    "bg-yellow-400",
  outage:      "bg-red-400",
  unknown:     "bg-slate-400",
};

// Worst-status priority: outage > degraded > operational > unknown
const STATUS_RANK: Record<string, number> = {
  outage: 3, degraded: 2, operational: 1, unknown: 0,
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SlimService = Pick<DbService, "id" | "name" | "status" | "region" | "last_checked_at">;

type RegionSummary = {
  status: DbServiceStatus;
  serviceCount: number;
  outageCount: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeRegionSummary(services: SlimService[]): Record<string, RegionSummary> {
  const out: Record<string, RegionSummary> = {};
  for (const svc of services) {
    const r = svc.region;
    if (!out[r]) out[r] = { status: "operational", serviceCount: 0, outageCount: 0 };
    out[r].serviceCount += 1;
    if (svc.status === "outage") out[r].outageCount += 1;
    if ((STATUS_RANK[svc.status] ?? 0) > (STATUS_RANK[out[r].status] ?? 0)) {
      out[r].status = svc.status as DbServiceStatus;
    }
  }
  return out;
}

function mostRecentRegion(services: SlimService[]): string {
  if (!services.length) return "IN-CENTRAL";
  const sorted = [...services].sort(
    (a, b) =>
      new Date(b.last_checked_at).getTime() - new Date(a.last_checked_at).getTime()
  );
  return sorted[0].region;
}

// ─── Live SVG Map ─────────────────────────────────────────────────────────────

function LiveSVGMap({
  summary,
  lastRegion,
}: {
  summary: Record<string, RegionSummary>;
  lastRegion: string;
}) {
  return (
    <svg
      viewBox="0 0 120 60"
      className="w-full opacity-70"
      style={{ background: "transparent" }}
    >
      {/* Base world dots */}
      {DOTS.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={0.15} fill="rgba(74,222,128,0.5)" />
      ))}

      {/* India region pins */}
      {Object.entries(REGION_PINS).map(([region, coord]) => {
        const info   = summary[region];
        const status = info?.status ?? "unknown";
        const color  = STATUS_SVG_COLOR[status] ?? "#94a3b8";
        const isLast = region === lastRegion;

        return (
          <g key={region}>
            {/* Pulse ring on most-recent region */}
            {isLast && (
              <>
                <circle cx={coord.cx} cy={coord.cy} r={2.4} fill="none" stroke={color} strokeWidth={0.35}>
                  <animate attributeName="r"       values="1.4;3.2;1.4" dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6"   dur="2.2s" repeatCount="indefinite" />
                </circle>
                <circle cx={coord.cx} cy={coord.cy} r={1.8} fill="none" stroke={color} strokeWidth={0.2} opacity={0.3}>
                  <animate attributeName="r"       values="1.8;4.5;1.8" dur="2.2s" begin="0.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3"   dur="2.2s" begin="0.4s" repeatCount="indefinite" />
                </circle>
              </>
            )}

            {/* Status dot */}
            <circle cx={coord.cx} cy={coord.cy} r={1.3} fill={color} opacity={0.95} />

            {/* Outage cross-hatch */}
            {status === "outage" && (
              <>
                <line x1={coord.cx - 1} y1={coord.cy - 1} x2={coord.cx + 1} y2={coord.cy + 1}
                  stroke="#f87171" strokeWidth={0.4} opacity={0.7} />
                <line x1={coord.cx + 1} y1={coord.cy - 1} x2={coord.cx - 1} y2={coord.cy + 1}
                  stroke="#f87171" strokeWidth={0.4} opacity={0.7} />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main exported component (drop-in for Cell 1) ────────────────────────────

export function LiveMapCell() {
  const [services,   setServices]   = useState<SlimService[]>([]);
  const [lastRegion, setLastRegion] = useState<string>("IN-CENTRAL");
  const [loading,    setLoading]    = useState(true);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // ── Initial load ──────────────────────────────────────────────────────────
    supabase
      .from("services")
      .select("id, name, status, region, last_checked_at")
      .then(({ data }) => {
        if (data) {
          setServices(data as SlimService[]);
          setLastRegion(mostRecentRegion(data as SlimService[]));
        }
        setLoading(false);
      });

    // ── Realtime subscription ─────────────────────────────────────────────────
    const channel = supabase
      .channel("live-map-features")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "services" },
        (payload) => {
          const updated = payload.new as SlimService;
          setServices((prev) => {
            const idx = prev.findIndex((s) => s.id === updated.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = updated;
              return next;
            }
            return [...prev, updated];
          });
          setLastRegion(updated.region);
        }
      )
      .subscribe();

    // ── Rotate "last ping" region every 8 s while idle ───────────────────────
    // Keeps the pulse ring cycling even when no Realtime event fires
    const regions = Object.keys(REGION_PINS);
    let rotateIdx = 0;
    tickRef.current = setInterval(() => {
      rotateIdx = (rotateIdx + 1) % regions.length;
      setLastRegion(regions[rotateIdx]);
    }, 8000);

    return () => {
      supabase.removeChannel(channel);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const summary    = computeRegionSummary(services);
  const allRegions = Object.keys(REGION_PINS);

  // Count totals for the badge
  const totalOutage   = services.filter((s) => s.status === "outage").length;
  const totalDegraded = services.filter((s) => s.status === "degraded").length;

  return (
    <div className="border-b border-white/10 md:border-b-0 md:border-r">
      {/* Header */}
      <div className="p-6 sm:p-10">
        <span className="flex items-center gap-2 text-[10px] text-white/40 tracking-widest mb-6">
          <MapIcon className="size-3 text-green-400" />
          REAL-TIME SERVICE GEOGRAPHY
          {/* Live pulse */}
          <span className="ml-auto flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[8px] text-green-400/60">LIVE</span>
          </span>
        </span>

        <p className="text-xl font-bold tracking-wide text-white leading-snug">
          Instantly pinpoint where a failure originates across India&apos;s digital grid.
        </p>

        {/* Live region status pills */}
        <div className="flex flex-wrap gap-3 mt-6">
          {allRegions.map((region) => {
            const info   = summary[region];
            const status = info?.status ?? (loading ? "unknown" : "operational");
            const dotCls = STATUS_DOT_CLASS[status] ?? "bg-slate-400";
            return (
              <div key={region} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${dotCls} ${
                  status === "operational" ? "animate-pulse" : ""
                }`} />
                <span className="text-[9px] text-white/40">{region}</span>
                {status !== "operational" && (
                  <span className={`text-[7px] font-bold tracking-wider ${
                    status === "outage" ? "text-red-400" : "text-yellow-400"
                  }`}>
                    {status === "outage" ? "✕" : "!"}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Alert banner if any outages/degraded */}
        {(totalOutage > 0 || totalDegraded > 0) && !loading && (
          <div className={`mt-4 px-3 py-2 text-[9px] font-mono border flex items-center gap-2 ${
            totalOutage > 0
              ? "border-red-500/20 bg-red-500/5 text-red-400"
              : "border-yellow-400/20 bg-yellow-400/5 text-yellow-400"
          }`}>
            <span>{totalOutage > 0 ? "⚠" : "△"}</span>
            {totalOutage > 0
              ? `${totalOutage} service${totalOutage > 1 ? "s" : ""} in outage — fallbacks active`
              : `${totalDegraded} service${totalDegraded > 1 ? "s" : ""} degraded — monitoring`}
          </div>
        )}
      </div>

      {/* Map visual */}
      <div className="relative">
        {/* "Last ping" overlay badge */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="border border-white/15 bg-black/80 backdrop-blur-sm px-3 py-1.5 text-[10px] font-mono text-white/70 flex items-center gap-2 shadow-lg">
            <span className="text-base">🇮🇳</span>
            <span>
              Last ping from{" "}
              <span
                className={`font-bold ${
                  (summary[lastRegion]?.status ?? "operational") === "outage"
                    ? "text-red-400"
                    : (summary[lastRegion]?.status ?? "operational") === "degraded"
                    ? "text-yellow-400"
                    : "text-green-400"
                }`}
              >
                {lastRegion}
              </span>
            </span>
            {/* Status chip */}
            <span
              className={`text-[8px] px-1.5 py-0.5 border font-bold ${
                (summary[lastRegion]?.status ?? "operational") === "outage"
                  ? "border-red-500/30 text-red-400 bg-red-500/10"
                  : (summary[lastRegion]?.status ?? "operational") === "degraded"
                  ? "border-yellow-400/30 text-yellow-400 bg-yellow-400/10"
                  : "border-green-400/30 text-green-400 bg-green-400/10"
              }`}
            >
              {(summary[lastRegion]?.status ?? "operational").toUpperCase()}
            </span>
          </div>
        </div>

        {/* Dotted world map with live pins */}
        <div className="relative overflow-hidden px-4 pb-4">
          <div
            className="absolute inset-0 z-[1]"
            style={{
              background: "radial-gradient(ellipse at bottom, #000 0%, transparent 70%)",
            }}
          />
          {loading ? (
            // Skeleton while loading
            <div className="w-full h-32 flex items-center justify-center">
              <span className="text-[9px] text-white/20 tracking-widest animate-pulse">
                LOADING MAP DATA…
              </span>
            </div>
          ) : (
            <LiveSVGMap summary={summary} lastRegion={lastRegion} />
          )}
        </div>
      </div>
    </div>
  );
}
