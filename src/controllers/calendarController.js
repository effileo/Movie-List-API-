import {
    createOAuthClient,
    assertGoogleConfigured,
    generateAuthUrl,
    verifyOAuthState,
    insertPremiereAllDayEvent,
    getAuthorizedCalendarClient,
} from '../services/googleCalendar.js';

function frontendBase() {
    return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
}

export function getGoogleAuthUrl(prisma) {
    return async (req, res) => {
        try {
            assertGoogleConfigured();
            const url = generateAuthUrl(Number(req.user.id));
            return res.json({ url });
        } catch (err) {
            const status = err.statusCode || 500;
            return res.status(status).json({ error: err.message || 'Failed to start Google auth' });
        }
    };
}

export function googleOAuthCallback(prisma) {
    return async (req, res) => {
        const q = req.query;
        const redirect = (params) => {
            const u = new URL(`${frontendBase()}/dashboard`);
            Object.entries(params).forEach(([k, v]) => {
                if (v != null) u.searchParams.set(k, String(v));
            });
            u.searchParams.set('tab', 'release-radar');
            return res.redirect(u.toString());
        };

        try {
            if (q.error) {
                return redirect({ calendar: 'error', reason: String(q.error) });
            }
            const code = q.code;
            const state = q.state;
            if (!code || !state) {
                return redirect({ calendar: 'error', reason: 'missing_code_or_state' });
            }

            const userId = verifyOAuthState(state);
            assertGoogleConfigured();
            const oauth2Client = createOAuthClient();
            const { tokens } = await oauth2Client.getToken(code);
            if (!tokens.access_token) {
                return redirect({ calendar: 'error', reason: 'no_access_token' });
            }

            const expiry = new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000);
            await prisma.googleCalendarCredential.upsert({
                where: { userId },
                create: {
                    userId,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token || '',
                    expiry,
                },
                update: {
                    accessToken: tokens.access_token,
                    expiry,
                    ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
                },
            });

            return redirect({ calendar: 'connected' });
        } catch (err) {
            console.error('googleOAuthCallback', err);
            return redirect({ calendar: 'error', reason: 'oauth_failed' });
        }
    };
}

export function getCalendarStatus(prisma) {
    return async (req, res) => {
        const userId = Number(req.user.id);
        const cred = await prisma.googleCalendarCredential.findUnique({ where: { userId } });
        const syncs = await prisma.googleCalendarSync.findMany({
            where: { userId },
            select: { tmdbId: true },
        });
        return res.json({
            connected: Boolean(cred),
            syncedTmdbIds: syncs.map((s) => s.tmdbId),
        });
    };
}

const syncBodySchema = {
    tmdbId: (v) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? n : null;
    },
    releaseDate: (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null),
    title: (v) => (typeof v === 'string' && v.trim() ? v.trim() : null),
    overview: (v) => (typeof v === 'string' ? v : ''),
};

export function syncMovieToCalendar(prisma) {
    return async (req, res) => {
        const userId = Number(req.user.id);
        const tmdbId = syncBodySchema.tmdbId(req.body?.tmdbId);
        const releaseDate = syncBodySchema.releaseDate(req.body?.releaseDate);
        const title = syncBodySchema.title(req.body?.title);
        if (!tmdbId || !releaseDate || !title) {
            return res.status(400).json({ error: 'tmdbId, releaseDate (YYYY-MM-DD), and title are required' });
        }
        const overview = syncBodySchema.overview(req.body?.overview);

        try {
            assertGoogleConfigured();
        } catch (err) {
            return res.status(err.statusCode || 503).json({ error: err.message });
        }

        const existing = await prisma.googleCalendarSync.findUnique({
            where: { userId_tmdbId: { userId, tmdbId } },
        });
        if (existing) {
            return res.json({ status: 'success', alreadySynced: true });
        }

        const client = await getAuthorizedCalendarClient(prisma, userId);
        if (!client) {
            return res.status(401).json({ error: 'Connect Google Calendar first', needsAuth: true });
        }

        try {
            await insertPremiereAllDayEvent(client, { releaseDate, title, overview });
        } catch (err) {
            console.error('insertPremiereAllDayEvent', err);
            return res.status(502).json({ error: err.message || 'Failed to create calendar event' });
        }

        await prisma.googleCalendarSync.create({
            data: { userId, tmdbId },
        });

        return res.json({ status: 'success', alreadySynced: false });
    };
}
