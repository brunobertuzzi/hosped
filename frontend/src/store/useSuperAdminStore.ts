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

    addInvoice: (invoice) => set((state) => ({
      invoices: [invoice, ...state.invoices]
    })),

    processPayment: async (tenantId, method, cardLast4) => {
      // Simulate API call for payment gateway
      return new Promise(resolve => setTimeout(() => {
        set(state => ({
          sistemaClients: state.sistemaClients.map(c => 
            c.id === tenantId ? { ...c, cardLast4: cardLast4 || c.cardLast4, status: 'ACTIVE' } : c
          ),
          invoices: state.invoices.map(inv => 
            (inv.tenantId === tenantId && inv.status !== 'PAID') 
              ? { ...inv, status: 'PAID', paidAt: new Date().toISOString() } 
              : inv
          )
        }));
        resolve();
      }, 1500));
    }
  })
);
