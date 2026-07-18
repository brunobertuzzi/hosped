'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, ArrowRight, CheckCircle2, Globe, Shield, Smartphone, Zap,
  Hexagon, Calendar, LayoutList, Palette, CreditCard, Package, RefreshCcw,
  MessageSquare, PieChart, Users, BedDouble, ClipboardList, DollarSign,
  Settings, BookOpen, Search, ChevronRight, X, Menu, Home, LogIn,
  UserPlus, Key, Bell, BarChart3, Wifi, MapPin, Clock, Star, HelpCircle
} from 'lucide-react';

const guideSections = [
  {
    id: 'primeiros-passos',
    icon: Home,
    title: 'Primeiros Passos',
    subtitle: 'Tudo que você precisa saber para começar',
    content: [
      {
        title: 'Criando sua Conta',
        icon: UserPlus,
        desc: 'Acesse a página inicial e clique em "Assinar Agora". Preencha os dados da sua empresa, seu nome e crie uma senha segura. Após o cadastro, você receberá um e-mail de confirmação e poderá fazer login imediatamente.',
        tip: 'Use um e-mail corporativo para facilitar o gerenciamento da equipe.'
      },
      {
        title: 'Fazendo Login',
        icon: LogIn,
        desc: 'No menu superior direito, clique em "Login". Insira seu e-mail e senha cadastrados. Se for o primeiro acesso como proprietário, você será redirecionado automaticamente ao painel administrativo do seu hotel.',
        tip: 'Marque "Lembrar-me" em dispositivos seguros para agilizar o acesso diário.'
      },
      {
        title: 'Visão Geral do Painel',
        icon: LayoutList,
        desc: 'Ao entrar, você verá o Dashboard principal. Aqui você encontra um resumo completo da operação: reservas do dia, ocupação dos quartos, faturamento do período, check-ins e check-outs previstos, e alertas importantes. Tudo em tempo real e organizado por filial.',
        tip: 'Use o seletor de filial no topo para alternar entre unidades sem sair do painel.'
      },
      {
        title: 'Navegação entre Módulos',
        icon: Menu,
        desc: 'O menu lateral esquerdo dá acesso a todos os módulos do sistema: Reservas, Quartos, Hóspedes, Financeiro, Estoque, Governança, Manutenção, Integrações e Configurações. Cada módulo abre uma tela específica com suas funcionalidades.',
        tip: 'Os ícones no menu têm labels descritivos — passe o mouse para ver detalhes.'
      }
    ]
  },
  {
    id: 'reservas',
    icon: Calendar,
    title: 'Gerenciamento de Reservas',
    subtitle: 'Controle total sobre as reservas do seu hotel',
    content: [
      {
        title: 'Criando uma Nova Reserva',
        icon: Calendar,
        desc: 'No módulo "Reservas", clique em "Nova Reserva". Selecione o hóspede (ou cadastre um novo), escolha a categoria de quarto, as datas de check-in e check-out, e defina a origem da reserva (Online, Recepção, Booking, etc.). O sistema calcula automaticamente o valor total baseado nas tarifas e temporadas configuradas.',
        tip: 'Reservas feitas pelo site de vendas já entram automaticamente no sistema.'
      },
      {
        title: 'Painel Visual (Gantt)',
        icon: ClipboardList,
        desc: 'O painel Gantt mostra todos os quartos em uma linha do tempo visual. Cada reserva aparece como um bloco colorido sobre o período de estadia. Você pode arrastar e soltar para estender ou encurtar estadias, trocar um hóspede de quarto, ou visualizar rapidamente a ocupação futura.',
        tip: 'Use o filtro de datas no topo para navegar entre semanas e meses.'
      },
      {
        title: 'Check-in e Check-out',
        icon: LogIn,
        desc: 'Para realizar o check-in, vá até a reserva e clique em "Realizar Check-in". O sistema automaticamente aloca um quarto vago da categoria escolhida. Você pode registrar o documento do hóspede. No check-out, o sistema verifica se todas as pendências financeiras foram quitadas antes de liberar o quarto para limpeza.',
        tip: 'O pré-check-in online permite que o hóspede envie o documento antes de chegar.'
      },
      {
        title: 'Cancelamentos e No-Show',
        icon: X,
        desc: 'Reservas podem ser canceladas a qualquer momento. Ao cancelar, o quarto é liberado automaticamente para limpeza se já estava alocado. O sistema registra o cancelamento no histórico de auditoria com data, horário e usuário responsável.',
        tip: 'Configure a política de cancelamento nas configurações do hotel.'
      }
    ]
  },
  {
    id: 'quartos',
    icon: BedDouble,
    title: 'Quartos e Categorias',
    subtitle: 'Organize e precifique seus quartos',
    content: [
      {
        title: 'Categorias de Quarto',
        icon: BedDouble,
        desc: 'Crie categorias como "Standard", "Luxo", "Suíte Master". Para cada categoria, defina o valor base da diária, capacidade de hóspedes, fotos e descrição. As categorias aparecem no site de vendas e no painel de reservas.',
        tip: 'Categorias bem descritas com fotos de qualidade aumentam as conversões no site.'
      },
      {
        title: 'Gerenciamento de Quartos Físicos',
        icon: Building2,
        desc: 'Dentro de cada categoria, cadastre os quartos físicos com número, andar e status inicial (Disponível, Ocupado, Limpeza, Manutenção, Bloqueado). O sistema controla automaticamente a ocupação e disponibilidade de cada quarto.',
        tip: 'Use o status "Bloqueado" para quartos fora de operação por reforma.'
      },
      {
        title: 'Tarifas por Temporada',
        icon: DollarSign,
        desc: 'Configure tarifas especiais para alta temporada, feriados e eventos. O sistema aplica automaticamente a tarifa correta baseada na data da reserva. Você pode definir percentuais de acréscimo ou valores fixos para cada período.',
        tip: 'Crie temporadas com antecedência para garantir preços dinâmicos.'
      },
      {
        title: 'Fotos e Apresentação',
        icon: Palette,
        desc: 'Adicione fotos para cada categoria de quarto. As imagens aparecem no site de reservas público e no painel administrativo. Recomendamos imagens de alta resolução no formato 16:9 para melhor visualização.',
        tip: 'Fotos profissionais aumentam a credibilidade e as vendas diretas.'
      }
    ]
  },
  {
    id: 'hospedes',
    icon: Users,
    title: 'CRM de Hóspedes',
    subtitle: 'Histórico completo de cada hóspede',
    content: [
      {
        title: 'Cadastro de Hóspedes',
        icon: UserPlus,
        desc: 'O sistema mantém um cadastro completo de todos os hóspedes. Ao criar uma reserva, você pode selecionar um hóspede existente ou cadastrar um novo. Os dados incluem nome, documento, e-mail, telefone e histórico de estadias anteriores.',
        tip: 'Hóspedes recorrentes são identificados automaticamente pelo documento.'
      },
      {
        title: 'Histórico de Estadias',
        icon: Clock,
        desc: 'Para cada hóspede, você pode visualizar o histórico completo de estadias: datas, quartos ocupados, valores pagos, consumos realizados e observações. Isso permite um atendimento personalizado e mais eficiente.',
        tip: 'Use as observações para registrar preferências do hóspede (andar silencioso, quarto com vista, etc.).'
      },
      {
        title: 'Pré-check-in Online',
        icon: Smartphone,
        desc: 'Após a reserva, o sistema pode enviar automaticamente um link de pré-check-in para o WhatsApp do hóspede. Através desse link, ele preenche seus dados, envia foto do documento e assina digitalmente. Quando chegar ao hotel, é só pegar a chave.',
        tip: 'O pré-check-in reduz o tempo de espera na recepção em até 80%.'
      },
      {
        title: 'Painel do Hóspede',
        icon: Star,
        desc: 'Cada hóspede recebe um link exclusivo para seu painel pessoal. Lá ele pode visualizar os detalhes da reserva, fazer pré-check-in, consultar o extrato da conta, solicitar serviços e entrar em contato com a recepção.',
        tip: 'O painel do hóspede funciona como um concierge digital 24 horas.'
      }
    ]
  },
  {
    id: 'financeiro',
    icon: DollarSign,
    title: 'Financeiro e Faturamento',
    subtitle: 'Controle de caixa completo e integrado',
    content: [
      {
        title: 'Visão Geral Financeira',
        icon: PieChart,
        desc: 'O módulo Financeiro apresenta uma visão consolidada com receita bruta, valores a receber, ticket médio e curva de faturamento diário. Os dados são calculados automaticamente a partir das reservas e pagamentos registrados.',
        tip: 'Acompanhe o gráfico de faturamento diário para identificar tendências sazonais.'
      },
      {
        title: 'Contas a Receber',
        icon: CreditCard,
        desc: 'Visualize todas as reservas com saldo pendente. Cada reserva mostra o valor total, o quanto já foi pago e o saldo restante. Você pode registrar pagamentos manuais (PIX, Cartão, Dinheiro) diretamente na tela.',
        tip: 'Pagamentos manuais são úteis para receber do hóspede presencialmente na recepção.'
      },
      {
        title: 'Contas a Pagar (Despesas)',
        icon: Package,
        desc: 'Registre despesas do hotel como contas de água, luz, fornecedores e salários. Acompanhe o status de cada conta (Pendente/Pago) e mantenha o fluxo de caixa organizado. O sistema calcula automaticamente o impacto no resultado do período.',
        tip: 'Categorize as despesas para gerar relatórios mais precisos no futuro.'
      },
      {
        title: 'Pagamento por PIX',
        icon: Zap,
        desc: 'O sistema integra com Mercado Pago para gerar QR Codes PIX. O hóspede paga escaneando o código com o celular e a reserva é confirmada automaticamente. Para pagamentos presenciais, o operador pode registrar o pagamento manualmente.',
        tip: 'Configure as credenciais do Mercado Pago no módulo de Integrações.'
      }
    ]
  },
  {
    id: 'consumo-estoque',
    icon: Package,
    title: 'Consumo e Estoque',
    subtitle: 'Lance consumos e controle seu inventário',
    content: [
      {
        title: 'Lançamento de Consumo',
        icon: Package,
        desc: 'Durante a hospedagem, a recepção pode lançar consumos do frigobar, restaurante ou serviços adicionais diretamente na conta do quarto. O sistema atualiza o estoque automaticamente e adiciona o valor à fatura do hóspede.',
        tip: 'Configure itens de consumo no módulo de Estoque com preço de venda.'
      },
      {
        title: 'Controle de Estoque',
        icon: ClipboardList,
        desc: 'O módulo de Estoque permite cadastrar produtos com quantidade, preço de custo e preço de venda. Cada venda ou consumo baixa automaticamente a quantidade. Você recebe alertas quando o estoque está baixo.',
        tip: 'Use categorias para organizar os produtos (Frigobar, Limpeza, Café da Manhã, etc.).'
      },
      {
        title: 'Movimentações de Estoque',
        icon: RefreshCcw,
        desc: 'Toda entrada ou saída de produtos é registrada como movimentação. Você pode visualizar o histórico completo de movimentações, incluindo vendas, consumos, ajustes manuais e transferências entre filiais.',
        tip: 'Faça inventários periódicos e ajuste o estoque manualmente quando necessário.'
      }
    ]
  },
  {
    id: 'governanca',
    icon: Shield,
    title: 'Governança e Limpeza',
    subtitle: 'Organize a rotina da sua equipe',
    content: [
      {
        title: 'Tarefas de Limpeza',
        icon: Shield,
        desc: 'Quando um hóspede faz check-out, o quarto é automaticamente marcado como "Limpeza". A equipe de governança vê no painel mobile quais quartos precisam ser limpos e marca como concluído quando finalizar. A recepção é notificada na hora.',
        tip: 'A equipe de limpeza pode acessar o painel pelo celular sem precisar de login completo.'
      },
      {
        title: 'Controle via Mobile',
        icon: Smartphone,
        desc: 'O painel de governança é otimizado para dispositivos móveis. Cada funcionário vê apenas as tarefas da sua filial. O sistema registra quem realizou cada limpeza e em qual horário, criando uma trilha de auditoria completa.',
        tip: 'Configure diferentes tipos de limpeza: padrão, pesada, vistoria.'
      }
    ]
  },
  {
    id: 'manutencao',
    icon: Settings,
    title: 'Ordens de Manutenção',
    subtitle: 'Registre e acompanhe reparos',
    content: [
      {
        title: 'Abrindo uma Ordem',
        icon: Settings,
        desc: 'No módulo de Manutenção, clique em "Nova Ordem". Selecione o quarto, descreva o problema e defina a prioridade. A ordem fica visível para a equipe responsável. Quartos em manutenção são bloqueados automaticamente para reservas.',
        tip: 'Use fotos para documentar melhor o problema relatado.'
      },
      {
        title: 'Acompanhamento e Conclusão',
        icon: CheckCircle2,
        desc: 'A equipe de manutenção pode atualizar o status da ordem (Em Andamento, Concluído). Ao concluir, o quarto é liberado automaticamente. Todo o histórico de manutenções fica registrado para consulta futura.',
        tip: 'Ordens concluídas geram notificação para a recepção liberar o quarto.'
      }
    ]
  },
  {
    id: 'integracoes',
    icon: Wifi,
    title: 'Integrações e Canais',
    subtitle: 'Conecte seu hotel com o mundo',
    content: [
      {
        title: 'Channel Manager (Booking, Airbnb)',
        icon: RefreshCcw,
        desc: 'Conecte seu hotel ao Booking, Airbnb e Expedia. Quando uma reserva entra por qualquer canal, a disponibilidade é atualizada automaticamente em todos os outros em segundos. Nunca mais tenha overbooking.',
        tip: 'Configure as tarifas de cada canal separadamente para maximizar a lucratividade.'
      },
      {
        title: 'Site de Reservas Próprio',
        icon: Globe,
        desc: 'Seu hotel ganha um site de reservas personalizado com as cores da sua marca. Os hóspedes podem pesquisar disponibilidade, escolher quartos e pagar via PIX ou cartão. Sem comissão para intermediários.',
        tip: 'Personalize cores, logo e banner no módulo de Configurações.'
      },
      {
        title: 'Google Reviews',
        icon: Star,
        desc: 'Conecte o Google Places do seu hotel para exibir avaliações reais de hóspedes diretamente no seu site de reservas. Avaliações positivas aumentam a confiança e as taxas de conversão.',
        tip: 'Responda às avaliações dos hóspedes para melhorar seu engajamento.'
      },
      {
        title: 'WhatsApp e Comunicação',
        icon: MessageSquare,
        desc: 'Configure o envio automático de mensagens de WhatsApp: boas-vindas após a reserva, link de pré-check-in, lembrete de check-in, agradecimento pós-check-out e cupons de desconto para retorno.',
        tip: 'Personalize as mensagens automáticas para manter o tom da sua marca.'
      },
      {
        title: 'Gateway de Pagamento',
        icon: CreditCard,
        desc: 'Integre com Mercado Pago para receber pagamentos via PIX e cartão de crédito. Os pagamentos são processados de forma segura e a reserva é confirmada automaticamente quando o pagamento é aprovado.',
        tip: 'Mantenha as credenciais atualizadas para evitar falhas nos pagamentos.'
      }
    ]
  },
  {
    id: 'equipe',
    icon: Users,
    title: 'Gestão de Equipe',
    subtitle: 'Controle de acesso e permissões',
    content: [
      {
        title: 'Cadastro de Funcionários',
        icon: UserPlus,
        desc: 'No módulo de Configurações > Equipe, cadastre os funcionários com nome, e-mail e senha. Cada funcionário recebe um papel (HOTEL_OWNER, GERENTE, RECEPCIONISTA, CAMAREIRA) que define quais telas e ações ele pode acessar.',
        tip: 'Crie senhas temporárias e peça para o funcionário trocar no primeiro acesso.'
      },
      {
        title: 'Permissões Granulares',
        icon: Shield,
        desc: 'Você pode definir permissões específicas para cada funcionário: editar reservas, cancelar, gerenciar estoque, acessar financeiro, etc. Um recepcionista pode criar reservas mas não pode excluir ou dar descontos sem autorização.',
        tip: 'Use o papel GERENTE para supervisores que precisam de mais acesso que a recepção.'
      },
      {
        title: 'Auditoria de Ações',
        icon: Search,
        desc: 'Toda ação importante no sistema é registrada no log de auditoria: quem criou, alterou ou cancelou uma reserva, qual dado foi modificado, em qual data e horário. Isso garante transparência total e evita fraudes.',
        tip: 'Consulte o log de auditoria regularmente para monitorar a operação.'
      }
    ]
  },
  {
    id: 'configuracoes',
    icon: Settings,
    title: 'Configurações do Hotel',
    subtitle: 'Personalize seu sistema',
    content: [
      {
        title: 'Dados do Hotel',
        icon: Building2,
        desc: 'No módulo de Configurações, você pode alterar nome, razão social, documento, endereço e dados de contato do seu hotel. Essas informações aparecem no site de vendas e nos relatórios do sistema.',
        tip: 'Mantenha os dados sempre atualizados para evitar problemas fiscais.'
      },
      {
        title: 'Personalização Visual',
        icon: Palette,
        desc: 'Personalize as cores primária e secundária, faça upload do logo e banner do hotel. As alterações refletem instantaneamente no site de reservas público. Escolha entre fontes serifadas, sans-serif ou monoespaçadas.',
        tip: 'Use o logo em alta resolução para melhor aparência no site.'
      },
      {
        title: 'Múltiplas Filiais',
        icon: Building2,
        desc: 'Se você possui mais de uma unidade, cadastre cada uma como uma filial. Cada filial tem seus próprios quartos, estoque e equipe. O painel permite alternar entre filiais ou visualizar dados consolidados.',
        tip: 'Cada filial pode ter suas próprias cores e personalização no site.'
      },
      {
        title: 'Informações Locais',
        icon: MapPin,
        desc: 'Configure o horário de check-in e check-out, fuso horário e endereço completo. Essas informações são exibidas no site de reservas e no painel do hóspede.',
        tip: 'Ajuste o fuso horário corretamente para evitar confusão com reservas online.'
      }
    ]
  },
  {
    id: 'dicas',
    icon: Star,
    title: 'Dicas e Boas Práticas',
    subtitle: 'Extraia o máximo do seu sistema',
    content: [
      {
        title: 'Mantenha os Dados Atualizados',
        icon: RefreshCcw,
        desc: 'Quanto mais completo estiver o cadastro de quartos, categorias e tarifas, mais preciso será o sistema. Revise periodicamente as tarifas e temporadas para garantir que os preços estão competitivos.',
        tip: 'Agende uma revisão mensal das configurações de preço.'
      },
      {
        title: 'Use o Pré-check-in',
        icon: Smartphone,
        desc: 'Ative o envio automático do link de pré-check-in pelo WhatsApp. Isso reduz o tempo na recepção, melhora a experiência do hóspede e garante que todos os documentos estejam registrados antes da chegada.',
        tip: 'Configure a mensagem de boas-vindas com informações úteis sobre o hotel.'
      },
      {
        title: 'Acompanhe os Relatórios',
        icon: BarChart3,
        desc: 'Acesse regularmente o Dashboard e o Financeiro para acompanhar indicadores de desempenho. Ocupação, ticket médio e receita são métricas essenciais para tomar decisões estratégicas.',
        tip: 'Compare períodos (mês atual vs mês anterior) para identificar tendências.'
      },
      {
        title: 'Treine sua Equipe',
        icon: Users,
        desc: 'Invista tempo no treinamento da equipe. Quanto mais familiarizados com o sistema, mais ágil será a operação. Use este guia como material de apoio para novos funcionários.',
        tip: 'Crie um procedimento operacional padrão (POP) para cada função no sistema.'
      }
    ]
  }
];

