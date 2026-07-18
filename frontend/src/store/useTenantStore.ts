import { create } from 'zustand';

// ==========================================
// LOADING DEFAULTS (sobrescrito pelo login/API)
// ==========================================
const INITIAL_HOTEL = {
  id: '',
  nome: 'Carregando...',
  razaoSocial: '',
  documentoFiscal: '',
  slug: '',
  logo: '',
  banner: '',
  cores: { primary: '#3b82f6', secondary: '#1e293b' },
  layout: { font: 'sans', heroVariant: 'standard' },
  webhooks: { onReservationComplete: '', onCheckIn: '' },
  localInfos: { checkInTime: '14:00', checkOutTime: '12:00', timezone: 'America/Sao_Paulo' }
};

const INITIAL_ROOM_CATEGORIES: any[] = [];
const INITIAL_ROOMS: any[] = [];
const INITIAL_GUESTS: any[] = [];
const INITIAL_RESERVATIONS: any[] = [];
const INITIAL_INVENTORY: any[] = [];
const INITIAL_AUDITS: any[] = [];
const INITIAL_MAINTENANCE: any[] = [];
const INITIAL_USERS: any[] = [];
const INITIAL_BRANCHES: any[] = [];
const INITIAL_CLEANING_TASKS: any[] = [];
const INITIAL_EXPENSES: any[] = [];

interface TenantState {
  user: any;
  isOffline: boolean;
  selectedBranchId: string;
  hotel: any;
  branches: any[];
  users: any[];
  roomCategories: any[];
  rooms: any[];
  reservations: any[];
  guests: any[];
  inventory: any[];
  audits: any[];
  maintenance: any[];
  cleaningTasks: any[];
  expenses: any[];

  // Actions
  setUser: (user: any) => void;
  setIsOffline: (status: boolean) => void;
  setSelectedBranchId: (id: string) => void;
  setHotel: (hotel: any) => void;
  setBranches: (branches: any[]) => void;
  setHotelColors: (colors: { primary: string; secondary: string }) => void;
  setHotelLayout: (layout: { font: string; heroVariant: string }) => void;

  // Hoteleiras
  addUser: (user: any) => void;
  updateUserStatus: (userId: string, status: string) => void;
  addRoomCategory: (cat: any) => void;
  updateRoomCategoryPhotos: (catId: string, fotos: string[]) => void;
  addRoom: (room: any) => void;
  addReservation: (res: any) => void;
  updateReservationStatus: (resId: string, status: string, roomId?: string | null, doc?: string) => void;
  updateReservation: (resId: string, data: any) => void;
  updateRoomStatus: (roomId: string, status: string) => void;
  addConsumptionToRes: (resId: string, item: any, qty: number) => void;
  addPaymentToRes: (resId: string, payment: any) => void;
  addAuditLog: (log: any) => void;
  addMaintenanceOrder: (order: any) => void;
  completeMaintenanceOrder: (maintId: string) => void;
  addCleaningTask: (task: any) => void;
  updateCleaningTaskStatus: (taskId: string, status: string) => void;

  // Financeiro
  addExpense: (exp: any) => void;
  updateExpenseStatus: (id: string, status: string) => void;

  // Hospedes
  addGuest: (guest: any) => void;
  updateGuest: (guestId: string, data: any) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  user: null,
  isOffline: false, // Será setado como true se houver falha de conexão
  selectedBranchId: '',
  hotel: INITIAL_HOTEL,
  branches: INITIAL_BRANCHES,
  users: INITIAL_USERS,
  roomCategories: INITIAL_ROOM_CATEGORIES,
  rooms: INITIAL_ROOMS,
  reservations: INITIAL_RESERVATIONS,
  guests: INITIAL_GUESTS,
  inventory: INITIAL_INVENTORY,
  audits: INITIAL_AUDITS,
  maintenance: INITIAL_MAINTENANCE,
  cleaningTasks: INITIAL_CLEANING_TASKS,
  expenses: INITIAL_EXPENSES,

  setUser: (user) => set({ user }),
  setIsOffline: (isOffline) => set({ isOffline }),
  setSelectedBranchId: (selectedBranchId) => set({ selectedBranchId }),
  setHotel: (hotel) => set((state) => ({ hotel: { ...state.hotel, ...hotel } })),
  setBranches: (branches) => set({ branches }),
  setHotelColors: (cores) => set((state) => ({ hotel: { ...state.hotel, cores } })),
  setHotelLayout: (layout) => set((state) => ({ hotel: { ...state.hotel, layout } })),

  addUser: (newUser) => set((state) => ({ users: [...state.users, { ...newUser, branchId: state.selectedBranchId }] })),
  updateUserStatus: (userId, status) => set((state) => ({
    users: state.users.map((u) => u.id === userId ? { ...u, status } : u)
  })),

  addGuest: (guest) => set((state) => ({ guests: [{ ...guest }, ...state.guests] })),
  updateGuest: (guestId, data) => set((state) => ({
    guests: state.guests.map(g => g.id === guestId ? { ...g, ...data } : g)
  })),

