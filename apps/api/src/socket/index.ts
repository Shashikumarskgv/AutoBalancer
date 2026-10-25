import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config';
import { RealtimeDifficultyUpdate } from '@game-ai/shared-types';

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    try {
      const decoded = jwt.verify(token as string, CONFIG.JWT_SECRET) as any;
      (socket as any).userId = decoded.id;
      next();
    } catch (err) {
      return next(new Error('Invalid socket authentication token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    const playerRoom = `player:${userId}`;
    socket.join(playerRoom);
    console.log(`[Socket.IO] Player connected: ${userId} (Socket ID: ${socket.id}) joined room ${playerRoom}`);

    socket.on('join_game_session', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      console.log(`[Socket.IO] Player ${userId} joined session room: session:${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Player disconnected: ${userId}`);
    });
  });

  return io;
};

export const getSocketServer = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO server has not been initialized');
  }
  return io;
};

export const broadcastDifficultyUpdate = (playerId: string, payload: RealtimeDifficultyUpdate) => {
  if (!io) return;
  const room = `player:${playerId}`;
  io.to(room).emit('DIFFICULTY_UPDATED', payload);
  console.log(`[Socket.IO] Emitted DIFFICULTY_UPDATED to room ${room}: Level ${payload.previousDifficulty} -> ${payload.newDifficulty}`);
};
