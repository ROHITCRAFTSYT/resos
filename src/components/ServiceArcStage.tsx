'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, useTransform, useSpring, useMotionValue } from 'framer-motion';
import ServiceFlipCard from './ServiceFlipCard';
import type { GovService } from '@/lib/services';

type AnimationPhase = 'scatter' | 'line' | 'circle';

const MAX_SCROLL = 3000;
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

interface ServiceArcStageProps {
  services: GovService[];
  chaosMode?: boolean;
  onSimulateOutage?: (id: string) => void;
  onRestoreService?: (id: string) => void;
}

export default function ServiceArcStage({
  services,
  chaosMode,
  onSimulateOutage,
  onRestoreService,
}: ServiceArcStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<AnimationPhase>('scatter');
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Container size observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setSize({ width: e.contentRect.width, height: e.contentRect.height });
      }
    });
    ro.observe(el);
    setSize({ width: el.offsetWidth, height: el.offsetHeight });
    return () => ro.disconnect();
  }, []);

  // Intro sequence: scatter → line → circle
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('line'), 300);
    const t2 = setTimeout(() => setPhase('circle'), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Virtual scroll
  const virtualScroll = useMotionValue(0);
  const scrollRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const next = Math.min(Math.max(scrollRef.current + e.deltaY, 0), MAX_SCROLL);
      scrollRef.current = next;
      virtualScroll.set(next);
    };

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
      const next = Math.min(Math.max(scrollRef.current + dy, 0), MAX_SCROLL);
      scrollRef.current = next;
      virtualScroll.set(next);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [virtualScroll]);

  // Morph: circle → arc  (scroll 0–600)
  const morphProgress = useTransform(virtualScroll, [0, 600], [0, 1]);
  const smoothMorph = useSpring(morphProgress, { stiffness: 40, damping: 20 });

  // Arc shuffle rotation (scroll 600–3000)
  const scrollRotate = useTransform(virtualScroll, [600, 3000], [0, 360]);
  const smoothRotate = useSpring(scrollRotate, { stiffness: 40, damping: 20 });

  // Mouse parallax
  const mouseX = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const norm = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseX.set(norm * 80);
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, [mouseX]);

  // Reactive values for render
  const [morphVal, setMorphVal] = useState(0);
  const [rotateVal, setRotateVal] = useState(0);
  const [parallax, setParallax] = useState(0);

  useEffect(() => {
    const u1 = smoothMorph.on('change', setMorphVal);
    const u2 = smoothRotate.on('change', setRotateVal);
    const u3 = smoothMouseX.on('change', setParallax);
    return () => { u1(); u2(); u3(); };
  }, [smoothMorph, smoothRotate, smoothMouseX]);

  // Random scatter positions (stable)
  const scatter = useMemo(() =>
    services.map(() => ({
      x: (Math.random() - 0.5) * 1200,
      y: (Math.random() - 0.5) * 800,
      rotation: (Math.random() - 0.5) * 160,
      scale: 0.5,
      opacity: 0,
    })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [services.length]);

  const total = services.length;
  const { width: W, height: H } = size;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#FAFAFA]"
      style={{ minHeight: '100%' }}
    >
      {/* Scroll hint */}
      {morphVal < 0.15 && phase === 'circle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 pointer-events-none"
        >
          <div className="text-[9px] text-gray-400 tracking-widest font-mono">SCROLL TO EXPLORE</div>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="w-px h-5 bg-gray-300"
          />
        </motion.div>
      )}

      {/* Arc formation label */}
      {morphVal > 0.7 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center"
        >
          <div className="text-[9px] text-gray-400 font-mono tracking-widest">
            HOVER CARD TO FLIP · SEE FALLBACKS
          </div>
        </motion.div>
      )}

      {/* Cards */}
      <div className="relative flex items-center justify-center w-full h-full">
        {services.map((service, i) => {
          let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };

          if (phase === 'scatter') {
            target = scatter[i] ?? target;
          } else if (phase === 'line') {
            const spacing = 68;
            const totalW = total * spacing;
            target = {
              x: i * spacing - totalW / 2,
              y: 0,
              rotation: 0,
              scale: 1,
              opacity: 1,
            };
          } else {
            // Circle
            const minDim = Math.min(W, H);
            const circleR = Math.min(minDim * 0.32, 280);
            const cAngle = (i / total) * 360;
            const cRad = (cAngle * Math.PI) / 180;
            const cPos = {
              x: Math.cos(cRad) * circleR,
              y: Math.sin(cRad) * circleR,
              rotation: cAngle + 90,
            };

            // Arc
            const isMobile = W < 768;
            const baseR = Math.min(W, H * 1.5);
            const arcR = baseR * (isMobile ? 1.4 : 1.05);
            const apexY = H * (isMobile ? 0.3 : 0.2);
            const arcCenterY = apexY + arcR;
            const spread = isMobile ? 90 : 120;
            const startAngle = -90 - spread / 2;
            const step = spread / (total - 1);
            const scrollProgress = Math.min(Math.max(rotateVal / 360, 0), 1);
            const boundedRot = -scrollProgress * spread * 0.85;
            const curAngle = startAngle + i * step + boundedRot;
            const arcRad = (curAngle * Math.PI) / 180;
            const arcScale = isMobile ? 1.3 : 1.6;

            const arcPos = {
              x: Math.cos(arcRad) * arcR + parallax,
              y: Math.sin(arcRad) * arcR + arcCenterY,
              rotation: curAngle + 90,
              scale: arcScale,
            };

            target = {
              x: lerp(cPos.x, arcPos.x, morphVal),
              y: lerp(cPos.y, arcPos.y, morphVal),
              rotation: lerp(cPos.rotation, arcPos.rotation, morphVal),
              scale: lerp(1, arcPos.scale, morphVal),
              opacity: 1,
            };
          }

          return (
            <ServiceFlipCard
              key={service.id}
              service={service}
              index={i}
              target={target}
              chaosMode={chaosMode}
              onSimulateOutage={onSimulateOutage}
              onRestoreService={onRestoreService}
            />
          );
        })}
      </div>
    </div>
  );
}
