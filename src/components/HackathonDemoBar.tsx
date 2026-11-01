import React from 'react';
import { Sparkles, Zap, GitBranch, Layers, TrendingUp, Volume2, VolumeX, ShieldAlert, Lock } from 'lucide-react';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface Props {
  onSimulateCarding: () => Promise<void>;
  onPlantMuleRing: () => Promise<void>;
  onPlantSmurfing: () => Promise<void>;
  onSimulateDrift: () => Promise<void>;
  onEmergencyFreeze: () => Promise<void>;
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

export function HackathonDemoBar({
  onSimulateCarding,
  onPlantMuleRing,
  onPlantSmurfing,
  onSimulateDrift,
  onEmergencyFreeze,
  audioEnabled,
  onToggleAudio
}: Props) {
  const triggerConfetti = () => {
    confetti({
      particleCount: 65,
      spread: 60,
      origin: { y: 0.2 },
      colors: ['#38bdf8', '#f43f5e', '#a855f7', '#10b981']
    });
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border-b border-indigo-500/20 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-[10px] tracking-wide">
          <Sparkles className="w-3 h-3 text-indigo-400 animate-spin" />
          HACKATHON JURY QUICK-ACTIONS
        </div>
        <span className="hidden md:inline text-slate-400 text-[11px]">
          1-Click Live Demonstration Scenarios for Evaluators:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Scenario 1: Carding Spike */}
        <button
          onClick={async () => {
            sound.playAlert();
            await onSimulateCarding();
          }}
          className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1.5 transition text-[11px]"
          title="Simulate high-risk transaction attack"
        >
          <Zap className="w-3.5 h-3.5 text-rose-400" />
          1. Carding Attack
        </button>

        {/* Scenario 2: Plant Mule Ring */}
        <button
          onClick={async () => {
            sound.playSuccess();
            triggerConfetti();
            await onPlantMuleRing();
          }}
          className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 font-semibold flex items-center gap-1.5 transition text-[11px]"
          title="Plant circular laundering ring"
        >
          <GitBranch className="w-3.5 h-3.5 text-purple-400" />
          2. Circular Mule Ring
        </button>

        {/* Scenario 3: Smurfing Funnel */}
        <button
          onClick={async () => {
            sound.playClick();
            await onPlantSmurfing();
          }}
          className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1.5 transition text-[11px]"
          title="Simulate structuring fan-in / fan-out smurfing"
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          3. Smurfing Funnel
        </button>

        {/* Scenario 4: Concept Drift */}
        <button
          onClick={async () => {
            sound.playClick();
            await onSimulateDrift();
          }}
          className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 font-semibold flex items-center gap-1.5 transition text-[11px]"
          title="Trigger distribution drift test"
        >
          <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
          4. Concept Drift
        </button>

        {/* Scenario 5: Emergency Freeze */}
        <button
          onClick={async () => {
            sound.playSuccess();
            triggerConfetti();
            await onEmergencyFreeze();
          }}
          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5 transition text-[11px]"
          title="Emergency Freeze All Mule Accounts"
        >
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          5. Freeze All Mules
        </button>

        {/* Audio Toggle */}
        <button
          onClick={onToggleAudio}
          className={`p-1.5 rounded-lg border transition ${
            audioEnabled
              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
              : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}
          title={audioEnabled ? "Cyber Audio Feedback: ON" : "Cyber Audio Feedback: OFF"}
        >
          {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
