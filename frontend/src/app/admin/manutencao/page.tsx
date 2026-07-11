'use client';

import React, { useState, useMemo } from 'react';
import { 
  Wrench, CheckCircle, AlertTriangle, User, 
  BedDouble, Clock, Search, Filter, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenantStore, useActiveBranchData } from '../../../store/useTenantStore';
import { api } from '../../../lib/api';
import { alerts } from '../../../lib/alerts';

export default function ManutencaoPage() {
  const { maintenance, rooms, completeMaintenanceOrder, user } = useActiveBranchData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ABERTA' | 'CONCLUIDA'>('ALL');

  const filteredOrders = useMemo(() => {
    return maintenance.filter(order => {
      const matchSearch = order.roomNumero.includes(searchTerm) || order.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || order.status === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => {
      // Priorizar abertas e recém-criadas
      if (a.status === 'ABERTA' && b.status !== 'ABERTA') return -1;
      if (a.status !== 'ABERTA' && b.status === 'ABERTA') return 1;
      return 0;
    });
  }, [maintenance, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = maintenance.length;
    const abertas = maintenance.filter(m => m.status === 'ABERTA').length;
    const concluidas = maintenance.filter(m => m.status === 'CONCLUIDA').length;
    return { total, abertas, concluidas };
  }, [maintenance]);

  const handleComplete = async (id: string, roomNum: string) => {
    const isConfirmed = await alerts.confirm('Finalizar Reparo', `Confirma a conclusão da manutenção no quarto ${roomNum}? Ele será liberado para limpeza.`);
    if (isConfirmed) {
      try {
        await api.completeMaintenance(id, 'Concluído manualmente.');
        const store = useTenantStore.getState();
        store.addAuditLog({
          id: 'a_' + Date.now(),
          usuario: user?.nome || 'Operador/Técnico',
          data: new Date().toISOString(),
          acao: 'MUDANCA_STATUS',
          entidade: 'MAINTENANCE_ORDER',
          detalhes: `Manutenção concluída no quarto ${roomNum}.`
        });
        alerts.success('Manutenção Finalizada!');
      } catch (err: any) {
        alerts.error('Erro ao concluir', err.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await alerts.confirm('Excluir Chamado', 'Tem certeza que deseja excluir este chamado de manutenção?');
    if (isConfirmed) {
      try {
        await api.deleteMaintenance(id);
        alerts.success('Chamado excluído!');
      } catch (err: any) {
        alerts.error('Erro ao excluir', err.message);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-white tracking-tight flex items-center gap-3">
            Controle de Manutenção
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Gestão técnica de incidentes e bloqueio de quartos físicos.</p>
        </div>
      </div>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-6 border-t-2 border-amber-500/50">
          <div className="text-[10px] uppercase font-bold tracking-widest text-amber-500/80 mb-3 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Chamados Abertos</div>
          <div className="text-3xl font-bold text-amber-500 tracking-tight">{stats.abertas}</div>
        </div>
        <div className="glass-card p-6 border-t-2 border-emerald-500/50">
          <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/80 mb-3 flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Concluídos</div>
          <div className="text-3xl font-bold text-emerald-400 tracking-tight">{stats.concluidas}</div>
        </div>
        <div className="glass-card p-6 border-t-2 border-white/10">
          <div className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-3 flex items-center gap-1.5"><Layers className="w-3 h-3" /> Total Registrado</div>
          <div className="text-3xl font-bold text-white tracking-tight">{stats.total}</div>
        </div>
      </div>

      {/* Tabela/Kanban List */}
      <div className="glass-panel p-6 border border-white/5 space-y-6">
        
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Buscar por quarto ou descrição..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[13px] text-white placeholder-white/30 outline-none focus:border-brand transition-colors" 
            />
          </div>
          <div className="flex gap-2 bg-white/[0.02] p-1.5 rounded-xl border border-white/10">
            {(['ALL', 'ABERTA', 'CONCLUIDA'] as const).map(status => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  statusFilter === status ? 'bg-white/10 text-white shadow-md' : 'text-white/40 hover:text-white/80'
                }`}
              >
                {status === 'ALL' ? 'Todos' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Listagem */}
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-black border border-white/[0.05] hover:border-white/10 transition-colors rounded-[20px] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${
                    order.status === 'ABERTA' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {order.status}
                  </span>
                  <span className="text-[11px] font-mono text-white/40 uppercase tracking-widest">#{order.id}</span>
                </div>

                <div>
                  <h3 className="text-[15px] font-bold text-white flex items-center gap-2 mb-1">
                    <BedDouble className="w-4 h-4 text-brand" /> Quarto {order.roomNumero}
                  </h3>
                  <p className="text-[13px] text-white/60 leading-relaxed font-light">{order.descricao}</p>
                </div>
                
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    <User className="w-3.5 h-3.5 text-white/20" /> {order.responsavel || 'Não Atribuído'}
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="shrink-0 pt-4 md:pt-0 border-t border-white/5 md:border-t-0 md:pl-6 md:border-l md:border-white/5 flex flex-col gap-2">
                {order.status === 'ABERTA' ? (
                  <button 
                    onClick={() => handleComplete(order.id, order.roomNumero)}
                    className="w-full md:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Finalizar Reparo
                  </button>
                ) : (
                  <div className="px-6 py-3 bg-white/5 border border-white/10 text-white/40 font-bold text-[11px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                    <CheckCircle className="w-4 h-4" /> Concluído
                  </div>
                )}
                <button 
                  onClick={() => handleDelete(order.id)}
                  className="w-full md:w-auto px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all"
                >
                  Excluir Chamado
                </button>
              </div>

            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="text-center py-16 text-white/30 text-xs font-medium">
              <Wrench className="w-8 h-8 mx-auto mb-4 opacity-50" />
              Nenhum chamado técnico encontrado com os filtros atuais.
            </div>
          )}
        </div>

      </div>

    </motion.div>
  );
}
