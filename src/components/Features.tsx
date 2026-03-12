"use client";

import { Activity, Zap, Shield, Clock, ArrowRight, Globe, Timer } from "lucide-react";
import { FeedbackSection } from "@/components/FeedbackSection";
import { LiveMapCell } from "@/components/LiveMapCell";
import { Area, AreaChart, CartesianGrid } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { HighlightGroup, HighlighterItem, Particles } from "@/components/Particles";

// ─── Monitoring Chart ─────────────────────────────────────────────────────────

const chartConfig = {
  desktop: { label: "Requests", color: "#4ade80" },
  mobile:  { label: "Errors",   color: "#f87171" },
} satisfies ChartConfig;

const chartData = [
  { month: "May",      desktop: 56,  mobile: 12  },
  { month: "June",     desktop: 80,  mobile: 8   },
  { month: "January",  desktop: 126, mobile: 22  },
  { month: "February", desktop: 205, mobile: 18  },
  { month: "March",    desktop: 180, mobile: 40  },
  { month: "April",    desktop: 400, mobile: 15  },
];

const MonitoringChart = () => (
  <ChartContainer className="h-64 md:h-80 aspect-auto w-full" config={chartConfig}>
    <AreaChart
      accessibilityLayer
      data={chartData}
      margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
    >
      <defs>
        <linearGradient id="fillRequests" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#4ade80" stopOpacity={0.25} />
          <stop offset="80%" stopColor="#4ade80" stopOpacity={0}    />
        </linearGradient>
        <linearGradient id="fillErrors" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#f87171" stopOpacity={0.25} />
          <stop offset="80%" stopColor="#f87171" stopOpacity={0}    />
        </linearGradient>
      </defs>
      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
      <ChartTooltip
        cursor={false}
        content={<ChartTooltipContent className="bg-black border-white/20 font-mono text-xs" />}
      />
      <Area
        strokeWidth={1.5}
        dataKey="mobile"
        type="stepBefore"
        fill="url(#fillErrors)"
        stroke="#f87171"
        stackId="a"
      />
      <Area
        strokeWidth={1.5}
        dataKey="desktop"
        type="stepBefore"
        fill="url(#fillRequests)"
        stroke="#4ade80"
        stackId="a"
      />
    </AreaChart>
  </ChartContainer>
);

// ─── Cell-5 card definitions ───────────────────────────────────────────────────

const cell5Cards = [
  {
    icon: <Zap className="size-3 text-red-400" />,
    label: "CHAOS MODE",
    title: "Inject failures on demand",
    desc:  "Force any service into outage or degraded state to validate your fallback routes and incident response.",
    accent: "border-red-500/20 bg-red-500/5",
    tag:   "text-red-400",
  },
  {
    icon: <Shield className="size-3 text-yellow-400" />,
    label: "RESILIENCE SCORING",
    title: "Know your weak points",
    desc:  "Each service is scored by uptime %, latency trend, and recovery time to surface hidden fragility.",
    accent: "border-yellow-400/20 bg-yellow-400/5",
    tag:   "text-yellow-400",
  },
  {
    icon: <Activity className="size-3 text-green-400" />,
    label: "REAL-TIME HEALTH",
    title: "60-second health pulses",
    desc:  "Every service is pinged every minute. Status changes propagate instantly via Supabase Realtime.",
    accent: "border-green-400/20 bg-green-400/5",
    tag:   "text-green-400",
  },
];

// ─── Tech-stack highlight cards (bottom section) ─────────────────────────────

