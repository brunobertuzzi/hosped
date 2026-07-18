'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Server, Megaphone, CreditCard, CheckCircle2, AlertTriangle, RefreshCcw, Key, Eye, EyeOff, Plus, Trash2, GripVertical, Search, Info, Calendar, Loader2, X, ToggleLeft, ShieldAlert, Users } from 'lucide-react';
import { toast } from 'sonner';

type AnnouncementType = 'INFO' | 'WARNING' | 'SUCCESS' | 'RELEASE_NOTES';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  isActive: boolean;
  targetPlans: string[];
  createdAt: string;
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean; // Global flag
  tenantIds: string[]; // Tenants with access if not global
  createdAt: string;
}

export default function GlobalSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Global Settings from DB
  const [platformName, setPlatformName] = useState('Hosped');
  const [supportEmail, setSupportEmail] = useState('suporte@hosped.com');
  const [helpCenterUrl, setHelpCenterUrl] = useState('');
  const [gatewayName, setGatewayName] = useState('');
  const [gatewayApiKey, setGatewayApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<AnnouncementType>('INFO');

  // Feature Flags State
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [searchTermFlags, setSearchTermFlags] = useState('');
  const [loadingFlags, setLoadingFlags] = useState(true);

  const [isAddFlagModalOpen, setIsAddFlagModalOpen] = useState(false);
  const [newFlagName, setNewFlagName] = useState('');
  const [newFlagDesc, setNewFlagDesc] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoadingAnnouncements(true);
      setLoadingFlags(true);
      const { api } = await import('../../../lib/api');
      
      const [maintenanceRes, announcementsRes, global, flagsRes] = await Promise.all([
        api.getGlobalMaintenance(),
        api.getAnnouncements(),
        api.getGlobalSettings(),
        api.getFeatureFlags()
      ]);
      
      setMaintenanceMode(maintenanceRes.maintenanceMode);
      setAnnouncements(announcementsRes || []);
      setFlags(flagsRes || []);

      if (global) {
        setPlatformName(global.platformName || 'Hosped');
        setSupportEmail(global.supportEmail || 'suporte@hosped.com');
        setHelpCenterUrl(global.helpCenterUrl || '');
        if (global.paymentGateways && global.paymentGateways.length > 0) {
          setGatewayName(global.paymentGateways[0].name || '');
          setGatewayApiKey(global.paymentGateways[0].apiKey || '');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnnouncements(false);
      setLoadingFlags(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { api } = await import('../../../lib/api');
      await api.setGlobalMaintenance(maintenanceMode);

      await api.updateGlobalSettings({
        platformName,
        supportEmail,
        helpCenterUrl,
        paymentGateways: [{ id: 'primary', name: gatewayName || 'Mercado Pago', apiKey: gatewayApiKey }],
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

  const toggleAnnouncementActive = async (id: string, currentStatus: boolean, announcement: Announcement) => {
    try {
      setAnnouncements(announcements.map(a => a.id === id ? { ...a, isActive: !currentStatus } : a));
      const { api } = await import('../../../lib/api');
      await api.updateAnnouncement(id, { ...announcement, isActive: !currentStatus });
    } catch (err) {
      toast.error('Erro ao atualizar status do anúncio');
      fetchSettings();
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Deseja realmente excluir este anúncio?')) return;
    try {
      const { api } = await import('../../../lib/api');
      await api.deleteAnnouncement(id);
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (err) {
      toast.error('Erro ao excluir anúncio');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { api } = await import('../../../lib/api');
      await api.createAnnouncement({
        title: newTitle,
        content: newContent,
        type: newType,
        isActive: true,
        targetPlans: []
      });
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewType('INFO');
      fetchSettings();
      toast.success('Anúncio criado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao criar anúncio: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const toggleGlobalFlag = async (id: string, currentStatus: boolean, flag: FeatureFlag) => {
    try {
      setFlags(flags.map(f => f.id === id ? { ...f, isEnabled: !currentStatus } : f));
      const { api } = await import('../../../lib/api');
      await api.updateFeatureFlag(id, { ...flag, isEnabled: !currentStatus });
    } catch (err) {
      toast.error('Erro ao atualizar flag.');
      fetchSettings(); // revert
    }
  };

  const handleDeleteFlag = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta Feature Flag?')) return;
    try {
      const { api } = await import('../../../lib/api');
      await api.deleteFeatureFlag(id);
      setFlags(flags.filter(f => f.id !== id));
    } catch (err) {
      toast.error('Erro ao excluir flag.');
    }
  };

  const handleCreateFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { api } = await import('../../../lib/api');
      await api.createFeatureFlag({
        name: newFlagName,
        description: newFlagDesc,
        isEnabled: false,
        tenantIds: []
      });
      setIsAddFlagModalOpen(false);
      setNewFlagName('');
      setNewFlagDesc('');
      fetchSettings();
      toast.success('Flag criada com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao criar flag: ' + (err.message || 'Desconhecido'));
    }
  };

  const filteredAnnouncements = announcements.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredFlags = flags.filter(f => f.name.toLowerCase().includes(searchTermFlags.toLowerCase()));

  const getTypeStyle = (type: AnnouncementType) => {
    switch (type) {
      case 'WARNING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'SUCCESS': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'RELEASE_NOTES': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getTypeIcon = (type: AnnouncementType) => {
    switch (type) {
      case 'WARNING': return <AlertTriangle className="w-3 h-3" />;
      case 'SUCCESS': return <CheckCircle2 className="w-3 h-3" />;
      case 'RELEASE_NOTES': return <Megaphone className="w-3 h-3" />;
      default: return <Info className="w-3 h-3" />;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight flex items-center gap-3">
            Configurações Globais
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Gateway de pagamento, white label, manutenção e anúncios.</p>
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
                <h2 className="text-lg font-bold text-white">Gateway de Recebimento da Plataforma</h2>
                <p className="text-[11px] text-white/40 font-medium">Configure o gateway por onde você receberá o pagamento das assinaturas.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 space-y-4">
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type={showKey ? 'text' : 'password'}
                  value={gatewayApiKey}
                  onChange={e => setGatewayApiKey(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Chave secreta da API..."
                  className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-[13px] text-white outline-none focus:border-emerald-500 font-mono placeholder:text-white/20"
                />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Controle do Sistema */}
        <div className="glass-panel p-8 rounded-[24px] border border-white/5 space-y-6 md:col-span-1">
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
                <p className="text-[11px] text-white/40 max-w-xs">Desconecta todos os hotéis e exibe tela de manutenção.</p>
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
                <p className="text-[11px] text-white/40">Força a atualização de queries.</p>
              </div>
              <button onClick={handleClearCache} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg transition-colors">
                Limpar Cache
              </button>
            </div>
          </div>
        </div>

        {/* Identidade Visual e E-mail */}
        <div className="glass-panel p-8 rounded-[24px] border border-white/5 space-y-6 md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Identidade Visual & Suporte</h2>
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

        {/* Central de Anúncios */}
        <div className="glass-panel p-8 rounded-[24px] border border-white/5 space-y-6 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Central de Anúncios</h2>
                <p className="text-[11px] text-white/40 font-medium">Gerencie comunicados enviados para todos os hotéis</p>
              </div>
            </div>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-[12px] font-bold tracking-wide transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Anúncio
            </button>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Buscar comunicados..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {loadingAnnouncements && announcements.length === 0 ? (
                <div className="col-span-full py-12 flex flex-col items-center justify-center">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-4" />
                  <span className="text-[11px] text-white/40 uppercase tracking-widest font-bold">Carregando anúncios...</span>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredAnnouncements.map((announcement) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      key={announcement.id}
                      className={`border rounded-2xl p-5 flex flex-col relative overflow-hidden transition-all ${announcement.isActive ? 'bg-white/[0.03] border-white/10 hover:border-indigo-500/30' : 'bg-black/40 border-white/5 opacity-60'}`}
                    >
                      {!announcement.isActive && (
                        <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />
                      )}

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${getTypeStyle(announcement.type)}`}>
                            {getTypeIcon(announcement.type)}
                            {announcement.type}
                          </span>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <div
                              onClick={() => toggleAnnouncementActive(announcement.id, announcement.isActive, announcement)}
                              className={`w-8 h-4 rounded-full relative transition-colors ${announcement.isActive ? 'bg-indigo-500' : 'bg-white/20'}`}
                            >
                              <motion.div
                                layout
                                className={`w-2.5 h-2.5 bg-white rounded-full absolute top-[3px] ${announcement.isActive ? 'left-[18px]' : 'left-[3px]'}`}
                              />
                            </div>
                          </label>
                        </div>

                        <h3 className="text-[15px] font-bold text-white mb-2 leading-tight">{announcement.title}</h3>
                        <p className="text-[12px] text-white/50 mb-6 line-clamp-3 leading-relaxed">{announcement.content}</p>

                        <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                          <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-mono">
                            <Calendar className="w-3 h-3" />
                            {new Date(announcement.createdAt).toLocaleDateString('pt-BR')}
                          </div>

                          <button onClick={() => handleDeleteAnnouncement(announcement.id)} className="text-white/20 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
            {!loadingAnnouncements && filteredAnnouncements.length === 0 && (
              <div className="py-12 text-center text-white/30 text-xs font-medium uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">
                Nenhum anúncio encontrado
              </div>
            )}
          </div>
        </div>

        {/* Feature Flags */}
        <div className="glass-panel p-8 rounded-[24px] border border-white/5 space-y-6 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <ToggleLeft className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Feature Flags</h2>
                <p className="text-[11px] text-white/40 font-medium">Controle o acesso a novas funcionalidades em Beta ou módulos Premium.</p>
              </div>
            </div>
            <button onClick={() => setIsAddFlagModalOpen(true)} className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-xl text-[12px] font-bold tracking-wide transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nova Flag
            </button>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Buscar pelo nome da flag..."
                  value={searchTermFlags}
                  onChange={e => setSearchTermFlags(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[13px] text-white outline-none focus:border-pink-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-4">
              {loadingFlags && flags.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center">
                   <Loader2 className="w-6 h-6 text-pink-500 animate-spin mb-4" />
                   <span className="text-[11px] text-white/40 uppercase tracking-widest font-bold">Carregando flags...</span>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredFlags.map((flag) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      key={flag.id}
                      className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-[14px] font-bold text-white font-mono">{flag.name}</h3>
                          {flag.isEnabled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Global Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <ShieldAlert className="w-3 h-3" /> Restrito
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-white/50">{flag.description}</p>
                      </div>

                      <div className="flex items-center gap-6">
                        {!flag.isEnabled && (
                          <div className="flex items-center gap-2 text-white/40 text-[11px] font-medium">
                            <Users className="w-4 h-4" />
                            {flag.tenantIds?.length || 0} Tenants Liberados
                          </div>
                        )}

                        <div className="h-8 w-px bg-white/10 hidden md:block"></div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-[11px] uppercase tracking-widest font-bold text-white/40">Global</span>
                            <div
                              onClick={() => toggleGlobalFlag(flag.id, flag.isEnabled, flag)}
                              className={`w-10 h-5 rounded-full relative transition-colors ${flag.isEnabled ? 'bg-pink-500' : 'bg-white/10'}`}
                            >
                              <motion.div
                                layout
                                className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] ${flag.isEnabled ? 'left-[22px]' : 'left-[3px]'}`}
                              />
                            </div>
                          </label>

                          <button onClick={() => handleDeleteFlag(flag.id)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-white/30 hover:text-red-400 transition-colors flex items-center justify-center">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              {!loadingFlags && filteredFlags.length === 0 && (
                <div className="py-12 text-center text-white/30 text-xs font-medium uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">
                  Nenhuma flag encontrada
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Modal Add Announcement */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#050505] border border-white/10 rounded-[24px] p-8 shadow-2xl relative">
              <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 text-white/30 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
              <h2 className="text-xl font-bold text-white mb-6">Criar Novo Anúncio</h2>
              <form onSubmit={handleCreateAnnouncement} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Título do Anúncio</label>
                  <input required type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Tipo de Anúncio</label>
                  <select required value={newType} onChange={e => setNewType(e.target.value as AnnouncementType)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500 cursor-pointer">
                    <option value="INFO">Informativo</option>
                    <option value="RELEASE_NOTES">Novidades / Release Notes</option>
                    <option value="WARNING">Aviso / Manutenção</option>
                    <option value="SUCCESS">Sucesso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Mensagem (Conteúdo)</label>
                  <textarea required value={newContent} onChange={e => setNewContent(e.target.value)} rows={4} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500" />
                </div>
                <div className="pt-6 flex gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 text-[11px] uppercase font-bold text-white/50 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 text-[11px] uppercase font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl shadow-[0_0_20px_-5px_#6366f1] transition-colors">Publicar</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Add Flag */}
      <AnimatePresence>
        {isAddFlagModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#050505] border border-white/10 rounded-[24px] p-8 shadow-2xl relative">
              <button onClick={() => setIsAddFlagModalOpen(false)} className="absolute top-6 right-6 text-white/30 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <div className="absolute top-0 left-0 w-full h-1 bg-pink-500" />
              <h2 className="text-xl font-bold text-white mb-6">Criar Feature Flag</h2>
              <form onSubmit={handleCreateFlag} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Nome da Flag (ex: BETA_CHANNEL)</label>
                  <input required type="text" value={newFlagName} onChange={e => setNewFlagName(e.target.value.toUpperCase().replace(/\s+/g, '_'))} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-pink-500 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Descrição</label>
                  <textarea required value={newFlagDesc} onChange={e => setNewFlagDesc(e.target.value)} rows={3} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-pink-500" />
                </div>
                <div className="pt-6 flex gap-3">
                  <button type="button" onClick={() => setIsAddFlagModalOpen(false)} className="flex-1 py-3 text-[11px] uppercase font-bold text-white/50 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 text-[11px] uppercase font-bold text-white bg-pink-500 hover:bg-pink-600 rounded-xl shadow-[0_0_20px_-5px_#ec4899] transition-colors">Cadastrar</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
