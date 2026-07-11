'use client';

import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { Search, Calendar, LayoutDashboard, Bed, CreditCard, Settings } from 'lucide-react';
import { useActiveBranchData } from '../store/useTenantStore';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { reservations, guests } = useActiveBranchData();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">
        <Command label="Global Command Menu" onClick={(e) => e.stopPropagation()} className="w-full text-white">
          <div className="flex items-center px-4 border-b border-white/10">
            <Search className="w-5 h-5 text-white/40 mr-3 shrink-0" />
            <Command.Input 
              autoFocus 
              placeholder="Digite um comando ou busque (ex: Check-in, Hóspede)..." 
              className="w-full bg-transparent border-none py-4 text-sm outline-none text-white placeholder-white/40 font-medium"
            />
            <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-white/5 rounded-md">ESC</button>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin">
            <Command.Empty className="py-6 text-center text-sm text-white/40 font-medium">Nenhum resultado encontrado.</Command.Empty>

            <Command.Group heading="Navegação" className="px-2 py-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              <Command.Item 
                onSelect={() => { router.push('/admin/dashboard'); setOpen(false); }}
                className="flex items-center px-3 py-3 mt-1 text-sm rounded-xl cursor-pointer data-[selected=true]:bg-brand/10 data-[selected=true]:text-brand hover:bg-white/10 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 mr-3" /> Dashboard
              </Command.Item>
              <Command.Item 
                onSelect={() => { router.push('/admin/gantt'); setOpen(false); }}
                className="flex items-center px-3 py-3 mt-1 text-sm rounded-xl cursor-pointer data-[selected=true]:bg-brand/10 data-[selected=true]:text-brand hover:bg-white/10 transition-colors"
              >
                <Calendar className="w-4 h-4 mr-3" /> Mapa de Ocupação
              </Command.Item>
              <Command.Item 
                onSelect={() => { router.push('/admin/financeiro'); setOpen(false); }}
                className="flex items-center px-3 py-3 mt-1 text-sm rounded-xl cursor-pointer data-[selected=true]:bg-brand/10 data-[selected=true]:text-brand hover:bg-white/10 transition-colors"
              >
                <CreditCard className="w-4 h-4 mr-3" /> Financeiro
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Reservas Ativas" className="px-2 py-2 text-[10px] font-bold text-white/40 uppercase tracking-widest border-t border-white/5 mt-2 pt-4">
              {reservations.slice(0, 5).map(res => {
                const guest = guests.find(g => g.id === res.guestId);
                return (
                  <Command.Item 
                    key={res.id}
                    onSelect={() => { router.push(`/admin/gantt`); setOpen(false); }}
                    className="flex items-center px-3 py-3 mt-1 text-sm rounded-xl cursor-pointer data-[selected=true]:bg-brand/10 data-[selected=true]:text-brand hover:bg-white/10 transition-colors"
                  >
                    <Bed className="w-4 h-4 mr-3 opacity-60" /> 
                    <span>{guest?.nome} - {res.status}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>

          </Command.List>
        </Command>
      </div>
      
      {/* Invisible overlay for clicking outside to close */}
      <div className="absolute inset-0 z-[-1]" onClick={() => setOpen(false)} />
    </div>
  );
}
