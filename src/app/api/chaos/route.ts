import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAuth, unauthorized } from '@/lib/auth';

const VALID_ACTIONS = ['inject', 'restore'] as const;
type ChaosAction = typeof VALID_ACTIONS[number];

const isProd = process.env.NODE_ENV === 'production';
function safeError(err: unknown) {
  return isProd ? 'Internal server error' : (err instanceof Error ? err.message : 'Unknown error');
}

// POST /api/chaos — inject or restore chaos for a service
// Body: { service_id: string; action: 'inject' | 'restore' }
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  try {
    const body = await req.json() as { service_id: unknown; action: unknown };

    const { service_id, action } = body;

    if (!service_id || typeof service_id !== 'string') {
      return NextResponse.json({ error: 'service_id must be a non-empty string' }, { status: 400 });
    }
    if (!action || !VALID_ACTIONS.includes(action as ChaosAction)) {
      return NextResponse.json({ error: 'action must be "inject" or "restore"' }, { status: 400 });
    }

    const db = createServiceClient();

    // Fetch current service to log its name and determine chaos outcome
    const { data: svc, error: fetchErr } = await db
      .from('services')
      .select('id, name, latency_ms, uptime_percent, status')
      .eq('id', service_id)
      .single();

    if (fetchErr || !svc) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    let newStatus: string;
    let newLatency: number;
    let newUptime: number;
    let incidentType: string;
    let incidentMsg: string;

    if (action === 'inject') {
      const roll = Math.random();
      if (roll < 0.4) {
        newStatus = 'outage';
        newLatency = 0;
        newUptime = 0;
        incidentType = 'outage';
        incidentMsg = `Chaos injection: ${svc.name} forced into full outage`;
      } else if (roll < 0.75) {
        newStatus = 'degraded';
        newLatency = svc.latency_ms * (3 + Math.random() * 5);
        newUptime = 40 + Math.random() * 30;
        incidentType = 'degraded';
        incidentMsg = `Chaos injection: ${svc.name} experiencing severe degradation (${Math.round(newLatency)}ms)`;
      } else {
        newStatus = 'degraded';
        newLatency = svc.latency_ms * 2;
        newUptime = 70 + Math.random() * 20;
        incidentType = 'chaos';
        incidentMsg = `Chaos injection: ${svc.name} under stress test`;
      }
    } else {
      // Restore
      newStatus = 'operational';
      newLatency = svc.latency_ms > 0 ? svc.latency_ms : 150 + Math.random() * 200;
      newUptime = 98 + Math.random() * 2;
      incidentType = 'restored';
      incidentMsg = `${svc.name} restored to operational after chaos test`;
    }

    // Update service status in parallel with creating incident
    const [updateResult, incidentResult] = await Promise.all([
      db.from('services').update({
        status: newStatus,
        latency_ms: Math.round(newLatency),
        uptime_percent: parseFloat(newUptime.toFixed(1)),
        chaos_active: action === 'inject',
        last_checked_at: new Date().toISOString(),
      }).eq('id', service_id).select().single(),

      db.from('incidents').insert({
        service_id,
        service_name: svc.name,
        type: incidentType,
        message: incidentMsg,
        resolved: action === 'restore',
        resolved_at: action === 'restore' ? new Date().toISOString() : null,
      }).select().single(),
    ]);

    if (updateResult.error) throw updateResult.error;
    if (incidentResult.error) throw incidentResult.error;

    return NextResponse.json({
      service: updateResult.data,
      incident: incidentResult.data,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}
