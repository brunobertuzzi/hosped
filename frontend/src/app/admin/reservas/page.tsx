'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Search, Plus, Filter, MoreVertical, 
  CheckCircle, XCircle, Clock, User, DoorOpen, CreditCard, ArrowRight, Save
} from 'lucide-react';
import { useActiveBranchData } from '../../../store/useTenantStore';
import { motion, AnimatePresence } from 'framer-motion';
import { api, request } from '../../../lib/api';
import { alerts } from '../../../lib/alerts';

export default function AdminReservasPage() {
  const { reservations, guests, rooms, roomCategories, addReservation, addAuditLog, user } = useActiveBranchData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);

  // New Reservation State
  const [newRes, setNewRes] = useState({
    guestId: '',
    categoryId: '',
    checkIn: '',
    checkOut: '',
    valorPersonalizado: '',
    origem: 'BALCAO'
  });

  // Filter Data
  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const guest = guests.find(g => g.id === res.guestId);
      const matchesSearch = guest?.nome.toLowerCase().includes(searchTerm.toLowerCase()) || res.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || res.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.dataCheckIn).getTime() - new Date(a.dataCheckIn).getTime());
  }, [reservations, guests, searchTerm, statusFilter]);

  const selectedCategory = useMemo(() => roomCategories.find(c => c.id === newRes.categoryId), [newRes.categoryId, roomCategories]);
  
  const dias = useMemo(() => {
    if(!newRes.checkIn || !newRes.checkOut) return 0;
    const diff = new Date(newRes.checkOut).getTime() - new Date(newRes.checkIn).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)));
  }, [newRes.checkIn, newRes.checkOut]);

  const valorCalculado = (selectedCategory?.valorBase || 0) * dias;

  const handleSave = async () => {
    if (!newRes.guestId || !newRes.categoryId || !newRes.checkIn || !newRes.checkOut) {
      alerts.error('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }
    
    const finalValue = newRes.valorPersonalizado ? Number(newRes.valorPersonalizado) : valorCalculado;
    
    try {
      await request('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          guestId: newRes.guestId,
          categoryId: newRes.categoryId,
          dataCheckIn: newRes.checkIn,
          dataCheckOut: newRes.checkOut,
          valorTotal: finalValue,
          status: 'CONFIRMADA',
          origem: 'BALCAO'
        })
      });

      await api.getReservations();

      addAuditLog({
        id: 'a_' + Date.now(),
        usuario: user?.nome || 'Admin',
        data: new Date().toISOString(),
        acao: 'CRIAR',
        entidade: 'RESERVATION',
        detalhes: `Reserva de balcão criada manualmente.`
      });

      setIsModalOpen(false);
      setStep(1);
      setNewRes({ guestId: '', categoryId: '', checkIn: '', checkOut: '', valorPersonalizado: '', origem: 'BALCAO' });
      alerts.success('Reserva criada com sucesso!');
    } catch (err: any) {
      alerts.error('Erro ao criar reserva', err.message);
    }
  };

  const handleEditStatus = async (id: string, currentStatus: string) => {
    const status = await alerts.prompt('Novo Status', currentStatus, 'CONFIRMADA, HOSPEDADO, CHECK_OUT_REALIZADO, CANCELADA');
    if (status) {
      try {
        await api.updateReservation(id, { status: status.toUpperCase() });
        alerts.success('Status atualizado!');
      } catch (err: any) {
        alerts.error('Erro ao atualizar', err.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await alerts.confirm('Cancelar Reserva', 'Tem certeza que deseja cancelar/excluir esta reserva?');
    if (isConfirmed) {
      try {
        await api.deleteReservation(id);
        alerts.success('Reserva excluída!');
      } catch (err: any) {
        alerts.error('Erro ao excluir', err.message);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMADA': return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 w-fit"><CheckCircle className="w-3 h-3" /> Confirmada</span>;
      case 'HOSPEDADO': return <span className="px-2.5 py-1 bg-brand/10 text-brand border border-brand/20 rounded-md text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 w-fit"><DoorOpen className="w-3 h-3" /> In House</span>;
      case 'CANCELADA': return <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 w-fit"><XCircle className="w-3 h-3" /> Cancelada</span>;
      default: return <span className="px-2.5 py-1 bg-white/10 text-white border border-white/20 rounded-md text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 w-fit"><Clock className="w-3 h-3" /> Pendente</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reservas (PMS)</h1>
          <p className="text-[13px] text-white/50">Gerencie e crie reservas do balcão e telefone.</p>
        </div>
        
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2.5 bg-brand hover:brightness-110 text-black text-[13px] font-bold rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_-3px_var(--brand-primary)]">
          <Plus className="w-4 h-4" /> Nova Reserva
        </button>
      </div>

      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between bg-black/20">
          <div className="flex items-center gap-2 w-full md:w-96">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input type="text" placeholder="Buscar por localizador ou hóspede..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[13px] text-white outline-none focus:border-brand transition-colors" />
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {['ALL', 'CONFIRMADA', 'HOSPEDADO', 'CANCELADA'].map(status => (
              <button key={status} onClick={() => setStatusFilter(status)} className={`px-4 py-2 rounded-xl text-[11px] font-bold tracking-widest uppercase whitespace-nowrap transition-all border ${statusFilter === status ? 'bg-brand/10 border-brand/30 text-brand' : 'bg-transparent border-white/10 text-white/50 hover:bg-white/5'}`}>
                {status === 'ALL' ? 'Todas' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/40 text-[10px] uppercase tracking-widest text-white/40">
                <th className="p-4 font-bold">Localizador / Origem</th>
                <th className="p-4 font-bold">Hóspede</th>
                <th className="p-4 font-bold">Período</th>
                <th className="p-4 font-bold">Acomodação</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[13px]">
              {filteredReservations.map(res => {
                const guest = guests.find(g => g.id === res.guestId);
                const category = roomCategories.find(c => c.id === res.categoryId);
                return (
                  <tr key={res.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-brand font-bold">{res.id}</span>
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{res.origem}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{guest?.nome || 'Hóspede Deletado'}</p>
                          <p className="text-[11px] text-white/40">{guest?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 font-mono text-[11px] text-white/60">
                        <span>IN: {res.dataCheckIn}</span>
                        <span>OUT: {res.dataCheckOut}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-white font-medium">{category?.nome}</p>
                      {res.roomId && <p className="text-[11px] text-brand">Quarto alocado</p>}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(res.status)}
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-3">
                      <span className="font-mono font-bold text-white whitespace-nowrap">R$ {Number(res.valorTotal).toFixed(2)}</span>
                      <button onClick={() => handleEditStatus(res.id, res.status)} className="text-[10px] text-white/40 hover:text-brand uppercase font-bold tracking-widest">Status</button>
                      <button onClick={() => handleDelete(res.id)} className="text-white/40 hover:text-red-400"><XCircle className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
              {filteredReservations.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-white/40 text-[13px]">Nenhuma reserva encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NOVA RESERVA */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Nova Reserva Manual</h2>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-brand mt-1 flex items-center gap-1"><Plus className="w-3 h-3" /> Origem: Balcão/Telefone</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"><XCircle className="w-5 h-5" /></button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-8">
                
                {/* Etapas Progress */}
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full ${step >= i ? 'bg-brand' : 'bg-white/10'}`} />
                  ))}
                </div>

                {step === 1 && (
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/50 border-b border-white/5 pb-2">Passo 1: Datas</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Check-in</label>
                        <input type="date" value={newRes.checkIn} onChange={e => setNewRes({...newRes, checkIn: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner font-mono" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Check-out</label>
                        <input type="date" value={newRes.checkOut} onChange={e => setNewRes({...newRes, checkOut: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner font-mono" />
                      </div>
                    </div>
                    <button onClick={() => setStep(2)} disabled={!newRes.checkIn || !newRes.checkOut} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white text-[13px] font-bold rounded-xl transition-all disabled:opacity-50">Continuar</button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/50 border-b border-white/5 pb-2">Passo 2: Hóspede (CRM)</h3>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Buscar Hóspede Cadastrado</label>
                      <select value={newRes.guestId} onChange={e => setNewRes({...newRes, guestId: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner cursor-pointer">
                        <option value="" className="bg-black">-- Selecione um Hóspede --</option>
                        {guests.map(g => <option key={g.id} value={g.id} className="bg-black">{g.nome} ({g.documento})</option>)}
                      </select>
                      <p className="text-[10px] text-brand mt-2">* Para hóspedes novos, feche e cadastre na aba Hóspedes primeiro, ou selecione um existente.</p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => setStep(1)} className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-white/70 text-[13px] font-bold rounded-xl transition-all">Voltar</button>
                      <button onClick={() => setStep(3)} disabled={!newRes.guestId} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white text-[13px] font-bold rounded-xl transition-all disabled:opacity-50">Continuar</button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/50 border-b border-white/5 pb-2">Passo 3: Acomodação e Tarifa</h3>
                    
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Categoria de Quarto</label>
                      <select value={newRes.categoryId} onChange={e => setNewRes({...newRes, categoryId: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner cursor-pointer">
                        <option value="" className="bg-black">-- Selecione a Acomodação --</option>
                        {roomCategories.map(c => <option key={c.id} value={c.id} className="bg-black">{c.nome} - R$ {c.valorBase.toFixed(2)}/dia</option>)}
                      </select>
                    </div>

                    <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-4">
                      <div className="flex justify-between text-[13px] text-white/60">
                        <span>Diárias Calculadas</span>
                        <span className="font-mono">{dias} {dias === 1 ? 'dia' : 'dias'}</span>
                      </div>
                      <div className="flex justify-between text-[13px] text-white/60">
                        <span>Tarifa Padrão (Sem desconto)</span>
                        <span className="font-mono">R$ {valorCalculado.toFixed(2)}</span>
                      </div>
                      
                      <div className="pt-4 border-t border-white/5">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-brand mb-2">Tarifa Balcão Especial (Sobrescrever valor total)</label>
                        <input type="number" placeholder={`Ex: ${valorCalculado}`} value={newRes.valorPersonalizado} onChange={e => setNewRes({...newRes, valorPersonalizado: e.target.value})} className="w-full bg-brand/5 border border-brand/20 rounded-xl px-4 py-3 text-[13px] text-brand outline-none focus:border-brand font-mono" />
                        <p className="text-[10px] text-white/30 mt-1">Deixe em branco para usar a tarifa padrão de R$ {valorCalculado.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/5">
                      <button onClick={() => setStep(2)} className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-white/70 text-[13px] font-bold rounded-xl transition-all">Voltar</button>
                      <button onClick={handleSave} disabled={!newRes.categoryId} className="flex-1 py-3 bg-brand hover:brightness-110 text-black text-[13px] font-bold rounded-xl transition-all shadow-[0_0_15px_-3px_var(--brand-primary)] flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" /> Criar Reserva
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
