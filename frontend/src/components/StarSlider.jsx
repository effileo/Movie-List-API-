import React from 'react';
import { motion } from 'framer-motion';

/**
 * Interactive 10-star rating slider. Uses single accent (Cine-Red) for filled state.
 */
export default function StarSlider({ value, onChange }) {
  const accent = '#e11d48'; /* cinematic-accent */
  const bg = accent;
  const glow = 'rgba(0,0,0,0.3)';

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
              style={{ color: isFilled ? accent : 'rgba(255,255,255,0.15)' }}
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
            style={{ backgroundColor: accent, boxShadow: '0 0 40px -15px rgba(0,0,0,0.5)' }}
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
          style={{ color: accent, borderColor: 'rgba(225,29,72,0.4)', backgroundColor: 'rgba(225,29,72,0.1)' }}
        >
          {value}/10
        </motion.span>
      </div>
    </div>
  );
}
