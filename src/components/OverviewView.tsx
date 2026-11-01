import React from 'react';
import {
  Transaction,
  FraudAlert,
  MuleRing,
  MuleAccount,
  SystemStats
} from '../types/data';
import {
  Shield,
  ShieldAlert,
  Activity,
  GitBranch,
  TrendingUp,
  Zap,
  ArrowRight,
  Eye,
  Lock,
  Radio,
  Play,
  Square,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
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
  Cell
} from 'recharts';
import { sound } from '../utils/audio';

interface Props {
  stats: SystemStats;
  transactions: Transaction[];
  alerts: FraudAlert[];
  muleRings: MuleRing[];
  muleAccounts: MuleAccount[];
  streamRunning: boolean;
  history: Array<{ time: string; count: number; highRisk: number }>;
  onStartStream: () => Promise<void>;
  onStopStream: () => Promise<void>;
  onPlantMuleRing: () => Promise<void>;
  onSwitchView: (view: any) => void;
  onSelectAccount?: (acc: string) => void;
}

export function OverviewView({
  stats,
  transactions,
  alerts,
  muleRings,
  muleAccounts,
  streamRunning,
  history,
  onStartStream,
  onStopStream,
  onPlantMuleRing,
  onSwitchView,
  onSelectAccount
}: Props) {
  const pieData = [
    { name: 'Normal', value: stats.normal || 0, color: '#10b981' },
    { name: 'Under Review', value: stats.review || 0, color: '#f59e0b' },
    { name: 'High Risk Fraud', value: stats.high_risk || 0, color: '#f43f5e' }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Visual Command Panel */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border border-slate-800 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              <span className={`w-2 h-2 rounded-full ${streamRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`} />
              AEGISPAY FRAUDSHIELD AI · ENTERPRISE PAYMENT SECURITY
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Real-time payment fraud detection.
              <span className="block bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Understand risk, stop mule syndicates.
              </span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Continuous transaction scoring fusing Random Forest machine learning with directed graph cycle detection to intercept carding attacks, smurfing funnels, and money mule networks.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  sound.playClick();
                  streamRunning ? onStopStream() : onStartStream();
                }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                  streamRunning
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                    : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-500/30'
                }`}
              >
                {streamRunning ? (
                  <>
                    <Square className="w-4 h-4 fill-white" />
                    Pause Live Telemetry
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    Start Live Telemetry
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onPlantMuleRing();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700 transition"
              >
                <GitBranch className="w-4 h-4 text-purple-400" />
                Run Mule-Ring Demo
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onSwitchView('network');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                View Topology Graph &rarr;
              </button>
            </div>
          </div>

          {/* Futuristic Cyber Radar Scanner Graphic */}
          <div className="relative w-64 h-64 mx-auto lg:mx-0 shrink-0 flex items-center justify-center">
            {/* Outer rings */}
            <div className="absolute inset-0 rounded-full border border-sky-500/20 animate-[spin_24s_linear_infinite]" />
            <div className="absolute inset-6 rounded-full border border-purple-500/30 border-dashed" />
            <div className="absolute inset-14 rounded-full border border-indigo-500/40" />

            {/* Scanning radar line */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="w-1/2 h-1/2 absolute top-0 right-0 origin-bottom-left bg-gradient-to-br from-sky-500/25 to-transparent transform -rotate-45 animate-[spin_4s_linear_infinite]" />
            </div>

            {/* Core Shield */}
            <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-0.5 shadow-[0_0_35px_rgba(56,189,248,0.4)] flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex flex-col items-center justify-center">
                <Shield className="w-8 h-8 text-sky-400" />
                <span className="text-[9px] font-mono font-bold text-sky-300 mt-1">98.7% ML</span>
              </div>
            </div>

            {/* Blips / Nodes */}
            <span className="absolute top-8 left-16 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            <span className="absolute bottom-10 right-12 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" />
            <span className="absolute top-20 right-8 w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
            <span className="absolute bottom-12 left-10 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
          </div>
        </div>

        {/* Footer Info Strip */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              STATUS: {streamRunning ? 'STREAM INGESTION ACTIVE' : 'INGESTION PAUSED'}
            </span>
            <span className="hidden sm:inline font-mono">MODEL: RANDOM FOREST V4.0</span>
            <span className="hidden sm:inline font-mono">CYCLE DETECTION: ACTIVE</span>
          </div>
          <div className="font-mono text-slate-500">
            ENGINE LATENCY: {stats.average_latency_ms || 1.3} ms
          </div>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => onSwitchView('transactions')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 cursor-pointer transition backdrop-blur group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Transactions</span>
            <Activity className="w-4 h-4 text-sky-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white mt-2">
            {stats.total_transactions.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Volume: ₹{(stats.total_amount / 100000).toFixed(1)}L</span>
            <span className="text-sky-400 font-semibold">&rarr;</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onSwitchView('alerts')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 cursor-pointer transition backdrop-blur group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>High Risk Intercepted</span>
            <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-rose-400 mt-2">
            {stats.high_risk.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Active Alerts: {stats.alerts}</span>
            <span className="text-rose-400 font-semibold">&rarr;</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onSwitchView('mule_rings')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition backdrop-blur group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Detected Mule Rings</span>
            <GitBranch className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-purple-400 mt-2">
            {muleRings.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Circular graph cycles</span>
            <span className="text-purple-400 font-semibold">&rarr;</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onSwitchView('mule_accounts')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition backdrop-blur group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Mule Accounts</span>
            <Lock className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-2">
            {muleAccounts.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{stats.frozen_accounts_count} Frozen / Protected</span>
            <span className="text-emerald-400 font-semibold">&rarr;</span>
          </div>
        </div>
      </div>

      {/* Two-Column Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Flow Velocity Chart (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Live Transaction Ingestion Activity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Rolling time-series monitoring of incoming UPI and card streams</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                AUTO-POLL
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.length > 0 ? history : [{ time: 'Now', count: transactions.length, highRisk: stats.high_risk }]}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2} fill="url(#areaGradient)" name="Total Ingested" />
                <Area type="monotone" dataKey="highRisk" stroke="#f43f5e" strokeWidth={2} fill="url(#riskGradient)" name="High Risk Anomaly" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Donut (1 col) */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Risk Category Breakdown</h3>
            <p className="text-xs text-slate-400 mt-0.5">Classification by hybrid scoring engine</p>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <strong className="text-xl font-bold font-mono text-white">
                {stats.total_transactions}
              </strong>
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                PAYMENTS
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <strong className="font-mono text-white">{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column: Recent Alerts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts Feed */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Recent Fraud Alerts</h3>
            </div>
            <button
              onClick={() => onSwitchView('alerts')}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
            >
              View all ({alerts.length}) &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {alerts.slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-200 block">{alert.type}</strong>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {alert.sender} &rarr; {alert.receiver}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-white">
                    ₹{alert.amount.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-rose-400 font-mono font-bold">
                    Risk {alert.risk_score}
                  </span>
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                No active fraud alerts detected.
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Live Transaction Stream</h3>
            </div>
            <button
              onClick={() => onSwitchView('transactions')}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
            >
              Explorer &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {transactions.slice(0, 5).map(txn => {
              const isHigh = txn.status === 'HIGH RISK';
              const isReview = txn.status === 'REVIEW';

              return (
                <div
                  key={txn.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="font-mono">
                    <div className="text-slate-200 font-bold flex items-center gap-1.5">
                      <span>{txn.sender}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span>{txn.receiver}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{txn.id} · {txn.prediction_latency_ms}ms</span>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-white">
                      ₹{txn.amount.toLocaleString('en-IN')}
                    </div>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        isHigh
                          ? 'bg-rose-500/20 text-rose-400'
                          : isReview
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {txn.status} ({txn.risk_score})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
