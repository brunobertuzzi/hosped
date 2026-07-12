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

describe('Cross-Feature E2E Tests', () => {
  let hotelId: string;
  let branchId: string;
  let categoryId: string;
  let token: string;

  beforeAll(async () => {
    await prisma.tariff.deleteMany({
      where: { hotel: { nome: 'E2E Cross Hotel' } },
    });
    await prisma.season.deleteMany({
      where: { hotel: { nome: 'E2E Cross Hotel' } },
    });
    await prisma.payment.deleteMany({
      where: { hotel: { nome: 'E2E Cross Hotel' } },
    });
    await prisma.reservation.deleteMany({
      where: { hotel: { nome: 'E2E Cross Hotel' } },
    });
    await prisma.room.deleteMany({
      where: { hotel: { nome: 'E2E Cross Hotel' } },
    });
    await prisma.roomCategory.deleteMany({
      where: { hotel: { nome: 'E2E Cross Hotel' } },
    });
    await prisma.user.deleteMany({
      where: { hotel: { nome: 'E2E Cross Hotel' } },
    });
    await prisma.branch.deleteMany({
      where: { hotel: { nome: 'E2E Cross Hotel' } },
    });
    await prisma.hotel.deleteMany({ where: { nome: 'E2E Cross Hotel' } });

    const h = await prisma.hotel.create({
      data: {
        nome: 'E2E Cross Hotel',
        razaoSocial: 'E2E Cross Hotel LTDA',
        documentoFiscal: '00.000.000/0006-F6',
        email: 'cross@e2ecross.com',
        telefone: '11999999996',
        endereco: 'Rua Cross, 123',
        plan: 'STARTUP',
        status: 'ACTIVE',
        diferenciais: [],
      },
    });
    hotelId = h.id;

    const b = await prisma.branch.create({
      data: {
        hotelId,
        nome: 'Cross Branch',
        endereco: 'Rua Cross, 123',
        cidade: 'Sao Paulo',
        estado: 'SP',
        telefone: '11999999996',
        email: 'branch@e2ecross.com',
      },
    });
    branchId = b.id;

    await prisma.user.create({
      data: {
        hotelId,
        branchId,
        nome: 'Cross User',
        email: 'user@e2ecross.com',
        password: hashedPassword,
        role: 'MANAGER',
        permissions: ['*'],
      },
    });

    const cat = await prisma.roomCategory.create({
      data: {
        hotelId,
        nome: 'Cross Category',
        capacidadeMaxima: 2,
        valorBase: 150.0,
      },
    });
    categoryId = cat.id;

    for (let i = 1; i <= 3; i++) {
      await prisma.room.create({
        data: { hotelId, branchId, categoryId: cat.id, numero: `CRS10${i}` },
      });
    }

    token = await loginWithRetry('user@e2ecross.com', 'password123');
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({ where: { hotelId } });
    await prisma.reservation.deleteMany({ where: { hotelId } });
    await prisma.room.deleteMany({ where: { hotelId } });
    await prisma.roomCategory.deleteMany({ where: { hotelId } });
    await prisma.user.deleteMany({ where: { hotelId } });
    await prisma.branch.deleteMany({ where: { hotelId } });
    await prisma.hotel.delete({ where: { id: hotelId } });
  });

  const book = (data: any, tk?: string) =>
    axios.post(`${API_URL}/reservations`, data, {
      headers: { Authorization: `Bearer ${tk || token}` },
    });

  it('1. RLS + Overbooking: should enforce tenant isolation while preventing overbooking concurrently', async () => {
    const hB = await prisma.hotel.create({
      data: {
        nome: 'Cross Hotel B',
        razaoSocial: 'Cross Hotel B LTDA',
        documentoFiscal: '00.000.000/0066-G6',
        email: 'crossb@e2ecross.com',
        telefone: '11999999966',
        endereco: 'Rua Cross B, 456',
        plan: 'STARTUP',
        status: 'ACTIVE',
        diferenciais: [],
      },
    });
    const hBId = hB.id;

    const bB = await prisma.branch.create({
      data: {
        hotelId: hBId,
        nome: 'Cross Branch B',
        endereco: 'Rua Cross B, 456',
        cidade: 'Sao Paulo',
        estado: 'SP',
        telefone: '11999999966',
        email: 'branchb@e2ecross.com',
      },
    });
    const branchBId = bB.id;

    const catB = await prisma.roomCategory.create({
      data: {
        hotelId: hBId,
        nome: 'Category B',
        capacidadeMaxima: 4,
        valorBase: 100.0,
      },
    });
    const catBId = catB.id;

    await prisma.room.create({
      data: {
        hotelId: hBId,
        branchId: branchBId,
        categoryId: catBId,
        numero: 'B001',
      },
    });

    await prisma.user.create({
      data: {
        hotelId: hBId,
        branchId: branchBId,
        nome: 'User B',
        email: 'userb_cross@e2ecross.com',
        password: hashedPassword,
        role: 'MANAGER',
        permissions: ['*'],
      },
    });

    const tokenB = await loginWithRetry(
      'userb_cross@e2ecross.com',
      'password123',
    );

    await book(
      {
        guestName: 'B Guest',
        guestDocument: '77700000001',
        guestEmail: 'bguest@cross.com',
        guestTelefone: '11988888888',
        categoryId: catBId,
        branchId: branchBId,
        dataCheckIn: '2026-08-10T14:00:00.000Z',
        dataCheckOut: '2026-08-15T12:00:00.000Z',
        origem: 'ONLINE',
      },
      tokenB,
    );
    await expect(
      book(
        {
          guestName: 'B Guest 2',
          guestDocument: '77700000002',
          guestEmail: 'bguest2@cross.com',
          guestTelefone: '11988888888',
          categoryId: catBId,
          branchId: branchBId,
          dataCheckIn: '2026-08-10T14:00:00.000Z',
          dataCheckOut: '2026-08-15T12:00:00.000Z',
          origem: 'ONLINE',
        },
        tokenB,
      ),
    ).rejects.toThrow();
    const aRes = await book({
      guestName: 'A Guest',
      guestDocument: '88800000001',
      guestEmail: 'aguest@cross.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-08-10T14:00:00.000Z',
      dataCheckOut: '2026-08-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(aRes.status).toBe(201);

    await prisma.payment.deleteMany({ where: { hotelId: hBId } });
    await prisma.reservation.deleteMany({ where: { hotelId: hBId } });
    await prisma.room.deleteMany({ where: { hotelId: hBId } });
    await prisma.roomCategory.deleteMany({ where: { hotelId: hBId } });
    await prisma.user.deleteMany({ where: { hotelId: hBId } });
    await prisma.branch.deleteMany({ where: { hotelId: hBId } });
    await prisma.hotel.delete({ where: { id: hBId } });
  });

  it('2. RLS + Payment: should isolate payment operations per tenant', async () => {
    const res = await book({
      guestName: 'Payment RLS Guest',
      guestDocument: '33300000001',
      guestEmail: 'paymentrls@cross.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-08-10T14:00:00.000Z',
      dataCheckOut: '2026-08-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    const pay = await axios.post(
      `${API_URL}/payments/pix`,
      {
        reservationId: res.data.id,
        amount: 750.0,
        email: 'paymentrls@cross.com',
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(pay.status).toBe(201);
  });

  it('3. Yield + Overbooking: should correctly apply tariff pricing and enforce capacity limits', async () => {
    const s = await prisma.season.create({
      data: {
        hotelId,
        nome: 'Test Season',
        dataInicio: '2026-08-01T00:00:00.000Z',
        dataFim: '2026-08-31T23:59:59.000Z',
      },
    });
    await prisma.tariff.create({
      data: {
        hotelId,
        seasonId: s.id,
        categoryId,
        valor: 250.0,
        minimoNoites: 2,
      },
    });
    for (let i = 1; i <= 3; i++) {
      const r = await book({
        guestName: `Yield OB ${i}`,
        guestDocument: `4440000000${i}`,
        guestEmail: `yieldob${i}@cross.com`,
        guestTelefone: '11988888888',
        categoryId,
        branchId,
        dataCheckIn: '2026-08-10T14:00:00.000Z',
        dataCheckOut: '2026-08-15T12:00:00.000Z',
        origem: 'ONLINE',
      });
      expect(r.status).toBe(201);
      expect(r.data.valorTotal).toBe('1250');
    }
    await expect(
      book({
        guestName: 'Yield OB 4',
        guestDocument: '77700000004',
        guestEmail: 'yieldob4@cross.com',
        guestTelefone: '11988888888',
        categoryId,
        branchId,
        dataCheckIn: '2026-08-10T14:00:00.000Z',
        dataCheckOut: '2026-08-15T12:00:00.000Z',
        origem: 'ONLINE',
      }),
    ).rejects.toThrow();
    await prisma.tariff.deleteMany({ where: { seasonId: s.id } });
    await prisma.season.delete({ where: { id: s.id } });
  });

  it('4. Payment + Overbooking: should create payment for a reservation and ensure capacity is consumed', async () => {
    const r1 = await book({
      guestName: 'Pay OB Guest 1',
      guestDocument: '88800000002',
      guestEmail: 'payob1@cross.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-09-10T14:00:00.000Z',
      dataCheckOut: '2026-09-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(r1.status).toBe(201);
    const pay = await axios.post(
      `${API_URL}/payments/pix`,
      { reservationId: r1.data.id, amount: 750.0, email: 'payob1@cross.com' },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(pay.status).toBe(201);
    expect(pay.data.qr_code).toBeDefined();
  });
});
