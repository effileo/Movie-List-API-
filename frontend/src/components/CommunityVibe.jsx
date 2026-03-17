import React from 'react';
import { motion } from 'framer-motion';

/**
 * Community Vibe card — shows rating distribution bar chart and top tags.
 * Props: distribution (array of {rating, count}), aggregate ({averageRating, count})
 */
const TOP_TAGS_MAP = {
  9: ['Masterpiece', 'Must Watch'],
  8: ['Excellent', 'Highly Recommended'],
  7: ['Great', 'Worth Watching'],
  6: ['Good', 'Entertaining'],
  5: ['Decent', 'Mixed Feelings'],
  4: ['Below Average'],
  3: ['Disappointing'],
  2: ['Poor', 'Slow Burn'],
  1: ['Skip It'],
};

function getBarColor(rating) {
  if (rating <= 4) return '#ef4444';
  if (rating <= 7) return '#eab308';
  return '#22c55e';
}

function getTopTags(avg) {
  if (!avg) return [];
  const rounded = Math.round(avg);
  const clamped = Math.max(1, Math.min(9, rounded));
  return TOP_TAGS_MAP[clamped] || [];
}

export default function CommunityVibe({ distribution = [], aggregate }) {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);
  const tags = getTopTags(aggregate?.averageRating);

  return (
    <div className="p-6 rounded-2xl border border-slate-800 bg-white/[0.02] backdrop-blur-sm">
      <h3 className="text-lg font-bold mb-1 text-white flex items-center gap-2">
        <span className="text-2xl">🎭</span> Community Vibe
      </h3>
      {aggregate && (
        <p className="text-cinematic-muted text-sm mb-5">
          {aggregate.count} review{aggregate.count !== 1 ? 's' : ''} · Avg{' '}
          <span className="font-bold text-white">{aggregate.averageRating?.toFixed(1)}</span>
        </p>
      )}

      {/* Rating Distribution Bar Chart */}
      <div className="flex flex-col gap-1.5 mb-6">
        {distribution.map((d) => (
          <div key={d.rating} className="flex items-center gap-2">
            <span className="text-xs text-cinematic-muted w-4 text-right font-mono">{d.rating}</span>
            <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(d.count / maxCount) * 100}%` }}
                transition={{ duration: 0.6, delay: d.rating * 0.05, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  backgroundColor: getBarColor(d.rating),
                  boxShadow: d.count > 0 ? `0 0 8px ${getBarColor(d.rating)}40` : 'none',
                }}
              />
            </div>
            <span className="text-xs text-cinematic-muted w-6 font-mono">{d.count}</span>
          </div>
        ))}
      </div>

      {/* Top Tags */}
      {tags.length > 0 && (
        <div>
          <p className="text-xs text-cinematic-muted mb-2 uppercase tracking-wider font-semibold">Top Tags</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs font-medium border border-cinematic-accent/30 bg-cinematic-accent/10 text-cinematic-accent backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
