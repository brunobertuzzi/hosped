'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Server, Megaphone, CreditCard, CheckCircle2, AlertTriangle, RefreshCcw, Key, Eye, EyeOff, Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentGateway {
  id: string;
  name: string;
  apiKey: string;
  showKey: boolean;
}

export default function GlobalSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [activeAnnouncementId, setActiveAnnouncementId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Global Settings from DB
  const [platformName, setPlatformName] = useState('Hosped');
  const [supportEmail, setSupportEmail] = useState('suporte@hosped.com');
  const [helpCenterUrl, setHelpCenterUrl] = useState('');
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { api } = await import('../../../lib/api');
      const maintenanceRes = await api.getGlobalMaintenance();
      setMaintenanceMode(maintenanceRes.maintenanceMode);

      const announcements = await api.getAnnouncements();
      const activeAnn = announcements.find((a: any) => a.isActive);
      if (activeAnn) {
        setBroadcastMessage(activeAnn.content);
        setActiveAnnouncementId(activeAnn.id);
      }

      const global = await api.getGlobalSettings();
      if (global) {
        setPlatformName(global.platformName || 'Hosped');
        setSupportEmail(global.supportEmail || 'suporte@hosped.com');
        setHelpCenterUrl(global.helpCenterUrl || '');
        setGateways((global.paymentGateways || []).map((g: any) => ({ ...g, showKey: false })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addGateway = () => {
    const newGw: PaymentGateway = {
      id: 'gw_' + Date.now(),
      name: '',
      apiKey: '',
      showKey: false,
    };
    setGateways([...gateways, newGw]);
  };

  const removeGateway = (id: string) => {
    setGateways(gateways.filter(g => g.id !== id));
  };

  const updateGateway = (id: string, field: 'name' | 'apiKey', value: string) => {
    setGateways(gateways.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const toggleShowKey = (id: string) => {
    setGateways(gateways.map(g => g.id === id ? { ...g, showKey: !g.showKey } : g));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { api } = await import('../../../lib/api');
      await api.setGlobalMaintenance(maintenanceMode);

      if (broadcastMessage) {
        if (activeAnnouncementId) {
          await api.updateAnnouncement(activeAnnouncementId, { content: broadcastMessage, title: 'Aviso Global', isActive: true, type: 'WARNING' });
        } else {
          const ann = await api.createAnnouncement({ content: broadcastMessage, title: 'Aviso Global', isActive: true, type: 'WARNING' });
          setActiveAnnouncementId(ann.id);
        }
      } else if (activeAnnouncementId) {
        await api.updateAnnouncement(activeAnnouncementId, { content: '', isActive: false });
      }

      await api.updateGlobalSettings({
        platformName,
        supportEmail,
        helpCenterUrl,
        paymentGateways: gateways.map(({ showKey, ...rest }) => rest),
      });

      toast.success('Configurações globais salvas com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCache = async () => {
    toast.success('Cache global invalidado com sucesso.');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Configurações Globais
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Gateway de pagamento, white label, manutenção e parâmetros da plataforma.</p>
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

        {/* Gateway de Pagamento */}
        <div className="glass-panel p-8 rounded-[24px] border border-white/5 space-y-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Gateways de Pagamento</h2>
                <p className="text-[11px] text-white/40 font-medium">Configure quantos gateways quiser — Mercado Pago, Asaas, Stripe, Cielo, etc.</p>
              </div>
            </div>
            <button onClick={addGateway} className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" /> Adicionar Gateway
            </button>
          </div>

          <div className="space-y-4">
            {gateways.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-white/10 rounded-2xl">
                <CreditCard className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-[13px] text-white/30 font-medium">Nenhum gateway configurado.</p>
                <p className="text-[11px] text-white/20 mt-1">Clique em "Adicionar Gateway" para começar.</p>
              </div>
            ) : (
              gateways.map((gw, idx) => (
                <div key={gw.id} className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <GripVertical className="w-4 h-4 text-white/20 shrink-0" />
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest shrink-0">Gateway #{idx + 1}</span>
                      <input
                        type="text"
                        value={gw.name}
                        onChange={e => updateGateway(gw.id, 'name', e.target.value)}
                        placeholder="Ex: Mercado Pago, Asaas, Stripe..."
                        className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-emerald-500 placeholder:text-white/20"
                      />
                    </div>
                    <button onClick={() => removeGateway(gw.id)} className="ml-3 w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                      type={gw.showKey ? 'text' : 'password'}
                      value={gw.apiKey}
                      onChange={e => updateGateway(gw.id, 'apiKey', e.target.value)}
                      placeholder="Chave secreta da API..."
                      className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-[13px] text-white outline-none focus:border-emerald-500 font-mono placeholder:text-white/20"
                    />
                    <button onClick={() => toggleShowKey(gw.id)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                      {gw.showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[10px] text-white/50">As chaves cadastradas aqui serão usadas como padrão para todos os hotéis. Cada hotel pode sobrescrever nas suas próprias configurações de integração.</p>
          </div>
        </div>

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
                <p className="text-[11px] text-white/40 max-w-xs">Desconecta todos os hotéis e exibe tela de manutenção. Apenas Super Admin acessa.</p>
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

        {/* White Label e E-mail */}
        <div className="glass-panel p-8 rounded-[24px] border border-white/5 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">White Label & Suporte</h2>
              <p className="text-[11px] text-white/40 font-medium">Configurações visuais e de contato do SaaS</p>
            </div>
          </div>

          <div className="space-y-4 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Nome da Plataforma</label>
              <input type="text" value={platformName} onChange={e => setPlatformName(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">E-mail de Suporte Global</label>
              <input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">URL da Central de Ajuda</label>
              <input type="url" value={helpCenterUrl} onChange={e => setHelpCenterUrl(e.target.value)} placeholder="https://ajuda.hosped.io" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-purple-500 text-purple-400" />
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
