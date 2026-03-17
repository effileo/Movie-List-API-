import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from 'lucide-react';

// Hardcoded matching GENRE_MAP from backend
const GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' }, 
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' }, 
  { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' }, { id: 14, name: 'Fantasy' }, 
  { id: 36, name: 'History' }, { id: 27, name: 'Horror' }, { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' }, { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' }, { id: 10752, name: 'War' }, { id: 37, name: 'Western' }
];

export default function GenreSurvey({ onSubmit }) {
  const [selected, setSelected] = useState([]);

  const toggleGenre = (id) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(gId => gId !== id)
        : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleKickstart = () => {
    if (selected.length === 3) {
      onSubmit(selected);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto py-12 px-6 flex flex-col items-center text-center bg-cinematic-surface rounded-3xl border border-cinematic-border/50 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-cinematic-accent/20 rounded-full blur-[100px]" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />
      
      <div className="relative z-10 w-full">
        <h2 className="text-3xl md:text-5xl font-black mb-4 text-white drop-shadow-lg">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cinematic-accent to-purple-400">For You</span>
        </h2>
        <p className="text-lg text-cinematic-muted max-w-xl mx-auto mb-8 font-light">
          Your watchlist is empty. Pick your top 3 favorite genres below to kickstart our AI recommendation engine.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {GENRES.map(genre => {
            const isSelected = selected.includes(genre.id);
            const isMaxedOut = selected.length >= 3 && !isSelected;
            
            return (
              <motion.button
                whileHover={{ scale: isMaxedOut ? 1 : 1.05 }}
                whileTap={{ scale: isMaxedOut ? 1 : 0.95 }}
                key={genre.id}
                onClick={() => toggleGenre(genre.id)}
                disabled={isMaxedOut}
                className={`
                  relative px-5 py-3 rounded-xl font-semibold tracking-wide transition-all duration-300
                  ${isSelected 
                    ? 'bg-cinematic-accent border border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                  }
                  ${isMaxedOut && 'opacity-50 cursor-not-allowed'}
                `}
              >
                {isSelected && (
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-md"
                  >
                    <CheckIcon className="w-3 h-3" />
                  </motion.div>
                )}
                {genre.name}
              </motion.button>
            );
          })}
        </div>

        <motion.button
          whileHover={{ scale: selected.length === 3 ? 1.05 : 1 }}
          whileTap={{ scale: selected.length === 3 ? 0.95 : 1 }}
          onClick={handleKickstart}
          disabled={selected.length < 3}
          className={`
            px-10 py-4 rounded-full font-black text-lg tracking-widest uppercase transition-all duration-500
            ${selected.length === 3 
              ? 'bg-gradient-to-r from-cinematic-accent to-purple-600 text-white shadow-[0_0_40px_rgba(59,130,246,0.5)] shadow-purple-500/30' 
              : 'bg-white/10 text-white/30 cursor-not-allowed'}
          `}
        >
          {selected.length < 3 ? `Pick ${3 - selected.length} more` : 'Generate Recommendations'}
        </motion.button>
      </div>
    </motion.div>
  );
}
