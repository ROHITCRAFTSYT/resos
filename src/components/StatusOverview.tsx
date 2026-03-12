'use client';
import { useMemo } from 'react';
import type { GovService, ServiceStatus } from '@/lib/services';

interface StatusOverviewProps {
  services: GovService[];
}

export default function StatusOverview({ services }: StatusOverviewProps) {
  // ── Counts ───────────────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c: Record<ServiceStatus, number> = { operational: 0, degraded: 0, outage: 0, unknown: 0 };
    services.forEach((s) => c[s.status]++);
    return c;
  }, [services]);

  const avgUptime =
    services.length > 0
      ? services.reduce((sum, s) => sum + s.uptime, 0) / services.length
      : 100;

  const statusVariant =
    counts.outage > 0 ? 'outage' : counts.degraded > 0 ? 'degraded' : 'ok';

  const overallLabel =
    statusVariant === 'outage'
      ? 'INCIDENT DETECTED'
      : statusVariant === 'degraded'
      ? 'PARTIAL DEGRADATION'
      : 'ALL SYSTEMS NOMINAL';

  const vs = {
    ok:       { text: 'text-green-400',  border: 'border-green-400/20',  glow: '#4ade80', dot: 'bg-green-400',  bg: '' },
    degraded: { text: 'text-yellow-400', border: 'border-yellow-500/30', glow: '#facc15', dot: 'bg-yellow-400 animate-pulse', bg: 'bg-yellow-500/[0.02]' },
    outage:   { text: 'text-red-400',    border: 'border-red-500/40',    glow: '#ef4444', dot: 'bg-red-500 animate-pulse',    bg: 'bg-red-500/[0.03]' },
  }[statusVariant];

  // ── Heartbeat bars (60 readings, EKG-style) ──────────────────────────────────
  // Short bar = healthy (low latency), tall spike = problem, full red = error
  const heartbeatBars = useMemo(() => {
    if (services.length === 0) {
      return Array.from({ length: 60 }, (_, i) => ({
        h: 0.05 + Math.abs(Math.sin(i * 0.6)) * 0.12,
        variant: 'ok' as const,
      }));
    }

    return Array.from({ length: 60 }, (_, i) => {
      const svc      = services[i % services.length];
      const histIdx  = svc.history.length - 1 - Math.floor(i / services.length);
      const latency  = histIdx >= 0 ? svc.history[histIdx].latency : svc.latency;
      // Deterministic "organic" wave — no Math.random() so bars don't jump each tick
      const wave     = Math.abs(Math.sin(i * 0.38)) * 0.04;

      let h: number;
      let barVariant: 'ok' | 'degraded' | 'outage';

      if (latency === 0) {
        h = 0.88 + wave;              // error: tall red alarm spike
        barVariant = 'outage';
      } else if (latency > 800) {
        h = 0.38 + (latency / 2000) * 0.45 + wave;  // degraded: medium-tall yellow
        barVariant = 'degraded';
      } else {
        h = 0.05 + (latency / 800) * 0.22 + wave;   // healthy: short green tick
        barVariant = 'ok';
      }

      return { h: Math.max(0.04, Math.min(1, h)), variant: barVariant };
    });
  }, [services]);

  const barColor = {
    ok:       'bg-green-400',
    degraded: 'bg-yellow-400',
    outage:   'bg-red-500',
  };

  return (
    <div className={`font-mono border ${vs.border} ${vs.bg} overflow-hidden`}>
      <div className="grid grid-cols-1 lg:grid-cols-[210px_1fr_230px]">

        {/* ── Left: Giant uptime ────────────────────────────────────────── */}
        <div className="px-7 py-6 flex flex-col justify-center gap-1 border-b lg:border-b-0 lg:border-r border-white/10">

          {/* Status indicator */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${vs.dot}`} />
            <span className={`text-[8px] tracking-[0.25em] ${vs.text}`}>{overallLabel}</span>
          </div>

          {/* Giant uptime number */}
          <div className="flex items-end gap-1 leading-none">
            <span
              className={`text-[56px] font-bold tabular-nums leading-none ${vs.text}`}
              style={{ textShadow: `0 0 60px ${vs.glow}33` }}
            >
              {avgUptime.toFixed(1)}
            </span>
            <span className={`text-[22px] font-bold mb-1.5 opacity-50 ${vs.text}`}>%</span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[7px] text-white/20 tracking-[0.3em]">AVG UPTIME</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
        </div>

        {/* ── Center: Live heartbeat / EKG bars ─────────────────────────── */}
        <div className="px-5 py-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 gap-3">

          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-white/20 tracking-[0.28em]">SYSTEM PULSE · LAST 60 READINGS</span>
            <span className={`text-[8px] tracking-widest flex items-center gap-1.5 ${vs.text}`}>
              <span className="w-1 h-1 rounded-full bg-current animate-pulse inline-block" />
              LIVE
            </span>
          </div>

          {/* EKG bars — older bars are more faded, newest glow full */}
          <div className="flex items-end gap-px" style={{ height: '52px' }}>
            {heartbeatBars.map((bar, i) => (
              <div
                key={i}
                className={`flex-1 rounded-[1px] transition-all duration-1000 ${barColor[bar.variant]}`}
                style={{
                  height: `${bar.h * 100}%`,
                  opacity: 0.12 + (i / 60) * 0.88,
                }}
              />
            ))}
          </div>

          {/* Time labels */}
          <div className="flex justify-between text-[7px] text-white/15 tracking-wider select-none">
            <span>60 MIN AGO</span>
            <span>30 MIN AGO</span>
            <span>NOW</span>
          </div>
        </div>

        {/* ── Right: Status counts ───────────────────────────────────────── */}
        <div className="px-7 py-6 flex flex-col justify-center gap-3.5">
          {[
            { label: 'OPERATIONAL', value: counts.operational, color: 'text-green-400',  dot: 'bg-green-400',  pulse: false },
            { label: 'DEGRADED',    value: counts.degraded,    color: 'text-yellow-400', dot: 'bg-yellow-400', pulse: counts.degraded > 0 },
            { label: 'OUTAGE',      value: counts.outage,      color: 'text-red-400',    dot: 'bg-red-500',    pulse: counts.outage > 0 },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${stat.dot} ${
                  stat.pulse ? 'animate-pulse' : ''
                }`}
              />
              <span className="text-[8px] text-white/25 tracking-[0.25em] flex-1 tabular-nums">
                {stat.label}
              </span>
              <span
                className={`text-2xl font-bold tabular-nums leading-none ${stat.color}`}
                style={stat.value > 0 && stat.label !== 'OPERATIONAL'
                  ? { textShadow: `0 0 20px currentColor` }
                  : {}}
              >
                {stat.value}
              </span>
            </div>
          ))}

          {/* Divider + total */}
          <div className="pt-2 border-t border-white/8 flex items-center justify-between">
            <span className="text-[7px] text-white/15 tracking-[0.3em]">MONITORED</span>
            <span className="text-lg font-bold text-white/40 tabular-nums">{services.length}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
