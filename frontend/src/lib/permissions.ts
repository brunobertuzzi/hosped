/**
 * ============================================================
 *  PAGE PERMISSIONS REGISTRY
 * ============================================================
 *
 * Define permissões granulares por página do sistema.
 * Cada permissão segue o formato "page.<id>".
 *
 * Como usar:
 * - O HOTEL_OWNER sempre tem permissão total (wildcard "*")
 * - Demais roles podem ter permissões específicas configuradas
 * - Ao cadastrar/editar um usuário, o admin pode selecionar
 *   exatamente quais páginas aquele funcionário pode acessar
 * ============================================================
 */

export interface PagePermission {
  /** Chave única da permissão (ex: "page.dashboard") */
  key: string;
  /** Nome exibido ao usuário */
  label: string;
  /** Descrição do que o acesso libera */
  description: string;
  /** Ícone Lucide (string) */
  icon: string;
  /** Categoria para agrupar na UI */
  category: 'business' | 'setup' | 'settings';
  /** Roles que têm essa permissão por padrão */
  defaultFor: string[];
}

export const PAGE_PERMISSIONS: PagePermission[] = [
  // ── NEGÓCIO ──────────────────────────────────────────────
  {
    key: 'page.dashboard',
    label: 'Dashboard',
    description: 'Painel principal com KPIs e resumo operacional.',
    icon: 'LayoutDashboard',
    category: 'business',
    defaultFor: ['HOTEL_OWNER', 'MANAGER', 'RECEPTIONIST', 'FINANCIAL', 'INVENTORY', 'HOUSEKEEPING', 'MAINTENANCE'],
  },
  {
    key: 'page.reservas',
    label: 'Controle de Reservas',
    description: 'Criação e gestão completa de reservas.',
    icon: 'CalendarDays',
    category: 'business',
    defaultFor: ['HOTEL_OWNER', 'MANAGER', 'RECEPTIONIST'],
  },
  {
    key: 'page.hospedes',
    label: 'Cadastro de Hóspedes',
    description: 'Gestão do perfil e histórico de hóspedes.',
    icon: 'Users',
    category: 'business',
    defaultFor: ['HOTEL_OWNER', 'MANAGER', 'RECEPTIONIST'],
  },
  {
    key: 'page.quartos',
    label: 'Quartos & Categorias',
    description: 'Configuração de UHs, categorias e tarifas.',
    icon: 'Building2',
    category: 'business',
    defaultFor: ['HOTEL_OWNER', 'MANAGER', 'RECEPTIONIST'],
  },
  {
    key: 'page.financeiro',
    label: 'Financeiro',
    description: 'Caixa, despesas e relatórios financeiros.',
    icon: 'DollarSign',
    category: 'business',
    defaultFor: ['HOTEL_OWNER', 'MANAGER', 'FINANCIAL'],
  },
  {
    key: 'page.governanca',
    label: 'Governança',
    description: 'Controle de tarefas de limpeza e governança.',
    icon: 'Sparkles',
    category: 'business',
    defaultFor: ['HOTEL_OWNER', 'MANAGER', 'HOUSEKEEPING'],
  },
  {
    key: 'page.manutencao',
    label: 'Manutenção',
    description: 'Ordens de serviço e manutenção corretiva.',
    icon: 'Wrench',
    category: 'business',
    defaultFor: ['HOTEL_OWNER', 'MANAGER', 'MAINTENANCE'],
  },
  {
    key: 'page.estoque',
    label: 'Estoque & Consumos',
    description: 'Controle de inventário e consumos de hóspedes.',
    icon: 'Package',
    category: 'business',
    defaultFor: ['HOTEL_OWNER', 'MANAGER', 'INVENTORY'],
  },
  {
    key: 'page.gantt',
    label: 'Mapa de Ocupação (Gantt)',
    description: 'Visualização interativa de ocupação em linha do tempo.',
    icon: 'Calendar',
    category: 'business',
    defaultFor: ['HOTEL_OWNER', 'MANAGER'],
  },
  {
    key: 'page.auditoria',
    label: 'Histórico de Ações',
    description: 'Log completo de todas as ações realizadas no sistema.',
    icon: 'ShieldCheck',
    category: 'business',
    defaultFor: ['HOTEL_OWNER', 'MANAGER'],
  },
  {
    key: 'page.integracoes',
    label: 'Integrações & Webhooks',
    description: 'Configuração de webhooks e API.',
    icon: 'CloudLightning',
    category: 'business',
    defaultFor: ['HOTEL_OWNER'],
  },

  // ── SETUP & GESTÃO ───────────────────────────────────────
  {
    key: 'page.equipe',
    label: 'Equipe (RH)',
    description: 'Cadastro de funcionários e permissões.',
    icon: 'Users',
    category: 'setup',
    defaultFor: ['HOTEL_OWNER', 'MANAGER'],
  },
  {
    key: 'page.meu-plano',
    label: 'Meu Plano',
    description: 'Visualizar plano e módulos contratados.',
    icon: 'CreditCard',
    category: 'setup',
    defaultFor: ['HOTEL_OWNER', 'MANAGER', 'RECEPTIONIST', 'FINANCIAL', 'INVENTORY', 'HOUSEKEEPING', 'MAINTENANCE'],
  },

  // ── CONFIGURAÇÕES ────────────────────────────────────────
  {
    key: 'page.configuracoes',
    label: 'Configurações',
    description: 'Configurações gerais do hotel.',
    icon: 'Settings',
    category: 'settings',
    defaultFor: ['HOTEL_OWNER', 'MANAGER'],
  },
  {
    key: 'page.site-reservas',
    label: 'Ver Site de Reservas',
    description: 'Acessar o site público de reservas do hotel.',
    icon: 'Globe',
    category: 'settings',
    defaultFor: ['HOTEL_OWNER', 'MANAGER', 'RECEPTIONIST'],
  },
];

/** Retorna as permissões padrão para uma role */
export function getDefaultPermissions(role: string): string[] {
  if (role === 'HOTEL_OWNER') return ['*'];
  return PAGE_PERMISSIONS
    .filter(p => p.defaultFor.includes(role))
    .map(p => p.key);
}

/** Verifica se o usuário tem acesso a uma página específica */
export function canAccessPage(userPermissions: string[] | undefined, pageKey: string): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(pageKey);
}

/** Categorias para exibição na UI */
export const PERMISSION_CATEGORIES: Record<string, string> = {
  business: 'Módulos de Negócio',
  setup: 'Setup & Gestão',
  settings: 'Configurações',
};
