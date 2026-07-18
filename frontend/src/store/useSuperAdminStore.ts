import { create } from 'zustand';

export type TenantPlan = 'STARTUP' | 'PRO' | 'ENTERPRISE';
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'CHURNED';

export interface SistemaClient {
  id: string;
  name: string;
  document: string;
  email: string;
  plan: TenantPlan;
  status: TenantStatus;
  mrr: number;
  createdAt: string;
  branchesCount: number;
  nextBillingDate?: string;
  cardLast4?: string;
  features?: string[];
  enabledModules?: string[];
  storageUsedMB?: number;
  storageLimitMB?: number;
  apiRequestsCount?: number;
  apiRequestsLimit?: number;
}

export interface SistemaInvoice {
  id: string;
  tenantId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  dueDate: string;
  paidAt?: string;
  paymentMethod: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
}

interface SuperAdminState {
  sistemaClients: SistemaClient[];
  invoices: SistemaInvoice[];
  fetchClients: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  addInvoice: (invoice: SistemaInvoice) => void;
  processPayment: (tenantId: string, method: 'PIX'|'CREDIT_CARD', cardLast4?: string) => Promise<void>;
}

export const useSuperAdminStore = create<SuperAdminState>()(
  (set, get) => ({
    sistemaClients: [],
    invoices: [],

    fetchClients: async () => {
      try {
        const { api } = await import('../lib/api');
        const clients = await api.getTenants();
        set({ sistemaClients: clients });
      } catch (err) {
        console.error("Falha ao buscar tenants", err);
      }
    },

    fetchInvoices: async () => {
      try {
        const { api } = await import('../lib/api');
        const invoices = await api.getInvoices();
        const mappedInvoices = invoices.map((inv: any) => ({
          id: inv.id,
          tenantId: inv.hotelId,
          amount: parseFloat(inv.amount),
          status: inv.status === 'PAGO' ? 'PAID' : inv.status === 'ATRASADO' ? 'OVERDUE' : 'PENDING',
          dueDate: inv.dueDate,
          paidAt: inv.paidAt,
          paymentMethod: 'CREDIT_CARD',
        }));
        set({ invoices: mappedInvoices });
      } catch (err) {
        console.error("Falha ao buscar faturas", err);
      }
    },

    addInvoice: (invoice) => set((state) => ({
      invoices: [invoice, ...state.invoices]
    })),

    processPayment: async (tenantId, method, cardLast4) => {
      try {
        const { api } = await import('../lib/api');
        // Find the pending invoice for this tenant
        const pendingInvoice = get().invoices.find(inv => inv.tenantId === tenantId && inv.status !== 'PAID');
        if (pendingInvoice) {
          await api.simulatePayment(pendingInvoice.id);
          get().fetchInvoices();
        }
      } catch (err) {
        console.error("Falha ao processar pagamento", err);
      }
    }
  })
);
