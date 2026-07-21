'use client';

import React, { useState } from 'react';
import {
  BedDouble, Tag, Plus, Edit2, LayoutList,
  Settings2, Hash, Zap, Image as ImageIcon, Trash2, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenantStore, useActiveBranchData } from '../../../store/useTenantStore';
import { api, request } from '../../../lib/api';
import { alerts } from '../../../lib/alerts';

export default function QuartosPage() {
  const { roomCategories, rooms, addRoomCategory, updateRoomCategoryPhotos, addRoom, addAuditLog, user } = useActiveBranchData();
  const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'ROOMS'>('CATEGORIES');

  // Modals
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isCatEditModalOpen, setIsCatEditModalOpen] = useState(false);

  // Form Categoria Create & Edit
  const [catName, setCatName] = useState('');
  const [catPrice, setCatPrice] = useState('');
  const [catCap, setCatCap] = useState('2');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Form Categoria Edit (Fotos)
  const [editingCatFotos, setEditingCatFotos] = useState<string[]>([]);
  const [newFotoUrl, setNewFotoUrl] = useState('');

  // Form Quarto
  const [roomNum, setRoomNum] = useState('');
  const [roomCatId, setRoomCatId] = useState('');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  const handleOpenCatModal = (cat?: any) => {
    if (cat) {
      setEditingCatId(cat.id);
      setCatName(cat.nome);
      setCatPrice(cat.valorBase.toString());
      setCatCap(cat.capacidadeMaxima.toString());
    } else {
      setEditingCatId(null);
      setCatName('');
      setCatPrice('');
      setCatCap('2');
    }
    setIsCatModalOpen(true);
  };

  const handleOpenRoomModal = (room?: any) => {
    if (room) {
      setEditingRoomId(room.id);
      setRoomNum(room.numero);
      setRoomCatId(room.categoryId);
    } else {
      setEditingRoomId(null);
      setRoomNum('');
      setRoomCatId('');
    }
    setIsRoomModalOpen(true);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catPrice) return;

    try {
      if (editingCatId) {
        await api.updateRoomCategory(editingCatId, {
          nome: catName,
          valorBase: parseFloat(catPrice),
          capacidadeMaxima: parseInt(catCap),
          comodidades: ['Ar-condicionado', 'Wi-Fi', 'TV']
        });

        addAuditLog({
          id: 'a_' + Date.now(),
          usuario: user?.nome || 'Admin',
          data: new Date().toISOString(),
          acao: 'ATUALIZAR',
          entidade: 'ROOM_CATEGORY',
          detalhes: `Categoria atualizada: ${catName}`
        });
        alerts.success('Categoria atualizada!');
      } else {
        await api.createRoomCategory({
          nome: catName,
          valorBase: parseFloat(catPrice),
          capacidadeMaxima: parseInt(catCap),
          comodidades: ['Ar-condicionado', 'Wi-Fi', 'TV']
        });

        addAuditLog({
          id: 'a_' + Date.now(),
          usuario: user?.nome || 'Admin',
          data: new Date().toISOString(),
          acao: 'CRIAR',
          entidade: 'ROOM_CATEGORY',
          detalhes: `Nova categoria criada: ${catName}`
        });
        alerts.success('Categoria criada!');
      }

      setIsCatModalOpen(false);
      setCatName(''); setCatPrice(''); setCatCap('2'); setEditingCatId(null);
    } catch (err: any) {
      alerts.error(editingCatId ? 'Erro ao atualizar categoria' : 'Erro ao criar categoria', err.message);
    }
  };

  const openEditCat = (cat: any) => {
    setEditingCatId(cat.id);
    setEditingCatFotos(cat.fotos || []);
    setNewFotoUrl('');
    setIsCatEditModalOpen(true);
  };

  const handleAddFoto = () => {
    if (newFotoUrl.trim() !== '') {
      setEditingCatFotos([...editingCatFotos, newFotoUrl]);
      setNewFotoUrl('');
    }
  };

  const handleRemoveFoto = (idx: number) => {
    setEditingCatFotos(editingCatFotos.filter((_, i) => i !== idx));
  };

  const handleSavePhotos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCatId) {
      // Atualiza fotos via API
      try {
        await request(`/rooms/categories/${editingCatId}`, {
          method: 'PUT',
          body: JSON.stringify({ fotos: editingCatFotos })
        });
        await api.getRoomCategories();

        addAuditLog({
          id: 'a_' + Date.now(),
          usuario: user?.nome || 'Admin',
          data: new Date().toISOString(),
          acao: 'ATUALIZAR',
          entidade: 'ROOM_CATEGORY',
          detalhes: `Fotos da categoria atualizadas.`
        });
        alerts.success('Fotos atualizadas!');
      } catch(err: any) {
         alerts.error('Erro ao salvar fotos', err.message);
      }
    }
    setIsCatEditModalOpen(false);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNum || !roomCatId) return;

    try {
      if (editingRoomId) {
        await api.updateRoom(editingRoomId, {
          numero: roomNum,
          categoryId: roomCatId
        });

        addAuditLog({
          id: 'a_' + Date.now(),
          usuario: user?.nome || 'Admin',
          data: new Date().toISOString(),
          acao: 'ATUALIZAR',
          entidade: 'ROOM',
          detalhes: `Quarto atualizado: ${roomNum}`
        });
        alerts.success('Quarto atualizado!');
      } else {
        await api.createRoom({
          numero: roomNum,
          categoryId: roomCatId,
          status: 'DISPONIVEL',
          observacoes: ''
        });

        addAuditLog({
          id: 'a_' + Date.now(),
          usuario: user?.nome || 'Admin',
          data: new Date().toISOString(),
          acao: 'CRIAR',
          entidade: 'ROOM',
          detalhes: `Novo quarto criado: ${roomNum}`
        });
        alerts.success('Quarto criado!');
      }

      setIsRoomModalOpen(false);
      setRoomNum(''); setRoomCatId(''); setEditingRoomId(null);
    } catch (err: any) {
      alerts.error(editingRoomId ? 'Erro ao atualizar quarto' : 'Erro ao criar quarto', err.message);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    const isConfirmed = await alerts.confirm('Excluir Quarto', 'Tem certeza que deseja excluir este quarto? Esta ação não pode ser desfeita.');
    if (isConfirmed) {
      try {
        await api.deleteRoom(id);
        alerts.success('Quarto excluído!');
      } catch (err: any) {
        alerts.error('Erro ao excluir', err.message);
      }
    }
  };

  const handleEditRoom = async (id: string, currentStatus: string) => {
    const status = await alerts.prompt('Editar Status', currentStatus, 'DISPONIVEL, OCUPADO, LIMPEZA, MANUTENCAO');
    if (status) {
      try {
        await api.updateRoom(id, { status: status.toUpperCase() });
        alerts.success('Status atualizado!');
      } catch (err: any) {
        alerts.error('Erro ao atualizar', err.message);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8 pb-20 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Quartos & Categorias
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Configure preços, fotos e tipos de quarto para o site de vendas.</p>
        </div>

        <div className="flex gap-3 bg-white/[0.03] p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('CATEGORIES')}
            className={`px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'CATEGORIES' ? 'bg-white/10 text-white shadow-md' : 'text-white/40 hover:text-white/80'}`}
          >
            <Tag className="w-3.5 h-3.5" /> Categorias & Fotos
          </button>
          <button
            onClick={() => setActiveTab('ROOMS')}
            className={`px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'ROOMS' ? 'bg-white/10 text-white shadow-md' : 'text-white/40 hover:text-white/80'}`}
          >
            <LayoutList className="w-3.5 h-3.5" /> Mapa de Unidades
          </button>
        </div>
      </div>

      {/* Aba: CATEGORIAS */}
      {activeTab === 'CATEGORIES' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => handleOpenCatModal()} className="px-6 py-3 bg-white hover:bg-white/90 text-black font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nova Categoria
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roomCategories.map(cat => {
              const countRooms = rooms.filter(r => r.categoryId === cat.id).length;
              const fotosCount = cat.fotos?.length || 0;
              return (
                <div key={cat.id} className="glass-card p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center border border-brand/20">
                        <BedDouble className="w-5 h-5" />
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-white/5 rounded text-white/50">{countRooms} Und</span>
                        <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded border ${fotosCount > 0 ? 'bg-brand/10 text-brand border-brand/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{fotosCount} Fotos</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">{cat.nome}</h3>
                    <div className="flex items-center gap-2 text-white/40 text-[12px] font-medium mb-6">
                      <Zap className="w-3.5 h-3.5" /> Capacidade: {cat.capacidadeMaxima} Pessoas
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {cat.comodidades.slice(0, 3).map((c: string, idx: number) => (
                        <span key={idx} className="text-[9px] uppercase font-bold tracking-widest px-2 py-1 bg-white/[0.03] border border-white/5 rounded text-white/60">
                          {c}
                        </span>
                      ))}
                      {cat.comodidades.length > 3 && <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-1 text-white/40">+{cat.comodidades.length - 3}</span>}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Diária Base</span>
                      <span className="text-lg font-bold text-emerald-400 font-mono">R$ {cat.valorBase.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenCatModal(cat)} className="px-3 py-2 flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors text-[10px] uppercase font-bold tracking-widest">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEditCat(cat)} className="px-4 py-2 flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors text-[10px] uppercase font-bold tracking-widest">
                        <ImageIcon className="w-3.5 h-3.5" /> Fotos
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aba: QUARTOS FISICOS */}
      {activeTab === 'ROOMS' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => handleOpenRoomModal()} className="px-6 py-3 bg-white hover:bg-white/90 text-black font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center gap-2">
              <Plus className="w-4 h-4" /> Adicionar Quarto Físico
            </button>
          </div>

          <div className="bg-black border border-white/[0.04] rounded-[24px] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.04] text-white/30 uppercase tracking-widest font-bold text-[10px]">
                    <th className="py-4 px-6">Identificação</th>
                    <th className="py-4 px-6">Categoria</th>
                    <th className="py-4 px-6">Status Atual</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {rooms.map(room => {
                    const cat = roomCategories.find(c => c.id === room.categoryId);
                    return (
                      <tr key={room.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <Hash className="w-4 h-4 text-white/20" />
                            <span className="font-bold text-white text-base font-mono">{room.numero}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-white/70 font-medium bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            {cat?.nome || 'Desconhecida'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded-md ${
                            room.status === 'DISPONIVEL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            room.status === 'OCUPADO' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            room.status === 'LIMPEZA' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            {room.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right flex items-center justify-end gap-3">
                          <button onClick={() => handleEditRoom(room.id, room.status)} className="text-[10px] uppercase font-bold tracking-widest text-white/30 hover:text-brand transition-colors">
                            Editar Status
                          </button>
                          <button onClick={() => handleOpenRoomModal(room)} className="text-white/30 hover:text-white transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteRoom(room.id)} className="text-white/30 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Categoria */}
      <AnimatePresence>
        {isCatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCatModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">

              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
                <h2 className="text-lg font-bold text-white tracking-tight">{editingCatId ? 'Editar Categoria' : 'Nova Categoria'}</h2>
                <button onClick={() => setIsCatModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"><XCircle className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreateCategory} className="flex flex-col">
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Nome Comercial</label>
                    <input required type="text" value={catName} onChange={e => setCatName(e.target.value)} placeholder="Ex: Suíte Presidencial" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Diária Base (R$)</label>
                      <input required type="number" min="0" step="0.01" value={catPrice} onChange={e => setCatPrice(e.target.value)} placeholder="250.00" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Capacidade (Pessoas)</label>
                      <input required type="number" min="1" max="10" value={catCap} onChange={e => setCatCap(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all shadow-inner" />
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-black/40 flex gap-4">
                  <button type="button" onClick={() => setIsCatModalOpen(false)} className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-white/70 text-[13px] font-bold rounded-xl transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 bg-white hover:bg-white/90 text-black text-[13px] font-bold rounded-xl transition-all shadow-lg">{editingCatId ? 'Salvar Alterações' : 'Criar Categoria'}</button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Gestão de Fotos */}
      <AnimatePresence>
        {isCatEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCatEditModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">

              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Gerenciar Fotos</h2>
                  <p className="text-[11px] font-medium text-white/40 mt-1">Insira os links das imagens que aparecerão no portal de vendas.</p>
                </div>
                <button onClick={() => setIsCatEditModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"><XCircle className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSavePhotos} className="flex flex-col">
                <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                  <div className="flex gap-3">
                    <input type="text" value={newFotoUrl} onChange={e => setNewFotoUrl(e.target.value)} placeholder="Cole a URL da foto aqui (https://...)" className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand" />
                    <button type="button" onClick={handleAddFoto} className="px-6 py-3 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all">Adicionar</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-h-60 overflow-y-auto pr-2">
                    {editingCatFotos.map((url, idx) => (
                      <div key={idx} className="relative group aspect-video bg-black rounded-xl overflow-hidden border border-white/10">
                        <img src={url} alt="Room preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = '/placeholder-hotel.svg')} />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => handleRemoveFoto(idx)} className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500/40 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                    {editingCatFotos.length === 0 && (
                      <div className="col-span-full py-8 text-center border-2 border-dashed border-white/10 rounded-xl text-white/30 text-[12px] font-medium uppercase tracking-widest">Nenhuma foto cadastrada</div>
                    )}
                  </div>
                </div>
                <div className="p-6 border-t border-white/5 bg-black/40 flex gap-4">
                  <button type="button" onClick={() => setIsCatEditModalOpen(false)} className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-white/70 text-[13px] font-bold rounded-xl transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 bg-white hover:bg-white/90 text-black text-[13px] font-bold rounded-xl transition-all shadow-lg">Salvar Alterações</button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Novo Quarto */}
      <AnimatePresence>
        {isRoomModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRoomModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">

              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
                <h2 className="text-lg font-bold text-white tracking-tight">{editingRoomId ? 'Editar Quarto Físico' : 'Cadastrar Quarto Físico'}</h2>
                <button onClick={() => setIsRoomModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"><XCircle className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreateRoom} className="flex flex-col">
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Número / Identificação</label>
                    <input required type="text" value={roomNum} onChange={e => setRoomNum(e.target.value)} placeholder="Ex: 101" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white font-mono outline-none focus:border-brand" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Vincular a Categoria</label>
                    <select required value={roomCatId} onChange={e => setRoomCatId(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all cursor-pointer shadow-inner">
                      <option value="" disabled>Selecione uma Categoria...</option>
                      {roomCategories.map(c => <option key={c.id} value={c.id}>{c.nome} (R$ {c.valorBase.toFixed(2)})</option>)}
                    </select>
                  </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-black/40 flex gap-4">
                  <button type="button" onClick={() => setIsRoomModalOpen(false)} className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-white/70 text-[13px] font-bold rounded-xl transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 bg-white hover:bg-white/90 text-black text-[13px] font-bold rounded-xl transition-all shadow-lg">{editingRoomId ? 'Salvar Alterações' : 'Cadastrar Quarto'}</button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
