import React from 'react';
import { motion } from 'framer-motion';

/**
 * Interactive 10-star rating slider with color transitions:
 *  Red (1-4) → Yellow (5-7) → Green (8-10)
 */
export default function StarSlider({ value, onChange }) {
  const getColor = (rating) => {
    if (rating <= 4) return { bg: '#ef4444', glow: 'rgba(239,68,68,0.4)' };
    if (rating <= 7) return { bg: '#eab308', glow: 'rgba(234,179,8,0.4)' };
    return { bg: '#22c55e', glow: 'rgba(34,197,94,0.4)' };
  };

  const { bg, glow } = getColor(value);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }, (_, i) => {
          const starVal = i + 1;
          const isFilled = starVal <= value;
          return (
            <motion.button
              key={starVal}
              type="button"
              onClick={() => onChange(starVal)}
              whileHover={{ scale: 1.3, y: -2 }}
              whileTap={{ scale: 0.9 }}
              className="relative w-8 h-8 flex items-center justify-center text-lg cursor-pointer transition-colors duration-200"
              style={{ color: isFilled ? bg : 'rgba(255,255,255,0.15)' }}
            >
              <span className="relative z-10">★</span>
              {isFilled && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 rounded-full blur-sm opacity-40"
                  style={{ backgroundColor: bg }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: bg, boxShadow: `0 0 12px ${glow}` }}
            initial={{ width: 0 }}
            animate={{ width: `${(value / 10) * 100}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          />
        </div>
        <motion.span
          key={value}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-sm font-bold min-w-[2.5rem] text-center px-2 py-1 rounded-lg border"
          style={{ color: bg, borderColor: bg + '40', backgroundColor: bg + '10' }}
        >
          {value}/10
        </motion.span>
      </div>
    </div>
  );
}
