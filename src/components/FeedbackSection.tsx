"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Plus } from "lucide-react";
import { SpecialText } from "@/components/SpecialText";

// ─── Testimonial data ─────────────────────────────────────────────────────────

const testimonials = [
  {
    quote:
      "During the UIDAI outage last quarter we had zero citizen calls go unanswered. ResilienceOS surfaced the fallback routes before our helpdesk even raised a ticket.",
    name: "ARJUN MEHTA",
    role: "SR. DEVOPS ENGINEER · NIC",
    avatar: "AM",
    color: "text-green-400",
    borderColor: "border-green-400/30",
    bgColor: "bg-green-400/10",
    stars: 5,
  },
  {
    quote:
      "The Chaos Mode alone justified the adoption. We now run mandatory chaos drills every sprint. Recovery time dropped by 60% in two months.",
    name: "PRIYA NAIR",
    role: "PLATFORM LEAD · MEITY",
    avatar: "PN",
    color: "text-blue-400",
    borderColor: "border-blue-400/30",
    bgColor: "bg-blue-400/10",
    stars: 5,
  },
  {
    quote:
      "Supabase Realtime + the 60-second cron is genuinely impressive. Status changes appear in the dashboard before our own monitoring alerts fire.",
    name: "KIRAN REDDY",
    role: "INFRASTRUCTURE ARCHITECT · DigiLocker",
    avatar: "KR",
    color: "text-yellow-400",
    borderColor: "border-yellow-400/30",
    bgColor: "bg-yellow-400/10",
    stars: 5,
  },
];

// ─── Mini card shown flying out of the folder ─────────────────────────────────

function MiniCard({ data }: { data: (typeof testimonials)[0] }) {
  return (
    <div
      className="w-full h-full rounded-xl border border-white/10 p-3 flex flex-col gap-1.5 overflow-hidden"
      style={{ background: "linear-gradient(to bottom, #1a1a1a, #0d0d0d)" }}
    >
      <div
        className={`inline-flex items-center justify-center w-5 h-5 text-[7px] font-bold border flex-shrink-0 font-mono
          ${data.borderColor} ${data.bgColor} ${data.color}`}
      >
        {data.avatar}
      </div>
      <p className={`text-[7px] font-bold tracking-wider font-mono ${data.color}`}>
        {data.name}
      </p>
      <div className="flex gap-0.5">
        {Array.from({ length: data.stars }).map((_, s) => (
          <span key={s} className="text-green-400 text-[6px]">★</span>
        ))}
      </div>
      <p className="text-[6px] text-white/30 leading-tight font-mono line-clamp-4">
        &ldquo;{data.quote.substring(0, 72)}…&rdquo;
      </p>
    </div>
  );
}

// ─── Card configs (position + spring) ────────────────────────────────────────

const cardConfigs = [
  {
    initial:    { rotate: -3, x: -38, y: 2 },
    open:       { rotate: -8, x: -70, y: -75 },
    transition: { type: "spring" as const, bounce: 0.15, stiffness: 160, damping: 22 },
    zClass: "z-10",
    dataIdx: 0,
  },
  {
    initial:    { rotate: 0, x: 0, y: 0 },
    open:       { rotate: 1, x: 2, y: -95 },
    transition: { type: "spring" as const, duration: 0.55, bounce: 0.12, stiffness: 190, damping: 24 },
    zClass: "z-20",
    dataIdx: 1,
  },
  {
    initial:    { rotate: 3.5, x: 42, y: 1 },
    open:       { rotate: 9, x: 75, y: -80 },
    transition: { type: "spring" as const, duration: 0.58, bounce: 0.17, stiffness: 170, damping: 21 },
    zClass: "z-10",
    dataIdx: 2,
  },
];

// ─── Testimonial modal popup ──────────────────────────────────────────────────

