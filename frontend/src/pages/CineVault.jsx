import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiRoutes } from '../api/client';
import VaultShelf from '../components/vault/VaultShelf';
import MilestoneTracker from '../components/vault/MilestoneTracker';
import './CineVault.css';

/**
 * Cine-Vault – the gamified 3D movie collection page.
 * Displays the user's watchlist as genre-themed shelves with Blu-ray cases,
 * achievement milestones, and progress trackers.
 */
export default function CineVault() {
  const [shelves, setShelves] = useState(null);
  const [milestones, setMilestones] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRoutes.watchlist.vault();
        setShelves(data.shelves || {});
        setMilestones(data.milestones || {});
      } catch (err) {
        setError(err.message || 'Failed to load vault');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Handle status updates from BluRayCase — update local state
  const handleStatusUpdate = useCallback((itemId, newStatus) => {
    setShelves((prev) => {
      if (!prev) return prev;
      const updated = {};
      for (const [genre, shelf] of Object.entries(prev)) {
        const newItems = shelf.items.map((item) =>
          item.id === itemId ? { ...item, status: newStatus } : item
        );
        const newCompleted = newItems.filter((i) => i.status === 'COMPLETED').length;
        updated[genre] = { ...shelf, items: newItems, completed: newCompleted };
      }
      return updated;
    });
  }, []);

  if (loading) {
    return (
      <div className="vault-page">
        <div className="vault-header">
          <h1 className="vault-title">Cine-Vault</h1>
          <p className="vault-subtitle">Loading your collection...</p>
        </div>
        {/* Skeleton shelves */}
        {[1, 2].map((n) => (
          <div key={n} style={{ marginBottom: '2rem' }}>
            <div style={{ height: 24, width: 120, borderRadius: 8, background: 'rgba(255,255,255,0.05)', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ width: 140, height: 210, borderRadius: 8, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="vault-page">
        <div className="vault-header">
          <h1 className="vault-title">Cine-Vault</h1>
        </div>
        <p style={{ color: '#f87171', textAlign: 'center' }}>{error}</p>
      </div>
    );
  }

  const genreKeys = Object.keys(shelves || {});
  const isEmpty = genreKeys.length === 0;

  return (
    <div className="vault-page">
      {/* Header */}
      <motion.div
        className="vault-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="vault-title">Cine-Vault</h1>
        <p className="vault-subtitle">Your personal 3D movie collection &amp; achievements</p>
      </motion.div>

      {/* Milestone Badges */}
      <MilestoneTracker milestones={milestones} />

      {/* Shelves or Empty State */}
      {isEmpty ? (
        <motion.div
          className="vault-empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="vault-empty-icon">📦</div>
          <h2>Your vault is empty</h2>
          <p>Add movies to your watchlist and they'll appear as Blu-ray cases here.</p>
          <Link to="/search">Discover Movies</Link>
        </motion.div>
      ) : (
        genreKeys.map((genre, i) => (
          <motion.div
            key={genre}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <VaultShelf
              genre={genre}
              shelf={shelves[genre]}
              onStatusUpdate={handleStatusUpdate}
            />
          </motion.div>
        ))
      )}
    </div>
  );
}
