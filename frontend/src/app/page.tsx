'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ArrowRight,
  CheckCircle2,
  Globe,
  Shield,
  Smartphone,
  Zap,
  Hexagon,
  Calendar,
  LayoutList,
  Palette,
  CreditCard,
  X,
  Package,
  MessageSquare,
  PieChart,
  Sparkles,
  Layers,
} from 'lucide-react';

import ThreeBackground from '../components/ThreeBackground';
import Card3D from '../components/Card3D';
import Hero3DMockup from '../components/Hero3DMockup';

const featuresList = [
  {
    icon: Building2,
    title: 'Várias Unidades, Um só Painel',
    desc: 'Gerencie dezenas de filiais no mesmo painel. Controle de acesso por unidade e visão geral de todos os negócios na mesma tela.',
    longDesc:
      'Se você tem mais de uma pousada ou hotel, acesse todas as unidades usando apenas uma senha. Visualize facilmente quanto cada unidade faturou e controle o que seus gerentes podem ver.',
  },
  {
    icon: Globe,
    title: 'Site de Reservas Próprio',
    desc: 'Venda diretamente no seu site sem pagar comissões para sites como Booking e Airbnb. Totalmente customizável.',
    longDesc:
      'Pare de pagar comissões altas. Tenha um site de reservas com a cara da sua marca. Integre avaliações reais de hóspedes do Google, mapa de localização e botão de WhatsApp para contato direto.',
  },
  {
    icon: Calendar,
    title: 'Painel Visual de Reservas',
    desc: 'Gerencie as reservas em um mapa visual intuitivo onde basta clicar e arrastar com o mouse para fazer mudanças.',
    longDesc:
      'Esqueça cadernos e tabelas complicadas. Veja todos os seus quartos em uma tela visual super simples. Troque um hóspede de quarto ou aumente os dias da estadia apenas clicando e arrastando o mouse.',
  },
  {
    icon: Zap,
    title: 'Fim das Filas na Recepção',
    desc: 'Envie um link para o celular do hóspede. Ele preenche os dados em casa e chega ao hotel apenas para pegar a chave.',
    longDesc:
      'Aumente o nível de serviço do seu hotel enviando um link de pré check-in pelo WhatsApp. O hóspede preenche a ficha de cadastro, assina digitalmente e tira foto do documento pelo celular. Quando ele chega, basta entregar a chave.',
  },
  {
    icon: CreditCard,
    title: 'Recebimentos Descomplicados',
    desc: 'Receba via Pix e cartão de crédito direto no sistema. Pagamentos e parcelamentos processados de forma automática e segura.',
    longDesc:
      'Integração bancária e de cartão que dá baixa automática no sistema. Sem precisar dar baixa manual em boletos ou conferir extratos. Ao pagar pelo Pix, a reserva já muda de status instantaneamente. Parcele as vendas e emita notas fiscais direto pela plataforma.',
  },
  {
    icon: Shield,
    title: 'Controle de Acesso da Equipe',
    desc: 'Saiba exatamente o que cada funcionário fez. Você escolhe as telas que a recepção, a limpeza e o financeiro podem acessar.',
    longDesc:
      'Evite fraudes e desorganização. Toda pequena alteração (excluir reserva, aplicar desconto, mudar quarto) gera um histórico detalhado (auditoria) apontando quem fez, o horário e o dado exato que foi modificado. Durma tranquilo sabendo que a operação está blindada.',
  },
  {
    icon: Package,
    title: 'Consumo e Fechamento de Conta',
    desc: 'Lance o consumo do frigobar e restaurante direto na conta do quarto. Facilita o pagamento na hora em que o hóspede for embora.',
    longDesc:
      'Lance consumos diretamente na fatura do quarto. O sistema atualiza o estoque instantaneamente e avisa quando produtos estão acabando. Emita cupom fiscal de vendas avulsas para não-hóspedes diretamente do nosso sistema de vendas.',
  },
  {
    icon: MessageSquare,
    title: 'Comunicação Automática',
    desc: 'O sistema envia sozinho mensagens de boas-vindas, lembretes de check-in e agradecimentos após a saída do hóspede.',
    longDesc:
      'Aumente o retorno de hóspedes e as avaliações no TripAdvisor. Configure e-mails e mensagens de WhatsApp automáticas. Envie dicas da cidade 2 dias antes do check-in e envie um cupom de desconto exclusivo 1 dia após o check-out.',
  },
];

