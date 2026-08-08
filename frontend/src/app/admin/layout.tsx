'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Activity,
  Calendar,
  Package,
  ShieldCheck,
  LogOut,
  MapPin,
  ChevronRight,
  AlertTriangle,
  Moon,
  Palette,
  CheckCircle2,
  CloudLightning,
  Users,
  Wrench,
  Settings,
  DollarSign,
  LayoutDashboard,
  CalendarDays,
  Landmark,
  Sparkles,
  Menu,
  X,
  Lock,
  CreditCard,
  Tag,
  Search,
} from 'lucide-react';
import { useTenantStore } from '../../store/useTenantStore';
import { api } from '../../lib/api';
import { CommandPalette } from '../../components/CommandPalette';
import { useModule } from '../../hooks/useModule';
import { canAccessPage } from '../../lib/permissions';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/badge';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    user,
    hotel,
    branches,
    selectedBranchId,
    isOffline,
    setSelectedBranchId,
    setUser,
  } = useTenantStore();

  // Module guards
  const canUseGantt = useModule('GANTT_CHART');
  const canUseWebhooks = useModule('WEBHOOKS');
  const canUseMultipleBranches = useModule('MULTIPLE_BRANCHES');

  // Permission guards
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
      const loadAll = async () => {
        try {
          await Promise.all([
            api.getRooms(),
            api.getRoomCategories(),
            api.getReservations(),
            api.getGuests(),
            api.getMaintenanceOrders(),
            api.getAudits(),
            api.getInventory(),
          ]);
        } catch {
          useTenantStore.setState({ isOffline: true });
        }
      };
      loadAll();
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

  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#030308] flex flex-col items-center justify-center font-sans">
        <span className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mb-3" />
      </div>
    );
  }

  const primaryColor = hotel.cores?.primary || '#6366f1';
  const backgroundColor = hotel.cores?.background || hotel.cores?.secondary || '#030308';

  return (
    <div
      className="min-h-screen text-white flex font-sans overflow-hidden antialiased transition-colors duration-500"
      style={{ backgroundColor: backgroundColor }}
    >
      <style>{`
        :root {
          --brand-primary: ${primaryColor};
          --brand-primary-glow: ${primaryColor}66;
          --brand-bg: ${backgroundColor};
        }
        .bg-brand { background-color: var(--brand-primary); color: #fff; }
        .text-brand { color: var(--brand-primary); }
        .border-brand { border-color: var(--brand-primary); }
      `}</style>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-md"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* shadcn/ui Style Sidebar */}
      <div
        className={cn(
          'fixed md:relative inset-y-0 left-0 z-50 flex shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          'w-[270px] bg-[#080814]/95 border-r border-white/10 backdrop-blur-2xl'
        )}
      >
        <aside className="w-full flex flex-col justify-between p-4 overflow-y-auto h-screen relative">
          <div className="space-y-5 relative z-10">
            {/* Logo & Hotel Brand Header */}
            <div className="flex items-center gap-3 px-2 py-1 mb-2">
              <div className="w-9 h-9 rounded-2xl overflow-hidden shrink-0 border border-white/15 shadow-md bg-white/5 p-1">
                <img
                  src={hotel.logo || '/placeholder-hotel.svg'}
                  alt="logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-sm font-extrabold tracking-tight text-white truncate">
                  {hotel.nome}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="secondary" className="px-1.5 py-0 text-[8px]">
                    {hotel.plan || 'PRO'}
                  </Badge>
                  <span className="text-[9px] text-white/40 font-mono">v2.5</span>
                </div>
              </div>
            </div>

            {/* Branch Selector */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 relative group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-indigo-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-400" /> Operação Local
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              {canUseMultipleBranches && branches.length > 1 ? (
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-white outline-none cursor-pointer border-none appearance-none hover:text-indigo-300 transition-colors truncate"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#090916] text-white py-2">
                      {b.nome}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-bold text-white truncate block">
                  {branches.find((b) => b.id === selectedBranchId)?.nome ||
                    branches[0]?.nome ||
                    'Unidade Principal'}
                </span>
              )}
            </div>

            {/* Admin Nav Links */}
            <nav className="space-y-1">
              <div className="px-2 text-[9px] uppercase font-extrabold tracking-widest text-white/30 mb-1">
                Menu Principal
              </div>

              {hasAccess('page.dashboard') && (
                <Link
                  href="/admin/dashboard"
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                    pathname === '/admin/dashboard'
                      ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
              )}

              {hasAccess('page.reservas') && (
                <Link
                  href="/admin/reservas"
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                    pathname === '/admin/reservas'
                      ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <CalendarDays className="w-4 h-4" /> Reservas
                </Link>
              )}

              {hasAccess('page.hospedes') && (
                <Link
                  href="/admin/hospedes"
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                    pathname === '/admin/hospedes'
                      ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Users className="w-4 h-4" /> Hóspedes
                </Link>
              )}

              {hasAccess('page.gantt') && canUseGantt ? (
                <Link
                  href="/admin/gantt"
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                    pathname === '/admin/gantt'
                      ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Calendar className="w-4 h-4" /> Mapa de Ocupação
                </Link>
              ) : hasAccess('page.gantt') ? (
                <div
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-white/20 cursor-not-allowed select-none"
                  title="Módulo não disponível no seu plano"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Mapa de Ocupação</span>
                  <Lock className="w-3.5 h-3.5 ml-auto" />
                </div>
              ) : null}

              {hasAccess('page.manutencao') && (
                <Link
                  href="/admin/manutencao"
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                    pathname === '/admin/manutencao'
                      ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Wrench className="w-4 h-4" /> Manutenção
                </Link>
              )}

              {hasAccess('page.governanca') && (
                <Link
                  href="/admin/governanca"
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                    pathname === '/admin/governanca'
                      ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Sparkles className="w-4 h-4" /> Governança
                </Link>
              )}

              {hasAccess('page.estoque') && (
                <Link
                  href="/admin/estoque"
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                    pathname === '/admin/estoque'
                      ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Package className="w-4 h-4" /> Estoque
                </Link>
              )}

              {hasAccess('page.auditoria') && (
                <Link
                  href="/admin/auditoria"
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                    pathname === '/admin/auditoria'
                      ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <ShieldCheck className="w-4 h-4" /> Auditoria
                </Link>
              )}

              {/* Management & Setup Group */}
              <div className="pt-4 mt-4 border-t border-white/10 space-y-1">
                <div className="px-2 text-[9px] uppercase font-extrabold tracking-widest text-white/30 mb-1">
                  Gestão & Ajustes
                </div>
                {hasAccess('page.equipe') && (
                  <Link
                    href="/admin/equipe"
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                      pathname === '/admin/equipe'
                        ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Users className="w-4 h-4" /> Equipe
                  </Link>
                )}
                {hasAccess('page.quartos') && (
                  <Link
                    href="/admin/quartos"
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                      pathname === '/admin/quartos'
                        ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Building2 className="w-4 h-4" /> Quartos
                  </Link>
                )}
                {hasAccess('page.financeiro') && (
                  <Link
                    href="/admin/financeiro"
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                      pathname === '/admin/financeiro'
                        ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <DollarSign className="w-4 h-4" /> Financeiro
                  </Link>
                )}
                {hasAccess('page.marketing') && (
                  <Link
                    href="/admin/marketing/cupons"
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                      pathname.startsWith('/admin/marketing')
                        ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Tag className="w-4 h-4" /> Cupons
                  </Link>
                )}
                {hasAccess('page.integracoes') && canUseWebhooks ? (
                  <Link
                    href="/admin/integracoes"
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                      pathname === '/admin/integracoes'
                        ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <CloudLightning className="w-4 h-4" /> Integrações
                  </Link>
                ) : hasAccess('page.integracoes') ? (
                  <div
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-white/20 cursor-not-allowed select-none"
                    title="Módulo Webhooks & API não disponível no seu plano"
                  >
                    <CloudLightning className="w-4 h-4" />
                    <span>Integrações</span>
                    <Lock className="w-3.5 h-3.5 ml-auto" />
                  </div>
                ) : null}
                {hasAccess('page.meu-plano') && (
                  <Link
                    href="/admin/meu-plano"
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                      pathname === '/admin/meu-plano'
                        ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <CreditCard className="w-4 h-4" /> Meu Plano
                  </Link>
                )}
                {hasAccess('page.configuracoes') && (
                  <Link
                    href="/admin/configuracoes"
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                      pathname === '/admin/configuracoes'
                        ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Settings className="w-4 h-4" /> Personalizar Site
                  </Link>
                )}
              </div>
            </nav>
          </div>

          {/* User Profile Footer */}
          <div className="relative z-10 pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-xs text-white shadow-md shrink-0">
                {(user?.nome || 'A').charAt(0)}
              </div>
              <div className="overflow-hidden flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {user?.nome || 'Administrador'}
                </div>
                <div className="text-[9px] uppercase font-bold text-indigo-300 font-mono">
                  {user?.role || 'ADMIN'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-white/40 hover:text-red-400 rounded-xl hover:bg-white/10 transition-colors"
                title="Sair do sistema"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 blur-[140px] rounded-full pointer-events-none" />

        {/* Mobile Header */}
        <header className="md:hidden h-16 flex items-center justify-between px-4 sticky top-0 z-30 shrink-0 bg-[#080814] border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              className="p-2 -ml-2 text-white/70 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-sm font-bold tracking-tight text-white">{hotel.nome}</span>
          </div>
        </header>

        {/* Main View Container */}
        <main className="flex-1 overflow-y-auto px-4 md:px-10 pb-10 pt-6 md:pt-10 relative z-0">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}