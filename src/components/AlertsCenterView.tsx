import React, { useState } from 'react';
import { FraudAlert } from '../types/data';
import { AlertTriangle, ShieldAlert, ArrowRight, CheckCircle2, Search, Filter, ShieldCheck } from 'lucide-react';
import { sound } from '../utils/audio';

interface Props {
  alerts: FraudAlert[];
  onSelectAccount?: (accountNumber: string) => void;
}

export function AlertsCenterView({ alerts, onSelectAccount }: Props) {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  const filtered = alerts.filter(a => {
    const text = [a.id, a.type, a.sender, a.receiver, ...(Array.isArray(a.reason) ? a.reason : [a.reason])].join(' ').toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const toggleAcknowledge = (id: string) => {
    sound.playClick();
    setAcknowledged(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Fraud Alert &amp; Incident Center</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {alerts.length} ALERTS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Prioritized real-time threat detection feed flagged by the hybrid scoring engine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Severity (&ge;85)</option>
            <option value="WARNING">Warning Severity (60-84)</option>
            <option value="ELEVATED">Elevated Review (35-59)</option>
          </select>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-3">
        {filtered.map(alert => {
          const isAck = acknowledged.has(alert.id);
          const isCritical = alert.severity === 'CRITICAL';
          const isWarning = alert.severity === 'WARNING';

          return (
            <div
              key={alert.id}
              className={`rounded-2xl p-5 border transition-all ${
                isAck
                  ? 'bg-slate-950/60 border-slate-800/60 opacity-60'
                  : isCritical
                  ? 'bg-slate-900/90 border-rose-500/40 hover:border-rose-500 shadow-lg'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : isWarning
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-white">{alert.type}</strong>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-400'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-sky-500/20 text-sky-400'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {alert.id} · Txn: {alert.transaction_id} · {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">Risk Score</span>
                    <strong className="font-mono text-base font-bold text-rose-400">
                      {alert.risk_score}/100
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">Amount</span>
                    <strong className="font-mono text-base font-bold text-white">
                      ₹{alert.amount.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Transfer Details & Reason */}
              <div className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 font-mono text-slate-300">
                  <button
                    onClick={() => onSelectAccount && onSelectAccount(alert.sender)}
                    className="hover:text-sky-400 transition"
                  >
                    {alert.sender}
                  </button>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <button
                    onClick={() => onSelectAccount && onSelectAccount(alert.receiver)}
                    className="hover:text-sky-400 transition"
                  >
                    {alert.receiver}
                  </button>
                </div>

                <div className="text-slate-400 flex-1 md:text-right">
                  <strong className="text-slate-300">Evidence: </strong>
                  {Array.isArray(alert.reason) ? alert.reason.join(', ') : alert.reason}
                </div>

                <button
                  onClick={() => toggleAcknowledge(alert.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                    isAck
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isAck ? 'Acknowledged' : 'Mark Reviewed'}
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No fraud alerts currently match your selection.
          </div>
        )}
      </div>
    </div>
  );
}
