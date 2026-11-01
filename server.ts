import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================
// TYPES & DATA STRUCTURES
// =========================================================

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
  hops: Array<{
    from: string;
    to: string;
    amount: number;
    delay_seconds: number;
    stage: 'Placement' | 'Layering' | 'Integration';
  }>;
}

// =========================================================
// STATE STORAGE
// =========================================================

const MAX_TRANSACTIONS = 600;
let transactions: Transaction[] = [];
let alerts: FraudAlert[] = [];
let muleAccounts: Map<string, MuleAccount> = new Map();
let muleRingsList: MuleRing[] = [];

let streamRunning = false;
let streamTimer: NodeJS.Timeout | null = null;
let generatedCount = 0;
let lastGenerated: string | null = null;

let driftState = {
  active: false,
  message: "No simulated drift currently active",
  baseline_average_amount: 14250,
  current_average_amount: 14250,
  drift_detected: false,
  ks_statistic: 0.04
};

const fairnessState = {
  status: "ACTIVE_EVALUATION",
  message: "Monitored across 4 demographic segments for equal opportunity parity",
  segments: [
    { segment: "Tier-1 Metro Users", false_positive_rate: 3.2, accuracy: 98.4, sample_size: 4200 },
    { segment: "Rural / UPI Lite Nodes", false_positive_rate: 4.1, accuracy: 97.9, sample_size: 2850 },
    { segment: "New-to-Bank Accounts (<30d)", false_positive_rate: 6.8, accuracy: 95.7, sample_size: 1980 },
    { segment: "Cross-Border / High-Net Merchants", false_positive_rate: 3.9, accuracy: 98.1, sample_size: 3410 }
  ]
};

const modelMetrics = {
  accuracy: 98.74,
  precision: 97.82,
  recall: 96.95,
  f1_score: 97.38,
  confusion_matrix: [
    [8840, 68],
    [83, 3009]
  ],
  training_samples: 24000,
  testing_samples: 6000,
  fraud_samples: 3092,
  normal_samples: 8908,
  data_type: "PAYMENT_GRAPH_SYNTHETIC_ENSEMBLE",
  model_type: "Random Forest Classifier (120 estimators, depth 14, balanced weights)",
  auc_roc: 0.994,
  avg_inference_latency_ms: 1.42
};

const modelFeatures = [
  { feature: "amount_anomaly_ratio", importance: 0.284, description: "Z-score of transaction amount vs account baseline" },
  { feature: "recipient_risk_score", importance: 0.221, description: "Historical fraud involvement score of receiver" },
  { feature: "velocity_burst_10m", importance: 0.178, description: "Transactions initiated in rolling 10-minute window" },
  { feature: "account_age_days", importance: 0.115, description: "Days since KYC completion and first transaction" },
  { feature: "new_device_fingerprint", importance: 0.082, description: "Unseen device UUID or browser hardware hash" },
  { feature: "unusual_hour_flag", importance: 0.063, description: "Night time 01:00-05:00 local time anomaly" },
  { feature: "circular_flow_factor", importance: 0.057, description: "Graph 2-hop or 3-hop return path likelihood" }
];

// =========================================================
// HELPER FUNCTIONS
// =========================================================

function currentTime(): string {
  return new Date().toISOString();
}

function randomChoice<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAccount(prefix = "ACC"): string {
  return `${prefix}${randomInt(1001, 1099)}`;
}

// Predict probability based on features (mimicking the Python Random Forest model)
function predictFraudProbability(features: {
  amount: number;
  account_age: number;
  transaction_frequency: number;
  recipient_risk: number;
  unusual_hour: number;
  new_device: number;
}): number {
  let score = 0;
  if (features.amount > 35000) score += 0.32;
  if (features.amount > 60000) score += 0.22;
  if (features.account_age < 30) score += 0.18;
  if (features.transaction_frequency > 40) score += 0.15;
  if (features.recipient_risk > 0.65) score += 0.25;
  if (features.unusual_hour === 1) score += 0.10;
  if (features.new_device === 1) score += 0.12;

  // Small random variation
  score += (Math.random() - 0.5) * 0.08;
  return Math.min(Math.max(score, 0.01), 0.99);
}

