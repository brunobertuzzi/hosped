'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToggleLeft, Plus, Search, CheckCircle2, ShieldAlert, Users, Trash2 } from 'lucide-react';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean; // Global flag
  tenantIds: string[]; // Tenants with access if not global
  createdAt: string;
}

const mockFlags: FeatureFlag[] = [
  {
    id: 'ff_1',
    name: 'BETA_CHANNEL_MANAGER',
    description: 'Acesso antecipado ao novo Channel Manager (Cloudbeds Sync).',
    isEnabled: false,
    tenantIds: ['tenant_123', 'tenant_456'],
    createdAt: '2023-10-01T10:00:00Z'
  },
  {
    id: 'ff_2',
    name: 'ADVANCED_DUNNING',
    description: 'Módulo de inadimplência avançada com réguas de cobrança.',
    isEnabled: true,
    tenantIds: [],
    createdAt: '2023-09-15T14:30:00Z'
  },
  {
    id: 'ff_3',
    name: 'AI_REVIEWS_REPLY',
    description: 'Respostas automáticas para reviews usando IA.',
    isEnabled: false,
    tenantIds: ['tenant_789'],
    createdAt: '2023-10-10T09:15:00Z'
  }
];

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>(mockFlags);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleGlobal = (id: string) => {
    setFlags(flags.map(f => f.id === id ? { ...f, isEnabled: !f.isEnabled } : f));
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
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-[12px] font-bold tracking-wide transition-colors flex items-center gap-2">
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
                      {flag.tenantIds.length} Tenants Liberados
                    </div>
                  )}

                  <div className="h-8 w-px bg-white/10 hidden md:block"></div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[11px] uppercase tracking-widest font-bold text-white/40">Global</span>
                      <div 
                        onClick={() => toggleGlobal(flag.id)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${flag.isEnabled ? 'bg-indigo-500' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          layout
                          className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] ${flag.isEnabled ? 'left-[22px]' : 'left-[3px]'}`}
                        />
                      </div>
                    </label>

                    <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-white/30 hover:text-red-400 transition-colors flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredFlags.length === 0 && (
            <div className="py-12 text-center text-white/30 text-xs font-medium uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">
              Nenhuma flag encontrada
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
