'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import {
  DollarSign,
  Search,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Clock,
  Loader2,
  RefreshCcw,
  PlusCircle,
  Zap,
  Wallet,
  Trash2,
  SlidersHorizontal,
  Sparkles,
  CalendarDays,
  FileText,
  X,
  ChevronRight,
  ShieldCheck,
  Building2,
  Layers,
  ArrowRight,
  Play,
} from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<string>('TODAS');
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [lastGeneration, setLastGeneration] = useState<string | null>(null);

  // Batch Generation Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchPreviewData, setBatchPreviewData] = useState<any | null>(null);
  const [loadingBatchPreview, setLoadingBatchPreview] = useState(false);
  const [excludedHotelIds, setExcludedHotelIds] = useState<string[]>([]);
  const [batchProgress, setBatchProgress] = useState<any[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

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

  // Abrir Simulador / Prévia de Lote
  const handleOpenBatchModal = async () => {
    setIsBatchModalOpen(true);
    setLoadingBatchPreview(true);
    setExcludedHotelIds([]);
    setBatchProgress([]);
    setIsProcessingBatch(false);
    try {
      const data = await apiRequest('/core/billing/invoices/preview-batch');
      setBatchPreviewData(data);
    } catch {
      toast.error('Erro ao carregar prévia do lote.');
    } finally {
      setLoadingBatchPreview(false);
    }
  };

  // Executar Geração em Lote Confirmada
  const handleConfirmBatchGeneration = async () => {
    if (!batchPreviewData) return;
    setIsProcessingBatch(true);
    setBatchProgress([]);

    const eligibleHotels = batchPreviewData.hotels.filter(
      (h: any) => !h.alreadyHasPending && !excludedHotelIds.includes(h.hotelId)
    );

    let createdCount = 0;
    const progressList: any[] = [];

    for (const h of eligibleHotels) {
      try {
        await api.generateInvoice(h.hotelId);
        createdCount++;
        progressList.push({
          hotelName: h.hotelName,
          amount: h.totalAmount,
          status: 'SUCCESS',
          message: `Fatura de R$ ${h.totalAmount.toFixed(2)} gerada com sucesso!`,
        });
      } catch (err: any) {
        progressList.push({
          hotelName: h.hotelName,
          amount: h.totalAmount,
          status: 'ERROR',
          message: err.message || 'Falha na geração',
        });
      }
      setBatchProgress([...progressList]);
    }

    setIsProcessingBatch(false);
    toast.success(`Processamento concluído: ${createdCount} faturas geradas!`);
    setLastGeneration(new Date().toLocaleString('pt-BR'));
    await fetchData();
  };

  const toggleExcludeHotel = (hotelId: string) => {
    if (excludedHotelIds.includes(hotelId)) {
      setExcludedHotelIds(excludedHotelIds.filter((id) => id !== hotelId));
    } else {
      setExcludedHotelIds([...excludedHotelIds, hotelId]);
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
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'TODAS' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
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

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fatura?')) return;
    setLoadingPayment(`del-${invoiceId}`);
    try {
      await api.deleteInvoice(invoiceId);
      toast.success('Fatura excluída!');
      await fetchData();
    } catch {
      toast.error('Erro ao excluir fatura.');
    } finally {
      setLoadingPayment(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAGO':
        return (
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-lg uppercase border border-emerald-500/20 flex items-center w-max gap-1">
            <CheckCircle2 className="w-3 h-3" /> Pago
          </span>
        );
      case 'PENDENTE':
        return (
          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-lg uppercase border border-amber-500/20 flex items-center w-max gap-1">
            <Clock className="w-3 h-3" /> Pendente
          </span>
        );
      case 'ATRASADO':
        return (
          <span className="px-2.5 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-lg uppercase border border-red-500/20 flex items-center w-max gap-1">
            <AlertCircle className="w-3 h-3" /> Atrasado
          </span>
        );
      case 'CANCELADO':
        return (
          <span className="px-2.5 py-1 bg-white/10 text-white/50 text-[10px] font-bold rounded-lg uppercase border border-white/10 flex items-center w-max gap-1">
            <AlertCircle className="w-3 h-3" /> Cancelado
          </span>
        );
      default:
        return <span className="px-2.5 py-1 bg-white/10 text-white/50 text-[10px] font-bold rounded-lg uppercase">{status}</span>;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-2">
            <Sparkles className="w-3 h-3" />
            <span>MOTOR DE COBRANÇA RECORRENTE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-indigo-400" />
            Faturas e Integração de Pagamentos
          </h1>
          <p className="text-sm text-white/50 mt-1 font-normal">
            Controle de pagamentos de assinaturas, add-ons e reconciliação em lote com o Gateway Mercado Pago.
          </p>
        </div>

        {/* Primary Action Suite */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenBatchModal}
            className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:scale-105 flex items-center gap-2.5"
          >
            <Sparkles className="w-4 h-4" />
            Gerar Faturas do Mês (Simulação & Lote)
          </button>
          <button
            onClick={handleSyncPayments}
            disabled={loadingAction === 'sync'}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center gap-2 disabled:opacity-50"
          >
            {loadingAction === 'sync' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Sincronizar Pagamentos
          </button>
          <button
            onClick={() => {
              fetchData();
              fetchWebhooks();
            }}
            className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] uppercase tracking-widest rounded-2xl border border-white/15 transition-all flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4 text-white/60" /> Atualizar
          </button>
        </div>
      </div>

      {/* Status da Automação & Ciclo */}
      <div className="bg-gradient-to-br from-indigo-950/30 via-purple-950/20 to-[#080814] border border-white/10 rounded-3xl p-6 backdrop-blur-2xl grid grid-cols-1 md:grid-cols-3 gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Ciclo Atual</div>
            <div className="text-lg font-extrabold text-white">
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </div>
            <div className="text-[11px] text-white/40 font-mono mt-0.5">Renovação dia 1º de cada mês</div>
          </div>
        </div>

        <div className="flex items-center gap-4 border-y md:border-y-0 md:border-x border-white/10 py-4 md:py-0 md:px-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Motor Automação</div>
            <div className="text-lg font-extrabold text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Smart-Cron Ativo
            </div>
            <div className="text-[11px] text-white/40 font-mono mt-0.5">Execução às 00:00 (Gateway PIX)</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Última Geração</div>
            <div className="text-sm font-bold text-white">
              {lastGeneration ? lastGeneration : 'Sincronizado recentemente'}
            </div>
            <div className="text-[11px] text-white/40 font-mono mt-0.5">Todas faturas atualizadas</div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#080814]/80 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
          <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">Receita Total Bruta</div>
          <div className="text-2xl font-black text-white font-mono">
            R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-[#080814]/80 border border-emerald-500/30 rounded-2xl p-5 backdrop-blur-xl">
          <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mb-1">Faturas Pagas</div>
          <div className="text-2xl font-black text-emerald-400">{paidCount}</div>
        </div>
        <div className="bg-[#080814]/80 border border-amber-500/30 rounded-2xl p-5 backdrop-blur-xl">
          <div className="text-[10px] text-amber-400 uppercase tracking-widest font-bold mb-1">Pendentes de Pago</div>
          <div className="text-2xl font-black text-amber-400">{pendingCount}</div>
        </div>
        <div className="bg-[#080814]/80 border border-red-500/30 rounded-2xl p-5 backdrop-blur-xl">
          <div className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-1">Atrasadas (&gt; 5 Dias)</div>
          <div className="text-2xl font-black text-red-400">{overdueCount}</div>
        </div>
      </div>

      {/* Navigation Tabs and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('FATURAS')}
            className={`pb-3 text-sm font-extrabold uppercase tracking-widest transition-colors relative flex items-center gap-2 ${
              activeTab === 'FATURAS' ? 'text-indigo-400' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Faturas Emitidas ({invoices.length})</span>
            {activeTab === 'FATURAS' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('WEBHOOKS')}
            className={`pb-3 text-sm font-extrabold uppercase tracking-widest transition-colors relative flex items-center gap-2 ${
              activeTab === 'WEBHOOKS' ? 'text-indigo-400' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Gateway Webhooks ({webhooks.length})</span>
            {activeTab === 'WEBHOOKS' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full" />}
          </button>
        </div>

        {activeTab === 'FATURAS' && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Quick Filter */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-[11px] font-bold">
              {['TODAS', 'PENDENTE', 'PAGO', 'ATRASADO'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === st ? 'bg-indigo-600 text-white shadow-md' : 'text-white/50 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Hotel Individual Selector */}
            <div className="flex items-center gap-2">
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="bg-[#090916] border border-white/15 rounded-xl px-3 py-2 text-[12px] text-white outline-none focus:border-indigo-500 cursor-pointer min-w-[180px]"
              >
                <option value="">Gerar p/ hotel específico...</option>
                {tenants.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name || t.nome}
                  </option>
                ))}
              </select>
              <button
                onClick={handleGenerateForHotel}
                disabled={!selectedHotelId || loadingAction === 'hotel'}
                className="px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold text-[10px] uppercase tracking-widest rounded-xl border border-indigo-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {loadingAction === 'hotel' ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
                Gerar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-[#080814]/90 border border-white/10 rounded-3xl p-6 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Buscar por cliente ou hotel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {activeTab === 'FATURAS' ? (
          loading ? (
            <div className="flex items-center justify-center py-20 text-white/50 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span>Carregando faturas do sistema...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 uppercase tracking-widest font-extrabold text-[10px]">
                    <th className="py-4 px-4">Cliente / Hotel</th>
                    <th className="py-4 px-4">Plano</th>
                    <th className="py-4 px-4">Vencimento</th>
                    <th className="py-4 px-4">Valor Fatura</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Ações de Cobrança</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredInvoices.map((inv: any) => {
                    const hotel = inv.hotel || {};
                    const hotelName = hotel.nome || getTenantName(inv.hotelId || inv.tenantId);
                    return (
                      <tr key={inv.id} className="hover:bg-white/[0.03] transition-colors group">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">{hotelName}</div>
                              <div className="text-[10px] font-mono text-white/30">ID: {inv.id.slice(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-lg border bg-white/5 text-indigo-300 border-indigo-500/30">
                            {hotel.plan || 'PADRÃO'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-white/80 font-mono">
                          {inv.dueDate
                            ? new Date(inv.dueDate).toLocaleDateString('pt-BR')
                            : new Date(inv.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-4 px-4 font-black text-white font-mono text-sm">
                          R$ {Number(inv.amount).toFixed(2)}
                        </td>
                        <td className="py-4 px-4">{getStatusBadge(inv.status)}</td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {inv.status !== 'PAGO' && (
                              <>
                                <button
                                  onClick={() => handleSimulatePayment(inv.id)}
                                  disabled={loadingPayment === inv.id}
                                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl text-[10px] uppercase font-bold tracking-widest text-emerald-400 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                  title="Simular baixa de pagamento"
                                >
                                  {loadingPayment === inv.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  Pagar
                                </button>
                                <button
                                  onClick={() => handlePayInvoice(inv.id)}
                                  disabled={loadingPayment === inv.id}
                                  className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl text-[10px] uppercase font-bold tracking-widest text-indigo-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                  title="Processar cobrança via gateway Mercado Pago"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  Cobrar PIX
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteInvoice(inv.id)}
                              disabled={loadingPayment === `del-${inv.id}`}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[10px] uppercase font-bold tracking-widest text-red-400 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                              title="Excluir fatura"
                            >
                              {loadingPayment === `del-${inv.id}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-white/40 text-xs font-medium uppercase tracking-widest">
                        Nenhuma fatura encontrada com os filtros selecionados
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
              <div className="py-16 text-center text-white/40 text-xs font-medium uppercase tracking-widest">
                Nenhum log de webhook registrado até o momento
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {webhooks.map((hook: any, i: number) => (
                  <motion.div
                    key={hook.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          hook.status === 200 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-white">{hook.event}</span>
                          <span className="text-[9px] uppercase font-bold bg-white/10 text-white/60 px-2 py-0.5 rounded-md border border-white/10">
                            {hook.provider || 'MercadoPago'}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/40 mt-0.5">
                          {hook.tenantName || 'Sistema'} &bull; {new Date(hook.timestamp || Date.now()).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold ${
                        hook.status === 200 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      HTTP {hook.status}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </div>

      {/* Smart Batch Generation Modal / Drawer */}
      <AnimatePresence>
        {isBatchModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isProcessingBatch) setIsBatchModalOpen(false);
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
            />
            <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none px-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-4xl bg-[#090916] border border-white/20 rounded-3xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh] shadow-[0_0_60px_rgba(99,102,241,0.3)] relative"
              >
                {/* Modal Header */}
                <div className="p-6 md:p-8 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-white">Simulador & Geração de Faturas em Lote</h3>
                      <p className="text-xs text-white/50">
                        Examine a prévia do faturamento do mês antes de disparar as cobranças.
                      </p>
                    </div>
                  </div>
                  {!isProcessingBatch && (
                    <button
                      onClick={() => setIsBatchModalOpen(false)}
                      className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Modal Body */}
                <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
                  {loadingBatchPreview ? (
                    <div className="py-20 flex flex-col items-center justify-center text-white/50 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                      <span className="text-sm font-medium">Calculando prévia do lote e adicionais dos hotéis...</span>
                    </div>
                  ) : batchPreviewData ? (
                    <>
                      {/* Summary Metrics of the Batch */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">
                            Hotéis Elegíveis no Lote
                          </div>
                          <div className="text-2xl font-black text-emerald-400">
                            {batchPreviewData.eligibleHotelsCount} / {batchPreviewData.totalHotelsCount}
                          </div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">
                            Faturamento Estimado do Lote
                          </div>
                          <div className="text-2xl font-black text-white font-mono">
                            R$ {batchPreviewData.totalEstimatedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">
                            Disparo do Gateway PIX
                          </div>
                          <div className="text-sm font-bold text-indigo-300 flex items-center gap-1.5 mt-1">
                            <Zap className="w-4 h-4 text-amber-400" /> Cobrança Direta MercadoPago
                          </div>
                        </div>
                      </div>

                      {/* Execution Terminal Progress (if processing) */}
                      {batchProgress.length > 0 && (
                        <div className="bg-black/60 border border-white/15 rounded-2xl p-4 space-y-2 font-mono text-xs max-h-48 overflow-y-auto">
                          <div className="text-indigo-400 font-bold mb-2 flex items-center gap-2">
                            <Loader2 className={`w-3.5 h-3.5 ${isProcessingBatch ? 'animate-spin' : ''}`} />
                            Logs do Terminal de Emissão:
                          </div>
                          {batchProgress.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between text-white/80">
                              <span className="flex items-center gap-2">
                                <span className={p.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}>
                                  {p.status === 'SUCCESS' ? '✓' : '✗'}
                                </span>
                                {p.hotelName}
                              </span>
                              <span className="text-white/40">{p.message}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Hotel List Preview Table */}
                      <div>
                        <h4 className="text-sm font-bold text-white mb-3">Hotéis Incluídos nesta Rodada de Faturamento:</h4>
                        <div className="space-y-3">
                          {batchPreviewData.hotels.map((h: any) => {
                            const isExcluded = excludedHotelIds.includes(h.hotelId);
                            return (
                              <div
                                key={h.hotelId}
                                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                  h.alreadyHasPending
                                    ? 'bg-white/[0.02] border-white/5 opacity-60'
                                    : isExcluded
                                    ? 'bg-red-500/5 border-red-500/20'
                                    : 'bg-white/[0.04] border-white/10'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {!h.alreadyHasPending && (
                                    <input
                                      type="checkbox"
                                      checked={!isExcluded}
                                      onChange={() => toggleExcludeHotel(h.hotelId)}
                                      disabled={isProcessingBatch}
                                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                  )}
                                  <div>
                                    <div className="font-bold text-white text-sm flex items-center gap-2">
                                      <span>{h.hotelName}</span>
                                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                                        {h.plan || 'PADRÃO'}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-white/50 flex flex-wrap items-center gap-2 mt-1">
                                      <span>MRR Base: R$ {h.mrrBase.toFixed(2)}</span>
                                      {h.addonsList.length > 0 && (
                                        <span className="text-purple-300 font-medium">
                                          + Add-ons ({h.addonsList.map((a: any) => a.name).join(', ')}): R$ {h.addonsTotal.toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 justify-between sm:justify-end">
                                  <div className="text-right">
                                    <div className="text-sm font-black text-white font-mono">
                                      R$ {h.totalAmount.toFixed(2)}
                                    </div>
                                    <div className="text-[10px] text-white/40">
                                      {h.alreadyHasPending ? 'Fatura pendente existente' : isExcluded ? 'Omisso do lote' : 'Elegível'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Modal Footer Actions */}
                <div className="p-6 md:p-8 border-t border-white/10 bg-[#060610] flex items-center justify-between">
                  <button
                    onClick={() => setIsBatchModalOpen(false)}
                    disabled={isProcessingBatch}
                    className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-2xl border border-white/15 transition-all disabled:opacity-50"
                  >
                    Fechar
                  </button>

                  <button
                    onClick={handleConfirmBatchGeneration}
                    disabled={isProcessingBatch || loadingBatchPreview || batchPreviewData?.eligibleHotelsCount === 0}
                    className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-105 flex items-center gap-2.5 disabled:opacity-50"
                  >
                    {isProcessingBatch ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Processando Lote...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" /> Confirmar e Emitir Lote de Faturas
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
