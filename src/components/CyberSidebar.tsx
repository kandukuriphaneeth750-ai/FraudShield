import React from 'react';
import { ViewMode } from '../types/data';
import {
  LayoutDashboard,
  Activity,
  ShieldAlert,
  Network,
  GitBranch,
  Users,
  BrainCircuit,
  Gauge,
  Radio,
  Lock,
  X
} from 'lucide-react';
import { sound } from '../utils/audio';

interface Props {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  streamRunning: boolean;
  alertCount: number;
  muleRingCount: number;
  muleAccountCount: number;
  backendConnected: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function CyberSidebar({
  currentView,
  onViewChange,
  streamRunning,
  alertCount,
  muleRingCount,
  muleAccountCount,
  backendConnected,
  mobileOpen,
  onCloseMobile
}: Props) {
  const items: Array<{
    id: ViewMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaction Explorer', icon: Activity },
    { id: 'alerts', label: 'Fraud Alerts', icon: ShieldAlert, badge: alertCount, badgeColor: 'bg-rose-500' },
    { id: 'network', label: 'Network Graph', icon: Network },
    { id: 'mule_rings', label: 'Mule Ring Syndicates', icon: GitBranch, badge: muleRingCount, badgeColor: 'bg-purple-500' },
    { id: 'mule_accounts', label: 'Mule Accounts', icon: Users, badge: muleAccountCount, badgeColor: 'bg-indigo-500' },
    { id: 'model', label: 'AI Risk Model', icon: BrainCircuit },
    { id: 'monitoring', label: 'Drift & Fairness', icon: Gauge }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-950/95 border-r border-slate-800/80 p-4 flex flex-col justify-between backdrop-blur-2xl transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Mobile Close Button */}
          <div className="lg:hidden flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation</span>
            <button
              onClick={onCloseMobile}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            DETECTION SUITE
          </div>

          <nav className="space-y-1">
            {items.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.playClick();
                    onViewChange(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500/15 to-indigo-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white ${
                        item.badgeColor || 'bg-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Engine Telemetry Card */}
        <div className="space-y-3 pt-4 border-t border-slate-800/80">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                {backendConnected ? 'Engine Online' : 'Engine Offline'}
              </span>
              <span className="text-[10px] font-mono text-slate-500">v4.0</span>
            </div>

            <div className="text-[11px] text-slate-300 font-mono">
              Stream: <strong className={streamRunning ? 'text-emerald-400' : 'text-slate-400'}>
                {streamRunning ? 'Streaming Live' : 'Paused'}
              </strong>
            </div>

            <div className="text-[10px] text-slate-500">
              Random Forest + Cycle Graph Traversal
            </div>
          </div>

          <div className="px-2 text-[10px] text-slate-400 flex items-center justify-between">
            <span>FRAUDSHIELD AI</span>
            <span>HACKATHON BUILD</span>
          </div>
        </div>
      </aside>
    </>
  );
}
