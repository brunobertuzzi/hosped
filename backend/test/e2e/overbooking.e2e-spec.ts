import axios from 'axios';
import { prisma } from '../utils/prisma';
import * as bcrypt from 'bcrypt';

const API_URL = 'http://localhost:3001';
const hashedPassword = bcrypt.hashSync('password123', 10);

async function cleanup() {
  const allHotels = await prisma.hotel.findMany();
  const hotels = allHotels.filter(h => h.nome.startsWith('E2E Overbooking Hotel'));
  for (const hotel of hotels) {
    const hotelId = hotel.id;
    await prisma.payment.deleteMany({ where: { hotelId } });
    await prisma.consumption.deleteMany({ where: { hotelId } });
    await prisma.reservation.deleteMany({ where: { hotelId } });
    await prisma.guest.deleteMany({ where: { hotelId } });
    await prisma.tariff.deleteMany({ where: { hotelId } });
    await prisma.season.deleteMany({ where: { hotelId } });
    await prisma.room.deleteMany({ where: { hotelId } });
    await prisma.roomCategory.deleteMany({ where: { hotelId } });
    await prisma.user.deleteMany({ where: { hotelId } });
    await prisma.branch.deleteMany({ where: { hotelId } });
    await prisma.hotel.delete({ where: { id: hotelId } });
  }
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

describe('Overbooking Prevention E2E Tests', () => {
  let hotelId: string;
  let branchId: string;
  let categoryId: string;
  let token: string;
  let room1Id: string;
  let room2Id: string;

  beforeAll(async () => {
    await cleanup();

    const h = await prisma.hotel.create({
      data: {
        nome: 'E2E Overbooking Hotel',
        razaoSocial: 'E2E OB Hotel LTDA',
        documentoFiscal: '00.000.000/0003-C3',
        email: 'ob@e2eob.com',
        telefone: '11999999993',
        endereco: 'Rua OB, 123',
        plan: 'STARTUP',
        status: 'ACTIVE',
        diferenciais: [],
      },
    });
    hotelId = h.id;

    const b = await prisma.branch.create({
      data: {
        hotelId,
        nome: 'OB Branch',
        endereco: 'Rua OB, 123',
        cidade: 'Sao Paulo',
        estado: 'SP',
        telefone: '11999999993',
        email: 'branch@e2eob.com',
      },
    });
    branchId = b.id;

    await prisma.user.create({
      data: {
        hotelId,
        branchId,
        nome: 'OB User',
        email: 'user@e2eob.com',
        password: hashedPassword,
        role: 'MANAGER',
        permissions: ['*'],
      },
    });

    const cat = await prisma.roomCategory.create({
      data: {
        hotelId,
        nome: 'OB Category',
        capacidadeMaxima: 2,
        valorBase: 100.0,
      },
    });
    categoryId = cat.id;

    const r1 = await prisma.room.create({
      data: {
        hotelId,
        branchId,
        categoryId: cat.id,
        numero: 'OB101',
        status: 'DISPONIVEL',
      },
    });
    room1Id = r1.id;

    const r2 = await prisma.room.create({
      data: {
        hotelId,
        branchId,
        categoryId: cat.id,
        numero: 'OB102',
        status: 'DISPONIVEL',
      },
    });
    room2Id = r2.id;

    token = await loginWithRetry('user@e2eob.com', 'password123');
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(async () => {
    await prisma.payment.deleteMany({ where: { hotelId } });
    await prisma.reservation.deleteMany({ where: { hotelId } });
    await prisma.room.updateMany({
      where: { hotelId },
      data: { status: 'DISPONIVEL' },
    });
  });

  const book = (data: any) =>
    axios.post(`${API_URL}/reservations`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });

  it('1. should create a reservation when capacity is available', async () => {
    const res = await book({
      guestName: 'John Doe',
      guestDocument: '11111111111',
      guestEmail: 'john@doe.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-08-10T14:00:00.000Z',
      dataCheckOut: '2026-08-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    expect(res.data.status).toBe('PENDENTE');
  });

  it('2. should block booking when capacity is fully occupied for the date range', async () => {
    await book({
      guestName: 'Guest 1',
      guestDocument: '22222222222',
      guestEmail: 'g1@doe.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-08-10T14:00:00.000Z',
      dataCheckOut: '2026-08-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    await book({
      guestName: 'Guest 2',
      guestDocument: '33333333333',
      guestEmail: 'g2@doe.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-08-10T14:00:00.000Z',
      dataCheckOut: '2026-08-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    await expect(
      book({
        guestName: 'Guest 3',
        guestDocument: '44444444444',
        guestEmail: 'g3@doe.com',
        guestTelefone: '11988888888',
        categoryId,
        branchId,
        dataCheckIn: '2026-08-12T14:00:00.000Z',
        dataCheckOut: '2026-08-14T12:00:00.000Z',
        origem: 'ONLINE',
      }),
    ).rejects.toThrow();
  });

  it('3. should block booking if no physical rooms exist in the category', async () => {
    const ec = await prisma.roomCategory.create({
      data: {
        hotelId,
        nome: 'Empty Cat',
        capacidadeMaxima: 2,
        valorBase: 100.0,
      },
    });
    await expect(
      book({
        guestName: 'Guest X',
        guestDocument: '55555555555',
        guestEmail: 'gx@doe.com',
        guestTelefone: '11988888888',
        categoryId: ec.id,
        branchId,
        dataCheckIn: '2026-08-10T14:00:00.000Z',
        dataCheckOut: '2026-08-15T12:00:00.000Z',
        origem: 'ONLINE',
      }),
    ).rejects.toThrow();
    await prisma.roomCategory.delete({ where: { id: ec.id } });
  });

  it('4. should prevent reservation if check-in is after check-out', async () => {
    await expect(
      book({
        guestName: 'Guest Invalid',
        guestDocument: '66666666666',
        guestEmail: 'gi@doe.com',
        guestTelefone: '11988888888',
        categoryId,
        branchId,
        dataCheckIn: '2026-08-15T14:00:00.000Z',
        dataCheckOut: '2026-08-10T12:00:00.000Z',
        origem: 'ONLINE',
      }),
    ).rejects.toThrow();
  });

  it('5. should allow booking if dates overlap but status is CANCELADA', async () => {
    const r1 = await book({
      guestName: 'Guest 1',
      guestDocument: '77777777777',
      guestEmail: 'g1@doe.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-08-10T14:00:00.000Z',
      dataCheckOut: '2026-08-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    await book({
      guestName: 'Guest 2',
      guestDocument: '88888888888',
      guestEmail: 'g2@doe.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-08-10T14:00:00.000Z',
      dataCheckOut: '2026-08-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    await axios.post(
      `${API_URL}/reservations/${r1.data.id}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const r3 = await book({
      guestName: 'Guest 3',
      guestDocument: '99999999999',
      guestEmail: 'g3@doe.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-08-10T14:00:00.000Z',
      dataCheckOut: '2026-08-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(r3.status).toBe(201);
  });

  it('6. should handle concurrent bookings in Serializable transaction and only allow bookings up to capacity', async () => {
    const requests = Array.from({ length: 5 }).map((_, i) =>
      book({
        guestName: `Concurrent Guest ${i}`,
        guestDocument: `9000000000${i}`,
        guestEmail: `cg${i}@concurrent.com`,
        guestTelefone: '11988888888',
        categoryId,
        branchId,
        dataCheckIn: '2026-08-20T14:00:00.000Z',
        dataCheckOut: '2026-08-25T12:00:00.000Z',
        origem: 'ONLINE',
      }),
    );
    const results = await Promise.allSettled(requests);
    const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
    expect(fulfilled).toBeGreaterThanOrEqual(1);
    expect(fulfilled).toBeLessThanOrEqual(2);
  });

  it('7. should allow booking on adjacent dates where check-out of one matches check-in of the next', async () => {
    await book({
      guestName: 'Guest A',
      guestDocument: '12121212121',
      guestEmail: 'ga@doe.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-08-10T14:00:00.000Z',
      dataCheckOut: '2026-08-12T12:00:00.000Z',
      origem: 'ONLINE',
    });
    const r2 = await book({
      guestName: 'Guest B',
      guestDocument: '13131313131',
      guestEmail: 'gb@doe.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-08-12T14:00:00.000Z',
      dataCheckOut: '2026-08-14T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(r2.status).toBe(201);
  });

  it('8. should block bookings if a room is BLOQUEADO (reducing active capacity)', async () => {
    await prisma.room.update({
      where: { id: room1Id },
      data: { status: 'BLOQUEADO' },
    });
    const r1 = await book({
      guestName: 'Guest Ob1',
      guestDocument: '14141414141',
      guestEmail: 'gob1@doe.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-08-10T14:00:00.000Z',
      dataCheckOut: '2026-08-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(r1.status).toBe(201);
    await expect(
      book({
        guestName: 'Guest Ob2',
        guestDocument: '15151515151',
        guestEmail: 'gob2@doe.com',
        guestTelefone: '11988888888',
        categoryId,
        branchId,
        dataCheckIn: '2026-08-10T14:00:00.000Z',
        dataCheckOut: '2026-08-15T12:00:00.000Z',
        origem: 'ONLINE',
      }),
    ).rejects.toThrow();
  });

  it('9. should allow booking if a room is in MANUTENCAO', async () => {
    await prisma.room.update({
      where: { id: room1Id },
      data: { status: 'MANUTENCAO' },
    });
    const r1 = await book({
      guestName: 'Guest M1',
      guestDocument: '16161616161',
      guestEmail: 'gm1@doe.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-09-10T14:00:00.000Z',
      dataCheckOut: '2026-09-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    const r2 = await book({
      guestName: 'Guest M2',
      guestDocument: '17171717171',
      guestEmail: 'gm2@doe.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-09-10T14:00:00.000Z',
      dataCheckOut: '2026-09-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
  });

  it('10. should update reservation status to cancel and free up capacity immediately', async () => {
    const r1 = await book({
      guestName: 'Guest A',
      guestDocument: '18181818181',
      guestEmail: 'ga@doe.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-08-10T14:00:00.000Z',
      dataCheckOut: '2026-08-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    await book({
      guestName: 'Guest B',
      guestDocument: '19191919191',
      guestEmail: 'gb@doe.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-08-10T14:00:00.000Z',
      dataCheckOut: '2026-08-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    const cancel = await axios.post(
      `${API_URL}/reservations/${r1.data.id}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(cancel.data.status).toBe('CANCELADA');
    const r3 = await book({
      guestName: 'Guest C',
      guestDocument: '20202020202',
      guestEmail: 'gc@doe.com',
      guestTelefone: '11988888888',
      categoryId,
      branchId,
      dataCheckIn: '2026-08-10T14:00:00.000Z',
      dataCheckOut: '2026-08-15T12:00:00.000Z',
      origem: 'ONLINE',
    });
    expect(r3.status).toBe(201);
  });
});
