import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

/**
 * Sets req.user when a valid JWT is present; otherwise continues without auth.
 * Use on public routes that should return extra fields for signed-in users.
 */
export default async function optionalAuthMiddleware(req, res, next) {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
        token = req.cookies.token;
    } else if (req.cookies?.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) return next();
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const id = Number(decoded.id);
        if (Number.isNaN(id)) return next();
        const user = await prisma.user.findUnique({ where: { id } });
        if (user) req.user = user;
    } catch {
        /* invalid token — stay anonymous */
    }
    next();
}
