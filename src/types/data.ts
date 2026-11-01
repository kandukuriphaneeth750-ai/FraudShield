export type ViewMode =
  | 'overview'
  | 'transactions'
  | 'alerts'
  | 'network'
  | 'mule_rings'
  | 'mule_accounts'
  | 'model'
  | 'monitoring';

export interface Transaction {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  risk_score: number;
  ai_probability: number;
  rule_score: number;
  status: 'NORMAL' | 'REVIEW' | 'HIGH RISK';
  reasons: string[];
  timestamp: string;
  prediction_latency_ms: number;
  account_age_days: number;
  transaction_frequency: number;
  recipient_risk: number;
  unusual_hour: number;
  new_device: number;
  data_type: string;
  demo_type: string;
  mule_ring: boolean;
  mule_type?: string;
}

export interface FraudAlert {
  id: string;
  transaction_id: string;
  type: string;
  sender: string;
  receiver: string;
  amount: number;
  risk_score: number;
  reason: string[] | string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'ELEVATED';
}

export interface MuleAccount {
  id: string;
  account_number: string;
  holder_name: string;
  account_type: 'STUDENT_PROXY' | 'DORMANT_TAKEOVER' | 'SHELL_CORP' | 'CRYPTO_CONDUIT' | 'CIRCULAR_MEMBER';
  risk_rating: number; // 0-100
  total_inbound: number;
  total_outbound: number;
  velocity_txns_per_hr: number;
  account_age_days: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'FROZEN' | 'UNDER_INVESTIGATION';
  ring_id?: string;
  kyc_risk_flags: string[];
  first_seen: string;
  last_activity: string;
}

export interface MuleRingHop {
  from: string;
  to: string;
  amount: number;
  delay_seconds: number;
  stage: 'Placement' | 'Layering' | 'Integration';
}

export interface MuleRing {
  id: string;
  name: string;
  pattern_type: 'CIRCULAR_LOOP' | 'SMURFING_FUNNEL' | 'RAPID_CONDUIT';
  accounts: string[];
  account_count: number;
  transaction_count: number;
  total_amount: number;
  risk_level: 'HIGH' | 'CRITICAL';
  reason: string;
  detected_at: string;
  hops: MuleRingHop[];
}

export interface NetworkNode {
  id: string;
  connections: number;
  risk_score: number;
  is_mule: boolean;
  total_volume: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  amount: number;
  is_mule: boolean;
  timestamp: string;
}

export interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  node_count: number;
  edge_count: number;
  mule_rings: MuleRing[];
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
  training_samples: number;
  testing_samples: number;
  fraud_samples: number;
  normal_samples: number;
  data_type: string;
  model_type: string;
  auc_roc: number;
  avg_inference_latency_ms: number;
}

export interface ModelFeature {
  feature: string;
  importance: number;
  description: string;
}

export interface DriftState {
  active: boolean;
  message: string;
  baseline_average_amount: number;
  current_average_amount: number;
  drift_detected: boolean;
  ks_statistic: number;
}

export interface FairnessSegment {
  segment: string;
  false_positive_rate: number;
  accuracy: number;
  sample_size: number;
}

export interface FairnessState {
  status: string;
  message: string;
  segments: FairnessSegment[];
}

export interface SystemStats {
  total_transactions: number;
  high_risk: number;
  review: number;
  normal: number;
  total_amount: number;
  average_latency_ms: number;
  alerts: number;
  stream_running: boolean;
  mule_rings: number;
  mule_accounts_count: number;
  frozen_accounts_count: number;
}
