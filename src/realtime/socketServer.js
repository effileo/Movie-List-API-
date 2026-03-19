import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { setIo } from './emit.js';

/**
 * Attach Socket.io to HTTP server; authenticate via handshake auth.token (JWT).
 */
export function attachSocketServer(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL ?? true,
            credentials: true,
        },
    });

    setIo(io);

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) {
                return next(new Error('Authentication required'));
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id ?? decoded.userId;
            if (!socket.userId) return next(new Error('Invalid token'));
            next();
        } catch (e) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const uid = socket.userId;
        socket.join(`user:${uid}`);
        socket.emit('connected', { userId: uid });

        socket.on('disconnect', () => {
            socket.leave(`user:${uid}`);
        });
    });

    return io;
}
