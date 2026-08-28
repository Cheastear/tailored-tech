import {
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { SyncService } from './sync.service';

function parseCookies(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    }),
  );
}

@WebSocketGateway({
  cors: {
    origin: true, // reflect origin — JWT auth in handleConnection is the real gate
    credentials: true,
  },
})
export class SyncGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(
    private sync: SyncService,
    private jwt: JwtService,
  ) {}

  afterInit(server: Server) {
    this.sync.server = server;
  }

  handleConnection(client: Socket) {
    const cookieHeader = client.handshake.headers.cookie ?? '';
    const token = parseCookies(cookieHeader)['auth_token'];
    try {
      const payload = this.jwt.verify<{ sub: string }>(token);
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('joinSpace')
  handleJoinSpace(client: Socket, spaceId: string) {
    client.join(`space:${spaceId}`);
  }

  @SubscribeMessage('leaveSpace')
  handleLeaveSpace(client: Socket, spaceId: string) {
    client.leave(`space:${spaceId}`);
  }
}