  addRoomCategory: (cat) => set((state) => ({ roomCategories: [...state.roomCategories, { ...cat, fotos: cat.fotos || [], branchId: state.selectedBranchId }] })),
  updateRoomCategoryPhotos: (catId, fotos) => set((state) => ({
    roomCategories: state.roomCategories.map((c) => c.id === catId ? { ...c, fotos } : c)
  })),
  addRoom: (room) => set((state) => ({ rooms: [...state.rooms, { ...room, branchId: state.selectedBranchId }] })),

  addReservation: (newRes) => set((state) => ({
    reservations: [...state.reservations, { ...newRes, branchId: state.selectedBranchId }]
  })),

  updateReservationStatus: (resId, status, roomId = null, doc) => set((state) => ({
    reservations: state.reservations.map((res) => {
      if (res.id === resId) {
        const updated: any = { ...res, status };
        if (roomId !== null) updated.roomId = roomId;
        if (doc !== undefined) updated.documentoCheckIn = doc;
        if (status === 'HOSPEDADO') updated.checkInAt = new Date().toISOString();
        if (status === 'CHECK_OUT_REALIZADO') updated.checkOutAt = new Date().toISOString();
        return updated;
      }
      return res;
    })
  })),

  updateReservation: (resId, data) => set((state) => ({
    reservations: state.reservations.map((res) => {
      if (res.id === resId) {
        return { ...res, ...data };
      }
      return res;
    })
  })),

  updateRoomStatus: (roomId, status) => set((state) => ({
    rooms: state.rooms.map((r) => r.id === roomId ? { ...r, status } : r)
  })),

  addConsumptionToRes: (resId, item, qty) => set((state) => {
    const valorUnitario = item.valorVenda;
    const valorTotalConsumo = valorUnitario * qty;

    const newCons = {
      id: 'c_' + Date.now(),
      descricao: `${qty}x ${item.nome}`,
      quantidade: qty,
      valorUnitario,
      valorTotal: valorTotalConsumo
    };

    return {
      inventory: state.inventory.map((i) => i.id === item.id ? { ...i, quantidade: i.quantidade - qty } : i),
      reservations: state.reservations.map((res) => {
        if (res.id === resId) {
          return {
            ...res,
            valorTotal: res.valorTotal + valorTotalConsumo,
            consumptions: [...(res.consumptions || []), newCons]
          };
        }
        return res;
      })
    };
  }),

  addPaymentToRes: (resId, payment) => set((state) => ({
    reservations: state.reservations.map((res) => {
      if (res.id === resId) {
        return {
          ...res,
          payments: [...(res.payments || []), payment]
        };
      }
      return res;
    })
  })),

  addAuditLog: (log) => set((state) => ({
    audits: [{ ...log, branchId: state.selectedBranchId }, ...state.audits]
  })),

  addMaintenanceOrder: (order) => set((state) => ({
    maintenance: [...state.maintenance, { ...order, branchId: state.selectedBranchId }],
    rooms: state.rooms.map((r) => r.numero === order.roomNumero && r.branchId === state.selectedBranchId ? { ...r, status: 'MANUTENCAO' } : r)
  })),

  completeMaintenanceOrder: (maintId) => set((state) => {
    const order = state.maintenance.find((m) => m.id === maintId);
    if (!order) return {};

    return {
      maintenance: state.maintenance.filter((m) => m.id !== maintId),
      rooms: state.rooms.map((r) => r.numero === order.roomNumero && r.branchId === order.branchId ? { ...r, status: 'LIMPEZA' } : r)
    };
  }),

  addCleaningTask: (task) => set((state) => ({ cleaningTasks: [...state.cleaningTasks, { ...task, branchId: state.selectedBranchId }] })),
  updateCleaningTaskStatus: (taskId, status) => set((state) => ({
    cleaningTasks: state.cleaningTasks.map((t) => t.id === taskId ? { ...t, status } : t)
  })),

  addExpense: (exp) => set((state) => ({ expenses: [...state.expenses, { ...exp, branchId: state.selectedBranchId }] })),
  updateExpenseStatus: (id, status) => set((state) => ({
    expenses: state.expenses.map(e => e.id === id ? { ...e, status } : e)
  }))
}));

// Smart Hook for Branch Segregation
// Esse hook garante que qualquer painel (exceto o de Hóspedes puros) veja SOMENTE os dados da filial ativa.
export const useActiveBranchData = () => {
  const store = useTenantStore();
  const bid = store.selectedBranchId;

  return {
    ...store,
    users: store.users.filter(u => u.branchId === bid || u.role === 'HOTEL_OWNER'), // Dono vê tudo
    roomCategories: store.roomCategories.filter(c => c.branchId === bid),
    rooms: store.rooms.filter(r => r.branchId === bid),
    reservations: store.reservations.filter(r => r.branchId === bid),
    inventory: store.inventory.filter(i => i.branchId === bid),
    audits: store.audits.filter(a => a.branchId === bid),
    maintenance: store.maintenance.filter(m => m.branchId === bid),
    cleaningTasks: store.cleaningTasks.filter(ct => ct.branchId === bid),
    expenses: store.expenses.filter(e => e.branchId === bid),
    // guests are shared globally, so we don't filter them
    guests: store.guests
  };
};
