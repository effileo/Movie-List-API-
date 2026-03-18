import React from 'react';
import { motion } from 'framer-motion';
import BluRayCase from './BluRayCase';
import ProgressRing from './ProgressRing';

/**
 * A single genre shelf in the vault.
 * Uses CSS preserve-3d for the 3D shelf look.
 * Applies dynamic theme classes based on genre.
 */

const GENRE_THEME_MAP = {
  'Horror':    'horror',
  'Sci-Fi':    'sci-fi',
  'Science Fiction': 'sci-fi',
  'Comedy':    'comedy',
  'Romance':   'romance',
  'Action':    'action',
  'Animation': 'animation',
  'Thriller':  'horror',
};

function getShelfTheme(genre) {
  return GENRE_THEME_MAP[genre] || 'default';
}

export default function VaultShelf({ genre, shelf, onStatusUpdate }) {
  const theme = getShelfTheme(genre);

  return (
    <motion.div
      className={`vault-shelf shelf-theme-${theme}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="shelf-header">
        <span className="shelf-genre-tag">{genre}</span>
        <div className="shelf-divider" />
        <ProgressRing
          completed={shelf.completed}
          total={shelf.total}
          label="Watched"
        />
      </div>

      <div className="shelf-surface">
        {shelf.items.map((item) => (
          <BluRayCase
            key={item.id}
            item={item}
            onStatusUpdate={onStatusUpdate}
          />
        ))}
      </div>
    </motion.div>
  );
}
