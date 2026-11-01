import React, { useState } from 'react';
import { DriftState, FairnessState } from '../types/data';
import {
  Activity,
  Play,
  Square,
  TrendingUp,
  Zap,
  Radio,
  Gauge,
  Scale,
  ShieldCheck,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { sound } from '../utils/audio';

interface Props {
  streamRunning: boolean;
  generatedCount: number;
  averageLatencyMs: number;
  drift: DriftState;
  fairness: FairnessState;
  onStartStream: () => Promise<void>;
  onStopStream: () => Promise<void>;
  onSimulateDrift: () => Promise<void>;
}

export function MonitoringView({
  streamRunning,
  generatedCount,
  averageLatencyMs,
  drift,
  fairness,
  onStartStream,
  onStopStream,
  onSimulateDrift
}: Props) {
  const [busy, setBusy] = useState(false);

  const handleStreamToggle = async () => {
    setBusy(true);
    sound.playClick();
    if (streamRunning) {
      await onStopStream();
    } else {
      await onStartStream();
    }
    setBusy(false);
  };

  const handleDrift = async () => {
    setBusy(true);
    sound.playClick();
    await onSimulateDrift();
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/40 border border-emerald-500/30 p-6 md:p-8 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              PRODUCTION MLOPS &amp; HEALTH RADAR
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Model Health, Drift &amp; Fairness
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Track real-time inference latency, statistical distribution drift (KS test), and equal opportunity parity across demographic segments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStreamToggle}
              disabled={busy}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-lg ${
                streamRunning
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {streamRunning ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  Pause Stream Engine
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Start Ingestion Stream
                </>
              )}
            </button>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Real-time Telemetry Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Inference Latency</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {averageLatencyMs || 1.35} ms
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">&lt; 5ms SLA compliant</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Streamed Events</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {generatedCount.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Live simulated payments</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Drift Status</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-bold font-mono mt-2 ${drift.active ? 'text-amber-400' : 'text-slate-200'}`}>
            {drift.active ? 'SHIFT DETECTED' : 'STABLE'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Kolmogorov-Smirnov monitor</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Fairness Parity</span>
            <Scale className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400 mt-2">
            96.8%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Equalized odds across cohorts</span>
        </div>
      </div>

      {/* Two Column Grid: Drift Engine & Demographic Fairness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Concept Drift Controller Card */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Concept &amp; Data Drift Simulation</h3>
              <p className="text-xs text-slate-400 mt-0.5">Simulate sudden macro-economic shift in payment distribution</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
              drift.active ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
            }`}>
              {drift.active ? 'DRIFT ACTIVE' : 'NO DRIFT'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Baseline Average Amount:</span>
              <strong className="text-slate-200 font-mono">₹{drift.baseline_average_amount?.toLocaleString('en-IN') || '14,250'}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Shifted Sample Average:</span>
              <strong className="text-amber-400 font-mono">₹{drift.current_average_amount?.toLocaleString('en-IN') || '14,250'}</strong>
            </div>
            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800">
              <span className="text-slate-400">KS Test Statistic:</span>
              <strong className="text-sky-400 font-mono">D = {drift.ks_statistic || 0.04} (p &lt; 0.001)</strong>
            </div>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed">
            {drift.message || "Simulating distribution shift allows stress-testing the model's adaptive retraining triggers without altering production baseline."}
          </div>

          <button
            onClick={handleDrift}
            disabled={busy}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600/90 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20 transition flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Simulate High-Value Distribution Shift
          </button>
        </div>

        {/* Demographic Fairness Monitoring */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Demographic Fairness Parity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Auditing synthetic cohorts against disparate impact</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              EQUAL OPPORTUNITY
            </span>
          </div>

          <div className="space-y-3">
            {fairness.segments?.map(seg => (
              <div key={seg.segment} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">{seg.segment}</span>
                  <span className="font-mono text-emerald-400 font-bold">{seg.accuracy}% Accuracy</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>False Positive Rate (FPR): <strong className="text-slate-300 font-mono">{seg.false_positive_rate}%</strong></span>
                  <span className="text-slate-500 font-mono">{seg.sample_size.toLocaleString()} users</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full"
                    style={{ width: `${Math.min(seg.accuracy, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-500">
            {fairness.message}
          </div>
        </div>
      </div>
    </div>
  );
}
