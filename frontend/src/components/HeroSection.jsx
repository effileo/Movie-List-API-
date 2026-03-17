import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, InfoIcon, StarIcon, XIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiRoutes } from '../api/client';

const CYCLE_INTERVAL_MS = 8000;

export default function HeroSection({ setHeroBackdrop }) {
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Video Modal State
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  
  const navigate = useNavigate();
  const timerRef = useRef(null);

  // Fetch top 5 trending movies on mount
  useEffect(() => {
    async function fetchHero() {
      try {
        setLoading(true);
        const data = await apiRoutes.movies.trending('week');
        const top5 = data?.results?.slice(0, 5) || [];
        if (top5.length > 0) {
          setMovies(top5);
          if (setHeroBackdrop) {
            setHeroBackdrop(top5[0].backdrop_path);
          }
        }
      } catch (err) {
        console.error("Failed to fetch hero movies:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHero();
  }, [setHeroBackdrop]);

  // Handle auto-cycling logic
  useEffect(() => {
    if (movies.length <= 1 || isVideoOpen) {
      clearInterval(timerRef.current);
      return;
    }
    
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % movies.length;
        if (setHeroBackdrop) setHeroBackdrop(movies[next].backdrop_path);
        return next;
      });
    }, CYCLE_INTERVAL_MS);

    return () => clearInterval(timerRef.current);
  }, [movies, isVideoOpen, setHeroBackdrop]);

  const handleDotClick = (index) => {
    setCurrentIndex(index);
    if (setHeroBackdrop) setHeroBackdrop(movies[index].backdrop_path);
    // Reset timer
    clearInterval(timerRef.current);
    if (!isVideoOpen) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % movies.length;
          if (setHeroBackdrop) setHeroBackdrop(movies[next].backdrop_path);
          return next;
        });
      }, CYCLE_INTERVAL_MS);
    }
  };

  const handleWatchTrailer = async () => {
    const movie = movies[currentIndex];
    if (!movie) return;
    
    try {
      const data = await apiRoutes.movies.videos(movie.id);
      // Find the first YouTube Trailer
      const trailer = data?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer');
      if (trailer) {
        setTrailerKey(trailer.key);
        setIsVideoOpen(true);
      } else {
        alert('No trailer available for this movie.');
      }
    } catch (err) {
      console.error("Failed to fetch trailer:", err);
      alert('Could not load trailer.');
    }
  };

  if (loading || movies.length === 0) {
    return (
      <div className="w-full h-[85vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-cinematic-accent border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const movie = movies[currentIndex];
  const title = movie.title || movie.name || movie.original_title;
  const rating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : null;
  const year = movie.release_date?.slice(0, 4);

  return (
    <section className="relative w-full h-[85vh] flex flex-col justify-end pb-24 px-6 md:px-16 z-10 overflow-hidden group">
      {/* 
        Linear gradient mask specifically for text protection.
        This ensures readability even if the current App.jsx backdrop is completely bright white.
      */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent pointer-events-none z-[-1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-cinematic-bg via-transparent to-transparent pointer-events-none z-[-1]" />

      <AnimatePresence mode="wait">
        <motion.div 
          key={movie.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl relative z-10 mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold tracking-widest text-[#92beff] uppercase backdrop-blur-md">
              Trending #{currentIndex + 1}
            </span>
            {rating && (
              <div className="flex items-center gap-1 text-yellow-400 font-bold drop-shadow-md">
                <StarIcon className="w-4 h-4 fill-current" /> {rating}
              </div>
            )}
            {year && <span className="text-white/70 font-medium drop-shadow-md">{year}</span>}
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
            {title}
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-10 leading-relaxed font-light drop-shadow-lg line-clamp-3">
            {movie.overview}
          </p>

          <div className="flex flex-wrap items-center gap-5">
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "#2563eb" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleWatchTrailer}
              className="flex items-center gap-3 px-8 py-4 rounded-full bg-cinematic-accent text-white font-bold tracking-wide shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-shadow"
            >
              <PlayIcon className="w-5 h-5 fill-current" /> Watch Trailer
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/movie/tmdb/${movie.id}`)}
              className="flex items-center gap-3 px-8 py-4 rounded-full bg-cinematic-surface border border-cinematic-border text-white font-bold tracking-wide backdrop-blur-md transition-colors"
            >
              <InfoIcon className="w-5 h-5" /> More Info
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Floating Pagination Bars */}
      <div className="absolute bottom-10 left-6 md:left-16 flex items-center gap-3 z-20">
        {movies.map((_, idx) => {
          const isActive = idx === currentIndex;
          const isPassed = idx < currentIndex;
          
          return (
            <button 
              key={idx} 
              onClick={() => handleDotClick(idx)}
              className="group/dot relative h-1.5 rounded-full overflow-hidden bg-white/20 transition-all duration-300"
              style={{ width: isActive ? '3rem' : '1.5rem' }}
            >
              <motion.div 
                className="absolute inset-y-0 left-0 bg-white"
                initial={false}
                animate={{ width: isActive ? '100%' : isPassed ? '100%' : '0%' }}
                transition={isActive ? { duration: CYCLE_INTERVAL_MS / 1000, ease: 'linear' } : { duration: 0.2 }}
              />
            </button>
          );
        })}
      </div>

      {/* Embedded Video Modal */}
      <AnimatePresence>
        {isVideoOpen && trailerKey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-12 backdrop-blur-xl"
          >
            <button 
              onClick={() => { setIsVideoOpen(false); setTrailerKey(null); }}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <XIcon className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-6xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            >
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&showinfo=0`}
                title="Trailer"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
