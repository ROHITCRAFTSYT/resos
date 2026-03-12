import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAuth, unauthorized } from '@/lib/auth';
import type { DbIncident } from '@/lib/supabase';

const VALID_INCIDENT_TYPES = ['outage', 'degraded', 'restored', 'chaos'] as const;
const MAX_MESSAGE_LENGTH = 500;

const isProd = process.env.NODE_ENV === 'production';
function safeError(err: unknown) {
  return isProd ? 'Internal server error' : (err instanceof Error ? err.message : 'Unknown error');
}

// GET /api/incidents — fetch recent incidents (last 50)
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ incidents: data as DbIncident[] });
  } catch (err: unknown) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}

// POST /api/incidents — create a new incident
// Body: { service_id, service_name, type, message }
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  try {
    const body = await req.json() as {
      service_id: string;
      service_name: string;
      type: DbIncident['type'];
      message: string;
    };

    const { service_id, service_name, type, message } = body;

    if (!service_id || !service_name || !type || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!VALID_INCIDENT_TYPES.includes(type as typeof VALID_INCIDENT_TYPES[number])) {
      return NextResponse.json({ error: 'Invalid incident type' }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `message exceeds ${MAX_MESSAGE_LENGTH} characters` }, { status: 400 });
    }

    const db = createServiceClient();
    const { data, error } = await db
      .from('incidents')
      .insert({
        service_id,
        service_name,
        type,
        message,
        resolved: type === 'restored',
        resolved_at: type === 'restored' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ incident: data as DbIncident }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}

// PATCH /api/incidents — mark an incident as resolved
// Body: { id: string }
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  try {
    const body = await req.json() as { id: string };

    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = createServiceClient();
    const { data, error } = await db
      .from('incidents')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ incident: data as DbIncident });
  } catch (err: unknown) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}
