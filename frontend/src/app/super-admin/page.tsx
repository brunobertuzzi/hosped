'use client';

import React, { useMemo } from 'react';
import { TrendingUp, DollarSign, Users, Building2, CreditCard, Activity, AlertTriangle, CheckCircle2, Zap, BarChart3, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';

interface MrrMetrics {
  mrr: {
    current: number;
    lastMonth: number;
    growth: number;
    history: Array<{ month: string; mrr: number }>;
    byPlan: Record<string, number>;
  };
  arr: number;
  arpu: number;
  clients: {
    active: number;
    newThisMonth: number;
    churnedThisMonth: number;
  };
  churn: {
    rate: number;
    lostMRR: number;
  };
  plans: {
    distribution: Record<string, number>;
  };
  addons: {
    active: number;
    revenue: number;
  };
}

const planLabels: Record<string, string> = {
  STARTUP: 'Startup',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
};

const planColors: Record<string, string> = {
  STARTUP: 'from-indigo-500 to-indigo-600',
  PRO: 'from-violet-500 to-violet-600',
  ENTERPRISE: 'from-amber-500 to-amber-600',
};

const planBadgeColors: Record<string, string> = {
  STARTUP: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  PRO: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  ENTERPRISE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function MrrDashboard() {
  const [metrics, setMetrics] = React.useState<MrrMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchMrrMetrics();
  }, []);

  const fetchMrrMetrics = async () => {
    try {
      const data = await api.getMrrMetrics();
      setMetrics(data);
    } catch (e) {
      console.error('Falha ao buscar métricas MRR', e);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!metrics) return { months: [], revenues: [], heights: [] };
    const revenues = metrics.mrr.history.map(h => h.mrr);
    const maxRev = Math.max(...revenues, 1);
    const heights = revenues.map(r => (r / maxRev) * 100);
    return { months: metrics.mrr.history.map(h => h.month), revenues, heights };
  }, [metrics]);

  const totalByPlan = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics.mrr.byPlan).map(([plan, value]) => ({
      plan,
      label: planLabels[plan] || plan,
      value,
      color: planColors[plan] || 'from-gray-500 to-gray-600',
    }));
  }, [metrics]);

  const clientDistribution = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics.plans.distribution).map(([plan, count]) => ({
      plan,
      label: planLabels[plan] || plan,
      count,
    }));
  }, [metrics]);

  const totalClientsDistributed = useMemo(() => {
    if (!metrics) return 0;
    return Object.values(metrics.plans.distribution).reduce((a, b) => a + b, 0);
  }, [metrics]);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-white/40 text-sm font-medium">
          <Activity className="w-4 h-4 animate-pulse text-indigo-400" />
          Carregando métricas financeiras...
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-indigo-400" />
            MRR & Financials
            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Live
            </span>
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">
            Acompanhe receita recorrente, ARR, churn e distribuição de planos.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Current MRR */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border-t-2 border-t-indigo-500 border border-white/5 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between mb-4 text-white/40">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">MRR Atual</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">
              <span className="text-white/30 text-xl mr-1">R$</span>
              {metrics?.mrr.current.toFixed(2) ?? '0.00'}
            </span>
            <div className="text-[11px] text-white/30 mt-2 font-medium flex items-center gap-1.5">
              {(metrics?.mrr.growth ?? 0) >= 0 ? (
                <span className="text-emerald-400/90 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +{metrics?.mrr.growth.toFixed(1) ?? 0}%
                </span>
              ) : (
                <span className="text-red-400/90 flex items-center bg-red-500/10 px-1.5 py-0.5 rounded font-bold">
                  <TrendingUp className="w-3 h-3 mr-0.5 rotate-180" /> {metrics?.mrr.growth.toFixed(1) ?? 0}%
                </span>
              )}
              vs. mês anterior
            </div>
          </div>
        </div>

        {/* ARR */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between mb-4 text-white/40">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">ARR</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">
              <span className="text-white/30 text-xl mr-1">R$</span>
              {metrics?.arr.toFixed(2) ?? '0.00'}
            </span>
            <div className="text-[11px] text-white/30 mt-2 font-medium">Receita Anual Recorrente</div>
          </div>
        </div>

        {/* ARPU */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between mb-4 text-white/40">
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">ARPU</span>
            <Users className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">
              <span className="text-white/30 text-xl mr-1">R$</span>
              {metrics?.arpu.toFixed(2) ?? '0.00'}
            </span>
            <div className="text-[11px] text-white/30 mt-2 font-medium">Receita Média por Cliente</div>
          </div>
        </div>

        {/* Active Clients */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 text-white/40">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Clientes Ativos</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">{metrics?.clients.active ?? 0}</span>
            <div className="text-[11px] text-white/30 mt-2 font-medium flex items-center gap-3">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400/70" /> +{metrics?.clients.newThisMonth ?? 0} este mês</span>
              {(metrics?.clients.churnedThisMonth ?? 0) > 0 && (
                <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-400/70" /> {metrics?.clients.churnedThisMonth} perdidos</span>
              )}
            </div>
          </div>
        </div>

        {/* Churn Rate */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 text-white/40">
            <span className="text-[10px] font-bold uppercase tracking-widest">Taxa de Churn</span>
            <AlertTriangle className={`w-4 h-4 ${(metrics?.churn.rate ?? 0) > 5 ? 'text-red-400' : 'text-emerald-400'}`} />
          </div>
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">{metrics?.churn.rate.toFixed(2) ?? '0.00'}%</span>
            <div className="text-[11px] text-white/30 mt-2 font-medium">
              MRR Perdido: R$ {metrics?.churn.lostMRR.toFixed(2) ?? '0.00'}
            </div>
          </div>
        </div>

        {/* Add-on Revenue */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 text-white/40">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Receita de Add-ons</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">
              <span className="text-white/30 text-xl mr-1">R$</span>
              {metrics?.addons.revenue.toFixed(2) ?? '0.00'}
            </span>
            <div className="text-[11px] text-white/30 mt-2 font-medium">
              {metrics?.addons.active ?? 0} add-ons ativos
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MRR History Chart */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-[24px] p-8 relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" /> Histórico MRR (6 meses)
            </h3>
            {(metrics?.mrr.growth ?? 0) >= 0 ? (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded font-bold uppercase tracking-widest border border-emerald-500/20">
                <TrendingUp className="w-3 h-3 inline mr-1" />+{metrics?.mrr.growth.toFixed(1)}% crescimento
              </span>
            ) : (
              <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded font-bold uppercase tracking-widest border border-red-500/20">
                <TrendingUp className="w-3 h-3 inline mr-1 rotate-180" />{metrics?.mrr.growth.toFixed(1)}% declínio
              </span>
            )}
          </div>

          <div className="h-64 relative w-full flex flex-col justify-end gap-2 items-end pt-4">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-full border-t border-white/[0.03]" />
              ))}
            </div>

            {/* Bars */}
            <div className="w-full h-full flex items-end justify-between px-2 gap-2 z-10">
              {chartData.heights.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                  <div className="absolute -top-8 bg-indigo-500 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                    R$ {chartData.revenues[i].toFixed(2)}
                  </div>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="w-full max-w-[40px] bg-indigo-500/20 hover:bg-indigo-500/40 border-t-2 border-indigo-500 rounded-t-sm transition-colors cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-indigo-500/20" />
                  </motion.div>
                </div>
              ))}
            </div>

            {/* Month labels */}
            <div className="w-full flex justify-between px-4 text-[10px] font-medium text-white/30 mt-4 z-10 border-t border-white/5 pt-3">
              {chartData.months.map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* MRR by Plan */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full pointer-events-none" />
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2 mb-6">
            <CreditCard className="w-4 h-4 text-indigo-400" /> MRR por Plano
          </h3>

          <div className="space-y-4">
            {totalByPlan.map(({ plan, label, value, color }) => (
              <div key={plan}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${planBadgeColors[plan] || 'bg-white/5 text-white/60 border-white/10'}`}>
                    {label}
                  </span>
                  <span className="text-[12px] font-bold text-white">R$ {value.toFixed(2)}</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${color} transition-all`}
                    style={{ width: `${metrics ? (value / metrics.mrr.current) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
            {totalByPlan.length === 0 && (
              <div className="text-center text-white/20 text-xs py-10">Nenhum dado de plano disponível.</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Client Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-[60px] rounded-full pointer-events-none" />
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2 mb-6">
            <Users className="w-4 h-4 text-violet-400" /> Distribuição de Clientes por Plano
          </h3>

          <div className="space-y-5">
            {clientDistribution.map(({ plan, label, count }) => (
              <div key={plan}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${planBadgeColors[plan] || 'bg-white/5 text-white/60 border-white/10'}`}>
                    {label}
                  </span>
                  <span className="text-[12px] font-bold text-white">
                    {count} {count === 1 ? 'cliente' : 'clientes'}
                    <span className="text-white/30 font-normal ml-1">
                      ({totalClientsDistributed > 0 ? ((count / totalClientsDistributed) * 100).toFixed(1) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: totalClientsDistributed > 0 ? `${(count / totalClientsDistributed) * 100}%` : '0%' }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full rounded-full bg-gradient-to-r ${planColors[plan] || 'from-gray-500 to-gray-600'}`}
                  />
                </div>
              </div>
            ))}
            {clientDistribution.length === 0 && (
              <div className="text-center text-white/20 text-xs py-10">Nenhum cliente encontrado.</div>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none" />
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Resumo do Período
          </h3>

          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-[11px] text-white/40 font-medium">Novos Clientes</div>
                  <div className="text-lg font-bold text-white">{metrics?.clients.newThisMonth ?? 0}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-white/40 font-medium">Churn</div>
                <div className="text-lg font-bold text-red-400">{metrics?.clients.churnedThisMonth ?? 0}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="text-[11px] text-white/40 font-medium">Receita Add-ons</div>
                  <div className="text-lg font-bold text-white">R$ {metrics?.addons.revenue.toFixed(2) ?? '0.00'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-white/40 font-medium">Add-ons Ativos</div>
                <div className="text-lg font-bold text-white">{metrics?.addons.active ?? 0}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-[11px] text-white/40 font-medium">MRR Perdido (Churn)</div>
                  <div className="text-lg font-bold text-white">R$ {metrics?.churn.lostMRR.toFixed(2) ?? '0.00'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-white/40 font-medium">Taxa Churn</div>
                <div className="text-lg font-bold text-red-400">{metrics?.churn.rate.toFixed(2) ?? '0.00'}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
