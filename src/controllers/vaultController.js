/**
 * Vault Controller – aggregates watchlist + reviews into a gamified "Cine-Vault" response.
 */

const getVaultData = (prisma) => async (req, res) => {
  try {
    const userId = Number(req.user.id);

    // Fetch all watchlist items with movie data
    const watchlistItems = await prisma.watchListItem.findMany({
      where: { userId },
      include: { movie: true },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all reviews by this user
    const reviews = await prisma.review.findMany({
      where: { userId },
    });

    // ── Group by primary genre ──
    const shelves = {};
    for (const item of watchlistItems) {
      const primaryGenre = item.movie.genre?.[0] || 'Uncategorized';
      if (!shelves[primaryGenre]) {
        shelves[primaryGenre] = { items: [], completed: 0, total: 0 };
      }
      shelves[primaryGenre].items.push(item);
      shelves[primaryGenre].total += 1;
      if (item.status === 'COMPLETED') {
        shelves[primaryGenre].completed += 1;
      }
    }

    // ── Compute milestones ──

    // Night Owl: 5+ items added after midnight (00:00–05:00 local-ish, we use UTC hour)
    const nightOwlCount = watchlistItems.filter((item) => {
      const hour = new Date(item.createdAt).getUTCHours();
      return hour >= 21 || hour < 5; // generous "night" window
    }).length;

    // Genre Master: 10+ completed in a single genre
    let genreMasterBest = { genre: null, progress: 0 };
    for (const [genre, shelf] of Object.entries(shelves)) {
      if (shelf.completed > genreMasterBest.progress) {
        genreMasterBest = { genre, progress: shelf.completed };
      }
    }

    // The Critic: 5+ reviews with text longer than 100 characters
    const longReviewCount = reviews.filter(
      (r) => r.text && r.text.length > 100
    ).length;

    const milestones = {
      nightOwl: {
        unlocked: nightOwlCount >= 5,
        progress: nightOwlCount,
        target: 5,
        label: 'Night Owl',
        description: 'Add 5+ movies after dark',
        icon: '🦉',
      },
      genreMaster: {
        unlocked: genreMasterBest.progress >= 10,
        progress: genreMasterBest.progress,
        target: 10,
        genre: genreMasterBest.genre,
        label: 'Genre Master',
        description: `Complete 10 movies in ${genreMasterBest.genre || 'a single genre'}`,
        icon: '🎬',
      },
      theCritic: {
        unlocked: longReviewCount >= 5,
        progress: longReviewCount,
        target: 5,
        label: 'The Critic',
        description: 'Write 5 in-depth reviews (100+ chars)',
        icon: '✍️',
      },
    };

    return res.status(200).json({ status: 'success', shelves, milestones });
  } catch (err) {
    console.error('Vault data error:', err);
    return res.status(500).json({ error: 'Failed to load vault data' });
  }
};

export { getVaultData };
