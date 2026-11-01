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

function currentTime(): string {
  return new Date().toISOString();
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function generateAccount(prefix = "ACC"): string {
  return `${prefix}${randomInt(1001, 1099)}`;
}

class LocalFraudEngine {
  private transactions: Transaction[] = [];
  private alerts: FraudAlert[] = [];
  private muleAccounts: Map<string, MuleAccount> = new Map();
  private muleRingsList: MuleRing[] = [];
  private streamRunning: boolean = false;
  private streamInterval: any = null;
  private generatedCount: number = 0;
  private lastGenerated: string | null = null;

  public driftState: DriftState = {
    active: false,
    message: "No simulated drift currently active",
    baseline_average_amount: 14250,
    current_average_amount: 14250,
    drift_detected: false,
    ks_statistic: 0.04
  };

  public fairnessState: FairnessState = {
    status: "ACTIVE_EVALUATION",
    message: "Monitored across 4 demographic segments for equal opportunity parity",
    segments: [
      { segment: "Tier-1 Metro Users", false_positive_rate: 3.2, accuracy: 98.4, sample_size: 4200 },
      { segment: "Rural / UPI Lite Nodes", false_positive_rate: 4.1, accuracy: 97.9, sample_size: 2850 },
      { segment: "New-to-Bank Accounts (<30d)", false_positive_rate: 6.8, accuracy: 95.7, sample_size: 1980 },
      { segment: "Cross-Border / High-Net Merchants", false_positive_rate: 3.9, accuracy: 98.1, sample_size: 3410 }
    ]
  };

  public modelMetrics: ModelMetrics = {
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
    model_type: "Random Forest Classifier (120 Trees)",
    auc_roc: 0.994,
    avg_inference_latency_ms: 1.42
  };

  public modelFeatures: ModelFeature[] = [
    { feature: "amount_anomaly_ratio", importance: 0.284, description: "Z-score of transaction amount vs account baseline" },
    { feature: "recipient_risk_score", importance: 0.221, description: "Historical fraud involvement score of receiver" },
    { feature: "velocity_burst_10m", importance: 0.178, description: "Transactions initiated in rolling 10-minute window" },
    { feature: "account_age_days", importance: 0.115, description: "Days since KYC completion and first transaction" },
    { feature: "new_device_fingerprint", importance: 0.082, description: "Unseen device UUID or browser hardware hash" },
    { feature: "unusual_hour_flag", importance: 0.063, description: "Night time 01:00-05:00 local time anomaly" },
    { feature: "circular_flow_factor", importance: 0.057, description: "Graph 2-hop or 3-hop return path likelihood" }
  ];

  constructor() {
    this.seedInitialState();
  }

  private seedInitialState() {
    // 1. Seed Mule Accounts
    const mules: MuleAccount[] = [
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

    mules.forEach(m => this.muleAccounts.set(m.account_number, m));

    // 2. Generate baseline transactions
    for (let i = 0; i < 45; i++) {
      const isHigh = i % 8 === 0;
      const t = this.createTxn({ forceHighRisk: isHigh });
      this.addTxn(t);
    }

    // 3. Plant initial circular mule ring
    this.plantCircularRing();
  }

  private calculateRisk(amount: number, account_age: number, freq: number, recipRisk: number, unusualHour: number, newDev: number) {
    let aiProb = 0.05;
    if (amount > 35000) aiProb += 0.32;
    if (amount > 60000) aiProb += 0.22;
    if (account_age < 30) aiProb += 0.18;
    if (freq > 40) aiProb += 0.15;
    if (recipRisk > 0.65) aiProb += 0.25;
    if (unusualHour) aiProb += 0.10;
    if (newDev) aiProb += 0.12;
    aiProb = Math.min(Math.max(aiProb, 0.01), 0.99);

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
    if (riskScore >= 70) status = 'HIGH RISK';
    else if (riskScore >= 35) status = 'REVIEW';

    if (reasons.length === 0) {
      reasons.push("Standard consumer payment pattern - verified low risk");
    }

    return {
      riskScore,
      aiProb: Math.round(aiProb * 1000) / 10,
      ruleScore,
      status,
      reasons,
      latency: Math.round((Math.random() * 0.8 + 0.9) * 1000) / 1000
    };
  }

  private createTxn(opts?: {
    sender?: string;
    receiver?: string;
    amount?: number;
    demo_type?: string;
    forceHighRisk?: boolean;
  }): Transaction {
    let sender = opts?.sender || generateAccount();
    let receiver = opts?.receiver || generateAccount();
    while (sender === receiver) receiver = generateAccount();

    const amounts = [500, 950, 1800, 2400, 4999, 7850, 14200, 22500, 38000, 64000, 89000];
    const amount = opts?.amount ?? randomChoice(amounts);

    const account_age = opts?.forceHighRisk ? randomInt(4, 22) : randomInt(5, 1400);
    const freq = opts?.forceHighRisk ? randomInt(48, 85) : randomInt(1, 60);
    const recipRisk = opts?.forceHighRisk ? 0.88 : Math.random();
    const unusualHour = opts?.forceHighRisk ? 1 : Math.random() > 0.7 ? 1 : 0;
    const newDev = opts?.forceHighRisk ? 1 : Math.random() > 0.65 ? 1 : 0;

    const { riskScore, aiProb, ruleScore, status, reasons, latency } = this.calculateRisk(
      amount, account_age, freq, recipRisk, unusualHour, newDev
    );

    return {
      id: `TX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      sender,
      receiver,
      amount,
      risk_score: opts?.forceHighRisk ? Math.max(riskScore, 89.4) : riskScore,
      ai_probability: opts?.forceHighRisk ? Math.max(aiProb, 91.5) : aiProb,
      rule_score: opts?.forceHighRisk ? Math.max(ruleScore, 88) : ruleScore,
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
  }

  private addTxn(txn: Transaction) {
    this.transactions.unshift(txn);
    if (this.transactions.length > 500) this.transactions.pop();

    if (txn.status !== 'NORMAL' || txn.mule_ring) {
      const alert: FraudAlert = {
        id: `ALT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        transaction_id: txn.id,
        type: txn.mule_ring ? "MULE RING PATTERN" : txn.risk_score >= 70 ? "HIGH-RISK ANOMALY" : "TRANSACTION REVIEW",
        sender: txn.sender,
        receiver: txn.receiver,
        amount: txn.amount,
        risk_score: txn.risk_score,
        reason: txn.reasons,
        timestamp: currentTime(),
        severity: txn.risk_score >= 85 ? 'CRITICAL' : txn.risk_score >= 60 ? 'WARNING' : 'ELEVATED'
      };
      this.alerts.unshift(alert);
      if (this.alerts.length > 200) this.alerts.pop();
    }
  }

  // Plant circular ring demo
  public plantCircularRing(): { message: string; ring: MuleRing; transactions_created: number } {
    const ringAccounts = ["MULE1001", "MULE1002", "MULE1003", "MULE1004"];
    const createdTxns: Transaction[] = [];

    const transfers = [
      { from: ringAccounts[0], to: ringAccounts[1], amount: 48000, stage: 'Placement' as const },
      { from: ringAccounts[1], to: ringAccounts[2], amount: 46500, stage: 'Layering' as const },
      { from: ringAccounts[2], to: ringAccounts[3], amount: 44800, stage: 'Layering' as const },
      { from: ringAccounts[3], to: ringAccounts[0], amount: 43200, stage: 'Integration' as const }
    ];

    for (const transfer of transfers) {
      const txn = this.createTxn({
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
      this.addTxn(txn);
      createdTxns.push(txn);
    }

    const ringId = "RING-MULE1001-MULE1002-MULE1003-MULE1004";
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

    const idx = this.muleRingsList.findIndex(r => r.id === ringId);
    if (idx >= 0) this.muleRingsList[idx] = ringData;
    else this.muleRingsList.unshift(ringData);

    return {
      message: "Circular mule-ring demonstration generated successfully",
      ring: ringData,
      transactions_created: createdTxns.length
    };
  }

  // Plant smurfing demo
  public plantSmurfing(): { message: string; ring: MuleRing; transactions_created: number } {
    const master = "MASTER-ORIGIN-99";
    const smurfs = ["SMURF2001", "SMURF2002", "SMURF2003", "SMURF2004", "SMURF2005"];
    const collector = "CRYPTO-GATEWAY-X9";
    const createdTxns: Transaction[] = [];

    for (const smurf of smurfs) {
      if (!this.muleAccounts.has(smurf)) {
        this.muleAccounts.set(smurf, {
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
        });
      }

      // Master -> Smurf
      const txn1 = this.createTxn({
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
      this.addTxn(txn1);
      createdTxns.push(txn1);

      // Smurf -> Collector
      const txn2 = this.createTxn({
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
      this.addTxn(txn2);
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

    const idx = this.muleRingsList.findIndex(r => r.id === ringId);
    if (idx >= 0) this.muleRingsList[idx] = ringData;
    else this.muleRingsList.unshift(ringData);

    return {
      message: "Smurfing & structuring network attack simulated",
      ring: ringData,
      transactions_created: createdTxns.length
    };
  }

  // API Methods
  public getStats(): SystemStats {
    const high_risk = this.transactions.filter(t => t.status === "HIGH RISK").length;
    const review = this.transactions.filter(t => t.status === "REVIEW").length;
    const normal = this.transactions.filter(t => t.status === "NORMAL").length;
    const total_amount = this.transactions.reduce((sum, t) => sum + t.amount, 0);
    const avg_latency = this.transactions.length > 0
      ? this.transactions.reduce((sum, t) => sum + t.prediction_latency_ms, 0) / this.transactions.length
      : 1.35;

    return {
      total_transactions: this.transactions.length,
      high_risk,
      review,
      normal,
      total_amount: Math.round(total_amount * 100) / 100,
      average_latency_ms: Math.round(avg_latency * 1000) / 1000,
      alerts: this.alerts.length,
      stream_running: this.streamRunning,
      mule_rings: this.muleRingsList.length,
      mule_accounts_count: this.muleAccounts.size,
      frozen_accounts_count: Array.from(this.muleAccounts.values()).filter(a => a.status === 'FROZEN').length
    };
  }

  public getTransactions(params?: { limit?: number; status?: string; search?: string }) {
    let list = this.transactions;
    if (params?.status && params.status !== 'ALL') {
      list = list.filter(t => t.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.sender.toLowerCase().includes(q) ||
        t.receiver.toLowerCase().includes(q) ||
        t.reasons.some(r => r.toLowerCase().includes(q))
      );
    }
    const limit = params?.limit || 150;
    return {
      count: list.length,
      transactions: list.slice(0, limit)
    };
  }

  public getTransaction(id: string): Transaction | null {
    return this.transactions.find(t => t.id === id) || null;
  }

  public simulateTransaction(highRisk = false): Transaction {
    const txn = this.createTxn({ forceHighRisk: highRisk });
    this.addTxn(txn);
    return txn;
  }

  public getAlerts(limit = 100) {
    return {
      count: this.alerts.length,
      alerts: this.alerts.slice(0, limit)
    };
  }

  public startStream() {
    if (this.streamRunning) return;
    this.streamRunning = true;
    this.streamInterval = setInterval(() => {
      if (!this.streamRunning) return;
      const t = this.createTxn();
      this.addTxn(t);
      this.generatedCount++;
      this.lastGenerated = currentTime();
    }, 3200);
  }

  public stopStream() {
    this.streamRunning = false;
    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = null;
    }
  }

  public getStreamStatus() {
    return {
      running: this.streamRunning,
      generated_count: this.generatedCount,
      last_generated: this.lastGenerated
    };
  }

  public getNetwork(): NetworkGraphData {
    const nodeMap = new Map<string, any>();
    const edges: any[] = [];
    const sample = this.transactions.slice(0, 100);

    for (const t of sample) {
      if (!nodeMap.has(t.sender)) {
        nodeMap.set(t.sender, {
          id: t.sender,
          connections: 0,
          risk_score: 0,
          is_mule: this.muleAccounts.has(t.sender) || t.mule_ring,
          total_volume: 0
        });
      }
      if (!nodeMap.has(t.receiver)) {
        nodeMap.set(t.receiver, {
          id: t.receiver,
          connections: 0,
          risk_score: 0,
          is_mule: this.muleAccounts.has(t.receiver) || t.mule_ring,
          total_volume: 0
        });
      }

      const s = nodeMap.get(t.sender)!;
      const r = nodeMap.get(t.receiver)!;
      s.connections += 1;
      r.connections += 1;
      s.total_volume += t.amount;
      r.total_volume += t.amount;
      s.risk_score = Math.max(s.risk_score, t.risk_score);
      r.risk_score = Math.max(r.risk_score, t.risk_score);

      edges.push({
        source: t.sender,
        target: t.receiver,
        amount: t.amount,
        is_mule: t.mule_ring,
        timestamp: t.timestamp
      });
    }

    return {
      nodes: Array.from(nodeMap.values()),
      edges,
      node_count: nodeMap.size,
      edge_count: edges.length,
      mule_rings: this.muleRingsList
    };
  }

  public getMuleRings() {
    return {
      count: this.muleRingsList.length,
      rings: this.muleRingsList
    };
  }

  public getMuleAccounts() {
    return {
      count: this.muleAccounts.size,
      accounts: Array.from(this.muleAccounts.values())
    };
  }

  public toggleFreezeAccount(accNumber: string): { message: string; account: MuleAccount } {
    const acc = this.muleAccounts.get(accNumber);
    if (!acc) throw new Error("Account not found");
    acc.status = acc.status === "FROZEN" ? "ACTIVE" : "FROZEN";
    return {
      message: `Account ${accNumber} status updated to ${acc.status}`,
      account: acc
    };
  }

  public freezeAllMuleAccounts(): { message: string; frozen_count: number } {
    let c = 0;
    this.muleAccounts.forEach(a => {
      a.status = "FROZEN";
      c++;
    });
    return {
      message: `Placed emergency freeze on all ${c} mule accounts`,
      frozen_count: c
    };
  }

  public simulateDrift(): DriftState {
    for (let i = 0; i < 20; i++) {
      const amount = randomInt(45000, 95000);
      const txn = this.createTxn({
        amount,
        demo_type: "DRIFT DEMONSTRATION"
      });
      this.addTxn(txn);
    }

    this.driftState = {
      active: true,
      message: "Distribution shift detected: surge in high-value transfers (p-val < 0.001)",
      baseline_average_amount: 14250,
      current_average_amount: 68400,
      drift_detected: true,
      ks_statistic: 0.384
    };

    return this.driftState;
  }
}

export const localFraudEngine = new LocalFraudEngine();
