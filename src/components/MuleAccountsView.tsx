import React, { useState } from 'react';
import { MuleAccount, MuleRing } from '../types/data';
import {
  ShieldAlert,
  Lock,
  Unlock,
  AlertTriangle,
  Zap,
  Users,
  Search,
  Filter,
  CheckCircle2,
  GitBranch,
  Building2,
  GraduationCap,
  Coins,
  History,
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

interface Props {
  muleAccounts: MuleAccount[];
  muleRings: MuleRing[];
  onToggleFreeze: (accountNumber: string) => Promise<void>;
  onFreezeAll: () => Promise<void>;
  onPlantMuleRing: () => Promise<void>;
  onPlantSmurfing: () => Promise<void>;
  onSelectAccount?: (accountNumber: string) => void;
}

export function MuleAccountsView({
  muleAccounts,
  muleRings,
  onToggleFreeze,
  onFreezeAll,
  onPlantMuleRing,
  onPlantSmurfing,
  onSelectAccount
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredAccounts = muleAccounts.filter(acc => {
    const matchesSearch =
      acc.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.holder_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.kyc_risk_flags.some(f => f.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || acc.account_type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || acc.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalIntercepted = muleAccounts.reduce((sum, a) => sum + a.total_inbound, 0);
  const frozenCount = muleAccounts.filter(a => a.status === 'FROZEN').length;
  const criticalCount = muleAccounts.filter(a => a.risk_rating >= 95).length;

  const handleFreezeToggle = async (accNum: string) => {
    setActionLoading(accNum);
    sound.playClick();
    await onToggleFreeze(accNum);
    setActionLoading(null);
  };

  const handleEmergencyFreezeAll = async () => {
    sound.playSuccess();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#38bdf8', '#10b981']
    });
    await onFreezeAll();
  };

  const getAccountTypeIcon = (type: MuleAccount['account_type']) => {
    switch (type) {
      case 'STUDENT_PROXY':
        return <GraduationCap className="w-4 h-4 text-sky-400" />;
      case 'SHELL_CORP':
        return <Building2 className="w-4 h-4 text-purple-400" />;
      case 'CRYPTO_CONDUIT':
        return <Coins className="w-4 h-4 text-amber-400" />;
      case 'DORMANT_TAKEOVER':
        return <History className="w-4 h-4 text-rose-400" />;
      default:
        return <GitBranch className="w-4 h-4 text-indigo-400" />;
    }
  };

  const formatAccountType = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner with Hackathon Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900 border border-rose-500/30 p-6 md:p-8 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              FINANCIAL INTELLIGENCE UNIT (FIU) SYNDICATE DIRECTORY
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Identified Mule Account Registry
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time monitoring of synthetic digital payment mules, student proxy conduits, hijacked dormant bank accounts, and structuring funnel nodes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleEmergencyFreezeAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Lock className="w-4 h-4" />
              Emergency Freeze All ({muleAccounts.length})
            </button>
            <button
              onClick={() => { sound.playClick(); onPlantMuleRing(); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <GitBranch className="w-4 h-4 text-indigo-400" />
              Plant Circular Loop
            </button>
            <button
              onClick={() => { sound.playClick(); onPlantSmurfing(); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              Plant Smurfing Funnel
            </button>
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute -right-10 -bottom-10 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tracked Mule Accounts</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {muleAccounts.length}
          </div>
          <div className="text-[11px] text-sky-400/90 mt-1 flex items-center gap-1">
            <span>Active surveillance across UPI nodes</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Intercepted Inflow</span>
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-2">
            ₹{(totalIntercepted / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {muleRings.length} detected syndicates
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Critical Severity (&ge;95)</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-2">
            {criticalCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            High-confidence AML violation
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Accounts Frozen</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {frozenCount} / {muleAccounts.length}
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-1">
            {Math.round((frozenCount / Math.max(muleAccounts.length, 1)) * 100)}% risk mitigated
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Account Number, Holder Name, or KYC Risk Flag..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Mule Archetypes</option>
            <option value="STUDENT_PROXY">Student Proxy</option>
            <option value="SHELL_CORP">Shell Corporation</option>
            <option value="CRYPTO_CONDUIT">Crypto Conduit</option>
            <option value="DORMANT_TAKEOVER">Dormant Hijack</option>
            <option value="CIRCULAR_MEMBER">Circular Loop Node</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
            <option value="FROZEN">Frozen</option>
            <option value="ACTIVE">Active</option>
          </select>
        </div>
      </div>

      {/* Mule Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.map(account => {
          const isFrozen = account.status === 'FROZEN';

          return (
            <div
              key={account.id}
              className={`relative rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                isFrozen
                  ? 'bg-slate-950/80 border-slate-800/80 opacity-80'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:shadow-xl'
              }`}
            >
              <div>
                {/* Header: Type & Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
                      {getAccountTypeIcon(account.account_type)}
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                        {formatAccountType(account.account_type)}
                      </div>
                      <div className="font-mono text-sm font-bold text-white">
                        {account.account_number}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isFrozen
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : account.status === 'UNDER_INVESTIGATION'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isFrozen ? <Lock className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                    {account.status}
                  </span>
                </div>

                {/* Holder Name & Ring ID */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-100">
                    {account.holder_name}
                  </h3>
                  {account.ring_id && (
                    <div className="text-xs text-indigo-400 flex items-center gap-1 mt-0.5 font-mono">
                      <GitBranch className="w-3 h-3" />
                      {account.ring_id}
                    </div>
                  )}
                </div>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/70 mb-4 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">Risk Rating</span>
                    <span className={`font-bold ${account.risk_rating >= 95 ? 'text-rose-400' : 'text-amber-400'}`}>
                      {account.risk_rating}/100
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">Velocity Burst</span>
                    <span className="text-slate-200">
                      {account.velocity_txns_per_hr} txns/hr
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">Total Inflow</span>
                    <span className="text-slate-200">
                      ₹{account.total_inbound.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-sans">Account Age</span>
                    <span className="text-slate-200">
                      {account.account_age_days} days
                    </span>
                  </div>
                </div>

                {/* KYC Flags */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Forensic Indicators
                  </span>
                  {account.kyc_risk_flags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-snug"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => handleFreezeToggle(account.account_number)}
                  disabled={actionLoading === account.account_number}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isFrozen
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-rose-600/90 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20'
                  }`}
                >
                  {isFrozen ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      Unfreeze Account
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      Freeze Mule Funds
                    </>
                  )}
                </button>

                {onSelectAccount && (
                  <button
                    onClick={() => { sound.playClick(); onSelectAccount(account.account_number); }}
                    className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition"
                    title="Trace on Graph"
                  >
                    <GitBranch className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredAccounts.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
          <ShieldAlert className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-medium">No mule accounts matched the filter criteria.</p>
        </div>
      )}
    </div>
  );
}
