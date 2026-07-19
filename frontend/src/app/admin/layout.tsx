'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Activity, Calendar, Package, ShieldCheck, LogOut, MapPin,
  ChevronRight, AlertTriangle, Moon, Palette, CheckCircle2, CloudLightning,
  Users, Wrench, Settings, DollarSign, LayoutDashboard, CalendarDays, Landmark, Sparkles, Menu, X, Lock,
  CreditCard
} from 'lucide-react';
import { useTenantStore } from '../../store/useTenantStore';
import { api } from '../../lib/api';
import { CommandPalette } from '../../components/CommandPalette';
import { useModule } from '../../hooks/useModule';
import { canAccessPage } from '../../lib/permissions';


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    user, hotel, branches, selectedBranchId, isOffline,
    setSelectedBranchId, setUser
  } = useTenantStore();

  // Module guards — controlados por enabledModules do hotel
  const canUseGantt = useModule('GANTT_CHART');
  const canUseWebhooks = useModule('WEBHOOKS');
  const canUseMultipleBranches = useModule('MULTIPLE_BRANCHES');

  // Permission guards — controlados por permissões do usuário
  const userPerms = user?.permissions || [];
  const hasAccess = (pageKey: string) => canAccessPage(userPerms, pageKey);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (user) {
      api.getRooms().catch(() => {});
      api.getRoomCategories().catch(() => {});
      api.getReservations().catch(() => {});
      api.getGuests().catch(() => {});
      api.getMaintenanceOrders().catch(() => {});
      api.getAudits().catch(() => {});
      api.getInventory().catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    if (typeof window !== 'undefined') {
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    router.push('/login');
  };

  const currentBranch = branches.find(b => b.id === selectedBranchId) || branches[0];

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans">
        <span className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mb-3" />
      </div>
    );
  }

  const primaryColor = hotel.cores?.primary || '#ffffff';
  const backgroundColor = hotel.cores?.secondary || '#000000';

  return (
    <div className="min-h-screen text-white flex font-sans overflow-hidden antialiased transition-colors duration-500" style={{ backgroundColor: 'var(--brand-bg)' }}>
      <style>{`
        :root {
          --brand-primary: ${primaryColor};
          --brand-primary-glow: ${primaryColor}66;
          --brand-bg: ${backgroundColor};
        }
        .bg-brand { background-color: var(--brand-primary); color: #000; }
        .text-brand { color: var(--brand-primary); }
        .border-brand { border-color: var(--brand-primary); }
        .active-tab {
          background-color: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }
      `}</style>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Floating Sidebar Hosped */}
      <div className={`fixed md:relative inset-y-0 left-0 z-50 flex shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} py-3 pl-3 pr-3 md:pr-0 w-[280px] md:w-[260px]`}>
        <aside className="w-full glass-card border border-white/5 rounded-[24px] flex flex-col justify-between p-4 overflow-y-auto h-[calc(100vh-24px)] relative bg-[#0a0a0a] md:bg-transparent">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

          <div className="space-y-4 relative z-10">
            {/* Logo e Info Hotel */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-lg">
                <img src={hotel.logo || '/placeholder-hotel.svg'} alt="logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold tracking-tight text-white/90 leading-tight">{hotel.nome}</h2>
                <span className="text-[9px] uppercase font-bold tracking-widest text-white/40">Painel Admin</span>
              </div>
            </div>

            {/* Branch Selector — só exibe dropdown se MULTIPLE_BRANCHES habilitado */}
            <div className="mb-4 p-3 rounded-xl bg-brand/5 border border-brand/20 relative group">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-3.5 h-3.5 text-brand" />
                <span className="text-[9px] uppercase font-bold tracking-widest text-brand/70">Operação Local</span>
              </div>
              {canUseMultipleBranches && branches.length > 1 ? (
                <select
                  value={selectedBranchId}
                  onChange={e => setSelectedBranchId(e.target.value)}
                  className="w-full bg-transparent text-[13px] font-bold text-white outline-none cursor-pointer border-none appearance-none hover:text-brand transition-colors truncate pr-4"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id} className="bg-[#111] text-white py-2">{b.nome}</option>
                  ))}
                </select>
              ) : (
                <span className="text-[13px] font-bold text-white truncate block">
                  {branches.find(b => b.id === selectedBranchId)?.nome || branches[0]?.nome || 'Unidade Principal'}
                </span>
              )}
            </div>

            {/* Navegação Admin */}
            <nav className="space-y-0.5">
              {hasAccess('page.dashboard') && (
                <Link href="/admin/dashboard" className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/dashboard' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
              )}
              {hasAccess('page.reservas') && (
                <Link href="/admin/reservas" className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/reservas' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                  <CalendarDays className="w-4 h-4" /> Controle de Reservas
                </Link>
              )}
              {hasAccess('page.hospedes') && (
                <Link href="/admin/hospedes" className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/hospedes' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                  <Users className="w-4 h-4" /> Cadastro de Hóspedes
                </Link>
              )}
              {hasAccess('page.gantt') && canUseGantt ? (
                <Link href="/admin/gantt" className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/gantt' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                  <Calendar className="w-4 h-4" /> Mapa de Ocupação
                </Link>
              ) : hasAccess('page.gantt') ? (
                <div className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-white/20 cursor-not-allowed select-none" title="Módulo não disponível no seu plano">
                  <Calendar className="w-4 h-4" />
                  <span>Mapa de Ocupação</span>
                  <Lock className="w-3 h-3 ml-auto" />
                </div>
              ) : null}
              {hasAccess('page.manutencao') && (
                <Link href="/admin/manutencao" className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/manutencao' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                  <Wrench className="w-4 h-4" /> Manutenção
                </Link>
              )}
              {hasAccess('page.governanca') && (
                <Link href="/admin/governanca" className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/governanca' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                  <Sparkles className="w-4 h-4" /> Governança
                </Link>
              )}
              {hasAccess('page.estoque') && (
                <Link href="/admin/estoque" className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/estoque' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                  <Package className="w-4 h-4" /> Estoque & Consumos
                </Link>
              )}
              {hasAccess('page.auditoria') && (
                <Link href="/admin/auditoria" className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/auditoria' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                  <ShieldCheck className="w-4 h-4" /> Histórico de Ações
                </Link>
              )}
              {(hasAccess('page.equipe') || hasAccess('page.quartos') || hasAccess('page.financeiro') || hasAccess('page.integracoes') || hasAccess('page.meu-plano') || hasAccess('page.configuracoes')) && (
                <div className="pt-4 mt-4 border-t border-white/5 space-y-0.5">
                  <span className="block px-3 text-[10px] uppercase font-bold tracking-widest text-white/30 mb-2">Setup & Gestão</span>
                  {hasAccess('page.equipe') && (
                    <Link href="/admin/equipe" className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/equipe' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                      <Users className="w-4 h-4" /> Equipe (RH)
                    </Link>
                  )}
                  {hasAccess('page.quartos') && (
                    <Link href="/admin/quartos" className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/quartos' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                      <Building2 className="w-4 h-4" /> Quartos & Categorias
                    </Link>
                  )}
                  {hasAccess('page.financeiro') && (
                    <Link href="/admin/financeiro" className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/financeiro' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                      <DollarSign className="w-4 h-4" /> Financeiro
                    </Link>
                  )}
                  {hasAccess('page.integracoes') && canUseWebhooks ? (
                    <Link href="/admin/integracoes" className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/integracoes' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                      <CloudLightning className="w-4 h-4" /> Integrações
                    </Link>
                  ) : hasAccess('page.integracoes') ? (
                    <div className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-white/20 cursor-not-allowed select-none" title="Módulo Webhooks & API não disponível no seu plano">
                      <CloudLightning className="w-4 h-4" />
                      <span>Integrações</span>
                      <Lock className="w-3 h-3 ml-auto" />
                    </div>
                  ) : null}
                  {hasAccess('page.meu-plano') && (
                    <Link href="/admin/meu-plano" className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/meu-plano' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                      <CreditCard className="w-4 h-4" /> Meu Plano
                    </Link>
                  )}
                  {hasAccess('page.configuracoes') && (
                    <Link href="/admin/configuracoes" className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/configuracoes' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                      <Settings className="w-4 h-4" /> Configurações
                    </Link>
                  )}
                </div>
              )}

              {hasAccess('page.site-reservas') && (
                <div className="pt-4 mt-4 border-t border-white/5">
                  <a href={`/${hotel.slug || hotel.id || '11111111-1111-1111-1111-111111111111'}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-brand hover:bg-brand/10 transition-colors">
                    <CloudLightning className="w-4 h-4" /> Ver Site de Reservas
                  </a>
                </div>
              )}
            </nav>
          </div>

          {/* User Profile */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs text-white">
                {user.nome[0]}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-white/90 truncate">{user.nome}</div>
                <span className="text-[9px] uppercase font-bold text-white/40 tracking-widest">{user.role}</span>
              </div>
            </div>

            <button onClick={handleLogout} className="w-full flex items-center gap-2 text-xs font-medium text-white/40 hover:text-red-400 px-2 py-1.5 rounded-lg transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Encerrar Sessão
            </button>
            <button
              className="md:hidden absolute top-4 right-4 text-white/50 hover:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Subtle background glow element */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Mobile Header (Hidden on Desktop) */}
        <header className="md:hidden h-[64px] flex items-center justify-between px-4 sticky top-0 z-30 shrink-0 bg-[#0a0a0a] border-b border-white/5">
          <div className="flex items-center gap-3">
            <button
              className="p-2 -ml-2 text-white/70 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-sm font-semibold tracking-tight text-white/90">{hotel.nome}</span>
          </div>
        </header>

        {/* View da Rota Ativa */}
        <main className="flex-1 overflow-y-auto px-4 md:px-10 pb-10 pt-6 md:pt-10 relative z-0">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
