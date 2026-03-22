/**
 * Director's Cut timeline: completed watchlist + reviews, milestones, streak, monthly genres.
 */

function isoDay(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
}

function computeStreaks(completedIsoDates) {
    const days = [...new Set(completedIsoDates.map(isoDay).filter(Boolean))].sort();
    if (days.length === 0) return { currentDays: 0, longestDays: 0, currentWeeksApprox: 0 };

    let longest = 1;
    let run = 1;
    for (let i = 1; i < days.length; i++) {
        const prev = new Date(`${days[i - 1]}T12:00:00Z`);
        const curr = new Date(`${days[i]}T12:00:00Z`);
        const diff = Math.round((curr - prev) / 86400000);
        if (diff === 1) run += 1;
        else {
            longest = Math.max(longest, run);
            run = 1;
        }
    }
    longest = Math.max(longest, run);

    let current = 0;
    const set = new Set(days);
    const lastDay = days[days.length - 1];
    let cursor = new Date(`${lastDay}T12:00:00Z`);
    while (set.has(cursor.toISOString().slice(0, 10))) {
        current += 1;
        cursor.setDate(cursor.getDate() - 1);
    }

    return {
        currentDays: current,
        longestDays: longest,
        currentWeeksApprox: current > 0 ? Math.max(1, Math.floor(current / 7)) : 0,
    };
}

function topGenresForMonth(eventsInMonth) {
    const counts = new Map();
    for (const ev of eventsInMonth) {
        const genres = ev.genres || [];
        for (const g of genres) {
            const key = g?.trim() || 'Unknown';
            counts.set(key, (counts.get(key) || 0) + 1);
        }
    }
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genre, count]) => ({ genre, count }));
}

async function buildTimelinePayload(prisma, targetId) {
    const [items, reviews] = await Promise.all([
        prisma.watchListItem.findMany({
            where: { userId: targetId, status: 'COMPLETED' },
            include: { movie: true },
            orderBy: { updatedAt: 'asc' },
        }),
        prisma.review.findMany({
            where: { userId: targetId },
            select: { id: true, movieId: true, rating: true, text: true, createdAt: true },
        }),
    ]);

    const reviewByMovie = new Map(reviews.map((r) => [r.movieId, r]));

    const chronological = [...items].sort(
        (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt)
    );

    const events = chronological.map((item, index) => {
        const movie = item.movie;
        const rev = reviewByMovie.get(item.movieId);
        const completedAt = item.updatedAt.toISOString();
        const genres = Array.isArray(movie?.genre) ? movie.genre : [];
        const effectiveRating = rev?.rating ?? item.rating ?? null;

        return {
            kind: 'movie',
            index: index + 1,
            watchlistItemId: item.id,
            movieId: item.movieId,
            title: movie?.title ?? 'Unknown',
            year: movie?.year ?? null,
            posterPath: movie?.posterPath ?? null,
            genres,
            completedAt,
            watchlistRating: item.rating ?? null,
            review: rev
                ? {
                      id: rev.id,
                      rating: rev.rating,
                      createdAt: rev.createdAt.toISOString(),
                      hasText: Boolean(rev.text?.trim()),
                  }
                : null,
            effectiveRating,
        };
    });

    const milestones = [];
    if (events.length >= 100) {
        const ev = events[99];
        milestones.push({
            type: 'hundredth_movie',
            label: '100th movie watched',
            at: ev.completedAt,
            movieTitle: ev.title,
            movieId: ev.movieId,
        });
    }

    const firstPerfect = events.find((e) => e.review?.rating === 10 || e.watchlistRating === 10);
    if (firstPerfect) {
        milestones.push({
            type: 'first_perfect_ten',
            label: 'First 10/10 rating',
            at: firstPerfect.completedAt,
            movieTitle: firstPerfect.title,
            movieId: firstPerfect.movieId,
            reviewId: firstPerfect.review?.id ?? null,
        });
    }

    const streak = computeStreaks(events.map((e) => e.completedAt));

    const monthKeys = new Map();
    for (const ev of events) {
        const d = new Date(ev.completedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthKeys.has(key)) monthKeys.set(key, []);
        monthKeys.get(key).push(ev);
    }

    const monthlyMood = [...monthKeys.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, evs]) => {
            const [y, m] = key.split('-');
            return {
                key,
                year: Number(y),
                month: Number(m),
                label: new Date(Number(y), Number(m) - 1, 1).toLocaleString(undefined, {
                    month: 'long',
                    year: 'numeric',
                }),
                topGenres: topGenresForMonth(evs),
                count: evs.length,
            };
        });

    return {
        events,
        milestones,
        streak,
        monthlyMood,
        totalCompleted: events.length,
    };
}

export function getDirectorsTimeline(prisma) {
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
                return res.status(403).json({ error: 'Timeline is private for this user' });
            }
        }

        const data = await buildTimelinePayload(prisma, targetId);
        res.json({ status: 'success', data });
    };
}
