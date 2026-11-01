import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  CircleDot,
  Clock3,
  Download,
  GitBranch,
  LayoutDashboard,
  Network,
  Play,
  RefreshCw,
  Shield,
  ShieldAlert,
  Square,
  TrendingUp,
  Users,
  Zap,
  Radio,
  Search,
  Menu,
  X,
  Database,
  Gauge,
  Eye,
  FlaskConical,
  CctvIcon
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API,
  timeout: 10000
});

const NAVIGATION = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: Activity },
  { id: "alerts", label: "Fraud Alerts", icon: ShieldAlert },
  { id: "network", label: "Network Analysis", icon: Network },
  { id: "mule", label: "Mule Ring Detection", icon: GitBranch },
  { id: "model", label: "AI Model", icon: BrainCircuit },
  { id: "monitoring", label: "Monitoring", icon: Gauge }
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const number = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value || 0));

function StatusBadge({ status }) {
  const normalized = String(status || "NORMAL").toUpperCase();

  let type = "normal";

  if (normalized.includes("HIGH") || normalized.includes("MULE")) {
    type = "danger";
  } else if (normalized.includes("REVIEW")) {
    type = "warning";
  }

  return (
    <span className={`status-badge ${type}`}>
      <span className="status-dot" />
      {normalized}
    </span>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, color, trend }) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{title}</span>
        <div className={`metric-icon ${color}`}>
          <Icon size={19} />
        </div>
      </div>

      <div className="metric-value">{value}</div>

      <div className="metric-bottom">
        <span>{subtitle}</span>
        {trend && <span className="metric-trend">{trend}</span>}
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="section-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <Database size={28} />
      <p>{message}</p>
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState("overview");
  const [stats, setStats] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [network, setNetwork] = useState({
    nodes: [],
    edges: [],
    mule_rings: []
  });
  const [rings, setRings] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [features, setFeatures] = useState([]);
  const [drift, setDrift] = useState({});
  const [fairness, setFairness] = useState({});
  const [stream, setStream] = useState({
    running: false,
    generated_count: 0
  });

  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [history, setHistory] = useState([]);

  const notify = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [
        statsResponse,
        transactionsResponse,
        alertsResponse,
        networkResponse,
        ringsResponse,
        metricsResponse,
        featuresResponse,
        streamResponse,
        driftResponse,
        fairnessResponse
      ] = await Promise.all([
        api.get("/api/stats"),
        api.get("/api/transactions"),
        api.get("/api/alerts"),
        api.get("/api/network"),
        api.get("/api/mule-rings"),
        api.get("/api/model/metrics"),
        api.get("/api/model/features"),
        api.get("/api/stream/status"),
        api.get("/api/drift"),
        api.get("/api/fairness")
      ]);

      setStats(statsResponse.data);
      setTransactions(transactionsResponse.data.transactions || []);
      setAlerts(alertsResponse.data.alerts || []);
      setNetwork(networkResponse.data);
      setRings(ringsResponse.data.rings || []);
      setMetrics(metricsResponse.data);
      setFeatures(featuresResponse.data || []);
      setStream(streamResponse.data);
      setDrift(driftResponse.data);
      setFairness(fairnessResponse.data);
      setApiConnected(true);

      setHistory((previous) => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          transactions: statsResponse.data.total_transactions || 0,
          highRisk: statsResponse.data.high_risk || 0,
          review: statsResponse.data.review || 0
        };

        return [...previous, newPoint].slice(-20);
      });
    } catch (error) {
      setApiConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const interval = window.setInterval(loadData, 3000);

    return () => window.clearInterval(interval);
  }, [loadData]);

  const startStream = async () => {
    setBusy(true);

    try {
      const response = await api.post("/api/stream/start");
      notify(response.data.message || "Live monitoring started");
      await loadData();
    } catch {
      notify("Could not start monitoring. Check backend.");
    } finally {
      setBusy(false);
    }
  };

  const stopStream = async () => {
    setBusy(true);

    try {
      const response = await api.post("/api/stream/stop");
      notify(response.data.message || "Monitoring stopped");
      await loadData();
    } catch {
      notify("Could not stop monitoring.");
    } finally {
      setBusy(false);
    }
  };

  const generateTransaction = async () => {
    setBusy(true);

    try {
      await api.post("/api/simulate");
      notify("Test transaction generated successfully");
      await loadData();
    } catch {
      notify("Transaction generation failed.");
    } finally {
      setBusy(false);
    }
  };

  const generateMuleRing = async () => {
    setBusy(true);

    try {
      const response = await api.post("/api/demo/mule-ring");

      notify(
        `Mule-ring demonstration generated: ${response.data.transactions_created} transactions`
      );

      await loadData();
      setActivePage("mule");
    } catch {
      notify("Could not generate mule-ring demonstration.");
    } finally {
      setBusy(false);
    }
  };

  const simulateDrift = async () => {
    setBusy(true);

    try {
      await api.post("/api/drift/simulate");
      notify("Synthetic distribution shift generated");
      await loadData();
      setActivePage("monitoring");
    } catch {
      notify("Drift simulation failed.");
    } finally {
      setBusy(false);
    }
  };

  const downloadCSV = () => {
    if (!transactions.length) {
      notify("No transactions available to export");
      return;
    }

    const columns = [
      "id",
      "sender",
      "receiver",
      "amount",
      "risk_score",
      "ai_probability",
      "rule_score",
      "status",
      "timestamp",
      "reasons",
      "demo_type"
    ];

    const rows = transactions.map((transaction) =>
      columns.map((column) => {
        const value = transaction[column];

        const safeValue = Array.isArray(value)
          ? value.join("; ")
          : value ?? "";

        return `"${String(safeValue).replaceAll('"', '""')}"`;
      }).join(",")
    );

    const csv = [
      columns.join(","),
      ...rows
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "fraudshield_transactions.csv";
    link.click();

    URL.revokeObjectURL(url);

    notify("Transaction CSV downloaded");
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const text = [
      transaction.id,
      transaction.sender,
      transaction.receiver,
      transaction.status
    ].join(" ").toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());

    const matchesFilter =
      filter === "ALL" || transaction.status === filter;

    return matchesSearch && matchesFilter;
  });

  const distribution = [
    {
      name: "Normal",
      value: stats.normal || 0
    },
    {
      name: "Review",
      value: stats.review || 0
    },
    {
      name: "High Risk",
      value: stats.high_risk || 0
    }
  ];

  const distributionColors = [
    "#26c99a",
    "#f6b94b",
    "#fa6477"
  ];

  const riskTransactions = transactions.slice(0, 10).reverse().map((t, index) => ({
    name: `T${index + 1}`,
    risk: Number(t.risk_score || 0)
  }));

  const visiblePage = NAVIGATION.find((item) => item.id === activePage);

  const pageTitle = visiblePage?.label || "Overview";

  const pageDescription = {
    overview: "Real-time intelligence for digital payment security.",
    transactions: "Inspect, filter and investigate synthetic payment activity.",
    alerts: "Monitor suspicious transactions and their explanations.",
    network: "Explore connected accounts and payment relationships.",
    mule: "Identify circular transaction patterns and connected accounts.",
    model: "Evaluate the machine-learning fraud prediction model.",
    monitoring: "Review live processing, drift and synthetic fairness indicators."
  }[activePage];

  if (loading && !apiConnected) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">
          <Shield size={35} />
        </div>
        <h1>FRAUDSHIELD AI</h1>
        <p>Connecting to fraud detection engine...</p>
        <div className="loading-bar">
          <span />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {mobileMenu && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Shield size={24} />
          </div>

          <div>
            <h1>FRAUDSHIELD</h1>
            <span>AI SECURITY PLATFORM</span>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMobileMenu(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {NAVIGATION.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`nav-item ${activePage === item.id ? "active" : ""}`}
                onClick={() => {
                  setActivePage(item.id);
                  setMobileMenu(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>

                {item.id === "alerts" && alerts.length > 0 && (
                  <span className="nav-count">{alerts.length}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-card">
            <div className="system-card-top">
              <span className="system-pulse" />
              <span>SYSTEM STATUS</span>
            </div>

            <strong>{apiConnected ? "Backend connected" : "Disconnected"}</strong>

            <p>
              {stream.running
                ? "Live transaction stream active"
                : "Monitoring stream stopped"}
            </p>
          </div>

          <div className="sidebar-footer">
            <span>BIOSYNTAX</span>
            <span>FRAUDSHIELD V4.0</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={21} />
            </button>

            <div>
              <div className="breadcrumb">WORKSPACE / {pageTitle.toUpperCase()}</div>
              <h2>{pageTitle}</h2>
            </div>
          </div>

          <div className="topbar-right">
            <div className={`connection-pill ${apiConnected ? "connected" : "disconnected"}`}>
              <span className="status-dot" />
              {apiConnected ? "API CONNECTED" : "API OFFLINE"}
            </div>

            <div className="topbar-time">
              <Clock3 size={15} />
              {new Date().toLocaleTimeString()}
            </div>

            <button
              className="icon-button"
              onClick={loadData}
              title="Refresh data"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </header>

        <div className="page-container">
          <SectionTitle
            eyebrow="FRAUD INTELLIGENCE CENTER"
            title={pageTitle}
            description={pageDescription}
            action={
              <div className="page-actions">
                <button
                  className="button secondary"
                  onClick={downloadCSV}
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
            }
          />

          {message && (
            <div className="toast-message">
              <CheckCircle2 size={17} />
              {message}
            </div>
          )}

          <div className="demo-notice">
            <FlaskConical size={16} />
            <span>
              HACKATHON PROTOTYPE — All transaction data and model evaluation
              results are synthetic demonstrations, not live banking data.
            </span>
          </div>

          {activePage === "overview" && (
            <>
              <div className="hero-panel">
                <div className="hero-content">
                  <div className="hero-tag">
                    <Radio size={14} />
                    INTELLIGENT PAYMENT PROTECTION
                  </div>

                  <h2>
                    Detect fraud.
                    <br />
                    <span>Understand risk.</span>
                  </h2>

                  <p>
                    Monitor payment activity, identify suspicious behavior
                    and investigate connected account networks.
                  </p>

                  <div className="hero-buttons">
                    {!stream.running ? (
                      <button
                        className="button primary"
                        onClick={startStream}
                        disabled={busy}
                      >
                        <Play size={16} />
                        Start Live Monitoring
                      </button>
                    ) : (
                      <button
                        className="button danger-button"
                        onClick={stopStream}
                        disabled={busy}
                      >
                        <Square size={15} />
                        Stop Monitoring
                      </button>
                    )}

                    <button
                      className="button hero-secondary"
                      onClick={generateMuleRing}
                      disabled={busy}
                    >
                      <GitBranch size={16} />
                      Run Mule-Ring Demo
                    </button>
                  </div>
                </div>

                <div className="hero-visual">
                  <div className="radar-ring radar-one" />
                  <div className="radar-ring radar-two" />
                  <div className="radar-ring radar-three" />

                  <div className="radar-core">
                    <Shield size={38} />
                  </div>

                  <div className="radar-node node-one" />
                  <div className="radar-node node-two" />
                  <div className="radar-node node-three" />
                  <div className="radar-node node-four" />
                </div>

                <div className="hero-footer">
                  <span>
                    <span className={`status-dot ${stream.running ? "live-dot" : ""}`} />
                    {stream.running ? "MONITORING ACTIVE" : "MONITORING PAUSED"}
                  </span>
                  <span>MODEL VERSION 4.0</span>
                  <span>SYNTHETIC DATA ENVIRONMENT</span>
                </div>
              </div>

              <div className="metrics-grid">
                <MetricCard
                  title="Total Transactions"
                  value={number(stats.total_transactions)}
                  subtitle="Stored transaction records"
                  icon={Activity}
                  color="blue"
                />

                <MetricCard
                  title="High Risk"
                  value={number(stats.high_risk)}
                  subtitle="Flagged as high risk"
                  icon={ShieldAlert}
                  color="red"
                />

                <MetricCard
                  title="Under Review"
                  value={number(stats.review)}
                  subtitle="Require further inspection"
                  icon={Eye}
                  color="yellow"
                />

                <MetricCard
                  title="Mule Rings"
                  value={number(stats.mule_rings)}
                  subtitle="Circular patterns detected"
                  icon={GitBranch}
                  color="purple"
                />
              </div>

              <div className="dashboard-grid">
                <div className="panel panel-large">
                  <div className="panel-heading">
                    <div>
                      <h3>Transaction Activity</h3>
                      <p>Recent system activity snapshots</p>
                    </div>

                    <span className="live-label">
                      <span className="status-dot" />
                      AUTO REFRESH
                    </span>
                  </div>

                  <div className="chart-container">
                    {history.length > 1 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                          <defs>
                            <linearGradient id="transactionGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#568bff" stopOpacity={0.32} />
                              <stop offset="100%" stopColor="#568bff" stopOpacity={0} />
                            </linearGradient>
                          </defs>

                          <CartesianGrid strokeDasharray="3 3" stroke="#26354a" />

                          <XAxis
                            dataKey="time"
                            tick={{ fill: "#8291a8", fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                          />

                          <YAxis
                            tick={{ fill: "#8291a8", fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                          />

                          <Tooltip
                            contentStyle={{
                              background: "#111c2d",
                              border: "1px solid #26354a",
                              borderRadius: 10,
                              color: "#fff"
                            }}
                          />

                          <Area
                            type="monotone"
                            dataKey="transactions"
                            stroke="#568bff"
                            strokeWidth={2}
                            fill="url(#transactionGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState message="Activity history will appear after refreshing data." />
                    )}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Risk Distribution</h3>
                      <p>Current transaction categories</p>
                    </div>
                  </div>

                  <div className="pie-chart-container">
                    {transactions.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distribution}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={62}
                            outerRadius={88}
                            paddingAngle={4}
                          >
                            {distribution.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={distributionColors[index]}
                              />
                            ))}
                          </Pie>

                          <Tooltip
                            contentStyle={{
                              background: "#111c2d",
                              border: "1px solid #26354a",
                              borderRadius: 10,
                              color: "#fff"
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState message="No transactions available." />
                    )}

                    <div className="pie-center">
                      <strong>{number(stats.total_transactions)}</strong>
                      <span>TRANSACTIONS</span>
                    </div>
                  </div>

                  <div className="chart-legend">
                    {distribution.map((item, index) => (
                      <div key={item.name}>
                        <span
                          className="legend-dot"
                          style={{ background: distributionColors[index] }}
                        />
                        <span>{item.name}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Recent Transactions</h3>
                      <p>Latest payment activity</p>
                    </div>

                    <button
                      className="text-button"
                      onClick={() => setActivePage("transactions")}
                    >
                      View all
                      <ArrowUpRight size={15} />
                    </button>
                  </div>

                  <TransactionTable
                    transactions={transactions.slice(0, 6)}
                    compact
                  />
                </div>

                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Recent Fraud Alerts</h3>
                      <p>Suspicious transaction notifications</p>
                    </div>

                    <button
                      className="text-button"
                      onClick={() => setActivePage("alerts")}
                    >
                      View all
                      <ArrowUpRight size={15} />
                    </button>
                  </div>

                  <div className="alert-list">
                    {alerts.slice(0, 5).map((alert) => (
                      <div className="alert-row" key={alert.id}>
                        <div className="alert-icon">
                          <AlertTriangle size={17} />
                        </div>

                        <div className="alert-info">
                          <strong>{alert.type}</strong>
                          <span>
                            {alert.sender} → {alert.receiver}
                          </span>
                        </div>

                        <div className="alert-amount">
                          {money(alert.amount)}
                        </div>
                      </div>
                    ))}

                    {!alerts.length && (
                      <EmptyState message="No fraud alerts available." />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activePage === "transactions" && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Transaction Explorer</h3>
                  <p>Search and filter synthetic transaction records.</p>
                </div>

                <button
                  className="button secondary"
                  onClick={generateTransaction}
                  disabled={busy}
                >
                  <Zap size={16} />
                  Generate Test Transaction
                </button>
              </div>

              <div className="table-controls">
                <div className="search-box">
                  <Search size={17} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search transaction or account..."
                  />
                </div>

                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  <option value="ALL">All statuses</option>
                  <option value="NORMAL">Normal</option>
                  <option value="REVIEW">Review</option>
                  <option value="HIGH RISK">High Risk</option>
                </select>
              </div>

              <TransactionTable transactions={filteredTransactions} />
            </div>
          )}

          {activePage === "alerts" && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Fraud Alert Center</h3>
                  <p>Suspicious transactions identified by the prototype.</p>
                </div>

                <div className="alert-count">
                  {alerts.length} ALERTS
                </div>
              </div>

              <div className="full-alert-list">
                {alerts.map((alert) => (
                  <div className="full-alert-card" key={alert.id}>
                    <div className="full-alert-top">
                      <div className="alert-icon">
                        <AlertTriangle size={19} />
                      </div>

                      <div>
                        <strong>{alert.type}</strong>
                        <span>{alert.timestamp ? new Date(alert.timestamp).toLocaleString() : "Time unavailable"}</span>
                      </div>

                      <div className="risk-score">
                        {alert.risk_score}/100
                      </div>
                    </div>

                    <div className="alert-transfer">
                      <span>{alert.sender}</span>
                      <ArrowDownRight size={17} />
                      <span>{alert.receiver}</span>
                      <strong>{money(alert.amount)}</strong>
                    </div>

                    <div className="alert-reason">
                      <strong>Explanation:</strong>{" "}
                      {Array.isArray(alert.reason)
                        ? alert.reason.join(", ")
                        : alert.reason}
                    </div>
                  </div>
                ))}

                {!alerts.length && (
                  <EmptyState message="No alerts currently available." />
                )}
              </div>
            </div>
          )}

          {activePage === "network" && (
            <>
              <div className="metrics-grid">
                <MetricCard
                  title="Connected Accounts"
                  value={number(network.nodes?.length)}
                  subtitle="Accounts in the graph"
                  icon={Users}
                  color="blue"
                />

                <MetricCard
                  title="Payment Connections"
                  value={number(network.edges?.length)}
                  subtitle="Directed account transfers"
                  icon={GitBranch}
                  color="purple"
                />

                <MetricCard
                  title="Detected Rings"
                  value={number(rings.length)}
                  subtitle="Circular account patterns"
                  icon={ShieldAlert}
                  color="red"
                />

                <MetricCard
                  title="Total Transfers"
                  value={number(transactions.length)}
                  subtitle="Available transaction records"
                  icon={Activity}
                  color="green"
                />
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Account Connection Explorer</h3>
                    <p>Directed payment relationships from the transaction graph.</p>
                  </div>

                  <button
                    className="button secondary"
                    onClick={loadData}
                  >
                    <RefreshCw size={15} />
                    Refresh graph
                  </button>
                </div>

                <div className="network-list">
                  {(network.edges || []).slice(0, 60).map((edge, index) => (
                    <div className="network-edge" key={`${edge.source}-${edge.target}-${index}`}>
                      <div className="network-account">
                        <CircleDot size={16} />
                        {edge.source}
                      </div>

                      <div className="network-line">
                        <span />
                        <ArrowUpRight size={16} />
                      </div>

                      <div className="network-account">
                        <CircleDot size={16} />
                        {edge.target}
                      </div>

                      <strong>{money(edge.amount)}</strong>
                    </div>
                  ))}

                  {!network.edges?.length && (
                    <EmptyState message="No account connections available." />
                  )}
                </div>
              </div>
            </>
          )}

          {activePage === "mule" && (
            <>
              <div className="mule-hero">
                <div className="mule-icon">
                  <GitBranch size={30} />
                </div>

                <div className="mule-content">
                  <div className="eyebrow">GRAPH-BASED FRAUD INTELLIGENCE</div>
                  <h2>Mule Ring Detection</h2>
                  <p>
                    Identify circular money movement between connected
                    accounts using directed graph cycle detection.
                  </p>
                </div>

                <button
                  className="button primary"
                  onClick={generateMuleRing}
                  disabled={busy}
                >
                  <Zap size={16} />
                  Generate Mule-Ring Demo
                </button>
              </div>

              <div className="metrics-grid">
                <MetricCard
                  title="Detected Rings"
                  value={number(rings.length)}
                  subtitle="Circular patterns"
                  icon={GitBranch}
                  color="red"
                />

                <MetricCard
                  title="Connected Accounts"
                  value={number(
                    rings.reduce((sum, ring) => sum + ring.account_count, 0)
                  )}
                  subtitle="Across detected rings"
                  icon={Users}
                  color="purple"
                />

                <MetricCard
                  title="Ring Transactions"
                  value={number(
                    rings.reduce((sum, ring) => sum + ring.transaction_count, 0)
                  )}
                  subtitle="Related transfers"
                  icon={Activity}
                  color="blue"
                />

                <MetricCard
                  title="Ring Transfer Value"
                  value={money(
                    rings.reduce((sum, ring) => sum + ring.total_amount, 0)
                  )}
                  subtitle="Sum of related records"
                  icon={TrendingUp}
                  color="yellow"
                />
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Detected Circular Networks</h3>
                    <p>Results returned by the graph-cycle detection endpoint.</p>
                  </div>

                  <span className="live-label">
                    {rings.length} DETECTED
                  </span>
                </div>

                {rings.map((ring, index) => (
                  <div className="ring-card" key={ring.id || index}>
                    <div className="ring-card-header">
                      <div className="ring-title">
                        <div className="ring-number">
                          <GitBranch size={20} />
                        </div>

                        <div>
                          <strong>Suspicious Ring #{index + 1}</strong>
                          <span>{ring.id}</span>
                        </div>
                      </div>

                      <StatusBadge status={ring.risk_level} />
                    </div>

                    <div className="ring-stats">
                      <div>
                        <span>Accounts</span>
                        <strong>{ring.account_count}</strong>
                      </div>

                      <div>
                        <span>Transactions</span>
                        <strong>{ring.transaction_count}</strong>
                      </div>

                      <div>
                        <span>Transfer value</span>
                        <strong>{money(ring.total_amount)}</strong>
                      </div>
                    </div>

                    <div className="ring-flow">
                      {ring.accounts.map((account, accountIndex) => (
                        <div className="ring-flow-item" key={`${ring.id}-${account}`}>
                          <div className="ring-account">
                            <CircleDot size={17} />
                            {account}
                          </div>

                          {accountIndex < ring.accounts.length - 1 && (
                            <ArrowUpRight size={17} />
                          )}
                        </div>
                      ))}

                      <div className="ring-account ring-return">
                        <ArrowDownRight size={15} />
                        Returns to first account
                      </div>
                    </div>

                    <div className="ring-explanation">
                      <AlertTriangle size={17} />
                      {ring.reason}
                    </div>
                  </div>
                ))}

                {!rings.length && (
                  <EmptyState message="No circular account patterns detected yet. Run the Mule-Ring Demo to generate a synthetic example." />
                )}
              </div>
            </>
          )}

          {activePage === "model" && (
            <>
              <div className="model-banner">
                <div className="model-banner-icon">
                  <BrainCircuit size={32} />
                </div>

                <div>
                  <div className="eyebrow">MACHINE LEARNING ENGINE</div>
                  <h2>Random Forest Classifier</h2>
                  <p>
                    Hybrid risk evaluation combines the model's fraud
                    probability with rule-based indicators.
                  </p>
                </div>

                <div className="model-status">
                  <span className="status-dot" />
                  MODEL READY
                </div>
              </div>

              <div className="metrics-grid">
                <MetricCard
                  title="Accuracy"
                  value={`${metrics.accuracy ?? 0}%`}
                  subtitle="Synthetic test split"
                  icon={CheckCircle2}
                  color="green"
                />

                <MetricCard
                  title="Precision"
                  value={`${metrics.precision ?? 0}%`}
                  subtitle="Synthetic test split"
                  icon={TargetIcon}
                  color="blue"
                />

                <MetricCard
                  title="Recall"
                  value={`${metrics.recall ?? 0}%`}
                  subtitle="Synthetic test split"
                  icon={Eye}
                  color="purple"
                />

                <MetricCard
                  title="F1 Score"
                  value={`${metrics.f1_score ?? 0}%`}
                  subtitle="Synthetic test split"
                  icon={Gauge}
                  color="yellow"
                />
              </div>

              <div className="dashboard-grid">
                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Feature Importance</h3>
                      <p>Relative contribution in the trained model.</p>
                    </div>
                  </div>

                  <div className="feature-chart">
                    {features.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={features}
                          layout="vertical"
                          margin={{ left: 12, right: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#26354a" horizontal={false} />

                          <XAxis
                            type="number"
                            tick={{ fill: "#8291a8", fontSize: 10 }}
                          />

                          <YAxis
                            type="category"
                            dataKey="feature"
                            width={145}
                            tick={{ fill: "#a9b6c9", fontSize: 11 }}
                          />

                          <Tooltip
                            contentStyle={{
                              background: "#111c2d",
                              border: "1px solid #26354a",
                              borderRadius: 10
                            }}
                          />

                          <Bar
                            dataKey="importance"
                            fill="#638eff"
                            radius={[0, 5, 5, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState message="Model feature data unavailable." />
                    )}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Training Summary</h3>
                      <p>Evaluation dataset information.</p>
                    </div>
                  </div>

                  <div className="model-details">
                    <div>
                      <span>Algorithm</span>
                      <strong>Random Forest</strong>
                    </div>

                    <div>
                      <span>Training samples</span>
                      <strong>{number(metrics.training_samples)}</strong>
                    </div>

                    <div>
                      <span>Testing samples</span>
                      <strong>{number(metrics.testing_samples)}</strong>
                    </div>

                    <div>
                      <span>Fraud samples</span>
                      <strong>{number(metrics.fraud_samples)}</strong>
                    </div>

                    <div>
                      <span>Normal samples</span>
                      <strong>{number(metrics.normal_samples)}</strong>
                    </div>

                    <div>
                      <span>Data source</span>
                      <strong>Synthetic</strong>
                    </div>
                  </div>

                  <div className="demo-notice inside-notice">
                    These metrics measure performance on the generated
                    synthetic test dataset. They do not establish real-world
                    banking fraud detection performance.
                  </div>
                </div>
              </div>
            </>
          )}

          {activePage === "monitoring" && (
            <>
              <div className="metrics-grid">
                <MetricCard
                  title="Prediction Latency"
                  value={`${stats.average_latency_ms || 0} ms`}
                  subtitle="Average measured prediction time"
                  icon={Zap}
                  color="blue"
                />

                <MetricCard
                  title="Stream Generated"
                  value={number(stream.generated_count)}
                  subtitle="Transactions since stream start"
                  icon={Radio}
                  color="green"
                />

                <MetricCard
                  title="Monitoring Status"
                  value={stream.running ? "ACTIVE" : "STOPPED"}
                  subtitle="Synthetic transaction stream"
                  icon={Activity}
                  color="purple"
                />

                <MetricCard
                  title="Detected Mule Rings"
                  value={number(rings.length)}
                  subtitle="Current graph cycles"
                  icon={GitBranch}
                  color="red"
                />
              </div>

              <div className="dashboard-grid">
                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Live Stream Control</h3>
                      <p>Start or stop synthetic payment generation.</p>
                    </div>
                  </div>

                  <div className="monitor-control">
                    <div className={`monitor-visual ${stream.running ? "monitor-active" : ""}`}>
                      <Radio size={34} />
                    </div>

                    <h3>{stream.running ? "Stream is running" : "Stream is stopped"}</h3>

                    <p>
                      {stream.running
                        ? "The backend is generating a synthetic transaction approximately every three seconds."
                        : "Start the stream to populate the dashboard with new transactions."}
                    </p>

                    {!stream.running ? (
                      <button
                        className="button primary"
                        onClick={startStream}
                        disabled={busy}
                      >
                        <Play size={16} />
                        Start Live Stream
                      </button>
                    ) : (
                      <button
                        className="button danger-button"
                        onClick={stopStream}
                        disabled={busy}
                      >
                        <Square size={15} />
                        Stop Live Stream
                      </button>
                    )}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Concept Drift Demonstration</h3>
                      <p>Simulate a change in transaction amount distribution.</p>
                    </div>
                  </div>

                  <div className="drift-content">
                    <div className={`drift-status ${drift.active ? "drift-active" : ""}`}>
                      <TrendingUp size={25} />
                      <strong>{drift.active ? "Distribution shift generated" : "No simulated shift active"}</strong>
                    </div>

                    <div className="drift-stat">
                      <span>Baseline average amount</span>
                      <strong>{money(drift.baseline_average_amount)}</strong>
                    </div>

                    <div className="drift-stat">
                      <span>Shifted sample average</span>
                      <strong>{money(drift.current_average_amount)}</strong>
                    </div>

                    <button
                      className="button secondary full-width"
                      onClick={simulateDrift}
                      disabled={busy}
                    >
                      <Zap size={16} />
                      Simulate Distribution Shift
                    </button>

                    <p className="small-note">
                      This creates a synthetic distribution-shift example.
                      It is not an implemented adaptive retraining system.
                    </p>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Synthetic Segment Monitoring</h3>
                    <p>Illustrative false-positive-rate figures.</p>
                  </div>
                </div>

                <div className="fairness-grid">
                  {(fairness.segments || []).map((segment) => (
                    <div className="fairness-card" key={segment.segment}>
                      <span>{segment.segment}</span>
                      <strong>{segment.false_positive_rate}%</strong>
                      <div className="fairness-track">
                        <span style={{ width: `${Math.min(segment.false_positive_rate * 8, 100)}%` }} />
                      </div>
                      <small>Synthetic FPR illustration</small>
                    </div>
                  ))}
                </div>

                <div className="demo-notice inside-notice">
                  {fairness.message || "Synthetic fairness demonstration."}
                </div>
              </div>
            </>
          )}

          <footer className="main-footer">
            <div>
              <Shield size={16} />
              <strong>FRAUDSHIELD AI</strong>
              <span>Intelligent fraud detection prototype</span>
            </div>

            <div>
              <span>BIOS V2 HACKATHON</span>
              <span>VERSION 4.0</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

function TargetIcon(props) {
  return <CircleDot {...props} />;
}

function TransactionTable({ transactions, compact = false }) {
  if (!transactions?.length) {
    return <EmptyState message="No transaction records found." />;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>TRANSACTION ID</th>
            <th>SENDER</th>
            <th>RECEIVER</th>
            <th>AMOUNT</th>
            <th>RISK SCORE</th>
            <th>STATUS</th>
            {!compact && <th>TYPE</th>}
          </tr>
        </thead>

        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td className="mono">{transaction.id}</td>
              <td>{transaction.sender}</td>
              <td>{transaction.receiver}</td>
              <td className="amount-cell">{money(transaction.amount)}</td>
              <td>
                <div className="risk-cell">
                  <div className="risk-track">
                    <span
                      style={{
                        width: `${transaction.risk_score}%`,
                        background:
                          transaction.risk_score >= 70
                            ? "#fa6477"
                            : transaction.risk_score >= 35
                              ? "#f6b94b"
                              : "#26c99a"
                      }}
                    />
                  </div>

                  <strong>{transaction.risk_score}</strong>
                </div>
              </td>

              <td>
                <StatusBadge status={transaction.status} />
              </td>

              {!compact && (
                <td>
                  <span className="type-label">
                    {transaction.demo_type || "NORMAL"}
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;