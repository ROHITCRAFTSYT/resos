import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// POST /api/auth/register
// Body: { email, password, fullName, planId? }
export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, planId = 'free' } = await req.json() as {
      email: string;
      password: string;
      fullName: string;
      planId?: string;
    };

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'email, password, and fullName are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const VALID_PLAN_IDS = ['free', 'pro', 'enterprise'];
    if (!VALID_PLAN_IDS.includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const db = createServiceClient();

    // Create auth user via Supabase Admin API
    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,   // skip email confirmation for demo
      user_metadata: { full_name: fullName },
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? 'Failed to create user' }, { status: 400 });
    }

    const userId = authData.user.id;

    // Insert into public.users
    const { error: profileError } = await db.from('users').insert({
      id: userId,
      email,
      full_name: fullName,
      plan_id: planId,
    });

    if (profileError) {
      // Rollback auth user if profile insert fails
      await db.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Create initial subscription record
    await db.from('subscriptions').insert({
      user_id: userId,
      plan_id: planId,
      status: 'active',
    });

    return NextResponse.json({
      message: 'Account created successfully',
      user: { id: userId, email, fullName, planId },
    }, { status: 201 });

  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
