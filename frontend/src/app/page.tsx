'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, ArrowRight, CheckCircle2, Globe, Shield, Smartphone, Zap, Hexagon, Calendar, LayoutList, Palette, CreditCard, X, Package, RefreshCcw, MessageSquare, PieChart } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const featuresList = [
  {
    icon: Building2,
    title: 'Várias Unidades, Um só Painel',
    desc: 'Gerencie dezenas de filiais no mesmo painel. Controle de acesso por unidade e visão consolidada.',
    longDesc: 'Se você tem mais de uma pousada ou hotel, acesse todas as unidades usando apenas uma senha. Visualize facilmente quanto cada unidade faturou e controle o que seus gerentes podem ver.'
  },
  {
    icon: Globe,
    title: 'Site de Reservas Próprio',
    desc: 'Venda diretamente no seu site sem pagar comissões para sites como Booking e Airbnb. Totalmente customizável.',
    longDesc: 'Pare de pagar comissões altas. Tenha um site de reservas com a cara da sua marca. Integre avaliações reais de hóspedes do Google, mapa de localização e botão de WhatsApp para contato direto.'
  },
  {
    icon: Calendar,
    title: 'Painel Visual de Reservas',
    desc: 'Gerencie as reservas em um mapa visual intuitivo com suporte a arrastar e soltar.',
    longDesc: 'Esqueça cadernos e tabelas complicadas. Veja todos os seus quartos em uma tela visual super simples. Troque um hóspede de quarto ou aumente os dias da estadia apenas clicando e arrastando o mouse.'
  },
  {
    icon: Zap,
    title: 'Fim das Filas na Recepção',
    desc: 'Envie um link para o celular do hóspede. Ele preenche os dados em casa e chega ao hotel apenas para pegar a chave.',
    longDesc: 'Aumente o nível de serviço do seu hotel enviando um link de pré check-in pelo WhatsApp. O hóspede preenche a ficha de cadastro, assina digitalmente e tira foto do documento pelo celular. Quando ele chega, basta entregar a chave.'
  },
  {
    icon: CreditCard,
    title: 'Recebimentos Descomplicados',
    desc: 'Receba via Pix e cartão de crédito direto no sistema. Pagamentos e parcelamentos processados de forma automática e segura.',
    longDesc: 'Integração bancária e de cartão que dá baixa automática no sistema. Sem conciliação manual. Ao pagar pelo Pix, a reserva já muda de status instantaneamente. Parcele as vendas e emita notas fiscais direto pela plataforma.'
  },
  {
    icon: Shield,
    title: 'Controle de Acesso da Equipe',
    desc: 'Saiba exatamente o que cada funcionário fez. Você escolhe as telas que a recepção, a limpeza e o financeiro podem acessar.',
    longDesc: 'Evite fraudes e desorganização. Toda pequena alteração (excluir reserva, aplicar desconto, mudar quarto) gera um log detalhado apontando o e-mail, horário e o dado exato que foi modificado. Durma tranquilo sabendo que a operação está blindada.'
  },
  {
    icon: RefreshCcw,
    title: 'Conexão com Sites de Reserva',
    desc: 'Atualize suas vagas no Booking, Airbnb e Expedia. Se um quarto é alugado em um site, bloqueia nos outros na mesma hora.',
    longDesc: 'Evite reservas duplicadas de uma vez por todas. Toda vez que uma reserva entra pelo Booking ou pelo seu site, a disponibilidade é atualizada automaticamente em todos os outros canais em questão de segundos. Gestão de tarifas unificada.'
  },
  {
    icon: Package,
    title: 'Consumo e Fechamento de Conta',
    desc: 'Lance o consumo do frigobar e restaurante direto na conta do quarto. Facilita o pagamento na hora em que o hóspede for embora.',
    longDesc: 'Lance consumos diretamente na fatura do quarto. O sistema atualiza o estoque instantaneamente e avisa quando produtos estão acabando. Emita cupom fiscal de vendas avulsas para não-hóspedes diretamente do nosso sistema de vendas.'
  },
  {
    icon: MessageSquare,
    title: 'Comunicação Automática',
    desc: 'O sistema envia sozinho mensagens de boas-vindas, lembretes de check-in e agradecimentos após a saída do hóspede.',
    longDesc: 'Aumente o retorno de hóspedes e as avaliações no TripAdvisor. Configure e-mails e mensagens de WhatsApp automáticas. Envie dicas da cidade 2 dias antes do check-in e envie um cupom de desconto exclusivo 1 dia após o check-out.'
  }
];

