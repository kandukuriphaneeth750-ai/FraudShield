import {
  Transaction,
  FraudAlert,
  MuleAccount,
  MuleRing,
  NetworkGraphData,
  ModelMetrics,
  ModelFeature,
  DriftState,
  FairnessState,
  SystemStats
} from '../types/data';

const BASE_URL = ''; // Relative path leverages Vite dev proxy / Express server directly on same port

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const fraudApi = {
  // Stats
  getStats: () => request<SystemStats>('/api/stats'),

  // Transactions
  getTransactions: (params?: { limit?: number; status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<{ count: number; transactions: Transaction[] }>(`/api/transactions${qs}`);
  },

  getTransaction: (id: string) => request<Transaction>(`/api/transactions/${id}`),

  simulateTransaction: (highRisk?: boolean) =>
    request<Transaction>('/api/simulate', {
      method: 'POST',
      body: JSON.stringify({ high_risk: !!highRisk })
    }),

  // Alerts
  getAlerts: (limit = 100) =>
    request<{ count: number; alerts: FraudAlert[] }>(`/api/alerts?limit=${limit}`),

  // Stream
  startStream: () => request<{ message: string; running: boolean }>('/api/stream/start', { method: 'POST' }),
  stopStream: () => request<{ message: string; running: boolean }>('/api/stream/stop', { method: 'POST' }),
  getStreamStatus: () => request<{ running: boolean; generated_count: number; last_generated: string | null }>('/api/stream/status'),

  // Network & Graph
  getNetwork: () => request<NetworkGraphData>('/api/network'),
  getMuleRings: () => request<{ count: number; rings: MuleRing[] }>('/api/mule-rings'),
  plantMuleRingDemo: () => request<{ message: string; ring: MuleRing; transactions_created: number }>('/api/demo/mule-ring', { method: 'POST' }),
  plantSmurfingDemo: () => request<{ message: string; ring: MuleRing; transactions_created: number }>('/api/demo/smurfing-ring', { method: 'POST' }),

  // Mule Accounts (User requested: "add some mule accounta in the backend")
  getMuleAccounts: () => request<{ count: number; accounts: MuleAccount[] }>('/api/mule-accounts'),
  toggleFreezeAccount: (accountNumber: string) =>
    request<{ message: string; account: MuleAccount }>('/api/mule-accounts/toggle-freeze', {
      method: 'POST',
      body: JSON.stringify({ account_number: accountNumber })
    }),
  freezeAllMuleAccounts: () =>
    request<{ message: string; frozen_count: number }>('/api/mule-accounts/freeze-all', { method: 'POST' }),

  // ML Model & Explainability
  getModelMetrics: () => request<ModelMetrics>('/api/model/metrics'),
  getModelFeatures: () => request<ModelFeature[]>('/api/model/features'),

  // Drift & Fairness
  simulateDrift: () => request<DriftState>('/api/drift/simulate', { method: 'POST' }),
  getDrift: () => request<DriftState>('/api/drift'),
  getFairness: () => request<FairnessState>('/api/fairness'),
  getAnalytics: () => request<any>('/api/analytics')
};
