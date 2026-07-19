'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSuperAdminStore, SistemaClient, TenantPlan, TenantStatus } from '../../../store/useSuperAdminStore';
import {
  Building, Search, Plus, ShieldAlert, CheckCircle2,
  Ban, CreditCard, Edit, LogIn, BarChart2, Loader2, X, Trash2,
  Puzzle, LayoutDashboard, Calendar, Users, Building2,
  Sparkles, Wrench, Package, DollarSign, CloudLightning,
  Palette, Globe, Landmark, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../lib/api';
import { formatCNPJ } from '../../../lib/masks';
import { toast } from 'sonner';
import { PREMIUM_MODULES, ALL_MODULES } from '../../../lib/modules';

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

const CATEGORY_ORDER = ['core', 'operations', 'commercial', 'advanced'];

function ModuleGrid({ modules, enabledModules, onToggle }: {
  modules: typeof ALL_MODULES;
  enabledModules: string[];
  onToggle: (moduleId: string) => void;
}) {
  const modulesByCategory = modules.reduce<Record<string, typeof ALL_MODULES>>((acc, mod) => {
    if (!acc[mod.category]) acc[mod.category] = [];
    acc[mod.category].push(mod);
    return acc;
  }, {});

  return (
    <>
      {CATEGORY_ORDER.map(category => {
        const mods = modulesByCategory[category] || [];
        if (!mods.length) return null;
        return (
          <div key={category} className="mb-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest mb-2 ${CATEGORY_COLORS[category] || 'text-white/40 bg-white/5 border-white/10'}`}>
              {CATEGORY_LABELS[category] || category}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {mods.map(mod => {
                const isDefault = mod.defaultEnabled;
                const isEnabled = isDefault || enabledModules.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => onToggle(mod.id)}
                    disabled={isDefault}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isDefault
                        ? 'bg-white/[0.02] border-white/5 cursor-default opacity-60'
                        : isEnabled
                        ? 'bg-indigo-500/10 border-indigo-500/30 hover:border-indigo-500/50'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isEnabled ? 'bg-indigo-500/20' : 'bg-white/5'
                    }`}>
                      <ModuleIcon name={mod.icon} className={`w-4 h-4 ${isEnabled ? 'text-indigo-400' : 'text-white/30'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-bold ${isEnabled ? 'text-white' : 'text-white/50'}`}>
                          {mod.label}
                        </span>
                        {isDefault && (
                          <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            Sempre Ativo
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      isEnabled ? 'bg-indigo-500 border-indigo-500' : 'border-white/20 bg-transparent'
                    }`}>
                      {isEnabled && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function SuperAdminTenants() {
  const router = useRouter();
  const { sistemaClients, fetchClients } = useSuperAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [systemPlans, setSystemPlans] = useState<any[]>([]);

  React.useEffect(() => {
    fetchClients();
    api.getSystemPlans().then(setSystemPlans).catch(() => {});
  }, [fetchClients]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isModulesModalOpen, setIsModulesModalOpen] = useState(false);

  // State
  const [editingClient, setEditingClient] = useState<SistemaClient | null>(null);
  const [modulesClient, setModulesClient] = useState<SistemaClient | null>(null);
  const [modulesClientModules, setModulesClientModules] = useState<string[]>([]);
  const [modulesSaving, setModulesSaving] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [deletingClient, setDeletingClient] = useState<SistemaClient | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states (Add)
  const [name, setName] = useState('');
  const [doc, setDoc] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState<TenantPlan>('STARTUP');
  const [addFeatures, setAddFeatures] = useState<string[]>([]);
  const [editPlan, setEditPlan] = useState<TenantPlan>('STARTUP');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMrr, setEditMrr] = useState(0);
  const [editStatus, setEditStatus] = useState<TenantStatus>('ACTIVE');
  const [editModules, setEditModules] = useState<string[]>([]);

  // Usa o registry centralizado — adicionar módulos em modules.ts os expõe aqui automaticamente
  const AVAILABLE_FEATURES = PREMIUM_MODULES;

  const handleAddPlanChange = (newPlan: TenantPlan) => {
    setPlan(newPlan);
    // Auto-preenche módulos do plano selecionado
    const planData = systemPlans.find((p: any) => p.name === newPlan);
    setAddFeatures(planData?.modules || []);
  };

  const toggleAddFeature = (featureId: string) => {
    setAddFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  const filteredClients = sistemaClients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.document.includes(searchTerm)
  );

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !doc || !email) return;

    let mrr = 150;
    if (plan === 'PRO') mrr = 450;
    if (plan === 'ENTERPRISE') mrr = 1500;

    try {
      await api.createTenant({
        name,
        document: doc,
        email,
        plan,
        mrr,
        enabledModules: addFeatures
      });
      await fetchClients();
      setIsAddModalOpen(false);
      setName(''); setDoc(''); setEmail(''); setPlan('STARTUP'); setAddFeatures([]);
    } catch (err) {
      toast.error('Erro ao criar tenant: ' + (err as Error).message);
    }
  };

  const toggleStatus = async (id: string, currentStatus: TenantStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.updateTenantStatus(id, newStatus);
      await fetchClients();
    } catch (err) {
      toast.error('Erro ao alterar status: ' + (err as Error).message);
    }
  };

  const handleEditOpen = (client: SistemaClient) => {
    setEditingClient(client);
    setEditPlan(client.plan);
    setEditName(client.name);
    setEditEmail(client.email);
    setEditMrr(client.mrr);
    setEditStatus(client.status);
    setEditModules(client.enabledModules || client.features || []);
    setIsEditModalOpen(true);
  };

  const toggleEditModule = (moduleId: string) => {
    const mod = ALL_MODULES.find(m => m.id === moduleId);
    if (mod?.defaultEnabled) return; // módulos default não podem ser desativados
    setEditModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    try {
      await api.updateTenant(editingClient.id, {
        plan: editPlan,
        mrr: Number(editMrr),
        name: editName,
        email: editEmail
      });
      if (editStatus !== editingClient.status) {
        await api.updateTenantStatus(editingClient.id, editStatus);
      }
      // Salva módulos
      await api.updateTenantModules(editingClient.id, editModules);
      await fetchClients();
      setIsEditModalOpen(false);
    } catch (err) {
      toast.error('Erro ao editar tenant: ' + (err as Error).message);
    }
  };

  const handleImpersonate = async (clientId: string) => {
    try {
      setImpersonating(clientId);
      await api.impersonate(clientId);
      router.push('/admin/dashboard');
    } catch (err) {
      toast.error('Erro ao realizar impersonation. Talvez o hotel não tenha um dono configurado corretamente no banco.');
    } finally {
      setImpersonating(null);
    }
  };

  const handleModulesOpen = async (client: SistemaClient) => {
    setModulesClient(client);
    try {
      const tenants = await api.getTenants();
      const fresh = tenants.find((t: any) => t.id === client.id);
      setModulesClientModules(fresh?.enabledModules || fresh?.features || []);
    } catch {
      setModulesClientModules(client.features || []);
    }
    setIsModulesModalOpen(true);
  };

  const toggleModulesModule = (moduleId: string) => {
    const mod = ALL_MODULES.find(m => m.id === moduleId);
    if (mod?.defaultEnabled) return;
    setModulesClientModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleModulesSave = async () => {
    if (!modulesClient) return;
    setModulesSaving(true);
    try {
      await api.updateTenantModules(modulesClient.id, modulesClientModules);
      toast.success(`Módulos de "${modulesClient.name}" atualizados!`);
      await fetchClients();
      setIsModulesModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar módulos.');
    } finally {
      setModulesSaving(false);
    }
  };

  const handleDeleteOpen = (client: SistemaClient) => {
    setDeletingClient(client);
    setAdminPassword('');
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingClient || !adminPassword) return;
    setIsDeleting(true);
    try {
      await api.deleteTenant(deletingClient.id, adminPassword);
      await fetchClients();
      setIsDeleteModalOpen(false);
      setAdminPassword('');
      setDeletingClient(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMetricsOpen = async (client: SistemaClient) => {
    setEditingClient(client);
    setIsMetricsModalOpen(true);
    setMetricsLoading(true);
    try {
      const data = await api.getTenantMetrics(client.id);
      setMetricsData(data);
    } catch (err) {
      setMetricsData(null);
    } finally {
      setMetricsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight flex items-center gap-3">
            <Building className="w-7 h-7 text-indigo-400" />
            Gestão de Tenants
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Controle de clientes, planos e acessos fantasmas (Impersonation).</p>
        </div>

        <button onClick={() => setIsAddModalOpen(true)} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_-5px_#6366f1] flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Tenant
        </button>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Buscar por nome ou CNPJ..."
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
                <th className="py-4 px-4">Rede Hoteleira</th>
                <th className="py-4 px-4">Plano Atual</th>
                <th className="py-4 px-4">Receita (MRR)</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <Building className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">{client.name}</span>
                        <span className="text-[10px] text-white/40">{client.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded-md border ${
                      client.plan === 'ENTERPRISE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      client.plan === 'PRO' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      'bg-white/5 text-white/60 border-white/10'
                    }`}>
                      {client.plan}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-white/90">
                    R$ {client.mrr.toFixed(2)}
                  </td>
                  <td className="py-4 px-4">
                    {client.status === 'ACTIVE' ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                      </span>
                    ) : client.status === 'SUSPENDED' ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                        <Ban className="w-3.5 h-3.5" /> Suspenso
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        Churned
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {/* Novos 3 Botões */}
                      <button
                        onClick={() => handleEditOpen(client)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/50 rounded-lg text-[10px] uppercase font-bold tracking-widest text-white/60 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                      >
                        <Edit className="w-3 h-3" /> Editar
                      </button>

                      <button
                        onClick={() => handleDeleteOpen(client)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 rounded-lg text-[10px] uppercase font-bold tracking-widest text-white/60 hover:text-red-400 transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3 h-3" /> Excluir
                      </button>

                      <button
                        onClick={() => handleMetricsOpen(client)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/50 rounded-lg text-[10px] uppercase font-bold tracking-widest text-white/60 hover:text-amber-400 transition-colors flex items-center gap-1.5"
                      >
                        <BarChart2 className="w-3 h-3" /> Métricas
                      </button>

                      <button
                        onClick={() => handleModulesOpen(client)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/50 rounded-lg text-[10px] uppercase font-bold tracking-widest text-white/60 hover:text-purple-400 transition-colors flex items-center gap-1.5"
                      >
                        <Puzzle className="w-3 h-3" /> Módulos
                      </button>

                      <button
                        onClick={() => handleImpersonate(client.id)}
                        disabled={impersonating === client.id}
                        className="px-3 py-1.5 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/50 rounded-lg text-[10px] uppercase font-bold tracking-widest text-white/60 hover:text-emerald-400 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {impersonating === client.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogIn className="w-3 h-3" />} Acessar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/30 text-xs font-medium uppercase tracking-widest border-t border-dashed border-white/5">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Client */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#050505] border border-white/10 rounded-[24px] p-8 shadow-2xl relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
              <h2 className="text-xl font-bold text-white mb-6">Cadastrar Nova Rede</h2>
              <form onSubmit={handleAddClient} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Razão Social / Nome Fantasia</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">CNPJ</label>
                    <input required type="text" value={doc} onChange={e => setDoc(formatCNPJ(e.target.value))} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500 font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Plano Inicial</label>
                    <select required value={plan} onChange={e => handleAddPlanChange(e.target.value as TenantPlan)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500 cursor-pointer">
                      <option value="STARTUP">STARTUP (R$ 150)</option>
                      <option value="PRO">PRO (R$ 450)</option>
                      <option value="ENTERPRISE">ENTERPRISE (R$ 1500)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">E-mail Administrativo</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Recursos Extras Habilitados</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AVAILABLE_FEATURES.map(feat => (
                      <label key={feat.id} onClick={() => toggleAddFeature(feat.id)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${addFeatures.includes(feat.id) ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${addFeatures.includes(feat.id) ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}>
                          {addFeatures.includes(feat.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-white/80">{feat.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/30 mt-3 leading-relaxed">
                    Você pode alterar essas permissões a qualquer momento editando este tenant.
                  </p>
                </div>

                <div className="pt-6 flex gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 text-[11px] uppercase font-bold text-white/50 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 text-[11px] uppercase font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl shadow-[0_0_20px_-5px_#6366f1] transition-colors">Cadastrar</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Edit Client */}
      <AnimatePresence>
        {isEditModalOpen && editingClient && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#050505] border border-white/10 rounded-[24px] p-8 shadow-2xl relative">
              <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-white/30 hover:text-white z-10">
                <X className="w-5 h-5" />
              </button>
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
              <h2 className="text-xl font-bold text-white mb-2">Editar Tenant</h2>
              <p className="text-[11px] text-white/40 mb-6 font-mono">ID: {editingClient.id}</p>

              <form onSubmit={handleEditSave} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Nome / Razão Social</label>
                  <input required type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">E-mail de Contato</label>
                  <input required type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Plano Atual</label>
                    <select required value={editPlan} onChange={e => {
                        setEditPlan(e.target.value as TenantPlan);
                        // Auto update MRR based on plan selection to help the user
                        if (e.target.value === 'STARTUP') setEditMrr(150);
                        if (e.target.value === 'PRO') setEditMrr(450);
                        if (e.target.value === 'ENTERPRISE') setEditMrr(1500);
                      }}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="STARTUP">STARTUP</option>
                      <option value="PRO">PRO</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Status</label>
                    <select required value={editStatus} onChange={e => setEditStatus(e.target.value as TenantStatus)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500 cursor-pointer">
                      <option value="ACTIVE">Ativo</option>
                      <option value="SUSPENDED">Suspenso</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Receita Fixa (MRR) R$</label>
                  <input required type="number" step="0.01" value={editMrr} onChange={e => setEditMrr(Number(e.target.value))} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500" />
                </div>

                <div className="border-t border-white/5 pt-4">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Módulos do Sistema</label>

                  {/* Categorias de módulos */}
                  <ModuleGrid
                    modules={ALL_MODULES}
                    enabledModules={editModules}
                    onToggle={toggleEditModule}
                  />

                  <p className="text-[10px] text-white/30 mt-3 leading-relaxed">
                    Módulos com <span className="text-emerald-400 font-bold">Sempre Ativo</span> são obrigatórios e não podem ser desabilitados.
                  </p>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Monitoramento de Uso (Quotas)</label>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[10px] text-white/70 mb-1 font-bold">
                        <span>Armazenamento (Fotos e Docs)</span>
                        <span>{editingClient.storageUsedMB || 0} MB / {(editingClient.storageLimitMB || 1024) >= 1024 ? `${(editingClient.storageLimitMB || 1024) / 1024} GB` : `${editingClient.storageLimitMB} MB`}</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${Math.min(((editingClient.storageUsedMB || 0) / (editingClient.storageLimitMB || 1024)) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-white/70 mb-1 font-bold">
                        <span>Requisições de API (Mensal)</span>
                        <span className="text-amber-400">{editingClient.apiRequestsCount || 0} / {editingClient.apiRequestsLimit || 10000}</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full transition-all" style={{ width: `${Math.min(((editingClient.apiRequestsCount || 0) / (editingClient.apiRequestsLimit || 10000)) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/30 mt-3 leading-relaxed">
                    Você pode oferecer pacotes de upsell caso o cliente atinja o limite.
                  </p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 text-[11px] uppercase font-bold text-white/50 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 text-[11px] uppercase font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl shadow-[0_0_20px_-5px_#6366f1] transition-colors">Salvar Alterações</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Metrics */}
      <AnimatePresence>
        {isMetricsModalOpen && editingClient && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#050505] border border-white/10 rounded-[24px] p-8 shadow-2xl relative">
              <button onClick={() => setIsMetricsModalOpen(false)} className="absolute top-6 right-6 text-white/30 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
              <h2 className="text-xl font-bold text-white mb-2">Métricas Isoladas</h2>
              <p className="text-[11px] text-white/40 mb-6 font-mono">Tenant ID: {editingClient.id}</p>

              {metricsLoading ? (
                <div className="py-10 flex flex-col items-center justify-center">
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin mb-4" />
                  <span className="text-[11px] text-white/40 uppercase tracking-widest font-bold">Calculando no banco...</span>
                </div>
              ) : metricsData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Usuários</div>
                    <div className="text-2xl font-bold text-white">{metricsData.usersCount}</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Quartos</div>
                    <div className="text-2xl font-bold text-white">{metricsData.roomsCount}</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Hóspedes</div>
                    <div className="text-2xl font-bold text-white">{metricsData.guestsCount}</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Reservas</div>
                    <div className="text-2xl font-bold text-white">{metricsData.reservationsCount}</div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-red-400 text-sm font-medium">
                  Falha ao carregar métricas para este tenant.
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Modal Delete Tenant */}
        {isDeleteModalOpen && deletingClient && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#050505] border border-red-500/30 rounded-[24px] p-8 shadow-2xl relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />

              <button onClick={() => setIsDeleteModalOpen(false)} className="absolute top-6 right-6 text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Excluir Tenant</h2>
                  <p className="text-[13px] text-white/40 font-medium">{deletingClient.name}</p>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-red-200/80 leading-relaxed">
                    Atenção: A exclusão de um tenant é <strong>irreversível</strong> e destruirá todos os dados associados a ele, incluindo hóspedes, reservas e faturamento.
                  </p>
                </div>
              </div>

              <form onSubmit={handleDeleteConfirm} className="space-y-5">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Sua Senha de Admin</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                    placeholder="Digite sua senha para confirmar"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isDeleting} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Exclusão'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Modules */}
      <AnimatePresence>
        {isModulesModalOpen && modulesClient && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#050505] border border-white/10 rounded-[24px] p-8 shadow-2xl relative">
              <button onClick={() => setIsModulesModalOpen(false)} className="absolute top-6 right-6 text-white/30 hover:text-white z-10">
                <X className="w-5 h-5" />
              </button>
              <div className="absolute top-0 left-0 w-full h-1 bg-purple-500" />
              <h2 className="text-xl font-bold text-white mb-1">Gerenciar Módulos</h2>
              <p className="text-[13px] text-white/50 mb-6 font-mono">{modulesClient.name}</p>

              <ModuleGrid
                modules={ALL_MODULES}
                enabledModules={modulesClientModules}
                onToggle={toggleModulesModule}
              />

              <p className="text-[10px] text-white/30 mt-2 mb-6 leading-relaxed">
                Módulos com <span className="text-emerald-400 font-bold">Sempre Ativo</span> são obrigatórios e não podem ser desabilitados.
                Novos módulos adicionados em <code className="text-indigo-400">modules.ts</code> aparecem aqui automaticamente.
              </p>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModulesModalOpen(false)}
                  className="flex-1 py-3 text-[11px] uppercase font-bold text-white/50 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleModulesSave}
                  disabled={modulesSaving}
                  className="flex-1 py-3 text-[11px] uppercase font-bold text-white bg-purple-500 hover:bg-purple-600 rounded-xl shadow-[0_0_20px_-5px_#a855f7] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {modulesSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Salvar Módulos
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
