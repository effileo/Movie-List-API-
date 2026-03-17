import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityIcon } from 'lucide-react';
import { apiRoutes } from '../api/client';
import FeedCard from './FeedCard';

/**
 * ActivityFeed — Vertical scrollable "Social Pulse" feed.
 * Polls the backend every 15 seconds for new activity.
 */
export default function ActivityFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  async function fetchFeed() {
    try {
      const res = await apiRoutes.feed.activity(20);
      setItems(res.data ?? []);
    } catch {
      // silently fail on polling errors
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFeed();
    // Poll every 15 seconds for real-time feel
    intervalRef.current = setInterval(fetchFeed, 15000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <ActivityIcon className="w-5 h-5 text-cinematic-accent" />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        </div>
        <h2 className="text-xl font-bold text-white tracking-wide">Social Pulse</h2>
        <span className="text-xs text-cinematic-muted bg-white/5 px-2 py-0.5 rounded-full">Live</span>
      </div>

      {/* Feed Items */}
      <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto hide-scroll pr-1">
        {loading ? (
          // Skeleton loaders
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white/[0.02] border border-slate-800 animate-pulse" />
          ))
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-cinematic-muted text-sm">
            <p>No activity yet. Be the first to review a movie!</p>
          </div>
        ) : (
          <AnimatePresence>
            {items.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
