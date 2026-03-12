import { createServiceClient } from '@/lib/supabase';
import Link from 'next/link';
import type { DbService, DbIncident, DbHealthCheck } from '@/lib/supabase';

export const revalidate = 60; // ISR — re-render every 60 s

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** Returns the last `n` calendar dates as YYYY-MM-DD strings, newest last */
function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function statusColor(status: string) {
  if (status === 'operational') return 'text-green-400';
  if (status === 'degraded') return 'text-yellow-400';
  if (status === 'outage') return 'text-red-400';
  return 'text-gray-400';
}

function statusDot(status: string) {
  if (status === 'operational') return 'bg-green-400';
  if (status === 'degraded') return 'bg-yellow-400 animate-pulse';
  if (status === 'outage') return 'bg-red-500 animate-pulse';
  return 'bg-gray-400';
}

function uptimeTileColor(pct: number | null) {
  if (pct === null) return 'bg-white/5'; // no data
  if (pct >= 99) return 'bg-green-400';
  if (pct >= 90) return 'bg-yellow-400';
  return 'bg-red-500';
}

function uptimeTileOpacity(pct: number | null) {
  if (pct === null) return 'opacity-20';
  if (pct >= 99) return 'opacity-80';
  if (pct >= 90) return 'opacity-70';
  return 'opacity-90';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StatusPage() {
  const db = createServiceClient();
  const days30 = lastNDays(30);
  const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString();

  // Parallel fetch — services, incidents (last 48h), health_checks (last 30 days)
  const [
    { data: servicesRaw },
    { data: incidentsRaw },
    { data: checksRaw },
  ] = await Promise.all([
    db.from('services').select('*').order('name'),
    db.from('incidents').select('*').order('created_at', { ascending: false }).limit(30),
    db
      .from('health_checks')
      .select('service_id, status, checked_at')
      .gte('checked_at', since30d)
      .order('checked_at', { ascending: true }),
  ]);

  const services = (servicesRaw ?? []) as DbService[];
  const incidents = (incidentsRaw ?? []) as DbIncident[];
  const checks   = (checksRaw ?? []) as Pick<DbHealthCheck, 'service_id' | 'status' | 'checked_at'>[];

  // ── Per-service daily uptime buckets ───────────────────────────────────────
  // Map: serviceId → { "YYYY-MM-DD" → { total, operational } }
  type DayMap = Record<string, { total: number; operational: number }>;
  const dailyMap: Record<string, DayMap> = {};

  for (const svc of services) dailyMap[svc.id] = {};

  for (const c of checks) {
    const day = c.checked_at.slice(0, 10);
    if (!dailyMap[c.service_id]) dailyMap[c.service_id] = {};
    if (!dailyMap[c.service_id][day]) dailyMap[c.service_id][day] = { total: 0, operational: 0 };
    dailyMap[c.service_id][day].total++;
    if (c.status === 'operational') dailyMap[c.service_id][day].operational++;
  }

  // ── Overall global health ─────────────────────────────────────────────────
  const totalServices = services.length;
  const operational   = services.filter((s) => s.status === 'operational').length;
  const degraded      = services.filter((s) => s.status === 'degraded').length;
  const outage        = services.filter((s) => s.status === 'outage').length;

  const globalStatus =
    outage > 0   ? 'outage'   :
    degraded > 0 ? 'degraded' :
    'operational';

  const globalLabel =
    globalStatus === 'operational' ? 'ALL SYSTEMS OPERATIONAL' :
    globalStatus === 'degraded'    ? 'PARTIAL SERVICE DISRUPTION' :
                                     'MAJOR SERVICE OUTAGE';

  const globalBorder =
    globalStatus === 'operational' ? 'border-green-500/30' :
    globalStatus === 'degraded'    ? 'border-yellow-500/40' :
                                     'border-red-500/40';

  const globalBg =
    globalStatus === 'operational' ? 'bg-green-500/5' :
    globalStatus === 'degraded'    ? 'bg-yellow-500/5' :
                                     'bg-red-500/5';

  const globalDot =
    globalStatus === 'operational' ? 'bg-green-400' :
    globalStatus === 'degraded'    ? 'bg-yellow-400 animate-pulse' :
                                     'bg-red-500 animate-pulse';

  const globalColor =
    globalStatus === 'operational' ? 'text-green-400' :
    globalStatus === 'degraded'    ? 'text-yellow-400' :
                                     'text-red-400';

  // Active (unresolved) incidents in last 48h
  const activeIncidents = incidents.filter((i) => !i.resolved);

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Nav */}
      <div className="border-b border-white/10 bg-black/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/40 hover:text-white text-[10px] tracking-widest transition-colors">
              ← HOME
            </Link>
            <div className="w-px h-4 bg-white/20" />
            <span className="font-bold text-sm tracking-widest italic -skew-x-6">
              RESILIENCE<span className="text-green-400">OS</span>
            </span>
            <div className="w-px h-4 bg-white/20" />
            <span className="text-[9px] text-white/30 tracking-[0.25em]">STATUS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${globalDot}`} />
            <span className={`text-[9px] tracking-widest ${globalColor}`}>{globalLabel}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

        {/* ── Global Health Banner ────────────────────────────────────────── */}
        <div className={`border ${globalBorder} ${globalBg} p-6`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${globalDot}`} />
              <div>
                <div className={`text-xl font-bold tracking-widest ${globalColor}`}>
                  {globalLabel}
                </div>
                <div className="text-white/30 text-[9px] mt-1 tracking-widest">
                  {totalServices} SERVICES MONITORED · UPDATED {new Date().toLocaleTimeString('en-IN')}
                </div>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 tabular-nums">{operational}</div>
                <div className="text-[8px] text-white/30 tracking-widest mt-0.5">OPERATIONAL</div>
              </div>
              {degraded > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400 tabular-nums">{degraded}</div>
                  <div className="text-[8px] text-white/30 tracking-widest mt-0.5">DEGRADED</div>
                </div>
              )}
              {outage > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400 tabular-nums">{outage}</div>
                  <div className="text-[8px] text-white/30 tracking-widest mt-0.5">OUTAGE</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Active Incidents ────────────────────────────────────────────── */}
        {activeIncidents.length > 0 && (
          <div className="space-y-2">
            <div className="text-[9px] text-white/40 tracking-[0.3em]">ACTIVE INCIDENTS</div>
            {activeIncidents.slice(0, 5).map((inc) => (
              <div key={inc.id} className="border border-red-500/30 bg-red-500/5 p-3 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-white/80 font-bold">{inc.service_name}</span>
                    <span className="text-[8px] text-red-400/70 tracking-widest uppercase">{inc.type}</span>
                  </div>
                  <p className="text-[9px] text-white/50 mt-0.5 leading-relaxed">{inc.message}</p>
                </div>
                <span className="text-[8px] text-white/20 flex-shrink-0">{timeAgo(inc.created_at)}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Services + 30-day Heatmap ───────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[9px] text-white/40 tracking-[0.3em]">SERVICE STATUS · 30-DAY HISTORY</div>
            <div className="flex items-center gap-3 text-[8px] text-white/25">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 opacity-80 inline-block" /> ≥99%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-400 opacity-70 inline-block" /> ≥90%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 opacity-90 inline-block" /> &lt;90%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-white/5 opacity-20 inline-block" /> no data
              </span>
            </div>
          </div>

          {services.map((svc) => {
            const dayData = dailyMap[svc.id] ?? {};

            // Compute 30-day overall uptime
            let totalChecks = 0, totalOk = 0;
            for (const d of days30) {
              const b = dayData[d];
              if (b) { totalChecks += b.total; totalOk += b.operational; }
            }
            const overallUptime = totalChecks > 0
              ? (totalOk / totalChecks) * 100
              : svc.uptime_percent;

            return (
              <div key={svc.id} className="border border-white/8 bg-white/[0.015] p-4">
                {/* Service header */}
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(svc.status)}`} />
                    <div>
                      <div className="text-[11px] text-white/90 font-bold tracking-wider">{svc.name}</div>
                      <div className="text-[8px] text-white/30 tracking-widest mt-0.5">
                        {svc.category} · {svc.region}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className={`text-[10px] font-bold ${statusColor(svc.status)} tracking-widest`}>
                        {svc.status.toUpperCase()}
                      </div>
                      <div className="text-[8px] text-white/25 tracking-wider mt-0.5">
                        {svc.latency_ms > 0 ? `${svc.latency_ms}ms` : 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[13px] font-bold tabular-nums ${
                        overallUptime >= 99 ? 'text-green-400' :
                        overallUptime >= 90 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {overallUptime.toFixed(1)}%
                      </div>
                      <div className="text-[8px] text-white/25 tracking-wider mt-0.5">30-DAY</div>
                    </div>
                  </div>
                </div>

                {/* 30-day heatmap tiles */}
                <div className="flex items-end gap-0.5" title="30-day uptime history (oldest → newest)">
                  {days30.map((day) => {
                    const b = dayData[day];
                    const pct = b && b.total > 0
                      ? (b.operational / b.total) * 100
                      : null;
                    const tileColor   = uptimeTileColor(pct);
                    const tileOpacity = uptimeTileOpacity(pct);
                    const title       = pct !== null
                      ? `${day}: ${pct.toFixed(1)}% uptime (${b!.total} checks)`
                      : `${day}: no data`;
                    return (
                      <div
                        key={day}
                        className={`flex-1 h-4 rounded-sm ${tileColor} ${tileOpacity} transition-opacity`}
                        title={title}
                      />
                    );
                  })}
                </div>

                {/* Heatmap date labels (first + last) */}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[7px] text-white/15">{formatDate(days30[0])}</span>
                  <span className="text-[7px] text-white/15">TODAY</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Recent Resolved Incidents ───────────────────────────────────── */}
        {incidents.length > 0 && (
          <div className="space-y-2">
            <div className="text-[9px] text-white/40 tracking-[0.3em]">RECENT INCIDENT LOG</div>
            <div className="border border-white/8 divide-y divide-white/5">
              {incidents.slice(0, 15).map((inc) => (
                <div key={inc.id} className="px-4 py-2.5 flex items-start gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5 ${
                    inc.resolved ? 'bg-green-400/50' :
                    inc.type === 'outage' ? 'bg-red-500 animate-pulse' : 'bg-yellow-400 animate-pulse'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-white/70 font-bold">{inc.service_name}</span>
                      <span className={`text-[8px] tracking-widest uppercase ${
                        inc.type === 'restored' ? 'text-green-400/60' :
                        inc.type === 'outage'   ? 'text-red-400/70' :
                        inc.type === 'chaos'    ? 'text-purple-400/70' :
                                                  'text-yellow-400/60'
                      }`}>{inc.type}</span>
                      {inc.resolved && (
                        <span className="text-[8px] text-green-400/40 tracking-widest">RESOLVED</span>
                      )}
                    </div>
                    <p className="text-[9px] text-white/40 mt-0.5 leading-relaxed">{inc.message}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[8px] text-white/25">{timeAgo(inc.created_at)}</div>
                    {inc.resolved_at && (
                      <div className="text-[7px] text-green-400/30 mt-0.5">
                        Fixed {timeAgo(inc.resolved_at)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-white/8 pt-6 flex items-center justify-between text-[8px] text-white/20 tracking-widest">
          <span>RESILIENCEOS · GOVERNMENT SERVICES MONITOR</span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-white/50 transition-colors">DASHBOARD →</Link>
            <span>UPDATED EVERY 60s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
