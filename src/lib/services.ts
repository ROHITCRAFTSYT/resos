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
  latency: number; // ms
  uptime: number;  // percent
  lastChecked: number;
  region: string;
  fallbacks: Fallback[];
  history: ServiceMetric[];
  chaosActive?: boolean;
  description: string;
}

export const INITIAL_SERVICES: GovService[] = [
  {
    id: 'passport',
    name: 'Passport Portal',
    category: 'Identity',
    status: 'operational',
    latency: 142,
    uptime: 99.9,
    lastChecked: Date.now(),
    region: 'IN-CENTRAL',
    description: 'Online passport application and renewal services',
    fallbacks: [
      { label: 'Offline Centre Locator', url: '#', description: 'Find nearest Passport Seva Kendra' },
      { label: 'IVR Helpline', url: '#', description: 'Call 1800-258-1800 for manual assistance' },
    ],
    history: Array.from({ length: 20 }, (_, i) => ({
      timestamp: Date.now() - (20 - i) * 60000,
      latency: 120 + Math.random() * 80,
      uptime: 99.5 + Math.random() * 0.5,
    })),
  },
  {
    id: 'income-tax',
    name: 'Income Tax Portal',
    category: 'Finance',
    status: 'operational',
    latency: 218,
    uptime: 99.1,
    lastChecked: Date.now(),
    region: 'IN-NORTH',
    description: 'ITR filing, tax payment, and refund tracking',
    fallbacks: [
      { label: 'e-Filing Offline Tool', url: '#', description: 'Download and use offline ITR utility' },
      { label: 'CPC Helpline', url: '#', description: '1800-103-0025 for filing support' },
    ],
    history: Array.from({ length: 20 }, (_, i) => ({
      timestamp: Date.now() - (20 - i) * 60000,
      latency: 180 + Math.random() * 120,
      uptime: 99 + Math.random() * 0.5,
    })),
  },
  {
    id: 'digilocker',
    name: 'DigiLocker',
    category: 'Identity',
    status: 'degraded',
    latency: 890,
    uptime: 96.4,
    lastChecked: Date.now(),
    region: 'IN-EAST',
    description: 'Digital document wallet for citizens',
    fallbacks: [
      { label: 'UMANG App', url: '#', description: 'Access documents via UMANG mobile app' },
      { label: 'Physical Document', url: '#', description: 'Carry original documents as backup' },
    ],
    history: Array.from({ length: 20 }, (_, i) => ({
      timestamp: Date.now() - (20 - i) * 60000,
      latency: 400 + Math.random() * 800,
      uptime: 95 + Math.random() * 2,
    })),
  },
  {
    id: 'umang',
    name: 'UMANG App Services',
    category: 'Citizen',
    status: 'operational',
    latency: 165,
    uptime: 99.5,
    lastChecked: Date.now(),
    region: 'IN-WEST',
    description: 'Unified mobile application for government services',
    fallbacks: [
      { label: 'Individual Portals', url: '#', description: 'Access department-specific portals directly' },
    ],
    history: Array.from({ length: 20 }, (_, i) => ({
      timestamp: Date.now() - (20 - i) * 60000,
      latency: 140 + Math.random() * 60,
      uptime: 99 + Math.random() * 0.5,
    })),
  },
  {
    id: 'cowin',
    name: 'CoWIN / Health Portal',
    category: 'Health',
    status: 'operational',
    latency: 198,
    uptime: 98.7,
    lastChecked: Date.now(),
    region: 'IN-SOUTH',
    description: 'Health records, vaccination, and appointment booking',
    fallbacks: [
      { label: 'ABHA Helpline', url: '#', description: '1800-11-4477 for health ID support' },
      { label: 'Hospital Direct', url: '#', description: 'Walk-in to nearest government hospital' },
    ],
    history: Array.from({ length: 20 }, (_, i) => ({
      timestamp: Date.now() - (20 - i) * 60000,
      latency: 170 + Math.random() * 80,
      uptime: 98 + Math.random() * 1,
    })),
  },
  {
    id: 'gst',
    name: 'GST Portal',
    category: 'Finance',
    status: 'outage',
    latency: 0,
    uptime: 71.2,
    lastChecked: Date.now(),
    region: 'IN-CENTRAL',
    description: 'GST filing, returns, and compliance management',
    fallbacks: [
      { label: 'Offline Return Utility', url: '#', description: 'Download GST offline tool for filing' },
      { label: 'GST Helpdesk', url: '#', description: '1800-103-4786 for compliance support' },
      { label: 'GSTN Backup Portal', url: '#', description: 'Access mirror portal during downtime' },
    ],
    history: Array.from({ length: 20 }, (_, i) => ({
      timestamp: Date.now() - (20 - i) * 60000,
      latency: i < 14 ? 200 + Math.random() * 100 : 0,
      uptime: i < 14 ? 99 : 0,
    })),
  },
  {
    id: 'epf',
    name: 'EPFO Services',
    category: 'Finance',
    status: 'operational',
    latency: 312,
    uptime: 98.2,
    lastChecked: Date.now(),
    region: 'IN-CENTRAL',
    description: 'Employee Provident Fund withdrawals, transfers, and balance',
    fallbacks: [
      { label: 'EPFO Helpline', url: '#', description: '1800-118-005 for PF assistance' },
      { label: 'UMANG PF Access', url: '#', description: 'Check PF via UMANG app' },
    ],
    history: Array.from({ length: 20 }, (_, i) => ({
      timestamp: Date.now() - (20 - i) * 60000,
      latency: 280 + Math.random() * 100,
      uptime: 97.5 + Math.random() * 1,
    })),
  },
  {
    id: 'ration',
    name: 'Ration Card Portal',
    category: 'Welfare',
    status: 'degraded',
    latency: 1240,
    uptime: 94.1,
    lastChecked: Date.now(),
    region: 'IN-EAST',
    description: 'PDS ration card management and food grain tracking',
    fallbacks: [
      { label: 'State NIC Portal', url: '#', description: 'Access state-level food department portal' },
      { label: 'FPS Locator', url: '#', description: 'Find Fair Price Shops in your area' },
    ],
    history: Array.from({ length: 20 }, (_, i) => ({
      timestamp: Date.now() - (20 - i) * 60000,
      latency: 600 + Math.random() * 1200,
      uptime: 92 + Math.random() * 4,
    })),
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

// ─── DB → Client adapter ───────────────────────────────────────────────────
// Converts a Supabase row into the GovService shape used by components.
// The `history` field is generated client-side from recent latency readings.
export function dbToGovService(row: DbService, latencyHistory?: number[]): GovService {
  const history: ServiceMetric[] = (latencyHistory ?? [row.latency_ms]).map(
    (lat, i, arr) => ({
      timestamp: Date.now() - (arr.length - i) * 60_000,
      latency: lat,
      uptime: row.uptime_percent,
    })
  );

  // Pad to at least 20 data points using the service's current latency (no fake noise)
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
