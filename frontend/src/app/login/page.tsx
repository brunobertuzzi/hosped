'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, AlertTriangle, ChevronRight, Building2, UserCircle2, Hexagon } from 'lucide-react';
import { api } from '../../lib/api';
import { useTenantStore } from '../../store/useTenantStore';



export default function LoginPage() {
  const router = useRouter();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      await api.login(loginEmail, loginPassword);

      const user = useTenantStore.getState().user;
      useTenantStore.getState().addAuditLog({
        id: 'a_' + Date.now(),
        usuario: user.nome,
        data: new Date().toISOString(),
        acao: 'LOGIN',
        entidade: 'USER',
        detalhes: `Login via painel Hosped Premium (${user.role}).`
      });

      if (user.role === 'PLATFORM_OWNER') {
        router.push('/super-admin');
      } else if (user.hotel?.status === 'SUSPENDED') {
        router.push('/billing/suspended');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      const msg = err.message || 'Falha de conexão com a API.';
      // Make common errors friendlier
      if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('credenciais')) {
        setLoginError('E-mail ou senha incorretos.');
      } else if (msg.includes('Internal server error') || msg.includes('ECONNREFUSED') || msg.includes('server')) {
        setLoginError('Erro no servidor. Verifique se o Docker (Postgres) está rodando e rode "npx prisma migrate deploy" no backend.');
      } else {
        setLoginError(msg);
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black font-sans selection:bg-white/20">

      {/* Background Cinematographic Lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] pointer-events-none mix-blend-overlay"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] relative z-10 p-6"
      >
        {/* Header Elegante */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-5 shadow-2xl backdrop-blur-xl">
            <Hexagon className="w-6 h-6 text-white/90" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            HOSPED
          </h1>
          <p className="text-white/40 text-[13px] mt-2 font-medium">Sistema Inteligente de Gestão Hoteleira</p>
        </div>

        {/* Login Form Card */}
        <div className="glass-panel p-8 rounded-[24px] shadow-2xl relative overflow-hidden border border-white/[0.08]">
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">E-mail</label>
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="nome@hotel.com"
                maxLength={100}
                className="w-full input-premium rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/20"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Senha</label>
                <a href="/forgot-password" className="text-[10px] font-bold uppercase tracking-widest text-brand hover:text-brand/80 transition-colors">
                  Esqueci minha senha
                </a>
              </div>
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                maxLength={50}
                className="w-full input-premium rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-white/20"
                required
              />
            </div>

            <AnimatePresence mode="wait">
              {loginError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="text-red-400 text-xs flex items-center gap-2 bg-red-500/10 p-3 rounded-xl border border-red-500/20 mt-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{loginError}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black hover:bg-white/90 font-bold py-3.5 px-4 rounded-xl text-[13px] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
              ) : (
                <>Entrar no Sistema <ChevronRight className="w-4 h-4 opacity-50" /></>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] font-medium text-white/30 flex items-center justify-center gap-4">
          <span>Sistema Seguro</span>
          <span className="w-1 h-1 rounded-full bg-white/20"></span>
          <span>Criptografia Ponta a Ponta</span>
        </div>
        <div className="text-center mt-4">
          <a href="/register" className="text-[11px] font-medium text-indigo-400/70 hover:text-indigo-300 transition-colors">
            Não tem conta? <span className="font-bold underline">Cadastre-se</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
