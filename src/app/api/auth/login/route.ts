import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/auth/login
// Body: { email, password }
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json() as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      return NextResponse.json({ error: error?.message ?? 'Invalid credentials' }, { status: 401 });
    }

    // Fetch public profile
    const { data: profile } = await supabase
      .from('users')
      .select('id, email, full_name, plan_id')
      .eq('id', data.user.id)
      .single();

    const isProd = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({
      message: 'Logged in successfully',
      user: profile ?? { id: data.user.id, email, full_name: '', plan_id: 'free' },
    });

    // Access token — 7 days. Middleware will silently refresh it using the
    // refresh token, so the user never gets kicked out during normal use.
    response.cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,   // 7 days
      path: '/',
    });

    // Refresh token — 30 days. Used by middleware to get new access tokens.
    response.cookies.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,  // 30 days
      path: '/',
    });

    return response;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
