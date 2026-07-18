'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Puzzle, Search, Building, CheckCircle2, X, Loader2,
  Lock, Unlock, LayoutDashboard, Calendar, Users, Building2,
  Sparkles, Wrench, Package, DollarSign, CloudLightning,
  Palette, Globe, Landmark, ShieldCheck, RefreshCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../lib/api';
import { useSuperAdminStore } from '../../../store/useSuperAdminStore';
import { ALL_MODULES, PREMIUM_MODULES, SystemModule, hasModule } from '../../../lib/modules';

// Mapa de ícones (Lucide) por nome de string
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, Calendar, Users, Building2, Sparkles, Wrench,
  Package, DollarSign, CloudLightning, Palette, Globe, Landmark, ShieldCheck,
};

function ModuleIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] || Puzzle;
  return <Icon className={className} />;
}

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Núcleo',
  operations: 'Operacional',
  commercial: 'Comercial',
  advanced: 'Avançado',
};

const CATEGORY_COLORS: Record<string, string> = {
  core: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  operations: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  commercial: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  advanced: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

export default function ModulesPage() {
  const { sistemaClients, fetchClients } = useSuperAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientModules, setClientModules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingClient, setLoadingClient] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = sistemaClients.filter(
    c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectClient = async (client: any) => {
    setSelectedClient(client);
    setLoadingClient(true);
    try {
      // Busca os dados mais recentes do tenant
      const tenants = await api.getTenants();
      const fresh = tenants.find((t: any) => t.id === client.id);
      setClientModules(fresh?.enabledModules || fresh?.features || []);
    } catch {
      setClientModules(client.features || []);
    } finally {
      setLoadingClient(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    const mod = ALL_MODULES.find(m => m.id === moduleId);
    if (mod?.defaultEnabled) return; // módulos default não podem ser desativados
    setClientModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSave = async () => {
    if (!selectedClient) return;
    setSaving(true);
    try {
      await api.updateTenantModules(selectedClient.id, clientModules);
      toast.success(`Módulos de "${selectedClient.name}" atualizados com sucesso!`);
      await fetchClients();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar módulos.');
    } finally {
      setSaving(false);
    }
  };

  // Agrupa módulos por categoria
  const modulesByCategory = ALL_MODULES.reduce<Record<string, SystemModule[]>>((acc, mod) => {
    if (!acc[mod.category]) acc[mod.category] = [];
    acc[mod.category].push(mod);
    return acc;
  }, {});

  const categoryOrder = ['core', 'operations', 'commercial', 'advanced'];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight flex items-center gap-3">
            <Puzzle className="w-7 h-7 text-indigo-400" />
            Gerenciamento de Módulos
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">
            Habilite ou desabilite módulos do sistema para cada tenant individualmente.
            Novos módulos adicionados ao <code className="text-indigo-400 text-[11px]">modules.ts</code> aparecem aqui automaticamente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Tenants */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Buscar tenant..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredClients.map(client => (
              <button
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  selectedClient?.id === client.id
                    ? 'bg-indigo-500/10 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedClient?.id === client.id ? 'bg-indigo-500/20' : 'bg-white/5'
                }`}>
                  <Building className={`w-4 h-4 ${selectedClient?.id === client.id ? 'text-indigo-400' : 'text-white/50'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-white truncate">{client.name}</p>
                  <p className="text-[10px] text-white/40 truncate">{client.email}</p>
                </div>
                <span className={`ml-auto text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shrink-0 ${
                  client.plan === 'ENTERPRISE' ? 'bg-amber-500/10 text-amber-400' :
                  client.plan === 'PRO' ? 'bg-indigo-500/10 text-indigo-400' :
                  'bg-white/5 text-white/40'
                }`}>{client.plan}</span>
              </button>
            ))}
            {filteredClients.length === 0 && (
              <div className="text-center text-white/20 text-xs py-10 font-medium uppercase tracking-widest">
                Nenhum tenant encontrado
              </div>
            )}
          </div>
        </div>

        {/* Painel de Módulos */}
        <div className="lg:col-span-2">
          {!selectedClient ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white/[0.01] border border-white/5 rounded-2xl">
              <Puzzle className="w-12 h-12 text-white/10 mb-4" />
              <p className="text-white/30 text-sm font-medium">Selecione um tenant para configurar seus módulos</p>
            </div>
          ) : loadingClient ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white/[0.01] border border-white/5 rounded-2xl">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
              <p className="text-white/30 text-sm font-medium">Carregando configuração...</p>
            </div>
          ) : (
            <motion.div
              key={selectedClient.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Header do tenant selecionado */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Building className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-white">{selectedClient.name}</p>
                    <p className="text-[11px] text-white/40">{clientModules.length} módulos extras habilitados</p>
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_-5px_#6366f1] flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Salvar Módulos
                </button>
              </div>

              {/* Módulos por categoria */}
              {categoryOrder.map(category => {
                const mods = modulesByCategory[category] || [];
                if (!mods.length) return null;
                return (
                  <div key={category}>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest mb-3 ${CATEGORY_COLORS[category]}`}>
                      {CATEGORY_LABELS[category]}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {mods.map(mod => {
                        const isDefault = mod.defaultEnabled;
                        const isEnabled = isDefault || clientModules.includes(mod.id);
                        return (
                          <button
                            key={mod.id}
                            onClick={() => toggleModule(mod.id)}
                            disabled={isDefault}
                            className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                              isDefault
                                ? 'bg-white/[0.02] border-white/5 cursor-default opacity-60'
                                : isEnabled
                                ? 'bg-indigo-500/10 border-indigo-500/30 hover:border-indigo-500/50 shadow-sm shadow-indigo-500/10'
                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isEnabled ? 'bg-indigo-500/20' : 'bg-white/5'
                            }`}>
                              <ModuleIcon name={mod.icon} className={`w-4 h-4 ${isEnabled ? 'text-indigo-400' : 'text-white/30'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[12px] font-bold ${isEnabled ? 'text-white' : 'text-white/50'}`}>
                                  {mod.label}
                                </span>
                                {isDefault && (
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                    Padrão
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-white/30 mt-0.5 leading-snug">{mod.description}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isEnabled ? 'bg-indigo-500 border-indigo-500' : 'border-white/20 bg-transparent'
                            }`}>
                              {isEnabled && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <p className="text-[11px] text-white/20 leading-relaxed border-t border-white/5 pt-4">
                💡 <strong className="text-white/40">Dica Dev:</strong> Adicione novos módulos em{' '}
                <code className="text-indigo-400">frontend/src/lib/modules.ts</code> e eles aparecem aqui automaticamente,
                sem precisar editar nenhuma outra página.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
