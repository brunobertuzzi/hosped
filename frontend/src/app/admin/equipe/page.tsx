'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Plus, MoreVertical, 
  UserCheck, UserX, Mail, Key
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTenantStore, useActiveBranchData } from '../../../store/useTenantStore';
import { api } from '../../../lib/api';

export default function EquipePage() {
  const { users, addAuditLog, user: currentUser } = useActiveBranchData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('RECEPTIONIST');

  useEffect(() => {
    api.getTeam().catch(err => console.error("Erro ao buscar time do backend:", err));
  }, []);

  const roles = [
    { id: 'HOTEL_OWNER', label: 'Dono / Administrador', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'MANAGER', label: 'Gerente Geral', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'RECEPTIONIST', label: 'Recepção / Front Desk', color: 'text-brand', bg: 'bg-brand/10' },
    { id: 'HOUSEKEEPING', label: 'Governança (Limpeza)', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'MAINTENANCE', label: 'Técnico de Manutenção', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ];

  const openModal = (user?: any) => {
    if (user) {
      setEditingUserId(user.id);
      setNewUserName(user.nome);
      setNewUserEmail(user.email);
      setNewUserRole(user.role);
    } else {
      setEditingUserId(null);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('RECEPTIONIST');
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    try {
      if (editingUserId) {
        await api.updateTeamMember(editingUserId, {
          nome: newUserName,
          email: newUserEmail,
          role: newUserRole,
        });

        addAuditLog({
          id: 'a_' + Date.now(),
          usuario: currentUser?.nome || 'Admin',
          data: new Date().toISOString(),
          acao: 'ATUALIZAR',
          entidade: 'USER',
          detalhes: `Funcionário atualizado: ${newUserName} (${newUserRole})`
        });
      } else {
        await api.createTeamMember({
          nome: newUserName,
          email: newUserEmail,
          role: newUserRole,
          password: 'mudar123' // Senha inicial padrão
        });

        addAuditLog({
          id: 'a_' + Date.now(),
          usuario: currentUser?.nome || 'Admin',
          data: new Date().toISOString(),
          acao: 'CRIAR',
          entidade: 'USER',
          detalhes: `Novo funcionário cadastrado: ${newUserName} (${newUserRole})`
        });
      }

      await api.getTeam();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar funcionário.');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string, name: string) => {
    if (id === currentUser?.id) {
      alert('Você não pode desativar sua própria conta.');
      return;
    }
    const newStatus = currentStatus === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    if (window.confirm(`Tem certeza que deseja mudar o acesso de ${name} para ${newStatus}?`)) {
      try {
        await api.updateTeamMemberStatus(id, newStatus);
        await api.getTeam();

        addAuditLog({
          id: 'a_' + Date.now(),
          usuario: currentUser?.nome || 'Admin',
          data: new Date().toISOString(),
          acao: 'MUDANCA_STATUS',
          entidade: 'USER',
          detalhes: `Acesso do funcionário ${name} alterado para ${newStatus}`
        });
      } catch (err: any) {
        alert(err.message || 'Erro ao alterar status do funcionário.');
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-white tracking-tight flex items-center gap-3">
            Gestão de Equipe (RH)
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Controle de acessos, permissões e cadastro de funcionários.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-white hover:bg-white/90 text-black font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Adicionar Funcionário
        </button>
      </div>

      {/* Grid de Equipe */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(u => {
          const roleData = roles.find(r => r.id === u.role) || roles[2];
          return (
            <div key={u.id} className={`glass-card p-6 border relative overflow-hidden transition-all ${u.status === 'ATIVO' ? 'border-white/10 hover:border-white/20' : 'border-red-500/20 opacity-70 grayscale'}`}>
              
              {/* Badge Status */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded-md ${u.status === 'ATIVO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {u.status}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border shadow-lg ${roleData.bg} ${roleData.color} border-white/10`}>
                  {u.nome.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{u.nome}</h3>
                  <p className={`text-[10px] uppercase font-bold tracking-widest mt-0.5 ${roleData.color}`}>{roleData.label}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6 border-t border-white/5 pt-4">
                <div className="flex items-center gap-3 text-[12px] text-white/50">
                  <Mail className="w-4 h-4 text-white/20" /> {u.email}
                </div>
                <div className="flex items-center gap-3 text-[12px] text-white/50">
                  <Shield className="w-4 h-4 text-white/20" /> Acesso Base Restrito
                </div>
              </div>

              <div className="flex gap-2 border-t border-white/5 pt-4">
                <button 
                  onClick={() => openModal(u)}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-white/40 transition-colors"
                  title="Editar Funcionário"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => toggleStatus(u.id, u.status, u.nome)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${
                    u.status === 'ATIVO' ? 'bg-white/5 text-red-400 hover:bg-red-500/10' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {u.status === 'ATIVO' ? <><UserX className="w-3.5 h-3.5" /> Revogar</> : <><UserCheck className="w-3.5 h-3.5" /> Reativar</>}
                </button>
                <button className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-white/40 transition-colors" title="Resetar Senha">
                  <Key className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel w-full max-w-md p-8 rounded-[24px] border border-white/10 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand" /> {editingUserId ? 'Editar Funcionário' : 'Novo Funcionário'}
            </h2>
            
            <form onSubmit={handleSaveUser} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Nome Completo</label>
                <input required type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand" />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">E-mail Corporativo</label>
                <input required type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand" />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Papel / Função</label>
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-brand cursor-pointer">
                  {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-[11px] uppercase font-bold text-white/50 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 text-[11px] uppercase font-bold text-black bg-white hover:bg-white/90 rounded-xl shadow-lg transition-colors">
                  {editingUserId ? 'Salvar Alterações' : 'Cadastrar Acesso'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}
