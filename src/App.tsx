import React, { useState, useEffect, useCallback } from 'react';
import {
  ViewMode,
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
} from './types/data';
import { fraudApi } from './utils/api';
import { sound } from './utils/audio';

// Components
import { CyberHeader } from './components/CyberHeader';
import { CyberSidebar } from './components/CyberSidebar';
import { HackathonDemoBar } from './components/HackathonDemoBar';
import { OverviewView } from './components/OverviewView';
import { TransactionExplorerView } from './components/TransactionExplorerView';
import { AlertsCenterView } from './components/AlertsCenterView';
import { NetworkGraphCanvas } from './components/NetworkGraphCanvas';
import { MuleRingsView } from './components/MuleRingsView';
import { MuleAccountsView } from './components/MuleAccountsView';
import { ModelView } from './components/ModelView';
import { MonitoringView } from './components/MonitoringView';

import {
  CheckCircle2,
  Info,
  ShieldAlert,
  Menu,
  X,
  Lock,
  Unlock,
  GitBranch,
  Building2,
  GraduationCap,
  Coins,
  History
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [mobileSidebar, setMobileSidebar] = useState<boolean>(false);

  // Active View
  const [currentView, setCurrentView] = useState<ViewMode>('overview');

  // Backend state
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [stats, setStats] = useState<SystemStats>({
    total_transactions: 0,
    high_risk: 0,
    review: 0,
    normal: 0,
    total_amount: 0,
    average_latency_ms: 1.35,
    alerts: 0,
    stream_running: false,
    mule_rings: 0,
    mule_accounts_count: 0,
    frozen_accounts_count: 0
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [network, setNetwork] = useState<NetworkGraphData>({
    nodes: [],
    edges: [],
    node_count: 0,
    edge_count: 0,
    mule_rings: []
  });
  const [muleRings, setMuleRings] = useState<MuleRing[]>([]);
  const [muleAccounts, setMuleAccounts] = useState<MuleAccount[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics>({
    accuracy: 98.74,
    precision: 97.82,
    recall: 96.95,
    f1_score: 97.38,
    confusion_matrix: [[8840, 68], [83, 3009]],
    training_samples: 24000,
    testing_samples: 6000,
    fraud_samples: 3092,
    normal_samples: 8908,
    data_type: 'PAYMENT_GRAPH_SYNTHETIC_ENSEMBLE',
    model_type: 'Random Forest Classifier (120 Trees)',
    auc_roc: 0.994,
    avg_inference_latency_ms: 1.42
  });
  const [modelFeatures, setModelFeatures] = useState<ModelFeature[]>([]);
  const [drift, setDrift] = useState<DriftState>({
    active: false,
    message: 'Baseline payment distribution within normal boundaries',
    baseline_average_amount: 14250,
    current_average_amount: 14250,
    drift_detected: false,
    ks_statistic: 0.04
  });
  const [fairness, setFairness] = useState<FairnessState>({
    status: 'ACTIVE_EVALUATION',
    message: 'Monitored across 4 demographic segments for equal opportunity parity',
    segments: []
  });
  const [streamRunning, setStreamRunning] = useState<boolean>(false);
  const [generatedCount, setGeneratedCount] = useState<number>(0);

  // Time-series history for chart
  const [history, setHistory] = useState<Array<{ time: string; count: number; highRisk: number }>>([]);

  // Selected Account Dossier Drawer
  const [selectedAccountModal, setSelectedAccountModal] = useState<MuleAccount | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Sync sound engine
  useEffect(() => {
    sound.enabled = audioEnabled;
  }, [audioEnabled]);

  // Load all data from API
  const loadData = useCallback(async () => {
    try {
      const [
        statsData,
        txnsData,
        alertsData,
        networkData,
        ringsData,
        mulesData,
        metricsData,
        featuresData,
        driftData,
        fairnessData,
        streamStatus
      ] = await Promise.all([
        fraudApi.getStats(),
        fraudApi.getTransactions({ limit: 150 }),
        fraudApi.getAlerts(60),
        fraudApi.getNetwork(),
        fraudApi.getMuleRings(),
        fraudApi.getMuleAccounts(),
        fraudApi.getModelMetrics(),
        fraudApi.getModelFeatures(),
        fraudApi.getDrift(),
        fraudApi.getFairness(),
        fraudApi.getStreamStatus()
      ]);

      setStats(statsData);
      setTransactions(txnsData.transactions || []);
      setAlerts(alertsData.alerts || []);
      setNetwork(networkData);
      setMuleRings(ringsData.rings || []);
      setMuleAccounts(mulesData.accounts || []);
      setModelMetrics(metricsData);
      setModelFeatures(featuresData || []);
      setDrift(driftData);
      setFairness(fairnessData);
      setStreamRunning(streamStatus.running);
      setGeneratedCount(streamStatus.generated_count || 0);
      setBackendConnected(true);

      // Append time-series point
      setHistory(prev => {
        const point = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          count: statsData.total_transactions,
          highRisk: statsData.high_risk
        };
        return [...prev, point].slice(-24);
      });
    } catch (err) {
      console.warn("Backend poll issue, retrying...", err);
      setBackendConnected(false);
    }
  }, []);

  // Poll loop every 3.5 seconds
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3500);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handlers
  const handleToggleStream = async () => {
    sound.playClick();
    if (streamRunning) {
      await fraudApi.stopStream();
      setStreamRunning(false);
      showToast("Live transaction stream paused", "info");
    } else {
      await fraudApi.startStream();
      setStreamRunning(true);
      showToast("Live transaction stream started", "success");
    }
    await loadData();
  };

  const handleSimulateTransaction = async (highRisk = false) => {
    try {
      const txn = await fraudApi.simulateTransaction(highRisk);
      if (highRisk) {
        sound.playAlert();
        showToast(`🚨 High-risk transaction ${txn.id} intercepted! (Risk: ${txn.risk_score})`, 'warning');
      } else {
        sound.playClick();
        showToast(`Payment ${txn.id} cleared (${txn.status})`, 'success');
      }
      await loadData();
    } catch {
      showToast("Failed to simulate transaction", "warning");
    }
  };

  const handlePlantMuleRing = async () => {
    sound.playSuccess();
    try {
      const res = await fraudApi.plantMuleRingDemo();
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#a855f7', '#f43f5e', '#38bdf8']
      });
      showToast(`🎯 Planted 4-node circular mule ring demo! (4 transfers created)`, 'success');
      await loadData();
      setCurrentView('mule_rings');
    } catch {
      showToast("Error generating mule ring demo", "warning");
    }
  };

  const handlePlantSmurfing = async () => {
    sound.playClick();
    try {
      const res = await fraudApi.plantSmurfingDemo();
      showToast(`🌪️ Smurfing / structuring funnel demo planted! (10 micro-transfers)`, 'info');
      await loadData();
      setCurrentView('mule_accounts');
    } catch {
      showToast("Error generating smurfing demo", "warning");
    }
  };

  const handleSimulateDrift = async () => {
    sound.playClick();
    try {
      await fraudApi.simulateDrift();
      showToast("📈 Concept drift generated: surge in high-value payments", 'info');
      await loadData();
      setCurrentView('monitoring');
    } catch {
      showToast("Drift simulation failed", "warning");
    }
  };

  const handleToggleFreezeAccount = async (accountNumber: string) => {
    sound.playClick();
    try {
      const res = await fraudApi.toggleFreezeAccount(accountNumber);
      showToast(res.message, res.account.status === 'FROZEN' ? 'warning' : 'success');
      await loadData();
      if (selectedAccountModal?.account_number === accountNumber) {
        setSelectedAccountModal(res.account);
      }
    } catch {
      showToast("Could not update account status", "warning");
    }
  };

  const handleFreezeAll = async () => {
    sound.playSuccess();
    try {
      const res = await fraudApi.freezeAllMuleAccounts();
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#10b981', '#38bdf8', '#f43f5e']
      });
      showToast(`🛡️ Emergency lock engaged: ${res.frozen_count} mule accounts frozen!`, 'success');
      await loadData();
    } catch {
      showToast("Error executing emergency freeze", "warning");
    }
  };

  const handleSelectAccount = (accountNumber: string) => {
    const found = muleAccounts.find(a => a.account_number === accountNumber);
    if (found) {
      setSelectedAccountModal(found);
    } else {
      // Create provisional inspection view
      setSelectedAccountModal({
        id: accountNumber,
        account_number: accountNumber,
        holder_name: `Account Node ${accountNumber}`,
        account_type: 'CIRCULAR_MEMBER',
        risk_rating: 84,
        total_inbound: 96000,
        total_outbound: 94000,
        velocity_txns_per_hr: 6.4,
        account_age_days: 42,
        status: 'UNDER_INVESTIGATION',
        kyc_risk_flags: ['Transacted with flagged mule network node', 'Rapid passthrough interval'],
        first_seen: new Date().toISOString(),
        last_activity: new Date().toISOString()
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Header */}
      <CyberHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        streamRunning={streamRunning}
        onToggleStream={handleToggleStream}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(!audioEnabled)}
        alertCount={alerts.length}
      />

      {/* Hackathon Quick-Actions Presentation Strip */}
      <HackathonDemoBar
        onSimulateCarding={() => handleSimulateTransaction(true)}
        onPlantMuleRing={handlePlantMuleRing}
        onPlantSmurfing={handlePlantSmurfing}
        onSimulateDrift={handleSimulateDrift}
        onEmergencyFreeze={handleFreezeAll}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(!audioEnabled)}
      />

      {/* Body: Sidebar + Main Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <CyberSidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          streamRunning={streamRunning}
          alertCount={alerts.length}
          muleRingCount={muleRings.length}
          muleAccountCount={muleAccounts.length}
          backendConnected={backendConnected}
          mobileOpen={mobileSidebar}
          onCloseMobile={() => setMobileSidebar(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 lg:ml-64 p-4 md:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {/* Mobile Menu Trigger */}
          <div className="lg:hidden flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <button
              onClick={() => setMobileSidebar(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2 text-xs font-semibold"
            >
              <Menu className="w-4 h-4 text-sky-400" />
              <span>Menu</span>
            </button>
            <span className="text-xs font-mono text-slate-400">
              AegisPay FraudShield V4.0
            </span>
          </div>

          {/* Views */}
          {currentView === 'overview' && (
            <OverviewView
              stats={stats}
              transactions={transactions}
              alerts={alerts}
              muleRings={muleRings}
              muleAccounts={muleAccounts}
              streamRunning={streamRunning}
              history={history}
              onStartStream={handleToggleStream}
              onStopStream={handleToggleStream}
              onPlantMuleRing={handlePlantMuleRing}
              onSwitchView={setCurrentView}
              onSelectAccount={handleSelectAccount}
            />
          )}

          {currentView === 'transactions' && (
            <TransactionExplorerView
              transactions={transactions}
              onGenerateTransaction={handleSimulateTransaction}
            />
          )}

          {currentView === 'alerts' && (
            <AlertsCenterView
              alerts={alerts}
              onSelectAccount={handleSelectAccount}
            />
          )}

          {currentView === 'network' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 mb-1">
                    <GitBranch className="w-3.5 h-3.5 text-sky-400" />
                    LIVE TOPOLOGICAL TRANSACTION GRAPH
                  </div>
                  <h2 className="text-xl font-bold text-white">Interactive Payment Flow Network</h2>
                  <p className="text-xs text-slate-400">
                    Directed transfer graph tracing sender-receiver relationships, money laundering loops, and smurfing conduits.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePlantMuleRing}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    Plant Circular Loop
                  </button>
                </div>
              </div>

              <NetworkGraphCanvas
                nodes={network.nodes}
                edges={network.edges}
                muleRings={muleRings}
                onSelectAccount={handleSelectAccount}
              />
            </div>
          )}

          {currentView === 'mule_rings' && (
            <MuleRingsView
              muleRings={muleRings}
              onPlantMuleRing={handlePlantMuleRing}
              onPlantSmurfing={handlePlantSmurfing}
              onSelectAccount={handleSelectAccount}
            />
          )}

          {currentView === 'mule_accounts' && (
            <MuleAccountsView
              muleAccounts={muleAccounts}
              muleRings={muleRings}
              onToggleFreeze={handleToggleFreezeAccount}
              onFreezeAll={handleFreezeAll}
              onPlantMuleRing={handlePlantMuleRing}
              onPlantSmurfing={handlePlantSmurfing}
              onSelectAccount={handleSelectAccount}
            />
          )}

          {currentView === 'model' && (
            <ModelView
              metrics={modelMetrics}
              features={modelFeatures}
            />
          )}

          {currentView === 'monitoring' && (
            <MonitoringView
              streamRunning={streamRunning}
              generatedCount={generatedCount}
              averageLatencyMs={stats.average_latency_ms}
              drift={drift}
              fairness={fairness}
              onStartStream={handleToggleStream}
              onStopStream={handleToggleStream}
              onSimulateDrift={handleSimulateDrift}
            />
          )}
        </main>
      </div>

      {/* Account Dossier Modal / Drawer */}
      {selectedAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-white">
                      {selectedAccountModal.account_number}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedAccountModal.status === 'FROZEN'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {selectedAccountModal.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">{selectedAccountModal.holder_name}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedAccountModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-sans">Risk Rating</span>
                <span className="text-rose-400 font-bold text-base">{selectedAccountModal.risk_rating} / 100</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-sans">Velocity Burst</span>
                <span className="text-slate-200 font-bold text-base">{selectedAccountModal.velocity_txns_per_hr} txns/hr</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-sans">Total Inflow</span>
                <span className="text-slate-200 font-bold">₹{selectedAccountModal.total_inbound.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-sans">Account Age</span>
                <span className="text-slate-200 font-bold">{selectedAccountModal.account_age_days} days</span>
              </div>
            </div>

            {/* KYC Flags */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Forensic Suspicion Indicators
              </span>
              <div className="space-y-1.5">
                {selectedAccountModal.kyc_risk_flags.map((flag, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300">
                    • {flag}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
              <button
                onClick={() => handleToggleFreezeAccount(selectedAccountModal.account_number)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  selectedAccountModal.status === 'FROZEN'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                }`}
              >
                {selectedAccountModal.status === 'FROZEN' ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    Unfreeze Account Funds
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Freeze Account Funds
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setSelectedAccountModal(null);
                  setCurrentView('network');
                }}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                Trace on Graph
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs font-semibold text-white animate-in slide-in-from-bottom-3 duration-200 backdrop-blur-md">
          {toast.type === 'warning' ? (
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
