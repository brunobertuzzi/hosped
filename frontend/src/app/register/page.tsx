'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hexagon, ChevronRight, AlertTriangle, CheckCircle2, Sparkles,
  Building2, Mail, Lock, User, FileText, CreditCard, Gift
} from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'trial' | 'form'>('trial');
  const [companyName, setCompanyName] = useState('');
  const [companyDoc, setCompanyDoc] = useState('');
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trialDays] = useState(14);

  const validateForm = () => {
    if (!companyName || !companyDoc || !email || !userName || !password) {
      setError('Preencha todos os campos obrigatórios.');
      return false;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return false;
    }
    if (!agreeTerms) {
      setError('Você precisa aceitar os termos de uso.');
      return false;
    }
    return true;
  };

  const handleStartTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const result = await api.register({
        companyName,
        companyDoc,
        email,
        userName,
        password,
        isTrial: true,
        trialDays,
      });

      if (result.success) {
        // Salvar token e redirecionar
        localStorage.setItem('token', result.access_token);
        document.cookie = `token=${result.access_token}; path=/; max-age=86400; SameSite=Lax`;

        toast.success(`🎉 Cadastro concluído! Você tem ${trialDays} dias grátis para testar o sistema.`, { duration: 8000 });
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      const msg = err.message || 'Erro ao realizar cadastro. Verifique os dados.';
      if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('já está em uso')) {
        setError('Este e-mail já está cadastrado. Faça login.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Building2, label: 'Gestão de múltiplas unidades' },
    { icon: User, label: 'Até 5 usuários' },
    { icon: Sparkles, label: 'Motor de reservas online' },
    { icon: CreditCard, label: 'Pagamentos via PIX' },
    { icon: CheckCircle2, label: 'Controle de quartos e ocupação' },
    { icon: FileText, label: 'Relatórios financeiros' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] pointer-events-none mix-blend-overlay" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[480px] relative z-10 p-6"
      >
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-5 shadow-2xl backdrop-blur-xl">
            <Hexagon className="w-6 h-6 text-white/90" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {step === 'trial' ? 'Comece seu Trial Grátis' : 'Criar Conta'}
          </h1>
          <p className="text-white/40 text-[13px] mt-2 font-medium">
            {step === 'trial'
              ? `${trialDays} dias grátis. Sem cartão de crédito.`
              : 'Preencha seus dados para começar'}
          </p>
        </div>

        {/* Trial Pitch */}
        {step === 'trial' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-bold text-sm uppercase tracking-widest">
                Trial Grátis — {trialDays} Dias
              </span>
            </div>
            <p className="text-white/60 text-[13px] mb-4">
              Teste o Hosped Premium completo sem compromisso. Acesso a todos os módulos por {trialDays} dias.
              Sem necessidade de cartão de crédito.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {features.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div key={i} className="flex items-center gap-2 text-[12px] text-white/50">
                    <Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{feat.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Registration Form */}
        <div className="glass-panel p-8 rounded-[24px] shadow-2xl relative overflow-hidden border border-white/[0.08]">
          <form onSubmit={handleStartTrial} className="space-y-4 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Nome do Hotel *</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Ex: Hotel Paraíso"
                  className="w-full input-premium rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/20"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">CNPJ / CPF *</label>
                <input
                  type="text"
                  value={companyDoc}
                  onChange={e => setCompanyDoc(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full input-premium rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">E-mail *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full input-premium rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/20"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Seu Nome *</label>
              <input
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full input-premium rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Senha *</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  className="w-full input-premium rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/20"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Confirmar Senha *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  minLength={6}
                  className="w-full input-premium rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/20"
                  required
                />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-indigo-500"
              />
              <span className="text-[11px] text-white/50">
                Aceito os{' '}
                <a href="/termos" className="text-indigo-400 hover:text-indigo-300 underline" target="_blank">Termos de Uso</a>
                {' '}e{' '}
                <a href="/privacidade" className="text-indigo-400 hover:text-indigo-300 underline" target="_blank">Política de Privacidade</a>
              </span>
            </label>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="text-red-400 text-xs flex items-center gap-2 bg-red-500/10 p-3 rounded-xl border border-red-500/20 mt-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-indigo-500 text-white hover:from-emerald-400 hover:to-indigo-400 font-bold py-3.5 px-4 rounded-xl text-[13px] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <>Começar Trial Grátis <ChevronRight className="w-4 h-4 opacity-70" /></>
              )}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <span className="text-[12px] text-white/40">Já tem uma conta? </span>
          <a href="/login" className="text-[12px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
            Fazer Login
          </a>
        </div>

        <div className="text-center mt-6 text-[11px] font-medium text-white/30 flex items-center justify-center gap-4">
          <Lock className="w-3 h-3" />
          <span>Segurança e Criptografia</span>
          <span className="w-1 h-1 rounded-full bg-white/20"></span>
          <span>Sem cartão necessário</span>
        </div>
      </motion.div>
    </div>
  );
}
