'use client';

import React, { useState } from 'react';
import { useSuperAdminStore, SistemaInvoice } from '../../../store/useSuperAdminStore';
import { DollarSign, Search, CheckCircle2, AlertCircle, CreditCard, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InvoicesPage() {
  const { invoices, sistemaClients, processPayment } = useSuperAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null);

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
            Faturas e Cobranças
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Controle de pagamentos de assinaturas via Cartão e Pix.</p>
        </div>
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
            <tbody className="divide-y divide-white/[0.02]">
              <AnimatePresence>
                {filteredInvoices.map((inv) => {
                  const client = sistemaClients.find(c => c.id === inv.tenantId);
                  if (!client) return null;
                  
                  return (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={inv.id} 
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 px-4 font-mono text-[11px] text-white/40 uppercase">
                        {inv.id}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-white block">{client.name}</div>
                        <div className="text-[10px] text-white/40 flex items-center gap-2 mt-0.5">
                          {inv.paymentMethod === 'CREDIT_CARD' ? <CreditCard className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                          {inv.paymentMethod} {client.cardLast4 && `(••${client.cardLast4})`}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-white/60">
                        {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-white">
                        R$ {inv.amount.toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        {inv.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-[9px] font-bold text-emerald-400 uppercase tracking-widest rounded border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Pago
                          </span>
                        ) : inv.status === 'OVERDUE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-500/10 text-[9px] font-bold text-red-400 uppercase tracking-widest rounded border border-red-500/20">
                            <AlertCircle className="w-3 h-3" /> Atrasado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 text-[9px] font-bold text-amber-400 uppercase tracking-widest rounded border border-amber-500/20">
                            <Clock className="w-3 h-3" /> Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {inv.status !== 'PAID' ? (
                          <button 
                            onClick={() => handleSimulatePayment(inv.tenantId)}
                            disabled={loadingPayment === inv.tenantId}
                            className="px-3 py-1.5 bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/50 rounded-xl text-[10px] uppercase font-bold tracking-widest text-white/60 hover:text-indigo-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ml-auto"
                          >
                            {loadingPayment === inv.tenantId ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cobrar Agora'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-white/30 font-mono">
                            {inv.paidAt && new Date(inv.paidAt).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/30 text-xs font-medium uppercase tracking-widest border-t border-dashed border-white/5">
                    Nenhuma fatura encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