const techCards = [
  {
    icon: <Zap className="size-4 text-green-400" />,
    tag:   "text-green-400",
    label: "SUPABASE REALTIME",
    title: "Live data, zero polling",
    desc:  "WebSocket-based postgres_changes subscriptions push every service update, incident, and health-check INSERT directly to the browser the instant it lands in the DB.",
    stat:  { value: "<50ms", label: "PUSH LATENCY" },
  },
  {
    icon: <Clock className="size-4 text-blue-400" />,
    tag:   "text-blue-400",
    label: "VERCEL CRON",
    title: "Automated 60-second pulses",
    desc:  "A Vercel cron job triggers the /api/health-check route every minute. Each run pings all 8 government endpoints in parallel and writes results back to Supabase.",
    stat:  { value: "60s", label: "CHECK INTERVAL" },
  },
  {
    icon: <Shield className="size-4 text-red-400" />,
    tag:   "text-red-400",
    label: "CHAOS ENGINEERING",
    title: "Controlled failure injection",
    desc:  "Flip any service into outage or degraded state with a single click. Chaos flags are persisted to the DB so health-check crons skip the injected service — real-world simulation.",
    stat:  { value: "8", label: "TARGET SERVICES" },
  },
  {
    icon: <ArrowRight className="size-4 text-yellow-400" />,
    tag:   "text-yellow-400",
    label: "FALLBACK ROUTING",
    title: "Citizens always have an exit",
    desc:  "Every service carries fallback routes — offline tools, IVR helplines, UMANG alternatives. Shown automatically when status is degraded or outage.",
    stat:  { value: "3+", label: "FALLBACKS/SERVICE" },
  },
  {
    icon: <Globe className="size-4 text-cyan-400" />,
    tag:   "text-cyan-400",
    label: "REGIONAL HEALTH",
    title: "Pan-India zone coverage",
    desc:  "Services are tagged IN-CENTRAL, IN-NORTH, IN-SOUTH, IN-EAST, IN-WEST. The dashboard regional panel shows live zone health at a glance, highlighting failing regions instantly.",
    stat:  { value: "5", label: "ZONES COVERED" },
  },
  {
    icon: <Timer className="size-4 text-purple-400" />,
    tag:   "text-purple-400",
    label: "UPTIME TRACKING",
    title: "Rolling 24-hour accuracy",
    desc:  "After every health-check run, uptime_percent is recalculated from the last 24 hours of health_checks rows — not a static seed value. Accuracy improves with every ping.",
    stat:  { value: "24h", label: "ROLLING WINDOW" },
  },
];

// ─── Main Features Component ──────────────────────────────────────────────────

