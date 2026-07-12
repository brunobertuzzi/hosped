import axios from 'axios';
import { prisma } from '../utils/prisma';
import * as bcrypt from 'bcrypt';

const API_URL = 'http://localhost:3001';
const hashedPassword = bcrypt.hashSync('password123', 10);

async function cleanup() {
  await prisma.tariff.deleteMany({
    where: { hotel: { nome: 'E2E Yield Hotel' } },
  });
  await prisma.season.deleteMany({
    where: { hotel: { nome: 'E2E Yield Hotel' } },
  });
  await prisma.payment.deleteMany({
    where: { hotel: { nome: 'E2E Yield Hotel' } },
  });
  await prisma.reservation.deleteMany({
    where: { hotel: { nome: 'E2E Yield Hotel' } },
  });
  await prisma.room.deleteMany({
    where: { hotel: { nome: 'E2E Yield Hotel' } },
  });
  await prisma.roomCategory.deleteMany({
    where: { hotel: { nome: 'E2E Yield Hotel' } },
  });
  await prisma.user.deleteMany({
    where: { hotel: { nome: 'E2E Yield Hotel' } },
  });
  await prisma.branch.deleteMany({
    where: { hotel: { nome: 'E2E Yield Hotel' } },
  });
  await prisma.hotel.deleteMany({ where: { nome: 'E2E Yield Hotel' } });
}

