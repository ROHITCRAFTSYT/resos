'use client';
// This page handles the Google OAuth redirect.
// It MUST be a client component because Supabase stores the PKCE code verifier
// in localStorage during signInWithOAuth(). The exchange only succeeds in the
// same browser context — a server-side API route can't access localStorage.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('COMPLETING SIGN IN…');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code      = params.get('code');
    const error     = params.get('error');
    const errorDesc = params.get('error_description');

    // OAuth provider returned an error (e.g. user cancelled)
    if (error) {
      router.replace(`/login?error=${encodeURIComponent(errorDesc ?? error)}`);
      return;
    }

    if (!code) {
      router.replace('/login?error=Missing+authorisation+code+from+provider.');
      return;
    }

    async function finish() {
      try {
        setStatus('VERIFYING WITH GOOGLE…');

        // Exchange the one-time code for a session.
        // This works here because localStorage (holding the PKCE verifier) is
        // accessible to the browser — a server route would fail at this step.
        const { data, error: exchErr } = await supabase.auth.exchangeCodeForSession(code!);

        if (exchErr || !data.session) {
          router.replace(
            `/login?error=${encodeURIComponent(exchErr?.message ?? 'Google sign-in failed. Please try again.')}`
          );
          return;
        }

        setStatus('SETTING UP SESSION…');

        // Send tokens to our API which sets secure httpOnly cookies and
        // upserts the user profile into public.users.
        const res = await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token:  data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        });

        if (!res.ok) {
          router.replace('/login?error=Session+setup+failed.+Please+try+again.');
          return;
        }

        setStatus('REDIRECTING…');
        router.replace('/dashboard');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unexpected error during sign-in.';
        router.replace(`/login?error=${encodeURIComponent(msg)}`);
      }
    }

    finish();
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 font-mono">
      {/* Animated Google G */}
      <svg className="w-8 h-8 opacity-60" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      <div className="text-green-400 text-[11px] tracking-widest animate-pulse">{status}</div>
      <div className="flex gap-1 mt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1 h-1 rounded-full bg-green-400/50 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
