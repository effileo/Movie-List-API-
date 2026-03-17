import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartIcon, XIcon, StarIcon, PlayIcon } from 'lucide-react';
import { posterUrl, TMDB_IMG } from '../api/client';
import { useNavigate } from 'react-router-dom';

function MovieQuickViewModal({ movie, onClose }) {
  const navigate = useNavigate();
  if (!movie) return null;

  const bgUrl = movie.backdrop_path 
    ? `${TMDB_IMG}${movie.backdrop_path}` 
    : posterUrl(movie.poster_path);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        // Close if click outside modal content
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-cinematic-bg rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row"
        >
          {/* Left/Top blurred high-res backdrop */}
          <div className="w-full md:w-2/5 h-64 md:h-auto relative shrink-0">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${bgUrl})` }}
            />
            {/* Gradient mask to blend nicely */}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-cinematic-bg via-transparent to-transparent" />
          </div>

          {/* Content Area */}
          <div className="p-8 md:p-12 flex flex-col justify-center w-full relative z-10">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <XIcon className="w-5 h-5 text-white/70" />
            </button>

            {/* Similarity Score / "Why" badge */}
            <div className="flex items-center gap-3 mb-6">
              {movie.similarityScore && (
                <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 font-bold tracking-wide text-sm">
                  {movie.similarityScore === 'SURPRISE' ? 'SURPRISE PICK' : `${movie.similarityScore}% Match`}
                </span>
              )}
              {movie.whyBadge && (
                <span className="text-white/50 text-sm font-medium tracking-wide">
                  {movie.whyBadge}
                </span>
              )}
            </div>

            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-md">
              {movie.title || movie.name}
            </h2>
            
            <p className="text-cinematic-muted text-lg leading-relaxed mb-8 line-clamp-4">
              {movie.overview}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-auto">
              <button 
                onClick={() => navigate(`/movie/tmdb/${movie.id}`)}
                className="px-8 py-4 rounded-full bg-cinematic-accent hover:bg-blue-600 text-white font-bold tracking-widest uppercase transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2"
              >
                <PlayIcon className="w-4 h-4 fill-current" /> Go to Details
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function BentoGrid({ recommendations }) {
  const [selectedMovie, setSelectedMovie] = useState(null);

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 w-full auto-rows-[250px] md:auto-rows-[300px]">
        {recommendations.map((rec, idx) => {
          // Make the very first recommendation huge
          const isPrimary = idx === 0;
          
          return (
            <motion.div
              layoutId={`bento-card-${rec.id}`}
              onClick={() => setSelectedMovie(rec)}
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
              key={rec.id}
              className={`
                relative overflow-hidden rounded-3xl bg-cinematic-surface border border-white/5 cursor-pointer shadow-lg group
                ${isPrimary ? 'md:col-span-2 md:row-span-2' : ''}
              `}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                style={{ 
                  backgroundImage: `url(${posterUrl(rec.poster_path)})`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-2">
                   {rec.vote_average > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold text-yellow-400 bg-black/50 px-2 py-1 rounded-md backdrop-blur-md">
                        <StarIcon className="w-3 h-3 fill-current" /> {rec.vote_average.toFixed(1)}
                      </span>
                   )}
                   {rec.whyBadge && (
                     <span className="text-[10px] font-bold tracking-widest text-[#92beff] uppercase px-2 py-1 bg-white/10 rounded-md backdrop-blur-md truncate max-w-[150px]">
                       {rec.whyBadge}
                     </span>
                   )}
                </div>
                <h3 className={`font-black text-white leading-tight drop-shadow-md ${isPrimary ? 'text-3xl md:text-5xl' : 'text-xl'}`}>
                  {rec.title}
                </h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      <MovieQuickViewModal 
        movie={selectedMovie} 
        onClose={() => setSelectedMovie(null)} 
      />
    </>
  );
}
