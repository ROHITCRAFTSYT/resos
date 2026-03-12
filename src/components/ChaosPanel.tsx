'use client';
import { useState } from 'react';
import type { GovService } from '@/lib/services';

interface ChaosPanelProps {
  chaosMode: boolean;
  onToggleChaos: () => void;
  onChaosAll: () => void;
  onRestoreAll: () => void;
  services: GovService[];
  onSimulateOutage: (id: string) => void;
  onRestoreService: (id: string) => void;
}

export default function ChaosPanel({
  chaosMode,
  onToggleChaos,
  onChaosAll,
  onRestoreAll,
  services,
  onSimulateOutage,
  onRestoreService,
}: ChaosPanelProps) {
  const [confirmAll, setConfirmAll] = useState(false);
  const chaosCount = services.filter((s) => s.chaosActive).length;

  return (
    <div
      className={`border font-mono transition-all duration-300 ${
        chaosMode ? 'border-red-500/50 bg-red-950/20' : 'border-white/10 bg-white/5'
      }`}
    >
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-sm ${chaosMode ? 'text-red-400' : 'text-white/60'}`}>⚡</span>
          <span className={`text-xs font-bold tracking-widest ${chaosMode ? 'text-red-400' : 'text-white/60'}`}>
            CHAOS MODE
          </span>
          {chaosMode && (
            <span className="text-[8px] border border-red-500/50 text-red-400 px-1 tracking-widest animate-pulse">
              ACTIVE
            </span>
          )}
        </div>
        <button
          onClick={onToggleChaos}
          className={`px-3 py-1 text-[9px] font-bold tracking-widest transition-all duration-200 ${
            chaosMode
              ? 'border border-red-500/60 text-red-400 hover:bg-red-500/20'
              : 'border border-white/20 text-white/60 hover:bg-white/10'
          }`}
        >
          {chaosMode ? 'DISABLE' : 'ENABLE'}
        </button>
      </div>

      {/* Body */}
      <div className="p-3 space-y-3">
        {!chaosMode ? (
          <div className="text-[9px] text-white/30 leading-relaxed">
            Chaos Mode simulates random service failures to test resilience. Enable to inject failures into individual services or run a full infrastructure stress test.
          </div>
        ) : (
          <>
            <div className="text-[9px] text-red-400/80 leading-relaxed border border-red-500/20 p-2 bg-red-500/5">
              ⚠ CHAOS MODE ACTIVE — Service failures are being simulated. This affects the dashboard view only. No real services are impacted.
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="border border-white/10 p-2">
                <div className="text-lg font-bold text-red-400">{chaosCount}</div>
                <div className="text-[8px] text-white/30 tracking-widest">INJECTED</div>
              </div>
              <div className="border border-white/10 p-2">
                <div className="text-lg font-bold text-white/60">{services.length - chaosCount}</div>
                <div className="text-[8px] text-white/30 tracking-widest">HEALTHY</div>
              </div>
            </div>

            {/* Per-service controls */}
            <div>
              <div className="text-[8px] text-white/30 tracking-widest mb-2">TARGET SERVICE</div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {services.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 border border-white/5 p-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-white/70 truncate">{s.name}</div>
                    </div>
                    {!s.chaosActive ? (
                      <button
                        onClick={() => onSimulateOutage(s.id)}
                        className="flex-shrink-0 px-2 py-0.5 border border-red-500/40 text-red-400 text-[8px] hover:bg-red-500/10 transition-colors"
                      >
                        INJECT
                      </button>
                    ) : (
                      <button
                        onClick={() => onRestoreService(s.id)}
                        className="flex-shrink-0 px-2 py-0.5 border border-green-500/40 text-green-400 text-[8px] hover:bg-green-500/10 transition-colors"
                      >
                        RESTORE
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bulk actions */}
            <div className="border-t border-white/10 pt-3 flex gap-2">
              {!confirmAll ? (
                <button
                  onClick={() => setConfirmAll(true)}
                  className="flex-1 py-1.5 border border-red-500/50 text-red-400 text-[9px] hover:bg-red-500/10 transition-colors tracking-widest"
                >
                  ⚡ CHAOS ALL
                </button>
              ) : (
                <button
                  onClick={() => { onChaosAll(); setConfirmAll(false); }}
                  className="flex-1 py-1.5 bg-red-500 text-white text-[9px] font-bold tracking-widest hover:bg-red-600 transition-colors"
                >
                  !! CONFIRM CHAOS
                </button>
              )}
              <button
                onClick={() => { onRestoreAll(); setConfirmAll(false); }}
                className="flex-1 py-1.5 border border-green-500/50 text-green-400 text-[9px] hover:bg-green-500/10 transition-colors tracking-widest"
              >
                ✓ RESTORE ALL
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
