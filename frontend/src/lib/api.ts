import { useTenantStore } from '../store/useTenantStore';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Utilitário de requisição unificado com suporte a injeção automática de headers e fallback offline
 */
export async function request(path: string, options: RequestInit = {}) {
  const store = useTenantStore.getState();

  // Obter token do localStorage ou cookies
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Injetar headers padrão
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Injetar headers de Isolamento Multi-Tenant
  if (store.user?.hotelId) {
    headers.set('x-hotel-id', store.user.hotelId);
  }
  if (store.user?.branchId) {
    headers.set('x-branch-id', store.user.branchId);
  }

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      ...options,
      headers,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      let errMsg = errData.error || errData.message || 'Falha na requisição à API.';
      if (typeof errMsg !== 'string') {
        errMsg = JSON.stringify(errMsg);
      }
      throw new Error(errMsg);
    }

    if (store.isOffline) {
      useTenantStore.setState({ isOffline: false });
    }

    return await res.json();
  } catch (err: any) {
    console.warn(`[API FETCH ERROR] Falha ao conectar na rota: ${path}`, err);
    if (typeof window !== 'undefined') {
      toast.error(err.message || 'Erro de conexão com o servidor.');
    }
    throw err;
  }
}

export const api = {
  /**
   * Autenticação corporativa
   */
  async login(email: string, password: string) {
    const store = useTenantStore.getState();
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Salvar token e atualizar usuário
    localStorage.setItem('token', res.access_token);
    if (typeof window !== 'undefined') {
      document.cookie = `token=${res.access_token}; path=/; max-age=86400; SameSite=Lax`;
    }
    store.setUser(res.user);
    if (res.user.hotel) {
      store.setHotel(res.user.hotel);
    }
    if (res.user.branch) {
      store.setBranches([res.user.branch]);
      store.setSelectedBranchId(res.user.branch.id);
    }
    return res;
  },

  /**
   * Buscar quartos físicos
   */
  async getRooms() {
    const res = await request('/rooms');
    useTenantStore.setState({ rooms: res });
    return res;
  },

  /**
   * Buscar Categorias de Quartos
   */
  async getRoomCategories() {
    const res = await request('/rooms/categories');
    useTenantStore.setState({ roomCategories: res });
    return res;
  },

  /**
   * Buscar reservas ativas
   */
  async getReservations() {
    const res = await request('/reservations');
    useTenantStore.setState({ reservations: res });
    return res;
  },

  /**
   * Buscar Hóspedes (CRM)
   */
  async getGuests() {
    const res = await request('/guests');
    useTenantStore.setState({ guests: res });
    return res;
  },

  /**
   * Buscar Auditorias
   */
  async getAudits() {
    const res = await request('/audit');
    useTenantStore.setState({ audits: res });
    return res;
  },

  /**
   * Buscar Manutenções
   */
  async getMaintenanceOrders() {
    const res = await request('/maintenance');
    useTenantStore.setState({ maintenance: res });
    return res;
  },

  /**
   * Buscar Inventário
   */
  async getInventory() {
    const res = await request('/inventory');
    useTenantStore.setState({ inventory: res });
    return res;
  },

  /**
   * Realizar Check-in manual
   */
  async checkIn(reservationId: string, documentoCheckIn: string, roomId?: string) {
    const res = await request(`/reservations/${reservationId}/check-in`, {
      method: 'POST',
      body: JSON.stringify({ documentoCheckIn, roomId }),
    });

    await this.getRooms();
    await this.getReservations();
    return res;
  },

  /**
   * Lançar Consumo
   */
  async addConsumption(reservationId: string, itemId: string, quantidade: number) {
    const res = await request(`/reservations/${reservationId}/consumption`, {
      method: 'POST',
      body: JSON.stringify({ itemId, quantidade }),
    });

    await this.getReservations();
    return res;
  },

  /**
   * Realizar Check-out
   */
  async checkOut(reservationId: string) {
    const res = await request(`/reservations/${reservationId}/check-out`, {
      method: 'POST',
    });

    await this.getRooms();
    await this.getReservations();
    return res;
  },

  /**
   * Registrar pagamento manual (PIX, Cartão, Dinheiro) sem gateway
   */
  async recordManualPayment(reservationId: string, valor: number, metodo: string) {
    const res = await request(`/reservations/${reservationId}/manual-payment`, {
      method: 'POST',
      body: JSON.stringify({ valor, metodo }),
    });

    await this.getReservations();
    return res;
  },

  /**
   * Completar pré-check-in do hóspede (envio de documento)
   */
  async completePreCheckIn(guestToken: string, documentoCheckIn: string) {
    return await request(`/reservations/${guestToken}/pre-check-in`, {
      method: 'POST',
      body: JSON.stringify({ documentoCheckIn }),
    });
  },

  /**
   * Abrir Manutenção de Quarto
   */
  async createMaintenance(roomId: string, descricao: string) {
    const res = await request('/maintenance', {
      method: 'POST',
      body: JSON.stringify({ roomId, descricao }),
    });

    await this.getRooms();
    return res;
  },

  /**
   * Concluir Manutenção
   */
  async completeMaintenance(maintenanceId: string, observacoes: string) {
    const res = await request(`/maintenance/${maintenanceId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ observacoes }),
    });

    await this.getRooms();
    return res;
  },

  /**
   * Finalizar limpeza (Housekeeping)
   */
  async completeCleaning(roomId: string) {
    const res = await request(`/rooms/${roomId}/cleaning-complete`, {
      method: 'POST',
    });

    await this.getRooms();
    return res;
  },

  // ================= CRUD / EDIT & DELETE =================

  async createRoomCategory(data: any) {
    const res = await request('/rooms/categories', { method: 'POST', body: JSON.stringify(data) });
    await this.getRoomCategories();
    return res;
  },

  async updateRoomCategory(id: string, data: any) {
    const res = await request(`/rooms/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    await this.getRoomCategories();
    return res;
  },

  async createRoom(data: any) {
    const res = await request('/rooms', { method: 'POST', body: JSON.stringify(data) });
    await this.getRooms();
    return res;
  },

  async updateRoom(id: string, data: any) {
    const res = await request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    await this.getRooms();
    return res;
  },
  async deleteRoom(id: string) {
    const res = await request(`/rooms/${id}`, { method: 'DELETE' });
    await this.getRooms();
    return res;
  },

  async updateGuest(id: string, data: any) {
    const res = await request(`/guests/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    await this.getGuests();
    return res;
  },
  async deleteGuest(id: string) {
    const res = await request(`/guests/${id}`, { method: 'DELETE' });
    await this.getGuests();
    return res;
  },

  async updateReservation(id: string, data: any) {
    const res = await request(`/reservations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    await this.getReservations();
    return res;
  },
  async deleteReservation(id: string) {
    const res = await request(`/reservations/${id}`, { method: 'DELETE' });
    await this.getReservations();
    return res;
  },

  async createInventoryItem(data: any) {
    const res = await request('/inventory', { method: 'POST', body: JSON.stringify(data) });
    await this.getInventory();
    return res;
  },

  async updateInventoryItem(id: string, data: any) {
    const res = await request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    await this.getInventory();
    return res;
  },
  async deleteInventoryItem(id: string) {
    const res = await request(`/inventory/${id}`, { method: 'DELETE' });
    await this.getInventory();
    return res;
  },

  async updateMaintenance(id: string, data: any) {
    const res = await request(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    await this.getMaintenanceOrders();
    return res;
  },
  async deleteMaintenance(id: string) {
    const res = await request(`/maintenance/${id}`, { method: 'DELETE' });
    await this.getMaintenanceOrders();
    return res;
  },

  async getTeam() {
    const res = await request('/auth/team');
    useTenantStore.setState({ users: res });
    return res;
  },

  async register(data: any) {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res;
  },

  async forgotPassword(email: string) {
    const res = await request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return res;
  },

  async resetPassword(email: string, token: string, password: string) {
    const res = await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, password }),
    });
    return res;
  },

  async createTeamMember(data: any) {
    const res = await request('/auth/team', { method: 'POST', body: JSON.stringify(data) });
    return res;
  },

  async updateTeamMemberStatus(id: string, status: string) {
    const res = await request(`/auth/team/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
    return res;
  },

  async updateTeamMember(id: string, data: any) {
    const res = await request(`/auth/team/${id}`, { method: 'POST', body: JSON.stringify(data) });
    return res;
  },

  async updateTenantSettings(data: any) {
    const res = await request('/core/tenants/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const store = useTenantStore.getState();
    if (res && res.id) {
      store.setHotel(res);
    }
    return res;
  },

  /**
   * Buscar Logs Globais (Super Admin)
   */
  async getSuperAdminLogs(tenantId?: string) {
    const query = tenantId ? `?tenantId=${tenantId}` : '';
    return await request(`/audit${query}`);
  },

  /**
   * Super Admin Impersonation
   */
  async impersonate(tenantId: string) {
    const res = await request(`/auth/impersonate/${tenantId}`, {
      method: 'POST'
    });
    // Atualiza token local para o token impersonated
    localStorage.setItem('token', res.access_token);
    if (typeof window !== 'undefined') {
      document.cookie = `token=${res.access_token}; path=/; max-age=86400; SameSite=Lax`;
    }
    const store = useTenantStore.getState();
    store.setUser(res.user);
    if (res.user.hotel) {
      store.setHotel(res.user.hotel);
    }
    if (res.user.branch) {
      store.setBranches([res.user.branch]);
      store.setSelectedBranchId(res.user.branch.id);
    }
    return res;
  },

  /**
   * Super Admin Metrics & Health
   */
  async getHealth() {
    return await request('/core/health');
  },

  async getGlobalMaintenance() {
    return await request('/core/broadcast/maintenance');
  },

  async setGlobalMaintenance(maintenanceMode: boolean) {
    return await request('/core/broadcast/maintenance', {
      method: 'PUT',
      body: JSON.stringify({ maintenanceMode }),
    });
  },

  // ================= ANNOUNCEMENTS =================
  async getAnnouncements() {
    return await request('/core/broadcast/announcements');
  },

  async createAnnouncement(data: any) {
    return await request('/core/broadcast/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAnnouncement(id: string, data: any) {
    return await request(`/core/broadcast/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAnnouncement(id: string) {
    return await request(`/core/broadcast/announcements/${id}`, {
      method: 'DELETE',
    });
  },

  async getWebhookLogs() {
    return await request('/webhooks/logs');
  },

  async getInvoices() {
    return await request('/core/invoices');
  },

  async simulatePayment(invoiceId: string) {
    return await request(`/core/invoices/${invoiceId}/simulate-payment`, {
      method: 'POST',
    });
  },

  async getTenantMetrics(tenantId: string) {
    return await request(`/core/tenant-metrics/${tenantId}`);
  },

  /**
   * Super Admin Tenants (Hotels as Sistema Clients)
   */
  async getTenants() {
    return await request('/core/tenants');
  },

  async createTenant(data: any) {
    return await request('/core/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTenant(id: string, data: any) {
    return await request(`/core/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteTenant(id: string, password: string) {
    return await request(`/core/tenants/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  },

  async updateTenantStatus(id: string, status: string) {
    return await request(`/core/tenants/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async updateTenantModules(id: string, enabledModules: string[]) {
    return await request(`/core/tenants/${id}/modules`, {
      method: 'PUT',
      body: JSON.stringify({ enabledModules }),
    });
  },

  // ================= SYSTEM PLANS =================
  async getSystemPlans() {
    return await request('/core/plans');
  },

  async createSystemPlan(data: any) {
    return await request('/core/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSystemPlan(id: string, data: any) {
    return await request(`/core/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteSystemPlan(id: string) {
    return await request(`/core/plans/${id}`, {
      method: 'DELETE',
    });
  },

  // ================= FEATURE FLAGS =================
  async getFeatureFlags() {
    return await request('/core/feature-flags');
  },

  async createFeatureFlag(data: any) {
    return await request('/core/feature-flags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateFeatureFlag(id: string, data: any) {
    return await request(`/core/feature-flags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteFeatureFlag(id: string) {
    return await request(`/core/feature-flags/${id}`, {
      method: 'DELETE',
    });
  },

  // ================= INTEGRAÇÕES =================

  async getIntegrationSettings() {
    return await request('/integrations');
  },

  async updateGooglePlaceId(placeId: string, apiKey: string) {
    return await request('/integrations/google', {
      method: 'POST',
      body: JSON.stringify({ placeId, apiKey }),
    });
  },

  async updateWhatsappAPI(data: { whatsappApiUrl: string, whatsappToken: string, whatsappNumber: string }) {
    return await request('/integrations/whatsapp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePaymentGatewayAPI(data: { provider: string, token: string, publicKey: string }) {
    return await request('/integrations/payment-gateway', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getIcalSettings() {
    return await request('/ical/settings');
  },

  async saveIcalSettings(data: { roomId: string; importUrls: string[] }) {
    return await request('/ical/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async syncIcal(id: string) {
    return await request(`/ical/sync/${id}`, { method: 'POST' });
  },

  async getGoogleReviews(hotelId: string) {
    // This is a public route, so it doesn't need AuthGuard
    return await request(`/integrations/google-reviews/${hotelId}`);
  },

  async getSystemLogs() {
    return await request('/core/tenants/system-logs');
  },

  // ================= GLOBAL SETTINGS (Super Admin) =================

  async getPublicGlobalSettings() {
    return await request('/core/global-settings/public');
  },

  async getGlobalSettings() {
    return await request('/core/global-settings');
  },

  async updateGlobalSettings(data: any) {
    return await request('/core/global-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // ================= HOUSEKEEPING (Tarefas de Limpeza) =================

  async getCleaningTasks() {
    const res = await request('/housekeeping');
    // Mapeia campos do backend para o formato do frontend
    const mapped = (res || []).map((t: any) => ({
      id: t.id,
      roomId: t.roomId,
      status: t.status,
      tipoLimpeza: t.tipoLimpeza,
      observacoes: t.observacoes,
      responsavelId: t.responsavelId,
      iniciadaEm: t.iniciadaEm,
      finalizadaEm: t.finalizadaEm,
      branchId: t.room?.branchId,
      room: t.room,
      responsavel: t.responsavel,
    }));
    useTenantStore.setState({ cleaningTasks: mapped });
    return mapped;
  },

  async createCleaningTask(data: { roomId: string; tipoLimpeza: string; observacoes?: string; responsavelId?: string }) {
    const res = await request('/housekeeping', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await this.getCleaningTasks();
    return res;
  },

  async updateCleaningTaskStatus(id: string, status: string) {
    const res = await request(`/housekeeping/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await this.getCleaningTasks();
    return res;
  },

  async deleteCleaningTask(id: string) {
    const res = await request(`/housekeeping/${id}`, {
      method: 'DELETE',
    });
    await this.getCleaningTasks();
    return res;
  },

  // ================= EXPENSES (Despesas) =================

  async getExpenses() {
    const res = await request('/expenses');
    // Mapeia campos do backend (português) para o formato do frontend
    const mapped = (res || []).map((e: any) => ({
      id: e.id,
      description: e.descricao,
      amount: Number(e.valor),
      dueDate: e.dataVencimento ? new Date(e.dataVencimento).toISOString().split('T')[0] : '',
      status: e.status === 'PAGO' ? 'PAID' : e.status === 'PENDENTE' ? 'PENDING' : e.status,
      category: e.categoria,
      provider: e.fornecedor,
      paymentDate: e.dataPagamento,
      branchId: e.branchId,
    }));
    useTenantStore.setState({ expenses: mapped });
    return mapped;
  },

  async createExpense(data: { descricao: string; valor: number; dataVencimento: string; categoria: string; fornecedor?: string }) {
    const res = await request('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await this.getExpenses();
    return res;
  },

  async updateExpense(id: string, data: any) {
    const res = await request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    await this.getExpenses();
    return res;
  },

  async updateExpenseStatus(id: string, status: string) {
    // Mapeia status do frontend para o backend
    const backendStatus = status === 'PAID' ? 'PAGO' : status === 'PENDING' ? 'PENDENTE' : status;
    const res = await request(`/expenses/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: backendStatus }),
    });
    await this.getExpenses();
    return res;
  },

  async deleteExpense(id: string) {
    const res = await request(`/expenses/${id}`, {
      method: 'DELETE',
    });
    await this.getExpenses();
    return res;
  },

  // ================= BILLING / ASSINATURA =================

  /** Gera fatura manualmente para um hotel (Super Admin) */
  async generateInvoice(hotelId: string) {
    return await request(`/core/billing/invoices/generate/${hotelId}`, { method: 'POST' });
  },

  /** Gera faturas para todos os hotéis (Super Admin) */
  async generateAllInvoices() {
    return await request('/core/billing/invoices/generate-all', { method: 'POST' });
  },

  /** Cobrar fatura via gateway (Super Admin) */
  async payInvoice(invoiceId: string) {
    return await request(`/core/billing/invoices/${invoiceId}/pay`, { method: 'POST' });
  },

  /** Confirmar pagamento manual (Super Admin) */
  async confirmInvoicePayment(invoiceId: string, gatewayId?: string, method?: string) {
    return await request(`/core/billing/invoices/${invoiceId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ gatewayId, method }),
    });
  },

  /** Sincronizar pagamentos pendentes com gateway (Super Admin) */
  async syncBillingPayments() {
    return await request('/core/billing/sync-payments', { method: 'POST' });
  },

  /** Mudar de plano (upgrade/downgrade) */
  async changePlan(plan: string) {
    return await request('/core/billing/change-plan', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  },

  /** Mudar plano de qualquer hotel (Super Admin) */
  async changeTenantPlan(hotelId: string, plan: string) {
    return await request(`/core/billing/change-plan/${hotelId}`, {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  },

  /** Listar add-ons disponíveis */
  async listAddons() {
    return await request('/core/billing/addons');
  },

  /** Listar add-ons contratados pelo hotel */
  async getHotelAddons() {
    return await request('/core/billing/addons/hotel');
  },

  /** Ativar add-on */
  async activateAddon(addonId: string) {
    return await request('/core/billing/addons/activate', {
      method: 'POST',
      body: JSON.stringify({ addonId }),
    });
  },

  /** Desativar add-on */
  async deactivateAddon(addonId: string) {
    return await request('/core/billing/addons/deactivate', {
      method: 'POST',
      body: JSON.stringify({ addonId }),
    });
  },

  /** Listar todos add-ons (Super Admin) */
  async getAllAddons() {
    return await request('/core/billing/addons/manage');
  },

  /** Criar add-on (Super Admin) */
  async createAddon(data: { name: string; description?: string; price: number; moduleKey: string }) {
    return await request('/core/billing/addons/manage', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** Atualizar add-on (Super Admin) */
  async updateAddon(id: string, data: any) {
    return await request(`/core/billing/addons/manage/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /** Validar cupom */
  async validateCoupon(code: string, plan?: string) {
    const query = plan ? `?plan=${plan}` : '';
    return await request(`/core/billing/coupons/validate/${code}${query}`);
  },

  /** Métricas MRR (Super Admin) */
  async getMrrMetrics() {
    return await request('/core/billing/metrics/mrr');
  },

  /** Logs de faturamento (Super Admin) */
  async getBillingLogs(hotelId?: string) {
    const query = hotelId ? `?hotelId=${hotelId}` : '';
    return await request(`/core/billing/logs${query}`);
  },

  /** Iniciar trial para hotel (Super Admin) */
  async startTrial(hotelId: string, days: number = 14) {
    return await request(`/core/billing/trial/start/${hotelId}?days=${days}`, { method: 'POST' });
  },

  /** Processar trials expirados (Super Admin) */
  async processExpiredTrials() {
    return await request('/core/billing/trial/process-expired', { method: 'POST' });
  },

  /** Ativar add-on em hotel via admin */
  async adminActivateAddon(hotelId: string, addonId: string) {
    return await request(`/core/billing/addons/admin/${hotelId}/activate`, {
      method: 'POST',
      body: JSON.stringify({ addonId }),
    });
  },

  /** Desativar add-on em hotel via admin */
  async adminDeactivateAddon(hotelId: string, addonId: string) {
    return await request(`/core/billing/addons/admin/${hotelId}/deactivate`, {
      method: 'POST',
      body: JSON.stringify({ addonId }),
    });
  },
};
