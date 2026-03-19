import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { PlusIcon, StarIcon, CheckIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRoutes, TMDB_IMG } from '../api/client';

export default function MovieRow({ endpoint, onHoverBackdrop }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const rowRef = useRef(null);

  useEffect(() => {
    async function fetchMovies() {
      try {
        setLoading(true);
        // Custom hacky fetch since we pass endpoints directly in App currently
        // Alternatively, use apiRoutes.movies.popular if endpoint includes 'popular'
        let data;
        if (endpoint.includes('trending')) {
          data = await apiRoutes.movies.trending('week');
        } else {
          data = await apiRoutes.movies.popular(1);
        }
        
        if (data?.results) {
          setMovies(data.results.slice(0, 15));
        }
      } catch (err) {
        console.error("Failed to fetch row movies", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMovies();
  }, [endpoint]);

  return (
    <div 
      className="relative w-full overflow-x-auto hide-scroll pb-10 pt-4 -mx-6 px-6 md:-mx-16 md:px-16"
      ref={rowRef}
    >
      <div className="flex gap-6 w-max">
        {loading ? (
          // Skeleton Loaders
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[200px] h-[300px] md:w-[240px] md:h-[360px] rounded-2xl bg-cinematic-surface border border-cinematic-border animate-pulse shrink-0"></div>
          ))
        ) : (
          movies.map((movie) => (
            <MovieCard 
              key={movie.id} 
              movie={movie} 
              onHover={() => {
                if (movie.backdrop_path && onHoverBackdrop) {
                  onHoverBackdrop(movie.backdrop_path);
                }
              }} 
            />
          ))
        )}
      </div>
    </div>
  );
}

function MovieCard({ movie, onHover }) {
  const [isAdded, setIsAdded] = useState(false);
  const cardRef = useRef(null);
  
  // 3D Tilt Effect Setup using Framer Motion
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calculate mouse position relative to card center (-0.5 to 0.5)
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const posterUrl = movie.poster_path 
    ? `${TMDB_IMG}${movie.poster_path}` 
    : 'https://via.placeholder.com/500x750?text=No+Poster';

  const title = movie.title || movie.name || movie.original_title;
  const rating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : null;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={onHover}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="relative w-[200px] h-[300px] md:w-[240px] md:h-[360px] rounded-2xl shrink-0 cursor-pointer group perspective-[1000px]"
    >
      {/* Glow Layer */}
      <div className="absolute inset-0 bg-cinematic-accent rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" style={{ transform: "translateZ(-10px)" }}></div>

      <div 
        className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-cinematic-surface relative"
        style={{ transform: "translateZ(20px)" }}
      >
        <img 
          src={posterUrl} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        
        {/* Dark Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Card Content (Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <h3 className="text-white font-bold leading-tight line-clamp-2 mb-1 drop-shadow-md">{title}</h3>
          <div className="flex items-center justify-between">
            {rating && (
              <span className="text-cinematic-accent text-sm font-semibold flex items-center gap-1 drop-shadow-md">
                <StarIcon className="w-3 h-3 fill-current" /> {rating}
              </span>
            )}
            <span className="text-white/70 text-sm">{movie.release_date?.slice(0, 4)}</span>
          </div>
        </div>

        {/* Floating Quick Add Button */}
        <motion.button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsAdded(!isAdded);
          }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.5)] border transition-colors opacity-0 group-hover:opacity-100 ${
            isAdded ? 'bg-green-500 border-green-400 text-white' : 'bg-black/40 border-white/20 text-white hover:bg-cinematic-accent hover:border-cinematic-accent'
          }`}
          style={{ transform: "translateZ(40px)" }}
        >
          {isAdded ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <CheckIcon className="w-5 h-5" />
            </motion.div>
          ) : (
            <PlusIcon className="w-5 h-5" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
