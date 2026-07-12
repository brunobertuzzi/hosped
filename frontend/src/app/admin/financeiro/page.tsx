'use client';

import React, { useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, 
  CreditCard, ArrowUpRight, ArrowDownRight, 
  Calendar, Building2, Receipt
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { useTenantStore, useActiveBranchData } from '../../../store/useTenantStore';

export default function FinanceiroPage() {
  const { reservations, hotel, expenses } = useActiveBranchData();
  const { updateExpenseStatus } = useTenantStore();
  const [activeTab, setActiveTab] = React.useState('GERAL'); // GERAL, RECEBER, PAGAR

  const primaryColor = hotel.cores?.primary || '#3b82f6';

  // Processamento de Dados Financeiros
  const financialData = useMemo(() => {
    let totalReceita = 0;
    let totalPendente = 0;
    const paymentsList: any[] = [];
    const dailyRevenue: Record<string, number> = {};

    reservations.forEach(res => {
      // Receita capturada
      const paid = (res.payments || []).reduce((sum: number, p: any) => sum + p.valor, 0);
      totalReceita += paid;
      
      // Receita Pendente
      if (res.valorTotal > paid) {
        totalPendente += (res.valorTotal - paid);
      }

      // Agrupar pagamentos
      (res.payments || []).forEach((p: any) => {
        paymentsList.push({
          ...p,
          resId: res.id,
          guestName: 'Cliente via Reserva', // Mockado para exibição rápida
        });

        // Agrupar por dia para o gráfico
        const dateKey = new Date(p.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + p.valor;
      });
    });

    const chartData = Object.entries(dailyRevenue).map(([date, valor]) => ({
      date,
      valor
    })).sort((a, b) => a.date.localeCompare(b.date)); // Ordenação simplificada p/ mock

    return {
      totalReceita,
      totalPendente,
      ticketMedio: reservations.length > 0 ? (totalReceita / reservations.length) : 0,
      chartData,
      paymentsList: paymentsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    };
  }, [reservations, expenses]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Gestão Financeira
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Controle de caixa, faturamento de diárias e transações de PDV.</p>
        </div>
        <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] uppercase tracking-widest border border-white/10 rounded-xl transition-all flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand" /> Mês Atual (Maio 2026)
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <button 
          onClick={() => setActiveTab('GERAL')} 
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'GERAL' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/[0.02]'}`}
        >
          Visão Geral
        </button>
        <button 
          onClick={() => setActiveTab('RECEBER')} 
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'RECEBER' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/[0.02]'}`}
        >
          A Receber
        </button>
        <button 
          onClick={() => setActiveTab('PAGAR')} 
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'PAGAR' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/[0.02]'}`}
        >
          Contas a Pagar
        </button>
      </div>

      {activeTab === 'GERAL' && (
        <div className="space-y-8">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-l-4 relative overflow-hidden" style={{ borderLeftColor: primaryColor }}>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none" style={{ backgroundColor: primaryColor }} />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-brand" /> Receita Bruta
            </h3>
            <span className="flex items-center text-emerald-400 text-[11px] font-bold tracking-widest"><ArrowUpRight className="w-3 h-3 mr-1" /> 14.5%</span>
          </div>
          <p className="text-3xl font-bold text-white tracking-tight font-mono">
            <span className="text-white/30 text-xl mr-1">R$</span>{financialData.totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="glass-card p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-500" /> A Receber (Pendentes)
            </h3>
          </div>
          <p className="text-3xl font-bold text-amber-500 tracking-tight font-mono">
            <span className="text-amber-500/50 text-xl mr-1">R$</span>{financialData.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="glass-card p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-white/40" /> Ticket Médio
            </h3>
          </div>
          <p className="text-3xl font-bold text-white tracking-tight font-mono">
            <span className="text-white/30 text-xl mr-1">R$</span>{financialData.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfico de Faturamento */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-[24px] border border-white/5">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-brand" /> Curva de Faturamento Diário
          </h3>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickFormatter={(val) => `R$ ${val}`} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                  itemStyle={{ color: primaryColor }}
                />
                <Area type="monotone" dataKey="valor" stroke={primaryColor} strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Últimas Transações */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-[24px] border border-white/5 flex flex-col h-full">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
            <CreditCard className="w-4 h-4 text-brand" /> Extrato Recente
          </h3>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
            {financialData.paymentsList.map(pay => (
              <div key={pay.id} className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg ${
                    pay.metodo === 'PIX' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    pay.metodo === 'CARTAO' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                    'bg-white/5 border-white/10 text-white/50'
                  }`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[13px] font-bold text-white mb-0.5">{pay.metodo}</span>
                    <span className="block text-[9px] uppercase tracking-widest text-white/40 font-mono">Res. #{pay.resId.substring(0,6)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[14px] font-bold text-emerald-400 font-mono">+ R$ {pay.valor.toFixed(2)}</span>
                  <span className="block text-[9px] uppercase tracking-widest text-emerald-500/50 mt-1">{pay.status}</span>
                </div>
              </div>
            ))}

            {financialData.paymentsList.length === 0 && (
              <div className="text-center py-10 text-white/30 text-xs">
                Nenhuma transação capturada no período.
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      )}

      {activeTab === 'PAGAR' && (
        <div className="glass-panel p-6 rounded-[24px] border border-white/5">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/80 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-500" /> Contas a Pagar (Despesas)
            </h3>
          </div>
          <div className="space-y-4">
            {expenses.map(exp => (
              <div key={exp.id} className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-white/50" />
                  </div>
                  <div>
                    <span className="block text-[13px] font-bold text-white mb-0.5">{exp.description}</span>
                    <span className="block text-[10px] text-white/40 font-medium">Vencimento: {exp.dueDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="block text-[14px] font-bold text-amber-400 font-mono">R$ {exp.amount.toFixed(2)}</span>
                    <span className={`block text-[9px] uppercase tracking-widest mt-1 ${exp.status === 'PAID' ? 'text-emerald-400' : 'text-amber-500'}`}>
                      {exp.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                    </span>
                  </div>
                  {exp.status !== 'PAID' && (
                    <button 
                      onClick={() => updateExpenseStatus(exp.id, 'PAID')}
                      className="ml-4 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Pagar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'RECEBER' && (
        <div className="glass-panel p-6 rounded-[24px] border border-white/5">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/80 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Contas a Receber (Reservas)
            </h3>
          </div>
          <div className="space-y-4">
            {reservations.filter(r => r.valorTotal > (r.payments || []).reduce((sum: number, p: any) => sum + p.valor, 0)).map(res => {
              const paid = (res.payments || []).reduce((sum: number, p: any) => sum + p.valor, 0);
              const balance = res.valorTotal - paid;
              return (
                <div key={res.id} className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-white/50" />
                    </div>
                    <div>
                      <span className="block text-[13px] font-bold text-white mb-0.5">Reserva #{res.id.substring(0,6)}</span>
                      <span className="block text-[10px] text-white/40 font-medium">Check-out: {res.dataCheckOut}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-[14px] font-bold text-emerald-400 font-mono">Falta R$ {balance.toFixed(2)}</span>
                    <span className="block text-[9px] uppercase tracking-widest text-white/40 mt-1">TOTAL: R$ {res.valorTotal.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </motion.div>
  );
}
