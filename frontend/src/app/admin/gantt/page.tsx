'use client';

import React, { useState } from 'react';
import {
  Calendar, ClipboardList, Bed, CheckCircle2, CreditCard, ChevronRight,
  ShoppingBag, Trash2, KeyRound, User, AlertTriangle, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenantStore, useActiveBranchData } from '../../../store/useTenantStore';
import { api } from '../../../lib/api';
import { toast } from 'sonner';
import { useModule } from '../../../hooks/useModule';

export default function AdminGanttPage() {
  const store = useTenantStore();
  const { rooms, reservations, inventory, guests, user } = useActiveBranchData();
  const canUseGantt = useModule('GANTT_CHART');
  const [selectedResForDetail, setSelectedResForDetail] = useState<any>(null);

  // Guard: módulo não habilitado para este hotel
  if (!canUseGantt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-white/20" />
        </div>
        <h2 className="text-xl font-bold text-white/60 mb-2">Módulo não disponível</h2>
        <p className="text-sm text-white/30 max-w-sm">
          O Mapa de Ocupação (Gantt) não está habilitado no plano atual. Entre em contato com o suporte para ativar este módulo.
        </p>
      </div>
    );
  }

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() - 6); // Hoje fica como o 7º dia (no meio)
    return today;
  });

  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [checkInDoc, setCheckInDoc] = useState('');
  const [checkInRoomId, setCheckInRoomId] = useState('');

  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  const [consumptionItemId, setConsumptionItemId] = useState('');
  const [consumptionQty, setConsumptionQty] = useState(1);

  const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getHeaderLabel = (d: Date) => {
    const todayStr = formatDateISO(new Date());
    const dStr = formatDateISO(d);
    if (dStr === todayStr) {
      return 'Hoje';
    }
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${day}/${monthNames[d.getMonth()]}`;
  };

  const dates = Array.from({ length: 14 }).map((_, idx) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + idx);
    return d;
  });

  const triggerCheckIn = async () => {
    if (!selectedResForDetail) return;
    try {
      await api.checkIn(selectedResForDetail.id, checkInDoc, checkInRoomId);
      setIsCheckInModalOpen(false); setSelectedResForDetail(null); setCheckInDoc(''); setCheckInRoomId('');
    } catch (err: any) { toast.error(err.message); }
  };

  const triggerAddConsumption = async () => {
    if (!selectedResForDetail || !consumptionItemId) return;
    try {
      await api.addConsumption(selectedResForDetail.id, consumptionItemId, consumptionQty);
      setIsConsumptionModalOpen(false); setSelectedResForDetail(null); setConsumptionItemId(''); setConsumptionQty(1);
    } catch (err: any) { toast.error(err.message); }
  };

  const handlePixPayment = async () => {
    if (!selectedResForDetail) return;
    const paid = (selectedResForDetail.payments || []).reduce((sum: number, p: any) => sum + p.valor, 0);
    const balance = selectedResForDetail.valorTotal - paid;
    if (balance <= 0) return;

    try {
      await api.recordManualPayment(selectedResForDetail.id, balance, 'PIX');
      setSelectedResForDetail(null);
    } catch (err: any) { toast.error(err.message); }
  };

  const triggerCheckOut = async () => {
    if (!selectedResForDetail) return;
    try {
      await api.checkOut(selectedResForDetail.id);
      setSelectedResForDetail(null);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDragStart = (e: React.DragEvent, resId: string) => {
    e.dataTransfer.setData('resId', resId);
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDropOnTimeline = async (e: React.DragEvent, targetRoomId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-white/[0.08]');

    const resId = e.dataTransfer.getData('resId');
    if (!resId) return;

    const res = reservations.find(r => r.id === resId);
    if (!res) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    const width = rect.width;
    const percentX = Math.max(0, Math.min(1, dropX / width));

    const daysOffset = Math.floor(percentX * 14);

    const newStartDate = new Date(startDate);
    newStartDate.setDate(startDate.getDate() + daysOffset);
    newStartDate.setHours(12, 0, 0, 0);

    const oldCheckIn = new Date(res.dataCheckIn + (res.dataCheckIn.includes('T') ? '' : 'T12:00:00'));
    const oldCheckOut = new Date(res.dataCheckOut + (res.dataCheckOut.includes('T') ? '' : 'T12:00:00'));
    const duration = oldCheckOut.getTime() - oldCheckIn.getTime();

    const newEndDate = new Date(newStartDate.getTime() + duration);

    const newDataCheckIn = newStartDate.toISOString().split('T')[0];
    const newDataCheckOut = newEndDate.toISOString().split('T')[0];

    store.updateReservation(resId, {
      roomId: targetRoomId,
      dataCheckIn: newDataCheckIn,
      dataCheckOut: newDataCheckOut
    });

    try {
      await api.updateReservation(resId, {
        roomId: targetRoomId,
        dataCheckIn: newStartDate.toISOString(),
        dataCheckOut: newEndDate.toISOString()
      });
    } catch (err: any) {
      console.warn("Could not sync drop with API yet, but updated locally.", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDragEnter = (e: React.DragEvent) => {
    e.currentTarget.classList.add('bg-white/[0.08]');
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-white/[0.08]');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8 pb-20">
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Mapa de Ocupação
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Visualize todas as reservas dos quartos em uma linha do tempo.</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-[24px] overflow-x-auto relative">
        <div className="flex items-center justify-between gap-4 mb-6 min-w-[1300px]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = new Date(startDate);
                d.setDate(d.getDate() - 14);
                setStartDate(d);
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/5"
            >
              &larr; 14 Dias
            </button>
            <button
              onClick={() => {
                const d = new Date(startDate);
                d.setMonth(d.getMonth() - 1);
                setStartDate(d);
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/5"
            >
              Mês Anterior
            </button>
            <button
              onClick={() => {
                const today = new Date();
                today.setDate(today.getDate() - 6);
                setStartDate(today);
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-brand rounded-xl text-xs font-bold transition-all border border-brand/20"
            >
              Hoje
            </button>
            <button
              onClick={() => {
                const d = new Date(startDate);
                d.setMonth(d.getMonth() + 1);
                setStartDate(d);
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/5"
            >
              Próximo Mês
            </button>
            <button
              onClick={() => {
                const d = new Date(startDate);
                d.setDate(d.getDate() + 14);
                setStartDate(d);
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/5"
            >
              14 Dias &rarr;
            </button>
          </div>
          <span className="text-sm font-bold text-white/70 uppercase tracking-widest bg-white/[0.02] border border-white/5 px-4 py-2 rounded-xl">
            {startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="gantt-grid grid gap-1 border-b border-white/5 pb-4 mb-3 text-[10px] text-white/30 uppercase tracking-widest font-bold text-center min-w-[1300px]">
          <div className="text-left text-white/60">Acomodações</div>
          {dates.map((d, idx) => {
            const isToday = formatDateISO(d) === formatDateISO(new Date());
            return (
              <div
                key={idx}
                className={isToday ? "text-brand border border-brand/30 bg-brand/10 rounded-lg p-1 flex items-center justify-center" : "flex items-center justify-center p-1"}
              >
                {getHeaderLabel(d)}
              </div>
            );
          })}
        </div>

        <div className="space-y-2.5 min-w-[1300px]">
          {rooms.map(room => {
            const resList = reservations.filter(res => res.roomId === room.id);
            return (
              <div key={room.id} className="gantt-grid grid gap-1 items-center h-14 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] border border-white/5 transition-colors">
                <div className="flex items-center justify-between pr-4 border-r border-white/5 text-xs pl-4">
                  <div>
                    <div className="font-bold text-white/90 text-[13px]"># {room.numero}</div>
                    <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Standard</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full shrink-0 shadow-lg ${room.status === 'DISPONIVEL' ? 'bg-emerald-500 shadow-emerald-500/50' : room.status === 'OCUPADO' ? 'bg-brand shadow-brand/50' : 'bg-amber-500 shadow-amber-500/50'}`} />
                </div>

                <div
                  className="col-span-14 h-full relative flex items-center justify-start pointer-events-auto transition-colors duration-200"
                  onDrop={(e) => handleDropOnTimeline(e, room.id)}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                >
                  <div className="absolute inset-0 grid grid-cols-14 gap-1 opacity-[0.03] pointer-events-none">
                    {Array.from({ length: 14 }).map((_, idx) => <div key={idx} className="border-r border-white h-full" />)}
                  </div>

                  {resList.map((res: any) => {
                    const guest = guests.find(g => g.id === res.guestId);

                    const checkInDate = new Date(typeof res.dataCheckIn === 'string' && !res.dataCheckIn.includes('T') ? res.dataCheckIn + 'T12:00:00' : res.dataCheckIn);
                    const checkOutDate = new Date(typeof res.dataCheckOut === 'string' && !res.dataCheckOut.includes('T') ? res.dataCheckOut + 'T12:00:00' : res.dataCheckOut);

                    const startWindow = new Date(startDate);
                    startWindow.setHours(0,0,0,0);
                    const endWindow = new Date(dates[13]);
                    endWindow.setHours(23,59,59,999);

                    if (checkOutDate < startWindow || checkInDate > endWindow) return null;

                    const oneDay = 24 * 60 * 60 * 1000;

                    const dIn = new Date(checkInDate);
                    dIn.setHours(12,0,0,0);
                    const dOut = new Date(checkOutDate);
                    dOut.setHours(12,0,0,0);
                    const dStart = new Date(startWindow);
                    dStart.setHours(12,0,0,0);

                    let startDiffDays = (dIn.getTime() - dStart.getTime()) / oneDay;
                    if (startDiffDays < 0) startDiffDays = 0;

                    let endDiffDays = (dOut.getTime() - dStart.getTime()) / oneDay;
                    if (endDiffDays > 14) endDiffDays = 14;

                    const durationDays = endDiffDays - startDiffDays;
                    if (durationDays <= 0) return null;

                    const leftOffset = (startDiffDays / 14) * 100;
                    const widthPercent = (durationDays / 14) * 100;

                    let pillClass = 'bg-brand/20 border-brand text-brand hover:bg-brand/30';
                    if (res.status === 'CHECK_OUT_REALIZADO') pillClass = 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10';

                    return (
                      <button
                        key={res.id} onClick={() => setSelectedResForDetail(res)}
                        style={{ left: `${leftOffset}%`, width: `${widthPercent}%` }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, res.id)}
                        onDragEnd={handleDragEnd}
                        className={`absolute h-9 py-1 px-3 border rounded-xl flex items-center justify-between text-[11px] font-bold shadow-xl hover:scale-[1.02] cursor-grab active:cursor-grabbing pointer-events-auto transition-all z-10 backdrop-blur-md ${pillClass}`}
                      >
                        <span className="truncate">{guest?.nome}</span>
                        <span className="text-[9px] uppercase tracking-widest opacity-80">{res.status.substring(0, 5)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-white/60" /> Check-ins Pendentes (Sem Quarto)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reservations.filter(res => !res.roomId && res.status !== 'CANCELADA').map((res: any) => {
            const guest = guests.find(g => g.id === res.guestId);
            return (
              <div key={res.id} onClick={() => setSelectedResForDetail(res)} className="p-5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-brand/30 rounded-2xl flex justify-between items-center cursor-pointer transition-all">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-brand block mb-1">#{res.id.substring(0, 8)}</span>
                  <h4 className="text-[13px] font-bold text-white/90 leading-tight">{guest?.nome}</h4>
                  <span className="text-[11px] text-white/40 font-medium">{res.dataCheckIn} a {res.dataCheckOut}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase block w-max ml-auto mb-2 tracking-widest">{res.status}</span>
                  <span className="text-[13px] font-bold text-white/90 block">R$ {Number(res.valorTotal).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedResForDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl">

              <div className="flex items-center justify-between border-b border-white/5 pb-5">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-brand">Detalhes da Reserva</span>
                  <h2 className="text-xl font-bold text-white">#{selectedResForDetail.id.substring(0, 8)}</h2>
                </div>
                <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-white/60 font-bold uppercase text-[10px] tracking-widest">
                  {selectedResForDetail.status}
                </span>
              </div>

              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/30 block mb-1">Hóspede</span>
                    <span className="font-bold text-white/90 text-[13px]">{guests.find(g => g.id === selectedResForDetail.guestId)?.nome}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/30 block mb-1">Contato</span>
                    <span className="font-bold text-white/90 text-[13px]">{guests.find(g => g.id === selectedResForDetail.guestId)?.telefone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                  <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-white/30 block mb-1">Entrada</span>
                    <span className="font-bold text-white/80 text-xs">{selectedResForDetail.dataCheckIn}</span>
                  </div>
                  <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-white/30 block mb-1">Saída</span>
                    <span className="font-bold text-white/80 text-xs">{selectedResForDetail.dataCheckOut}</span>
                  </div>
                  <div className="bg-brand/10 p-3 rounded-xl border border-brand/20">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-brand block mb-1">Quarto</span>
                    <span className="font-bold text-brand text-xs">{selectedResForDetail.roomId ? rooms.find(r => r.id === selectedResForDetail.roomId)?.numero : 'NENHUM'}</span>
                  </div>
                </div>

                <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Saldo a Pagar</span>
                    {selectedResForDetail.valorTotal - (selectedResForDetail.payments || []).reduce((sum: number, p: any) => sum + p.valor, 0) > 0.05 ? (
                      <span className="font-bold text-white text-lg tracking-tight">R$ {(selectedResForDetail.valorTotal - (selectedResForDetail.payments || []).reduce((sum: number, p: any) => sum + p.valor, 0)).toFixed(2)}</span>
                    ) : (
                      <span className="font-bold text-emerald-400 text-[11px] uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded">Conta Quitada</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                {(selectedResForDetail.status === 'CONFIRMADA' || selectedResForDetail.status === 'PENDENTE') && user?.role !== 'HOUSEKEEPING' && (
                  <button onClick={() => { setCheckInRoomId(rooms.find(r => r.status === 'DISPONIVEL')?.id || ''); setIsCheckInModalOpen(true); }} className="w-full py-3.5 bg-white hover:bg-white/90 text-black font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all">Realizar Check-in</button>
                )}
                {selectedResForDetail.status === 'HOSPEDADO' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={() => { setConsumptionItemId(inventory[0]?.id || ''); setIsConsumptionModalOpen(true); }} className="py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all">Lançar Consumo</button>
                    <button onClick={triggerCheckOut} className="py-3 bg-white hover:bg-white/90 text-black font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all">Checkout</button>
                  </div>
                )}
                <button onClick={() => setSelectedResForDetail(null)} className="w-full py-3 bg-transparent text-white/40 hover:text-white/80 hover:bg-white/5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-colors">Fechar Detalhes</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCheckInModalOpen && selectedResForDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-base font-bold text-white mb-6">Check-in Manual</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-white/40 mb-1.5 font-bold uppercase tracking-widest">Documento (RG/CPF)</label>
                  <input type="text" value={checkInDoc} onChange={e => setCheckInDoc(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-[13px] outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 mb-1.5 font-bold uppercase tracking-widest">Quarto</label>
                  <select value={checkInRoomId} onChange={e => setCheckInRoomId(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-[13px] outline-none focus:border-brand">
                    {rooms.filter(r => r.categoryId === selectedResForDetail.categoryId && r.status === 'DISPONIVEL').map(r => <option key={r.id} value={r.id} className="bg-black">Quarto {r.numero}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsCheckInModalOpen(false)} className="flex-1 py-3 bg-transparent border border-white/10 text-white/40 hover:text-white/80 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-colors">Cancelar</button>
                <button onClick={triggerCheckIn} className="flex-1 py-3 bg-white hover:bg-white/90 text-black font-bold text-[11px] uppercase tracking-widest rounded-xl transition-colors">Confirmar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isConsumptionModalOpen && selectedResForDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-base font-bold text-white mb-6">Lançar Consumo</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-white/40 mb-1.5 font-bold uppercase tracking-widest">Item</label>
                  <select value={consumptionItemId} onChange={e => setConsumptionItemId(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-[13px] outline-none focus:border-brand">
                    {inventory.map(i => <option key={i.id} value={i.id} className="bg-black">{i.nome} (R$ {i.valorVenda.toFixed(2)})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 mb-1.5 font-bold uppercase tracking-widest">Quantidade</label>
                  <input type="number" min="1" value={consumptionQty} onChange={e => setConsumptionQty(Number(e.target.value))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-[13px] outline-none focus:border-brand" />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsConsumptionModalOpen(false)} className="flex-1 py-3 bg-transparent border border-white/10 text-white/40 hover:text-white/80 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-colors">Cancelar</button>
                <button onClick={triggerAddConsumption} className="flex-1 py-3 bg-white hover:bg-white/90 text-black font-bold text-[11px] uppercase tracking-widest rounded-xl transition-colors">Lançar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
