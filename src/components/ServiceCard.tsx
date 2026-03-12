'use client';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { GovService } from '@/lib/services';
import { getStatusColor, getStatusBg, getStatusDot, getStatusLabel } from '@/lib/services';
import AIAnalysisModal from '@/components/AIAnalysisModal';

interface ServiceCardProps {
  service: GovService;
  onSimulateOutage?: (id: string) => void;
  onRestoreService?: (id: string) => void;
  chaosMode?: boolean;
  incidents?: { message: string; created_at: string }[];
}

export default function ServiceCard({ service, onSimulateOutage, onRestoreService, chaosMode, incidents = [] }: ServiceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const latencyBar = Math.min(100, (service.latency / 2000) * 100);
  const uptimeBar  = service.uptime;

  return (
    <div
      className={`border font-mono text-xs transition-all duration-300 relative overflow-hidden ${
        service.chaosActive
          ? 'border-red-500/60 bg-red-950/20'
          : getStatusBg(service.status)
      }`}
    >
      {/* ── Chaos active: animated corner ribbon + scan line ────────────── */}
      {service.chaosActive && (
        <>
          {/* Corner ribbon */}
          <div
            className="absolute top-0 right-0 z-20 pointer-events-none"
            style={{ transform: 'translate(28%, -0%) rotate(0deg)' }}
          >
            <div className="bg-red-500 text-white text-[7px] font-bold tracking-[0.2em] px-4 py-0.5 shadow-lg shadow-red-500/30">
              ⚡ CHAOS
            </div>
          </div>

          {/* Slow red scan line sweeping down the card */}
          <div
            className="absolute inset-x-0 h-px bg-red-500/30 z-10 pointer-events-none"
            style={{
              animation: 'chaosCardScan 2.4s linear infinite',
            }}
          />

          {/* Subtle red glow at left edge */}
          <div
            className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
            style={{ animation: 'chaosPulseEdge 1.2s ease-in-out infinite' }}
          />
        </>
      )}

      {/* Card Header */}
      <div
        className="p-3 flex items-start gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status dot */}
        <div className="mt-1 flex-shrink-0">
          <div
            className={`w-2 h-2 rounded-full ${getStatusDot(service.status)} ${
              service.status === 'outage' || service.chaosActive ? 'animate-pulse' : ''
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-white font-bold text-[11px] tracking-wider truncate">{service.name}</div>
              <div className="text-white/40 text-[9px] mt-0.5 tracking-widest">
                {service.category} · {service.region}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0 pr-4">
              <span className={`text-[9px] font-bold tracking-widest ${getStatusColor(service.status)}`}>
                {getStatusLabel(service.status)}
              </span>
              {(service.status === 'degraded' || service.status === 'outage' || service.chaosActive) && (
                <button
                  onClick={(e) => { e.stopPropagation(); setAiOpen(true); }}
                  className="text-[8px] tracking-widest text-green-400/70 hover:text-green-400 border border-green-500/20 hover:border-green-500/50 px-1.5 py-0.5 transition-all hover:bg-green-500/5 flex items-center gap-1"
                >
                  ⚡ AI ANALYSE
                </button>
              )}
            </div>
          </div>

          {/* Latency and Uptime bars */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-[8px] w-12 flex-shrink-0">LATENCY</span>
              <div className="flex-1 h-1 bg-white/10">
                <div
                  className={`h-full transition-all duration-700 ${
                    service.latency === 0 ? 'bg-gray-600' :
                    service.latency > 800 ? 'bg-red-500' :
                    service.latency > 400 ? 'bg-yellow-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${latencyBar}%` }}
                />
              </div>
              <span className={`text-[8px] w-12 text-right flex-shrink-0 ${
                service.latency === 0 ? 'text-gray-500' :
                service.latency > 800 ? 'text-red-400' :
                service.latency > 400 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {service.latency === 0 ? 'N/A' : `${Math.round(service.latency)}ms`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white/40 text-[8px] w-12 flex-shrink-0">UPTIME</span>
              <div className="flex-1 h-1 bg-white/10">
                <div
                  className={`h-full transition-all duration-700 ${
                    uptimeBar > 99 ? 'bg-green-400' :
                    uptimeBar > 95 ? 'bg-yellow-400' : 'bg-red-500'
                  }`}
                  style={{ width: `${uptimeBar}%` }}
                />
              </div>
              <span className={`text-[8px] w-12 text-right flex-shrink-0 ${
                uptimeBar > 99 ? 'text-green-400' :
                uptimeBar > 95 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {service.uptime.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 text-white/30 text-[10px] mt-1">{expanded ? '▲' : '▼'}</div>
      </div>

      {/* AI Analysis Modal */}
      <AnimatePresence>
        {aiOpen && (
          <AIAnalysisModal
            service={service}
            incidents={incidents}
            onClose={() => setAiOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-white/10 p-3 space-y-3">
          <p className="text-white/50 text-[9px] leading-relaxed">{service.description}</p>

          {/* Mini sparkline */}
          <div>
            <div className="text-[8px] text-white/30 mb-1 tracking-widest">LATENCY HISTORY (20 MIN)</div>
            <div className="flex items-end gap-0.5 h-8">
              {service.history.slice(-20).map((point, i) => {
                const maxLat = 2000;
                const barH = point.latency === 0 ? 2 : Math.max(2, (point.latency / maxLat) * 32);
                return (
                  <div
                    key={i}
                    className={`flex-1 transition-all ${
                      point.latency === 0 ? 'bg-gray-700' :
                      point.latency > 800 ? 'bg-red-500/70' :
                      point.latency > 400 ? 'bg-yellow-400/70' : 'bg-green-400/60'
                    }`}
                    style={{ height: `${barH}px` }}
                    title={`${Math.round(point.latency)}ms`}
                  />
                );
              })}
            </div>
          </div>

          {/* Fallback routes */}
          {(service.status === 'degraded' || service.status === 'outage') && service.fallbacks.length > 0 && (
            <div>
              <div className="text-[8px] text-yellow-400/80 mb-2 tracking-widest flex items-center gap-1">
                <span>⚠</span> FALLBACK ROUTES AVAILABLE
              </div>
              <div className="space-y-1.5">
                {service.fallbacks.map((fb, i) => (
                  <div key={i} className="flex items-start gap-2 bg-white/5 border border-white/10 p-2">
                    <span className="text-yellow-400 text-[9px] mt-0.5 flex-shrink-0">→</span>
                    <div>
                      <div className="text-white text-[9px] font-bold">{fb.label}</div>
                      <div className="text-white/40 text-[8px]">{fb.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chaos controls */}
          {chaosMode && (
            <div className="border-t border-red-500/20 pt-3 flex gap-2">
              {!service.chaosActive ? (
                <button
                  onClick={() => onSimulateOutage?.(service.id)}
                  className="flex-1 py-1 border border-red-500/50 text-red-400 text-[9px] hover:bg-red-500/10 transition-colors tracking-widest"
                >
                  ⚡ INJECT FAILURE
                </button>
              ) : (
                <button
                  onClick={() => onRestoreService?.(service.id)}
                  className="flex-1 py-1 border border-green-500/50 text-green-400 text-[9px] hover:bg-green-500/10 transition-colors tracking-widest"
                >
                  ✓ RESTORE SERVICE
                </button>
              )}
            </div>
          )}

          <div className="text-[8px] text-white/20 text-right">
            LAST CHECK: {new Date(service.lastChecked).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}
