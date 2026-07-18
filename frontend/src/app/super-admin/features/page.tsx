'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToggleLeft, Plus, Search, CheckCircle2, ShieldAlert, Users, Trash2, X, Loader2 } from 'lucide-react';
import { api } from '../../../lib/api';
import { toast } from 'sonner';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean; // Global flag
  tenantIds: string[]; // Tenants with access if not global
  createdAt: string;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const data = await api.getFeatureFlags();
      setFlags(data || []);
    } catch (err) {
      console.error('Erro ao buscar feature flags', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const toggleGlobal = async (id: string, currentStatus: boolean, flag: FeatureFlag) => {
    try {
      setFlags(flags.map(f => f.id === id ? { ...f, isEnabled: !currentStatus } : f));
      await api.updateFeatureFlag(id, { ...flag, isEnabled: !currentStatus });
    } catch (err) {
      toast.error('Erro ao atualizar flag.');
      fetchFlags(); // revert
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta Feature Flag?')) return;
    try {
      await api.deleteFeatureFlag(id);
      setFlags(flags.filter(f => f.id !== id));
    } catch (err) {
      toast.error('Erro ao excluir flag.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFeatureFlag({
        name: newName,
        description: newDesc,
        isEnabled: false,
        tenantIds: []
      });
      setIsAddModalOpen(false);
      setNewName('');
      setNewDesc('');
      fetchFlags();
    } catch (err: any) {
      toast.error('Erro ao criar flag: ' + (err.message || 'Desconhecido'));
    }
  };

  const filteredFlags = flags.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight flex items-center gap-3">
            Feature Flags
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Controle o acesso a novas funcionalidades em Beta ou módulos Premium.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-[12px] font-bold tracking-wide transition-colors flex items-center gap-2 shadow-[0_0_20px_-5px_#6366f1]">
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
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-4">
          {loading && flags.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center">
               <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-4" />
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
                          onClick={() => toggleGlobal(flag.id, flag.isEnabled, flag)}
                          className={`w-10 h-5 rounded-full relative transition-colors ${flag.isEnabled ? 'bg-indigo-500' : 'bg-white/10'}`}
                        >
                          <motion.div
                            layout
                            className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] ${flag.isEnabled ? 'left-[22px]' : 'left-[3px]'}`}
                          />
                        </div>
                      </label>

                      <button onClick={() => handleDelete(flag.id)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-white/30 hover:text-red-400 transition-colors flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {!loading && filteredFlags.length === 0 && (
            <div className="py-12 text-center text-white/30 text-xs font-medium uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">
              Nenhuma flag encontrada
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Flag */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#050505] border border-white/10 rounded-[24px] p-8 shadow-2xl relative">
              <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 text-white/30 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
              <h2 className="text-xl font-bold text-white mb-6">Criar Feature Flag</h2>
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Nome da Flag (ex: BETA_CHANNEL)</label>
                  <input required type="text" value={newName} onChange={e => setNewName(e.target.value.toUpperCase().replace(/\s+/g, '_'))} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Descrição</label>
                  <textarea required value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500" />
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
    </motion.div>
  );
}
