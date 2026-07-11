'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertTriangle, CheckCircle2, ChevronLeft, Hexagon } from 'lucide-react';
import { api } from '../../lib/api';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black font-sans selection:bg-white/20">
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] pointer-events-none mix-blend-overlay"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] relative z-10 p-6"
      >
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-5 shadow-2xl backdrop-blur-xl">
            <Hexagon className="w-6 h-6 text-white/90" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
            Recuperar Senha
          </h1>
          <p className="text-white/40 text-[13px] mt-2 font-medium">Enviaremos um link para redefinir sua senha.</p>
        </div>

        <div className="glass-panel p-8 rounded-[24px] shadow-2xl relative overflow-hidden border border-white/[0.08]">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-white font-bold mb-2">E-mail Enviado!</h3>
                <p className="text-white/50 text-sm mb-6">
                  Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá as instruções em instantes.
                </p>
                <Link href="/login" className="text-sm font-bold text-white hover:text-white/80 transition-colors bg-white/5 px-6 py-2.5 rounded-xl border border-white/10 flex items-center justify-center gap-2 max-w-[200px] mx-auto">
                  <ChevronLeft className="w-4 h-4" /> Voltar ao Login
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">E-mail Cadastrado</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-white/20 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full input-premium rounded-xl pl-11 pr-4 py-3 text-[13px] text-white placeholder:text-white/20"
                      required
                    />
                  </div>
                </div>

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
                  className="w-full bg-white text-black hover:bg-white/90 font-bold py-3.5 px-4 rounded-xl text-[13px] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                  ) : (
                    <>Enviar Link de Recuperação</>
                  )}
                </button>

                <div className="text-center mt-6">
                  <Link href="/login" className="text-[12px] font-bold text-white/40 hover:text-white transition-colors">
                    Cancelar e voltar
                  </Link>
                </div>
              </form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
