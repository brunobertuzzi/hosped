'use client';

import React from 'react';
import { ShieldAlert, CreditCard, ArrowRight, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTenantStore } from '../../../store/useTenantStore';
import { toast } from 'sonner';

export default function SuspendedPage() {
  const router = useRouter();
  const { user } = useTenantStore();
  const [supportEmail, setSupportEmail] = React.useState('suporte@hosped.com');

  React.useEffect(() => {
    import('../../../lib/api').then(({ api }) => {
      api.getGlobalSettings().then((global: any) => {
        if (global?.supportEmail) setSupportEmail(global.supportEmail);
      }).catch(console.error);
    });
  }, []);

  const handleLogout = () => {
    useTenantStore.getState().setUser(null);
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handlePay = () => {
    router.push('/admin/configuracoes');
  };

  return (
    <div className="min-h-screen bg-[#030014] flex flex-col items-center justify-center font-sans p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl relative z-10 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Conta Suspensa</h1>
        <p className="text-[13px] text-white/50 mb-8 leading-relaxed">
          Olá, {user?.nome}. O acesso ao seu painel administrativo foi temporariamente suspenso devido a pendências no faturamento da sua assinatura.
        </p>

        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 mb-8 text-left flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-white/40" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-1">Status da Assinatura</div>
            <div className="text-[14px] font-bold text-white">Pagamento Atrasado</div>
          </div>
        </div>

        <button onClick={handlePay} className="w-full py-4 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[13px] rounded-xl shadow-[0_0_20px_-5px_#6366f1] transition-all flex items-center justify-center gap-2 mb-4">
          Regularizar via PIX ou Cartão <ArrowRight className="w-4 h-4" />
        </button>

        <div className="flex flex-col gap-3">
          <a href={`mailto:${supportEmail}`} className="w-full py-3 px-6 bg-white/5 hover:bg-white/10 text-white/60 font-bold text-[12px] rounded-xl transition-all flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" /> Falar com o Suporte
          </a>

          <button onClick={handleLogout} className="text-[11px] text-white/30 hover:text-white transition-colors underline underline-offset-4">
            Voltar para o Login
          </button>
        </div>
      </motion.div>
    </div>
  );
}
