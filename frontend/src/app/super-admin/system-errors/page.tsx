'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { ShieldAlert, AlertTriangle, Bug, ServerCrash, RefreshCw, Search, Filter, Building2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSuperAdminStore } from '../../../store/useSuperAdminStore';
import { TenantFilterDropdown } from '../../../components/TenantFilterDropdown';

interface SystemLog {
  id: string;
  hotelId: string | null;
  userId: string | null;
  hotel?: { nome: string };
  user?: { nome: string; email: string };
  route: string | null;
  method: string | null;
  statusCode: number | null;
  errorMessage: string;
  stackTrace: string | null;
  createdAt: string;
}

export default function SystemErrorsPage() {
  const { sistemaClients, fetchClients } = useSuperAdminStore();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');


  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getSystemLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchClients();
  }, []);

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      log.errorMessage.toLowerCase().includes(term) ||
      log.route?.toLowerCase().includes(term) ||
      log.hotel?.nome?.toLowerCase().includes(term);
      
    const matchTenant = selectedTenant ? log.hotelId === selectedTenant : true;
    
    let matchDate = true;
    if (startDate || endDate) {
      const logDate = new Date(log.createdAt).getTime();
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (logDate < start.getTime()) matchDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (logDate > end.getTime()) matchDate = false;
      }
    }
    
    return matchSearch && matchTenant && matchDate;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            System Error Logs
            <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5">
              <Bug className="w-3 h-3" /> Monitoramento
            </span>
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Exceções críticas e falhas do servidor (HTTP 500+).</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap justify-end">
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-white/70 outline-none focus:border-red-500" 
            />
            <span className="text-white/30 text-[10px]">Até</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-white/70 outline-none focus:border-red-500" 
            />
          </div>
          <TenantFilterDropdown 
            sistemaClients={sistemaClients} 
            selectedTenant={selectedTenant} 
            setSelectedTenant={setSelectedTenant} 
          />
          

          <button onClick={fetchLogs} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 border border-white/10">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ServerCrash className="w-5 h-5 text-red-400" />
            <h2 className="text-white font-bold text-sm">Erros Recentes Capturados</h2>
          </div>
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input 
              type="text" 
              placeholder="Buscar erro, rota ou hotel..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-[11px] font-mono text-white outline-none focus:border-red-500 transition-colors placeholder:font-sans"
            />
          </div>
        </div>
        <div className="divide-y divide-white/[0.02]">
          {loading && logs.length === 0 ? (
            <div className="py-20 text-center text-white/40 text-[13px]">Buscando logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 text-center text-white/40 text-[13px] flex flex-col items-center">
              <ShieldAlert className="w-8 h-8 mb-3 opacity-50" />
              Nenhum erro crítico registrado no momento.
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="p-6 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[10px] font-mono font-bold">
                        HTTP {log.statusCode || 500}
                      </span>
                      <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                      {log.hotel && (
                        <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1.5">
                          <Building2 className="w-3 h-3" /> {log.hotel.nome}
                        </span>
                      )}
                      {log.user && (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1.5">
                          {log.user.nome} ({log.user.email})
                        </span>
                      )}
                    </div>
                    <div className="text-[14px] font-bold text-white font-mono break-all">
                      <span className="text-white/40 mr-2">{log.method}</span>
                      {log.route}
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-[12px] mb-2">
                    <AlertTriangle className="w-4 h-4" /> Mensagem do Erro
                  </div>
                  <div className="text-[12px] text-white/80 font-mono break-words whitespace-pre-wrap">
                    {log.errorMessage}
                  </div>
                </div>

                {log.stackTrace && (
                  <details className="group">
                    <summary className="text-[11px] font-bold text-white/40 uppercase tracking-widest cursor-pointer hover:text-white/60 transition-colors list-none flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                      Ver Stack Trace Completo
                    </summary>
                    <div className="mt-3 bg-[#050505] border border-white/5 rounded-xl p-4 overflow-x-auto">
                      <pre className="text-[10px] text-white/50 font-mono leading-relaxed">
                        {log.stackTrace}
                      </pre>
                    </div>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
