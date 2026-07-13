'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSuperAdminStore, SistemaClient, TenantPlan, TenantStatus } from '../../../store/useSuperAdminStore';
import { 
  Building, Search, Plus, ShieldAlert, CheckCircle2, 
  Ban, CreditCard, Edit, LogIn, BarChart2, Loader2, X, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../lib/api';
import { formatCNPJ } from '../../../lib/masks';

export default function SuperAdminTenants() {
  const router = useRouter();
  const { sistemaClients, fetchClients } = useSuperAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  React.useEffect(() => {
    fetchClients();
  }, [fetchClients]);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // State
  const [editingClient, setEditingClient] = useState<SistemaClient | null>(null);
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
  const [editFeatures, setEditFeatures] = useState<string[]>([]);

  const AVAILABLE_FEATURES = [
    { id: 'WHITE_LABEL', label: 'White-Label (Hosped Injector)' },
    { id: 'WEBHOOKS', label: 'Webhooks & API' },
    { id: 'GANTT_CHART', label: 'Mapa de Ocupação (Gantt)' },
    { id: 'MULTIPLE_BRANCHES', label: 'Múltiplas Filiais' }
  ];

  const handleAddPlanChange = (newPlan: TenantPlan) => {
    setPlan(newPlan);
    if (newPlan === 'STARTUP') setAddFeatures([]);
    if (newPlan === 'PRO') setAddFeatures(['GANTT_CHART', 'WEBHOOKS']);
    if (newPlan === 'ENTERPRISE') setAddFeatures(['WHITE_LABEL', 'WEBHOOKS', 'GANTT_CHART', 'MULTIPLE_BRANCHES']);
  };

  const toggleAddFeature = (featureId: string) => {
    setAddFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  const toggleFeature = (featureId: string) => {
    setEditFeatures(prev => 
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
        features: addFeatures
      });
      await fetchClients();
      setIsAddModalOpen(false);
      setName(''); setDoc(''); setEmail(''); setPlan('STARTUP'); setAddFeatures([]);
    } catch (err) {
      alert('Erro ao criar tenant: ' + (err as Error).message);
    }
  };

  const toggleStatus = async (id: string, currentStatus: TenantStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.updateTenantStatus(id, newStatus);
      await fetchClients();
    } catch (err) {
      alert('Erro ao alterar status: ' + (err as Error).message);
    }
  };

  const handleEditOpen = (client: SistemaClient) => {
    setEditingClient(client);
    setEditPlan(client.plan);
    setEditName(client.name);
    setEditEmail(client.email);
    setEditMrr(client.mrr);
    setEditStatus(client.status);
    setEditFeatures(client.features || []);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    
    try {
      await api.updateTenant(editingClient.id, { 
        plan: editPlan, 
        mrr: Number(editMrr),
        name: editName,
        email: editEmail,
        features: editFeatures
      });
      if (editStatus !== editingClient.status) {
        await api.updateTenantStatus(editingClient.id, editStatus);
      }
      await fetchClients();
      setIsEditModalOpen(false);
    } catch (err) {
      alert('Erro ao editar tenant: ' + (err as Error).message);
    }
  };

  const handleImpersonate = async (clientId: string) => {
    try {
      setImpersonating(clientId);
      await api.impersonate(clientId);
      router.push('/admin/dashboard');
    } catch (err) {
      alert('Erro ao realizar impersonation. Talvez o hotel não tenha um dono configurado corretamente no banco.');
    } finally {
      setImpersonating(null);
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
      alert(err.message || 'Erro ao excluir.');
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
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#050505] border border-white/10 rounded-[24px] p-8 shadow-2xl relative">
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

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Recursos Extras Habilitados</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AVAILABLE_FEATURES.map(feat => (
                      <label key={feat.id} onClick={() => toggleFeature(feat.id)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${editFeatures.includes(feat.id) ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${editFeatures.includes(feat.id) ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}>
                          {editFeatures.includes(feat.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-white/80">{feat.label}</span>
                      </label>
                    ))}
                  </div>
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
    </motion.div>
  );
}
