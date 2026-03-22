/**
 * Cine-Persona: aggregate watch history, optional OpenAI, TMDB classics, heuristics fallback.
 */

import crypto from 'crypto';
import { fetchDiscoverMovies, searchMovies } from './tmdb.js';

const NAME_TO_TMDB_GENRE = {
    Action: 28,
    Adventure: 12,
    Animation: 16,
    Comedy: 35,
    Crime: 80,
    Documentary: 99,
    Drama: 18,
    Family: 10751,
    Fantasy: 14,
    History: 36,
    Horror: 27,
    Music: 10402,
    Mystery: 9648,
    Romance: 10749,
    'Sci-Fi': 878,
    'TV Movie': 10770,
    Thriller: 53,
    War: 10752,
    Western: 37,
};

function effectiveRating(item, reviewByMovie) {
    const r = reviewByMovie.get(item.movieId);
    if (r?.rating != null) return r.rating;
    if (item.rating != null) return item.rating;
    return null;
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {number} userId
 */
export async function buildWatchProfile(prisma, userId) {
    const [completed, reviews] = await Promise.all([
        prisma.watchListItem.findMany({
            where: { userId, status: 'COMPLETED' },
            include: { movie: true },
        }),
        prisma.review.findMany({
            where: { userId },
            select: { movieId: true, rating: true },
        }),
    ]);

    const reviewByMovie = new Map(reviews.map((r) => [r.movieId, r]));

    const withScores = completed.map((item) => ({
        item,
        movie: item.movie,
        rating: effectiveRating(item, reviewByMovie),
        completedAt: item.updatedAt.toISOString(),
    }));

    withScores.sort((a, b) => {
        const ar = a.rating ?? -1;
        const br = b.rating ?? -1;
        if (br !== ar) return br - ar;
        return new Date(b.item.updatedAt) - new Date(a.item.updatedAt);
    });

    const top20 = withScores.slice(0, 20).map((x) => ({
        title: x.movie?.title ?? 'Unknown',
        year: x.movie?.year ?? null,
        genres: Array.isArray(x.movie?.genre) ? x.movie.genre : [],
        rating: x.rating,
        tmdbId: x.movie?.tmdbId ?? null,
        movieId: x.movie?.id,
    }));

    const rated = withScores.filter((x) => x.rating != null);
    const avgRating =
        rated.length > 0 ? rated.reduce((s, x) => s + x.rating, 0) / rated.length : null;

    const genreCounts = new Map();
    for (const x of withScores) {
        for (const g of x.movie?.genre || []) {
            const k = String(g).trim() || 'Unknown';
            genreCounts.set(k, (genreCounts.get(k) || 0) + 1);
        }
    }
    const topGenres = [...genreCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([genre, count]) => ({ genre, count }));

    const watchedTmdbIds = [
        ...new Set(
            completed.map((c) => c.movie?.tmdbId).filter((id) => id != null && !Number.isNaN(Number(id)))
        ),
    ];

    const fingerprint = crypto
        .createHash('sha256')
        .update(
            JSON.stringify(
                top20.map((m) => [m.movieId, m.rating, m.title])
            )
        )
        .digest('hex')
        .slice(0, 32);

    return {
        top20,
        topGenres,
        avgRating,
        totalCompleted: completed.length,
        watchedTmdbIds,
        sourceFingerprint: fingerprint,
    };
}

function clampRadar(n) {
    const x = Number(n);
    if (Number.isNaN(x)) return 50;
    return Math.min(100, Math.max(5, Math.round(x)));
}

function heuristicRadar(topGenres) {
    const names = new Set(topGenres.map((g) => g.genre));
    let emotionalDepth = 45;
    let actionLevel = 35;
    let historicalInterest = 30;
    let socialPulse = 40;

    if (names.has('Drama') || names.has('Romance')) emotionalDepth += 25;
    if (names.has('Horror') || names.has('Thriller')) emotionalDepth += 15;
    if (names.has('Action') || names.has('Adventure') || names.has('War')) actionLevel += 35;
    if (names.has('History') || names.has('War')) historicalInterest += 40;
    if (names.has('Comedy') || names.has('Family') || names.has('Animation')) socialPulse += 30;

    return {
        emotionalDepth: clampRadar(emotionalDepth),
        actionLevel: clampRadar(actionLevel),
        historicalInterest: clampRadar(historicalInterest),
        socialPulse: clampRadar(socialPulse),
    };
}

function heuristicPersona(profile) {
    const top = profile.topGenres[0]?.genre || 'Cinema';
    const second = profile.topGenres[1]?.genre;
    const title = second
        ? `The ${top} & ${second} Alchemist`
        : `The ${top} Devotee`;

    const titles = profile.top20.slice(0, 5).map((m) => m.title).join(', ');
    const avg =
        profile.avgRating != null
            ? `Your average pick lands near ${profile.avgRating.toFixed(1)}/10.`
            : 'You let the films speak without always scoring them.';

    const bio = `You gravitate toward ${top}${second ? ` and ${second}` : ''}, with a shelf that reads like a manifesto instead of a mood board. ${avg} The spine of your last twenty finishes—${titles || 'each choice'}—maps a viewer who commits, revisits, and argues with the screen in the best way. Whatever you press play on next, the silhouette is already unmistakably yours.`;

    return {
        title,
        bio,
        radar: heuristicRadar(profile.topGenres),
        auraGenre: top,
    };
}

async function discoverClassicCandidates(profile, limit = 12) {
    const key = process.env.TMDB_API_KEY?.trim();
    if (!key) return [];

    const excluded = new Set(profile.watchedTmdbIds.map(Number));

    const genreId = profile.topGenres
        .map((g) => NAME_TO_TMDB_GENRE[g.genre])
        .find((id) => id != null);

    try {
        const data = await fetchDiscoverMovies({
            sort_by: 'vote_average.desc',
            vote_average_gte: 7.5,
            primary_release_date_lte: '1999-12-31',
            primary_release_date_gte: '1950-01-01',
            with_genres: genreId != null ? String(genreId) : undefined,
            page: 1,
        });
        const results = (data.results || []).filter((m) => m?.id != null && !excluded.has(Number(m.id)));
        return results.slice(0, limit).map((m) => ({
            title: m.title,
            year: m.release_date ? parseInt(m.release_date.slice(0, 4), 10) : null,
            tmdbId: m.id,
            posterPath: m.poster_path,
        }));
    } catch {
        return [];
    }
}

async function enrichClassic({ title, year }) {
    const q = year ? `${title} ${year}` : String(title);
    try {
        const data = await searchMovies(q, 1);
        const hit = (data.results || []).find(
            (r) =>
                r.title?.toLowerCase().includes(String(title).toLowerCase().slice(0, 8)) ||
                String(r.title).toLowerCase() === String(title).toLowerCase()
        ) || (data.results || [])[0];
        if (!hit) return { title, year: year ?? null, tmdbId: null, posterPath: null };
        return {
            title: hit.title || title,
            year: hit.release_date ? parseInt(hit.release_date.slice(0, 4), 10) : year ?? null,
            tmdbId: hit.id,
            posterPath: hit.poster_path ?? null,
        };
    } catch {
        return { title, year: year ?? null, tmdbId: null, posterPath: null };
    }
}

async function callOpenAiPersona(profile, classicHints) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return null;

    const userPayload = {
        topMovies: profile.top20.map((m) => ({
            title: m.title,
            year: m.year,
            genres: m.genres,
            yourRating: m.rating,
        })),
        topGenres: profile.topGenres,
        averageRating: profile.avgRating,
        totalCompleted: profile.totalCompleted,
        classicCandidates: classicHints.slice(0, 8).map((c) => ({ title: c.title, year: c.year })),
    };

    const system = `You are an elite film critic and playful profiler. Based ONLY on the JSON watch profile, respond with a single JSON object (no markdown) with keys:
title: short witty cinematic epithet (3-6 words, Title Case like "The Noir Romantic")
bio: exactly 3 sentences, vivid, specific to their taste
radar: object with integers 10-100 for emotionalDepth, actionLevel, historicalInterest, socialPulse (infer from genres and ratings)
recommendedClassics: array of 4-6 objects { "title": string, "year": number } — acclaimed pre-2000 films they likely have NOT seen; prefer picks aligned with their genres; use real film titles and years
auraGenre: single genre string from their profile that best captures their "color" (one of their top genres or closest match)`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: process.env.OPENAI_CINE_PERSONA_MODEL || 'gpt-4o-mini',
            temperature: 0.85,
            max_tokens: 800,
            messages: [
                { role: 'system', content: system },
                {
                    role: 'user',
                    content: `Watch profile JSON:\n${JSON.stringify(userPayload)}`,
                },
            ],
        }),
    });

    if (!res.ok) {
        const t = await res.text();
        throw new Error(`OpenAI error ${res.status}: ${t.slice(0, 200)}`);
    }

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty OpenAI response');

    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch {
        const m = text.match(/\{[\s\S]*\}/);
        parsed = m ? JSON.parse(m[0]) : null;
    }
    if (!parsed?.title || !parsed?.bio) return null;

    return {
        title: String(parsed.title).slice(0, 120),
        bio: String(parsed.bio).slice(0, 1200),
        radar: {
            emotionalDepth: clampRadar(parsed.radar?.emotionalDepth),
            actionLevel: clampRadar(parsed.radar?.actionLevel),
            historicalInterest: clampRadar(parsed.radar?.historicalInterest),
            socialPulse: clampRadar(parsed.radar?.socialPulse),
        },
        auraGenre: String(parsed.auraGenre || profile.topGenres[0]?.genre || 'Drama').slice(0, 80),
        recommendedClassics: Array.isArray(parsed.recommendedClassics) ? parsed.recommendedClassics : [],
    };
}

