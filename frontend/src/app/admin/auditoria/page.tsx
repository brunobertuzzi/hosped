'use client';

import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, Search, Filter, Calendar, User, Terminal, 
  Download, Eye, AlertCircle, RefreshCw, Layers, Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTenantStore, useActiveBranchData } from '../../../store/useTenantStore';

export default function AuditoriaPage() {
  const { audits } = useActiveBranchData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedEntity, setSelectedEntity] = useState('ALL');

  const actionTypes = useMemo(() => ['ALL', ...Array.from(new Set(audits.map(log => log.acao)))], [audits]);
  const entityTypes = useMemo(() => ['ALL', ...Array.from(new Set(audits.map(log => log.entidade)))], [audits]);

  const filteredAudits = useMemo(() => {
    return audits.filter(log => {
      const matchSearch = log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) || log.detalhes.toLowerCase().includes(searchTerm.toLowerCase());
      const matchAction = selectedAction === 'ALL' || log.acao === selectedAction;
      const matchEntity = selectedEntity === 'ALL' || log.entidade === selectedEntity;
      return matchSearch && matchAction && matchEntity;
    });
  }, [audits, searchTerm, selectedAction, selectedEntity]);

  const metrics = useMemo(() => {
    const totalLogs = audits.length;
    const criticalActions = audits.filter(log => log.acao === 'DELETAR' || log.detalhes.includes('bloqueado') || log.detalhes.includes('negado')).length;
    const modificationsCount = audits.filter(log => log.acao === 'ATUALIZAR' || log.acao === 'MUDANCA_STATUS' || log.acao === 'CRIAR').length;
    const uniqueOperators = new Set(audits.map(log => log.usuario)).size;
    return { totalLogs, criticalActions, modificationsCount, uniqueOperators };
  }, [audits]);

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date);
    } catch { return isoString; }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'CRIAR': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'ATUALIZAR': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'MUDANCA_STATUS': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'DELETAR': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-white/5 text-white/50 border-white/10';
    }
  };

  const handleSimulateExport = () => {
    const fileContent = JSON.stringify(filteredAudits, null, 2);
    const blob = new Blob([fileContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `auditoria_tenant_${Date.now()}.json`; link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Security & Audit <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest text-white/40 uppercase">RLS Ativo</span>
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Log imutável de operações corporativas com isolamento por tenant.</p>
        </div>
        <button onClick={handleSimulateExport} className="px-4 py-2 bg-transparent hover:bg-white/[0.03] border border-white/10 rounded-xl text-[11px] font-bold text-white uppercase tracking-widest transition-colors flex items-center gap-2">
          <Download className="w-3.5 h-3.5 text-brand" /> Export JSON
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-6 border-t-2 border-brand/50">
          <div className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-3">Eventos Salvos</div>
          <div className="text-3xl font-bold text-white tracking-tight">{metrics.totalLogs}</div>
        </div>
        <div className="glass-card p-6 border-t-2 border-purple-500/50">
          <div className="text-[10px] uppercase font-bold tracking-widest text-purple-400/80 mb-3">Modificações (DML)</div>
          <div className="text-3xl font-bold text-purple-400 tracking-tight">{metrics.modificationsCount}</div>
        </div>
        <div className="glass-card p-6 border-t-2 border-emerald-500/50">
          <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/80 mb-3">Operadores Auditados</div>
          <div className="text-3xl font-bold text-emerald-400 tracking-tight">{metrics.uniqueOperators}</div>
        </div>
        <div className="glass-card p-6 border-t-2 border-red-500/50">
          <div className="text-[10px] uppercase font-bold tracking-widest text-red-400/80 mb-3 flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Ações Críticas</div>
          <div className="text-3xl font-bold text-red-500 tracking-tight">{metrics.criticalActions}</div>
        </div>
      </div>

      <div className="glass-panel p-6 border border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-white/30" />
            <input type="text" placeholder="Filtrar operador, id ou descrição..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[13px] text-white placeholder-white/30 outline-none focus:border-brand transition-colors" />
          </div>
          <div>
            <select value={selectedAction} onChange={e => setSelectedAction(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner cursor-pointer appearance-none">
              <option value="ALL" className="bg-black">Todas as Operações</option>
              {actionTypes.filter(act => act !== 'ALL').map(act => <option key={act} value={act} className="bg-black">{act}</option>)}
            </select>
          </div>
          <div>
            <select value={selectedEntity} onChange={e => setSelectedEntity(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner cursor-pointer appearance-none">
              <option value="ALL" className="bg-black">Todos os Modelos</option>
              {entityTypes.filter(ent => ent !== 'ALL').map(ent => <option key={ent} value={ent} className="bg-black">{ent}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-black border border-white/[0.04] rounded-2xl p-4 overflow-hidden shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-4 mb-4 text-[10px] font-bold uppercase tracking-widest text-white/30 font-mono">
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" /> Server Console &gt;_
            </span>
            <span className="text-emerald-500/80 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Protected Env</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredAudits.map((log) => (
              <div key={log.id} className="group border border-transparent hover:border-white/[0.04] rounded-xl p-4 bg-white/[0.01] hover:bg-white/[0.02] transition-colors text-xs font-mono flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-white/40">{formatDateTime(log.data)}</span>
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold tracking-widest ${getActionBadgeColor(log.acao)}`}>{log.acao}</span>
                    <span className="text-[10px] text-white/20">in</span>
                    <span className="text-[10px] text-brand font-bold uppercase tracking-widest">{log.entidade}</span>
                  </div>
                  <p className="text-white/70 leading-relaxed font-sans">{log.detalhes}</p>
                </div>
                
                <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t border-white/[0.04] md:border-none">
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-white/80 block font-sans">{log.usuario}</span>
                    <span className="text-[9px] text-white/30 uppercase tracking-widest">{log.id}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/60 font-bold text-xs">
                    {log.usuario[0]}
                  </div>
                </div>
              </div>
            ))}
            {filteredAudits.length === 0 && (
              <div className="py-16 text-center text-white/20 font-mono text-[11px]">
                &gt; root@tenant: Nenhum log corresponde aos parâmetros especificados.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-start gap-3">
          <Lock className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <div className="text-[11px] text-white/40 space-y-1">
            <span className="font-bold text-white/70 block uppercase tracking-widest">PostgreSQL Row-Level Security</span>
            <p className="leading-relaxed">
              Todos os logs acima são criptograficamente assinados e filtrados no banco de dados. Administradores e operadores não possuem permissão técnica de leitura de logs de outras propriedades (tenants).
            </p>
          </div>
        </div>
      </div>

    </motion.div>
  );
}
