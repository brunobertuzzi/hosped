'use client';

import React, { useState } from 'react';
import {
  Calendar,
  ClipboardList,
  Bed,
  CheckCircle2,
  CreditCard,
  ChevronRight,
  ShoppingBag,
  Trash2,
  KeyRound,
  User,
  AlertTriangle,
  Lock,
  ChevronLeft,
  CalendarDays,
  Sparkles,
  Zap,
  Plus,
  RefreshCcw,
  Search,
  Filter,
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

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() - 3); // Hoje fica como o 4º dia para visualização ideal
    return today;
  });

  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [checkInDoc, setCheckInDoc] = useState('');
  const [checkInRoomId, setCheckInRoomId] = useState('');

  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  const [consumptionItemId, setConsumptionItemId] = useState('');
  const [consumptionQty, setConsumptionQty] = useState(1);

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

  const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const dates = Array.from({ length: 14 }).map((_, idx) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + idx);
    return d;
  });

  const triggerCheckIn = async () => {
    if (!selectedResForDetail) return;
    try {
      await api.checkIn(selectedResForDetail.id, checkInDoc, checkInRoomId);
      toast.success('Check-in realizado com sucesso!');
      setIsCheckInModalOpen(false);
      setSelectedResForDetail(null);
      setCheckInDoc('');
      setCheckInRoomId('');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const triggerAddConsumption = async () => {
    if (!selectedResForDetail || !consumptionItemId) return;
    try {
      await api.addConsumption(selectedResForDetail.id, consumptionItemId, consumptionQty);
      toast.success('Consumo lançado!');
      setIsConsumptionModalOpen(false);
      setSelectedResForDetail(null);
      setConsumptionItemId('');
      setConsumptionQty(1);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const triggerCheckOut = async () => {
    if (!selectedResForDetail) return;
    try {
      await api.checkOut(selectedResForDetail.id);
      toast.success('Checkout realizado com sucesso!');
      setSelectedResForDetail(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDragStart = (e: React.DragEvent, resId: string) => {
    e.dataTransfer.setData('resId', resId);
    e.currentTarget.classList.add('opacity-40', 'scale-95');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-40', 'scale-95');
  };

  const handleDropOnTimeline = async (e: React.DragEvent, targetRoomId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-indigo-500/10', 'border-indigo-500/30');

    const resId = e.dataTransfer.getData('resId');
    if (!resId) return;

    const res = reservations.find((r) => r.id === resId);
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
      dataCheckOut: newDataCheckOut,
    });

    toast.success('Reserva realocada no mapa!');

    try {
      await api.updateReservation(resId, {
        roomId: targetRoomId,
        dataCheckIn: newStartDate.toISOString(),
        dataCheckOut: newEndDate.toISOString(),
      });
    } catch (err: any) {
      console.warn('Atualizado localmente.', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDragEnter = (e: React.DragEvent) => {
    e.currentTarget.classList.add('bg-indigo-500/10', 'border-indigo-500/30');
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-indigo-500/10', 'border-indigo-500/30');
  };

  // Status Legend Badges Helper
  const getPillStyle = (status: string) => {
    switch (status) {
      case 'HOSPEDADO':
        return 'bg-gradient-to-r from-emerald-600/40 via-teal-600/30 to-emerald-600/40 border-emerald-500/60 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:border-emerald-400';
      case 'CONFIRMADA':
      case 'PENDENTE':
        return 'bg-gradient-to-r from-indigo-600/40 via-purple-600/30 to-indigo-600/40 border-indigo-500/60 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:border-indigo-400';
      case 'CHECK_OUT_REALIZADO':
        return 'bg-white/5 border-white/15 text-white/40 hover:bg-white/10 hover:text-white/60';
      case 'CANCELADA':
        return 'bg-red-500/10 border-red-500/30 text-red-400 opacity-60';
      default:
        return 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-20 font-sans"
    >
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-2">
            <CalendarDays className="w-3 h-3" />
            <span>LINHA DO TEMPO EM TEMPO REAL</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Mapa de Ocupação (Gantt)
          </h1>
          <p className="text-sm text-white/50 mt-1 font-normal">
            Visualize, realoque e gerencie todas as reservas dos quartos em uma linha do tempo interativa.
          </p>
        </div>

        {/* Legend Pills */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            Hospedado
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
            Reservado / Confirmado
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            Pendente
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white/40" />
            Checkout Concluído
          </span>
        </div>
      </div>

      {/* Main Gantt Card */}
      <div className="bg-[#080814]/90 border border-white/10 rounded-3xl p-6 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-x-auto relative">
        {/* Navigation Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 min-w-[1300px] border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = new Date(startDate);
                d.setDate(d.getDate() - 14);
                setStartDate(d);
              }}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> 14 Dias
            </button>
            <button
              onClick={() => {
                const d = new Date(startDate);
                d.setMonth(d.getMonth() - 1);
                setStartDate(d);
              }}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/10"
            >
              Mês Anterior
            </button>
            <button
              onClick={() => {
                const today = new Date();
                today.setDate(today.getDate() - 3);
                setStartDate(today);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all border border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
            >
              Hoje
            </button>
            <button
              onClick={() => {
                const d = new Date(startDate);
                d.setMonth(d.getMonth() + 1);
                setStartDate(d);
              }}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/10"
            >
              Próximo Mês
            </button>
            <button
              onClick={() => {
                const d = new Date(startDate);
                d.setDate(d.getDate() + 14);
                setStartDate(d);
              }}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5"
            >
              14 Dias <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Jump to Date Selector & Period Label */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Ir para data:</label>
              <input
                type="date"
                value={formatDateISO(startDate)}
                onChange={(e) => {
                  if (e.target.value) {
                    const parts = e.target.value.split('-');
                    setStartDate(new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
                  }
                }}
                className="bg-[#0e0e20] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
              />
            </div>
            <span className="text-xs font-extrabold text-indigo-300 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/30 px-4 py-2 rounded-xl">
              {startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Timeline Header Row (Dates) */}
        <div
          className="gantt-grid gap-1 border-b border-white/10 pb-3 mb-4 text-center min-w-[1300px]"
          style={{ display: 'grid', gridTemplateColumns: '220px repeat(14, minmax(0, 1fr))' }}
        >
          <div className="text-left text-white/50 text-[11px] font-extrabold uppercase tracking-widest pl-4 flex items-center gap-2">
            <Bed className="w-4 h-4 text-indigo-400" /> Acomodações
          </div>

          {dates.map((d, idx) => {
            const isToday = formatDateISO(d) === formatDateISO(new Date());
            const dayOfWeek = daysOfWeek[d.getDay()];
            const dayNum = String(d.getDate()).padStart(2, '0');
            const monthName = monthNames[d.getMonth()];

            return (
              <div
                key={idx}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
                  isToday
                    ? 'bg-indigo-600/30 border border-indigo-400 text-white font-extrabold shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : 'bg-white/[0.02] border border-white/5 text-white/70'
                }`}
              >
                <span className="text-[9px] uppercase font-bold tracking-widest text-white/40">{dayOfWeek}</span>
                <span className="text-xs font-black tracking-tight">{dayNum}</span>
                <span className="text-[9px] uppercase font-medium text-indigo-300">{monthName}</span>
              </div>
            );
          })}
        </div>

        {/* Room Rows & Reservations */}
        <div className="space-y-3 min-w-[1300px]">
          {rooms.map((room) => {
            const resList = reservations.filter((res) => res.roomId === room.id);

            return (
              <div
                key={room.id}
                className="gantt-grid gap-1 items-center h-16 bg-white/[0.02] rounded-2xl hover:bg-white/[0.04] border border-white/10 transition-colors"
                style={{ display: 'grid', gridTemplateColumns: '220px repeat(14, minmax(0, 1fr))' }}
              >
                {/* Room Info Left Column */}
                <div className="flex items-center justify-between pr-4 border-r border-white/10 text-xs pl-4 h-full">
                  <div>
                    <div className="font-extrabold text-white text-sm tracking-tight flex items-center gap-2">
                      <span>Quarto {room.numero}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-white/40 uppercase tracking-wider font-bold">Standard</span>
                    </div>
                  </div>
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-lg ${
                      room.status === 'DISPONIVEL'
                        ? 'bg-emerald-400 shadow-emerald-500/50'
                        : room.status === 'OCUPADO'
                        ? 'bg-indigo-400 shadow-indigo-500/50'
                        : 'bg-amber-400 shadow-amber-500/50'
                    }`}
                    title={`Status: ${room.status}`}
                  />
                </div>

                {/* Timeline Dropzone Right Area */}
                <div
                  className="col-span-14 h-full relative flex items-center justify-start pointer-events-auto transition-colors duration-200 rounded-r-2xl"
                  onDrop={(e) => handleDropOnTimeline(e, room.id)}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                >
                  {/* Grid Lines for 14 Days */}
                  <div className="absolute inset-0 grid grid-cols-14 gap-1 opacity-10 pointer-events-none">
                    {Array.from({ length: 14 }).map((_, idx) => (
                      <div key={idx} className="border-r border-white h-full" />
                    ))}
                  </div>

                  {/* Reservation Pills */}
                  {resList.map((res: any) => {
                    const guest = guests.find((g) => g.id === res.guestId);

                    const checkInDate = new Date(
                      typeof res.dataCheckIn === 'string' && !res.dataCheckIn.includes('T')
                        ? res.dataCheckIn + 'T12:00:00'
                        : res.dataCheckIn
                    );
                    const checkOutDate = new Date(
                      typeof res.dataCheckOut === 'string' && !res.dataCheckOut.includes('T')
                        ? res.dataCheckOut + 'T12:00:00'
                        : res.dataCheckOut
                    );

                    const startWindow = new Date(startDate);
                    startWindow.setHours(0, 0, 0, 0);
                    const endWindow = new Date(dates[13]);
                    endWindow.setHours(23, 59, 59, 999);

                    if (checkOutDate < startWindow || checkInDate > endWindow) return null;

                    const oneDay = 24 * 60 * 60 * 1000;

                    const dIn = new Date(checkInDate);
                    dIn.setHours(12, 0, 0, 0);
                    const dOut = new Date(checkOutDate);
                    dOut.setHours(12, 0, 0, 0);
                    const dStart = new Date(startWindow);
                    dStart.setHours(12, 0, 0, 0);

                    let startDiffDays = (dIn.getTime() - dStart.getTime()) / oneDay;
                    if (startDiffDays < 0) startDiffDays = 0;

                    let endDiffDays = (dOut.getTime() - dStart.getTime()) / oneDay;
                    if (endDiffDays > 14) endDiffDays = 14;

                    const durationDays = endDiffDays - startDiffDays;
                    if (durationDays <= 0) return null;

                    const leftOffset = (startDiffDays / 14) * 100;
                    const widthPercent = (durationDays / 14) * 100;

                    const pillStyle = getPillStyle(res.status);

                    return (
                      <button
                        key={res.id}
                        onClick={() => setSelectedResForDetail(res)}
                        style={{ left: `${leftOffset}%`, width: `${widthPercent}%` }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, res.id)}
                        onDragEnd={handleDragEnd}
                        className={`absolute h-10 py-1.5 px-3 border rounded-xl flex items-center justify-between text-[11px] font-extrabold shadow-xl hover:scale-[1.02] cursor-grab active:cursor-grabbing pointer-events-auto transition-all z-10 backdrop-blur-md ${pillStyle}`}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <User className="w-3 h-3 opacity-60 shrink-0" />
                          <span>{guest?.nome || 'Hóspede'}</span>
                        </span>
                        <span className="text-[9px] uppercase tracking-wider font-bold opacity-80 shrink-0 ml-1">
                          {res.status.substring(0, 8)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Check-ins Pendentes (Sem Quarto Alocado) */}
      <div className="bg-[#080814]/80 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-300 mb-6 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-indigo-400" /> Check-ins Pendentes de Alocação de Quarto
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reservations
            .filter((res) => !res.roomId && res.status !== 'CANCELADA')
            .map((res: any) => {
              const guest = guests.find((g) => g.id === res.guestId);
              return (
                <div
                  key={res.id}
                  onClick={() => setSelectedResForDetail(res)}
                  className="p-5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-indigo-500/40 rounded-2xl flex justify-between items-center cursor-pointer transition-all shadow-md group"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 block mb-1">
                      #{res.id.substring(0, 8)}
                    </span>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {guest?.nome || 'Hóspede sem nome'}
                    </h4>
                    <span className="text-[11px] text-white/40 font-medium mt-1 block">
                      {res.dataCheckIn} a {res.dataCheckOut}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold uppercase block w-max ml-auto mb-2 tracking-widest">
                      {res.status}
                    </span>
                    <span className="text-sm font-black text-white font-mono block">
                      R$ {Number(res.valorTotal).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          {reservations.filter((res) => !res.roomId && res.status !== 'CANCELADA').length === 0 && (
            <div className="col-span-3 py-8 text-center text-white/30 text-xs font-medium uppercase tracking-widest">
              Todas as reservas estão com quartos alocados no mapa
            </div>
          )}
        </div>
      </div>

      {/* Reservation Details Modal */}
      <AnimatePresence>
        {selectedResForDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-[#090916] border border-white/15 rounded-3xl p-8 shadow-[0_0_50px_rgba(99,102,241,0.3)] relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Detalhes da Reserva</span>
                  <h2 className="text-2xl font-extrabold text-white">#{selectedResForDetail.id.substring(0, 8)}</h2>
                </div>
                <span className="px-3 py-1 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold uppercase text-[10px] tracking-widest">
                  {selectedResForDetail.status}
                </span>
              </div>

              <div className="space-y-5 mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.03] p-5 rounded-2xl border border-white/10">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/40 block mb-1">Hóspede</span>
                    <span className="font-bold text-white text-sm">
                      {guests.find((g) => g.id === selectedResForDetail.guestId)?.nome || 'Não identificado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/40 block mb-1">Telefone / Contato</span>
                    <span className="font-bold text-white text-sm">
                      {guests.find((g) => g.id === selectedResForDetail.guestId)?.telefone || '-'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-white/40 block mb-1">Check-in</span>
                    <span className="font-bold text-white text-xs">{selectedResForDetail.dataCheckIn}</span>
                  </div>
                  <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-white/40 block mb-1">Check-out</span>
                    <span className="font-bold text-white text-xs">{selectedResForDetail.dataCheckOut}</span>
                  </div>
                  <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/30">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-indigo-300 block mb-1">Quarto</span>
                    <span className="font-extrabold text-indigo-300 text-xs">
                      {selectedResForDetail.roomId
                        ? `Quarto ${rooms.find((r) => r.id === selectedResForDetail.roomId)?.numero}`
                        : 'PENDENTE'}
                    </span>
                  </div>
                </div>

                <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Saldo Restante</span>
                    {selectedResForDetail.valorTotal -
                      (selectedResForDetail.payments || []).reduce((sum: number, p: any) => sum + p.valor, 0) >
                    0.05 ? (
                      <span className="font-black text-white text-xl font-mono">
                        R${' '}
                        {(
                          selectedResForDetail.valorTotal -
                          (selectedResForDetail.payments || []).reduce((sum: number, p: any) => sum + p.valor, 0)
                        ).toFixed(2)}
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-400 text-xs uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                        ✓ Conta Quitada
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                {(selectedResForDetail.status === 'CONFIRMADA' || selectedResForDetail.status === 'PENDENTE') && (
                  <button
                    onClick={() => {
                      setCheckInRoomId(rooms.find((r) => r.status === 'DISPONIVEL')?.id || '');
                      setIsCheckInModalOpen(true);
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    Realizar Check-in Manual
                  </button>
                )}
                {selectedResForDetail.status === 'HOSPEDADO' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setConsumptionItemId(inventory[0]?.id || '');
                        setIsConsumptionModalOpen(true);
                      }}
                      className="py-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all"
                    >
                      Lançar Consumo
                    </button>
                    <button
                      onClick={triggerCheckOut}
                      className="py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md"
                    >
                      Realizar Checkout
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setSelectedResForDetail(null)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold uppercase tracking-widest rounded-2xl border border-white/10 transition-colors"
                >
                  Fechar Janela
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Check-in Modal */}
      <AnimatePresence>
        {isCheckInModalOpen && selectedResForDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm bg-[#090916] border border-white/15 rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-lg font-bold text-white mb-6">Realizar Check-in</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-white/40 mb-1.5 font-bold uppercase tracking-widest">
                    Documento (CPF / RG)
                  </label>
                  <input
                    type="text"
                    value={checkInDoc}
                    onChange={(e) => setCheckInDoc(e.target.value)}
                    placeholder="Digite o documento..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-[13px] outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 mb-1.5 font-bold uppercase tracking-widest">
                    Selecione o Quarto
                  </label>
                  <select
                    value={checkInRoomId}
                    onChange={(e) => setCheckInRoomId(e.target.value)}
                    className="w-full bg-[#0e0e20] border border-white/15 rounded-xl px-4 py-3 text-white text-[13px] outline-none focus:border-indigo-500"
                  >
                    {rooms
                      .filter((r) => r.status === 'DISPONIVEL')
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          Quarto {r.numero}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={triggerCheckIn}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-md"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lançar Consumo Modal */}
      <AnimatePresence>
        {isConsumptionModalOpen && selectedResForDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm bg-[#090916] border border-white/15 rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-lg font-bold text-white mb-6">Lançar Consumo no Quarto</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-white/40 mb-1.5 font-bold uppercase tracking-widest">
                    Item do Estoque
                  </label>
                  <select
                    value={consumptionItemId}
                    onChange={(e) => setConsumptionItemId(e.target.value)}
                    className="w-full bg-[#0e0e20] border border-white/15 rounded-xl px-4 py-3 text-white text-[13px] outline-none focus:border-indigo-500"
                  >
                    {inventory.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nome} (R$ {Number(i.valorVenda || i.preco || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-white/40 mb-1.5 font-bold uppercase tracking-widest">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={consumptionQty}
                    onChange={(e) => setConsumptionQty(Number(e.target.value))}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-[13px] outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsConsumptionModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={triggerAddConsumption}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-md"
                >
                  Lançar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
