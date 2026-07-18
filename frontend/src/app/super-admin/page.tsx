'use client';

import React, { useMemo } from 'react';
import { useSuperAdminStore } from '../../store/useSuperAdminStore';
import { DollarSign, Activity, Users, Building2, ArrowUpRight, TrendingUp, AlertTriangle, Wallet, CreditCard, CheckCircle2, Clock, ArrowRight, Zap, Database, ServerCrash, Download, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function SuperAdminDashboard() {
  const { sistemaClients, invoices, fetchClients, fetchInvoices } = useSuperAdminStore();

  const [healthData, setHealthData] = React.useState<any>(null);

  React.useEffect(() => {
    fetchClients();
    fetchInvoices();
    fetchHealth();
  }, [fetchClients, fetchInvoices]);

  const fetchHealth = async () => {
    try {
      const { api } = await import('../../lib/api');
      const res = await api.getHealth();
      setHealthData(res);
    } catch (e) {
      console.error('Health Check falhou', e);
    }
  };

  const kpis = useMemo(() => {
    const realClients = sistemaClients.filter(c => c.id !== '11111111-1111-1111-1111-111111111111');
    const realInvoices = invoices.filter(i => i.tenantId !== '11111111-1111-1111-1111-111111111111');

    const activeClients = realClients.filter(c => c.status === 'ACTIVE');
    const totalMRR = activeClients.reduce((sum, c) => sum + c.mrr, 0);
    const totalBranches = activeClients.reduce((sum, c) => sum + c.branchesCount, 0);
    const suspended = realClients.filter(c => c.status === 'SUSPENDED').length;
    const arr = totalMRR * 12;

    const totalClients = realClients.length;
    const churnRate = totalClients > 0 ? (suspended / totalClients) * 100 : 0;
    const arpu = activeClients.length > 0 ? totalMRR / activeClients.length : 0;

    const pendingRevenue = realInvoices.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + i.amount, 0);
    const collectedRevenue = realInvoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);

    return { totalMRR, arr, activeCount: activeClients.length, totalBranches, suspended, churnRate, arpu, pendingRevenue, collectedRevenue };
  }, [sistemaClients, invoices]);

  const chartData = useMemo(() => {
    const validClients = sistemaClients.filter(
      c => c.id !== '11111111-1111-1111-1111-111111111111' && c.status !== 'CHURNED'
    );

    const months = [];
    const revenues = [];
    const today = new Date();

    // Generate last 7 months data (cumulative MRR)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = d.toLocaleString('pt-BR', { month: 'short' });
      months.push(monthStr.charAt(0).toUpperCase() + monthStr.slice(1, 3));

      // Clients created before the end of this month
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59);

      const mrr = validClients
        .filter(c => new Date(c.createdAt) <= endOfMonth)
        .reduce((acc, c) => acc + c.mrr, 0);

      revenues.push(mrr);
    }

    const maxRev = Math.max(...revenues, 1);
    const heights = revenues.map(r => (r / maxRev) * 100);

    // Calcula crescimento percentual do último mês completo vs anterior
    const lastMonth = revenues[revenues.length - 1];
    const prevMonth = revenues[revenues.length - 2];
    const growth = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;

    return { months, revenues, heights, growth };
  }, [sistemaClients]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight flex items-center gap-3">
            Financials
            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Live
            </span>
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Acompanhe métricas, pagamentos e retenção de Tenants.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total MRR */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border-t-2 border-t-indigo-500 border border-white/5 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between mb-4 text-white/40">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Total MRR</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">
              <span className="text-white/30 text-xl mr-1">R$</span>
              {kpis.totalMRR.toFixed(2)}
            </span>
            <div className="text-[11px] text-white/30 mt-2 font-medium flex items-center gap-1.5">
              {chartData.growth >= 0 ? (
                <span className="text-emerald-400/90 flex items-center bg-emerald-500/10 px-1.5 rounded"><ArrowUpRight className="w-3 h-3 mr-0.5" /> {chartData.growth.toFixed(1)}%</span>
              ) : (
                <span className="text-red-400/90 flex items-center bg-red-500/10 px-1.5 rounded"><ArrowUpRight className="w-3 h-3 mr-0.5 rotate-90" /> {Math.abs(chartData.growth).toFixed(1)}%</span>
              )}
              este mês
            </div>
          </div>
        </div>

        {/* ARR Estimado */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 text-white/40">
            <span className="text-[10px] font-bold uppercase tracking-widest">ARR Estimado</span>
            <TrendingUp className="w-4 h-4 text-white/60" />
          </div>
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">
              <span className="text-white/30 text-xl mr-1">R$</span>
              {kpis.arr.toFixed(2)}
            </span>
            <div className="text-[11px] text-white/30 mt-2 font-medium flex justify-between">
              <span>Receita Anualizada</span>
            </div>
          </div>
        </div>

        {/* Churn Rate */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 text-white/40">
            <span className="text-[10px] font-bold uppercase tracking-widest">Taxa de Churn</span>
            <AlertTriangle className={`w-4 h-4 ${kpis.churnRate > 5 ? 'text-red-400' : 'text-emerald-400'}`} />
          </div>
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">{kpis.churnRate.toFixed(1)}%</span>
            <div className="text-[11px] text-white/30 mt-2 font-medium">Contas inativas/canceladas</div>
          </div>
        </div>

        {/* Tenants Ativos */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 text-white/40">
            <span className="text-[10px] font-bold uppercase tracking-widest">Tenants Ativos</span>
            <Building2 className="w-4 h-4 text-emerald-400/80" />
          </div>
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">{kpis.activeCount}</span>
            <div className="text-[11px] text-white/30 mt-2 font-medium">Hotéis/Redes Ativas</div>
          </div>
        </div>

        {/* ARPU */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 text-white/40">
            <span className="text-[10px] font-bold uppercase tracking-widest">ARPU Médio</span>
            <Users className="w-4 h-4 text-white/60" />
          </div>
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">
              <span className="text-white/30 text-xl mr-1">R$</span>
              {kpis.arpu.toFixed(2)}
            </span>
            <div className="text-[11px] text-white/30 mt-2 font-medium">Receita Média por Usuário</div>
          </div>
        </div>

        {/* Pending Revenue */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 text-white/40">
            <span className="text-[10px] font-bold uppercase tracking-widest">Faturas Pendentes</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">
              <span className="text-white/30 text-xl mr-1">R$</span>
              {kpis.pendingRevenue.toFixed(2)}
            </span>
            <div className="text-[11px] text-white/30 mt-2 font-medium">Esperando processamento</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-[24px] p-8 relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" /> Histórico de Receita
            </h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded font-bold uppercase tracking-widest border border-emerald-500/20">Crescimento Estável</span>
          </div>
          <div className="h-64 relative w-full flex flex-col justify-end gap-2 items-end pt-4">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
              <div className="w-full border-t border-white/[0.03]" />
              <div className="w-full border-t border-white/[0.03]" />
              <div className="w-full border-t border-white/[0.03]" />
              <div className="w-full border-t border-white/[0.03]" />
            </div>

            <div className="w-full h-full flex items-end justify-between px-2 gap-2 z-10">
              {chartData.heights.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                  <div className="absolute -top-8 bg-indigo-500 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
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

            <div className="w-full flex justify-between px-4 text-[10px] font-medium text-white/30 mt-4 z-10 border-t border-white/5 pt-3">
              {chartData.months.map((m, i) => <span key={i}>{m}</span>)}
            </div>
          </div>
        </div>

        {/* System Health Check Widget */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none" />
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2 mb-6">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Saúde do Servidor
            </h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-[10px] text-white/70 mb-1 font-bold">
                  <span>Uso de CPU (VPS)</span>
                  <span className="text-white">{healthData ? healthData.cpuUsagePercentage.toFixed(1) : 0}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${healthData ? healthData.cpuUsagePercentage : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-white/70 mb-1 font-bold">
                  <span>Memória RAM ({healthData ? healthData.memoryTotalGB : 0}GB)</span>
                  <span className="text-white">{healthData ? healthData.memoryUsedGB : 0} GB</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${healthData ? healthData.memoryUsagePercentage : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-white/70 mb-1 font-bold flex-col gap-1">
                  <div className="flex justify-between w-full">
                    <span className="flex items-center gap-1.5"><Database className="w-3 h-3 text-indigo-400"/> PostgreSQL (Produção)</span>
                    <span className="text-emerald-400">{healthData ? healthData.postgresStatus : 'OFFLINE'}</span>
                  </div>
                  <div className="flex justify-between w-full">
                    <span className="flex items-center gap-1.5"><ServerCrash className="w-3 h-3 text-red-400"/> Redis (Cache)</span>
                    <span className="text-emerald-400">{healthData ? healthData.redisStatus : 'OFFLINE'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button className="w-full mt-6 px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10">
            <Download className="w-3.5 h-3.5" /> Forçar Backup SQL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices Widget */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-white/60" /> Últimos Pagamentos
            </h3>
            <Link href="/super-admin/invoices" className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest flex items-center gap-1 transition-colors">
              Ver Todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">
            {invoices.length === 0 ? (
              <div className="text-center text-white/20 text-xs py-10">Nenhuma transação recente.</div>
            ) : (
              [...invoices].reverse().slice(0, 5).map(inv => {
                const client = sistemaClients.find(c => c.id === inv.tenantId);
                return (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                    <div>
                      <div className="text-[12px] font-bold text-white mb-0.5">{client?.name || 'Cliente'}</div>
                      <div className="text-[10px] text-white/40 font-mono">ID: {inv.id.split('_')[1]}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] font-bold text-white mb-0.5">R$ {inv.amount.toFixed(2)}</div>
                      {inv.status === 'PAID' ? (
                        <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1 justify-end"><CheckCircle2 className="w-3 h-3" /> Pago</div>
                      ) : (
                        <div className="text-[9px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1 justify-end"><Clock className="w-3 h-3" /> Pendente</div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
