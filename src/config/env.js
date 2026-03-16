/**
 * Validate required env vars at startup. Throws if any are missing.
 */
const required = ['DATABASE_URL', 'JWT_SECRET', 'TMDB_API_KEY'];

export function validateEnv() {
    const missing = required.filter((key) => !process.env[key]?.trim());
    if (missing.length) {
        throw new Error(`Missing required env: ${missing.join(', ')}. Check your .env file.`);
    }
}
