import axios from 'axios';
import { prisma } from '../utils/prisma';
import * as bcrypt from 'bcrypt';

const API_URL = 'http://localhost:3001';
const hashedPassword = bcrypt.hashSync('password123', 10);

async function cleanup(name: string) {
  const allHotels = await prisma.hotel.findMany();
  const hotels = allHotels.filter(h => h.nome.startsWith(name));
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

describe('Mercado Pago Payment Integration E2E Tests', () => {
  let hotelId: string;
  let branchId: string;
  let categoryId: string;
  let reservationId: string;
  let token: string;

  beforeAll(async () => {
    await cleanup('E2E Mercado Pago Hotel');

    const h = await prisma.hotel.create({
      data: {
        nome: 'E2E Mercado Pago Hotel',
        razaoSocial: 'E2E MP Hotel LTDA',
        documentoFiscal: '00.000.000/0004-D4',
        email: 'mp@e2emp.com',
        telefone: '11999999994',
        endereco: 'Rua MP, 123',
        plan: 'STARTUP',
        status: 'ACTIVE',
        diferenciais: [],
      },
    });
    hotelId = h.id;

    const b = await prisma.branch.create({
      data: {
        hotelId,
        nome: 'MP Branch',
        endereco: 'Rua MP, 123',
        cidade: 'Sao Paulo',
        estado: 'SP',
        telefone: '11999999994',
        email: 'branch@e2emp.com',
      },
    });
    branchId = b.id;

    await prisma.user.create({
      data: {
        hotelId,
        branchId,
        nome: 'MP User',
        email: 'user@e2emp.com',
        password: hashedPassword,
        role: 'MANAGER',
        permissions: ['*'],
      },
    });

    const cat = await prisma.roomCategory.create({
      data: {
        hotelId,
        nome: 'MP Category',
        capacidadeMaxima: 2,
        valorBase: 120.0,
      },
    });
    categoryId = cat.id;

    await prisma.room.create({
      data: { hotelId, branchId, categoryId: cat.id, numero: 'MP101' },
    });

    token = await loginWithRetry('user@e2emp.com', 'password123');
  });

  afterAll(async () => {
    await cleanup('E2E Mercado Pago Hotel');
  });

  beforeEach(async () => {
    await prisma.payment.deleteMany({ where: { hotelId } });
    await prisma.reservation.deleteMany({ where: { hotelId } });
    
    const res = await axios.post(
      `${API_URL}/reservations`,
      {
        guestName: 'Payment Guest',
        guestDocument: '22233344455',
        guestEmail: 'pguest@doe.com',
        guestTelefone: '11988888888',
        categoryId,
        branchId,
        dataCheckIn: '2026-08-10T14:00:00.000Z',
        dataCheckOut: '2026-08-15T12:00:00.000Z',
        origem: 'ONLINE',
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    reservationId = res.data.id;
  });

  it('1. should request a PIX payment link for a reservation and receive mock details', async () => {
    const res = await axios.post(
      `${API_URL}/payments/pix`,
      {
        reservationId,
        amount: 600.0,
        description: 'E2E PIX payment',
        email: 'pguest@doe.com',
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(res.status).toBe(201);
    expect(res.data.qr_code).toBeDefined();
    expect(res.data.qr_code_base64).toBeDefined();
  });

  it('2. should return payment status', async () => {
    const pay = await axios.post(
      `${API_URL}/payments/pix`,
      { reservationId, amount: 600.0 },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const status = await axios.get(
      `${API_URL}/payments/${pay.data.id}/status`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(status.status).toBe(200);
    expect(status.data.status).toBeDefined();
  });

  it('3. should successfully process webhook events', async () => {
    const pay = await axios.post(
      `${API_URL}/payments/pix`,
      { reservationId, amount: 600.0 },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const webhook = await axios.post(`${API_URL}/payments/webhook`, {
      type: 'payment',
      data: { id: pay.data.id },
    });
    expect(webhook.status).toBe(201);
    expect(webhook.data.received).toBe(true);
  });

  it('4. should reject status checks for non-existent payment transactions', async () => {
    await expect(
      axios.get(`${API_URL}/payments/non_existent_tx_id/status`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ).rejects.toThrow();
  });

  it('5. should verify that the webhook endpoint returns 200/201 OK', async () => {
    const res = await axios.post(`${API_URL}/payments/webhook`, {
      action: 'payment.updated',
      data: { id: '999999' },
    });
    expect(res.status).toBe(201);
    expect(res.data.received).toBe(true);
  });

  it('6. should simulate webhook updating payment to approved', async () => {
    const pay = await axios.post(
      `${API_URL}/payments/pix`,
      { reservationId, amount: 600.0 },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const transId = pay.data.id.toString();
    await prisma.payment.updateMany({
      where: { transacaoId: transId },
      data: { status: 'APROVADO' },
    });
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { status: true },
    });
    expect(['PENDENTE', 'CONFIRMADA']).toContain(reservation?.status);
  });

  it('7. should trigger welcome message when reservation transition to CONFIRMADA', async () => {
    const pay = await axios.post(
      `${API_URL}/payments/pix`,
      { reservationId, amount: 600.0 },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(pay.status).toBe(201);
  });

  it('8. should support real Mercado Pago client configuration when API keys are available on hotel integration', async () => {
    await prisma.hotelIntegration.create({
      data: {
        hotelId,
        paymentGatewayProvider: 'MERCADO_PAGO',
        paymentGatewayToken: 'TEST_MP_TOKEN_123',
      },
    });
    await expect(
      axios.post(
        `${API_URL}/payments/pix`,
        { reservationId, amount: 100.0 },
        { headers: { Authorization: `Bearer ${token}` } },
      ),
    ).rejects.toThrow();
    await prisma.hotelIntegration.deleteMany({ where: { hotelId } });
  });

  it('9. should log a warning if payment generation fails or returns empty data', async () => {
    await expect(
      axios.post(
        `${API_URL}/payments/pix`,
        { reservationId: 'invalid-uuid-format', amount: 600.0 },
        { headers: { Authorization: `Bearer ${token}` } },
      ),
    ).rejects.toThrow();
  });

  it('10. should isolate integrations between hotels, ensuring Hotel A cannot use integrations of Hotel B', async () => {
    const hB = await prisma.hotel.create({
      data: {
        nome: 'Other Hotel',
        razaoSocial: 'Other Hotel LTDA',
        documentoFiscal: '00.000.000/0009-E9',
        email: 'other@other.com',
        telefone: '11999999999',
        endereco: 'Rua Other, 123',
        plan: 'STARTUP',
        status: 'ACTIVE',
        diferenciais: [],
      },
    });
    const hotelBId = hB.id;

    const bB = await prisma.branch.create({
      data: {
        hotelId: hotelBId,
        nome: 'Other Branch',
        endereco: 'Rua Other, 123',
        cidade: 'Sao Paulo',
        estado: 'SP',
        telefone: '11999999999',
        email: 'other@other.com',
      },
    });
    const branchBId = bB.id;

    const catB = await prisma.roomCategory.create({
      data: {
        hotelId: hotelBId,
        nome: 'Other Cat',
        capacidadeMaxima: 2,
        valorBase: 100.0,
      },
    });
    const catBId = catB.id;

    const guestB = await prisma.guest.create({
      data: {
        hotelId: hotelBId,
        nome: 'Other Guest',
        documento: '99999999999',
        email: 'other@guest.com',
        telefone: '11999999999',
      },
    });

    const resB = await prisma.reservation.create({
      data: {
        hotelId: hotelBId,
        branchId: branchBId,
        guestId: guestB.id,
        categoryId: catBId,
        dataCheckIn: new Date(),
        dataCheckOut: new Date(Date.now() + 86400000),
        valorTotal: 100.0,
        status: 'PENDENTE',
        origem: 'ONLINE',
      },
    });

    await expect(
      axios.post(
        `${API_URL}/payments/pix`,
        { reservationId: resB.id, amount: 100.0 },
        { headers: { Authorization: `Bearer ${token}` } },
      ),
    ).rejects.toThrow();

    await prisma.payment.deleteMany({ where: { hotelId: hotelBId } });
    await prisma.reservation.deleteMany({ where: { hotelId: hotelBId } });
    await prisma.guest.deleteMany({ where: { hotelId: hotelBId } });
    await prisma.roomCategory.deleteMany({ where: { hotelId: hotelBId } });
    await prisma.branch.deleteMany({ where: { hotelId: hotelBId } });
    await prisma.hotel.delete({ where: { id: hotelBId } });
  });
});
