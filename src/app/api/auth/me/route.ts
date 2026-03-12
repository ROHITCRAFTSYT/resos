import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/auth/me — returns current user from session cookie
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('sb-access-token')?.value;
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Validate the JWT by calling getUser with it
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Fetch public profile + plan
    const { data: profile } = await supabase
      .from('users')
      .select('id, email, full_name, plan_id, plans(label, price_monthly, features)')
      .eq('id', user.id)
      .single();

    return NextResponse.json({ user: profile ?? { id: user.id, email: user.email, full_name: '', plan_id: 'free' } });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
