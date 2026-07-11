'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Building, Activity, Server, Users, DollarSign, 
  Settings, LogOut, Hexagon, Terminal
} from 'lucide-react';
import { useTenantStore } from '../../store/useTenantStore';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useTenantStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'PLATFORM_OWNER') {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [user, router]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#030014] flex flex-col items-center justify-center font-sans">
        <span className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin mb-3" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030014] text-white flex font-sans overflow-hidden antialiased">
      <style>{`
        .bg-sistema { background-color: #6366f1; }
        .text-sistema { color: #818cf8; }
        .border-sistema { border-color: rgba(99, 102, 241, 0.3); }
        .glow-sistema { box-shadow: 0 0 40px -10px rgba(99, 102, 241, 0.4); }
        .active-tab { background-color: rgba(99, 102, 241, 0.1); color: #818cf8; border-right: 2px solid #818cf8; }
      `}</style>

      {/* Cyber/Sistema Sidebar */}
      <div className="w-64 bg-[#050505] border-r border-white/5 flex flex-col justify-between shrink-0 z-20">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 glow-sistema">
              <Hexagon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold tracking-tight text-white/90">Hosped Admin</h1>
              <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-400">God Mode</span>
            </div>
          </div>

          <nav className="space-y-1">
            <span className="block px-3 text-[10px] uppercase font-bold tracking-widest text-white/30 mb-2">Plataforma</span>
            
            <Link href="/super-admin" className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[13px] font-medium transition-all ${pathname === '/super-admin' ? 'active-tab' : 'text-white/40 hover:text-white hover:bg-white/[0.02]'}`}>
              <Activity className="w-4 h-4" /> Dashboard MRR
            </Link>
            
            <Link href="/super-admin/tenants" className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[13px] font-medium transition-all ${pathname === '/super-admin/tenants' ? 'active-tab' : 'text-white/40 hover:text-white hover:bg-white/[0.02]'}`}>
              <Building className="w-4 h-4" /> Gestão de Tenants
            </Link>

            <Link href="/super-admin/plans" className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[13px] font-medium transition-all ${pathname === '/super-admin/plans' ? 'active-tab' : 'text-white/40 hover:text-white hover:bg-white/[0.02]'}`}>
              <Settings className="w-4 h-4" /> Planos e Preços
            </Link>

            <Link href="/super-admin/invoices" className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[13px] font-medium transition-all ${pathname === '/super-admin/invoices' ? 'active-tab' : 'text-white/40 hover:text-white hover:bg-white/[0.02]'}`}>
              <DollarSign className="w-4 h-4" /> Faturas e Cobranças
            </Link>
            
            <div className="pt-6 mt-6 border-t border-white/5 space-y-1">
              <Link href="/super-admin/logs" className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[13px] font-medium transition-all ${pathname === '/super-admin/logs' ? 'active-tab' : 'text-white/40 hover:text-white hover:bg-white/[0.02]'}`}>
                <Terminal className="w-4 h-4" /> Logs de Auditoria
              </Link>
              <Link href="/super-admin/system-errors" className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[13px] font-medium transition-all ${pathname === '/super-admin/system-errors' ? 'active-tab' : 'text-white/40 hover:text-white hover:bg-white/[0.02]'}`}>
                <Server className="w-4 h-4" /> Erros de Sistema
              </Link>
            </div>
          </nav>
        </div>

        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs text-white">
              {user.nome[0]}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white/90">{user.nome}</div>
              <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-widest">Plataforma Owner</span>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-xs font-medium text-white/30 hover:text-red-400 px-3 py-2 rounded-lg transition-colors cursor-pointer text-left">
            <LogOut className="w-4 h-4" /> Sair do Painel
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto relative">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none" />
        <main className="p-10 relative z-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