export default function SaasLandingPage() {
  const [plans, setPlans] = React.useState<any[]>([]);
  const [activeFeatureIndex, setActiveFeatureIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    import('../lib/api').then(({ api }) => {
      api.getSystemPlans()
        .then(data => {
          setPlans(data.filter((p: any) => p.isActive));
        })
        .catch(err => console.error('Error fetching plans:', err));
    });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-indigo-500/30">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_-5px_#6366f1]">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">HOSPED</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-white/60 uppercase tracking-widest">
            <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#pricing" className="hover:text-white transition-colors">Planos</a>
            <Link href="/guia" className="hover:text-white transition-colors">Guia de Uso</Link>
            <a href="/11111111-1111-1111-1111-111111111111" target="_blank" className="hover:text-white transition-colors text-purple-400">Ver Demo do Portal</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[12px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/onboarding" className="px-5 py-2.5 bg-white hover:bg-white/90 text-black text-[11px] font-bold uppercase tracking-widest rounded-full transition-all hover:scale-105">
              Assinar Agora
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 min-h-[90vh] flex flex-col items-center justify-center">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-[100%] pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">O Sistema Operacional Definitivo para Hotéis</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-[1.1]">
            Gestão Hoteleira <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Simples e Lucrativa.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/40 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Abandone as planilhas e o trabalho manual. Um sistema que faz a sua recepção ser mais rápida, conecta seu hotel com a internet e ajuda você a lucrar mais, tudo em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/onboarding" className="w-full sm:w-auto px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[13px] uppercase tracking-widest rounded-full transition-all shadow-[0_0_30px_-5px_#6366f1] hover:scale-105 flex items-center justify-center gap-2">
              Começar Agora <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#pricing" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[13px] uppercase tracking-widest rounded-full transition-all flex items-center justify-center">
              Ver Preços
            </Link>
          </div>
        </motion.div>

        {/* Dashboard Mockup Visual */}
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }} className="w-full max-w-6xl mx-auto mt-20 relative z-10">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-2xl shadow-indigo-500/10">
            {/* Fake Mac Header */}
            <div className="h-8 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            {/* Mockup Body */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-[400px]">
              <div className="col-span-1 border-r border-white/5 pr-4 space-y-4">
                <div className="h-10 bg-white/5 rounded-xl animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="h-10 bg-indigo-500/20 rounded-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </div>
                <div className="h-10 bg-white/5 rounded-xl animate-pulse" style={{ animationDelay: '300ms' }} />
                <div className="h-10 bg-white/5 rounded-xl animate-pulse" style={{ animationDelay: '600ms' }} />
              </div>
              <div className="col-span-3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-24 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col justify-end">
                    <div className="w-1/2 h-2 bg-white/20 rounded-full mb-2" />
                    <div className="w-3/4 h-4 bg-white/40 rounded-full" />
                  </div>
                  <div className="h-24 bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-xl p-4 flex flex-col justify-end relative overflow-hidden">
                    <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
                    <div className="w-1/2 h-2 bg-indigo-400/40 rounded-full mb-2" />
                    <div className="w-full h-4 bg-indigo-400/80 rounded-full" />
                  </div>
                  <div className="h-24 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col justify-end">
                    <div className="w-1/3 h-2 bg-white/20 rounded-full mb-2" />
                    <div className="w-1/2 h-4 bg-white/40 rounded-full" />
                  </div>
                </div>
                <div className="h-48 bg-gradient-to-tr from-white/5 to-indigo-500/5 rounded-xl border border-white/5 relative overflow-hidden flex items-end p-6 gap-2">
                  {/* Fake Chart Bars */}
                  {[40, 70, 45, 90, 65, 80, 55, 100].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 1.5, delay: 0.5 + (i * 0.1), type: 'spring' }}
                      className={`flex-1 rounded-t-sm ${i === 3 || i === 7 ? 'bg-indigo-500/60' : 'bg-white/10'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-[#050505] relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Tudo que uma grande rede precisa.</h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">Construído com arquitetura moderna para garantir segurança, velocidade e escalabilidade.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresList.map((f, i) => (
              <motion.div
                key={i}
                layoutId={`feature-card-${i}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                onClick={() => setActiveFeatureIndex(i)}
                className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group cursor-pointer"
              >
                <motion.div layoutId={`feature-icon-${i}`} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all duration-300">
                  <f.icon className="w-6 h-6" />
                </motion.div>
                <motion.h3 layoutId={`feature-title-${i}`} className="text-lg font-bold mb-3">{f.title}</motion.h3>
                <motion.p layoutId={`feature-desc-${i}`} className="text-[13px] text-white/40 leading-relaxed">{f.desc}</motion.p>
                <div className="mt-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/60 group-hover:text-indigo-400 transition-colors">
                  <span>Saiba mais</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {activeFeatureIndex !== null && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveFeatureIndex(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              />
              <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none px-4">
                <motion.div
                  layoutId={`feature-card-${activeFeatureIndex}`}
                  className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden pointer-events-auto flex flex-col relative"
                >
                  <button
                    onClick={() => setActiveFeatureIndex(null)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="p-8 pb-0">
                    <motion.div layoutId={`feature-icon-${activeFeatureIndex}`} className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-400">
                      {React.createElement(featuresList[activeFeatureIndex].icon, { className: "w-8 h-8" })}
                    </motion.div>
                    <motion.h3 layoutId={`feature-title-${activeFeatureIndex}`} className="text-3xl font-bold mb-4">{featuresList[activeFeatureIndex].title}</motion.h3>
                    <motion.p layoutId={`feature-desc-${activeFeatureIndex}`} className="text-lg text-white/60 mb-8">{featuresList[activeFeatureIndex].longDesc}</motion.p>
                  </div>

                  <div className="h-64 bg-gradient-to-t from-black to-white/5 border-t border-white/5 relative flex items-center justify-center overflow-hidden">
                    {/* Mockup visual representing the feature inside */}
                    <div className="absolute inset-x-8 bottom-0 top-8 bg-[#050505] rounded-t-2xl border border-white/10 border-b-0 p-4 overflow-hidden shadow-2xl">
                       <div className="h-4 border-b border-white/5 flex items-center gap-1.5 mb-4">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                       </div>
                       <div className="space-y-3 opacity-60">
                         <div className="h-4 w-1/3 bg-white/10 rounded" />
                         <div className="h-20 bg-indigo-500/10 rounded border border-indigo-500/20" />
                         <div className="flex gap-2">
                           <div className="h-10 flex-1 bg-white/5 rounded" />
                           <div className="h-10 flex-1 bg-white/5 rounded" />
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
      <section className="py-32 px-6 border-t border-white/5 bg-[#030014] relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Um ecossistema completo.</h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">Tudo que você precisa para operar, vender e analisar o seu hotel, nativamente integrado.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Bento Item 1 - Recepção (Span 2) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-3xl p-8 relative overflow-hidden group flex flex-col md:flex-row gap-6"
            >
              <div className="relative z-10 w-full md:w-1/2 flex flex-col justify-center">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                  <LayoutList className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Recepção Fácil e Rápida</h3>
                <p className="text-white/40 text-sm leading-relaxed">Veja num piscar de olhos quem chega e quem sai do hotel hoje. Faça o cadastro (check-in) do hóspede em segundos, lance o consumo do frigobar direto na conta do quarto e feche a fatura sem erros na hora de ir embora.</p>
              </div>
              <div className="w-full md:w-1/2 flex items-end justify-end relative min-h-[200px]">
                {/* Mini mockup recepcao */}
                <div className="absolute right-[-2rem] bottom-[-2rem] w-full max-w-sm h-auto bg-[#0a0a0a] rounded-tl-2xl border border-white/10 shadow-2xl p-4 flex flex-col gap-3 opacity-80 group-hover:-translate-y-4 group-hover:-translate-x-4 transition-transform duration-500">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-3 w-24 bg-white/20 rounded-full" />
                    <div className="h-6 w-16 bg-indigo-500/20 rounded-lg" />
                  </div>
                  <div className="h-12 bg-white/5 rounded-xl border border-white/5 flex items-center px-4"><div className="w-4 h-4 rounded-full bg-emerald-500/50 mr-3" /><div className="h-2 w-1/2 bg-white/20 rounded-full" /></div>
                  <div className="h-12 bg-white/5 rounded-xl border border-white/5 flex items-center px-4"><div className="w-4 h-4 rounded-full bg-amber-500/50 mr-3" /><div className="h-2 w-1/3 bg-white/20 rounded-full" /></div>
                  <div className="h-12 bg-white/5 rounded-xl border border-white/5 flex items-center px-4"><div className="w-4 h-4 rounded-full bg-red-500/50 mr-3" /><div className="h-2 w-2/3 bg-white/20 rounded-full" /></div>
                </div>
              </div>
            </motion.div>

            {/* Bento Item 2 - Financeiro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold mb-2">Contas e Fluxo</h3>
                <p className="text-white/40 text-sm leading-relaxed">Nunca mais perca dinheiro no fechamento do turno. Controle de contas a pagar, a receber e conciliação de caixa automático para cada recepcionista.</p>
              </div>
              <div className="mt-8 flex items-end gap-2 h-24 opacity-70 group-hover:opacity-100 transition-opacity">
                {[40, 60, 30, 80, 50, 100].map((h, i) => (
                  <div key={i} className="flex-1 bg-indigo-400/20 rounded-t-sm relative" style={{ height: `${h}%` }}>
                    <div className="absolute top-0 w-full h-1 bg-indigo-400" />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Bento Item 3 - Customização Portal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-tr from-white/[0.03] to-transparent border border-white/5 rounded-3xl p-8 relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
                  <Palette className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold mb-2">Site de Vendas Personalizado</h3>
                <p className="text-white/40 text-sm leading-relaxed">Mude as cores, adicione sua logomarca, conecte os feedbacks do Google e coloque seu telefone e WhatsApp em destaque. Tudo sem precisar de um programador.</p>
              </div>
              <div className="mt-8 flex gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white/20" />
                <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white/20" />
                <div className="w-8 h-8 rounded-full bg-amber-500 border-2 border-white/20" />
              </div>
            </motion.div>

            {/* Bento Item 4 - App Governança (Span 2) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 bg-gradient-to-tr from-white/[0.03] to-transparent border border-white/5 rounded-3xl p-8 relative overflow-hidden group flex items-center"
            >
              <div className="w-1/2 relative z-10 pr-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Governança via Mobile</h3>
                <p className="text-white/40 text-sm leading-relaxed">Sua equipe de limpeza abre um painel no celular, vê os quartos sujos e marca como "Limpo". A recepção é notificada na mesma hora para liberar o hóspede.</p>
              </div>
              <div className="w-1/2 flex justify-end">
                {/* Fake Mobile App */}
                <div className="w-[160px] h-[320px] bg-[#0a0a0a] rounded-[30px] border-[6px] border-white/10 shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                  <div className="absolute top-0 w-full h-4 bg-black flex justify-center"><div className="w-1/3 h-full bg-white/10 rounded-b-xl" /></div>
                  <div className="p-4 pt-8 h-full flex flex-col gap-3">
                    <div className="h-6 w-2/3 bg-white/20 rounded-md mb-2" />
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"><div className="h-2 w-1/2 bg-red-400/50 rounded-full mb-2" /><div className="h-4 w-1/4 bg-red-400/80 rounded-md" /></div>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"><div className="h-2 w-1/2 bg-emerald-400/50 rounded-full mb-2" /><div className="h-4 w-1/4 bg-emerald-400/80 rounded-md" /></div>
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Bento Item 5 - Channel Manager (Span 2) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="md:col-span-2 bg-gradient-to-bl from-white/[0.03] to-transparent border border-white/5 rounded-3xl p-8 relative overflow-hidden group flex flex-col md:flex-row items-center"
            >
              <div className="w-full md:w-1/2 relative z-10 pr-6 mb-8 md:mb-0">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
                  <RefreshCcw className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Integração com Booking e Airbnb</h3>
                <p className="text-white/40 text-sm leading-relaxed">Esqueça o medo de reservas duplicadas (Overbooking). O sistema atualiza a disponibilidade em todos os sites da internet automaticamente na mesma hora.</p>
              </div>
              <div className="w-full md:w-1/2 flex items-center justify-center relative">
                {/* Visual Connection Map */}
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center z-10 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                  <Hexagon className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="absolute w-full h-full flex items-center justify-center animate-spin-slow opacity-60">
                  <div className="w-32 h-32 rounded-full border border-white/10 absolute" />
                  <div className="absolute w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center top-0 -translate-y-1/2 shadow-lg backdrop-blur-md">
                     <div className="w-2 h-2 rounded-full bg-blue-400" />
                  </div>
                  <div className="absolute w-8 h-8 rounded-full bg-pink-600/30 flex items-center justify-center bottom-0 translate-y-1/2 shadow-lg backdrop-blur-md">
                     <div className="w-2 h-2 rounded-full bg-pink-400" />
                  </div>
                  <div className="absolute w-8 h-8 rounded-full bg-amber-600/30 flex items-center justify-center right-0 translate-x-1/2 shadow-lg backdrop-blur-md">
                     <div className="w-2 h-2 rounded-full bg-amber-400" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bento Item 6 - Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-bl from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                  <PieChart className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold mb-2">Relatórios Automáticos</h3>
                <p className="text-white/40 text-sm leading-relaxed">Pare de adivinhar. Tenha gráficos automáticos no seu celular mostrando a ocupação do mês, lucro real e quais canais estão vendendo mais quartos.</p>
              </div>
              <div className="mt-8 relative flex justify-center items-center h-24 opacity-60 group-hover:opacity-100 transition-opacity group-hover:scale-110 duration-500">
                {/* Fake Pie Chart */}
                <div className="w-20 h-20 rounded-full border-[6px] border-indigo-500 border-r-indigo-400/20 border-b-indigo-400/20 rotate-45" />
                <div className="absolute w-14 h-14 rounded-full border-[4px] border-purple-500 border-l-purple-400/20 -rotate-12" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Middle */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4">Pronto para transformar a gestão do seu hotel?</h2>
          <p className="text-white/60 mb-8">Junte-se a centenas de hotéis que já modernizaram suas operações.</p>
          <Link href="/onboarding" className="inline-block px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[13px] uppercase tracking-widest rounded-full transition-all shadow-[0_0_30px_-5px_#6366f1] hover:scale-105">
            Assinar Agora
          </Link>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 relative">
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Preços simples. Sem surpresas.</h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">Escolha o plano ideal para o tamanho da sua operação atual.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => {
              const isPro = i === 1 || plan.name.toLowerCase().includes('pro');
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`glass-card p-8 flex flex-col relative overflow-hidden group ${
                    isPro
                      ? 'border-indigo-500/50 shadow-[0_0_40px_-10px_rgba(99,102,241,0.2)] transform md:-translate-y-4 bg-indigo-950/20'
                      : ''
                  }`}
                >
                  {isPro && (
                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg shadow-lg">Mais Popular</div>
                  )}
                  {isPro && (
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                  )}

                  <h3 className={`text-xl font-bold mb-2 transition-colors group-hover:text-white ${isPro ? 'text-indigo-400' : 'text-white/80'}`}>{plan.name}</h3>
                  <p className="text-[13px] text-white/40 mb-6">{plan.description}</p>
                  <div className="mb-8">
                    <span className="text-4xl font-bold text-white">R$ {Number(plan.price).toFixed(0)}</span><span className="text-white/40">/mês</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((item: string, j: number) => (
                      <li key={j} className="flex items-start gap-3 text-[13px] text-white/70">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> {item}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/onboarding?plan=${plan.name.toUpperCase()}`} className={`w-full py-4 font-bold text-[11px] uppercase tracking-widest rounded-xl transition-all text-center ${
                    isPro
                      ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_20px_-5px_#6366f1] hover:shadow-[0_0_30px_-5px_#6366f1]'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 group-hover:border-white/20'
                  }`}>
                    {plan.name.toLowerCase() === 'corporativo' ? 'Falar com Vendas' : `Escolher ${plan.name}`}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA End */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/20 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Chegou a hora de evoluir.</h2>
          <p className="text-xl text-white/50 mb-10">Comece a usar o HOSPED hoje mesmo e simplifique a gestão do seu hotel.</p>
          <Link href="/onboarding" className="inline-flex items-center gap-2 px-10 py-5 bg-white text-black hover:bg-white/90 font-bold text-[14px] uppercase tracking-widest rounded-full transition-all hover:scale-105">
            Assinar Agora <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center relative gap-6">
          <div className="md:absolute md:left-0 flex items-center gap-2">
            <Hexagon className="w-5 h-5 text-white/40" />
            <span className="text-sm font-bold text-white/40">HOSPED</span>
          </div>
          <p className="text-[11px] text-white/30 uppercase tracking-widest font-bold text-center">
            © 2026 O Sistema Operacional do seu Hotel.
          </p>
        </div>
      </footer>
    </div>
  );
}
