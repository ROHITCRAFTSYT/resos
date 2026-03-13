import type { DbService } from '@/lib/supabase';

export type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'unknown';

export interface ServiceMetric {
  timestamp: number;
  latency: number;
  uptime: number;
}

export interface Fallback {
  label: string;
  url: string;
  description: string;
}

export interface GovService {
  id: string;
  name: string;
  category: string;
  status: ServiceStatus;
  latency: number;
  uptime: number;
  lastChecked: number;
  region: string;
  fallbacks: Fallback[];
  history: ServiceMetric[];
  chaosActive?: boolean;
  description: string;
}

// ─── Deterministic pseudo-random — avoids SSR/client hydration mismatch ──────
// Same seed always returns the same value in [0, 1). No Math.random() here.
function det(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function makeHistory(
  length: number,
  baseLatency: number,
  jitter: number,
  baseUptime: number,
  uptimeJitter: number,
  seedOffset: number,
  outageAfter?: number,
): ServiceMetric[] {
  return Array.from({ length }, (_, i) => ({
    timestamp: 0, // filled in client-side after mount to avoid Date.now() mismatch
    latency: (outageAfter !== undefined && i >= outageAfter)
      ? 0
      : baseLatency + det(seedOffset + i) * jitter,
    uptime: (outageAfter !== undefined && i >= outageAfter)
      ? 0
      : baseUptime + det(seedOffset + i + 50) * uptimeJitter,
  }));
}

export const INITIAL_SERVICES: GovService[] = [
  {
    id: 'passport',
    name: 'Passport Portal',
    category: 'Identity',
    status: 'operational',
    latency: 142,
    uptime: 99.9,
    lastChecked: 0,
    region: 'IN-CENTRAL',
    description: 'Online passport application and renewal services',
    fallbacks: [
      { label: 'Offline Centre Locator', url: '#', description: 'Find nearest Passport Seva Kendra' },
      { label: 'IVR Helpline', url: '#', description: 'Call 1800-258-1800 for manual assistance' },
    ],
    history: makeHistory(20, 120, 80, 99.5, 0.5, 1),
  },
  {
    id: 'income-tax',
    name: 'Income Tax Portal',
    category: 'Finance',
    status: 'operational',
    latency: 218,
    uptime: 99.1,
    lastChecked: 0,
    region: 'IN-NORTH',
    description: 'ITR filing, tax payment, and refund tracking',
    fallbacks: [
      { label: 'e-Filing Offline Tool', url: '#', description: 'Download and use offline ITR utility' },
      { label: 'CPC Helpline', url: '#', description: '1800-103-0025 for filing support' },
    ],
    history: makeHistory(20, 180, 120, 99, 0.5, 100),
  },
  {
    id: 'digilocker',
    name: 'DigiLocker',
    category: 'Identity',
    status: 'degraded',
    latency: 890,
    uptime: 96.4,
    lastChecked: 0,
    region: 'IN-EAST',
    description: 'Digital document wallet for citizens',
    fallbacks: [
      { label: 'UMANG App', url: '#', description: 'Access documents via UMANG mobile app' },
      { label: 'Physical Document', url: '#', description: 'Carry original documents as backup' },
    ],
    history: makeHistory(20, 400, 800, 95, 2, 200),
  },
  {
    id: 'umang',
    name: 'UMANG App Services',
    category: 'Citizen',
    status: 'operational',
    latency: 165,
    uptime: 99.5,
    lastChecked: 0,
    region: 'IN-WEST',
    description: 'Unified mobile application for government services',
    fallbacks: [
      { label: 'Individual Portals', url: '#', description: 'Access department-specific portals directly' },
    ],
    history: makeHistory(20, 140, 60, 99, 0.5, 300),
  },
  {
    id: 'cowin',
    name: 'CoWIN / Health Portal',
    category: 'Health',
    status: 'operational',
    latency: 198,
    uptime: 98.7,
    lastChecked: 0,
    region: 'IN-SOUTH',
    description: 'Health records, vaccination, and appointment booking',
    fallbacks: [
      { label: 'ABHA Helpline', url: '#', description: '1800-11-4477 for health ID support' },
      { label: 'Hospital Direct', url: '#', description: 'Walk-in to nearest government hospital' },
    ],
    history: makeHistory(20, 170, 80, 98, 1, 400),
  },
  {
    id: 'gst',
    name: 'GST Portal',
    category: 'Finance',
    status: 'outage',
    latency: 0,
    uptime: 71.2,
    lastChecked: 0,
    region: 'IN-CENTRAL',
    description: 'GST filing, returns, and compliance management',
    fallbacks: [
      { label: 'Offline Return Utility', url: '#', description: 'Download GST offline tool for filing' },
      { label: 'GST Helpdesk', url: '#', description: '1800-103-4786 for compliance support' },
      { label: 'GSTN Backup Portal', url: '#', description: 'Access mirror portal during downtime' },
    ],
    history: makeHistory(20, 200, 100, 99, 0, 500, 14),
  },
  {
    id: 'epf',
    name: 'EPFO Services',
    category: 'Finance',
    status: 'operational',
    latency: 312,
    uptime: 98.2,
    lastChecked: 0,
    region: 'IN-CENTRAL',
    description: 'Employee Provident Fund withdrawals, transfers, and balance',
    fallbacks: [
      { label: 'EPFO Helpline', url: '#', description: '1800-118-005 for PF assistance' },
      { label: 'UMANG PF Access', url: '#', description: 'Check PF via UMANG app' },
    ],
    history: makeHistory(20, 280, 100, 97.5, 1, 600),
  },
  {
    id: 'ration',
    name: 'Ration Card Portal',
    category: 'Welfare',
    status: 'degraded',
    latency: 1240,
    uptime: 94.1,
    lastChecked: 0,
    region: 'IN-EAST',
    description: 'PDS ration card management and food grain tracking',
    fallbacks: [
      { label: 'State NIC Portal', url: '#', description: 'Access state-level food department portal' },
      { label: 'FPS Locator', url: '#', description: 'Find Fair Price Shops in your area' },
    ],
    history: makeHistory(20, 600, 1200, 92, 4, 700),
  },
];

export function getStatusColor(status: ServiceStatus): string {
  switch (status) {
    case 'operational': return 'text-green-400';
    case 'degraded': return 'text-yellow-400';
    case 'outage': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

export function getStatusBg(status: ServiceStatus): string {
  switch (status) {
    case 'operational': return 'bg-green-400/10 border-green-400/30';
    case 'degraded': return 'bg-yellow-400/10 border-yellow-400/30';
    case 'outage': return 'bg-red-400/10 border-red-500/40';
    default: return 'bg-gray-400/10 border-gray-400/30';
  }
}

export function getStatusDot(status: ServiceStatus): string {
  switch (status) {
    case 'operational': return 'bg-green-400';
    case 'degraded': return 'bg-yellow-400';
    case 'outage': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
}

export function getStatusLabel(status: ServiceStatus): string {
  switch (status) {
    case 'operational': return 'OPERATIONAL';
    case 'degraded': return 'DEGRADED';
    case 'outage': return 'OUTAGE';
    default: return 'UNKNOWN';
  }
}

// ─── DB → Client adapter ──────────────────────────────────────────────────────
export function dbToGovService(row: DbService, latencyHistory?: number[]): GovService {
  const history: ServiceMetric[] = (latencyHistory ?? [row.latency_ms]).map(
    (lat, i, arr) => ({
      timestamp: Date.now() - (arr.length - i) * 60_000,
      latency: lat,
      uptime: row.uptime_percent,
    })
  );

  while (history.length < 20) {
    history.unshift({
      timestamp: history[0]?.timestamp - 60_000 || Date.now() - 1_200_000,
      latency: row.latency_ms,
      uptime: row.uptime_percent,
    });
  }

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    status: row.status as ServiceStatus,
    latency: row.latency_ms,
    uptime: row.uptime_percent,
    lastChecked: new Date(row.last_checked_at).getTime(),
    region: row.region,
    description: row.description,
    fallbacks: row.fallbacks,
    history,
    chaosActive: row.chaos_active,
  };
}

export function simulateChaos(service: GovService): GovService {
  const roll = Math.random();
  if (roll < 0.4) {
    return { ...service, status: 'outage', latency: 0, uptime: 0, chaosActive: true };
  } else if (roll < 0.75) {
    return {
      ...service,
      status: 'degraded',
      latency: service.latency * (3 + Math.random() * 5),
      uptime: 40 + Math.random() * 30,
      chaosActive: true,
    };
  }
  return { ...service, chaosActive: true };
}
