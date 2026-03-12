import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAuthOrCron, unauthorized } from '@/lib/auth';

// ─── Known check URLs per service id ──────────────────────────────────────────
const SERVICE_URLS: Record<string, string> = {
  'passport':     'https://www.passportindia.gov.in',
  'income-tax':   'https://www.incometax.gov.in',
  'digilocker':   'https://www.digilocker.gov.in',
  'umang':        'https://web.umang.gov.in',
  'cowin':        'https://abha.abdm.gov.in',
  'gst':          'https://www.gst.gov.in',
  'epf':          'https://unifiedportal-mem.epfindia.gov.in',
  'ration':       'https://nfsa.gov.in',
};

// Latency thresholds (ms)
const DEGRADED_THRESHOLD = 800;

const isProd = process.env.NODE_ENV === 'production';
function safeError(err: unknown) {
  return isProd ? 'Internal server error' : (err instanceof Error ? err.message : 'Unknown error');
}

interface PingResult {
  service_id: string;
  status: 'operational' | 'degraded' | 'outage';
  latency_ms: number;
  error: string | null;
}

async function pingService(id: string, url: string): Promise<PingResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      credentials: 'omit',
    });

    clearTimeout(timeout);
    const latency = Date.now() - start;

    if (!res.ok && res.status >= 500) {
      return { service_id: id, status: 'outage', latency_ms: latency, error: `HTTP ${res.status}` };
    }

    if (latency > DEGRADED_THRESHOLD) {
      return { service_id: id, status: 'degraded', latency_ms: latency, error: null };
    }

    return { service_id: id, status: 'operational', latency_ms: latency, error: null };
  } catch (err: unknown) {
    const latency = Date.now() - start;
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return {
      service_id: id,
      status: 'outage',
      latency_ms: isTimeout ? 8000 : latency,
      error: isTimeout ? 'Timeout (>8s)' : (err instanceof Error ? err.message : 'Unknown error'),
    };
  }
}

async function runHealthCheck() {
  const db = createServiceClient();

  const { data: services, error: fetchErr } = await db
    .from('services')
    .select('id, name, status, chaos_active, latency_ms');

  if (fetchErr) throw fetchErr;

  // Skip chaos-active services (don't overwrite simulated failures)
  const targets = (services ?? []).filter((s) => !s.chaos_active);

  // Ping all in parallel
  const results = await Promise.all(
    targets.map((s) =>
      pingService(s.id, SERVICE_URLS[s.id] ?? 'https://india.gov.in')
    )
  );

  const now = new Date().toISOString();
  const incidents: { service_id: string; service_name: string; type: string; message: string; resolved: boolean; resolved_at: string | null }[] = [];

  for (const result of results) {
    const previous = targets.find((s) => s.id === result.service_id);
    if (!previous) continue;

    if (previous.status !== result.status) {
      let incidentType: string = result.status;
      let message = '';
      let resolved = false;
      let resolvedAt: string | null = null;

      if (result.status === 'operational') {
        incidentType = 'restored';
        message = `${previous.name} is back online (${result.latency_ms}ms)`;
        resolved = true;
        resolvedAt = now;
      } else if (result.status === 'outage') {
        message = `${previous.name} is unreachable${result.error ? ': ' + result.error : ''}`;
      } else if (result.status === 'degraded') {
        message = `${previous.name} responding slowly (${result.latency_ms}ms)`;
      }

      incidents.push({
        service_id: result.service_id,
        service_name: previous.name,
        type: incidentType,
        message,
        resolved,
        resolved_at: resolvedAt,
      });
    }
  }

  const serviceUpdates = results.map((r) =>
    db.from('services').update({
      status: r.status,
      latency_ms: r.latency_ms,
      last_checked_at: now,
    }).eq('id', r.service_id).eq('chaos_active', false)
  );

  const healthCheckInserts = db.from('health_checks').insert(
    results.map((r) => ({
      service_id: r.service_id,
      status: r.status,
      latency_ms: r.latency_ms,
      error: r.error,
      checked_at: now,
    }))
  );

  const incidentInserts = incidents.length > 0
    ? db.from('incidents').insert(incidents)
    : Promise.resolve({ error: null });

  await Promise.all([...serviceUpdates, healthCheckInserts, incidentInserts]);

  // ── Recalculate uptime_percent from last 24 h of health_checks ────────────
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentChecks } = await db
    .from('health_checks')
    .select('service_id, status')
    .gte('checked_at', since24h);

  if (recentChecks && recentChecks.length > 0) {
    // Group by service_id
    const grouped: Record<string, { total: number; operational: number }> = {};
    for (const c of recentChecks) {
      if (!grouped[c.service_id]) grouped[c.service_id] = { total: 0, operational: 0 };
      grouped[c.service_id].total++;
      if (c.status === 'operational') grouped[c.service_id].operational++;
    }

    const uptimeUpdates = Object.entries(grouped).map(([serviceId, counts]) => {
      const uptime = Math.round((counts.operational / counts.total) * 1000) / 10;
      return db.from('services')
        .update({ uptime_percent: uptime })
        .eq('id', serviceId)
        .eq('chaos_active', false);
    });

    await Promise.all(uptimeUpdates);
  }

  return NextResponse.json({
    checked: results.length,
    incidents: incidents.length,
    results: results.map((r) => ({ id: r.service_id, status: r.status, latency: r.latency_ms })),
    timestamp: now,
  });
}

// POST /api/health-check — manual trigger (requires user auth)
export async function POST(req: NextRequest) {
  const allowed = await requireAuthOrCron(req);
  if (!allowed) return unauthorized();

  try {
    return await runHealthCheck();
  } catch (err: unknown) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}

// GET /api/health-check — Vercel cron trigger (requires CRON_SECRET or user auth)
export async function GET(req: NextRequest) {
  const allowed = await requireAuthOrCron(req);
  if (!allowed) return unauthorized();

  try {
    return await runHealthCheck();
  } catch (err: unknown) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}
