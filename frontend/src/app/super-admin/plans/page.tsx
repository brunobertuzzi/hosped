'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  X, 
  Layers, 
  Users, 
  Building2,
  Bed,
  RefreshCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../lib/api';

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [maxBranches, setMaxBranches] = useState('');
  const [maxRooms, setMaxRooms] = useState('');
  const [maxUsers, setMaxUsers] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await api.getSystemPlans();
      setPlans(data);
    } catch (err: any) {
      toast.error('Erro ao carregar os planos.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (plan?: any) => {
    if (plan) {
      setEditingPlan(plan);
      setName(plan.name);
      setDescription(plan.description || '');
      setPrice(plan.price.toString());
      setMaxBranches(plan.maxBranches.toString());
      setMaxRooms(plan.maxRooms?.toString() || '-1');
      setMaxUsers(plan.maxUsers.toString());
      setFeaturesText(plan.features ? plan.features.join('\n') : '');
      setIsActive(plan.isActive);
    } else {
      setEditingPlan(null);
      setName('');
      setDescription('');
      setPrice('');
      setMaxBranches('1');
      setMaxRooms('20');
      setMaxUsers('5');
      setFeaturesText('');
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        name,
        description,
        price: parseFloat(price),
        maxBranches: parseInt(maxBranches, 10),
        maxRooms: parseInt(maxRooms, 10),
        maxUsers: parseInt(maxUsers, 10),
        features: featuresText.split('\n').filter(f => f.trim() !== ''),
        isActive,
      };

      if (editingPlan) {
        await api.updateSystemPlan(editingPlan.id, data);
        toast.success('Plano atualizado com sucesso!');
      } else {
        await api.createSystemPlan(data);
        toast.success('Plano criado com sucesso!');
      }
      closeModal();
      fetchPlans();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar o plano.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;
    try {
      await api.deleteSystemPlan(id);
      toast.success('Plano excluído com sucesso.');
      fetchPlans();
    } catch (err: any) {
      toast.error('Erro ao excluir o plano. Pode haver hotéis utilizando ele.');
    }
  };

  return (
    <div className="p-8 space-y-8 pb-20 relative">
      {/* HEADER ESTATÍSTICAS / TÍTULO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-inner">
              <CreditCard className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">
              Planos e Preços
            </h1>
          </div>
          <p className="text-white/40 text-sm max-w-xl">
            Gerencie as assinaturas, limites e os valores cobrados dos seus clientes (Hotéis).
          </p>
        </div>

        <button 
          onClick={() => openModal()}
          className="bg-white text-black hover:bg-white/90 font-bold py-3 px-6 rounded-xl text-sm transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-white/10"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Plano</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/50 space-y-4">
          <RefreshCcw className="w-8 h-8 animate-spin" />
          <p className="animate-pulse">Carregando planos...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-white/5 flex flex-col items-center justify-center">
          <Layers className="w-12 h-12 text-white/20 mb-4" />
          <h3 className="text-lg font-medium text-white/80">Nenhum plano configurado</h3>
          <p className="text-sm text-white/40 mt-2 max-w-sm mx-auto mb-6">
            Você ainda não possui planos de assinatura. Crie o seu primeiro plano para poder vender o sistema.
          </p>
          <button onClick={() => openModal()} className="px-5 py-2.5 bg-white/10 hover:bg-white/15 rounded-lg text-sm text-white font-medium transition-colors border border-white/10">
            Criar Primeiro Plano
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={plan.id}
              className={`glass-panel p-6 rounded-3xl border transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden ${
                plan.isActive ? 'border-purple-500/20 hover:border-purple-500/40 shadow-lg hover:shadow-purple-500/10' : 'border-white/5 opacity-70 grayscale'
              }`}
            >
              {/* Background gradient hint */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-colors" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-wider text-sm">{plan.name}</h3>
                  {plan.description && <p className="text-xs text-white/50 line-clamp-2">{plan.description}</p>}
                </div>
                {!plan.isActive && (
                  <span className="text-[10px] font-bold px-2 py-1 bg-red-500/10 text-red-400 rounded-md border border-red-500/20">INATIVO</span>
                )}
              </div>

              <div className="mb-6 relative z-10">
                <span className="text-3xl font-black text-white tracking-tight">
                  R$ {Number(plan.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-white/40 text-xs ml-1 font-medium">/mês</span>
              </div>

              <div className="space-y-4 mb-8 relative z-10">
                <div className="flex items-center gap-3 text-sm text-white/70">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white/90">Até {plan.maxBranches} Filiais</p>
                    <p className="text-xs text-white/40">Hotéis por conta</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-white/70">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Bed className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white/90">{plan.maxRooms === -1 ? 'Quartos Ilimitados' : `Até ${plan.maxRooms} Quartos`}</p>
                    <p className="text-xs text-white/40">Unidades habitacionais</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-white/70">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white/90">Até {plan.maxUsers} Usuários</p>
                    <p className="text-xs text-white/40">Funcionários ativos</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Recursos</p>
                  <ul className="space-y-2">
                    {plan.features.slice(0, 4).map((f: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-white/60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-xs text-purple-400 font-medium pl-5">+ {plan.features.length - 4} recursos adicionais</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="flex gap-2 relative z-10 mt-auto">
                <button 
                  onClick={() => openModal(plan)}
                  className="flex-1 px-3 py-2 bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/50 rounded-xl text-[10px] uppercase font-bold tracking-widest text-white/60 hover:text-indigo-400 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar
                </button>
                <button 
                  onClick={() => handleDelete(plan.id)}
                  className="w-12 shrink-0 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 rounded-xl text-white/60 hover:text-red-400 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel w-full max-w-md relative z-10 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  {editingPlan ? 'Editar Plano' : 'Novo Plano'}
                </h2>
                <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="plan-form" onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Nome do Plano</label>
                      <input 
                        required
                        type="text" 
                        value={name} onChange={e => setName(e.target.value)}
                        placeholder="Ex: PRO, PREMIUM"
                        className="w-full input-premium rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Preço Mensal (R$)</label>
                      <input 
                        required
                        type="number" step="0.01" min="0"
                        value={price} onChange={e => setPrice(e.target.value)}
                        placeholder="Ex: 299.90"
                        className="w-full input-premium rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Lim. Filiais</label>
                      <input 
                        required
                        type="number" min="1"
                        value={maxBranches} onChange={e => setMaxBranches(e.target.value)}
                        className="w-full input-premium rounded-xl px-4 py-2.5 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Lim. Quartos (-1 ilimitado)</label>
                      <input 
                        required
                        type="number" min="-1"
                        value={maxRooms} onChange={e => setMaxRooms(e.target.value)}
                        className="w-full input-premium rounded-xl px-4 py-2.5 text-sm text-white"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Lim. Usuários</label>
                      <input 
                        required
                        type="number" min="1"
                        value={maxUsers} onChange={e => setMaxUsers(e.target.value)}
                        className="w-full input-premium rounded-xl px-4 py-2.5 text-sm text-white"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Descrição Rápida</label>
                      <input 
                        type="text" 
                        value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="Para hotéis em crescimento..."
                        className="w-full input-premium rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Recursos (um por linha)</label>
                      <textarea 
                        rows={4}
                        value={featuresText} onChange={e => setFeaturesText(e.target.value)}
                        placeholder="Gestão de reservas&#10;Motor de reservas&#10;Nota Fiscal Eletrônica"
                        className="w-full input-premium rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 resize-none"
                      />
                    </div>

                    <div className="col-span-2 flex items-center gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setIsActive(!isActive)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${isActive ? 'bg-purple-500' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          className="w-4 h-4 rounded-full bg-white absolute top-1"
                          animate={{ left: isActive ? '26px' : '4px' }}
                        />
                      </button>
                      <span className="text-sm text-white/70 font-medium">Plano Ativo para Vendas</span>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-5 border-t border-white/5 bg-black/20 flex gap-3">
                <button 
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  form="plan-form"
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-white text-black hover:bg-white/90 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Plano'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
