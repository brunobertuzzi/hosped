'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, LayoutDashboard, CalendarDays, Users, Calendar, Wrench, Package, ShieldCheck, DollarSign, ArrowUpRight, Activity } from 'lucide-react';

export default function Hero3DMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 5, y: -5 });
  const [activeTab, setActiveTab] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setRotate({
      x: ((y - centerY) / centerY) * -6,
      y: ((x - centerX) / centerX) * 6,
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 5, y: -5 });
  };

  const menuItems = [
    { name: 'Reservas', icon: CalendarDays },
    { name: 'Hóspedes', icon: Users },
    { name: 'Mapa de Ocupação', icon: Calendar },
    { name: 'Governança', icon: Sparkles },
    { name: 'Financeiro', icon: DollarSign },
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full max-w-6xl mx-auto mt-16 relative z-10 perspective-[1200px]"
    >
      <motion.div
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: 'transform 0.15s cubic-bezier(0.1, 1, 0.1, 1)',
          transformStyle: 'preserve-3d',
        }}
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="relative rounded-3xl overflow-hidden border border-white/15 bg-[#090914]/90 backdrop-blur-2xl shadow-[0_25px_70px_-15px_rgba(99,102,241,0.25)]"
      >
        {/* Glow ambient accent behind header */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

        {/* Mac OS Window Header bar */}
        <div className="h-11 bg-white/[0.04] border-b border-white/10 flex items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/60 font-mono">
            <Shield className="w-3 h-3 text-indigo-400" />
            <span>hosped.app/admin/dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              SISTEMA OPERACIONAL
            </span>
          </div>
        </div>

        {/* Dashboard Content Grid */}
        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[420px]">
          {/* Real System Sidebar */}
          <div className="lg:col-span-1 border-r border-white/10 pr-4 space-y-3 hidden lg:block">
            <div className="p-3 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-white flex items-center gap-3 font-semibold text-xs shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              <span>Dashboard</span>
            </div>

            {menuItems.map((item, i) => {
              const IconComp = item.icon;
              return (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                    activeTab === i
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className="w-3.5 h-3.5 text-white/60" />
                    <span>{item.name}</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-40" />
                </button>
              );
            })}

            <div className="pt-4 border-t border-white/5">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 text-left">
                <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-1">Status da Operação</div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  100% Automático
                </div>
              </div>
            </div>
          </div>

          {/* Main Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-white/50 font-medium">Ocupação Atual</span>
                  <Activity className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold tracking-tight text-white mb-1">94.8%</div>
                <span className="text-[11px] text-emerald-400 font-medium">+12.4% este mês</span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border border-indigo-500/30 shadow-[0_0_25px_rgba(99,102,241,0.15)] relative overflow-hidden">
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-indigo-200 font-medium">Vendas Diretas (Sem Comissões)</span>
                  <DollarSign className="w-4 h-4 text-indigo-300" />
                </div>
                <div className="text-2xl font-bold tracking-tight text-white mb-1">R$ 68.450</div>
                <span className="text-[11px] text-indigo-300 font-medium">Economia de R$ 10.200 em taxas</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-white/50 font-medium">Tempo Médio de Check-in</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold tracking-tight text-white mb-1">45 Segundos</div>
                <span className="text-[11px] text-emerald-400 font-medium">Ficha digital via WhatsApp</span>
              </div>
            </div>

            {/* Interactive Chart & Gantt Grid simulation */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.04] to-indigo-950/20 border border-white/10 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-sm font-bold text-white">Fluxo de Ocupação & Reservas em Tempo Real</h4>
                  <p className="text-[12px] text-white/40">Sincronização instantânea com site próprio e recepção</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">Ao Vivo</span>
                </div>
              </div>

              {/* Chart Bars */}
              <div className="h-44 flex items-end justify-between gap-3 pt-4">
                {[45, 65, 55, 95, 75, 88, 60, 100, 82, 91, 78, 96].map((height, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full bg-white/5 rounded-t-lg relative overflow-hidden h-36 flex items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 1.2, delay: 0.1 * idx, type: 'spring' }}
                        className={`w-full rounded-t-md transition-all group-hover:brightness-125 ${
                          idx % 3 === 0
                            ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                            : idx % 2 === 0
                            ? 'bg-gradient-to-t from-purple-600 to-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                            : 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-white/40">D{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
