import Link from 'next/link';
import { PricingSection } from '@/components/PricingSection';
import { Boxes } from '@/components/Boxes';

export const metadata = {
  title: 'Pricing — ResilienceOS',
  description: 'Simple, transparent pricing for government digital service monitoring.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black font-mono relative overflow-hidden">

      {/* ── Boxes grid background ─────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <Boxes />
      </div>

      {/* Nav */}
      <div className="border-b border-white/10 sticky top-0 z-30 bg-black/80 backdrop-blur-sm">
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/50 hover:text-white text-[10px] tracking-widest transition-colors">
              ← BACK
            </Link>
            <div className="w-px h-4 bg-white/20" />
            <Link href="/" className="font-bold text-base tracking-widest italic -skew-x-6 text-white">
              RESILIENCE<span className="text-green-400">OS</span>
            </Link>
            <span className="text-[9px] text-white/30 tracking-widest hidden lg:inline">· PRICING</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-[10px] text-white/50 hover:text-white tracking-widest transition-colors"
            >
              SIGN IN
            </Link>
            <Link
              href="/login?mode=signup&plan=free"
              className="px-3 py-1.5 text-[9px] font-bold tracking-widest border border-green-400/40 text-green-400 hover:bg-green-400/10 transition-all"
            >
              GET STARTED FREE →
            </Link>
          </div>
        </div>
      </div>

      {/* All scrollable content — sits above the boxes grid */}
      <div className="relative z-10">
        {/* Pricing section */}
        <PricingSection />

        {/* FAQ strip */}
        <div className="border-t border-white/10 bg-black/60 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
            {[
              {
                q: 'Can I upgrade later?',
                a: 'Yes — upgrade or downgrade your plan at any time from your account settings. Changes take effect immediately.',
              },
              {
                q: 'Is the free plan really free?',
                a: 'Completely free, forever. No credit card required. Monitor up to 3 services with full real-time access.',
              },
              {
                q: 'What is Chaos Mode?',
                a: 'Chaos Mode lets you inject simulated failures into services to test your resilience posture and fallback routes.',
              },
            ].map((item) => (
              <div key={item.q} className="space-y-2">
                <p className="text-[11px] font-bold text-white tracking-wider">{item.q}</p>
                <p className="text-[10px] text-white/40 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-4 py-5 text-center">
          <p className="text-[9px] text-white/20 tracking-[0.3em]">
            RESILIENCEOS · DIGITAL SERVICES RESILIENCE PLATFORM · V1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
