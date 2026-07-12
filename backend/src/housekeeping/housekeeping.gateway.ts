import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../core/prisma.service';
import { RoomStatus } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for the MVP
  },
})
export class HousekeepingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    // The client should pass the hotelId when connecting to isolate messages
    const hotelId = client.handshake.query.hotelId as string;
    if (hotelId) {
      client.join(hotelId);
      console.log(
        `[Housekeeping] Client ${client.id} joined hotel room: ${hotelId}`,
      );
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[Housekeeping] Client ${client.id} disconnected`);
  }

  @SubscribeMessage('update_room_status')
  async handleRoomStatusUpdate(
    @MessageBody()
    data: { roomId: string; status: RoomStatus; hotelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Atualiza o status do quarto no banco de dados
      const updatedRoom = await this.prisma.client.room.update({
        where: { id: data.roomId, hotelId: data.hotelId },
        data: { status: data.status },
      });

      // Transmite a mudança para TODOS os funcionários conectados no mesmo hotel
      // Isso fará a tela da recepção piscar em tempo real quando a camareira mudar o status
      this.server.to(data.hotelId).emit('room_status_changed', {
        roomId: updatedRoom.id,
        status: updatedRoom.status,
        hotelId: data.hotelId,
        updatedAt: updatedRoom.updatedAt,
      });

      return { success: true, room: updatedRoom };
    } catch (error) {
      console.error('Error updating room status via WebSocket:', error);
      return { success: false, error: 'Failed to update room' };
    }
  }
}
