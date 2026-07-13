'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, Activity, Calendar, Package, ShieldCheck, LogOut, MapPin, 
  ChevronRight, AlertTriangle, Moon, Palette, CheckCircle2, CloudLightning,
  Users, Wrench, Settings, DollarSign, LayoutDashboard, CalendarDays, Landmark, Sparkles, Menu, X
} from 'lucide-react';
import { useTenantStore } from '../../store/useTenantStore';
import { api } from '../../lib/api';
import { CommandPalette } from '../../components/CommandPalette';


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    user, hotel, branches, selectedBranchId, isOffline, 
    setSelectedBranchId, setUser, setHotelColors 
  } = useTenantStore();

  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
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

  const changeThemeColor = (colorHex: string) => {
    setHotelColors({ primary: colorHex, secondary: '#000000' });
  };

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
      <div className={`fixed md:relative inset-y-0 left-0 z-50 flex shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} py-5 pl-5 pr-5 md:pr-0 w-[280px] md:w-auto`}>
        <aside className="w-full md:w-64 glass-card border border-white/5 rounded-[24px] flex flex-col justify-between p-5 overflow-y-auto h-[calc(100vh-40px)] relative bg-[#0a0a0a] md:bg-transparent">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          
          <div className="space-y-10 relative z-10">
            {/* Logo e Info Hotel */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-lg">
                <img src={hotel.logo || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200'} alt="logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-white/90">{hotel.nome}</h2>
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Sistema Ativo</span>
              </div>
            </div>

            {/* Navegação Admin */}
            <nav className="space-y-1">
              <Link href="/admin/dashboard" className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/dashboard' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link href="/admin/reservas" className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/reservas' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                <CalendarDays className="w-4 h-4" /> Controle de Reservas
              </Link>
              <Link href="/admin/hospedes" className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/hospedes' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                <Users className="w-4 h-4" /> Cadastro de Hóspedes
              </Link>
              <Link href="/admin/gantt" className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/gantt' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                <Calendar className="w-4 h-4" /> Mapa de Ocupação
              </Link>
              {['HOTEL_OWNER', 'PLATFORM_OWNER', 'MANAGER', 'MAINTENANCE'].includes(user.role) && (
                <Link href="/admin/manutencao" className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/manutencao' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                  <Wrench className="w-4 h-4" /> Manutenção
                </Link>
              )}
              {['HOTEL_OWNER', 'PLATFORM_OWNER', 'MANAGER', 'HOUSEKEEPING'].includes(user.role) && (
                <Link href="/admin/governanca" className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/governanca' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                  <Sparkles className="w-4 h-4" /> Governança (Limpeza)
                </Link>
              )}
              {['HOTEL_OWNER', 'PLATFORM_OWNER', 'MANAGER', 'INVENTORY'].includes(user.role) && (
                <Link href="/admin/estoque" className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/estoque' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                  <Package className="w-4 h-4" /> Estoque & Consumos
                </Link>
              )}
              {['HOTEL_OWNER', 'PLATFORM_OWNER', 'MANAGER'].includes(user.role) && (
                <Link href="/admin/auditoria" className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/auditoria' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                  <ShieldCheck className="w-4 h-4" /> Histórico de Ações
                </Link>
              )}
              {['HOTEL_OWNER', 'PLATFORM_OWNER', 'MANAGER'].includes(user.role) && (
                <div className="pt-6 mt-6 border-t border-white/5 space-y-1">
                  <span className="block px-3 text-[10px] uppercase font-bold tracking-widest text-white/30 mb-2">Setup & Gestão</span>
                  <Link href="/admin/equipe" className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/equipe' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                    <Users className="w-4 h-4" /> Equipe (RH)
                  </Link>
                  <Link href="/admin/quartos" className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/quartos' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                    <Building2 className="w-4 h-4" /> Quartos & Categorias
                  </Link>
                  <Link href="/admin/financeiro" className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/financeiro' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                    <DollarSign className="w-4 h-4" /> Financeiro
                  </Link>
                  <Link href="/admin/integracoes" className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/integracoes' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                    <CloudLightning className="w-4 h-4" /> Integrações
                  </Link>
                  <Link href="/admin/configuracoes" className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${pathname === '/admin/configuracoes' ? 'active-tab shadow-sm' : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'}`}>
                    <Settings className="w-4 h-4" /> Configurações
                  </Link>
                </div>
              )}

              <div className="pt-6 mt-6 border-t border-white/5">
                <Link href={`/${hotel.id || '11111111-1111-1111-1111-111111111111'}`} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-brand hover:bg-brand/10 transition-colors">
                  <CloudLightning className="w-4 h-4" /> Ver Site de Reservas
                </Link>
              </div>
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

        {/* Topbar Superior */}
        <header className="h-[88px] flex items-center justify-between px-4 md:px-10 sticky top-0 z-30 shrink-0 bg-black/40 backdrop-blur-xl border-b border-white/[0.02]">
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              className="md:hidden p-2 -ml-2 text-white/70 hover:text-white"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 md:gap-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 py-1.5 px-2 md:px-3 rounded-xl transition-colors">
              <MapPin className="w-4 h-4 text-white/40" />
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-bold tracking-widest text-white/30">Operação Local</span>
                <select 
                  value={selectedBranchId}
                  onChange={e => setSelectedBranchId(e.target.value)}
                  className="bg-transparent text-[11px] md:text-[13px] font-bold text-white/80 outline-none cursor-pointer border-none appearance-none hover:text-white transition-colors w-24 md:w-48 truncate"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id} className="bg-black text-white">{b.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            
            {/* Color Theme Selector */}
            <div className="relative">
              <button
                onClick={() => setIsThemePanelOpen(!isThemePanelOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-[11px] font-bold tracking-widest uppercase rounded-full text-white/70 transition-colors"
              >
                <Palette className="w-3 h-3 text-brand" /> Tema
              </button>
              
              {isThemePanelOpen && (
                <div className="absolute right-0 mt-3 w-48 glass-panel p-3 z-30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {['#ffffff', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4'].map(color => (
                      <button
                        key={color}
                        onClick={() => { changeThemeColor(color); setIsThemePanelOpen(false); }}
                        style={{ backgroundColor: color }}
                        className="w-8 h-8 rounded-full border border-white/10 hover:scale-110 active:scale-95 transition-transform"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status indicators */}
            <div className="hidden md:flex items-center gap-4 text-[11px] uppercase tracking-widest font-bold">
              {isOffline ? (
                <span className="flex items-center gap-1.5 text-amber-500/90">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span></span>
                  Modo Simulação
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-400/90">
                  <span className="relative flex h-2 w-2"><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                  Conexão Ativa
                </span>
              )}
            </div>
          </div>
        </header>

        {/* View da Rota Ativa */}
        <main className="flex-1 overflow-y-auto px-4 md:px-10 pb-10 relative z-0">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
