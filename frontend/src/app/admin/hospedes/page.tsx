'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Filter, History, Mail, Phone, 
  MapPin, Star, ChevronRight, BedDouble, Edit, Plus, XCircle, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenantStore, useActiveBranchData } from '../../../store/useTenantStore';
import { api, request } from '../../../lib/api';
import { alerts } from '../../../lib/alerts';
import { formatDocument, formatPhone } from '../../../lib/masks';

export default function HospedesPage() {
  const { guests, reservations, hotel, addGuest, updateGuest } = useActiveBranchData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nome: '', documento: '', email: '', telefone: '' });

  const handleOpenModal = (guest?: any) => {
    if (guest) {
      setEditingGuestId(guest.id);
      setFormData({ nome: guest.nome, documento: guest.documento, email: guest.email, telefone: guest.telefone });
    } else {
      setEditingGuestId(null);
      setFormData({ nome: '', documento: '', email: '', telefone: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.documento) {
      alerts.error('Atenção', 'Nome e Documento são obrigatórios.');
      return;
    }

    try {
      if (editingGuestId) {
        await api.updateGuest(editingGuestId, formData);
      } else {
        await request('/guests', {
          method: 'POST',
          body: JSON.stringify({ ...formData })
        });
        await api.getGuests();
      }
      setIsModalOpen(false);
      alerts.success('Hóspede salvo com sucesso!');
    } catch (err: any) {
      alerts.error('Erro ao salvar hóspede', err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await alerts.confirm('Excluir Hóspede', 'Tem certeza que deseja excluir este hóspede?');
    if (isConfirmed) {
      try {
        await api.deleteGuest(id);
        if (selectedGuestId === id) setSelectedGuestId(null);
        alerts.success('Hóspede excluído!');
      } catch (err: any) {
        alerts.error('Erro ao excluir', err.message);
      }
    }
  };

  // Calcular métricas agregadas por hóspede
  const guestsWithMetrics = useMemo(() => {
    return guests.map(guest => {
      const guestReservations = reservations.filter(r => r.guestId === guest.id);
      const totalGasto = guestReservations.reduce((sum, res) => sum + Number(res.valorTotal), 0);
      const isVip = totalGasto > 1000 || guestReservations.length >= 3;
      
      return {
        ...guest,
        totalReservations: guestReservations.length,
        totalGasto,
        isVip,
        lastReservation: guestReservations.sort((a, b) => new Date(b.dataCheckIn).getTime() - new Date(a.dataCheckIn).getTime())[0]
      };
    });
  }, [guests, reservations]);

  const filteredGuests = useMemo(() => {
    return guestsWithMetrics.filter(g => 
      g.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      g.documento.includes(searchTerm) ||
      g.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [guestsWithMetrics, searchTerm]);

  const selectedGuest = useMemo(() => guestsWithMetrics.find(g => g.id === selectedGuestId), [guestsWithMetrics, selectedGuestId]);
  const selectedGuestReservations = useMemo(() => reservations.filter(r => r.guestId === selectedGuestId).sort((a, b) => new Date(b.dataCheckIn).getTime() - new Date(a.dataCheckIn).getTime()), [reservations, selectedGuestId]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            CRM & Base de Hóspedes
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Gestão de relacionamento corporativo e fidelidade.</p>
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-[11px] font-bold text-white uppercase tracking-widest">
          Total Base: {guests.length} Clientes
        </div>
      </div>
      <div className="flex gap-4">
        <button onClick={() => handleOpenModal()} className="px-4 py-2.5 bg-brand hover:brightness-110 text-black text-[13px] font-bold rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_-3px_var(--brand-primary)]">
          <Plus className="w-4 h-4" /> Novo Hóspede
        </button>
      </div>

      {/* Busca e Tabela Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lista de Hóspedes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Pesquisar por nome, CPF ou e-mail..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[13px] text-white placeholder-white/30 outline-none focus:border-brand transition-colors" 
            />
          </div>

          <div className="bg-black border border-white/[0.04] rounded-[24px] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.04] text-white/30 uppercase tracking-widest font-bold text-[10px]">
                    <th className="py-4 px-6">Hóspede</th>
                    <th className="py-4 px-4">Documento</th>
                    <th className="py-4 px-4 text-center">Reservas</th>
                    <th className="py-4 px-6 text-right">LTV (Gasto Total)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {filteredGuests.map(guest => (
                    <tr 
                      key={guest.id} 
                      onClick={() => setSelectedGuestId(guest.id)}
                      className={`cursor-pointer transition-colors group ${selectedGuestId === guest.id ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]'}`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${guest.isVip ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-white/5 text-white/60 border border-white/10'}`}>
                            {guest.nome.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-white/90 block">{guest.nome}</span>
                            {guest.isVip && <span className="text-[9px] uppercase tracking-widest text-amber-500 font-bold">Cliente VIP</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-white/40 text-[11px]">{guest.documento}</td>
                      <td className="py-4 px-4 text-center font-bold text-white/60">{guest.totalReservations}</td>
                      <td className="py-4 px-6 text-right font-medium text-emerald-400 font-mono tracking-tight">R$ {guest.totalGasto.toFixed(2)}</td>
                    </tr>
                  ))}
                  {filteredGuests.length === 0 && (
                    <tr><td colSpan={4} className="py-16 text-center text-white/30 text-xs">Nenhum cliente localizado na base.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Perfil Detalhado Lateral */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedGuest ? (
              <motion.div 
                key={selectedGuest.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-panel p-6 rounded-[24px] border border-white/5 space-y-6 sticky top-6"
              >
                <div className="flex items-start justify-between gap-4 pb-6 border-b border-white/5">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-xl ${selectedGuest.isVip ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-500 border border-amber-500/30 glow-brand' : 'bg-white/5 text-white/70 border border-white/10'}`}>
                      {selectedGuest.nome.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white leading-tight">{selectedGuest.nome}</h2>
                      <span className="text-[11px] text-white/40 font-mono mt-1 block">ID: {selectedGuest.id}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModal(selectedGuest)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors" title="Editar Hóspede">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(selectedGuest.id)} className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors" title="Excluir Hóspede">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase font-bold tracking-widest text-white/30">Dados de Contato</h3>
                  <div className="space-y-3 text-[13px]">
                    <div className="flex items-center gap-3 text-white/70">
                      <Mail className="w-4 h-4 text-brand shrink-0" /> {selectedGuest.email}
                    </div>
                    <div className="flex items-center gap-3 text-white/70">
                      <Phone className="w-4 h-4 text-brand shrink-0" /> {selectedGuest.telefone}
                    </div>
                    <div className="flex items-center gap-3 text-white/70 font-mono">
                      <Users className="w-4 h-4 text-brand shrink-0" /> {selectedGuest.documento}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <h3 className="text-[10px] uppercase font-bold tracking-widest text-white/30">Métricas Vitais</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                      <span className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Lifetime Value</span>
                      <span className="text-lg font-bold text-emerald-400 font-mono">R$ {selectedGuest.totalGasto.toFixed(2)}</span>
                    </div>
                    <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                      <span className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Visitas</span>
                      <span className="text-lg font-bold text-white/80 font-mono">{selectedGuest.totalReservations}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <h3 className="text-[10px] uppercase font-bold tracking-widest text-white/30 flex items-center gap-2">
                    <History className="w-3.5 h-3.5" /> Últimas Reservas
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {selectedGuestReservations.map(res => (
                      <div key={res.id} className="p-3 bg-black border border-white/5 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/40 font-mono uppercase">#{res.id.substring(0, 8)}</span>
                          <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                            res.status === 'HOSPEDADO' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            res.status === 'CHECK_OUT_REALIZADO' ? 'bg-white/5 text-white/40 border border-white/10' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {res.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-white/70">
                          <BedDouble className="w-3 h-3 text-white/30" />
                          {res.dataCheckIn} <ArrowRightIcon className="w-3 h-3 mx-1 opacity-40" /> {res.dataCheckOut}
                        </div>
                        <div className="text-[11px] font-medium text-white/80 pt-1">
                          Total da conta: R$ {Number(res.valorTotal).toFixed(2)}
                        </div>
                      </div>
                    ))}
                    {selectedGuestReservations.length === 0 && (
                      <div className="text-[11px] text-white/30 text-center py-4">Sem histórico de reservas.</div>
                    )}
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] border border-dashed border-white/10 rounded-[24px] flex flex-col items-center justify-center text-center p-8 text-white/30">
                <Users className="w-8 h-8 mb-4 opacity-50" />
                <p className="text-[13px]">Selecione um hóspede na lista para visualizar o dossiê completo de CRM.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* MODAL CRIAR/EDITAR HÓSPEDE */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
              
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">{editingGuestId ? 'Editar Hóspede' : 'Novo Hóspede'}</h2>
                  <p className="text-[11px] font-medium text-white/40 mt-1">Dados de contato do CRM</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"><XCircle className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Nome Completo *</label>
                  <input type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner" placeholder="Ex: João da Silva" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">CPF / Passaporte *</label>
                  <input type="text" value={formData.documento} onChange={e => setFormData({...formData, documento: formatDocument(e.target.value)})} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner" placeholder="Ex: 123.456.789-00" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">E-mail</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner" placeholder="Ex: joao@email.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Telefone (WhatsApp)</label>
                  <input type="text" value={formData.telefone} onChange={e => setFormData({...formData, telefone: formatPhone(e.target.value)})} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner" placeholder="Ex: (11) 98888-7777" />
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-black/40 flex gap-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-white/70 text-[13px] font-bold rounded-xl transition-all">Cancelar</button>
                <button onClick={handleSave} className="flex-1 py-3 bg-brand hover:brightness-110 text-black text-[13px] font-bold rounded-xl transition-all shadow-[0_0_15px_-3px_var(--brand-primary)] flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Salvar
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}
