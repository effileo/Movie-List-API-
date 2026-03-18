import React from 'react';
import { motion } from 'framer-motion';

/**
 * Glassmorphic SVG circular progress ring.
 * Glows when the collection is 100% complete.
 */
export default function ProgressRing({ completed, total, label }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(completed / total, 1) : 0;
  const offset = circumference * (1 - pct);
  const isComplete = total > 0 && completed >= total;

  // Color based on completion
  const strokeColor = isComplete
    ? '#22c55e'
    : pct > 0.5
      ? '#60a5fa'
      : '#8b5cf6';

  return (
    <div className="progress-ring-wrapper">
      <div className={`progress-ring-container ${isComplete ? 'complete' : ''}`}>
        <svg className="progress-ring-svg" viewBox="0 0 64 64">
          <circle className="progress-ring-bg" cx="32" cy="32" r={radius} />
          <motion.circle
            className="progress-ring-fg"
            cx="32"
            cy="32"
            r={radius}
            stroke={strokeColor}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="progress-ring-text">
          {completed}/{total}
        </div>
      </div>
      {label && <span className="progress-ring-label">{label}</span>}
    </div>
  );
}