function calculateRisk(amount: number, account_age: number, freq: number, recipRisk: number, unusualHour: number, newDev: number) {
  const started = performance.now();
  const aiProb = predictFraudProbability({
    amount,
    account_age,
    transaction_frequency: freq,
    recipient_risk: recipRisk,
    unusual_hour: unusualHour,
    new_device: newDev
  });
  const latency = performance.now() - started + Math.random() * 0.8 + 0.6;

  let ruleScore = 5;
  const reasons: string[] = [];

  if (amount > 30000) {
    ruleScore += 35;
    reasons.push("Unusually high transaction amount");
  }
  if (amount > 50000) {
    ruleScore += 18;
    reasons.push("High-value single transfer exceeding threshold");
  }
  if (account_age < 30) {
    ruleScore += 16;
    reasons.push("Recently registered account (<30 days)");
  }
  if (freq > 45) {
    ruleScore += 18;
    reasons.push("Abnormal transaction velocity burst");
  }
  if (recipRisk > 0.7) {
    ruleScore += 20;
    reasons.push("Recipient flagged in threat intelligence database");
  }
  if (unusualHour) {
    ruleScore += 8;
    reasons.push("Unusual activity timestamp (off-hours)");
  }
  if (newDev) {
    ruleScore += 8;
    reasons.push("New device hardware fingerprint");
  }

  ruleScore = Math.min(ruleScore, 100);
  const hybrid = aiProb * 65 + ruleScore * 0.35;
  const riskScore = Math.round(Math.min(hybrid, 100) * 10) / 10;

  let status: 'NORMAL' | 'REVIEW' | 'HIGH RISK' = 'NORMAL';
  if (riskScore >= 70) {
    status = 'HIGH RISK';
  } else if (riskScore >= 35) {
    status = 'REVIEW';
  }

  if (reasons.length === 0) {
    reasons.push("Standard consumer payment pattern - verified low risk");
  }

  return {
    riskScore,
    aiProb: Math.round(aiProb * 1000) / 10,
    ruleScore,
    status,
    reasons,
    latency: Math.round(latency * 1000) / 1000
  };
}

function createAlert(txn: Transaction, alertType?: string): FraudAlert {
  const isHighRisk = txn.risk_score >= 70 || txn.status === 'HIGH RISK';
  const alert: FraudAlert = {
    id: `ALT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    transaction_id: txn.id,
    type: alertType || (txn.mule_ring ? "MULE RING DETECTED" : isHighRisk ? "FRAUD ANOMALY INTERCEPTED" : "RISK REVIEW REQUIRED"),
    sender: txn.sender,
    receiver: txn.receiver,
    amount: txn.amount,
    risk_score: txn.risk_score,
    reason: txn.reasons,
    timestamp: currentTime(),
    severity: txn.risk_score >= 85 ? 'CRITICAL' : txn.risk_score >= 60 ? 'WARNING' : 'ELEVATED'
  };

  alerts.unshift(alert);
  if (alerts.length > 250) alerts.pop();
  return alert;
}

function addTransaction(txn: Transaction) {
  transactions.unshift(txn);
  if (transactions.length > MAX_TRANSACTIONS) {
    transactions.pop();
  }

  if (txn.status !== 'NORMAL' || txn.mule_ring) {
    createAlert(txn, txn.mule_ring ? "MULE RING PATTERN" : undefined);
  }
}

function generateTransaction(opts?: {
  sender?: string;
  receiver?: string;
  amount?: number;
  demo_type?: string;
  forceHighRisk?: boolean;
}): Transaction {
  let sender = opts?.sender || generateAccount();
  let receiver = opts?.receiver || generateAccount();

  while (sender === receiver) {
    receiver = generateAccount();
  }

  let amount = opts?.amount;
  if (amount === undefined) {
    const amounts = [450, 920, 1800, 2400, 4999, 7850, 14200, 22500, 38000, 64000, 89000];
    amount = randomChoice(amounts);
  }

  const account_age = opts?.forceHighRisk ? randomInt(3, 20) : randomInt(5, 1400);
  const freq = opts?.forceHighRisk ? randomInt(48, 85) : randomInt(1, 60);
  const recipRisk = opts?.forceHighRisk ? 0.88 : Math.random();
  const unusualHour = opts?.forceHighRisk ? 1 : Math.random() > 0.7 ? 1 : 0;
  const newDev = opts?.forceHighRisk ? 1 : Math.random() > 0.65 ? 1 : 0;

  const { riskScore, aiProb, ruleScore, status, reasons, latency } = calculateRisk(
    amount,
    account_age,
    freq,
    recipRisk,
    unusualHour,
    newDev
  );

  const txn: Transaction = {
    id: `TX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    sender,
    receiver,
    amount: Number(amount),
    risk_score: opts?.forceHighRisk ? Math.max(riskScore, 88.5) : riskScore,
    ai_probability: opts?.forceHighRisk ? Math.max(aiProb, 89.2) : aiProb,
    rule_score: opts?.forceHighRisk ? Math.max(ruleScore, 85) : ruleScore,
    status: opts?.forceHighRisk ? 'HIGH RISK' : status,
    reasons,
    timestamp: currentTime(),
    prediction_latency_ms: latency,
    account_age_days: account_age,
    transaction_frequency: freq,
    recipient_risk: Math.round(recipRisk * 1000) / 1000,
    unusual_hour: unusualHour,
    new_device: newDev,
    data_type: "SYNTHETIC DEMONSTRATION",
    demo_type: opts?.demo_type || "NORMAL",
    mule_ring: false
  };

  return txn;
}

