import axios from 'axios';
import { prisma } from '../utils/prisma';
import * as bcrypt from 'bcrypt';

const API_URL = 'http://localhost:3001';
const hashedPassword = bcrypt.hashSync('password123', 10);

async function cleanup() {
  const allHotels = await prisma.hotel.findMany();
  const hotels = allHotels.filter(h => h.nome.startsWith('E2E RLS'));
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
  await prisma.user.deleteMany({ where: { email: 'po@e2erls.com' } });
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

describe('Row-Level Security (RLS) E2E Tests', () => {
  let hotelAId: string;
  let hotelBId: string;
  let branchAId: string;
  let branchBId: string;
  let tokenA: string;
  let tokenB: string;
  let tokenPlatformOwner: string;

  beforeAll(async () => {
    await cleanup();

    // Create Hotel A
    const hA = await prisma.hotel.create({
      data: {
        nome: 'E2E RLS Hotel A',
        razaoSocial: 'E2E RLS Hotel A LTDA',
        documentoFiscal: '00.000.000/0001-A1',
        email: 'hotela@e2erls.com',
        telefone: '11999999991',
        endereco: 'Rua A, 123',
        plan: 'STARTUP',
        status: 'ACTIVE',
        diferenciais: [],
      },
    });
    hotelAId = hA.id;

    const bA = await prisma.branch.create({
      data: {
        hotelId: hotelAId,
        nome: 'Branch A',
        endereco: 'Rua A, 123',
        cidade: 'Sao Paulo',
        estado: 'SP',
        telefone: '11999999991',
        email: 'brancha@e2erls.com',
      },
    });
    branchAId = bA.id;

    await prisma.user.create({
      data: {
        hotelId: hotelAId,
        branchId: branchAId,
        nome: 'User A',
        email: 'usera@e2erls.com',
        password: hashedPassword,
        role: 'RECEPTIONIST',
        permissions: ['rooms.manage', 'reservations.edit'],
      },
    });

    // Create Hotel B
    const hB = await prisma.hotel.create({
      data: {
        nome: 'E2E RLS Hotel B',
        razaoSocial: 'E2E RLS Hotel B LTDA',
        documentoFiscal: '00.000.000/0002-B2',
        email: 'hotelb@e2erls.com',
        telefone: '11999999992',
        endereco: 'Rua B, 456',
        plan: 'STARTUP',
        status: 'ACTIVE',
        diferenciais: [],
      },
    });
    hotelBId = hB.id;

    const bB = await prisma.branch.create({
      data: {
        hotelId: hotelBId,
        nome: 'Branch B',
        endereco: 'Rua B, 456',
        cidade: 'Rio',
        estado: 'RJ',
        telefone: '11999999992',
        email: 'branchb@e2erls.com',
      },
    });
    branchBId = bB.id;

    await prisma.user.create({
      data: {
        hotelId: hotelBId,
        branchId: branchBId,
        nome: 'User B',
        email: 'userb@e2erls.com',
        password: hashedPassword,
        role: 'RECEPTIONIST',
        permissions: ['rooms.manage', 'reservations.edit'],
      },
    });

    // Platform Owner (no hotelId)
    await prisma.user.create({
      data: {
        nome: 'Platform Owner',
        email: 'po@e2erls.com',
        password: hashedPassword,
        role: 'PLATFORM_OWNER',
        permissions: ['*'],
      },
    });

    // Seed rooms
    const catA = await prisma.roomCategory.create({
      data: {
        hotelId: hotelAId,
        nome: 'Cat A',
        capacidadeMaxima: 2,
        valorBase: 100.0,
      },
    });
    await prisma.room.create({
      data: {
        hotelId: hotelAId,
        branchId: branchAId,
        categoryId: catA.id,
        numero: 'A101',
      },
    });

    const catB = await prisma.roomCategory.create({
      data: {
        hotelId: hotelBId,
        nome: 'Cat B',
        capacidadeMaxima: 3,
        valorBase: 150.0,
      },
    });
    await prisma.room.create({
      data: {
        hotelId: hotelBId,
        branchId: branchBId,
        categoryId: catB.id,
        numero: 'B201',
      },
    });

    // Login
    tokenA = await loginWithRetry('usera@e2erls.com', 'password123');
    tokenB = await loginWithRetry('userb@e2erls.com', 'password123');
    tokenPlatformOwner = await loginWithRetry('po@e2erls.com', 'password123');
  });

  afterAll(async () => {
    await cleanup();
  });

  it('1. should reject requests without tenant headers on tenant-specific endpoints', async () => {
    await expect(axios.get(`${API_URL}/rooms`)).rejects.toThrow();
  });

  it('2. should return only Hotel A rooms when header x-hotel-id is set to Hotel A', async () => {
    const res = await axios.get(`${API_URL}/rooms`, {
      headers: { 'x-hotel-id': hotelAId, Authorization: `Bearer ${tokenA}` },
    });
    expect(res.status).toBe(200);
    expect(res.data.every((r: any) => r.hotelId === hotelAId)).toBe(true);
    expect(res.data.some((r: any) => r.numero === 'A101')).toBe(true);
  });

  it('3. should return only Hotel B rooms when header x-hotel-id is set to Hotel B', async () => {
    const res = await axios.get(`${API_URL}/rooms`, {
      headers: { 'x-hotel-id': hotelBId, Authorization: `Bearer ${tokenB}` },
    });
    expect(res.status).toBe(200);
    expect(res.data.every((r: any) => r.hotelId === hotelBId)).toBe(true);
  });

  it('4. should prevent Hotel A from reading a room category belonging to Hotel B', async () => {
    const catBRecord = await prisma.roomCategory.findFirst({
      where: { hotelId: hotelBId },
    });
    const res = await axios.get(`${API_URL}/rooms/categories`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    expect(res.status).toBe(200);
    expect(res.data.some((c: any) => c.id === catBRecord?.id)).toBe(false);
  });

  it('5. should allow public booking engine access without authentication but scope to the public hotel endpoint', async () => {
    const res = await axios.get(
      `${API_URL}/booking-engine/public/hotel/${hotelAId}`,
    );
    expect(res.status).toBe(200);
    expect(res.data.hotel.id).toBe(hotelAId);
  });

  it('6. should enforce tenant isolation using JWT token hotelId even if header specifies a different hotel', async () => {
    const res = await axios.get(`${API_URL}/rooms`, {
      headers: { Authorization: `Bearer ${tokenA}`, 'x-hotel-id': hotelBId },
    });
    expect(res.status).toBe(200);
    expect(res.data.some((r: any) => r.numero === 'A101')).toBe(true);
    expect(res.data.some((r: any) => r.numero === 'B201')).toBe(false);
  });

  it('7. should allow PLATFORM_OWNER to bypass tenant isolation and fetch all hotels or logs', async () => {
    const res = await axios.get(`${API_URL}/rooms`, {
      headers: { Authorization: `Bearer ${tokenPlatformOwner}` },
    });
    expect(res.status).toBe(200);
    const roomNumbers = res.data.map((r: any) => r.numero);
    expect(roomNumbers).toContain('A101');
    expect(roomNumbers).toContain('B201');
  });

  it('8. should guarantee AsyncLocalStorage isolation across concurrent request contexts', async () => {
    const [resA, resB] = await Promise.all([
      axios.get(`${API_URL}/rooms`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      }),
      axios.get(`${API_URL}/rooms`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      }),
    ]);
    expect(resA.data.some((r: any) => r.numero === 'A101')).toBe(true);
    expect(resA.data.some((r: any) => r.numero === 'B201')).toBe(false);
    expect(resB.data.some((r: any) => r.numero === 'B201')).toBe(true);
  });

  it('9. should override any tenant ID passed in request body with user own tenant ID in creation endpoints', async () => {
    const res = await axios.post(
      `${API_URL}/rooms/categories`,
      {
        nome: 'Fake Category',
        capacidadeMaxima: 5,
        valorBase: 50.0,
        hotelId: hotelBId,
      },
      { headers: { Authorization: `Bearer ${tokenA}` } },
    );
    expect(res.status).toBe(201);
    expect(res.data.hotelId).toBe(hotelAId);
    await prisma.roomCategory.delete({ where: { id: res.data.id } });
  });

  it('10. should isolate branch access for branch-specific queries', async () => {
    const res = await axios.get(`${API_URL}/rooms`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    expect(res.status).toBe(200);
    expect(res.data.every((r: any) => r.branchId === branchAId)).toBe(true);
  });
});
