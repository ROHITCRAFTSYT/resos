"use client";
import type { PropsWithChildren } from "react";
import React, { useEffect, useRef, useState } from "react";

// ─── Internal mouse-position hook ────────────────────────────────────────────
interface MousePosition { x: number; y: number }

function useMousePosition(): MousePosition {
  const [pos, setPos] = useState<MousePosition>({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  return pos;
}

// ─── HighlightGroup ───────────────────────────────────────────────────────────
interface HighlightGroupProps {
  children: React.ReactNode;
  className?: string;
  refresh?: boolean;
}

export const HighlightGroup: React.FC<HighlightGroupProps> = ({
  children,
  className = "",
  refresh = false,
}) => {
  const containerRef   = useRef<HTMLDivElement>(null);
  const mousePosition  = useMousePosition();
  const mouse          = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerSize  = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const [boxes, setBoxes] = useState<HTMLElement[]>([]);

  useEffect(() => {
    if (containerRef.current)
      setBoxes(Array.from(containerRef.current.children).map((el) => el as HTMLElement));
  }, []);

  useEffect(() => {
    initContainer();
    window.addEventListener("resize", initContainer);
    return () => window.removeEventListener("resize", initContainer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setBoxes]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onMouseMove(); }, [mousePosition]);

  useEffect(() => { initContainer(); }, [refresh]);

  const initContainer = () => {
    if (containerRef.current) {
      containerSize.current.w = containerRef.current.offsetWidth;
      containerSize.current.h = containerRef.current.offsetHeight;
    }
  };

  const onMouseMove = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const { w, h } = containerSize.current;
    const x = mousePosition.x - rect.left;
    const y = mousePosition.y - rect.top;
    if (x < w && x > 0 && y < h && y > 0) {
      mouse.current = { x, y };
      boxes.forEach((box) => {
        const bx = -(box.getBoundingClientRect().left - rect.left) + mouse.current.x;
        const by = -(box.getBoundingClientRect().top  - rect.top)  + mouse.current.y;
        box.style.setProperty("--mouse-x", `${bx}px`);
        box.style.setProperty("--mouse-y", `${by}px`);
      });
    }
  };

  return (
    <div className={className} ref={containerRef}>
      {children}
    </div>
  );
};

// ─── HighlighterItem ──────────────────────────────────────────────────────────
// FIX 1: before:content-[''] + after:content-[''] are REQUIRED — without them
//         pseudo-elements produce no output regardless of other styles.
// FIX 2: No comma inside [...] — Tailwind v4 scanner treats comma as separator.
//         Use before:translate-x-[var(--mouse-x)] (no fallback value).
// FIX 3: Adapted for ResilienceOS — green-400 glow, sharp corners (no rounded).
interface HighlighterItemProps {
  children: React.ReactNode;
  className?: string;
}

export const HighlighterItem: React.FC<PropsWithChildren<HighlighterItemProps>> = ({
  children,
  className = "",
}) => (
  <div
    className={`relative overflow-hidden p-px
      before:content-['']
      before:pointer-events-none
      before:absolute before:-left-48 before:-top-48 before:z-30
      before:h-96 before:w-96
      before:translate-x-[var(--mouse-x)] before:translate-y-[var(--mouse-y)]
      before:rounded-full
      before:bg-green-400
      before:opacity-0 before:blur-[100px]
      before:transition-opacity before:duration-500
      after:content-['']
      after:absolute after:inset-0 after:z-10
      after:opacity-0 after:transition-opacity after:duration-500
      before:hover:opacity-20 after:hover:opacity-100
      ${className}`}
  >
    {children}
  </div>
);

// ─── Particles ────────────────────────────────────────────────────────────────
interface ParticlesProps {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  refresh?: boolean;
  color?: string;
  vx?: number;
  vy?: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = parseInt(hex.replace("#", ""), 16);
  return [(h >> 16) & 255, (h >> 8) & 255, h & 255];
}

type Circle = {
  x: number; y: number;
  translateX: number; translateY: number;
  size: number;
  alpha: number; targetAlpha: number;
  dx: number; dy: number;
  magnetism: number;
};

export const Particles: React.FC<ParticlesProps> = ({
  className = "",
  quantity = 60,
  staticity = 50,
  ease = 50,
  refresh = false,
  color = "#4ade80",
  vx = 0,
  vy = 0,
}) => {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctx          = useRef<CanvasRenderingContext2D | null>(null);
  const circles      = useRef<Circle[]>([]);
  const mousePos     = useMousePosition();
  const mouse        = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasSize   = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const rafId        = useRef<number>(0);
  const rgb          = hexToRgb(color);
  // Read dpr inside effect so it only runs client-side
  const dprRef       = useRef<number>(1);

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    dprRef.current = window.devicePixelRatio ?? 1;
    if (canvasRef.current) ctx.current = canvasRef.current.getContext("2d");
    initCanvas();
    rafId.current = window.requestAnimationFrame(animate);
    window.addEventListener("resize", initCanvas);
    return () => {
      window.removeEventListener("resize", initCanvas);
      window.cancelAnimationFrame(rafId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onMouseMove(); }, [mousePos.x, mousePos.y]);
  useEffect(() => { initCanvas(); }, [refresh]);

  const initCanvas = () => { resizeCanvas(); drawParticles(); };

  const onMouseMove = () => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const { w, h } = canvasSize.current;
    const x = mousePos.x - rect.left - w / 2;
    const y = mousePos.y - rect.top  - h / 2;
    if (x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2)
      mouse.current = { x, y };
  };

  const resizeCanvas = () => {
    if (!containerRef.current || !canvasRef.current || !ctx.current) return;
    const dpr = dprRef.current;
    circles.current = [];
    canvasSize.current.w = containerRef.current.offsetWidth;
    canvasSize.current.h = containerRef.current.offsetHeight;
    canvasRef.current.width  = canvasSize.current.w * dpr;
    canvasRef.current.height = canvasSize.current.h * dpr;
    // FIX: explicit px sizing so the canvas element fills the container
    canvasRef.current.style.width  = `${canvasSize.current.w}px`;
    canvasRef.current.style.height = `${canvasSize.current.h}px`;
    ctx.current.scale(dpr, dpr);
  };

  const circleParams = (): Circle => ({
    x:           Math.floor(Math.random() * canvasSize.current.w),
    y:           Math.floor(Math.random() * canvasSize.current.h),
    translateX:  0,
    translateY:  0,
    // FIX: slightly larger size range (1–3px) and higher base opacity for visibility
    size:        Math.floor(Math.random() * 2) + 1,
    alpha:       0,
    targetAlpha: parseFloat((Math.random() * 0.5 + 0.15).toFixed(2)),
    dx:          (Math.random() - 0.5) * 0.2,
    dy:          (Math.random() - 0.5) * 0.2,
    magnetism:   0.1 + Math.random() * 4,
  });

  const drawCircle = (c: Circle, update = false) => {
    if (!ctx.current) return;
    const dpr = dprRef.current;
    ctx.current.translate(c.translateX, c.translateY);
    ctx.current.beginPath();
    ctx.current.arc(c.x, c.y, c.size, 0, 2 * Math.PI);
    ctx.current.fillStyle = `rgba(${rgb.join(",")},${c.alpha})`;
    ctx.current.fill();
    ctx.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!update) circles.current.push(c);
  };

  const clearCtx = () =>
    ctx.current?.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);

  const drawParticles = () => {
    clearCtx();
    for (let i = 0; i < quantity; i++) drawCircle(circleParams());
  };

  const remap = (v: number, s1: number, e1: number, s2: number, e2: number) =>
    Math.max(0, ((v - s1) * (e2 - s2)) / (e1 - s1) + s2);

  const animate = () => {
    clearCtx();
    circles.current.forEach((c, i) => {
      const edge = [
        c.x + c.translateX - c.size,
        canvasSize.current.w - c.x - c.translateX - c.size,
        c.y + c.translateY - c.size,
        canvasSize.current.h - c.y - c.translateY - c.size,
      ];
      const closest = edge.reduce((a, b) => Math.min(a, b));
      const fade    = parseFloat(remap(closest, 0, 20, 0, 1).toFixed(2));
      c.alpha = fade > 1
        ? Math.min(c.alpha + 0.02, c.targetAlpha)
        : c.targetAlpha * fade;
      c.x += c.dx + vx;
      c.y += c.dy + vy;
      c.translateX += (mouse.current.x / (staticity / c.magnetism) - c.translateX) / ease;
      c.translateY += (mouse.current.y / (staticity / c.magnetism) - c.translateY) / ease;

      if (
        c.x < -c.size || c.x > canvasSize.current.w + c.size ||
        c.y < -c.size || c.y > canvasSize.current.h + c.size
      ) {
        circles.current.splice(i, 1);
        drawCircle(circleParams());
      } else {
        drawCircle({ ...c }, true);
      }
    });
    rafId.current = window.requestAnimationFrame(animate);
  };

  return (
    // FIX: relative + w-full h-full ensure the container fills its positioned parent
    <div className={className} ref={containerRef} aria-hidden="true"
         style={{ position: 'absolute', inset: 0 }}>
      {/* FIX: display:block removes inline baseline gap; width/height fill container */}
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};