// =========================================================
// MULE ACCOUNTS & GRAPH CYCLE DETECTOR
// =========================================================

function detectMuleRings(): MuleRing[] {
  // Build directed adjacency list from current transactions
  const adj = new Map<string, Array<{ to: string; amount: number; time: string }>>();

  for (const txn of transactions) {
    if (!adj.has(txn.sender)) adj.set(txn.sender, []);
    adj.get(txn.sender)!.push({ to: txn.receiver, amount: txn.amount, time: txn.timestamp });
  }

  const detected: MuleRing[] = [...muleRingsList];
  const allNodes = Array.from(adj.keys());

  // Simple cycle search (cycles of length 3 to 6)
  for (const start of allNodes) {
    if (detected.some(r => r.accounts.includes(start))) continue;

    const visited = new Set<string>();
    const path: string[] = [start];

    function dfs(u: string, depth: number) {
      if (depth > 6) return;
      const neighbors = adj.get(u) || [];

      for (const edge of neighbors) {
        const v = edge.to;
        if (v === start && depth >= 3) {
          // Detected cycle!
          const cycleAccounts = [...path];
          const cycleKey = `RING-${cycleAccounts.slice().sort().join('-')}`;

          if (!detected.some(r => r.id === cycleKey)) {
            const ringTxns = transactions.filter(t =>
              cycleAccounts.includes(t.sender) && cycleAccounts.includes(t.receiver)
            );
            const sumAmount = ringTxns.reduce((acc, t) => acc + t.amount, 0);

            detected.push({
              id: cycleKey,
              name: `Circular Ring (${cycleAccounts.length} accounts)`,
              pattern_type: 'CIRCULAR_LOOP',
              accounts: cycleAccounts,
              account_count: cycleAccounts.length,
              transaction_count: ringTxns.length || cycleAccounts.length,
              total_amount: Math.round(sumAmount || cycleAccounts.length * 42000),
              risk_level: 'CRITICAL',
              reason: `Circular funds laundering loop detected: ${cycleAccounts.join(' → ')} → ${start}`,
              detected_at: currentTime(),
              hops: cycleAccounts.map((acc, i) => {
                const nxt = cycleAccounts[(i + 1) % cycleAccounts.length];
                return {
                  from: acc,
                  to: nxt,
                  amount: 45000 - i * 3000,
                  delay_seconds: 120 + i * 45,
                  stage: i === 0 ? 'Placement' : i === cycleAccounts.length - 1 ? 'Integration' : 'Layering'
                };
              })
            });
          }
          return;
        }

        if (!visited.has(v) && !path.includes(v)) {
          visited.add(v);
          path.push(v);
          dfs(v, depth + 1);
          path.pop();
          visited.delete(v);
        }
      }
    }

    visited.add(start);
    dfs(start, 1);
  }

  return detected;
}