/**
 * Generate persona payload and persist.
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {number} userId
 */
export async function generateAndPersistCinePersona(prisma, userId) {
    const profile = await buildWatchProfile(prisma, userId);
    if (profile.totalCompleted < 1) {
        const err = new Error('Complete at least one film to generate a persona');
        err.code = 'INSUFFICIENT_DATA';
        throw err;
    }

    const classicHints = await discoverClassicCandidates(profile, 14);

    let ai = null;
    try {
        ai = await callOpenAiPersona(profile, classicHints);
    } catch (e) {
        console.warn('Cine-Persona OpenAI failed, using heuristics:', e?.message);
    }

    let title;
    let bio;
    let radar;
    let auraGenre;
    let classicsRaw;

    if (ai) {
        title = ai.title;
        bio = ai.bio;
        radar = ai.radar;
        auraGenre = ai.auraGenre;
        classicsRaw = ai.recommendedClassics;
    } else {
        const h = heuristicPersona(profile);
        title = h.title;
        bio = h.bio;
        radar = h.radar;
        auraGenre = h.auraGenre;
        classicsRaw = classicHints.slice(0, 6).map((c) => ({ title: c.title, year: c.year }));
    }

    const mergedClassics = [];
    const seen = new Set(profile.watchedTmdbIds.map(Number));
    const fromAi = (classicsRaw || []).slice(0, 8);
    for (const c of fromAi) {
        if (!c?.title) continue;
        const enriched = await enrichClassic({ title: c.title, year: c.year });
        if (enriched.tmdbId && seen.has(enriched.tmdbId)) continue;
        if (enriched.tmdbId) seen.add(enriched.tmdbId);
        mergedClassics.push(enriched);
        if (mergedClassics.length >= 6) break;
    }
    for (const c of classicHints) {
        if (mergedClassics.length >= 6) break;
        if (c.tmdbId && seen.has(c.tmdbId)) continue;
        if (c.tmdbId) seen.add(c.tmdbId);
        mergedClassics.push({
            title: c.title,
            year: c.year,
            tmdbId: c.tmdbId,
            posterPath: c.posterPath,
        });
    }

    const row = await prisma.cinePersona.upsert({
        where: { userId },
        create: {
            userId,
            title,
            bio,
            auraGenre,
            radar,
            classics: mergedClassics,
            sourceFingerprint: profile.sourceFingerprint,
        },
        update: {
            title,
            bio,
            auraGenre,
            radar,
            classics: mergedClassics,
            sourceFingerprint: profile.sourceFingerprint,
        },
    });

    return row;
}
