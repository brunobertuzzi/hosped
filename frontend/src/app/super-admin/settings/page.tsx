'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, ShieldAlert, Key, Server, Megaphone, CheckCircle2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function GlobalSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Mock API keys states
  const [asaasKey, setAsaasKey] = useState('***************************');
  const [stripeKey, setStripeKey] = useState('sk_test_*******************');

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Configurações globais salvas com sucesso!');
    }, 1200);
  };

  const handleClearCache = () => {
    toast.success('Cache global invalidado com sucesso. Todos os tenants receberão a nova versão no próximo refresh.');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Configurações Globais
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Controle de chaves-mestras, manutenção e parâmetros globais da plataforma.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_-5px_#6366f1] disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Controle do Sistema */}
        <div className="glass-panel p-8 rounded-[24px] border border-white/5 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Controle da Aplicação</h2>
              <p className="text-[11px] text-white/40 font-medium">Ações drásticas e estado do servidor</p>
            </div>
          </div>

          <div className="space-y-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-bold text-white mb-1">Modo Manutenção</h4>
                <p className="text-[11px] text-white/40 max-w-xs">Ao ativar, todos os tenants (exceto Super Admins) serão deslogados e verão uma tela de manutenção.</p>
              </div>
              <button 
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`w-14 h-7 rounded-full transition-colors relative flex items-center shrink-0 ${maintenanceMode ? 'bg-amber-500' : 'bg-white/10'}`}
              >
                <motion.div className="w-5 h-5 rounded-full bg-white absolute" animate={{ left: maintenanceMode ? '32px' : '4px' }} />
              </button>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-bold text-white mb-1">Limpeza de Cache (Redis)</h4>
                <p className="text-[11px] text-white/40">Força a atualização de queries de relatórios para todos os hotéis.</p>
              </div>
              <button onClick={handleClearCache} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg transition-colors">
                Limpar Cache
              </button>
            </div>
          </div>
        </div>

        {/* Broadcast */}
        <div className="glass-panel p-8 rounded-[24px] border border-white/5 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Aviso Global (Broadcast)</h2>
              <p className="text-[11px] text-white/40 font-medium">Mensagem fixada no topo do painel de todos os clientes</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Conteúdo da Mensagem</label>
            <textarea 
              rows={4}
              value={broadcastMessage}
              onChange={e => setBroadcastMessage(e.target.value)}
              placeholder="Ex: Sistema passará por manutenção programada no Sábado às 02h00..."
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500 resize-none placeholder:text-white/20"
            />
            {broadcastMessage && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-[11px] text-indigo-200">A mensagem será exibida imediatamente ao salvar.</span>
              </div>
            )}
          </div>
        </div>

        {/* Chaves de Integração (API Keys) */}
        <div className="glass-panel p-8 rounded-[24px] border border-white/5 space-y-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Integrações de Faturamento (Master)</h2>
              <p className="text-[11px] text-white/40 font-medium">Credenciais para emissão de faturas e pagamentos da assinatura (SaaS)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Asaas API Key (PIX / Boleto)</label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input 
                  type="password"
                  value={asaasKey}
                  onChange={e => setAsaasKey(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[13px] text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Stripe Secret Key (Cartões Globais)</label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input 
                  type="password"
                  value={stripeKey}
                  onChange={e => setStripeKey(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[13px] text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-[11px] text-white/60">
              Alterar as chaves-mestras pode interromper a cobrança recorrente de todos os {">"} 120 tenants ativos. Cuidado ao manipular essas configurações em produção.
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
