"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpecialTextProps {
  children: string;
  /** Interval in ms between animation frames (lower = faster). Default: 20 */
  speed?: number;
  /** Delay in seconds before animation starts. Default: 0 */
  delay?: number;
  className?: string;
  /**
   * When true the animation waits until the element scrolls into view.
   * Default: false (plays immediately on mount).
   */
  inView?: boolean;
  /** Only animate once after entering the viewport. Default: true */
  once?: boolean;
}

const RANDOM_CHARS = "_!X$0-+*#";

function getRandomChar(exclude?: string): string {
  let c: string;
  do { c = RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)]; }
  while (c === exclude);
  return c;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SpecialText({
  children,
  speed  = 20,
  delay  = 0,
  className = "",
  inView = false,
  once   = true,
}: SpecialTextProps) {
  const text = children;

  const containerRef  = useRef<HTMLSpanElement>(null);
  const isInView      = useInView(containerRef, { once, margin: "-80px" });
  const shouldAnimate = inView ? isInView : true;

  // ── Animation state (refs — no re-renders per tick) ────────────────────────
  const phaseRef    = useRef<"phase1" | "phase2">("phase1");
  const stepRef     = useRef<number>(0);
  const textRef     = useRef<string>(text);   // keep text fresh inside interval
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Only displayText needs to be state (drives the visual) ─────────────────
  const [displayText, setDisplayText] = useState<string>("\u00a0".repeat(text.length));
  const [hasStarted,  setHasStarted]  = useState<boolean>(!inView && delay <= 0);

  // Keep textRef current when children change
  useEffect(() => { textRef.current = text; }, [text]);

  // ── Start trigger: fires when viewport entry (or immediately if inView=false) ─
  useEffect(() => {
    if (!shouldAnimate || hasStarted) return;

    function kick() {
      setHasStarted(true);
    }

    if (delay <= 0) {
      kick();
    } else {
      delayRef.current = setTimeout(kick, delay * 1000);
    }

    return () => {
      if (delayRef.current) { clearTimeout(delayRef.current); delayRef.current = null; }
    };
  }, [shouldAnimate, hasStarted, delay]);

  // ── Single interval that runs the full animation ────────────────────────────
  useEffect(() => {
    if (!hasStarted) return;

    // Reset refs on each (re-)start
    phaseRef.current = "phase1";
    stepRef.current  = 0;
    setDisplayText("\u00a0".repeat(textRef.current.length));

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const t    = textRef.current;
      const step = stepRef.current;

      if (phaseRef.current === "phase1") {
        // Phase 1: expand random chars left-to-right up to text.length
        const maxSteps  = t.length * 2;
        const curLen    = Math.min(step + 1, t.length);
        const chars: string[] = [];

        for (let i = 0; i < curLen; i++) {
          chars.push(getRandomChar(i > 0 ? chars[i - 1] : undefined));
        }
        while (chars.length < t.length) chars.push("\u00a0");
        setDisplayText(chars.join(""));

        if (step < maxSteps - 1) {
          stepRef.current += 1;
        } else {
          phaseRef.current = "phase2";
          stepRef.current  = 0;
        }
      } else {
        // Phase 2: resolve chars one-by-one from left with a blinking cursor
        const revealedCount = Math.floor(step / 2);
        const chars: string[] = [];

        for (let i = 0; i < revealedCount && i < t.length; i++) {
          chars.push(t[i]);
        }
        if (revealedCount < t.length) {
          chars.push(step % 2 === 0 ? "_" : getRandomChar());
        }
        while (chars.length < t.length) chars.push(getRandomChar());
        setDisplayText(chars.join(""));

        if (step < t.length * 2 - 1) {
          stepRef.current += 1;
        } else {
          // Done — show final text and stop interval
          setDisplayText(t);
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        }
      }
    }, speed);

    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [hasStarted, speed]); // only reruns if speed or hasStarted changes — NOT every tick

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (delayRef.current)   { clearTimeout(delayRef.current);   delayRef.current = null; }
      if (intervalRef.current){ clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, []);

  return (
    <span
      ref={containerRef}
      className={`inline-flex font-mono font-medium ${className}`}
    >
      {displayText}
    </span>
  );
}
