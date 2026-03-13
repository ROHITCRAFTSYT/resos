import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PROTECTED: string[] = []; // dashboard is public for demo

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  const accessToken  = request.cookies.get('sb-access-token')?.value;
  const refreshToken = request.cookies.get('sb-refresh-token')?.value;

  // ── Not a protected route — still try to refresh silently ─────────────────
  if (!isProtected) return NextResponse.next();

  // ── No tokens at all → redirect to login ──────────────────────────────────
  if (!accessToken && !refreshToken) {
    return redirectToLogin(request, pathname);
  }

  // ── Try to validate / refresh via Supabase ────────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // If we have both tokens, restore the session so Supabase can refresh it
  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  // Validate the current user (this also auto-refreshes if token is expired)
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    // Access token invalid — try refreshing with refresh token
    if (refreshToken) {
      const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (refreshErr || !refreshed.session) {
        // Refresh token is also dead → kick to login
        return redirectToLogin(request, pathname);
      }

      // Refresh succeeded — update cookies and continue
      const response = NextResponse.next();
      setCookies(response, refreshed.session.access_token, refreshed.session.refresh_token);
      return response;
    }

    return redirectToLogin(request, pathname);
  }

  // ── Valid user — pass through. Also refresh cookies to extend lifetime ─────
  const response = NextResponse.next();

  // Get fresh session to check if tokens were silently refreshed
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session) {
    setCookies(
      response,
      sessionData.session.access_token,
      sessionData.session.refresh_token
    );
  }

  return response;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  const response = NextResponse.redirect(loginUrl);
  // Clear stale cookies
  response.cookies.set('sb-access-token',  '', { maxAge: 0, path: '/' });
  response.cookies.set('sb-refresh-token', '', { maxAge: 0, path: '/' });
  return response;
}

function setCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  const isProd = process.env.NODE_ENV === 'production';

  response.cookies.set('sb-access-token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,  // 7 days (Supabase refreshes keep extending this)
    path: '/',
  });
  response.cookies.set('sb-refresh-token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