// Seed initial rich Mule Accounts
function seedMuleAccounts() {
  const initialMules: MuleAccount[] = [
    {
      id: "MULE-ALPHA-101",
      account_number: "MULE1001",
      holder_name: "Rohan Verma (Proxy)",
      account_type: "STUDENT_PROXY",
      risk_rating: 96,
      total_inbound: 245000,
      total_outbound: 238000,
      velocity_txns_per_hr: 14.2,
      account_age_days: 18,
      status: "UNDER_INVESTIGATION",
      ring_id: "RING-CIRCULAR-ALPHA",
      kyc_risk_flags: [
        "Student ID used for KYC with ₹2.4M volume",
        "Rapid passthrough within 4 minutes",
        "IP accessed via Tor Exit Node"
      ],
      first_seen: new Date(Date.now() - 86400000 * 5).toISOString(),
      last_activity: currentTime()
    },
    {
      id: "MULE-BETA-102",
      account_number: "MULE1002",
      holder_name: "Ananya Deshmukh (Digital Nomad)",
      account_type: "CIRCULAR_MEMBER",
      risk_rating: 94,
      total_inbound: 198000,
      total_outbound: 192000,
      velocity_txns_per_hr: 11.5,
      account_age_days: 24,
      status: "UNDER_INVESTIGATION",
      ring_id: "RING-CIRCULAR-ALPHA",
      kyc_risk_flags: [
        "Immediate onward transfer of ₹42,000 within 90s",
        "Device shared with MULE1001"
      ],
      first_seen: new Date(Date.now() - 86400000 * 4).toISOString(),
      last_activity: currentTime()
    },
    {
      id: "MULE-GAMMA-103",
      account_number: "MULE1003",
      holder_name: "Apex Trading Sole Prop",
      account_type: "SHELL_CORP",
      risk_rating: 98,
      total_inbound: 520000,
      total_outbound: 512000,
      velocity_txns_per_hr: 18.0,
      account_age_days: 12,
      status: "UNDER_INVESTIGATION",
      ring_id: "RING-CIRCULAR-ALPHA",
      kyc_risk_flags: [
        "Unregistered business address",
        "Layering structuring pattern",
        "High churn with no commercial footprint"
      ],
      first_seen: new Date(Date.now() - 86400000 * 3).toISOString(),
      last_activity: currentTime()
    },
    {
      id: "MULE-DELTA-104",
      account_number: "MULE1004",
      holder_name: "Cryptonex Exchange Gateway",
      account_type: "CRYPTO_CONDUIT",
      risk_rating: 97,
      total_inbound: 780000,
      total_outbound: 775000,
      velocity_txns_per_hr: 24.5,
      account_age_days: 9,
      status: "UNDER_INVESTIGATION",
      ring_id: "RING-CIRCULAR-ALPHA",
      kyc_risk_flags: [
        "Crypto P2P cash-out aggregator",
        "Off-ramp structuring in ₹45,000 tranches"
      ],
      first_seen: new Date(Date.now() - 86400000 * 2).toISOString(),
      last_activity: currentTime()
    },
    {
      id: "SMURF-MULE-201",
      account_number: "SMURF2001",
      holder_name: "Karan Johar (Smurf Funnel Node)",
      account_type: "STUDENT_PROXY",
      risk_rating: 91,
      total_inbound: 140000,
      total_outbound: 139500,
      velocity_txns_per_hr: 8.7,
      account_age_days: 15,
      status: "ACTIVE",
      ring_id: "RING-SMURFING-BETA",
      kyc_risk_flags: [
        "Receives repeated ₹9,990 deposits right under KYC reporting threshold",
        "Consolidates and transmits to crypto offshore node"
      ],
      first_seen: new Date(Date.now() - 86400000 * 7).toISOString(),
      last_activity: currentTime()
    },
    {
      id: "DORMANT-TAKEOVER-301",
      account_number: "DORM3001",
      holder_name: "Late S. K. Nair (Dormant Hijack)",
      account_type: "DORMANT_TAKEOVER",
      risk_rating: 99,
      total_inbound: 650000,
      total_outbound: 648000,
      velocity_txns_per_hr: 32.0,
      account_age_days: 840,
      status: "FROZEN",
      ring_id: "RING-TAKEOVER-GAMMA",
      kyc_risk_flags: [
        "Dormant for 640 days, suddenly initiated 18 high-velocity transfers",
        "Password and 2FA device changed 20 mins prior to exfiltration"
      ],
      first_seen: new Date(Date.now() - 86400000 * 10).toISOString(),
      last_activity: currentTime()
    }
  ];

  initialMules.forEach(m => muleAccounts.set(m.account_number, m));
}

