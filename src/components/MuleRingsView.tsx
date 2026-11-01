import React from 'react';
import { MuleRing } from '../types/data';
import { GitBranch, ShieldAlert, ArrowRight, Zap, RefreshCw, AlertTriangle, Layers, TrendingUp, Users } from 'lucide-react';
import { sound } from '../utils/audio';

interface Props {
  muleRings: MuleRing[];
  onPlantMuleRing: () => Promise<void>;
  onPlantSmurfing: () => Promise<void>;
  onSelectAccount?: (accountNumber: string) => void;
}

export function MuleRingsView({
  muleRings,
  onPlantMuleRing,
  onPlantSmurfing,
  onSelectAccount
}: Props) {
  const totalLaundered = muleRings.reduce((sum, r) => sum + r.total_amount, 0);
  const totalAccounts = muleRings.reduce((sum, r) => sum + r.account_count, 0);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-950 border border-purple-500/30 p-6 md:p-8 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <GitBranch className="w-3.5 h-3.5 text-purple-400" />
              DIRECTED GRAPH CYCLE INTELLIGENCE
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Mule Ring & Syndicate Detection
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Automated graph topology analysis identifies circular transfer loops, smurfing structures, and funnel laundering networks across digital payment rails.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => { sound.playClick(); onPlantMuleRing(); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02]"
            >
              <Zap className="w-4 h-4" />
              Run Circular Mule Demo
            </button>
            <button
              onClick={() => { sound.playClick(); onPlantSmurfing(); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              Run Smurfing Funnel Demo
            </button>
          </div>
        </div>

        {/* Background glow */}
        <div className="absolute -right-12 -top-12 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur">
          <span className="text-xs text-slate-400 block">Detected Mule Rings</span>
          <div className="text-2xl font-bold font-mono text-purple-400 mt-2">
            {muleRings.length} Syndicates
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Active topological cycles</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur">
          <span className="text-xs text-slate-400 block">Total Ring Volume</span>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-2">
            ₹{totalLaundered.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Cumulative laundering value</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur">
          <span className="text-xs text-slate-400 block">Involved Accounts</span>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-2">
            {totalAccounts} Accounts
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Compromised / proxy nodes</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur">
          <span className="text-xs text-slate-400 block">Detection Latency</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            &lt; 2.4 ms
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Real-time graph traversal</span>
        </div>
      </div>

      {/* Rings List */}
      <div className="space-y-4">
        {muleRings.map((ring, idx) => (
          <div
            key={ring.id}
            className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-5 hover:border-purple-500/40 transition shadow-xl"
          >
            {/* Ring Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {ring.name || `Syndicate Network #${idx + 1}`}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {ring.risk_level} SEVERITY
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300">
                      {ring.pattern_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    ID: {ring.id} · Detected {new Date(ring.detected_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Accounts</span>
                  <strong className="text-white">{ring.account_count}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Transfers</span>
                  <strong className="text-white">{ring.transaction_count}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-sans">Total Value</span>
                  <strong className="text-rose-400">₹{ring.total_amount.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>

            {/* Explanation Alert */}
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-white">Detection Evidence: </strong>
                {ring.reason}
              </div>
            </div>

            {/* Step-by-Step Laundering Hops */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                Laundering Flow Stages
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {ring.hops.map((hop, hopIdx) => (
                  <div
                    key={hopIdx}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        Hop {hopIdx + 1}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          hop.stage === 'Placement'
                            ? 'bg-sky-500/20 text-sky-400'
                            : hop.stage === 'Integration'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {hop.stage}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-mono font-bold text-slate-200">
                      <button
                        onClick={() => onSelectAccount && onSelectAccount(hop.from)}
                        className="hover:text-sky-400 transition"
                      >
                        {hop.from}
                      </button>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <button
                        onClick={() => onSelectAccount && onSelectAccount(hop.to)}
                        className="hover:text-sky-400 transition"
                      >
                        {hop.to}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/80">
                      <span className="text-rose-400 font-mono font-bold">
                        ₹{hop.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-slate-500">
                        +{hop.delay_seconds}s interval
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {muleRings.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
            <GitBranch className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-medium">No circular mule rings detected currently.</p>
            <button
              onClick={onPlantMuleRing}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition"
            >
              Generate Synthetic Mule Ring Demo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
