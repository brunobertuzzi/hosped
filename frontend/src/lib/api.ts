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
   * Realizar Checkout
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
    // Assuming getInventory() exists or state is managed differently
    return res;
  },
  async deleteInventoryItem(id: string) {
    const res = await request(`/inventory/${id}`, { method: 'DELETE' });
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

  async getWebhookLogs() {
    return await request('/webhooks/logs');
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

  // ================= INTEGRAÇÕES =================

  async getIntegrationSettings() {
    return await request('/integrations');
  },

  async updateGooglePlaceId(placeId: string) {
    return await request('/integrations/google', {
      method: 'POST',
      body: JSON.stringify({ placeId }),
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
  }
};