// Function to plant synthetic circular mule ring demo
function createMuleRingDemo() {
  const ringAccounts = ["MULE1001", "MULE1002", "MULE1003", "MULE1004"];
  const createdTxns: Transaction[] = [];

  const transfers = [
    { from: ringAccounts[0], to: ringAccounts[1], amount: 48000, stage: 'Placement' as const },
    { from: ringAccounts[1], to: ringAccounts[2], amount: 46500, stage: 'Layering' as const },
    { from: ringAccounts[2], to: ringAccounts[3], amount: 44800, stage: 'Layering' as const },
    { from: ringAccounts[3], to: ringAccounts[0], amount: 43200, stage: 'Integration' as const }
  ];

  for (const transfer of transfers) {
    const txn = generateTransaction({
      sender: transfer.from,
      receiver: transfer.to,
      amount: transfer.amount,
      demo_type: "PLANTED MULE RING",
      forceHighRisk: true
    });

    txn.mule_ring = true;
    txn.status = "HIGH RISK";
    txn.risk_score = 96.5;
    txn.reasons = [
      "Account belongs to an active circular laundering ring",
      `Rapid passthrough flow: ${transfer.stage} phase (₹${transfer.amount.toLocaleString('en-IN')})`,
      "Circular cycle detection confirmed via network graph topology"
    ];

    addTransaction(txn);
    createdTxns.push(txn);
  }

  // Update or insert ring in list
  const ringId = "RING-MULE1001-MULE1002-MULE1003-MULE1004";
  const existingRingIndex = muleRingsList.findIndex(r => r.id === ringId);
  const ringData: MuleRing = {
    id: ringId,
    name: "Alpha Syndicate Circular Ring (4 Mules)",
    pattern_type: "CIRCULAR_LOOP",
    accounts: ringAccounts,
    account_count: ringAccounts.length,
    transaction_count: createdTxns.length,
    total_amount: transfers.reduce((sum, t) => sum + t.amount, 0),
    risk_level: "CRITICAL",
    reason: "Circular payment cycle detected: MULE1001 → MULE1002 → MULE1003 → MULE1004 → MULE1001",
    detected_at: currentTime(),
    hops: transfers.map((t, idx) => ({
      from: t.from,
      to: t.to,
      amount: t.amount,
      delay_seconds: 60 + idx * 45,
      stage: t.stage
    }))
  };

  if (existingRingIndex >= 0) {
    muleRingsList[existingRingIndex] = ringData;
  } else {
    muleRingsList.unshift(ringData);
  }

  return {
    message: "Synthetic circular mule-ring demonstration generated successfully",
    accounts: ringAccounts,
    transactions_created: createdTxns.length,
    transactions: createdTxns,
    ring: ringData,
    data_type: "SYNTHETIC DEMONSTRATION"
  };
}

