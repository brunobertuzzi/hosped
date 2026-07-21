'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSuperAdminStore, TenantPlan } from '../../store/useSuperAdminStore';
import { useTenantStore } from '../../store/useTenantStore';
import { Building2, CheckCircle2, ChevronRight, Mail, User, Briefcase, KeyRound, Loader2, CreditCard, Hexagon } from 'lucide-react';
import Link from 'next/link';
import { initMercadoPago, Payment as MPPayment } from '@mercadopago/sdk-react';
import { formatCNPJ } from '../../lib/masks';
import { toast } from 'sonner';

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
if (MP_PUBLIC_KEY) {
  initMercadoPago(MP_PUBLIC_KEY);
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan') as TenantPlan | null;

  // Removed unused useSuperAdminStore call
  const { setSelectedBranchId, setUser } = useTenantStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    import('../../lib/api').then(({ api }) => {
      api.getSystemPlans()
        .then(data => setPlans(data.filter((p: any) => p.isActive)))
        .catch(err => console.error('Error fetching plans:', err));
    });
  }, []);

  // Form State
  const [plan, setPlan] = useState<TenantPlan | string>(planParam || 'Pro');

  useEffect(() => {
    if (plan) {
      window.history.replaceState(null, '', `?plan=${plan.toUpperCase()}`);
    }
  }, [plan]);

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [companyDoc, setCompanyDoc] = useState('');
  const [hotelName, setHotelName] = useState('');

  // Payment Form
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');

  const handleCompanyDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyDoc(formatCNPJ(e.target.value));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(s => s + 1);
  };

  const getSelectedPlanPrice = () => {
    const selected = plans.find(p => p.name.toUpperCase() === (typeof plan === 'string' ? plan.toUpperCase() : plan));
    return selected ? Number(selected.price) : 0;
  };

  const handleRealPayment = async (paymentData: any) => {
    setLoading(true);
    try {
      await finishTenantCreation(getSelectedPlanPrice(), 'REAL_CARD', paymentData);
    } catch (error) {
      toast.error('Erro ao se comunicar com o Mercado Pago.');
      setLoading(false);
    }
  };

  const handleMockPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Modo de teste: simula o pagamento para permitir fluxo de demonstração
    setTimeout(() => {
      finishTenantCreation(getSelectedPlanPrice(), cardNumber.slice(-4) || '1234');
    }, 2500);
  };

  const finishTenantCreation = async (mrr: number, last4: string, paymentData?: any) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          companyDoc,
          email: userEmail,
          userName,
          password: userPassword,
          plan,
          mrr,
          paymentData
        })
      });

      const data = await response.json();
      if (!data.success) {
        toast.error('Erro ao criar conta no banco de dados: ' + data.error);
        setLoading(false);
        return;
      }

      // Persist token and user for immediate session (register now returns access_token like login)
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        document.cookie = `token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
      }

      const effectiveHotelId = data.hotelId || data.user?.hotelId;
      const effectiveBranchId = data.branchId || data.user?.branchId;
      setUser({
        id: data.user.id,
        hotelId: effectiveHotelId,
        nome: data.user.nome,
        email: data.user.email,
        role: data.user.role,
        status: data.user.status || 'ATIVO',
        branchId: effectiveBranchId,
      });
      if (effectiveBranchId) {
        setSelectedBranchId(effectiveBranchId);
      }

      router.push('/admin/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Falha ao registrar no servidor.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white font-sans flex flex-col md:flex-row overflow-hidden">

      {/* Left Panel - Visual */}
      <div className="hidden md:flex flex-col justify-between w-[40%] bg-[#050505] border-r border-white/5 p-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-0 w-full h-1/2 bg-indigo-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">HOSPED</span>
          </Link>

          <h2 className="text-3xl font-bold mb-4 tracking-tight leading-snug">
            Sua operação hoteleira <br/>
            elevada à máxima potência.
          </h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-sm">
            Crie sua conta em 2 minutos e tenha acesso imediato a todas as ferramentas do sistema.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4 text-sm font-semibold text-white/40">
            <CheckCircle2 className={`w-5 h-5 ${step >= 1 ? 'text-indigo-400' : 'text-white/20'}`} />
            <span className={step >= 1 ? 'text-white' : ''}>Conta do Gerente</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold text-white/40">
            <CheckCircle2 className={`w-5 h-5 ${step >= 2 ? 'text-indigo-400' : 'text-white/20'}`} />
            <span className={step >= 2 ? 'text-white' : ''}>Dados do seu Hotel</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold text-white/40">
            <CheckCircle2 className={`w-5 h-5 ${step >= 3 ? 'text-indigo-400' : 'text-white/20'}`} />
            <span className={step >= 3 ? 'text-white' : ''}>Seleção do Plano</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold text-white/40">
            <CheckCircle2 className={`w-5 h-5 ${step >= 4 ? 'text-indigo-400' : 'text-white/20'}`} />
            <span className={step >= 4 ? 'text-white' : ''}>Pagamento</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Wizard */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative">
        <div className="w-full max-w-md relative">

          <AnimatePresence mode="wait">

            {/* STEP 1: ADMIN ACCOUNT */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold tracking-tight text-white mb-2">Crie sua conta de acesso</h3>
                  <p className="text-sm text-white/40">Estes serão seus dados para entrar no sistema todos os dias.</p>
                </div>

                <form onSubmit={handleNextStep} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Seu Nome Completo</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                      <input required type="text" value={userName} onChange={e => setUserName(e.target.value)} maxLength={100} autoFocus className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500" placeholder="Ex: João da Silva" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">E-mail Profissional</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                      <input required type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} maxLength={100} className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500" placeholder="joao@hotel.com.br" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Crie uma Senha</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                      <input required type="password" value={userPassword} onChange={e => setUserPassword(e.target.value)} maxLength={50} minLength={6} className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500" placeholder="••••••••" />
                    </div>
                  </div>
                  <button type="submit" className="w-full mt-6 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_-5px_#6366f1] flex items-center justify-center gap-2">
                    Continuar <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 2: COMPANY DETAILS */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold tracking-tight text-white mb-2">Dados do seu Negócio</h3>
                  <p className="text-sm text-white/40">Falta pouco! Qual o nome do seu hotel ou pousada?</p>
                </div>

                <form onSubmit={handleNextStep} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Razão Social</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                      <input required type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} maxLength={100} autoFocus className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500" placeholder="Ex: Pousada Sol e Mar Ltda" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">CNPJ</label>
                    <input required type="text" value={companyDoc} onChange={handleCompanyDocChange} maxLength={18} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500 font-mono" placeholder="00.000.000/0001-00" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Nome Fantasia da Primeira Filial</label>
                    <input required type="text" value={hotelName} onChange={e => setHotelName(e.target.value)} maxLength={100} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500" placeholder="Ex: Unidade Centro" />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setStep(1)} className="py-4 px-6 bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-colors">Voltar</button>
                    <button type="submit" className="flex-1 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_-5px_#6366f1] flex items-center justify-center gap-2">
                      Continuar <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 3: PLAN CONFIRMATION */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold tracking-tight text-white mb-2">Escolha seu Plano</h3>
                  <p className="text-sm text-white/40">Tudo pronto. Qual plano atende melhor a sua recepção?</p>
                </div>

                <div className="space-y-4 mb-8">
                  {plans.length > 0 ? plans.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setPlan(p.name)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${plan.toUpperCase() === p.name.toUpperCase() ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_20px_-5px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                    >
                      <div>
                        <span className={`block font-bold mb-1 ${plan.toUpperCase() === p.name.toUpperCase() ? 'text-indigo-400' : 'text-white'}`}>{p.name}</span>
                        <span className="text-[11px] text-white/40">
                          {p.description}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold block text-white">
                          R$ {Number(p.price).toFixed(0)}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest text-white/40">/ mês</span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-white/40 text-center py-8">Carregando planos...</div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="py-4 px-6 bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-colors">Voltar</button>
                  <button onClick={() => setStep(4)} className="flex-1 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_0_rgba(99,102,241,0.3)] flex items-center justify-center gap-2">
                    Continuar para Pagamento <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: PAYMENT */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold tracking-tight text-white mb-2">Finalizar Assinatura</h3>
                  <p className="text-sm text-white/40">Insira os dados do cartão de crédito para ativar o plano {plan}.</p>
                </div>

                {MP_PUBLIC_KEY ? (
                  <div className="bg-white rounded-xl p-4 mt-6">
                    <MPPayment
                      initialization={{ amount: plan === 'STARTUP' ? 150 : plan === 'PRO' ? 450 : 1500 }}
                      onSubmit={async (param) => await handleRealPayment(param)}
                      customization={{
                        paymentMethods: {
                          creditCard: 'all',
                          bankTransfer: 'all'
                        }
                      }}
                    />
                  </div>
                ) : (
                  <form onSubmit={handleMockPayment} className="space-y-4">
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
                      <p className="text-[11px] font-bold text-amber-400">MODO SIMULADO</p>
                      <p className="text-[10px] text-amber-400/70 mt-1">
                        Adicione NEXT_PUBLIC_MP_PUBLIC_KEY no arquivo .env para carregar o checkout oficial do Mercado Pago.
                      </p>
                    </div>

                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">Total a Pagar Hoje</span>
                        <span className="text-xl font-bold text-white">R$ {plan === 'STARTUP' ? '150' : plan === 'PRO' ? '450' : '1500'}</span>
                      </div>
                      <p className="text-[11px] text-white/50">Cobrança recorrente mensal via Cartão de Crédito.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Número do Cartão</label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                        <input required type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} maxLength={19} className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500 font-mono tracking-widest" placeholder="0000 0000 0000 0000" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Nome Impresso no Cartão</label>
                      <input required type="text" value={cardName} onChange={e => setCardName(e.target.value)} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500 uppercase" placeholder="EX: JOAO DA SILVA" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Validade</label>
                        <input required type="text" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} maxLength={5} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500 font-mono text-center" placeholder="MM/AA" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">CVC</label>
                        <input required type="text" value={cardCVC} onChange={e => setCardCVC(e.target.value)} maxLength={4} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-white outline-none focus:border-indigo-500 font-mono text-center" placeholder="123" />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={() => setStep(3)} disabled={loading} className="py-4 px-6 bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50">Voltar</button>
                      <button type="submit" disabled={loading} className="flex-1 py-4 bg-white hover:bg-white/90 text-black font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_0_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando Pagamento...</> : 'Pagar e Criar Conta'}
                      </button>
                    </div>

                    <p className="text-center text-[10px] text-white/30 mt-4 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Pagamento seguro e criptografado
                    </p>
                  </form>
                )}
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}
