'use client';

import React, { useState } from 'react';
import { useSuperAdminStore, SistemaInvoice } from '../../../store/useSuperAdminStore';
import { DollarSign, Search, CheckCircle2, AlertCircle, CreditCard, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InvoicesPage() {
  const { invoices, sistemaClients, processPayment } = useSuperAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'FATURAS' | 'WEBHOOKS'>('FATURAS');

  const [realWebhooks, setRealWebhooks] = useState<any[]>([]);

  React.useEffect(() => {
    if (activeTab === 'WEBHOOKS') {
      fetchWebhooks();
    }
  }, [activeTab]);

  const fetchWebhooks = async () => {
    try {
      const { api } = await import('../../../lib/api');
      const data = await api.getWebhookLogs();
      setRealWebhooks(data);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const client = sistemaClients.find(c => c.id === inv.tenantId);
    if (!client) return false;
    return client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           client.document.includes(searchTerm);
  });

  const handleSimulatePayment = async (tenantId: string) => {
    setLoadingPayment(tenantId);
    await processPayment(tenantId, 'CREDIT_CARD', '1234');
    setLoadingPayment(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight flex items-center gap-3">
            Faturas e Integração de Pagamentos
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Controle de pagamentos de assinaturas e eventos do Gateway (Stripe/Asaas).</p>
        </div>
      </div>

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

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input 
              type="text" 
              placeholder="Buscar por cliente ou CNPJ..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
        {activeTab === 'FATURAS' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.04] text-white/30 uppercase tracking-widest font-bold text-[10px]">
                  <th className="py-4 px-4">Fatura ID</th>
                  <th className="py-4 px-4">Cliente (Tenant)</th>
                  <th className="py-4 px-4">Vencimento</th>
                  <th className="py-4 px-4">Valor</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const client = sistemaClients.find(c => c.id === inv.tenantId);
                  return (
                    <tr key={inv.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors group">
                      <td className="py-4 px-4 font-mono text-white/50 text-[11px]">{inv.id}</td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-white">{client?.name || 'Cliente Removido'}</div>
                        <div className="text-[11px] text-white/40">{client?.document}</div>
                      </td>
                      <td className="py-4 px-4 text-white/70">
                        {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-4 font-bold text-white">
                        R$ {inv.amount.toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        {inv.status === 'PAID' && <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded uppercase border border-emerald-500/20 flex items-center w-max gap-1"><CheckCircle2 className="w-3 h-3"/> Pago</span>}
                        {inv.status === 'PENDING' && <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded uppercase border border-amber-500/20 flex items-center w-max gap-1"><Clock className="w-3 h-3"/> Pendente</span>}
                        {inv.status === 'OVERDUE' && <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold rounded uppercase border border-red-500/20 flex items-center w-max gap-1"><AlertCircle className="w-3 h-3"/> Atrasado</span>}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {inv.status !== 'PAID' ? (
                          <button 
                            onClick={() => handleSimulatePayment(inv.tenantId)}
                            disabled={loadingPayment === inv.tenantId}
                            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-[10px] uppercase font-bold tracking-widest text-white transition-colors flex items-center justify-end ml-auto gap-1.5 disabled:opacity-50"
                          >
                            {loadingPayment === inv.tenantId ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />} Forçar Pagamento
                          </button>
                        ) : (
                          <span className="text-[10px] text-white/30 font-mono">
                            {inv.paidAt && new Date(inv.paidAt).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {realWebhooks.map((hook, i) => (
                <motion.div
                  key={hook.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white/5 border border-white/5 rounded-[20px] p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hook.status === 200 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{hook.event}</h3>
                      <p className="text-[12px] text-white/50">{hook.tenantName} • {new Date(hook.timestamp).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-[11px] font-bold ${hook.status === 200 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      HTTP {hook.status}
                    </div>
                    <button className="text-[11px] text-white/40 hover:text-white transition-colors uppercase font-bold tracking-wider px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/5">
                      Retry
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
