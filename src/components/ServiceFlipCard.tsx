'use client';
import { motion } from 'framer-motion';
import type { GovService } from '@/lib/services';
import { getStatusDot, getStatusColor, getStatusLabel } from '@/lib/services';

export const CARD_W = 88;
export const CARD_H = 120;

interface ServiceFlipCardProps {
  service: GovService;
  index: number;
  target: { x: number; y: number; rotation: number; scale: number; opacity: number };
  chaosMode?: boolean;
  onSimulateOutage?: (id: string) => void;
  onRestoreService?: (id: string) => void;
}

const categoryIcon: Record<string, string> = {
  Identity: '🪪',
  Finance: '₹',
  Citizen: '🏛',
  Health: '♥',
  Welfare: '🌾',
};

export default function ServiceFlipCard({
  service,
  index,
  target,
  chaosMode,
  onSimulateOutage,
  onRestoreService,
}: ServiceFlipCardProps) {
  const latencyColor =
    service.latency === 0 ? 'text-gray-400' :
    service.latency > 800 ? 'text-red-500' :
    service.latency > 400 ? 'text-yellow-500' : 'text-green-600';

  const statusRing =
    service.status === 'outage' ? 'border-red-400' :
    service.status === 'degraded' ? 'border-yellow-400' : 'border-green-400';

  const dotClass = getStatusDot(service.status);
  const statusLabel = getStatusLabel(service.status);
  const statusColor = getStatusColor(service.status);

  return (
    <motion.div
      animate={{
        x: target.x,
        y: target.y,
        rotate: target.rotation,
        scale: target.scale,
        opacity: target.opacity,
      }}
      transition={{ type: 'spring', stiffness: 40, damping: 15 }}
      style={{
        position: 'absolute',
        width: CARD_W,
        height: CARD_H,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      className="cursor-pointer group"
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ rotateY: 180 }}
      >
        {/* Front Face */}
        <div
          className={`absolute inset-0 rounded-2xl shadow-lg border-2 ${statusRing} bg-white flex flex-col items-center justify-between p-3 overflow-hidden`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Status dot */}
          <div className="w-full flex justify-between items-center">
            <span className="text-base leading-none">
              {categoryIcon[service.category] ?? '⬡'}
            </span>
            <div className={`w-2 h-2 rounded-full ${dotClass} ${service.status === 'outage' ? 'animate-pulse' : ''}`} />
          </div>

          {/* Name */}
          <div className="text-center">
            <div className="text-[9px] font-bold text-gray-800 leading-tight text-center line-clamp-2">
              {service.name}
            </div>
            <div className={`text-[8px] font-bold mt-1 tracking-wider ${statusColor.replace('text-', 'text-').replace('400', '600')}`}>
              {statusLabel}
            </div>
          </div>

          {/* Latency */}
          <div className="text-center">
            <div className={`text-[11px] font-bold font-mono ${latencyColor}`}>
              {service.latency === 0 ? '—' : `${Math.round(service.latency)}ms`}
            </div>
            <div className="text-[7px] text-gray-400 tracking-widest">LATENCY</div>
          </div>

          {/* Uptime bar */}
          <div className="w-full">
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  service.uptime > 99 ? 'bg-green-400' :
                  service.uptime > 95 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${service.uptime}%` }}
              />
            </div>
            <div className="text-[7px] text-gray-400 text-right mt-0.5">{service.uptime.toFixed(1)}%</div>
          </div>

          {/* Chaos badge */}
          {service.chaosActive && (
            <div className="absolute top-1 right-1 bg-red-500 text-white text-[6px] px-1 rounded font-bold tracking-wider">
              CHAOS
            </div>
          )}
        </div>

        {/* Back Face */}
        <div
          className="absolute inset-0 rounded-2xl shadow-lg bg-gray-950 border border-gray-700 flex flex-col p-2.5 overflow-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="text-[8px] font-bold text-gray-400 tracking-widest mb-1.5 truncate">{service.name}</div>

          {/* Fallbacks */}
          {service.fallbacks.length > 0 ? (
            <div className="flex-1 space-y-1 overflow-hidden">
              <div className="text-[7px] text-yellow-400/80 tracking-widest mb-1">FALLBACKS</div>
              {service.fallbacks.slice(0, 3).map((fb, i) => (
                <div key={i} className="text-[7px] text-gray-300 leading-tight">
                  <span className="text-yellow-400">→</span> {fb.label}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[8px] text-green-400">✓ No fallback needed</span>
            </div>
          )}

          {/* Chaos controls */}
          {chaosMode && (
            <div className="mt-1.5">
              {!service.chaosActive ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onSimulateOutage?.(service.id); }}
                  className="w-full py-0.5 border border-red-500/50 text-red-400 text-[7px] rounded hover:bg-red-500/20 transition-colors tracking-wider"
                >
                  ⚡ INJECT
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onRestoreService?.(service.id); }}
                  className="w-full py-0.5 border border-green-500/50 text-green-400 text-[7px] rounded hover:bg-green-500/20 transition-colors tracking-wider"
                >
                  ✓ RESTORE
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
