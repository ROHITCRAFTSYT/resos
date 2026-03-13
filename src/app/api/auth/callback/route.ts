import { NextRequest, NextResponse } from 'next/server';

// GET /api/auth/callback
// Supabase may hit this path if the redirect URL was set to the old API route.
// We forward everything to the real client-side callback page which can access
// localStorage and perform the PKCE code exchange properly.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const target = new URL('/auth/callback', req.url);

  // Forward all query params (code, error, error_description, etc.)
  searchParams.forEach((value, key) => target.searchParams.set(key, value));

  return NextResponse.redirect(target);
}
