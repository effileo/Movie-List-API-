import { motion } from 'framer-motion';
import { posterUrl, POSTER_PLACEHOLDER } from '../../api/client';

export default function FanStack({ movies = [] }) {
  // Take up to 3 movies
  const stack = movies.slice(0, 3);
  
  return (
    <div className="fan-stack">
      {stack.length === 0 ? (
        <div className="fan-stack-empty">
          <div className="fan-stack-placeholder" />
        </div>
      ) : (
        stack.map((movie, i) => (
          <motion.div
            key={i}
            className="fan-poster"
            initial={{ rotate: 0, x: 0, z: 0 }}
            animate={{ 
              rotate: i === 0 ? -6 : i === 2 ? 6 : 0,
              x: i === 0 ? -20 : i === 2 ? 20 : 0,
              z: i === 1 ? 10 : 0,
              scale: i === 1 ? 1.05 : 0.95,
            }}
            whileHover={{ 
              scale: 1.1, 
              rotate: 0, 
              x: 0, 
              zIndex: 10,
              transition: { type: 'spring', stiffness: 300, damping: 20 }
            }}
            style={{ 
              zIndex: i === 1 ? 2 : 1,
              transformStyle: 'preserve-3d'
            }}
          >
            <img 
              src={posterUrl(movie.posterPath) || POSTER_PLACEHOLDER} 
              alt={movie.title} 
              className="rounded-lg shadow-2xl border border-white/10"
              style={{ width: '100px', height: '150px', objectFit: 'cover' }}
            />
          </motion.div>
        ))
      )}
    </div>
  );
}
