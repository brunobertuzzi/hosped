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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-indigo-600" />
            Cupons de Desconto
          </h1>
          <p className="text-gray-500">Crie códigos promocionais para aumentar suas reservas diretas.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Cupom
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="py-4 px-6 font-semibold text-gray-900">Código</th>
                <th className="py-4 px-6 font-semibold text-gray-900">Desconto</th>
                <th className="py-4 px-6 font-semibold text-gray-900">Usos</th>
                <th className="py-4 px-6 font-semibold text-gray-900">Validade</th>
                <th className="py-4 px-6 font-semibold text-gray-900">Status</th>
                <th className="py-4 px-6 font-semibold text-gray-900 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promoCodes.map((promo) => (
                <tr key={promo.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900 font-mono bg-gray-100 inline-block px-2 py-1 rounded">
                      {promo.codigo}
                    </div>
                    {promo.descricao && <div className="text-sm text-gray-500 mt-1">{promo.descricao}</div>}
                  </td>
                  <td className="py-4 px-6">
                    {promo.tipoDesconto === 'PERCENTUAL' ? (
                      <span className="text-green-600 font-medium">{promo.valorDesconto}% OFF</span>
                    ) : (
                      <span className="text-green-600 font-medium">R$ {promo.valorDesconto} OFF</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-600">
                      {promo.usos} {promo.quantidadeTotal ? `/ ${promo.quantidadeTotal}` : 'usos'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {promo.validade ? new Date(promo.validade).toLocaleDateString('pt-BR') : 'Sem validade'}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        promo.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {promo.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(promo)}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {promoCodes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
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
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingId ? 'Editar Cupom' : 'Novo Cupom'}
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código Promocional
                  </label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="Ex: VERAO20"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (Opcional)
                  </label>
                  <input
                    type="text"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Promoção de fim de ano"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Desconto
                    </label>
                    <select
                      value={tipoDesconto}
                      onChange={(e) => setTipoDesconto(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      <option value="PERCENTUAL">Percentual (%)</option>
                      <option value="FIXO">Valor Fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Limite de Usos (Opcional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantidadeTotal}
                      onChange={(e) => setQuantidadeTotal(e.target.value)}
                      placeholder="Ilimitado"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Validade (Opcional)
                    </label>
                    <input
                      type="date"
                      value={validade}
                      onChange={(e) => setValidade(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                    Cupom Ativo
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
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
