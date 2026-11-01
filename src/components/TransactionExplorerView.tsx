import React, { useState } from 'react';
import { Transaction } from '../types/data';
import {
  Search,
  Filter,
  Zap,
  Download,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Clock,
  Eye,
  X,
  Cpu,
  Layers
} from 'lucide-react';
import { sound } from '../utils/audio';

interface Props {
  transactions: Transaction[];
  onGenerateTransaction: (highRisk?: boolean) => Promise<void>;
  onInspectTransaction?: (txn: Transaction) => void;
}

export function TransactionExplorerView({
  transactions,
  onGenerateTransaction,
  onInspectTransaction
}: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = transactions.filter(t => {
    const text = [t.id, t.sender, t.receiver, t.status, ...t.reasons].join(' ').toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
    sound.playClick();
    if (!filtered.length) return;
    const headers = ["ID", "Sender", "Receiver", "Amount", "RiskScore", "AIProbability", "RuleScore", "Status", "Reasons", "Timestamp"];
    const rows = filtered.map(t => [
      t.id,
      t.sender,
      t.receiver,
      t.amount,
      t.risk_score,
      t.ai_probability,
      t.rule_score,
      t.status,
      `"${t.reasons.join('; ').replace(/"/g, '""')}"`,
      t.timestamp
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fraudshield_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSimulate = async (highRisk: boolean) => {
    setBusy(true);
    if (highRisk) {
      sound.playAlert();
    } else {
      sound.playClick();
    }
    await onGenerateTransaction(highRisk);
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Panel */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Transaction Intelligence Feed</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspecting {filtered.length} of {transactions.length} synthetic payment telemetry records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSimulate(false)}
            disabled={busy}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            Inject Normal Txn
          </button>
          <button
            onClick={() => handleSimulate(true)}
            disabled={busy}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600/90 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Inject Fraud Attack
          </button>
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Transaction ID, Sender, Receiver, or Reason..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Risk Statuses</option>
            <option value="HIGH RISK">High Risk Only</option>
            <option value="REVIEW">Under Review Only</option>
            <option value="NORMAL">Normal Transactions</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">TRANSACTION ID</th>
                <th className="py-3.5 px-4">PAYMENT FLOW</th>
                <th className="py-3.5 px-4 text-right">AMOUNT</th>
                <th className="py-3.5 px-4">RISK SCORE</th>
                <th className="py-3.5 px-4">HYBRID BREAKDOWN</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.slice(0, 50).map(txn => {
                const isHigh = txn.status === 'HIGH RISK';
                const isReview = txn.status === 'REVIEW';

                return (
                  <tr
                    key={txn.id}
                    onClick={() => { setSelectedTxn(txn); sound.playClick(); }}
                    className="hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">
                      {txn.id}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <span>{txn.sender}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span>{txn.receiver}</span>
                        {txn.mule_ring && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            MULE
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      ₹{txn.amount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isHigh
                                ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                                : isReview
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${txn.risk_score}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-white text-[11px]">
                          {txn.risk_score}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-400 font-mono">
                      <span className="text-sky-400">AI: {txn.ai_probability}%</span>
                      <span className="mx-1 text-slate-600">·</span>
                      <span className="text-slate-300">Rule: {txn.rule_score}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isHigh
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isReview
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTxn(txn);
                          sound.playClick();
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No transactions found matching your filters.
          </div>
        )}
      </div>

      {/* Slide-Over Drawer for Selected Transaction */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-sky-400">
                    {selectedTxn.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedTxn.status === 'HIGH RISK'
                        ? 'bg-rose-500/20 text-rose-400'
                        : selectedTxn.status === 'REVIEW'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {selectedTxn.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Amount Banner */}
              <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Payment Amount
                  </span>
                  <div className="text-2xl font-bold font-mono text-white mt-1">
                    ₹{selectedTxn.amount.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Latency
                  </span>
                  <div className="text-sm font-mono text-emerald-400 mt-1">
                    {selectedTxn.prediction_latency_ms} ms
                  </div>
                </div>
              </div>

              {/* Sender -> Receiver Flow */}
              <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Directional Transfer
                </span>
                <div className="flex items-center justify-between font-mono text-sm font-bold">
                  <div className="text-slate-200">{selectedTxn.sender}</div>
                  <ArrowRight className="w-4 h-4 text-sky-400" />
                  <div className="text-slate-200">{selectedTxn.receiver}</div>
                </div>
              </div>

              {/* Hybrid Model Breakdown */}
              <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Scoring Model Breakdown
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Random Forest AI Probability:</span>
                  <strong className="text-sky-400 font-mono">{selectedTxn.ai_probability}%</strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Rule-Based Deterministic Score:</span>
                  <strong className="text-amber-400 font-mono">{selectedTxn.rule_score} / 100</strong>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800">
                  <span className="text-slate-200 font-semibold">Blended Hybrid Risk Score:</span>
                  <strong className="text-rose-400 font-mono text-sm">{selectedTxn.risk_score} / 100</strong>
                </div>
              </div>

              {/* Forensic Anomaly Reasons */}
              <div className="mt-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Triggered Indicators &amp; Explanations
                </span>
                <div className="space-y-1.5">
                  {selectedTxn.reasons.map((r, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTxn(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
