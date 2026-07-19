'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { DollarSign, Search, CheckCircle2, AlertCircle, CreditCard, Clock, Loader2, RefreshCcw, PlusCircle, Zap, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function apiRequest(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) throw new Error('Erro na requisição');
  return res.json();
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'FATURAS' | 'WEBHOOKS'>('FATURAS');
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [lastGeneration, setLastGeneration] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invData, tenData] = await Promise.all([
        api.getInvoices(),
        api.getTenants(),
      ]);
      setInvoices(invData || []);
      setTenants(tenData || []);
    } catch {
      toast.error('Erro ao carregar faturas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'WEBHOOKS' && webhooks.length === 0) {
      fetchWebhooks();
    }
  }, [activeTab]);

  const fetchWebhooks = async () => {
    try {
      const data = await api.getWebhookLogs();
      setWebhooks(data || []);
    } catch {
      toast.error('Erro ao carregar logs.');
    }
  };

  // Métricas
  const totalAmount = invoices.reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);
  const paidCount = invoices.filter((inv: any) => inv.status === 'PAGO').length;
  const pendingCount = invoices.filter((inv: any) => inv.status === 'PENDENTE').length;
  const overdueCount = invoices.filter((inv: any) => inv.status === 'ATRASADO').length;

  const getTenantName = (hotelId: string) => {
    const t = tenants.find((t: any) => t.id === hotelId);
    return t?.name || t?.nome || 'Hotel removido';
  };

  const filteredInvoices = invoices.filter((inv: any) => {
    const hotel = inv.hotel || {};
    const name = (hotel.nome || getTenantName(inv.hotelId || inv.tenantId)).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  const handleSimulatePayment = async (invoiceId: string) => {
    setLoadingPayment(invoiceId);
    try {
      await api.simulatePayment(invoiceId);
      toast.success('Pagamento simulado com sucesso!');
      await fetchData();
    } catch {
      toast.error('Erro ao simular pagamento.');
    } finally {
      setLoadingPayment(null);
    }
  };

  const handleGenerateAll = async () => {
    setLoadingAction('all');
    try {
      const result = await api.generateAllInvoices();
      toast.success(`${result.invoicesCreated} faturas geradas!`);
      await fetchData();
    } catch {
      toast.error('Erro ao gerar faturas.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    setLoadingPayment(invoiceId);
    try {
      await api.payInvoice(invoiceId);
      toast.success('Cobrança processada via gateway!');
      await fetchData();
    } catch {
      toast.error('Erro ao processar cobrança.');
    } finally {
      setLoadingPayment(null);
    }
  };

  const handleSyncPayments = async () => {
    setLoadingAction('sync');
    try {
      const result = await apiRequest('/core/billing/sync-payments', { method: 'POST' });
      toast.success(`${result.confirmed} pagamentos sincronizados!`);
      await fetchData();
    } catch {
      toast.error('Erro ao sincronizar.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGenerateForHotel = async () => {
    if (!selectedHotelId) return toast.error('Selecione um hotel.');
    setLoadingAction('hotel');
    try {
      await api.generateInvoice(selectedHotelId);
      toast.success('Fatura gerada!');
      setLastGeneration(new Date().toLocaleString('pt-BR'));
      await fetchData();
    } catch {
      toast.error('Erro ao gerar fatura.');
    } finally {
      setLoadingAction(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAGO':
        return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded uppercase border border-emerald-500/20 flex items-center w-max gap-1"><CheckCircle2 className="w-3 h-3"/> Pago</span>;
      case 'PENDENTE':
        return <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded uppercase border border-amber-500/20 flex items-center w-max gap-1"><Clock className="w-3 h-3"/> Pendente</span>;
      case 'ATRASADO':
        return <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold rounded uppercase border border-red-500/20 flex items-center w-max gap-1"><AlertCircle className="w-3 h-3"/> Atrasado</span>;
      case 'CANCELADO':
        return <span className="px-2 py-1 bg-white/10 text-white/50 text-[10px] font-bold rounded uppercase border border-white/10 flex items-center w-max gap-1"><AlertCircle className="w-3 h-3"/> Cancelado</span>;
      default:
        return <span className="px-2 py-1 bg-white/10 text-white/50 text-[10px] font-bold rounded uppercase">{status}</span>;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-indigo-400" />
            Faturas e Integração de Pagamentos
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Controle de pagamentos de assinaturas e eventos do Gateway.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateAll}
            disabled={loadingAction === 'all'}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loadingAction === 'all' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
            Gerar Faturas do Mês
          </button>
          <button
            onClick={handleSyncPayments}
            disabled={loadingAction === 'sync'}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loadingAction === 'sync' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Sincronizar Pagamentos
          </button>
          <button
            onClick={() => { fetchData(); fetchWebhooks(); }}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl border border-white/10 transition-all flex items-center gap-2"
          >
            <RefreshCcw className="w-3.5 h-3.5" /> Atualizar
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Receita Total</div>
          <div className="text-xl font-bold text-white">
            R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Pagas</div>
          <div className="text-xl font-bold text-emerald-400">{paidCount}</div>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Pendentes</div>
          <div className="text-xl font-bold text-amber-400">{pendingCount}</div>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Atrasadas</div>
          <div className="text-xl font-bold text-red-400">{overdueCount}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-4 border-b border-white/10 pb-px">
          <button
            onClick={() => setActiveTab('FATURAS')}
            className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'FATURAS' ? 'text-indigo-400' : 'text-white/40 hover:text-white/70'}`}
          >
            Faturas
            {activeTab === 'FATURAS' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('WEBHOOKS')}
            className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'WEBHOOKS' ? 'text-indigo-400' : 'text-white/40 hover:text-white/70'}`}
          >
            Gateway Webhooks (Logs)
            {activeTab === 'WEBHOOKS' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full" />}
          </button>
        </div>

        {activeTab === 'FATURAS' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                value={selectedHotelId}
                onChange={e => setSelectedHotelId(e.target.value)}
                className="bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white outline-none focus:border-indigo-500 cursor-pointer min-w-[200px]"
              >
                <option value="">Selecionar hotel...</option>
                {tenants.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name || t.nome}
                  </option>
                ))}
              </select>
              <button
                onClick={handleGenerateForHotel}
                disabled={!selectedHotelId || loadingAction === 'hotel'}
                className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl border border-white/10 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {loadingAction === 'hotel' ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
                Gerar Fatura
              </button>
            </div>
            {lastGeneration && (
              <span className="text-[10px] text-white/30 font-medium whitespace-nowrap">
                Última geração: {lastGeneration}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {activeTab === 'FATURAS' ? (
          loading ? (
            <div className="flex items-center justify-center py-16 text-white/50">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.04] text-white/30 uppercase tracking-widest font-bold text-[10px]">
                    <th className="py-4 px-4">Cliente</th>
                    <th className="py-4 px-4">Plano</th>
                    <th className="py-4 px-4">Vencimento</th>
                    <th className="py-4 px-4">Valor</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {filteredInvoices.map((inv: any) => {
                    const hotel = inv.hotel || {};
                    const hotelName = hotel.nome || getTenantName(inv.hotelId || inv.tenantId);
                    return (
                      <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-bold text-white">{hotelName}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md border bg-white/5 text-white/60 border-white/10">
                            {hotel.plan || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-white/70">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('pt-BR') : new Date(inv.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-4 px-4 font-bold text-white font-mono">
                          R$ {Number(inv.amount).toFixed(2)}
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {inv.status !== 'PAGO' && (
                              <>
                                <button
                                  onClick={() => handleSimulatePayment(inv.id)}
                                  disabled={loadingPayment === inv.id}
                                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-[10px] uppercase font-bold tracking-widest text-emerald-400 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                  title="Simular pagamento"
                                >
                                  {loadingPayment === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                  Pagar
                                </button>
                                <button
                                  onClick={() => handlePayInvoice(inv.id)}
                                  disabled={loadingPayment === inv.id}
                                  className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg text-[10px] uppercase font-bold tracking-widest text-indigo-400 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                  title="Processar cobrança via gateway"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  Cobrar
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-white/30 text-xs font-medium uppercase tracking-widest">
                        Nenhuma fatura encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="space-y-3">
            {webhooks.length === 0 ? (
              <div className="py-12 text-center text-white/30 text-xs font-medium uppercase tracking-widest">
                Nenhum webhook registrado
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {webhooks.map((hook: any, i: number) => (
                  <motion.div
                    key={hook.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${hook.status === 200 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-white">{hook.event}</span>
                          <span className="text-[9px] uppercase font-bold bg-white/5 text-white/40 px-1.5 py-0.5 rounded border border-white/10">{hook.provider}</span>
                        </div>
                        <p className="text-[11px] text-white/40 mt-0.5">
                          {hook.tenantName} &bull; {new Date(hook.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${hook.status === 200 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      HTTP {hook.status}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
