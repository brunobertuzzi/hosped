'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Plus, Search, Megaphone, Info, AlertTriangle, CheckCircle2, Calendar, Trash2 } from 'lucide-react';

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

const mockAnnouncements: Announcement[] = [
  {
    id: 'ann_1',
    title: 'Nova Funcionalidade: Gestão de Inadimplência',
    content: 'Agora você pode acompanhar as faturas pendentes dos seus clientes diretamente pelo novo módulo financeiro.',
    type: 'RELEASE_NOTES',
    isActive: true,
    targetPlans: ['PRO', 'ENTERPRISE'],
    createdAt: '2023-10-25T10:00:00Z'
  },
  {
    id: 'ann_2',
    title: 'Manutenção Programada (Mercado Pago)',
    content: 'Ocorrerá uma manutenção na integração com o Mercado Pago neste Domingo das 02:00 às 04:00.',
    type: 'WARNING',
    isActive: true,
    targetPlans: [],
    createdAt: '2023-10-24T15:30:00Z'
  },
  {
    id: 'ann_3',
    title: 'Bem-vindos ao Hosped v2!',
    content: 'Estamos felizes em anunciar a nova interface para todos os usuários.',
    type: 'INFO',
    isActive: false,
    targetPlans: [],
    createdAt: '2023-09-01T09:00:00Z'
  }
];

export default function BroadcastPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleActive = (id: string) => {
    setAnnouncements(announcements.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const filteredAnnouncements = announcements.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight flex items-center gap-3">
            Central de Anúncios
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Crie comunicados e release notes para todos os tenants da plataforma.</p>
        </div>
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-[12px] font-bold tracking-wide transition-colors flex items-center gap-2">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        onClick={() => toggleActive(announcement.id)}
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
                    
                    <button className="text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {filteredAnnouncements.length === 0 && (
          <div className="py-12 text-center text-white/30 text-xs font-medium uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">
            Nenhum anúncio encontrado
          </div>
        )}
      </div>
    </motion.div>
  );
}
