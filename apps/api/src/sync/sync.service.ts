import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SyncService {
  server: Server | null = null;

  emitToSpace(spaceId: string, event: string) {
    this.server?.to(`space:${spaceId}`).emit(event);
  }

  emitToUser(userId: string, event: string) {
    this.server?.to(`user:${userId}`).emit(event);
  }
}
