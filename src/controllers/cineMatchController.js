import { fetchTrendingMovies, fetchMovieById } from '../services/tmdb.js';

const TMDB_BASE = 'https://api.themoviedb.org/3';

async function discoverStack(genreIds, excludedTmdbIds = [], limit = 20) {
    const key = process.env.TMDB_API_KEY;
    if (!key) return [];
    let url = `${TMDB_BASE}/discover/movie?api_key=${key}&sort_by=popularity.desc&page=1&vote_count.gte=50&vote_average.gte=5`;
    if (genreIds?.length) url += `&with_genres=${genreIds.join(',')}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    let results = (data.results || []).filter(m => !excludedTmdbIds.includes(m.id));
    return results.slice(0, limit);
}

/**
 * GET /cine-match/friends – list users the current user follows (ACCEPTED) for the "Match with Friend" dropdown.
 */
export function getCineMatchFriends(prisma) {
    return async (req, res) => {
        try {
            const userId = req.user.id;
            const follows = await prisma.follow.findMany({
                where: { followerId: userId, status: 'ACCEPTED' },
                select: {
                    followedId: true,
                    followed: {
                        select: { id: true, name: true, avatarUrl: true },
                    },
                },
            });
            const friends = follows.map(f => ({
                id: f.followed.id,
                name: f.followed.name,
                avatarUrl: f.followed.avatarUrl,
            }));
            res.json({ data: friends });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to load friends' });
        }
    };
}

/**
 * GET /cine-match/stack – pre-load stack of movies for swiping (TMDB recommendations based on watchlist, or trending).
 * Returns { results: TMDB movie objects[] } so the client can show the next 5+ with zero delay.
 */
export function getCineMatchStack(prisma) {
    return async (req, res) => {
        try {
            const userId = req.user.id;
            const watchlist = await prisma.watchListItem.findMany({
                where: { userId },
                include: { movie: true },
            });
            const excludedTmdbIds = watchlist.map(item => item.movie.tmdbId).filter(Boolean);

            let results = [];
            const genreCounts = {};
            watchlist.forEach(item => {
                (item.movie.genre || []).forEach(g => {
                    genreCounts[g] = (genreCounts[g] || 0) + 1;
                });
            });
            const GENRE_MAP = {
                'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
                'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
                'Fantasy': 14, 'History': 36, 'Horror': 27, 'Music': 10402,
                'Mystery': 9648, 'Romance': 10749, 'Sci-Fi': 878,
                'Thriller': 53, 'War': 10752, 'Western': 37,
            };
            const sortedGenres = Object.entries(genreCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([name]) => GENRE_MAP[name])
                .filter(Boolean);
            const topGenreIds = sortedGenres.slice(0, 2);

            if (topGenreIds.length > 0) {
                results = await discoverStack(topGenreIds, excludedTmdbIds, 25);
            }
            if (results.length < 10) {
                const trending = await fetchTrendingMovies('week', 1);
                const trend = (trending.results || []).filter(m => !excludedTmdbIds.includes(m.id));
                const seen = new Set(results.map(m => m.id));
                trend.forEach(m => {
                    if (!seen.has(m.id) && results.length < 25) {
                        seen.add(m.id);
                        results.push(m);
                    }
                });
            }
            res.json({ results: results.slice(0, 25) });
        } catch (err) {
            console.error(err);
            res.status(502).json({ error: 'Failed to load stack' });
        }
    };
}

/**
 * POST /cine-match/swipe – record like/dislike and check for match with selected friend.
 * Body: { tmdbId: number, direction: 'like' | 'dislike', friendId?: number }
 * If direction is 'like': upsert cineMatchLike. If friendId provided and friend has liked same tmdbId, return isMatch + friend + movie details.
 */
export function postCineMatchSwipe(prisma) {
    return async (req, res) => {
        try {
            const userId = req.user.id;
            const { tmdbId, direction, friendId } = req.body;
            if (tmdbId == null || !['like', 'dislike'].includes(direction)) {
                return res.status(400).json({ error: 'tmdbId and direction (like|dislike) required' });
            }
            const tid = parseInt(tmdbId, 10);
            if (Number.isNaN(tid)) return res.status(400).json({ error: 'Invalid tmdbId' });

            if (direction === 'like') {
                await prisma.cineMatchLike.upsert({
                    where: {
                        userId_tmdbId: { userId, tmdbId: tid },
                    },
                    create: { userId, tmdbId: tid },
                    update: {},
                });
            } else {
                await prisma.cineMatchLike.deleteMany({
                    where: { userId, tmdbId: tid },
                });
            }

            let isMatch = false;
            let friend = null;
            let movie = null;

            if (direction === 'like' && friendId != null) {
                const fid = parseInt(friendId, 10);
                if (!Number.isNaN(fid) && fid !== userId) {
                    const friendLike = await prisma.cineMatchLike.findUnique({
                        where: { userId_tmdbId: { userId: fid, tmdbId: tid } },
                    });
                    if (friendLike) {
                        isMatch = true;
                        const followed = await prisma.user.findUnique({
                            where: { id: fid },
                            select: { id: true, name: true, avatarUrl: true },
                        });
                        friend = followed;
                        try {
                            movie = await fetchMovieById(tid);
                        } catch (_) {
                            movie = { id: tid, title: 'Movie', poster_path: null, overview: '', vote_average: 0 };
                        }
                    }
                }
            }

            res.json({
                isMatch,
                friend: friend || undefined,
                movie: movie || undefined,
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Swipe failed' });
        }
    };
}

/**
 * POST /cine-match/invite – send Cine-Match invite to a friend (toUserId).
 * Creates or resets invite to PENDING.
 */
export function postCineMatchInvite(prisma) {
    return async (req, res) => {
        try {
            const userId = req.user.id;
            const toUserId = parseInt(req.body.toUserId, 10);
            if (Number.isNaN(toUserId) || toUserId === userId) {
                return res.status(400).json({ error: 'Invalid toUserId' });
            }
            const follow = await prisma.follow.findUnique({
                where: { followerId_followedId: { followerId: userId, followedId: toUserId } },
            });
            if (!follow || follow.status !== 'ACCEPTED') {
                return res.status(403).json({ error: 'You can only invite users you follow' });
            }
            await prisma.cineMatchInvite.upsert({
                where: { fromUserId_toUserId: { fromUserId: userId, toUserId } },
                create: { fromUserId: userId, toUserId, status: 'PENDING' },
                update: { status: 'PENDING' },
            });
            res.json({ status: 'success', message: 'Invite sent' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to send invite' });
        }
    };
}

/**
 * GET /cine-match/invites/pending – list pending invites I received (toUserId = me).
 */
export function getCineMatchInvitesPending(prisma) {
    return async (req, res) => {
        try {
            const userId = req.user.id;
            const invites = await prisma.cineMatchInvite.findMany({
                where: { toUserId: userId, status: 'PENDING' },
                select: {
                    fromUserId: true,
                    fromUser: { select: { id: true, name: true, avatarUrl: true } },
                },
            });
            res.json({ data: invites.map(i => ({ fromUserId: i.fromUserId, user: i.fromUser })) });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to load invites' });
        }
    };
}

/**
 * POST /cine-match/invites/accept/:fromUserId – accept invite from fromUserId.
 */
export function postCineMatchInviteAccept(prisma) {
    return async (req, res) => {
        try {
            const userId = req.user.id;
            const fromUserId = parseInt(req.params.fromUserId, 10);
            if (Number.isNaN(fromUserId)) {
                return res.status(400).json({ error: 'Invalid fromUserId' });
            }
            const invite = await prisma.cineMatchInvite.findUnique({
                where: { fromUserId_toUserId: { fromUserId, toUserId: userId } },
            });
            if (!invite || invite.status !== 'PENDING') {
                return res.status(404).json({ error: 'Invite not found or already accepted' });
            }
            await prisma.cineMatchInvite.update({
                where: { fromUserId_toUserId: { fromUserId, toUserId: userId } },
                data: { status: 'ACCEPTED' },
            });
            res.json({ status: 'success', message: 'Invite accepted' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to accept invite' });
        }
    };
}

/**
 * GET /cine-match/partner-status/:friendId – status of session with this friend.
 * Returns { status: 'accepted' | 'pending_sent' | 'pending_received' | 'none' }
 * so the client can show "Matching with X", "Send Invite", or "Waiting for X to join...".
 */
export function getCineMatchPartnerStatus(prisma) {
    return async (req, res) => {
        try {
            const userId = req.user.id;
            const friendId = parseInt(req.params.friendId, 10);
            if (Number.isNaN(friendId)) {
                return res.status(400).json({ error: 'Invalid friendId' });
            }
            const sent = await prisma.cineMatchInvite.findUnique({
                where: { fromUserId_toUserId: { fromUserId: userId, toUserId: friendId } },
            });
            const received = await prisma.cineMatchInvite.findUnique({
                where: { fromUserId_toUserId: { fromUserId: friendId, toUserId: userId } },
            });
            if (sent?.status === 'ACCEPTED' || received?.status === 'ACCEPTED') {
                return res.json({ status: 'accepted' });
            }
            if (sent?.status === 'PENDING') {
                return res.json({ status: 'pending_sent' });
            }
            if (received?.status === 'PENDING') {
                return res.json({ status: 'pending_received' });
            }
            res.json({ status: 'none' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to get partner status' });
        }
    };
}