const DEFAULT_PLANS = [
  {
    id: 'plan-1',
    name: 'Básico',
    description: 'Ideal para pousadas e hotéis pequenos que querem simplificar a operação.',
    price: 199,
    features: [
      'Até 15 quartos',
      'Painel visual de reservas',
      'Check-in digital via WhatsApp',
      'Emissão de extrato do hóspede',
      'Suporte via WhatsApp',
    ],
  },
  {
    id: 'plan-2',
    name: 'Pro',
    description: 'Para hotéis em expansão que querem vender sem pagar comissão.',
    price: 399,
    features: [
      'Até 50 quartos',
      'Site de reservas próprio (0% comissão)',
      'Recebimentos via Pix e Cartão',
      'Governança mobile em tempo real',
      'Relatórios e gráficos automáticos',
      'Suporte prioritário 24/7',
    ],
  },
  {
    id: 'plan-3',
    name: 'Corporativo',
    description: 'Para grandes redes e grupos hoteleiros com múltiplas unidades.',
    price: 799,
    features: [
      'Quartos e filiais ilimitados',
      'Gestão multi-unidade unificada',
      'Controle de acesso da equipe com auditoria',
      'Integrações via API customizada',
      'Gerente de conta dedicado',
    ],
  },
];

export default function SaasLandingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchPlans = () => {
      import('../lib/api').then(({ api }) => {
        api
          .getSystemPlans()
          .then((data) => {
            if (Array.isArray(data) && data.length > 0) {
              setPlans(data.filter((p: any) => p.isActive));
            }
          })
          .catch((err) => console.error('Error fetching plans:', err));
      });
    };

    fetchPlans();
    document.addEventListener('visibilitychange', fetchPlans);
    return () => document.removeEventListener('visibilitychange', fetchPlans);
  }, []);

  const handleGlobalMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const displayPlans = plans.length > 0 ? plans : DEFAULT_PLANS;

  return (
    <div
      onMouseMove={handleGlobalMouseMove}
      className="min-h-screen bg-[#030308] text-white font-sans overflow-x-hidden selection:bg-indigo-500/40 relative"
    >
      {/* 3D WebGL Background Canvas (Three.js) */}
      <ThreeBackground />

      {/* Global Interactive Spotlight Follower */}
      <div
        className="pointer-events-none fixed z-10 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] transition-transform duration-75 ease-out"
        style={{
          left: mousePos.x - 300,
          top: mousePos.y - 300,
          background: 'radial-gradient(circle, rgba(99,102,241,0.8) 0%, rgba(168,85,247,0.4) 50%, transparent 80%)',
        }}
      />

      {/* Modern High-Tech Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#030308]/70 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.6)] group-hover:scale-105 transition-transform">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-purple-400">
              HOSPED
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[12px] font-bold text-white/70 uppercase tracking-widest">
            <a href="#features" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
              <span>Funcionalidades</span>
            </a>
            <a href="#pricing" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
              <span>Planos</span>
            </a>
            <Link href="/guia" className="hover:text-indigo-400 transition-colors">
              Guia de Uso
            </Link>
            <a
              href="/11111111-1111-1111-1111-111111111111"
              target="_blank"
              className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"
            >
              Ver Demo do Portal
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-[12px] font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors px-3 py-2"
            >
              Login
            </Link>
            <Link
              href="/onboarding"
              className="relative group px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-[11px] font-bold uppercase tracking-widest transition-all shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:shadow-[0_0_35px_rgba(168,85,247,0.7)] hover:scale-105"
            >
              Assinar Agora
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-20 px-6 min-h-[95vh] flex flex-col items-center justify-center">
        {/* Glow ambient background lights */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/10 blur-[140px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto text-center relative z-10"
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/[0.05] border border-white/15 mb-8 backdrop-blur-xl shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-200">
              O Sistema Operacional Definitivo para Hotéis
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-8 leading-[1.05]">
            Gestão Hoteleira <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-400">
              Simples e Lucrativa.
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-white/60 mb-12 max-w-3xl mx-auto font-normal leading-relaxed">
            Abandone as planilhas e o trabalho manual. Um sistema que faz a sua recepção ser mais rápida, conecta seu hotel com a internet e ajuda você a lucrar mais, tudo em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-9 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-[13px] uppercase tracking-widest rounded-full transition-all shadow-[0_0_35px_rgba(99,102,241,0.5)] hover:scale-105 flex items-center justify-center gap-2"
            >
              Começar Agora <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#pricing"
              className="w-full sm:w-auto px-9 py-4 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-[13px] uppercase tracking-widest rounded-full transition-all backdrop-blur-xl hover:border-white/30 flex items-center justify-center"
            >
              Ver Preços
            </Link>
          </div>
        </motion.div>

        {/* 3D Dashboard Viewport Mockup */}
        <Hero3DMockup />
      </section>

      {/* High-Tech Infinite Marquee Ticker */}
      <div className="w-full py-6 border-y border-white/10 bg-black/40 backdrop-blur-md overflow-hidden relative z-20">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-[12px] font-bold text-white/50 uppercase tracking-widest font-mono">
          <span>• 100% AUTOMÁTICO</span>
          <span>• SITE DE RESERVAS SEM COMISSÕES</span>
          <span>• CHECK-IN DIGITAL VIA WHATSAPP</span>
          <span>• PAINEL MULTI-UNIDADE</span>
          <span>• PAGAMENTOS PIX E CARTÃO INSTANTÂNEOS</span>
          <span>• AUDITORIA E SEGURANÇA TOTAL</span>
          <span>• GOVERNANÇA MOBILE</span>
          <span>• 100% AUTOMÁTICO</span>
          <span>• SITE DE RESERVAS SEM COMISSÕES</span>
          <span>• CHECK-IN DIGITAL VIA WHATSAPP</span>
          <span>• PAINEL MULTI-UNIDADE</span>
          <span>• PAGAMENTOS PIX E CARTÃO INSTANTÂNEOS</span>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-36 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RECURSOS PREMIUM</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Tudo que uma grande rede precisa.
            </h2>
            <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto font-normal">
              Construído com arquitetura moderna para garantir segurança, velocidade e escalabilidade.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresList.map((f, i) => (
              <Card3D
                key={i}
                onClick={() => setActiveFeatureIndex(i)}
                className="p-8 flex flex-col justify-between group"
              >
                <div>
                  <motion.div
                    layoutId={`feature-icon-${i}`}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/30 transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                  >
                    <f.icon className="w-7 h-7" />
                  </motion.div>
                  <motion.h3
                    layoutId={`feature-title-${i}`}
                    className="text-xl font-bold mb-3 text-white group-hover:text-indigo-300 transition-colors"
                  >
                    {f.title}
                  </motion.h3>
                  <motion.p
                    layoutId={`feature-desc-${i}`}
                    className="text-sm text-white/60 leading-relaxed font-normal"
                  >
                    {f.desc}
                  </motion.p>
                </div>

                <div className="mt-8 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-400 group-hover:text-purple-300 transition-colors">
                  <span>Saiba mais</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1.5" />
                </div>
              </Card3D>
            ))}
          </div>
        </div>

        {/* Feature Detail Modal with 3D Styling */}
        <AnimatePresence>
          {activeFeatureIndex !== null && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveFeatureIndex(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
              />
              <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none px-4">
                <motion.div
                  layoutId={`feature-card-${activeFeatureIndex}`}
                  className="w-full max-w-2xl bg-[#090916] border border-white/20 rounded-3xl overflow-hidden pointer-events-auto flex flex-col relative shadow-[0_0_60px_rgba(99,102,241,0.3)]"
                >
                  <button
                    onClick={() => setActiveFeatureIndex(null)}
                    className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors z-20"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="p-8 md:p-10 pb-0">
                    <motion.div
                      layoutId={`feature-icon-${activeFeatureIndex}`}
                      className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center mb-6 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.3)]"
                    >
                      {React.createElement(featuresList[activeFeatureIndex].icon, { className: 'w-8 h-8' })}
                    </motion.div>
                    <motion.h3
                      layoutId={`feature-title-${activeFeatureIndex}`}
                      className="text-3xl md:text-4xl font-extrabold mb-4 text-white"
                    >
                      {featuresList[activeFeatureIndex].title}
                    </motion.h3>
                    <motion.p
                      layoutId={`feature-desc-${activeFeatureIndex}`}
                      className="text-lg text-white/70 mb-8 leading-relaxed font-normal"
                    >
                      {featuresList[activeFeatureIndex].longDesc}
                    </motion.p>
                  </div>

                  {/* 3D Visual Demo box inside modal */}
                  <div className="h-64 bg-gradient-to-t from-[#030308] to-indigo-950/40 border-t border-white/10 relative flex items-center justify-center overflow-hidden p-6">
                    <div className="w-full h-full bg-[#05050e] rounded-2xl border border-white/15 p-5 shadow-2xl flex flex-col justify-between">
                      <div className="flex justify-between items-center border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                          <span className="text-xs font-bold text-white">Demonstração Interativa</span>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-300">MODULO.V3</span>
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 bg-white/10 rounded-full w-2/3 animate-pulse" />
                        <div className="h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center px-4 text-xs font-mono text-indigo-200">
                          Status: Operacional • Sincronizado
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </section>

      {/* Modules / Bento Grid Section */}
      <section className="py-36 px-6 border-t border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] font-bold uppercase tracking-widest mb-4">
              <Layers className="w-3.5 h-3.5" />
              <span>ARQUITETURA UNIFICADA</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Um ecossistema completo.
            </h2>
            <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto font-normal">
              Tudo que você precisa para operar, vender e analisar o seu hotel, nativamente integrado.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Bento Item 1 - Recepção (Span 2) */}
            <Card3D className="md:col-span-2 p-8 md:p-10 relative overflow-hidden group">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/2 flex flex-col justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-5 text-indigo-400">
                    <LayoutList className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">Recepção Fácil e Rápida</h3>
                  <p className="text-white/60 text-sm leading-relaxed font-normal">
                    Veja num piscar de olhos quem chega e quem sai do hotel hoje. Faça o cadastro (check-in) do hóspede em segundos, lance o consumo do frigobar direto na conta do quarto e feche a fatura sem erros na hora de ir embora.
                  </p>
                </div>
                <div className="w-full md:w-1/2 flex items-center justify-center relative min-h-[220px]">
                  <div className="w-full bg-[#05050e] rounded-2xl border border-white/10 p-5 shadow-2xl space-y-3 group-hover:-translate-y-2 transition-transform duration-500">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-white">Check-in de Hóspedes</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">Hoje</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        <span className="text-xs font-medium text-white/80">Quarto 104 • Carlos Silva</span>
                      </div>
                      <span className="text-[10px] text-white/40">Pago via Pix</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <span className="text-xs font-medium text-white/80">Quarto 208 • Ana Souza</span>
                      </div>
                      <span className="text-[10px] text-white/40">Pendente</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card3D>

            {/* Bento Item 2 - Financeiro */}
            <Card3D className="p-8 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-5 text-purple-400">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Contas e Fluxo</h3>
                <p className="text-white/60 text-sm leading-relaxed font-normal">
                  Nunca mais perca dinheiro no fechamento do turno. Controle de contas a pagar, a receber e conciliação de caixa automático para cada recepcionista.
                </p>
              </div>
              <div className="mt-8 flex items-end gap-2 h-20 opacity-80 group-hover:opacity-100 transition-opacity">
                {[45, 75, 50, 95, 65, 100].map((h, i) => (
                  <div key={i} className="flex-1 bg-purple-500/20 rounded-t-md relative" style={{ height: `${h}%` }}>
                    <div className="absolute top-0 w-full h-1 bg-purple-400 rounded-t-md" />
                  </div>
                ))}
              </div>
            </Card3D>

            {/* Bento Item 3 - Customização Portal */}
            <Card3D className="p-8 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center mb-5 text-pink-400">
                  <Palette className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Site de Vendas Personalizado</h3>
                <p className="text-white/60 text-sm leading-relaxed font-normal">
                  Mude as cores, adicione sua logomarca, conecte os feedbacks do Google e coloque seu telefone e WhatsApp em destaque. Tudo sem precisar de um programador.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white/20 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                <div className="w-8 h-8 rounded-full bg-pink-500 border-2 border-white/20 shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
              </div>
            </Card3D>

            {/* Bento Item 4 - App Governança (Span 2) */}
            <Card3D className="md:col-span-2 p-8 md:p-10 relative overflow-hidden group">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-1/2">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-5 text-cyan-400">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">Governança via Mobile</h3>
                  <p className="text-white/60 text-sm leading-relaxed font-normal">
                    Sua equipe de limpeza abre um painel no celular, vê os quartos sujos e marca como "Limpo". A recepção é notificada na mesma hora para liberar o hóspede.
                  </p>
                </div>
                <div className="w-full md:w-1/2 flex justify-center md:justify-end">
                  <div className="w-[180px] h-[260px] bg-[#05050e] rounded-[32px] border-[5px] border-white/20 p-4 shadow-2xl group-hover:scale-105 transition-transform duration-500 flex flex-col justify-between">
                    <div className="w-1/3 h-3 bg-white/20 rounded-full mx-auto mb-2" />
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                        <div className="text-[10px] font-bold text-red-400">Quarto 102</div>
                        <div className="text-[9px] text-white/50">Status: Sujo</div>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <div className="text-[10px] font-bold text-emerald-400">Quarto 103</div>
                        <div className="text-[9px] text-white/50">Status: Limpo ✓</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card3D>

            {/* Bento Item 5 - Analytics */}
            <Card3D className="p-8 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-5 text-indigo-400">
                  <PieChart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Relatórios Automáticos</h3>
                <p className="text-white/60 text-sm leading-relaxed font-normal">
                  Pare de adivinhar. Tenha gráficos automáticos no seu celular mostrando a ocupação do mês, lucro real e quais canais estão vendendo mais quartos.
                </p>
              </div>
              <div className="mt-8 flex justify-center items-center h-20 opacity-80 group-hover:scale-110 transition-transform duration-500">
                <div className="w-16 h-16 rounded-full border-[5px] border-indigo-500 border-r-purple-500 border-b-cyan-500 animate-spin" style={{ animationDuration: '12s' }} />
              </div>
            </Card3D>
          </div>
        </div>
      </section>

      {/* Middle CTA */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-indigo-950/40 border border-indigo-500/30 rounded-3xl p-12 md:p-16 backdrop-blur-2xl shadow-[0_0_50px_rgba(99,102,241,0.2)]">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-white">
            Pronto para transformar a gestão do seu hotel?
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto font-normal">
            Junte-se a centenas de hotéis que já modernizaram suas operações.
          </p>
          <Link
            href="/onboarding"
            className="inline-block px-10 py-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-bold text-[13px] uppercase tracking-widest rounded-full transition-all shadow-[0_0_35px_rgba(99,102,241,0.5)] hover:scale-105"
          >
            Assinar Agora
          </Link>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-36 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Preços simples. Sem surpresas.
            </h2>
            <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto font-normal">
              Escolha o plano ideal para o tamanho da sua operação atual.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {displayPlans.map((plan, i) => {
              const isPro = i === 1 || plan.name.toLowerCase().includes('pro');
              return (
                <Card3D
                  key={plan.id || i}
                  className={`p-8 md:p-10 flex flex-col justify-between relative ${
                    isPro
                      ? 'border-indigo-500/60 shadow-[0_0_50px_rgba(99,102,241,0.3)] bg-gradient-to-b from-indigo-950/30 to-purple-950/20'
                      : ''
                  }`}
                >
                  {isPro && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-500 to-purple-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl shadow-lg">
                      Mais Popular
                    </div>
                  )}

                  <div>
                    <h3 className={`text-2xl font-bold mb-2 ${isPro ? 'text-indigo-300' : 'text-white'}`}>
                      {plan.name}
                    </h3>
                    <p className="text-xs text-white/50 mb-6 font-normal">{plan.description}</p>

                    <div className="mb-8">
                      <span className="text-5xl font-extrabold text-white">
                        R$ {Number(plan.price).toFixed(0)}
                      </span>
                      <span className="text-white/50 text-sm font-normal">/mês</span>
                    </div>

                    <ul className="space-y-4 mb-10">
                      {plan.features.map((item: string, j: number) => (
                        <li key={j} className="flex items-start gap-3 text-xs text-white/80 font-normal">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href={`/onboarding?plan=${plan.name.toUpperCase()}`}
                    className={`w-full py-4 font-bold text-[12px] uppercase tracking-widest rounded-2xl transition-all text-center ${
                      isPro
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.5)]'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                    }`}
                  >
                    {plan.name.toLowerCase() === 'corporativo' ? 'Falar com Vendas' : `Escolher ${plan.name}`}
                  </Link>
                </Card3D>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden z-10">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 text-white">
            Chegou a hora de evoluir.
          </h2>
          <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto font-normal">
            Comece a usar o HOSPED hoje mesmo e simplifique a gestão do seu hotel.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black hover:bg-white/90 font-extrabold text-[14px] uppercase tracking-widest rounded-full transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.4)]"
          >
            Assinar Agora <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 relative z-10 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center relative gap-6">
          <div className="md:absolute md:left-0 flex items-center gap-2">
            <Hexagon className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-extrabold tracking-wider text-white/80">HOSPED</span>
          </div>
          <p className="text-[11px] text-white/40 uppercase tracking-widest font-bold text-center">
            © 2026 O Sistema Operacional do seu Hotel.
          </p>
        </div>
      </footer>
    </div>
  );
}
