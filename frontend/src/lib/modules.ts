/**
 * ============================================================
 *  SYSTEM MODULE REGISTRY — FONTE ÚNICA DA VERDADE
 * ============================================================
 *
 * Como adicionar um novo módulo:
 * 1. Adicione uma entrada neste objeto com um ID único em SCREAMING_SNAKE_CASE
 * 2. Preencha label, description, icon, category e route
 * 3. Pronto — o módulo aparecerá automaticamente:
 *    - Na página de Planos (super-admin)
 *    - No modal de edição de Tenants
 *    - No sidebar do admin (com o guard aplicado)
 *    - Na página dedicada de Módulos
 *
 * NÃO é necessário editar mais nenhum arquivo para expor um novo módulo.
 * ============================================================
 */

export interface SystemModule {
  /** Identificador único do módulo. Usado como chave no banco. */
  id: string;
  /** Nome exibido ao usuário */
  label: string;
  /** Descrição curta para o painel de configuração */
  description: string;
  /** Nome do ícone Lucide (string para uso dinâmico) */
  icon: string;
  /** Categoria visual para agrupar no painel */
  category: 'core' | 'operations' | 'commercial' | 'advanced';
  /** Rota no admin que este módulo habilita (para guard no sidebar) */
  route?: string;
  /** Se true, o módulo vem habilitado por padrão para todos */
  defaultEnabled?: boolean;
}

export const SYSTEM_MODULES: Record<string, SystemModule> = {
  // ── CORE (sempre disponíveis, mas aqui para referência) ────────────────────
  DASHBOARD: {
    id: 'DASHBOARD',
    label: 'Dashboard',
    description: 'Painel principal com KPIs e resumo operacional.',
    icon: 'LayoutDashboard',
    category: 'core',
    route: '/admin/dashboard',
    defaultEnabled: true,
  },
  RESERVATIONS: {
    id: 'RESERVATIONS',
    label: 'Controle de Reservas',
    description: 'Criação e gestão completa de reservas.',
    icon: 'CalendarDays',
    category: 'core',
    route: '/admin/reservas',
    defaultEnabled: true,
  },
  GUESTS: {
    id: 'GUESTS',
    label: 'Cadastro de Hóspedes',
    description: 'Gestão do perfil e histórico de hóspedes.',
    icon: 'Users',
    category: 'core',
    route: '/admin/hospedes',
    defaultEnabled: true,
  },
  ROOMS: {
    id: 'ROOMS',
    label: 'Quartos & Categorias',
    description: 'Configuração de UHs, categorias e tarifas.',
    icon: 'Building2',
    category: 'core',
    route: '/admin/quartos',
    defaultEnabled: true,
  },

  // ── OPERATIONS ─────────────────────────────────────────────────────────────
  HOUSEKEEPING: {
    id: 'HOUSEKEEPING',
    label: 'Governança',
    description: 'Controle de tarefas de limpeza e governança.',
    icon: 'Sparkles',
    category: 'operations',
    route: '/admin/governanca',
    defaultEnabled: true,
  },
  MAINTENANCE: {
    id: 'MAINTENANCE',
    label: 'Manutenção',
    description: 'Ordens de serviço e manutenção corretiva.',
    icon: 'Wrench',
    category: 'operations',
    route: '/admin/manutencao',
    defaultEnabled: true,
  },
  INVENTORY: {
    id: 'INVENTORY',
    label: 'Estoque & Consumos',
    description: 'Controle de inventário e consumos de hóspedes.',
    icon: 'Package',
    category: 'operations',
    route: '/admin/estoque',
    defaultEnabled: true,
  },
  FINANCIAL: {
    id: 'FINANCIAL',
    label: 'Financeiro',
    description: 'Caixa, despesas e relatórios financeiros.',
    icon: 'DollarSign',
    category: 'operations',
    route: '/admin/financeiro',
    defaultEnabled: true,
  },

  // ── COMMERCIAL (módulos pagos/premium) ────────────────────────────────────
  GANTT_CHART: {
    id: 'GANTT_CHART',
    label: 'Mapa de Ocupação (Gantt)',
    description: 'Visualização interativa de ocupação em linha do tempo.',
    icon: 'Calendar',
    category: 'commercial',
    route: '/admin/gantt',
    defaultEnabled: false,
  },
  BOOKING_ENGINE: {
    id: 'BOOKING_ENGINE',
    label: 'Motor de Reservas Online',
    description: 'Site público de reservas diretas com motor de disponibilidade.',
    icon: 'Globe',
    category: 'commercial',
    defaultEnabled: false,
  },

  // ── ADVANCED (módulos enterprise) ─────────────────────────────────────────
  MULTIPLE_BRANCHES: {
    id: 'MULTIPLE_BRANCHES',
    label: 'Múltiplas Filiais',
    description: 'Gerenciamento de redes hoteleiras com múltiplas unidades.',
    icon: 'Landmark',
    category: 'advanced',
    defaultEnabled: false,
  },
  WEBHOOKS: {
    id: 'WEBHOOKS',
    label: 'Webhooks & API',
    description: 'Integração via webhooks e acesso à API pública.',
    icon: 'CloudLightning',
    category: 'advanced',
    route: '/admin/integracoes',
    defaultEnabled: false,
  },
  WHITE_LABEL: {
    id: 'WHITE_LABEL',
    label: 'White-Label (Hosped Injector)',
    description: 'Customização completa de cores, logo e domínio próprio.',
    icon: 'Palette',
    category: 'advanced',
    defaultEnabled: false,
  },
  AUDIT_LOG: {
    id: 'AUDIT_LOG',
    label: 'Histórico de Ações (Auditoria)',
    description: 'Log completo de todas as ações realizadas no sistema.',
    icon: 'ShieldCheck',
    category: 'advanced',
    route: '/admin/auditoria',
    defaultEnabled: true,
  },
};

/** Array de todos os módulos (para iteração) */
export const ALL_MODULES = Object.values(SYSTEM_MODULES);

/** Módulos que ficam em "premium/opt-in" (não são default) */
export const PREMIUM_MODULES = ALL_MODULES.filter(m => !m.defaultEnabled);

/** Módulos habilitados por padrão para qualquer plano */
export const DEFAULT_MODULES = ALL_MODULES
  .filter(m => m.defaultEnabled)
  .map(m => m.id);

/**
 * Verifica se um hotel tem determinado módulo habilitado.
 * Módulos com `defaultEnabled: true` estão sempre disponíveis.
 */
export function hasModule(enabledModules: string[] | undefined, moduleId: string): boolean {
  const mod = SYSTEM_MODULES[moduleId];
  if (!mod) return false;
  if (mod.defaultEnabled) return true;
  return (enabledModules || []).includes(moduleId);
}

/** Retorna os módulos habilitados de um hotel (incluindo defaults) */
export function getEffectiveModules(enabledModules: string[]): string[] {
  return [
    ...DEFAULT_MODULES.filter(id => !enabledModules.includes(id)),
    ...enabledModules,
  ];
}
