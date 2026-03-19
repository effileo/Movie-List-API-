/** Socket.io instance set from server bootstrap; used by controllers to push real-time events. */
let ioRef = null;

export function setIo(io) {
    ioRef = io;
}

export function getIo() {
    return ioRef;
}

/**
 * Emit to a specific user's room (they must have joined `user:${userId}` on connect).
 */
export function emitToUser(userId, event, payload) {
    if (!ioRef) return;
    ioRef.to(`user:${userId}`).emit(event, payload);
}
