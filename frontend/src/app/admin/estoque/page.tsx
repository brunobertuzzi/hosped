'use client';

import React, { useState, useMemo } from 'react';
import { 
  Package, Search, PlusCircle, AlertTriangle, TrendingUp, 
  ShoppingCart, ShieldAlert, Check, Plus, Minus, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenantStore, useActiveBranchData } from '../../../store/useTenantStore';
import { api } from '../../../lib/api';
import { alerts } from '../../../lib/alerts';

export default function EstoquePage() {
  const { inventory, reservations, rooms, guests, user } = useActiveBranchData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockItemId, setRestockItemId] = useState('');
  const [restockQty, setRestockQty] = useState(10);
  
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('BEBIDA');
  const [newItemUnit, setNewItemUnit] = useState('UN');
  const [newItemQty, setNewItemQty] = useState(0);
  const [newItemMin, setNewItemMin] = useState(5);
  const [newItemPrice, setNewItemPrice] = useState(0.00);

  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  const [consumptionResId, setConsumptionResId] = useState('');
  const [consumptionItemId, setConsumptionItemId] = useState('');
  const [consumptionQty, setConsumptionQty] = useState(1);

  const categories = useMemo(() => ['ALL', ...Array.from(new Set(inventory.map(item => item.categoria)))], [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'ALL' || item.categoria === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [inventory, searchTerm, selectedCategory]);

  const metrics = useMemo(() => {
    const totalItems = inventory.length;
    const lowStockCount = inventory.filter(item => item.quantidade <= item.estoqueMinimo && item.quantidade > 0).length;
    const outOfStockCount = inventory.filter(item => item.quantidade === 0).length;
    const totalConsumptionValue = reservations.reduce((sum: number, res: any) => sum + (res.consumptions || []).reduce((s: number, c: any) => s + Number(c.valorTotal), 0), 0);
    return { totalItems, lowStockCount, outOfStockCount, totalConsumptionValue };
  }, [inventory, reservations]);

  const activeHospedes = useMemo(() => {
    return reservations.filter(res => res.status === 'HOSPEDADO').map(res => {
      const guest = guests.find(g => g.id === res.guestId);
      const room = rooms.find(r => r.id === res.roomId);
      return { id: res.id, guestName: guest ? guest.nome : 'Desconhecido', roomNumero: room ? room.numero : 'S/Q', valorAtual: res.valorTotal };
    });
  }, [reservations, guests, rooms]);

  const handleRestock = async () => {
    if (!restockItemId || restockQty <= 0) return;
    try {
      const store = useTenantStore.getState();
      const item = store.inventory.find(i => i.id === restockItemId);
      if (!item) throw new Error('Item não encontrado.');
      
      await api.updateInventoryItem(restockItemId, {
        quantidade: item.quantidade + Number(restockQty)
      });
      await api.getInventory();
      
      setIsRestockModalOpen(false); setRestockItemId(''); setRestockQty(10);
      alerts.success('Estoque reposto com sucesso!');
    } catch (err: any) { alerts.error('Atenção', err.message); }
  };

  const handleAddNewItem = async () => {
    if (!newItemName || newItemPrice < 0) return;
    try {
      await api.createInventoryItem({
        nome: newItemName,
        categoria: newItemCategory,
        unidade: newItemUnit,
        quantidade: Number(newItemQty),
        estoqueMinimo: Number(newItemMin),
        valorVenda: Number(newItemPrice)
      });
      setIsNewItemModalOpen(false); setNewItemName(''); setNewItemQty(0); setNewItemMin(5); setNewItemPrice(0.00);
      alerts.success('Item cadastrado!');
    } catch (err: any) { alerts.error('Atenção', err.message); }
  };

  const handleRegisterConsumption = async () => {
    if (!consumptionResId || !consumptionItemId || consumptionQty <= 0) return;
    const item = inventory.find(i => i.id === consumptionItemId);
    if (!item) return alerts.error('Atenção', 'Item não encontrado.');
    if (item.quantidade < consumptionQty) return alerts.error('Atenção', 'Quantidade insuficiente em estoque.');
    try {
      await api.addConsumption(consumptionResId, consumptionItemId, consumptionQty);
      setIsConsumptionModalOpen(false); setConsumptionResId(''); setConsumptionItemId(''); setConsumptionQty(1);
      alerts.success('Consumo registrado!');
    } catch (err: any) { alerts.error('Atenção', err.message); }
  };

  const handleEditItem = async (id: string, currentPrice: number, currentStock: number) => {
    const priceStr = await alerts.prompt('Novo valor de venda', currentPrice.toString());
    if (!priceStr) return;
    
    const stockStr = await alerts.prompt('Nova quantidade', currentStock.toString());
    if (!stockStr) return;
    
    try {
      await api.updateInventoryItem(id, { 
        valorVenda: Number(priceStr), 
        quantidade: Number(stockStr) 
      });
      await api.getInventory();
      alerts.success('Produto atualizado!');
    } catch (err: any) {
      alerts.error('Erro ao atualizar', err.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const isConfirmed = await alerts.confirm('Excluir Item', 'Tem certeza que deseja excluir este item do estoque?');
    if (isConfirmed) {
      try {
        await api.deleteInventoryItem(id);
        await api.getInventory();
        alerts.success('Item excluído!');
      } catch (err: any) {
        alerts.error('Erro ao excluir', err.message);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Almoxarifado
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Controle de consumíveis, reabastecimento e PDV de hóspedes.</p>
        </div>
        <div className="flex gap-3">
          {user?.role !== 'HOUSEKEEPING' && (
            <>
              <button onClick={() => setIsNewItemModalOpen(true)} className="px-4 py-2 bg-transparent hover:bg-white/[0.03] border border-white/10 rounded-xl text-[11px] font-bold text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                <PlusCircle className="w-3.5 h-3.5" /> Item
              </button>
              <button onClick={() => setIsRestockModalOpen(true)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-bold text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Repor
              </button>
            </>
          )}
          <button onClick={() => setIsConsumptionModalOpen(true)} className="px-5 py-2 bg-white hover:bg-white/90 text-black rounded-xl text-[11px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
            <ShoppingCart className="w-3.5 h-3.5" /> Consumo PDV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-6">
          <div className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-3">Itens Cadastrados</div>
          <div className="text-3xl font-bold text-white tracking-tight">{metrics.totalItems}</div>
        </div>
        <div className="glass-card p-6">
          <div className="text-[10px] uppercase font-bold tracking-widest text-amber-500/80 mb-3 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Estoque Baixo</div>
          <div className="text-3xl font-bold text-amber-500 tracking-tight">{metrics.lowStockCount}</div>
        </div>
        <div className="glass-card p-6">
          <div className="text-[10px] uppercase font-bold tracking-widest text-red-500/80 mb-3 flex items-center gap-1.5"><ShieldAlert className="w-3 h-3" /> Esgotados</div>
          <div className="text-3xl font-bold text-red-500 tracking-tight">{metrics.outOfStockCount}</div>
        </div>
        <div className="glass-card p-6 border-t-2 border-emerald-500/50">
          <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/80 mb-3">Faturamento Extra</div>
          <div className="text-3xl font-bold text-emerald-400 tracking-tight">R$ {metrics.totalConsumptionValue.toFixed(2)}</div>
        </div>
      </div>

      <div className="glass-panel p-6 border border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-white/30" />
            <input type="text" placeholder="Localizar item no estoque..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-full pl-12 pr-4 py-3 text-[13px] text-white placeholder-white/30 outline-none focus:border-brand transition-colors" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/30">Filtro:</span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-white text-black' : 'bg-transparent border border-white/10 hover:bg-white/5 text-white/50'}`}>
                  {cat === 'ALL' ? 'Todos' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-white/10 text-white/30 uppercase tracking-widest font-bold text-[10px]">
                <th className="py-4 px-4 font-bold">Produto</th>
                <th className="py-4 px-4">Categoria</th>
                <th className="py-4 px-4 text-center">Unidade</th>
                <th className="py-4 px-4 text-right">Mínimo</th>
                <th className="py-4 px-4 text-right">Venda (R$)</th>
                <th className="py-4 px-4 text-center">Saldo</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredInventory.map(item => {
                const isOutOfStock = item.quantidade === 0;
                const isLowStock = item.quantidade <= item.estoqueMinimo && !isOutOfStock;
                return (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-4 font-semibold text-white/90">{item.nome}</td>
                    <td className="py-4 px-4"><span className="text-[9px] uppercase tracking-widest text-white/50 font-bold">{item.categoria}</span></td>
                    <td className="py-4 px-4 text-center text-white/40">{item.unidade}</td>
                    <td className="py-4 px-4 text-right text-white/40">{item.estoqueMinimo}</td>
                    <td className="py-4 px-4 text-right font-medium text-white/80">{item.valorVenda.toFixed(2)}</td>
                    <td className={`py-4 px-4 text-center font-bold ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-emerald-400'}`}>{item.quantidade}</td>
                    <td className="py-4 px-4 text-center">
                      {isOutOfStock ? <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-[9px] font-bold uppercase tracking-widest">Esgotado</span>
                        : isLowStock ? <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-500 text-[9px] font-bold uppercase tracking-widest">Baixo</span>
                        : <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-widest">Regular</span>}
                    </td>
                    <td className="py-4 px-4 text-right flex items-center justify-end gap-3">
                      <button onClick={() => handleEditItem(item.id, item.valorVenda, item.quantidade)} className="text-[10px] text-white/40 hover:text-brand uppercase font-bold tracking-widest">Editar</button>
                      <button onClick={() => handleDeleteItem(item.id)} className="text-white/40 hover:text-red-400"><Minus className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
              {filteredInventory.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-white/30 text-xs">Nenhum item encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isRestockModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> Repor Estoque</h2>
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-white/40 mb-1.5 font-bold uppercase tracking-widest text-[10px]">Produto</label>
                  <select value={restockItemId} onChange={e => setRestockItemId(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-brand">
                    <option value="" className="bg-black">Selecione...</option>
                    {inventory.map(i => <option key={i.id} value={i.id} className="bg-black">{i.nome} ({i.quantidade} {i.unidade})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-white/40 mb-1.5 font-bold uppercase tracking-widest text-[10px]">Qtd Adicional</label>
                  <input type="number" value={restockQty} onChange={e => setRestockQty(Number(e.target.value))} min="1" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-brand" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsRestockModalOpen(false)} className="flex-1 py-3 bg-transparent border border-white/10 text-white/40 text-[11px] font-bold uppercase tracking-widest rounded-xl">Cancelar</button>
                <button onClick={handleRestock} className="flex-1 py-3 bg-emerald-500 text-black text-[11px] font-bold uppercase tracking-widest rounded-xl">Adicionar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNewItemModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2"><Package className="w-4 h-4 text-brand" /> Cadastrar Produto</h2>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="col-span-2">
                  <label className="block text-white/40 mb-1.5 font-bold uppercase tracking-widest text-[10px]">Nome</label>
                  <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-white/40 mb-1.5 font-bold uppercase tracking-widest text-[10px]">Categoria</label>
                  <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none">
                    <option value="BEBIDA" className="bg-black">Bebida</option>
                    <option value="ALIMENTACAO" className="bg-black">Alimentação</option>
                    <option value="OUTROS" className="bg-black">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/40 mb-1.5 font-bold uppercase tracking-widest text-[10px]">Unidade</label>
                  <input type="text" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} placeholder="UN" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-white/40 mb-1.5 font-bold uppercase tracking-widest text-[10px]">Qtd Inicial</label>
                  <input type="number" value={newItemQty} onChange={e => setNewItemQty(Number(e.target.value))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-white/40 mb-1.5 font-bold uppercase tracking-widest text-[10px]">Estoque Mín.</label>
                  <input type="number" value={newItemMin} onChange={e => setNewItemMin(Number(e.target.value))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-white/40 mb-1.5 font-bold uppercase tracking-widest text-[10px]">Preço Venda (R$)</label>
                  <input type="number" value={newItemPrice} onChange={e => setNewItemPrice(Number(e.target.value))} step="0.01" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsNewItemModalOpen(false)} className="flex-1 py-3 bg-transparent border border-white/10 text-white/40 text-[11px] font-bold uppercase tracking-widest rounded-xl">Cancelar</button>
                <button onClick={handleAddNewItem} className="flex-1 py-3 bg-white text-black text-[11px] font-bold uppercase tracking-widest rounded-xl">Salvar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isConsumptionModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-brand" /> PDV - Lançar Débito</h2>
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-white/40 mb-1.5 font-bold uppercase tracking-widest text-[10px]">Hóspede (Quarto)</label>
                  {activeHospedes.length > 0 ? (
                    <select value={consumptionResId} onChange={e => setConsumptionResId(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none">
                      <option value="" className="bg-black">Selecione...</option>
                      {activeHospedes.map(h => <option key={h.id} value={h.id} className="bg-black">Qto {h.roomNumero} - {h.guestName}</option>)}
                    </select>
                  ) : <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/40">Nenhum hóspede ativo.</div>}
                </div>
                <div>
                  <label className="block text-white/40 mb-1.5 font-bold uppercase tracking-widest text-[10px]">Produto</label>
                  <select value={consumptionItemId} onChange={e => setConsumptionItemId(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none">
                    <option value="" className="bg-black">Selecione...</option>
                    {inventory.map(i => <option key={i.id} value={i.id} disabled={i.quantidade<=0} className="bg-black">{i.nome} (R$ {i.valorVenda.toFixed(2)})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-white/40 mb-1.5 font-bold uppercase tracking-widest text-[10px]">Quantidade</label>
                  <input type="number" value={consumptionQty} onChange={e => setConsumptionQty(Number(e.target.value))} min="1" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsConsumptionModalOpen(false)} className="flex-1 py-3 bg-transparent border border-white/10 text-white/40 text-[11px] font-bold uppercase tracking-widest rounded-xl">Cancelar</button>
                <button onClick={handleRegisterConsumption} disabled={activeHospedes.length === 0 || !consumptionResId || !consumptionItemId} className="flex-1 py-3 bg-white text-black disabled:opacity-30 text-[11px] font-bold uppercase tracking-widest rounded-xl">Lançar Conta</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