function TestimonialModal({ onClose }: { onClose: () => void }) {
  return (
    // Backdrop
    <motion.div
      key="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      {/* Panel */}
      <motion.div
        key="modal-panel"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="relative w-full max-w-4xl font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Green glow behind panel */}
        <div
          className="absolute -inset-px pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(74,222,128,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Modal chrome */}
        <div className="border border-white/10 bg-black">

          {/* Header bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-white/40 tracking-[0.3em]">OPERATOR FEEDBACK</span>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 border border-white/10
                text-white/40 hover:text-white hover:border-white/30 transition-all"
              aria-label="Close"
            >
              <X size={12} />
            </button>
          </div>

          {/* Heading inside modal */}
          <div className="px-6 pt-6 pb-4 text-center">
            <h3 className="text-xl font-bold tracking-widest text-white flex flex-wrap items-center justify-center gap-2">
              <SpecialText speed={20} delay={0.05} className="text-xl font-bold tracking-widest text-white">
                WALL OF
              </SpecialText>
              <span className="inline-flex items-center gap-1.5 text-green-400 border border-green-400/20 bg-green-400/5 px-3 py-0.5">
                <SpecialText speed={18} delay={0.4} className="text-xl font-bold tracking-widest text-green-400">
                  LOVE
                </SpecialText>
                {" ★"}
              </span>
            </h3>
            <div className="mt-2">
              <SpecialText speed={12} delay={0.8} className="text-[9px] text-white/30 tracking-[0.3em]">
                WHAT GOVERNMENT OPERATORS SAY ABOUT RESILIENCEOS
              </SpecialText>
            </div>
          </div>

          {/* Testimonial grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-white/10">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.07, duration: 0.3 }}
                className={[
                  "p-6 flex flex-col gap-4",
                  i < 2 ? "border-b border-white/10 md:border-b-0 md:border-r" : "",
                ].join(" ")}
              >
                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <span key={s} className="text-green-400 text-[10px]">★</span>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-[11px] text-white/50 leading-relaxed flex-1 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Divider */}
                <div className="w-full h-px bg-white/5" />

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-8 h-8 border text-[9px]
                      font-bold tracking-wider flex-shrink-0
                      ${t.borderColor} ${t.bgColor} ${t.color}`}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold tracking-widest ${t.color}`}>
                      {t.name}
                    </p>
                    <p className="text-[8px] text-white/30 tracking-[0.2em] mt-0.5">
                      {t.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA strip */}
          <div className="border-t border-white/10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-green-400/5">
            <div>
              <p className="text-[11px] font-bold text-white tracking-wider">
                JOIN GOVERNMENT TEAMS ALREADY ON RESILIENCEOS
              </p>
              <p className="text-[9px] text-white/30 tracking-wider mt-0.5">
                Free tier · No credit card · Live in under 5 minutes
              </p>
            </div>
            <a
              href="/login?mode=signup&plan=free"
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold
                tracking-widest border border-green-400/40 text-green-400
                hover:bg-green-400/10 transition-all whitespace-nowrap"
            >
              <Plus size={12} />
              GET STARTED FREE
            </a>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function FeedbackSection() {
  const [isOpen, setIsOpen]       = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const open  = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <>
      {/* ── Popup modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && <TestimonialModal onClose={close} />}
      </AnimatePresence>

      {/* ── Section ─────────────────────────────────────────────────── */}
      <div className="w-full flex flex-col items-center justify-center py-20 px-4 font-mono">

        {/* Section rule */}
        <div className="w-full max-w-5xl flex items-center gap-3 mb-12">
          <div className="w-6 h-px bg-white/20" />
          <span className="text-[10px] text-white/40 tracking-[0.3em]">OPERATOR FEEDBACK</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Heading */}
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-widest text-white flex flex-wrap items-center justify-center gap-3">
            {/* "WALL OF" scrambles in on scroll */}
            <SpecialText
              speed={22}
              delay={0.1}
              inView
              once
              className="text-3xl font-bold tracking-widest text-white"
            >
              WALL OF
            </SpecialText>

            {/* "LOVE ★" chip — scrambles in with a short delay, then stays hoverable */}
            <motion.span
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
              className="relative cursor-default inline-flex items-center gap-2 px-4 py-1
                border border-green-400/20 bg-green-400/5 text-green-400
                hover:bg-green-400/10 hover:border-green-400/40 transition-colors duration-300"
            >
              <SpecialText
                speed={18}
                delay={0.55}
                inView
                once
                className="text-3xl font-bold tracking-widest text-green-400"
              >
                LOVE
              </SpecialText>
              <motion.span
                animate={isHovered ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.7, repeat: isHovered ? Infinity : 0, ease: "easeInOut" }}
                className="inline-block"
              >
                ★
              </motion.span>
            </motion.span>
          </h2>

          {/* Subtitle also scrambles — longer delay so it follows the title */}
          <div className="mt-3">
            <SpecialText
              speed={15}
              delay={1.1}
              inView
              once
              className="text-[10px] text-white/30 tracking-[0.3em]"
            >
              WHAT GOVERNMENT OPERATORS SAY ABOUT RESILIENCEOS
            </SpecialText>
          </div>
        </div>

        {/* ── Animated folder (click → open modal) ────────────────── */}
        <div
          onClick={open}
          className="w-80 h-52 relative group cursor-pointer mb-6"
        >
          {/* Folder body */}
          <div
            className="relative w-[87.5%] mx-auto h-full flex justify-center rounded-xl overflow-visible"
            style={{
              background: "#111111",
              border: "1px solid rgba(74,222,128,0.15)",
            }}
          >
            {cardConfigs.map((cfg, i) => (
              <motion.div
                key={i}
                initial={cfg.initial}
                animate={cfg.initial}
                whileHover={{ y: cfg.initial.y - 8, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                className={`absolute top-2 w-32 rounded-xl shadow-lg ${cfg.zClass}`}
                style={{ height: "7.5rem" }}
              >
                <MiniCard data={testimonials[cfg.dataIdx]} />
              </motion.div>
            ))}
          </div>

          {/* Folder flap */}
          <motion.div
            whileHover={{ rotateX: -8 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            className="absolute inset-x-0 -bottom-px z-30 h-44 rounded-3xl origin-bottom
              flex justify-center items-center overflow-visible"
          >
            <div className="relative w-full h-full">
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 235 121"
                fill="none"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M104.615 0.350494L33.1297 0.838776C32.7542 0.841362 32.3825 0.881463 32.032 0.918854C31.6754 0.956907 31.3392 0.992086 31.0057 0.992096H31.0047C30.6871 0.99235 30.3673 0.962051 30.0272 0.929596C29.6927 0.897686 29.3384 0.863802 28.9803 0.866119L13.2693 0.967682H13.2527L13.2352 0.969635C13.1239 0.981406 13.0121 0.986674 12.9002 0.986237H9.91388C8.33299 0.958599 6.76052 1.22345 5.27423 1.76651H5.27325C4.33579 2.11246 3.48761 2.66213 2.7879 3.37393L2.49689 3.68839L2.492 3.69424C1.62667 4.73882 1.00023 5.96217 0.656067 7.27725C0.653324 7.28773 0.654065 7.29886 0.652161 7.30948C0.3098 8.62705 0.257231 10.0048 0.499817 11.3446L12.2147 114.399L12.2156 114.411L12.2176 114.423C12.6046 116.568 13.7287 118.508 15.3934 119.902C17.058 121.297 19.1572 122.056 21.3231 122.049V122.05H215.379C217.76 122.02 220.064 121.192 221.926 119.698V119.697C223.657 118.384 224.857 116.485 225.305 114.35L225.307 114.339L235.914 53.3798L235.968 53.1093L235.97 53.0985L235.971 53.0888C236.134 51.8978 236.044 50.685 235.705 49.5321C235.307 48.1669 234.63 46.9005 233.717 45.8144L233.383 45.4296C232.58 44.5553 231.614 43.8449 230.539 43.3398C229.311 42.7628 227.971 42.4685 226.616 42.4774H146.746C144.063 42.4705 141.423 41.8004 139.056 40.5263C136.691 39.2522 134.671 37.4127 133.175 35.1689L113.548 5.05948L113.544 5.05362L113.539 5.04776C112.545 3.65165 111.238 2.51062 109.722 1.72061C108.266 0.886502 106.627 0.422235 104.952 0.365143V0.364166L104.633 0.350494H104.615Z"
                  fill="#0d0d0d"
                  stroke="rgba(74,222,128,0.18)"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Dots on flap */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none">
                <div className="flex gap-11 mb-2.5">
                  <div className="w-2.5 h-2.5 bg-green-400/20 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-green-400/20 rounded-full" />
                </div>
                <div className="w-9 h-1 bg-green-400/20 rounded-full" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Click hint */}
        <p className="text-[8px] text-white/20 tracking-[0.35em]">
          ▼ CLICK TO VIEW TESTIMONIALS
        </p>

      </div>
    </>
  );
}
