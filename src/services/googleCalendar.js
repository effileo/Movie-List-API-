import { google } from 'googleapis';
import jwt from 'jsonwebtoken';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

export function getOAuthRedirectUri() {
    const explicit = process.env.GOOGLE_REDIRECT_URI?.trim();
    if (explicit) return explicit;
    const base = process.env.BACKEND_URL?.trim() || 'http://localhost:5001';
    return `${base.replace(/\/$/, '')}/calendar/google/callback`;
}

export function createOAuthClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) return null;
    return new google.auth.OAuth2(clientId, clientSecret, getOAuthRedirectUri());
}

export function assertGoogleConfigured() {
    if (!createOAuthClient()) {
        const err = new Error('Google Calendar is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
        err.statusCode = 503;
        throw err;
    }
}

export function generateAuthUrl(userId) {
    assertGoogleConfigured();
    const oauth2Client = createOAuthClient();
    const state = jwt.sign(
        { purpose: 'gcal_oauth', uid: userId },
        process.env.JWT_SECRET,
        { expiresIn: '10m' },
    );
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES,
        state,
    });
}

export function verifyOAuthState(state) {
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    if (decoded.purpose !== 'gcal_oauth' || decoded.uid == null) {
        throw new Error('Invalid OAuth state');
    }
    return Number(decoded.uid);
}

function addOneCalendarDay(isoDate) {
    const [y, m, d] = String(isoDate).split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + 1);
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
}

/**
 * @param {import('google-auth-library').OAuth2Client} oauth2Client
 */
export async function insertPremiereAllDayEvent(oauth2Client, { releaseDate, title, overview }) {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const synopsis = (overview || 'No synopsis available.').replace(/\s+/g, ' ').trim();
    const description = `Your anticipated movie is out today! Synopsis: ${synopsis}. Powered by CinéVerse.`;
    const summary = `🎬 Premiere: ${title}`;
    await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
            summary,
            description,
            start: { date: releaseDate },
            end: { date: addOneCalendarDay(releaseDate) },
        },
    });
}

/**
 * Returns an OAuth2 client with a valid access token, refreshing and persisting when needed.
 */
export async function getAuthorizedCalendarClient(prisma, userId) {
    const row = await prisma.googleCalendarCredential.findUnique({ where: { userId } });
    if (!row) return null;

    const oauth2Client = createOAuthClient();
    if (!oauth2Client) return null;

    oauth2Client.setCredentials({
        access_token: row.accessToken,
        refresh_token: row.refreshToken,
        expiry_date: row.expiry.getTime(),
    });

    try {
        await oauth2Client.getAccessToken();
        const creds = oauth2Client.credentials;
        const newExpiry = creds.expiry_date ? new Date(creds.expiry_date) : row.expiry;
        if (
            creds.access_token &&
            (creds.access_token !== row.accessToken || Math.abs(newExpiry.getTime() - row.expiry.getTime()) > 5000)
        ) {
            await prisma.googleCalendarCredential.update({
                where: { userId },
                data: {
                    accessToken: creds.access_token,
                    expiry: newExpiry,
                    ...(creds.refresh_token && { refreshToken: creds.refresh_token }),
                },
            });
        }
    } catch (e) {
        console.error('Google Calendar token refresh failed', e);
        return null;
    }

    return oauth2Client;
}
