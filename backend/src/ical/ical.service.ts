import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../core/prisma.service';
import ical from 'ical-generator';
import * as nodeIcal from 'node-ical';
import { ReservationStatus } from '@prisma/client';

@Injectable()
export class IcalService {
  private readonly logger = new Logger(IcalService.name);

  constructor(private prisma: PrismaService) {}

  async generateExport(exportToken: string): Promise<string | null> {
    const syncSettings = await this.prisma.client.icalSync.findUnique({
      where: { exportToken },
    });

    if (!syncSettings) return null;

    const whereClause: any = {
      hotelId: syncSettings.hotelId,
      status: {
        in: [
          ReservationStatus.CONFIRMADA,
          ReservationStatus.CHECK_IN_REALIZADO,
          ReservationStatus.HOSPEDADO,
        ],
      },
    };

    if (syncSettings.roomId) {
      whereClause.roomId = syncSettings.roomId;
    } else if (syncSettings.categoryId) {
      whereClause.categoryId = syncSettings.categoryId;
    }

    const reservations = await this.prisma.client.reservation.findMany({
      where: whereClause,
      include: { guest: true, room: true, category: true },
    });

    const calendar = ical({ name: 'Hosped Calendar' });

    for (const res of reservations) {
      calendar.createEvent({
        start: res.dataCheckIn,
        end: res.dataCheckOut,
        summary: `Hosped Reservation - ${res.guest.nome}`,
        description: `Room: ${res.room?.numero || 'TBD'}, Category: ${res.category.nome}`,
        uid: res.id,
      });
    }

    return calendar.toString();
  }

  async getSettings(hotelId: string) {
    return this.prisma.client.icalSync.findMany({
      where: { hotelId },
      include: { room: true, category: true },
    });
  }

  async saveSettings(hotelId: string, data: any) {
    const { roomId, importUrls } = data;
    let sync = await this.prisma.client.icalSync.findFirst({
      where: { hotelId, roomId },
    });

    if (sync) {
      sync = await this.prisma.client.icalSync.update({
        where: { id: sync.id },
        data: { importUrls },
      });
    } else {
      sync = await this.prisma.client.icalSync.create({
        data: { hotelId, roomId, importUrls },
      });
    }
    return sync;
  }

  async syncIcalUrls(syncId: string) {
    const syncData = await this.prisma.client.icalSync.findUnique({
      where: { id: syncId },
    });
    if (!syncData || !syncData.importUrls || syncData.importUrls.length === 0)
      return { success: true, count: 0 };

    let createdCount = 0;

    for (const url of syncData.importUrls) {
      try {
        const events = await nodeIcal.async.fromURL(url);

        for (const k in events) {
          const event: any = events[k];
          if (event.type === 'VEVENT') {
            const start = event.start as Date;
            const end = event.end as Date;
            const uid = event.uid;

            if (!uid) continue;

            const existing = await this.prisma.client.reservation.findUnique({
              where: {
                hotelId_otaReservationId: {
                  hotelId: syncData.hotelId,
                  otaReservationId: uid,
                },
              },
            });

            if (!existing && start && end) {
              let guest = await this.prisma.client.guest.findFirst({
                where: {
                  hotelId: syncData.hotelId,
                  nome: 'Reserva Externa OTA',
                },
              });

              if (!guest) {
                guest = await this.prisma.client.guest.create({
                  data: {
                    hotelId: syncData.hotelId,
                    nome: 'Reserva Externa OTA',
                    documento: 'OTA-IMPORT',
                    email: 'ota@hosped.com',
                    telefone: '0000000000',
                  },
                });
              }

              let branchId = '';
              let categoryId = syncData.categoryId || '';

              if (syncData.roomId) {
                const r = await this.prisma.client.room.findUnique({
                  where: { id: syncData.roomId },
                });
                if (r) {
                  branchId = r.branchId;
                  categoryId = r.categoryId;
                }
              }

              if (!branchId) {
                const b = await this.prisma.client.branch.findFirst({
                  where: { hotelId: syncData.hotelId },
                });
                if (b) branchId = b.id;
              }

              if (branchId && categoryId) {
                await this.prisma.client.reservation.create({
                  data: {
                    hotelId: syncData.hotelId,
                    branchId,
                    guestId: guest.id,
                    categoryId,
                    roomId: syncData.roomId || null,
                    dataCheckIn: start,
                    dataCheckOut: end,
                    valorTotal: 0,
                    status: ReservationStatus.CONFIRMADA,
                    origem: 'OTA_IMPORT',
                    otaReservationId: uid,
                  },
                });
                createdCount++;
              }
            }
          }
        }
      } catch (e) {
        this.logger.error(`Failed to sync URL: ${url}`, e);
      }
    }

    await this.prisma.client.icalSync.update({
      where: { id: syncId },
      data: { lastSyncAt: new Date() },
    });

    return { success: true, count: createdCount };
  }

  @Cron('0 */15 * * * *')
  async handleCron() {
    this.logger.log('Starting iCal Sync Cron Job');
    const syncs = await this.prisma.client.icalSync.findMany();
    const activeSyncs = syncs.filter(
      (s: any) => s.importUrls && s.importUrls.length > 0,
    );

    for (const sync of activeSyncs) {
      await this.syncIcalUrls(sync.id);
    }
  }
}
