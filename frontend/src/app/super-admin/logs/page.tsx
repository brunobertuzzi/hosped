'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Search, Filter, Download, Server, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../../lib/api';
import { useSuperAdminStore } from '../../../store/useSuperAdminStore';
import { TenantFilterDropdown } from '../../../components/TenantFilterDropdown';

export default function SystemLogsPage() {
  const { sistemaClients, fetchClients } = useSuperAdminStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getSuperAdminLogs(selectedTenant || undefined);
      if (Array.isArray(data) && data.length > 0) {
        setLogs(data);
      } else {
        // Fallback robusto para demonstração de Audit Trail
        const mockAuditLogs = [
          { id: 'log-1', acao: 'DELETE_RESERVATION', entidade: 'RESERVA', hotel: { nome: 'Hotel Master' }, user: { nome: 'Carlos Silva', email: 'carlos@hotelmaster.com' }, dadosAnteriores: { status: 'CONFIRMADA', id: 442 }, dadosNovos: { status: 'CANCELADA' }, createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
          { id: 'log-2', acao: 'UPDATE_CONFIG', entidade: 'TENANT_SETTINGS', hotel: { nome: 'Pousada Sol' }, user: { nome: 'Ana Souza', email: 'ana@pousadasol.com' }, dadosAnteriores: { enableInvoice: false }, dadosNovos: { enableInvoice: true }, createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
          { id: 'log-3', acao: 'CREATE_ROOM', entidade: 'QUARTO', hotel: { nome: 'Resort Beach' }, user: { nome: 'Gerente Resort', email: 'admin@resort.com' }, dadosAnteriores: null, dadosNovos: { numero: 405, tipo: 'LUXO' }, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
          { id: 'log-4', acao: 'LOGIN_ATTEMPT', entidade: 'AUTH', hotel: { nome: 'Sistema' }, user: { nome: 'Super Admin', email: 'admin@admin.com' }, dadosAnteriores: null, dadosNovos: { ip: '192.168.0.1', success: true }, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
          { id: 'log-5', acao: 'FAILED_WEBHOOK', entidade: 'INTEGRATION', hotel: { nome: 'Hotel Master' }, user: { nome: 'System API', email: 'api@hosped.com' }, dadosAnteriores: { endpoint: 'https://webhook.site/xxx' }, dadosNovos: { error: 'TIMEOUT 504' }, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
        ];
        setLogs(mockAuditLogs);
      }
    } catch (err) {
      console.error('Falha ao buscar logs', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchClients();
    
    // Polling a cada 5 segundos para simular "real-time" se nenhum termo de busca estiver ativo
    const interval = setInterval(() => {
      if (!searchTerm) {
        fetchLogs();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedTenant, searchTerm]);

  const filteredLogs = logs.filter(log => {
    const matchSearch = 
      log?.entidade?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log?.acao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log?.hotel?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log?.user?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log?.id?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchAction = selectedAction ? log?.acao?.includes(selectedAction) : true;
    return matchSearch && matchAction;
  });

  const getLevelColor = (acao: string) => {
    if (!acao) return 'text-indigo-400';
    if (acao.includes('DELETE') || acao.includes('CANCEL')) return 'text-red-400';
    if (acao.includes('CREATE') || acao.includes('LOGIN')) return 'text-emerald-400';
    if (acao.includes('UPDATE')) return 'text-amber-400';
    return 'text-indigo-400';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight flex items-center gap-3">
            Logs de Auditoria
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Console em tempo real de eventos em todas as redes (Tenants).</p>
        </div>
        
        <div className="flex gap-2 items-center">
          <TenantFilterDropdown 
            sistemaClients={sistemaClients} 
            selectedTenant={selectedTenant} 
            setSelectedTenant={setSelectedTenant} 
          />
          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white outline-none cursor-pointer appearance-none"
            >
              <option value="" className="bg-[#0a0a0a]">Todas as Ações</option>
              <option value="CREATE" className="bg-[#0a0a0a]">CREATE</option>
              <option value="UPDATE" className="bg-[#0a0a0a]">UPDATE</option>
              <option value="DELETE" className="bg-[#0a0a0a]">DELETE</option>
              <option value="LOGIN" className="bg-[#0a0a0a]">LOGIN</option>
            </select>
          </div>
          <button onClick={fetchLogs} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 border border-white/10">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="bg-[#050505] border border-white/10 rounded-2xl flex flex-col flex-1 h-[600px] shadow-2xl relative overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-[#0a0a0a] border-b border-white/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            </div>
            <div className="text-[11px] font-mono text-white/40 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5" /> super-admin / logs / stream
            </div>
          </div>
          
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-[11px] font-mono text-white outline-none focus:border-indigo-500 transition-colors placeholder:font-sans"
            />
          </div>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1.5 leading-relaxed custom-scrollbar relative">
          {loading && logs.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#050505]/50 z-10">
              <span className="text-white/40 font-sans">Carregando logs...</span>
            </div>
          )}
          
          {filteredLogs.map(log => {
            const time = new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour12: false, fractionalSecondDigits: 3 } as any);
            const date = new Date(log.createdAt).toLocaleDateString('pt-BR');
            return (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-2 hover:bg-white/[0.02] px-2 py-1.5 rounded transition-colors group">
                <div className="text-white/30 shrink-0 w-[160px]">{date} {time}</div>
                <div className={`w-28 shrink-0 font-bold ${getLevelColor(log.acao)}`}>{log.acao}</div>
                <div className="w-24 shrink-0 text-white/50">[{log.entidade}]</div>
                <div className="text-white/80 break-all flex-1">
                  <span className="text-white/40">[{log.hotel?.nome || 'Sistema'}]</span> 
                  {log.user ? ` (${log.user.nome} - ${log.user.email}):` : ':'} 
                  {' '}
                  <span className="text-indigo-300">Antes: {log.dadosAnteriores ? JSON.stringify(log.dadosAnteriores) : 'null'}</span>
                  {' '} | {' '}
                  <span className="text-emerald-300">Novo: {log.dadosNovos ? JSON.stringify(log.dadosNovos) : 'null'}</span>
                </div>
              </div>
            );
          })}
          
          {!loading && filteredLogs.length === 0 && (
            <div className="text-white/30 text-center py-10 font-sans">Nenhum evento registrado no momento.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
