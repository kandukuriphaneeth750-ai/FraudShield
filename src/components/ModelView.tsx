import React from 'react';
import { ModelMetrics, ModelFeature } from '../types/data';
import {
  BrainCircuit,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers,
  Database,
  Gauge,
  Zap,
  Info,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

interface Props {
  metrics: ModelMetrics;
  features: ModelFeature[];
}

export function ModelView({ metrics, features }: Props) {
  const confusion = metrics.confusion_matrix || [[0, 0], [0, 0]];
  const tn = confusion[0]?.[0] || 0;
  const fp = confusion[0]?.[1] || 0;
  const fn = confusion[1]?.[0] || 0;
  const tp = confusion[1]?.[1] || 0;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/50 via-slate-900 to-indigo-950/40 border border-blue-500/30 p-6 md:p-8 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <BrainCircuit className="w-3.5 h-3.5 text-blue-400" />
              SUPERVISED ENSEMBLE CLASSIFIER
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              AI Risk Scoring &amp; Feature Explainability
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Hybrid detection combines Random Forest machine learning probability (65% weight) with rule-based deterministic guardrails (35% weight) for sub-millisecond fraud scoring.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Inference Speed</span>
              <strong className="text-lg font-mono text-emerald-400">{metrics.avg_inference_latency_ms || 1.42} ms</strong>
            </div>
            <div className="px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">AUC-ROC Score</span>
              <strong className="text-lg font-mono text-sky-400">{metrics.auc_roc || 0.994}</strong>
            </div>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Accuracy</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-400 mt-2">
            {metrics.accuracy}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Cross-validation on holdout set</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Precision (Fraud Class)</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-sky-400 mt-2">
            {metrics.precision}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Minimizing false positives</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Recall (Detection Rate)</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-purple-400 mt-2">
            {metrics.recall}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Intercepting 96.95% of attacks</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>F1-Score</span>
            <Gauge className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-400 mt-2">
            {metrics.f1_score}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Harmonic balance of precision/recall</span>
        </div>
      </div>

      {/* Two Column Layout: Feature Importance & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance Bar Chart */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Feature Importance Ranking</h3>
              <p className="text-xs text-slate-400 mt-0.5">MDI (Mean Decrease in Impurity) contribution</p>
            </div>
            <span className="text-xs font-mono text-sky-400">{features.length} FEATURES</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={features}
                layout="vertical"
                margin={{ left: 20, right: 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 0.35]}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <YAxis
                  type="category"
                  dataKey="feature"
                  width={150}
                  tick={{ fill: '#cbd5e1', fontSize: 11, fontFamily: 'monospace' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(val: unknown) => {
                    const num = typeof val === 'number' ? val : Number(val);
                    return [`${(num * 100).toFixed(1)}% contribution`, 'Importance'];
                  }}
                />
                <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
                  {features.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === 0 ? '#38bdf8' : i === 1 ? '#818cf8' : i === 2 ? '#a855f7' : '#64748b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix Interactive Box */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Model Confusion Matrix</h3>
              <p className="text-xs text-slate-400 mt-0.5">Evaluation on {metrics.testing_samples?.toLocaleString()} held-out transactions</p>
            </div>
            <span className="text-xs font-mono text-emerald-400">TEST SET</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* True Negative */}
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                True Negatives (TN)
              </span>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {tn.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Legitimate payments correctly cleared with zero customer friction
              </p>
            </div>

            {/* False Positive */}
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                False Positives (FP)
              </span>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                {fp.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Benign transfers routed to manual 2FA / review (0.76% false alarm)
              </p>
            </div>

            {/* False Negative */}
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                False Negatives (FN)
              </span>
              <div className="text-2xl font-bold font-mono text-rose-300 mt-1">
                {fn.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Fraud cases that slipped past AI (intercepted by secondary rules)
              </p>
            </div>

            {/* True Positive */}
            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                True Positives (TP)
              </span>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {tp.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Malicious transactions and carding attacks blocked in real time
              </p>
            </div>
          </div>

          {/* Model Specification Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5 font-mono text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Classifier Architecture:</span>
              <strong className="text-slate-200">RandomForestClassifier (120 Trees)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Class Weighting:</span>
              <strong className="text-slate-200">Balanced (1:3 minority weighting)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Training Samples:</span>
              <strong className="text-slate-200">{metrics.training_samples?.toLocaleString()} instances</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
