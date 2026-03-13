import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/auth/set-session
// Called by the client-side /auth/callback page after it has successfully
// exchanged the OAuth code for tokens via supabase.auth.exchangeCodeForSession().
// We validate the access_token, set secure httpOnly cookies, and upsert the
// user profile into public.users.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { access_token?: unknown; refresh_token?: unknown };

    if (typeof body.access_token !== 'string' || typeof body.refresh_token !== 'string') {
      return NextResponse.json({ error: 'Invalid token payload.' }, { status: 400 });
    }

    const { access_token, refresh_token } = body;

    // Validate the token by fetching the user — prevents token injection attacks
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser(access_token);

    if (userErr || !user) {
      return NextResponse.json({ error: 'Invalid access token.' }, { status: 401 });
    }

    // Upsert the user profile into public.users (service role bypasses RLS)
    // Only non-sensitive profile data is stored here. Supabase Auth stores
    // passwords as bcrypt hashes and OAuth tokens AES-256 encrypted at rest.
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const fullName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name    as string | undefined) ??
      '';

    await db.from('users').upsert(
      {
        id:         user.id,
        email:      user.email ?? '',
        full_name:  fullName,
        plan_id:    'free',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id', ignoreDuplicates: false }
    );

    // Set httpOnly session cookies
    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({ ok: true });

    response.cookies.set('sb-access-token', access_token, {
      httpOnly: true,
      secure:   isProd,
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 7,   // 7 days
      path:     '/',
    });

    response.cookies.set('sb-refresh-token', refresh_token, {
      httpOnly: true,
      secure:   isProd,
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 30,  // 30 days
      path:     '/',
    });

    return response;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
