import { fetchTrendingMovies, fetchMovieById } from '../services/tmdb.js';
import { emitToUser } from '../realtime/emit.js';

const TMDB_BASE = 'https://api.themoviedb.org/3';

/** True if either user follows the other with an accepted follow (Cine-Match “connected”). */
async function hasAcceptedFollowPair(prisma, userId, otherUserId) {
    const [out, inc] = await Promise.all([
        prisma.follow.findUnique({
            where: { followerId_followedId: { followerId: userId, followedId: otherUserId } },
        }),
        prisma.follow.findUnique({
            where: { followerId_followedId: { followerId: otherUserId, followedId: userId } },
        }),
    ]);
    return (
        (out?.status === 'ACCEPTED') ||
        (inc?.status === 'ACCEPTED')
    );
}

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

export function getCineMatchFriends(prisma) {
    return async (req, res) => {
        try {
            const userId = req.user.id;
            // People I follow (accepted) + people who follow me (accepted) — either direction counts as “connected”
            const [outgoing, incoming] = await Promise.all([
                prisma.follow.findMany({
                    where: { followerId: userId, status: 'ACCEPTED' },
                    select: {
                        followed: {
                            select: { id: true, name: true, avatarUrl: true },
                        },
                    },
                }),
                prisma.follow.findMany({
                    where: { followedId: userId, status: 'ACCEPTED' },
                    select: {
                        follower: {
                            select: { id: true, name: true, avatarUrl: true },
                        },
                    },
                }),
            ]);
            const byId = new Map();
            outgoing.forEach((row) => {
                const u = row.followed;
                byId.set(u.id, { id: u.id, name: u.name, avatarUrl: u.avatarUrl });
            });
            incoming.forEach((row) => {
                const u = row.follower;
                byId.set(u.id, { id: u.id, name: u.name, avatarUrl: u.avatarUrl });
            });
            const friends = Array.from(byId.values()).sort((a, b) =>
                (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
            );
            res.json({ data: friends });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to load friends' });
        }
    };
}

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
 * GET /cine-match/session/active – current user's active Cine-Match session (if any).
 */
export function getCineMatchActiveSession(prisma) {
    return async (req, res) => {
        try {
            const userId = req.user.id;
            const now = new Date();
            const session = await prisma.cineMatchSession.findFirst({
                where: {
                    status: 'ACTIVE',
                    expiresAt: { gt: now },
                    OR: [{ user1Id: userId }, { user2Id: userId }],
                },
                orderBy: { createdAt: 'desc' },
            });
            if (!session) {
                return res.json({ session: null });
            }
            const partnerId = session.user1Id === userId ? session.user2Id : session.user1Id;
            const partner = await prisma.user.findUnique({
                where: { id: partnerId },
                select: { id: true, name: true, avatarUrl: true },
            });
            res.json({
                session: {
                    id: session.id,
                    partnerId,
                    partner,
                    expiresAt: session.expiresAt,
                },
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to load session' });
        }
    };
}

/**
 * POST /cine-match/swipe – like/dislike; optional sessionId for session-scoped matching + real-time partner sync.
 */
export function postCineMatchSwipe(prisma) {
    return async (req, res) => {
        try {
            const userId = req.user.id;
            const { tmdbId, direction, friendId, sessionId: bodySessionId } = req.body;
            if (tmdbId == null || !['like', 'dislike'].includes(direction)) {
                return res.status(400).json({ error: 'tmdbId and direction (like|dislike) required' });
            }
            const tid = parseInt(tmdbId, 10);
            if (Number.isNaN(tid)) return res.status(400).json({ error: 'Invalid tmdbId' });

            if (bodySessionId) {
                const sess = await prisma.cineMatchSession.findUnique({
                    where: { id: bodySessionId },
                });
                if (!sess || sess.status !== 'ACTIVE' || sess.expiresAt < new Date()) {
                    return res.status(400).json({ error: 'Invalid or expired session' });
                }
                if (userId !== sess.user1Id && userId !== sess.user2Id) {
                    return res.status(403).json({ error: 'Not in this session' });
                }
                const partnerId = sess.user1Id === userId ? sess.user2Id : sess.user1Id;

                if (direction === 'like') {
                    await prisma.cineMatchSessionSwipe.upsert({
                        where: {
                            sessionId_userId_tmdbId: {
                                sessionId: bodySessionId,
                                userId,
                                tmdbId: tid,
                            },
                        },
                        create: { sessionId: bodySessionId, userId, tmdbId: tid },
                        update: {},
                    });
                } else {
                    await prisma.cineMatchSessionSwipe.deleteMany({
                        where: { sessionId: bodySessionId, userId, tmdbId: tid },
                    });
                }

                let isMatch = false;
                let friend = null;
                let movie = null;

                if (direction === 'like') {
                    const partnerSwipe = await prisma.cineMatchSessionSwipe.findUnique({
                        where: {
                            sessionId_userId_tmdbId: {
                                sessionId: bodySessionId,
                                userId: partnerId,
                                tmdbId: tid,
                            },
                        },
                    });
                    if (partnerSwipe) {
                        isMatch = true;
                        friend = await prisma.user.findUnique({
                            where: { id: partnerId },
                            select: { id: true, name: true, avatarUrl: true },
                        });
                        try {
                            movie = await fetchMovieById(tid);
                        } catch (_) {
                            movie = { id: tid, title: 'Movie', poster_path: null, overview: '', vote_average: 0 };
                        }
                    }
                }

                emitToUser(partnerId, 'cine_match:partner_swiped', {
                    sessionId: bodySessionId,
                    tmdbId: tid,
                    direction,
                    fromUserId: userId,
                });

                return res.json({
                    isMatch,
                    friend: friend || undefined,
                    movie: movie || undefined,
                    sessionId: bodySessionId,
                });
            }

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
                        friend = await prisma.user.findUnique({
                            where: { id: fid },
                            select: { id: true, name: true, avatarUrl: true },
                        });
                        try {
                            movie = await fetchMovieById(tid);
                        } catch (_) {
                            movie = { id: tid, title: 'Movie', poster_path: null, overview: '', vote_average: 0 };
                        }
                    }
                    emitToUser(fid, 'cine_match:partner_swiped', {
                        tmdbId: tid,
                        direction,
                        fromUserId: userId,
                    });
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

export function postCineMatchInvite(prisma) {
    return async (req, res) => {
        try {
            const userId = req.user.id;
            const toUserId = parseInt(req.body.toUserId, 10);
            if (Number.isNaN(toUserId) || toUserId === userId) {
                return res.status(400).json({ error: 'Invalid toUserId' });
            }
            const connected = await hasAcceptedFollowPair(prisma, userId, toUserId);
            if (!connected) {
                return res.status(403).json({
                    error: 'You can only invite people you’re connected with (accepted follow in either direction).',
                });
            }

            const sender = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true },
            });

            await prisma.cineMatchInvite.upsert({
                where: { fromUserId_toUserId: { fromUserId: userId, toUserId } },
                create: { fromUserId: userId, toUserId, status: 'PENDING' },
                update: { status: 'PENDING', sessionId: null },
            });

            await prisma.notification.deleteMany({
                where: {
                    userId: toUserId,
                    fromUserId: userId,
                    type: 'CINE_MATCH_INVITE',
                    isRead: false,
                },
            });

            const notif = await prisma.notification.create({
                data: {
                    userId: toUserId,
                    type: 'CINE_MATCH_INVITE',
                    fromUserId: userId,
                    message: `${sender.name} wants to match movies with you!`,
                    isRead: false,
                    data: { fromUserId: userId },
                },
                include: {
                    fromUser: { select: { id: true, name: true, avatarUrl: true } },
                },
            });

            const unreadCount = await prisma.notification.count({
                where: { userId: toUserId, isRead: false },
            });

            emitToUser(toUserId, 'notification:new', {
                notification: notif,
                unreadCount,
            });

            res.json({ status: 'success', message: 'Invite sent', notificationId: notif.id });
        } catch (err) {
            console.error('postCineMatchInvite:', err);
            const msg = err?.message || 'Failed to send invite';
            res.status(500).json({ error: msg });
        }
    };
}

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

            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const u1 = Math.min(fromUserId, userId);
            const u2 = Math.max(fromUserId, userId);

            const session = await prisma.$transaction(async (tx) => {
                const sess = await tx.cineMatchSession.create({
                    data: {
                        user1Id: u1,
                        user2Id: u2,
                        status: 'ACTIVE',
                        expiresAt,
                    },
                });
                await tx.cineMatchInvite.update({
                    where: { fromUserId_toUserId: { fromUserId, toUserId: userId } },
                    data: { status: 'ACCEPTED', sessionId: sess.id },
                });
                await tx.notification.updateMany({
                    where: {
                        userId,
                        fromUserId,
                        type: 'CINE_MATCH_INVITE',
                    },
                    data: { isRead: true },
                });
                return sess;
            });

            const partner = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, name: true, avatarUrl: true },
            });

            emitToUser(fromUserId, 'cine_match:partner_joined', {
                sessionId: session.id,
                partnerId: userId,
                partner,
            });

            const unreadA = await prisma.notification.count({
                where: { userId: fromUserId, isRead: false },
            });
            emitToUser(fromUserId, 'notifications:refresh', { unreadCount: unreadA });

            res.json({ status: 'success', message: 'Invite accepted', sessionId: session.id });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to accept invite' });
        }
    };
}

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
                const inv = sent?.status === 'ACCEPTED' ? sent : received;
                return res.json({ status: 'accepted', sessionId: inv?.sessionId ?? null });
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
