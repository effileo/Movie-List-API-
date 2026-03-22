import { generateAndPersistCinePersona } from '../services/cinePersonaPipeline.js';

function serializePersona(row) {
    if (!row) return null;
    return {
        title: row.title,
        bio: row.bio,
        auraGenre: row.auraGenre,
        radar: row.radar,
        classics: row.classics,
        updatedAt: row.updatedAt?.toISOString?.() ?? row.updatedAt,
        sourceFingerprint: row.sourceFingerprint,
    };
}

export function getUserCinePersona(prisma) {
    return async (req, res) => {
        const targetId = parseInt(req.params.id, 10);
        if (Number.isNaN(targetId)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }
        const viewerId = req.user?.id != null ? Number(req.user.id) : null;
        const isSelf = viewerId === targetId;

        if (!isSelf) {
            const u = await prisma.user.findUnique({
                where: { id: targetId },
                select: { watchlistPublic: true },
            });
            if (!u) return res.status(404).json({ error: 'User not found' });
            if (!u.watchlistPublic) {
                return res.status(403).json({ error: 'Persona is private for this user' });
            }
        }

        const persona = await prisma.cinePersona.findUnique({ where: { userId: targetId } });
        res.json({ status: 'success', data: { persona: serializePersona(persona) } });
    };
}

export function getMyCinePersona(prisma) {
    return async (req, res) => {
        const userId = Number(req.user.id);
        const persona = await prisma.cinePersona.findUnique({ where: { userId } });
        res.json({ status: 'success', data: { persona: serializePersona(persona) } });
    };
}

export function refreshCinePersona(prisma) {
    return async (req, res) => {
        const userId = Number(req.user.id);
        try {
            const row = await generateAndPersistCinePersona(prisma, userId);
            res.json({ status: 'success', data: { persona: serializePersona(row) } });
        } catch (e) {
            if (e.code === 'INSUFFICIENT_DATA') {
                return res.status(400).json({ error: e.message });
            }
            console.error('refreshCinePersona', e);
            res.status(500).json({ error: e.message || 'Failed to generate persona' });
        }
    };
}