const sectionIcons: Record<string, any> = {
  'primeiros-passos': Home,
  'reservas': Calendar,
  'quartos': BedDouble,
  'hospedes': Users,
  'financeiro': DollarSign,
  'consumo-estoque': Package,
  'governanca': Shield,
  'manutencao': Settings,
  'integracoes': Wifi,
  'equipe': Users,
  'configuracoes': Settings,
  'dicas': Star,
};

export default function GuiaPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [supportEmail, setSupportEmail] = useState('suporte@hosped.com');

  React.useEffect(() => {
    import('../../lib/api').then(({ api }) => {
      api.getGlobalSettings().then((global: any) => {
        if (global?.supportEmail) setSupportEmail(global.supportEmail);
      }).catch(console.error);
    });
  }, []);


  const filteredSections = searchQuery
    ? guideSections.map(section => ({
        ...section,
        content: section.content.filter(
          item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.desc.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(s => s.content.length > 0)
    : guideSections;

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-indigo-500/30">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_-5px_#6366f1]">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">HOSPED</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-white/60 uppercase tracking-widest">
            <Link href="/" className="hover:text-white transition-colors">Início</Link>
            <Link href="/guia" className="text-indigo-400 border-b-2 border-indigo-400 pb-1">Guia de Uso</Link>
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
      <section className="relative pt-40 pb-20 px-6 min-h-[70vh] flex flex-col items-center justify-center">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-[100%] pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Guia Completo de Uso</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-[1.1]">
            Domine o <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">HOSPED</span>
          </h1>

          <p className="text-lg md:text-xl text-white/40 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Um guia detalhado com todas as funcionalidades do sistema. Aprenda a usar cada módulo, descubra dicas valiosas e torne a gestão do seu hotel muito mais eficiente.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              placeholder="Pesquisar no guia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all text-sm"
            />
          </div>
        </motion.div>
      </section>

      {/* Sections Index */}
      <section className="py-12 px-6 -mt-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3">
            {guideSections.map((section) => {
              const Icon = section.icon;
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.06] hover:border-white/10 transition-all text-[12px] font-semibold text-white/60 hover:text-white"
                >
                  <Icon className="w-4 h-4" />
                  {section.title}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Guide Content */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-24">
          {filteredSections.map((section, sectionIndex) => {
            const SectionIcon = section.icon;
            return (
              <motion.div
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                {/* Section Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <SectionIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{section.title}</h2>
                    <p className="text-white/40 mt-1">{section.subtitle}</p>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-indigo-500/50 via-white/10 to-transparent mb-10" />

                {/* Topic Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                  {section.content.map((topic, topicIndex) => {
                    const TopicIcon = topic.icon;
                    const isExpanded = activeSection === section.id && activeTopic === topicIndex;

                    return (
                      <motion.div
                        key={topicIndex}
                        layout
                        onClick={() => {
                          if (activeSection === section.id && activeTopic === topicIndex) {
                            setActiveSection(null);
                            setActiveTopic(null);
                          } else {
                            setActiveSection(section.id);
                            setActiveTopic(topicIndex);
                          }
                        }}
                        className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                            <TopicIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                              {topic.title}
                              <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </h3>
                            <p className={`text-[13px] text-white/50 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                              {topic.desc}
                            </p>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-4 pt-4 border-t border-white/5">
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                                      <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                      <div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Dica</span>
                                        <p className="text-[12px] text-white/60 mt-1">{topic.tip}</p>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Empty State for Search */}
      {filteredSections.length === 0 && (
        <div className="py-32 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-xl font-bold mb-2">Nenhum resultado encontrado</h3>
          <p className="text-white/40">Tente buscar por termos como "reserva", "check-in", "financeiro" ou "configurações".</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-6 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all"
          >
            Limpar busca
          </button>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/20 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ainda tem dúvidas?</h2>
          <p className="text-xl text-white/50 mb-10">Nossa equipe de suporte está pronta para ajudar você e sua equipe.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={`mailto:${supportEmail}`} className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[13px] uppercase tracking-widest rounded-full transition-all shadow-[0_0_30px_-5px_#6366f1] hover:scale-105">
              Falar com Suporte <MessageSquare className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center relative gap-6">
          <div className="md:absolute md:left-0 flex items-center gap-2">
            <Hexagon className="w-5 h-5 text-white/40" />
            <span className="text-sm font-bold text-white/40">HOSPED</span>
          </div>
          <div className="flex items-center gap-6 text-[11px] text-white/30 uppercase tracking-widest font-bold">
            <Link href="/" className="hover:text-white/60 transition-colors">Início</Link>
            <Link href="/guia" className="hover:text-white/60 transition-colors">Guia de Uso</Link>
          </div>
          <p className="text-[11px] text-white/30 uppercase tracking-widest font-bold text-center md:absolute md:right-0">
            © 2026 HOSPED
          </p>
        </div>
      </footer>
    </div>
  );
}
