import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAuth, unauthorized } from '@/lib/auth';
import type { DbService } from '@/lib/supabase';

// Only these fields may be updated via the public API (prevents mass-assignment)
const ALLOWED_UPDATE_FIELDS: (keyof DbService)[] = [
  'status', 'latency_ms', 'uptime_percent', 'chaos_active',
];

const isProd = process.env.NODE_ENV === 'production';
function safeError(err: unknown) {
  return isProd ? 'Internal server error' : (err instanceof Error ? err.message : 'Unknown error');
}

// GET /api/services — fetch all services (ordered by name)
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from('services')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ services: data as DbService[] });
  } catch (err: unknown) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}

// PATCH /api/services — update whitelisted fields on a single service
// Body: { id: string; status?: string; latency_ms?: number; uptime_percent?: number; chaos_active?: boolean }
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorized();

  try {
    const body = await req.json();
    const { id, ...rest } = body as { id: string } & Partial<DbService>;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Whitelist: only allow known safe fields
    const updates = Object.fromEntries(
      Object.entries(rest).filter(([key]) => ALLOWED_UPDATE_FIELDS.includes(key as keyof DbService))
    );

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const db = createServiceClient();
    const { data, error } = await db
      .from('services')
      .update({ ...updates, last_checked_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ service: data as DbService });
  } catch (err: unknown) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}