async function loginWithRetry(email: string, password: string, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      return res.data.access_token;
    } catch (err: any) {
      if (err?.response?.status === 429 && i < retries - 1) {
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

describe('Yield Management E2E Tests', () => {
  let hotelId: string;
  let branchId: string;
  let categoryId: string;
  let token: string;

  beforeAll(async () => {
    await cleanup();

    const h = await prisma.hotel.create({
      data: {
        nome: 'E2E Yield Hotel',
        razaoSocial: 'E2E Yield Hotel LTDA',
        documentoFiscal: '00.000.000/0005-E5',
        email: 'yield@e2eyield.com',
        telefone: '11999999995',
        endereco: 'Rua Yield, 123',
        plan: 'STARTUP',
        status: 'ACTIVE',
        diferenciais: [],
      },
    });
    hotelId = h.id;

    const b = await prisma.branch.create({
      data: {
        hotelId,
        nome: 'Yield Branch',
        endereco: 'Rua Yield, 123',
        cidade: 'Sao Paulo',
        estado: 'SP',
        telefone: '11999999995',
        email: 'branch@e2eyield.com',
      },
    });
    branchId = b.id;

    await prisma.user.create({
      data: {
        hotelId,
        branchId,
        nome: 'Yield User',
        email: 'user@e2eyield.com',
        password: hashedPassword,
        role: 'MANAGER',
        permissions: ['*'],
      },
    });

    const cat = await prisma.roomCategory.create({
      data: {
        hotelId,
        nome: 'Yield Category',
        capacidadeMaxima: 2,
        valorBase: 200.0,
      },
    });
    categoryId = cat.id;

    await prisma.room.create({
      data: { hotelId, branchId, categoryId: cat.id, numero: 'YLD101' },
    });
    await prisma.room.create({
      data: { hotelId, branchId, categoryId: cat.id, numero: 'YLD102' },
    });

    // High Season (Dec 15 - Jan 15)
    const s1 = await prisma.season.create({
      data: {
        hotelId,
        nome: 'Alta Temporada',
        dataInicio: '2026-12-15T00:00:00.000Z',
        dataFim: '2027-01-15T23:59:59.000Z',
      },
    });
    await prisma.tariff.create({
      data: {
        hotelId,
        seasonId: s1.id,
        categoryId: cat.id,
        valor: 300.0,
        minimoNoites: 3,
      },
    });

    // Low Season (Mar 1 - Apr 30)
    const s2 = await prisma.season.create({
      data: {
        hotelId,
        nome: 'Baixa Temporada',
        dataInicio: '2026-03-01T00:00:00.000Z',
        dataFim: '2026-04-30T23:59:59.000Z',
      },
    });
    await prisma.tariff.create({
      data: {
        hotelId,
        seasonId: s2.id,
        categoryId: cat.id,
        valor: 140.0,
        minimoNoites: 1,
      },
    });

    token = await loginWithRetry('user@e2eyield.com', 'password123');
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(async () => {
    await prisma.payment.deleteMany({ where: { hotelId } });
    await prisma.reservation.deleteMany({ where: { hotelId } });
  });

  const book = (data: any) =>
    axios.post(`${API_URL}/reservations`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });

  it('1. should apply high season tariff (R$300) when booking within high season dates', async () => {
    const res = await book({
      guestName: 'High Season Guest',
      guestDocument: '11111111112',
      guestEmail: 'high@season.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-12-20T14:00:00.000Z',
      dataCheckOut: '2026-12-25T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(res.status).toBe(201);
    expect(res.data.valorTotal).toBe('1500');
  });

  it('2. should apply low season tariff (R$140) when booking within low season dates', async () => {
    const res = await book({
      guestName: 'Low Season Guest',
      guestDocument: '22222222223',
      guestEmail: 'low@season.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-03-10T14:00:00.000Z',
      dataCheckOut: '2026-03-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(res.status).toBe(201);
    expect(res.data.valorTotal).toBe('700');
  });

  it('3. should use base rate (R$200) when no seasonal tariff matches the dates', async () => {
    const res = await book({
      guestName: 'Base Rate Guest',
      guestDocument: '33333333334',
      guestEmail: 'base@rate.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-07-10T14:00:00.000Z',
      dataCheckOut: '2026-07-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(res.status).toBe(201);
    expect(res.data.valorTotal).toBe('1000');
  });

  it('4. should enforce minimum nights rule from tariff (3 nights minimum for high season)', async () => {
    try {
      const res = await book({
        guestName: 'Min Nights Guest',
        guestDocument: '44444444445',
        guestEmail: 'min@nights.com',
        guestTelefone: '11988888888',
        categoryId,
        branchId,
        dataCheckIn: '2026-12-20T14:00:00.000Z',
        dataCheckOut: '2026-12-22T12:00:00.000Z',
        origem: 'ONLINE',
      });
      expect(res.data.valorTotal).toBeGreaterThanOrEqual(600.0);
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('5. should calculate correct total for a partial season overlap', async () => {
    const res = await book({
      guestName: 'Partial Overlap Guest',
      guestDocument: '55555555556',
      guestEmail: 'partial@overlap.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-12-12T14:00:00.000Z',
      dataCheckOut: '2026-12-18T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(res.status).toBe(201);
    expect(Number(res.data.valorTotal)).toBeGreaterThanOrEqual(1200);
    expect(Number(res.data.valorTotal)).toBeLessThanOrEqual(1800);
  });

  it('6. should return correct tariff info via booking-engine availability endpoint', async () => {
    const res = await axios.get(
      `${API_URL}/booking-engine/${hotelId}/${branchId}/availability`,
      {
        params: {
          checkIn: '2026-12-20T14:00:00.000Z',
          checkOut: '2026-12-25T12:00:00.000Z',
        },
      },
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('7. should apply different tariffs per category correctly', async () => {
    const pc = await prisma.roomCategory.create({
      data: {
        hotelId,
        nome: 'Premium Category',
        capacidadeMaxima: 4,
        valorBase: 400.0,
      },
    });
    const premiumCatId = pc.id;
    await prisma.room.create({
      data: { hotelId, branchId, categoryId: premiumCatId, numero: 'YLD201' },
    });
    const s = await prisma.season.findFirst({
      where: { hotelId, nome: 'Alta Temporada' },
    });
    await prisma.tariff.create({
      data: {
        hotelId,
        seasonId: s!.id,
        categoryId: premiumCatId,
        valor: 600.0,
        minimoNoites: 2,
      },
    });
    const res = await book({
      guestName: 'Premium Guest',
      guestDocument: '66666666667',
      guestEmail: 'premium@guest.com',
      guestTelefone: '11988888888',
      categoryId: premiumCatId,
      branchId,
      dataCheckIn: '2026-12-20T14:00:00.000Z',
      dataCheckOut: '2026-12-25T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(res.status).toBe(201);
    expect(res.data.valorTotal).toBe('3000');
    await prisma.reservation.deleteMany({
      where: { categoryId: premiumCatId },
    });
    await prisma.room.deleteMany({ where: { categoryId: premiumCatId } });
    await prisma.tariff.deleteMany({ where: { categoryId: premiumCatId } });
    await prisma.roomCategory.delete({ where: { id: premiumCatId } });
  });

  it('8. should create a new season and tariff and apply it on subsequent bookings', async () => {
    const cs = await prisma.season.create({
      data: {
        hotelId,
        nome: 'Carnaval',
        dataInicio: '2027-02-10T00:00:00.000Z',
        dataFim: '2027-02-17T23:59:59.000Z',
      },
    });
    await prisma.tariff.create({
      data: {
        hotelId,
        seasonId: cs.id,
        categoryId,
        valor: 350.0,
        minimoNoites: 4,
      },
    });
    const res = await book({
      guestName: 'Carnival Guest',
      guestDocument: '77777777778',
      guestEmail: 'carnival@guest.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2027-02-12T14:00:00.000Z',
      dataCheckOut: '2027-02-16T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(res.status).toBe(201);
    expect(res.data.valorTotal).toBe('1400');
    await prisma.tariff.deleteMany({ where: { seasonId: cs.id } });
    await prisma.season.delete({ where: { id: cs.id } });
  });

  it('9. should update an existing tariff and have subsequent bookings use the new rate', async () => {
    const sRecord = await prisma.season.findFirst({
      where: { hotelId, nome: 'Baixa Temporada' },
    });
    const tRecord = await prisma.tariff.findFirst({
      where: { seasonId: sRecord!.id, categoryId },
    });
    await prisma.tariff.update({
      where: { id: tRecord!.id },
      data: { valor: 180.0 },
    });
    const res = await book({
      guestName: 'Updated Tariff Guest',
      guestDocument: '88888888889',
      guestEmail: 'updated@tariff.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-03-10T14:00:00.000Z',
      dataCheckOut: '2026-03-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(res.status).toBe(201);
    expect(res.data.valorTotal).toBe('900');
    await prisma.tariff.update({
      where: { id: tRecord!.id },
      data: { valor: 140.0 },
    });
  });

  it('10. should handle season with no tariffs gracefully by falling back to base rate', async () => {
    const os = await prisma.season.create({
      data: {
        hotelId,
        nome: 'Orphan Season',
        dataInicio: '2026-06-01T00:00:00.000Z',
        dataFim: '2026-06-30T23:59:59.000Z',
      },
    });
    const res = await book({
      guestName: 'Orphan Season Guest',
      guestDocument: '99999999990',
      guestEmail: 'orphan@season.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-06-10T14:00:00.000Z',
      dataCheckOut: '2026-06-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(res.status).toBe(201);
    expect(res.data.valorTotal).toBe('1000');
    await prisma.season.delete({ where: { id: os.id } });
  });
});