export function Features() {
  return (
    <section className="relative font-mono px-4 py-16 md:py-32 overflow-hidden">

      {/* ── Ambient floating particles (mouse-reactive) ── */}
      <Particles
        className="pointer-events-none z-0"
        quantity={80}
        staticity={40}
        ease={60}
        color="#4ade80"
      />

      {/* Section header */}
      <div className="relative z-10 mx-auto max-w-5xl mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-6 h-px bg-green-400/60" />
          <span className="text-[10px] text-green-400/80 tracking-[0.3em]">PLATFORM CAPABILITIES</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-widest text-white">
          BUILT FOR RESILIENCE
        </h2>
        <p className="text-white/40 text-xs tracking-wider mt-2">
          Every layer of the stack designed to survive, detect, and recover.
        </p>
      </div>

      {/* Feature grid */}
      <div className="relative z-10 mx-auto max-w-5xl border border-white/10 md:grid md:grid-cols-2">

        {/* ── Cell 1: Real-time service geography (live Supabase data) ── */}
        <LiveMapCell />

        {/* ── Cell 2: Fallback & incident support ── */}
        <div className="border-b border-white/10 bg-zinc-950/50 p-6 sm:p-10 md:border-b">
          <div className="relative z-10">
            <span className="flex items-center gap-2 text-[10px] text-white/40 tracking-widest mb-6">
              <Shield className="size-3 text-yellow-400" />
              FALLBACK ROUTE INTELLIGENCE
            </span>
            <p className="text-xl font-bold tracking-wide text-white leading-snug mb-8">
              When a service goes down, citizens are instantly directed to working alternatives.
            </p>
          </div>

          {/* Mock chat / incident thread */}
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex items-center justify-center size-4 rounded-full border border-white/20">
                  <span className="size-2 rounded-full bg-red-500" />
                </span>
                <span className="text-[9px] text-white/30 tracking-wider">INCIDENT DETECTED · 14:32 UTC</span>
              </div>
              <div className="border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] text-white/70 w-4/5">
                GST Portal is unreachable — full outage detected.
              </div>
            </div>
            <div>
              <div className="border border-green-400/20 bg-green-400/5 mb-1 ml-auto px-3 py-2 text-[11px] text-white/70 w-4/5 text-right">
                ✓ Fallback activated → Offline Return Utility + GST Helpdesk 1800-103-4786
              </div>
              <span className="text-[9px] text-white/30 block text-right tracking-wider">AUTOMATED · NOW</span>
            </div>
            <div className="border border-yellow-400/20 bg-yellow-400/5 px-3 py-2 text-[11px] text-yellow-400/80 w-4/5">
              ⚡ Chaos injection active on EPFO. Resilience test running.
            </div>
          </div>
        </div>

        {/* ── Cell 3: Full-width uptime stat ── */}
        <div className="col-span-full border-t border-b border-white/10 py-10 px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16">
            <div className="text-center">
              <p className="text-5xl md:text-7xl font-bold tracking-widest text-white">99.99<span className="text-green-400">%</span></p>
              <p className="text-[10px] text-white/30 tracking-[0.4em] mt-2">TARGET UPTIME</p>
            </div>
            <div className="hidden md:block w-px h-16 bg-white/10" />
            <div className="flex gap-8 md:gap-12">
              {[
                { value: "8",    label: "SERVICES",    color: "text-green-400"  },
                { value: "<1s",  label: "DETECTION",   color: "text-blue-400"   },
                { value: "24/7", label: "MONITORING",  color: "text-yellow-400" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`text-2xl md:text-3xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[9px] text-white/30 tracking-[0.3em] mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Cell 4: Activity chart (full width) ── */}
        <div className="col-span-full relative">
          <div className="absolute z-10 max-w-md px-6 pt-8 md:px-10 md:pt-10">
            <span className="flex items-center gap-2 text-[10px] text-white/40 tracking-widest mb-4">
              <Activity className="size-3 text-blue-400" />
              LIVE ACTIVITY FEED
            </span>
            <p className="text-xl font-bold tracking-wide text-white leading-snug">
              Monitor request volume and error rates in real-time.{" "}
              <span className="text-white/40 font-normal">
                Detect anomalies before they become outages.
              </span>
            </p>

            {/* Legend */}
            <div className="flex gap-4 mt-5">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-green-400" />
                <span className="text-[9px] text-white/40">REQUESTS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-red-400" />
                <span className="text-[9px] text-white/40">ERRORS</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="pt-4 border-t border-white/10">
            <MonitoringChart />
          </div>
        </div>

        {/* ── Cell 5: Chaos mode callout — HighlightGroup + HighlighterItem ── */}
        {/* HighlightGroup replaces the outer div so it can track mouse across all 3 cards */}
        <HighlightGroup className="col-span-full border-t border-white/10 grid md:grid-cols-3">
          {cell5Cards.map((card, i) => (
            <HighlighterItem
              key={i}
              className={`border-b md:border-b-0 border-white/10 ${i < 2 ? "md:border-r" : ""}`}
            >
              {/* bg-black fills the p-px gap so the green glow shows at the edges on hover */}
              <div className="h-full bg-black p-6 sm:p-8">
                <span className={`flex items-center gap-2 text-[10px] tracking-widest mb-4 ${card.tag}`}>
                  {card.icon}
                  {card.label}
                </span>
                <p className="text-sm font-bold text-white mb-2 tracking-wide">{card.title}</p>
                <p className="text-[11px] text-white/40 leading-relaxed">{card.desc}</p>
                <div className={`mt-4 border px-2 py-1 text-[9px] ${card.accent} ${card.tag} tracking-widest w-fit`}>
                  ACTIVE
                </div>
              </div>
            </HighlighterItem>
          ))}
        </HighlightGroup>

      </div>

      {/* ── Bottom: Tech-stack highlight cards ─────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-5xl mt-16">

        {/* Section header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-6 h-px bg-white/20" />
          <span className="text-[10px] text-white/40 tracking-[0.3em]">TECHNICAL FOUNDATION</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* 3 × 2 highlight grid — mouse-following green glow on hover */}
        <HighlightGroup className="grid grid-cols-1 md:grid-cols-3 border border-white/10">
          {techCards.map((card, i) => (
            <HighlighterItem
              key={i}
              className={[
                "border-b border-white/10",
                i >= 3 ? "md:border-b-0" : "",
                i % 3 !== 2 ? "md:border-r" : "",
              ].join(" ")}
            >
              {/* bg-black fills the 1px p-px gap — this is what makes the green glow visible at card edges */}
              <div className="h-full bg-black p-6 sm:p-8 flex flex-col gap-4">

                {/* Icon + label */}
                <div className="flex items-center gap-2">
                  {card.icon}
                  <span className={`text-[9px] font-bold tracking-[0.25em] ${card.tag}`}>
                    {card.label}
                  </span>
                </div>

                {/* Title */}
                <p className="text-sm font-bold text-white tracking-wide leading-snug">
                  {card.title}
                </p>

                {/* Description */}
                <p className="text-[11px] text-white/40 leading-relaxed flex-1">
                  {card.desc}
                </p>

                {/* Stat chip */}
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <span className={`text-lg font-bold tabular-nums ${card.tag}`}>
                    {card.stat.value}
                  </span>
                  <span className="text-[8px] text-white/25 tracking-[0.25em]">
                    {card.stat.label}
                  </span>
                </div>

              </div>
            </HighlighterItem>
          ))}
        </HighlightGroup>

        {/* Bottom caption */}
        <div className="mt-6 flex items-center justify-between text-[8px] text-white/20 tracking-[0.25em]">
          <span>RESILIENCEOS · OPEN PLATFORM</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse inline-block" />
            ALL SYSTEMS MONITORED
          </span>
        </div>

      </div>

      {/* ── Feedback / Testimonials ──────────────────────────────────────────── */}
      <div className="relative z-10">
        <FeedbackSection />
      </div>

    </section>
  );
}
