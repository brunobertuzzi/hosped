import axios from 'axios';
import { prisma } from '../utils/prisma';
import * as bcrypt from 'bcrypt';

const API_URL = 'http://localhost:3001';
const hashedPassword = bcrypt.hashSync('password123', 10);

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

async function cleanup(name: string) {
  await prisma.tariff.deleteMany({ where: { hotel: { nome: name } } });
  await prisma.season.deleteMany({ where: { hotel: { nome: name } } });
  await prisma.payment.deleteMany({ where: { hotel: { nome: name } } });
  await prisma.reservation.deleteMany({ where: { hotel: { nome: name } } });
  await prisma.room.deleteMany({ where: { hotel: { nome: name } } });
  await prisma.roomCategory.deleteMany({ where: { hotel: { nome: name } } });
  await prisma.user.deleteMany({ where: { hotel: { nome: name } } });
  await prisma.branch.deleteMany({ where: { hotel: { nome: name } } });
  await prisma.hotel.deleteMany({ where: { nome: name } });
}

describe('Real-World Scenario E2E Tests', () => {
  let hotelId: string;
  let branchId: string;
  let categoryId: string;
  let token: string;

  beforeAll(async () => {
    await cleanup('E2E RealWorld Hotel');
    await cleanup('Sister Hotel');

    const h = await prisma.hotel.create({
      data: {
        nome: 'E2E RealWorld Hotel',
        razaoSocial: 'E2E RealWorld Hotel LTDA',
        documentoFiscal: '00.000.000/0008-H8',
        email: 'realworld@e2erw.com',
        telefone: '11999999998',
        endereco: 'Rua Real, 123',
        plan: 'STARTUP',
        status: 'ACTIVE',
        diferenciais: [],
      },
    });
    hotelId = h.id;

    const b = await prisma.branch.create({
      data: {
        hotelId,
        nome: 'RealWorld Branch',
        endereco: 'Rua Real, 123',
        cidade: 'Sao Paulo',
        estado: 'SP',
        telefone: '11999999998',
        email: 'branch@e2erw.com',
      },
    });
    branchId = b.id;

    await prisma.user.create({
      data: {
        hotelId,
        branchId,
        nome: 'RealWorld User',
        email: 'user@e2erw.com',
        password: hashedPassword,
        role: 'HOTEL_OWNER',
        permissions: ['*'],
      },
    });

    const cat = await prisma.roomCategory.create({
      data: {
        hotelId,
        nome: 'Standard Suite',
        capacidadeMaxima: 2,
        valorBase: 180.0,
      },
    });
    categoryId = cat.id;

    for (let i = 1; i <= 5; i++) {
      await prisma.room.create({
        data: { hotelId, branchId, categoryId: cat.id, numero: `RW10${i}` },
      });
    }

    token = await loginWithRetry('user@e2erw.com', 'password123');
  });

  afterAll(async () => {
    await cleanup('E2E RealWorld Hotel');
    await cleanup('Sister Hotel');
  });

  beforeEach(async () => {
    await prisma.payment.deleteMany({ where: { hotelId } });
    await prisma.reservation.deleteMany({ where: { hotelId } });
    await prisma.room.updateMany({
      where: { hotelId },
      data: { status: 'DISPONIVEL' },
    });
    await prisma.tariff.deleteMany({ where: { hotelId } });
    await prisma.season.deleteMany({ where: { hotelId } });
  });

  const book = (data: any) =>
    axios.post(`${API_URL}/reservations`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });

  it('1. Full booking flow: guest books a room during high season, pays via PIX, and reservation is confirmed', async () => {
    const s = await prisma.season.create({
      data: {
        hotelId,
        nome: 'Réveillon',
        dataInicio: '2026-12-28T00:00:00.000Z',
        dataFim: '2027-01-03T23:59:59.000Z',
      },
    });
    await prisma.tariff.create({
      data: {
        hotelId,
        seasonId: s.id,
        categoryId,
        valor: 350.0,
        minimoNoites: 3,
      },
    });
    const res = await book({
      guestName: 'Réveillon Guest',
      guestDocument: '12345678901',
      guestEmail: 'reveillon@guest.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-12-28T14:00:00.000Z',
      dataCheckOut: '2027-01-02T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(res.status).toBe(201);
    expect(res.data.status).toBe('PENDENTE');
    expect(res.data.valorTotal).toBe('1750');
    const pay = await axios.post(
      `${API_URL}/payments/pix`,
      {
        reservationId: res.data.id,
        amount: 1750.0,
        email: 'reveillon@guest.com',
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(pay.status).toBe(201);
    expect(pay.data.qr_code).toBeDefined();
  });

  it('2. Overbooking prevention during peak season: ensure no more bookings than available rooms are accepted', async () => {
    for (let i = 0; i < 5; i++) {
      const r = await book({
        guestName: `Peak Guest ${i + 1}`,
        guestDocument: `9999999900${i}`,
        guestEmail: `peak${i}@guest.com`,
        guestTelefone: '11988888888',
        categoryId,
        branchId,
        dataCheckIn: '2026-10-10T14:00:00.000Z',
        dataCheckOut: '2026-10-15T12:00:00.000Z',
        origem: 'ONLINE',
      });
      expect(r.status).toBe(201);
    }
    await expect(
      book({
        guestName: 'Peak Guest 6',
        guestDocument: '9999999906',
        guestEmail: 'peak6@guest.com',
        guestTelefone: '11988888888',
        categoryId,
        branchId,
        dataCheckIn: '2026-10-10T14:00:00.000Z',
        dataCheckOut: '2026-10-15T12:00:00.000Z',
        origem: 'ONLINE',
      }),
    ).rejects.toThrow();
  });

  it('3. Multi-tenant data isolation in a real-world hotel group: two hotels operate independently', async () => {
    const hB = await prisma.hotel.create({
      data: {
        nome: 'Sister Hotel',
        razaoSocial: 'Sister Hotel LTDA',
        documentoFiscal: '00.000.000/0099-I9',
        email: 'sister@e2erw.com',
        telefone: '11999999999',
        endereco: 'Rua Sister, 789',
        plan: 'STARTUP',
        status: 'ACTIVE',
        diferenciais: [],
      },
    });
    const hBId = hB.id;

    const bB = await prisma.branch.create({
      data: {
        hotelId: hBId,
        nome: 'Sister Branch',
        endereco: 'Rua Sister, 789',
        cidade: 'Sao Paulo',
        estado: 'SP',
        telefone: '11999999999',
        email: 'branch_sister@e2erw.com',
      },
    });
    const branchBId = bB.id;

    const catB = await prisma.roomCategory.create({
      data: {
        hotelId: hBId,
        nome: 'Sister Room',
        capacidadeMaxima: 2,
        valorBase: 200.0,
      },
    });
    const catBId = catB.id;

    await prisma.room.create({
      data: {
        hotelId: hBId,
        branchId: branchBId,
        categoryId: catBId,
        numero: 'SIS001',
      },
    });

    await prisma.user.create({
      data: {
        hotelId: hBId,
        branchId: branchBId,
        nome: 'Sister User',
        email: 'sister_user@e2erw.com',
        password: hashedPassword,
        role: 'HOTEL_OWNER',
        permissions: ['*'],
      },
    });

    const tokenS = await loginWithRetry('sister_user@e2erw.com', 'password123');

    const resA = await book({
      guestName: 'Hotel A Guest',
      guestDocument: '11122233344',
      guestEmail: 'hotela_guest@e2erw.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-11-10T14:00:00.000Z',
      dataCheckOut: '2026-11-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(resA.status).toBe(201);
    const resB = await axios.post(
      `${API_URL}/reservations`,
      {
        guestName: 'Hotel B Guest',
        guestDocument: '55566677788',
        guestEmail: 'hotelb_guest@e2erw.com',
        guestTelefone: '11988888888',
        categoryId: catBId,
        branchId: branchBId,
        dataCheckIn: '2026-11-10T14:00:00.000Z',
        dataCheckOut: '2026-11-15T12:00:00.000Z',
        origem: 'ONLINE',
      },
      { headers: { Authorization: `Bearer ${tokenS}` } },
    );
    expect(resB.status).toBe(201);
    const listA = await axios.get(`${API_URL}/reservations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listA.data.some((r: any) => r.id === resB.data.id)).toBe(false);

    await prisma.payment.deleteMany({ where: { hotelId: hBId } });
    await prisma.reservation.deleteMany({ where: { hotelId: hBId } });
    await prisma.room.deleteMany({ where: { hotelId: hBId } });
    await prisma.roomCategory.deleteMany({ where: { hotelId: hBId } });
    await prisma.user.deleteMany({ where: { hotelId: hBId } });
    await prisma.branch.deleteMany({ where: { hotelId: hBId } });
    await prisma.hotel.delete({ where: { id: hBId } });
  });

  it('4. Season change mid-stay: booking spanning two seasons uses correct nightly rates', async () => {
    const s1 = await prisma.season.create({
      data: {
        hotelId,
        nome: 'Low',
        dataInicio: '2026-06-01T00:00:00.000Z',
        dataFim: '2026-06-20T23:59:59.000Z',
      },
    });
    const s2 = await prisma.season.create({
      data: {
        hotelId,
        nome: 'High',
        dataInicio: '2026-06-21T00:00:00.000Z',
        dataFim: '2026-07-10T23:59:59.000Z',
      },
    });
    await prisma.tariff.create({
      data: {
        hotelId,
        seasonId: s1.id,
        categoryId,
        valor: 140.0,
        minimoNoites: 1,
      },
    });
    await prisma.tariff.create({
      data: {
        hotelId,
        seasonId: s2.id,
        categoryId,
        valor: 300.0,
        minimoNoites: 1,
      },
    });
    const res = await book({
      guestName: 'Span Seasons Guest',
      guestDocument: '99988877766',
      guestEmail: 'span@seasons.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-06-18T14:00:00.000Z',
      dataCheckOut: '2026-06-25T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(res.status).toBe(201);
    expect(Number(res.data.valorTotal)).toBeGreaterThanOrEqual(1480);
    expect(Number(res.data.valorTotal)).toBeLessThanOrEqual(2100);
  });

  it('5. Concurrent guests booking the last rooms: exactly one guest succeeds in peak contention', async () => {
    for (let i = 0; i < 4; i++) {
      await book({
        guestName: `Pre Guest ${i + 1}`,
        guestDocument: `1110000000${i}`,
        guestEmail: `preguest${i}@contention.com`,
        guestTelefone: '11988888888',
        categoryId,
        branchId,
        dataCheckIn: '2026-12-01T14:00:00.000Z',
        dataCheckOut: '2026-12-05T12:00:00.000Z',
        origem: 'ONLINE',
      });
    }
    const competitors = Array.from({ length: 3 }).map((_, i) =>
      book({
        guestName: `Last Room Guest ${i + 1}`,
        guestDocument: `222000000${i}`,
        guestEmail: `lastroom${i}@contention.com`,
        guestTelefone: '11988888888',
        categoryId,
        branchId,
        dataCheckIn: '2026-12-01T14:00:00.000Z',
        dataCheckOut: '2026-12-05T12:00:00.000Z',
        origem: 'ONLINE',
      }),
    );
    const results = await Promise.allSettled(competitors);
    expect(results.filter((r) => r.status === 'fulfilled').length).toBe(1);
    expect(results.filter((r) => r.status === 'rejected').length).toBe(2);
  });
});
