import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, Search } from 'lucide-react';

export function TenantFilterDropdown({ 
  sistemaClients, 
  selectedTenant, 
  setSelectedTenant 
}: { 
  sistemaClients: any[]; 
  selectedTenant: string; 
  setSelectedTenant: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = sistemaClients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const selected = sistemaClients.find(c => c.id === selectedTenant);

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white cursor-pointer flex items-center gap-2 min-w-[200px] justify-between transition-colors hover:bg-white/10"
      >
        <div className="flex items-center gap-2 truncate">
           <Filter className="w-3.5 h-3.5 text-white/30 shrink-0" />
           <span className="truncate">{selected ? selected.name : "Todas as Redes"}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
         <div className="absolute top-full mt-2 left-0 w-64 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-white/5 relative">
              <Search className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input 
                type="text" 
                placeholder="Buscar rede..."
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-[11px] font-mono text-white outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
               <div 
                 onClick={() => { setSelectedTenant(''); setIsOpen(false); setSearch(''); }}
                 className="px-4 py-2.5 hover:bg-white/[0.02] text-[11px] font-bold uppercase tracking-widest text-white/60 hover:text-white cursor-pointer border-b border-white/5"
               >
                 Todas as Redes
               </div>
               {filtered.length === 0 ? (
                 <div className="px-4 py-4 text-center text-[10px] uppercase tracking-widest text-white/30 font-bold">
                   Nenhuma rede encontrada
                 </div>
               ) : (
                 filtered.map(c => (
                   <div 
                     key={c.id}
                     onClick={() => { setSelectedTenant(c.id); setIsOpen(false); setSearch(''); }}
                     className={`px-4 py-2.5 hover:bg-white/[0.02] text-[11px] font-bold uppercase tracking-widest cursor-pointer truncate ${selectedTenant === c.id ? 'text-indigo-400 bg-indigo-500/10' : 'text-white/60 hover:text-white'}`}
                   >
                     {c.name}
                   </div>
                 ))
               )}
            </div>
         </div>
      )}
    </div>
  );
}
