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
import { localFraudEngine } from './localEngine';

const BASE_URL = '';

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
  getStats: async (): Promise<SystemStats> => {
    try {
      return await request<SystemStats>('/api/stats');
    } catch {
      return localFraudEngine.getStats();
    }
  },

  // Transactions
  getTransactions: async (params?: { limit?: number; status?: string; search?: string }) => {
    try {
      const q = new URLSearchParams();
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      const qs = q.toString() ? `?${q.toString()}` : '';
      return await request<{ count: number; transactions: Transaction[] }>(`/api/transactions${qs}`);
    } catch {
      return localFraudEngine.getTransactions(params);
    }
  },

  getTransaction: async (id: string) => {
    try {
      return await request<Transaction>(`/api/transactions/${id}`);
    } catch {
      const txn = localFraudEngine.getTransaction(id);
      if (!txn) throw new Error("Transaction not found");
      return txn;
    }
  },

  simulateTransaction: async (highRisk?: boolean) => {
    try {
      return await request<Transaction>('/api/simulate', {
        method: 'POST',
        body: JSON.stringify({ high_risk: !!highRisk })
      });
    } catch {
      return localFraudEngine.simulateTransaction(highRisk);
    }
  },

  // Alerts
  getAlerts: async (limit = 100) => {
    try {
      return await request<{ count: number; alerts: FraudAlert[] }>(`/api/alerts?limit=${limit}`);
    } catch {
      return localFraudEngine.getAlerts(limit);
    }
  },

  // Stream
  startStream: async () => {
    try {
      return await request<{ message: string; running: boolean }>('/api/stream/start', { method: 'POST' });
    } catch {
      localFraudEngine.startStream();
      return { message: "Live stream started", running: true };
    }
  },

  stopStream: async () => {
    try {
      return await request<{ message: string; running: boolean }>('/api/stream/stop', { method: 'POST' });
    } catch {
      localFraudEngine.stopStream();
      return { message: "Live stream stopped", running: false };
    }
  },

  getStreamStatus: async () => {
    try {
      return await request<{ running: boolean; generated_count: number; last_generated: string | null }>('/api/stream/status');
    } catch {
      return localFraudEngine.getStreamStatus();
    }
  },

  // Network & Graph
  getNetwork: async () => {
    try {
      return await request<NetworkGraphData>('/api/network');
    } catch {
      return localFraudEngine.getNetwork();
    }
  },

  getMuleRings: async () => {
    try {
      return await request<{ count: number; rings: MuleRing[] }>('/api/mule-rings');
    } catch {
      return localFraudEngine.getMuleRings();
    }
  },

  plantMuleRingDemo: async () => {
    try {
      return await request<{ message: string; ring: MuleRing; transactions_created: number }>('/api/demo/mule-ring', { method: 'POST' });
    } catch {
      return localFraudEngine.plantCircularRing();
    }
  },

  plantSmurfingDemo: async () => {
    try {
      return await request<{ message: string; ring: MuleRing; transactions_created: number }>('/api/demo/smurfing-ring', { method: 'POST' });
    } catch {
      return localFraudEngine.plantSmurfing();
    }
  },

  // Mule Accounts
  getMuleAccounts: async () => {
    try {
      return await request<{ count: number; accounts: MuleAccount[] }>('/api/mule-accounts');
    } catch {
      return localFraudEngine.getMuleAccounts();
    }
  },

  toggleFreezeAccount: async (accountNumber: string) => {
    try {
      return await request<{ message: string; account: MuleAccount }>('/api/mule-accounts/toggle-freeze', {
        method: 'POST',
        body: JSON.stringify({ account_number: accountNumber })
      });
    } catch {
      return localFraudEngine.toggleFreezeAccount(accountNumber);
    }
  },

  freezeAllMuleAccounts: async () => {
    try {
      return await request<{ message: string; frozen_count: number }>('/api/mule-accounts/freeze-all', { method: 'POST' });
    } catch {
      return localFraudEngine.freezeAllMuleAccounts();
    }
  },

  // ML Model & Explainability
  getModelMetrics: async () => {
    try {
      return await request<ModelMetrics>('/api/model/metrics');
    } catch {
      return localFraudEngine.modelMetrics;
    }
  },

  getModelFeatures: async () => {
    try {
      return await request<ModelFeature[]>('/api/model/features');
    } catch {
      return localFraudEngine.modelFeatures;
    }
  },

  // Drift & Fairness
  simulateDrift: async () => {
    try {
      return await request<DriftState>('/api/drift/simulate', { method: 'POST' });
    } catch {
      return localFraudEngine.simulateDrift();
    }
  },

  getDrift: async () => {
    try {
      return await request<DriftState>('/api/drift');
    } catch {
      return localFraudEngine.driftState;
    }
  },

  getFairness: async () => {
    try {
      return await request<FairnessState>('/api/fairness');
    } catch {
      return localFraudEngine.fairnessState;
    }
  },

  getAnalytics: async () => {
    try {
      return await request<any>('/api/analytics');
    } catch {
      return {
        stats: localFraudEngine.getStats(),
        drift: localFraudEngine.driftState
      };
    }
  }
};
