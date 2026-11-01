import React from 'react';
import { ViewMode } from '../types/data';
import { Shield, Radio, Volume2, VolumeX, Moon, Sun, Play, Square } from 'lucide-react';
import { sound } from '../utils/audio';

interface Props {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  streamRunning: boolean;
  onToggleStream: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  alertCount: number;
}

export function CyberHeader({
  currentView,
  onViewChange,
  streamRunning,
  onToggleStream,
  darkMode,
  onToggleDarkMode,
  audioEnabled,
  onToggleAudio,
  alertCount
}: Props) {
  const navItems: Array<{ id: ViewMode; label: string; badge?: number }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'alerts', label: 'Alerts', badge: alertCount },
    { id: 'network', label: 'Network' },
    { id: 'mule_rings', label: 'Mule Rings' },
    { id: 'mule_accounts', label: 'Mule Accounts' },
    { id: 'model', label: 'AI Model' },
    { id: 'monitoring', label: 'Monitoring' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-slate-950/85 border-b border-slate-800/80 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between gap-8">
      {/* Zone 1: Brand Wordmark */}
      <div
        onClick={() => { sound.playClick(); onViewChange('overview'); }}
        className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform">
          <Shield className="w-5 h-5 fill-white/20" />
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight text-white block leading-none font-sans">
            FraudShield AI
          </span>
          <span className="text-[10px] tracking-wider text-slate-400 font-mono block mt-0.5">
            V4.0 FRAUD ENGINE
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links (Single Line, Crisp Text) */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-400 overflow-x-auto py-1">
        {navItems.map(item => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { sound.playClick(); onViewChange(item.id); }}
              className={`relative whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
                isActive
                  ? 'text-sky-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{item.label}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Actions (Stream Controller + Utility Toggles) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Stream Toggle CTA */}
        <button
          onClick={onToggleStream}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 whitespace-nowrap shrink-0 ${
            streamRunning
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
              : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-500/25'
          }`}
        >
          {streamRunning ? (
            <>
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>Streaming Live</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Stream</span>
            </>
          )}
        </button>

        {/* Audio Toggle */}
        <button
          onClick={onToggleAudio}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 border border-slate-800 transition"
          title={audioEnabled ? "Disable Telemetry Audio" : "Enable Telemetry Audio"}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 border border-slate-800 transition"
          title="Toggle Light / Dark Mode"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
        </button>
      </div>
    </header>
  );
}
