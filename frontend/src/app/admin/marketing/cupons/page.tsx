'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, Hash, Zap, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../../lib/api';
import { alerts } from '../../../../lib/alerts';

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [codigo, setCodigo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoDesconto, setTipoDesconto] = useState('PERCENTUAL');
  const [valorDesconto, setValorDesconto] = useState('');
  const [quantidadeTotal, setQuantidadeTotal] = useState('');
  const [validade, setValidade] = useState('');
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const data = await api.getPromoCodes();
      setPromoCodes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (promo?: any) => {
    if (promo) {
      setEditingId(promo.id);
      setCodigo(promo.codigo);
      setDescricao(promo.descricao || '');
      setTipoDesconto(promo.tipoDesconto);
      setValorDesconto(promo.valorDesconto.toString());
      setQuantidadeTotal(promo.quantidadeTotal?.toString() || '');
      setValidade(promo.validade ? new Date(promo.validade).toISOString().split('T')[0] : '');
      setAtivo(promo.ativo);
    } else {
      setEditingId(null);
      setCodigo('');
      setDescricao('');
      setTipoDesconto('PERCENTUAL');
      setValorDesconto('');
      setQuantidadeTotal('');
      setValidade('');
      setAtivo(true);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        codigo,
        descricao,
        tipoDesconto,
        valorDesconto: parseFloat(valorDesconto),
        quantidadeTotal: quantidadeTotal ? parseInt(quantidadeTotal) : null,
        validade: validade ? validade : null,
        ativo,
      };

      if (editingId) {
        await api.updatePromoCode(editingId, data);
        alerts.success('Cupom atualizado com sucesso!');
      } else {
        await api.createPromoCode(data);
        alerts.success('Cupom criado com sucesso!');
      }

      setIsModalOpen(false);
      fetchPromoCodes();
    } catch (err: any) {
      alerts.error(err.message || 'Erro ao salvar cupom');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cupom?')) {
      try {
        await api.deletePromoCode(id);
        alerts.success('Cupom excluído!');
        fetchPromoCodes();
      } catch (err: any) {
        alerts.error(err.message || 'Erro ao excluir');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Tag className="w-6 h-6 text-brand" />
            Cupons de Desconto
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Crie códigos promocionais para aumentar suas reservas diretas.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-brand hover:brightness-110 text-black text-[13px] font-bold rounded-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Cupom
        </button>
      </div>

      <div className="bg-black border border-white/[0.04] rounded-[24px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.04] text-white/30 uppercase tracking-widest font-bold text-[10px]">
                <th className="py-4 px-6">Código</th>
                <th className="py-4 px-6">Desconto</th>
                <th className="py-4 px-6">Usos</th>
                <th className="py-4 px-6">Validade</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {promoCodes.map((promo) => (
                <tr key={promo.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-white/90 font-mono bg-white/5 border border-white/10 inline-block px-2.5 py-1 rounded-lg">
                      {promo.codigo}
                    </div>
                    {promo.descricao && <div className="text-[11px] text-white/40 mt-1.5">{promo.descricao}</div>}
                  </td>
                  <td className="py-4 px-6">
                    {promo.tipoDesconto === 'PERCENTUAL' ? (
                      <span className="text-emerald-400 font-bold">{promo.valorDesconto}% OFF</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">R$ {promo.valorDesconto} OFF</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-white/60">
                      {promo.usos} {promo.quantidadeTotal ? `/ ${promo.quantidadeTotal}` : 'usos'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-white/60">
                    {promo.validade ? new Date(promo.validade).toLocaleDateString('pt-BR') : 'Sem validade'}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                        promo.ativo
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {promo.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(promo)}
                        className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-brand hover:border-brand/30 transition-all bg-white/5"
                        title="Editar Cupom"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-red-400 hover:border-red-500/30 transition-all bg-white/5"
                        title="Excluir Cupom"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {promoCodes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/40 text-sm">
                    Nenhum cupom cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg glass-panel bg-[#111]/90 rounded-[24px] overflow-hidden border border-white/10 shadow-2xl"
            >
              <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">
                  {editingId ? 'Editar Cupom' : 'Novo Cupom'}
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                    Código Promocional
                  </label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="Ex: VERAO20"
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:ring-2 focus:ring-brand/50 focus:border-brand font-mono uppercase text-white text-[13px] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                    Descrição (Opcional)
                  </label>
                  <input
                    type="text"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Promoção de fim de ano"
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:ring-2 focus:ring-brand/50 focus:border-brand text-white text-[13px] outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                      Tipo de Desconto
                    </label>
                    <select
                      value={tipoDesconto}
                      onChange={(e) => setTipoDesconto(e.target.value)}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:ring-2 focus:ring-brand/50 focus:border-brand text-white text-[13px] outline-none transition-all cursor-pointer"
                    >
                      <option value="PERCENTUAL" className="bg-black">Percentual (%)</option>
                      <option value="FIXO" className="bg-black">Valor Fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                      Valor
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={valorDesconto}
                      onChange={(e) => setValorDesconto(e.target.value)}
                      placeholder={tipoDesconto === 'PERCENTUAL' ? '20' : '100.00'}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:ring-2 focus:ring-brand/50 focus:border-brand text-white text-[13px] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                      Limite de Usos (Opcional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantidadeTotal}
                      onChange={(e) => setQuantidadeTotal(e.target.value)}
                      placeholder="Ilimitado"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:ring-2 focus:ring-brand/50 focus:border-brand text-white text-[13px] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                      Validade (Opcional)
                    </label>
                    <input
                      type="date"
                      value={validade}
                      onChange={(e) => setValidade(e.target.value)}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:ring-2 focus:ring-brand/50 focus:border-brand text-white text-[13px] outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="w-4 h-4 text-brand rounded bg-black/50 border-white/10 focus:ring-brand/50 focus:ring-offset-0"
                  />
                  <label htmlFor="ativo" className="text-[12px] font-bold text-white/80 cursor-pointer">
                    Cupom Ativo
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-white/10 text-white/70 rounded-xl text-[12px] font-bold hover:bg-white/5 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-brand text-white rounded-xl text-[12px] font-bold hover:bg-brand/80 transition-colors shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)]"
                  >
                    Salvar Cupom
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