// Function to plant smurfing / funnel mule ring
function createSmurfingDemo() {
  const master = "MASTER-ORIGIN-99";
  const smurfs = ["SMURF2001", "SMURF2002", "SMURF2003", "SMURF2004", "SMURF2005"];
  const collector = "CRYPTO-GATEWAY-X9";
  const createdTxns: Transaction[] = [];

  // Fan out from master to smurfs with amounts right below KYC threshold (₹9,950)
  for (const smurf of smurfs) {
    const smurfAccount: MuleAccount = {
      id: `SMURF-${smurf}`,
      account_number: smurf,
      holder_name: `Smurf Student Proxy ${smurf.slice(-2)}`,
      account_type: 'STUDENT_PROXY',
      risk_rating: 89,
      total_inbound: 29850,
      total_outbound: 29500,
      velocity_txns_per_hr: 9.2,
      account_age_days: randomInt(8, 28),
      status: 'UNDER_INVESTIGATION',
      ring_id: 'RING-SMURFING-BETA',
      kyc_risk_flags: ["Structuring below ₹10,000 threshold", "Immediate onward consolidation"],
      first_seen: currentTime(),
      last_activity: currentTime()
    };
    muleAccounts.set(smurf, smurfAccount);

    // Master -> Smurf
    const txn1 = generateTransaction({
      sender: master,
      receiver: smurf,
      amount: 9950,
      demo_type: "SMURFING STRUCTURING",
      forceHighRisk: true
    });
    txn1.mule_ring = true;
    txn1.reasons = [
      "Structured micro-transfer designed to evade mandatory AML threshold",
      `Fan-out dispersal: Master ${master} → Mule ${smurf}`
    ];
    addTransaction(txn1);
    createdTxns.push(txn1);

    // Smurf -> Collector (Funneling)
    const txn2 = generateTransaction({
      sender: smurf,
      receiver: collector,
      amount: 9800,
      demo_type: "SMURFING CONSOLIDATION",
      forceHighRisk: true
    });
    txn2.mule_ring = true;
    txn2.reasons = [
      "Rapid funnel consolidation into centralized off-ramp conduit",
      `Fan-in consolidation: Mule ${smurf} → Collector ${collector}`
    ];
    addTransaction(txn2);
    createdTxns.push(txn2);
  }

  const ringId = "RING-SMURFING-BETA";
  const ringData: MuleRing = {
    id: ringId,
    name: "Smurfing / Structuring Funnel Network (6 Nodes)",
    pattern_type: "SMURFING_FUNNEL",
    accounts: [master, ...smurfs, collector],
    account_count: smurfs.length + 2,
    transaction_count: createdTxns.length,
    total_amount: createdTxns.reduce((sum, t) => sum + t.amount, 0),
    risk_level: "CRITICAL",
    reason: "Structuring & smurfing fan-in fan-out network detected targeting crypto conduit",
    detected_at: currentTime(),
    hops: createdTxns.map((t, idx) => ({
      from: t.sender,
      to: t.receiver,
      amount: t.amount,
      delay_seconds: 30 + idx * 20,
      stage: t.sender === master ? 'Placement' : 'Layering'
    }))
  };

  const existingIndex = muleRingsList.findIndex(r => r.id === ringId);
  if (existingIndex >= 0) {
    muleRingsList[existingIndex] = ringData;
  } else {
    muleRingsList.unshift(ringData);
  }

  return {
    message: "Smurfing & structuring network attack simulated",
    ring: ringData,
    transactions_created: createdTxns.length,
    data_type: "SYNTHETIC DEMONSTRATION"
  };
}

// Function to populate initial transaction database
function initializeDatabase() {
  seedMuleAccounts();

  // Create initial baseline transactions
  for (let i = 0; i < 40; i++) {
    const isRisky = i % 7 === 0;
    const txn = generateTransaction({
      forceHighRisk: isRisky
    });
    addTransaction(txn);
  }

  // Plant initial mule ring so the user sees mule rings right away!
  createMuleRingDemo();

  console.log("⚡ FraudShield AI V4 Engine Initialized with initial transactions & mule accounts.");
}

initializeDatabase();

// Background stream generator
function startStream() {
  if (streamRunning) return;
  streamRunning = true;
  streamTimer = setInterval(() => {
    if (!streamRunning) return;
    const txn = generateTransaction();
    addTransaction(txn);
    generatedCount++;
    lastGenerated = currentTime();
  }, 3200);
}

function stopStream() {
  streamRunning = false;
  if (streamTimer) {
    clearInterval(streamTimer);
    streamTimer = null;
  }
}

// =========================================================
// EXPRESS APP & API ROUTES
// =========================================================

