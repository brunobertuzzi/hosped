'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Link as LinkIcon, RefreshCw, Save, ArrowLeft, Plus, X } from 'lucide-react';
import { api } from '../../../../lib/api';
import Link from 'next/link';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function ChannelManagerPage() {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<any[]>([]);
  const [syncs, setSyncs] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');

  const [importUrls, setImportUrls] = useState<string[]>(['']);
  const [exportToken, setExportToken] = useState('');
  const [syncId, setSyncId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsData, syncsData] = await Promise.all([
        api.getRooms(),
        api.getIcalSettings()
      ]);
      setRooms(roomsData);
      setSyncs(syncsData);

      if (roomsData.length > 0) {
        handleSelectRoom(roomsData[0].id, syncsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoom = (roomId: string, currentSyncs = syncs) => {
    setSelectedRoom(roomId);
    const sync = currentSyncs.find((s: any) => s.roomId === roomId);
    if (sync) {
      setSyncId(sync.id);
      setImportUrls(sync.importUrls.length ? sync.importUrls : ['']);
      setExportToken(sync.exportToken);
    } else {
      setSyncId('');
      setImportUrls(['']);
      setExportToken('');
    }
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...importUrls];
    newUrls[index] = value;
    setImportUrls(newUrls);
  };

  const handleAddUrl = () => {
    setImportUrls([...importUrls, '']);
  };

  const handleRemoveUrl = (index: number) => {
    const newUrls = importUrls.filter((_, i) => i !== index);
    if (newUrls.length === 0) newUrls.push('');
    setImportUrls(newUrls);
  };

  const handleSave = async () => {
    if (!selectedRoom) return;

    // Filter out empty URLs
    const filteredUrls = importUrls.filter(u => u.trim() !== '');

    try {
      setIsSaving(true);
      const updatedSync = await api.saveIcalSettings({
        roomId: selectedRoom,
        importUrls: filteredUrls
      });

      setSyncId(updatedSync.id);
      setExportToken(updatedSync.exportToken);

      // Update local state
      const newSyncs = [...syncs];
      const idx = newSyncs.findIndex(s => s.roomId === selectedRoom);
      if (idx >= 0) newSyncs[idx] = updatedSync;
      else newSyncs.push(updatedSync);
      setSyncs(newSyncs);

      MySwal.fire({
        title: 'Sucesso!',
        text: 'Configurações de iCal salvas com sucesso.',
        icon: 'success',
        background: '#111',
        color: '#fff',
        confirmButtonColor: '#6366f1'
      });
    } catch (err: any) {
      MySwal.fire('Erro', err.message || 'Falha ao salvar iCal', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncNow = async () => {
    if (!syncId) return;
    try {
      setIsSyncing(true);
      const res = await api.syncIcal(syncId);
      MySwal.fire({
        title: 'Sincronizado!',
        text: `Sincronização concluída. ${res.count} novas reservas importadas.`,
        icon: 'success',
        background: '#111',
        color: '#fff',
        confirmButtonColor: '#6366f1'
      });
    } catch (err: any) {
      MySwal.fire('Erro', err.message || 'Falha ao sincronizar', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const copyExportUrl = () => {
    const url = `${API_BASE}/ical/export/${exportToken}.ics`;
    navigator.clipboard.writeText(url);
    MySwal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Link copiado!',
      showConfirmButton: false,
      timer: 1500,
      background: '#222',
      color: '#fff'
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <span className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center gap-4">
        <Link href="/admin/integracoes" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Calendar className="w-8 h-8 text-brand" />
            Conexão com Sites de Reserva
          </h1>
          <p className="text-white/60 text-sm">
            Sincronize sua disponibilidade com Airbnb, Booking, Expedia e outros sites.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Seletor de Quarto */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-white/90">Quartos</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {rooms.map(room => {
                const isSelected = selectedRoom === room.id;
                const hasSync = syncs.find(s => s.roomId === room.id && s.exportToken);
                return (
                  <button
                    key={room.id}
                    onClick={() => handleSelectRoom(room.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all border ${isSelected ? 'bg-brand/10 border-brand/50 text-brand' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-sm">Quarto {room.numero}</div>
                      {hasSync && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Configurado" />}
                    </div>
                    <div className="text-xs opacity-60 truncate">{room.category?.nome}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Configurações do Quarto */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedRoom ? (
            <div className="glass-card border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <Calendar className="w-16 h-16 text-white/10 mb-4" />
              <h3 className="text-xl font-medium text-white/50">Selecione um Quarto</h3>
              <p className="text-sm text-white/30 mt-2">Escolha um quarto ao lado para configurar o mapeamento iCal.</p>
            </div>
          ) : (
            <div className="glass-card border border-white/10 rounded-2xl p-6 animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-brand" />
                Configuração de Sincronização
              </h2>

              <div className="space-y-8">

                {/* Exportar (Hosped -> OTA) */}
                <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3">
                  <h3 className="text-sm font-semibold text-blue-400">1. Exportar Calendário (Hosped ➔ Airbnb/Booking)</h3>
                  <p className="text-xs text-white/50">Copie o link abaixo e cole na área de "Importar Calendário" do seu anúncio na OTA.</p>

                  {exportToken ? (
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={`${API_BASE}/ical/export/${exportToken}.ics`}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white/70 font-mono"
                      />
                      <button onClick={copyExportUrl} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Copiar
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-400/80 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                      Salve a configuração primeiro para gerar o link de exportação.
                    </div>
                  )}
                </div>

                {/* Importar (OTA -> Hosped) */}
                <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-4">
                  <h3 className="text-sm font-semibold text-emerald-400">2. Importar Calendários (Airbnb/Booking ➔ Hosped)</h3>
                  <p className="text-xs text-white/50">Cole aqui os links de "Exportar Calendário" fornecidos pelas OTAs.</p>

                  <div className="space-y-3">
                    {importUrls.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://www.airbnb.com/calendar/ical/..."
                          value={url}
                          onChange={(e) => handleUrlChange(index, e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                        <button onClick={() => handleRemoveUrl(index)} className="p-2 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-lg transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button onClick={handleAddUrl} className="text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium">
                    <Plus className="w-4 h-4" /> Adicionar outra URL
                  </button>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-brand hover:bg-brand/90 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_-5px_var(--brand-primary)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Configurações</>}
                  </button>

                  {syncId && (
                    <button
                      onClick={handleSyncNow}
                      disabled={isSyncing}
                      className="bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-white/10"
                    >
                      {isSyncing ? <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" /> : <><RefreshCw className="w-5 h-5" /> Sincronizar Agora</>}
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
