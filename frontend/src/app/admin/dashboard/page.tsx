'use client';

import React, { useMemo, useState } from 'react';
import { 
  Activity, DollarSign, CheckCircle2, LogOut, AlertTriangle, 
  RefreshCcw, Bed, Plus, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenantStore, useActiveBranchData } from '../../../store/useTenantStore';
import { api } from '../../../lib/api';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { 
    rooms, reservations, inventory, maintenance, user, roomCategories
  } = useActiveBranchData();

  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [maintRoomId, setMaintRoomId] = useState('');
  const [maintDesc, setMaintDesc] = useState('');

  const metrics = useMemo(() => {
    const totalRoomsCount = rooms.length;
    const occupiedRoomsCount = rooms.filter(r => r.status === 'OCUPADO').length;
    const occupancyRate = totalRoomsCount > 0 ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0;
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const checkInsToday = reservations.filter(r => r.dataCheckIn.substring(0, 10) === todayStr && r.status === 'CONFIRMADA').length;
    const checkOutsToday = reservations.filter(r => r.dataCheckOut.substring(0, 10) === todayStr && r.status === 'HOSPEDADO').length;

    const monthRevenue = reservations
      .filter(r => r.status === 'CHECK_OUT_REALIZADO' || r.status === 'HOSPEDADO')
      .reduce((sum: number, r: any) => sum + Number(r.valorTotal), 0);

    const lowStockAlerts = inventory.filter(i => i.quantidade < i.estoqueMinimo);

    // Calc last 7 days volume
    const last7Days = Array.from({length: 7}).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().substring(0, 10);
    });

    const graphData = last7Days.map(dateStr => {
      return reservations.filter(r => 
        r.dataCheckIn.substring(0, 10) <= dateStr && 
        r.dataCheckOut.substring(0, 10) >= dateStr &&
        r.status !== 'CANCELADA'
      ).length;
    });

    const maxGraph = Math.max(...graphData, 10);
    // Map to SVG coordinates: viewBox 0 0 100 40
    // X goes from 0 to 100 in 6 steps (0, 16.6, 33.3, 50, 66.6, 83.3, 100)
    // Y goes from 35 (0 value) to 5 (max value)
    const points = graphData.map((val, i) => {
      const x = (i / 6) * 100;
      const y = 35 - (val / maxGraph) * 30;
      return `${x},${y}`;
    });

    // Create a smooth curve command (simple polyline for now, but formatted nicely)
    const pathD = `M ${points.map((p, i) => i === 0 ? p : `L ${p}`).join(' ')}`;
    const pathFill = `M ${points[0].split(',')[0]} 40 L ${points.map((p, i) => i === 0 ? p : `L ${p}`).join(' ')} L ${points[points.length-1].split(',')[0]} 40 Z`;

    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const graphLabels = last7Days.map(dStr => {
      const dateObj = new Date(dStr + 'T12:00:00');
      return daysOfWeek[dateObj.getDay()];
    });

    return { 
      occupancyRate, monthRevenue, checkInsToday, checkOutsToday, 
      lowStockAlerts, occupiedRoomsCount, totalRoomsCount,
      pathD, pathFill, graphLabels
    };
  }, [rooms, reservations, inventory]);

  const handleCleaningComplete = async (roomId: string) => {
    try {
      await api.completeCleaning(roomId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCompleteMaintenance = async (maintId: string) => {
    try {
      await api.completeMaintenance(maintId, 'Serviço concluído localmente.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const triggerCreateMaintenance = async () => {
    if (!maintRoomId || !maintDesc) return;
    try {
      await api.createMaintenance(maintRoomId, maintDesc);
      setIsMaintModalOpen(false);
      setMaintRoomId('');
      setMaintDesc('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-10 pb-20"
    >
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/5 pb-6 gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-white tracking-tight flex items-center gap-3">
            Visão Geral <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest text-white/40 uppercase">Ao Vivo</span>
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Indicadores financeiros e operacionais em tempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/reservas">
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-colors flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Nova Reserva
            </button>
          </Link>
          <Link href="/admin/hospedes">
            <button className="px-4 py-2 bg-brand text-white border border-brand text-[11px] font-bold uppercase tracking-widest rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-brand/20">
              <Plus className="w-3.5 h-3.5" /> Novo Hóspede
            </button>
          </Link>
        </div>
      </div>

      {/* Grid de Métricas Premium */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="glass-card p-6 border-t-2 border-t-brand">
          <div className="flex items-center justify-between mb-4 text-white/40">
            <span className="text-[10px] font-bold uppercase tracking-widest">Ocupação Atual</span>
            <Bed className="w-4 h-4 text-brand" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold text-white tracking-tight">{metrics.occupancyRate}%</span>
              <div className="text-[11px] text-white/30 mt-1 font-medium">
                {metrics.occupiedRoomsCount} de {metrics.totalRoomsCount} quartos
              </div>
            </div>
            <div className="w-12 h-12 relative flex items-center justify-center opacity-80">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r="20" className="stroke-white/10" strokeWidth="3" fill="transparent" />
                <circle cx="24" cy="24" r="20" className="stroke-brand transition-all duration-1000 ease-out" strokeWidth="3" fill="transparent"
                  strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * metrics.occupancyRate) / 100} strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4 text-white/40">
            <span className="text-[10px] font-bold uppercase tracking-widest">Receita (Mês)</span>
            <DollarSign className="w-4 h-4 text-white/60" />
          </div>
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">
              <span className="text-white/30 text-xl mr-1">R$</span>
              {metrics.monthRevenue.toFixed(2)}
            </span>
            <div className="text-[11px] text-white/30 mt-1 font-medium flex items-center gap-1.5">
              <span className="text-emerald-400/90 flex items-center bg-emerald-500/10 px-1.5 rounded"><ArrowUpRight className="w-3 h-3 mr-0.5" /> Vivo</span> 
              Neste mês
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4 text-white/40">
            <span className="text-[10px] font-bold uppercase tracking-widest">Check-ins</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400/80" />
          </div>
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">{metrics.checkInsToday}</span>
            <div className="text-[11px] text-white/30 mt-1 font-medium">Hóspedes previstos hoje</div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4 text-white/40">
            <span className="text-[10px] font-bold uppercase tracking-widest">Check-outs</span>
            <LogOut className="w-4 h-4 text-red-400/80" />
          </div>
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">{metrics.checkOutsToday}</span>
            <div className="text-[11px] text-white/30 mt-1 font-medium">Saídas previstas hoje</div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico Curva */}
        <div className="glass-panel p-6 lg:col-span-2">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-8 flex items-center gap-2">
            <Activity className="w-4 h-4 text-white/60" /> Volume Diário de Ocupação (Últimos 7 dias)
          </h3>
          <div className="h-56 relative w-full flex flex-col justify-between">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="w-full border-t border-white/[0.03]" />
              <div className="w-full border-t border-white/[0.03]" />
              <div className="w-full border-t border-white/[0.03]" />
              <div className="w-full border-t border-white/[0.03]" />
            </div>
            
            <svg className="w-full h-full absolute inset-0 text-brand" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="brand-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={metrics.pathFill} fill="url(#brand-grad)" />
              <path d={metrics.pathD} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <div className="w-full flex justify-between text-[10px] font-medium text-white/30 mt-auto pt-4 z-10">
              {metrics.graphLabels.map((lbl, idx) => (
                <span key={idx} className={idx === 6 ? "text-white/60 font-bold" : ""}>{lbl}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="space-y-4">
          <div className="glass-panel p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Estoque Crítico
            </h3>
            {metrics.lowStockAlerts.length > 0 ? (
              <div className="space-y-2">
                {metrics.lowStockAlerts.map(i => (
                  <div key={i.id} className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white/90 text-xs block">{i.nome}</span>
                      <span className="text-[10px] text-white/40">Restam {i.quantidade}</span>
                    </div>
                    <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded">Abaixo de {i.estoqueMinimo}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-white/30 py-4 text-center border border-dashed border-white/5 rounded-xl">Estoque normalizado.</div>
            )}
          </div>

          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <RefreshCcw className="w-4 h-4 text-amber-400" /> Manutenções
              </h3>
              {user?.role !== 'HOUSEKEEPING' && (
                <button onClick={() => setIsMaintModalOpen(true)} className="p-1 hover:bg-white/10 rounded transition-colors text-white/60">
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {maintenance.length > 0 ? (
              <div className="space-y-2">
                {maintenance.map(m => (
                  <div key={m.id} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white/90 text-xs">Quarto {m.roomNumero}</span>
                    </div>
                    <p className="text-[11px] text-white/50">{m.descricao}</p>
                    {user?.role !== 'HOUSEKEEPING' && (
                      <button onClick={() => handleCompleteMaintenance(m.id)} className="w-full mt-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-[10px] uppercase rounded-lg transition-colors">
                        Finalizar OS
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-white/30 py-4 text-center border border-dashed border-white/5 rounded-xl">Nenhuma OS aberta.</div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Físico */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
            <Bed className="w-4 h-4 text-white/60" /> Mapa de Quartos
          </h3>
          <span className="text-[11px] px-3 py-1 rounded-full bg-white/5 border border-white/10 font-bold text-white/60">
            {rooms.filter(r => r.status === 'DISPONIVEL').length} livres
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {rooms.map(r => {
            const catName = roomCategories.find(c => c.id === r.categoryId)?.nome || '';
            
            let statusStyle = 'bg-white/[0.02] border-white/5 text-white/40';
            let badgeStyle = 'bg-white/5 text-white/40';
            
            if (r.status === 'OCUPADO') { statusStyle = 'bg-brand/10 border-brand/20 text-brand'; badgeStyle = 'bg-brand/20 text-brand'; }
            if (r.status === 'LIMPEZA') { statusStyle = 'bg-purple-500/10 border-purple-500/20 text-purple-400'; badgeStyle = 'bg-purple-500/20 text-purple-400'; }
            if (r.status === 'MANUTENCAO') { statusStyle = 'bg-amber-500/10 border-amber-500/20 text-amber-400'; badgeStyle = 'bg-amber-500/20 text-amber-400'; }
            if (r.status === 'BLOQUEADO') { statusStyle = 'bg-red-500/10 border-red-500/20 text-red-400'; badgeStyle = 'bg-red-500/20 text-red-400'; }
            
            return (
              <div key={r.id} className={`p-4 rounded-2xl border flex flex-col justify-between items-center text-center transition-all hover:scale-[1.02] ${statusStyle}`}>
                <span className="text-xl font-bold tracking-tight text-white/90">{r.numero}</span>
                <span className="text-[9px] uppercase font-bold mt-1 opacity-60 truncate w-full">{catName}</span>
                
                <div className="mt-4 w-full">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md block ${badgeStyle}`}>
                    {r.status}
                  </span>
                  {r.status === 'LIMPEZA' && (
                    <button onClick={() => handleCleaningComplete(r.id)} className="w-full mt-2 py-1.5 bg-purple-500 text-white font-bold text-[9px] uppercase rounded-md transition-colors shadow-lg shadow-purple-500/20">
                      Liberar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {isMaintModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <h2 className="text-base font-semibold text-white mb-6">Ordem de Serviço</h2>
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-white/40 mb-1.5 font-semibold uppercase tracking-widest text-[10px]">Quarto</label>
                  <select value={maintRoomId} onChange={e => setMaintRoomId(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-brand">
                    <option value="" className="bg-black">Selecione...</option>
                    {rooms.filter(r => r.status !== 'OCUPADO' && r.status !== 'MANUTENCAO').map(r => (
                      <option key={r.id} value={r.id} className="bg-black">Quarto {r.numero}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/40 mb-1.5 font-semibold uppercase tracking-widest text-[10px]">Descrição</label>
                  <textarea value={maintDesc} onChange={e => setMaintDesc(e.target.value)} placeholder="Detalhes do problema..." className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-brand h-24 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsMaintModalOpen(false)} className="flex-1 py-3 bg-transparent border border-white/10 hover:bg-white/5 text-white/60 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-colors">Cancelar</button>
                <button onClick={triggerCreateMaintenance} className="flex-1 py-3 bg-white hover:bg-white/90 text-black text-[11px] font-bold uppercase tracking-widest rounded-xl transition-colors">Abrir OS</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