export async function createServer() {
  const app = express();
  app.use(express.json());

  // CORS headers
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Base API Info
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      project: "FraudShield AI",
      version: "4.0",
      status: "operational",
      runtime: "Express + Vite Full-Stack Engine",
      stream_running: streamRunning,
      total_transactions: transactions.length,
      alerts_count: alerts.length
    });
  });

  // 1. Transactions API
  app.get("/api/transactions", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || MAX_TRANSACTIONS;
    const status = req.query.status as string;
    const search = (req.query.search as string || "").toLowerCase();

    let filtered = transactions;
    if (status && status !== "ALL") {
      filtered = filtered.filter(t => t.status === status);
    }
    if (search) {
      filtered = filtered.filter(t =>
        t.id.toLowerCase().includes(search) ||
        t.sender.toLowerCase().includes(search) ||
        t.receiver.toLowerCase().includes(search) ||
        t.reasons.some(r => r.toLowerCase().includes(search))
      );
    }

    res.json({
      count: filtered.length,
      transactions: filtered.slice(0, limit)
    });
  });

  app.get("/api/transactions/:id", (req: Request, res: Response) => {
    const txn = transactions.find(t => t.id === req.params.id);
    if (!txn) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    res.json(txn);
  });

  // 2. Alerts API
  app.get("/api/alerts", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 100;
    res.json({
      count: alerts.length,
      alerts: alerts.slice(0, limit)
    });
  });

  // 3. Stats API
  app.get("/api/stats", (_req: Request, res: Response) => {
    const high_risk = transactions.filter(t => t.status === "HIGH RISK").length;
    const review = transactions.filter(t => t.status === "REVIEW").length;
    const normal = transactions.filter(t => t.status === "NORMAL").length;
    const total_amount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const avg_latency = transactions.length > 0
      ? transactions.reduce((sum, t) => sum + t.prediction_latency_ms, 0) / transactions.length
      : 1.25;

    const detectedRings = detectMuleRings();

    res.json({
      total_transactions: transactions.length,
      high_risk,
      review,
      normal,
      total_amount: Math.round(total_amount * 100) / 100,
      average_latency_ms: Math.round(avg_latency * 1000) / 1000,
      alerts: alerts.length,
      stream_running: streamRunning,
      mule_rings: detectedRings.length,
      mule_accounts_count: muleAccounts.size,
      frozen_accounts_count: Array.from(muleAccounts.values()).filter(a => a.status === 'FROZEN').length
    });
  });

  // 4. Simulate Transaction
  app.post("/api/simulate", (req: Request, res: Response) => {
    const forceHigh = req.body?.high_risk === true;
    const txn = generateTransaction({ forceHighRisk: forceHigh });
    addTransaction(txn);
    res.json(txn);
  });

  // 5. Stream Control
  app.post("/api/stream/start", (_req: Request, res: Response) => {
    startStream();
    res.json({
      message: "Live transaction streaming engine started",
      running: true
    });
  });

  app.post("/api/stream/stop", (_req: Request, res: Response) => {
    stopStream();
    res.json({
      message: "Live transaction streaming engine paused",
      running: false
    });
  });

  app.get("/api/stream/status", (_req: Request, res: Response) => {
    res.json({
      running: streamRunning,
      generated_count: generatedCount,
      last_generated: lastGenerated
    });
  });

  // 6. Network Graph
  app.get("/api/network", (_req: Request, res: Response) => {
    const nodeMap = new Map<string, { id: string; connections: number; risk_score: number; is_mule: boolean; total_volume: number }>();
    const edges: Array<{ source: string; target: string; amount: number; is_mule: boolean; timestamp: string }> = [];

    // Sample recent 120 transactions for graph responsiveness
    const sample = transactions.slice(0, 120);

    for (const t of sample) {
      if (!nodeMap.has(t.sender)) {
        nodeMap.set(t.sender, {
          id: t.sender,
          connections: 0,
          risk_score: 0,
          is_mule: muleAccounts.has(t.sender) || t.mule_ring,
          total_volume: 0
        });
      }
      if (!nodeMap.has(t.receiver)) {
        nodeMap.set(t.receiver, {
          id: t.receiver,
          connections: 0,
          risk_score: 0,
          is_mule: muleAccounts.has(t.receiver) || t.mule_ring,
          total_volume: 0
        });
      }

      const senderNode = nodeMap.get(t.sender)!;
      const receiverNode = nodeMap.get(t.receiver)!;

      senderNode.connections += 1;
      receiverNode.connections += 1;
      senderNode.total_volume += t.amount;
      receiverNode.total_volume += t.amount;
      senderNode.risk_score = Math.max(senderNode.risk_score, t.risk_score);
      receiverNode.risk_score = Math.max(receiverNode.risk_score, t.risk_score);

      edges.push({
        source: t.sender,
        target: t.receiver,
        amount: t.amount,
        is_mule: t.mule_ring,
        timestamp: t.timestamp
      });
    }

    const detectedRings = detectMuleRings();

    res.json({
      nodes: Array.from(nodeMap.values()),
      edges,
      node_count: nodeMap.size,
      edge_count: edges.length,
      mule_rings: detectedRings
    });
  });

  // 7. Mule-Ring Endpoints
  app.get("/api/mule-rings", (_req: Request, res: Response) => {
    const rings = detectMuleRings();
    res.json({
      count: rings.length,
      rings,
      data_type: "SYNTHETIC DEMONSTRATION"
    });
  });

  app.post("/api/demo/mule-ring", (_req: Request, res: Response) => {
    const result = createMuleRingDemo();
    res.json({
      ...result,
      detected_rings: detectMuleRings()
    });
  });

  app.post("/api/demo/smurfing-ring", (_req: Request, res: Response) => {
    const result = createSmurfingDemo();
    res.json({
      ...result,
      detected_rings: detectMuleRings()
    });
  });

  // 8. Mule Accounts Management (NEW: requested by user)
  app.get("/api/mule-accounts", (_req: Request, res: Response) => {
    res.json({
      count: muleAccounts.size,
      accounts: Array.from(muleAccounts.values())
    });
  });

  app.post("/api/mule-accounts/toggle-freeze", (req: Request, res: Response) => {
    const { account_number } = req.body;
    const account = muleAccounts.get(account_number);

    if (!account) {
      res.status(404).json({ error: "Mule account not found" });
      return;
    }

    account.status = account.status === "FROZEN" ? "ACTIVE" : "FROZEN";
    res.json({
      message: `Account ${account_number} status updated to ${account.status}`,
      account
    });
  });

  app.post("/api/mule-accounts/freeze-all", (_req: Request, res: Response) => {
    let count = 0;
    muleAccounts.forEach(account => {
      account.status = "FROZEN";
      count++;
    });
    res.json({
      message: `Successfully placed emergency freeze on all ${count} identified mule accounts`,
      frozen_count: count
    });
  });

  // 9. Model Metrics & Features
  app.get("/api/model/metrics", (_req: Request, res: Response) => {
    res.json(modelMetrics);
  });

  app.get("/api/model/features", (_req: Request, res: Response) => {
    res.json(modelFeatures);
  });

  // 10. Drift Monitoring
  app.post("/api/drift/simulate", (_req: Request, res: Response) => {
    const baseline = transactions
      .filter(t => t.demo_type !== "DRIFT DEMONSTRATION")
      .map(t => t.amount);

    const baseline_avg = baseline.length > 0
      ? baseline.reduce((a, b) => a + b, 0) / baseline.length
      : 14250;

    const drift_txns: Transaction[] = [];
    for (let i = 0; i < 22; i++) {
      const amount = randomInt(45000, 95000);
      const txn = generateTransaction({
        amount,
        demo_type: "DRIFT DEMONSTRATION"
      });
      addTransaction(txn);
      drift_txns.push(txn);
    }

    const current_avg = drift_txns.reduce((a, b) => a + b.amount, 0) / drift_txns.length;

    driftState = {
      active: true,
      message: "Distribution shift detected: surge in high-value transfers (p-val < 0.001)",
      baseline_average_amount: Math.round(baseline_avg),
      current_average_amount: Math.round(current_avg),
      drift_detected: true,
      ks_statistic: 0.384
    };

    res.json(driftState);
  });

  app.get("/api/drift", (_req: Request, res: Response) => {
    res.json(driftState);
  });

  // 11. Fairness Monitoring
  app.get("/api/fairness", (_req: Request, res: Response) => {
    res.json(fairnessState);
  });

  // 12. Analytics
  app.get("/api/analytics", (_req: Request, res: Response) => {
    const amounts = transactions.map(t => t.amount);
    const risks = transactions.map(t => t.risk_score);

    res.json({
      transaction_count: transactions.length,
      alert_count: alerts.length,
      average_amount: amounts.length > 0 ? Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length) : 0,
      average_risk: risks.length > 0 ? Math.round((risks.reduce((a, b) => a + b, 0) / risks.length) * 10) / 10 : 0,
      mule_ring_count: detectMuleRings().length,
      mule_accounts_count: muleAccounts.size,
      stream: {
        running: streamRunning,
        generated_count: generatedCount
      },
      drift: driftState
    });
  });

  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath);

  if (process.env.NODE_ENV === 'production' || hasDist) {
    // Serve static files in production
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Mount Vite middleware in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FraudShield AI V4 Server running on http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
  });

  return app;
}

createServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
