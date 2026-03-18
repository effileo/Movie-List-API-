import React from 'react';
import { motion } from 'framer-motion';

/**
 * Horizontal strip of 3D achievement badge cards.
 * Each badge shows icon, label, description, and progress.
 */
export default function MilestoneTracker({ milestones }) {
  if (!milestones) return null;

  const badges = Object.entries(milestones);

  return (
    <div className="milestone-strip">
      {badges.map(([key, m], i) => (
        <motion.div
          key={key}
          className={`milestone-badge ${m.unlocked ? 'unlocked' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15, duration: 0.5 }}
          whileHover={{ scale: 1.03, y: -4 }}
        >
          <span className="milestone-icon">{m.icon}</span>
          <span className="milestone-label">
            {m.unlocked ? '🔓 ' : '🔒 '}
            {m.label}
          </span>
          <span className="milestone-desc">{m.description}</span>
          <div className="milestone-progress-bar">
            <div
              className="milestone-progress-fill"
              style={{ width: `${Math.min((m.progress / m.target) * 100, 100)}%` }}
            />
          </div>
          <span className="milestone-progress-text">
            {m.progress}/{m.target}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
