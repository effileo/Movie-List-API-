import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiRoutes, posterUrl } from '../api/client';

export default function PosterVortex() {
  const [posters, setPosters] = useState([]);

  useEffect(() => {
    async function loadPosters() {
      try {
        const data = await apiRoutes.movies.trending({ window: 'day' });
        if (data && data.results) {
          // Shuffle and duplicate them to have enough to fill the vortex
           const pool = [...data.results, ...data.results].sort(() => 0.5 - Math.random());
           setPosters(pool.slice(0, 16));
        }
      } catch (err) {
        console.error("Failed to load posters for vortex", err);
      }
    }
    loadPosters();
  }, []);

  if (posters.length === 0) return null;

  return (
    <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none" style={{ perspective: '1000px' }}>
      {/* 
        This container is mapped into 3D space, tilted away, and slowing rotating/translating towards the user.
        We ensure it's massive so it covers the whole screen while rotating.
      */}
      <motion.div 
        initial={{ rotateX: 60, rotateZ: -10, scale: 1, z: -1000 }}
        animate={{ rotateX: 55, rotateZ: 5, scale: 1.5, z: 200 }}
        transition={{ duration: 60, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
        className="absolute top-1/2 left-1/2 w-[200vw] h-[200vh] -translate-x-1/2 -translate-y-1/2 grid grid-cols-4 grid-rows-4 gap-8 opacity-40"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {posters.map((movie, idx) => (
          <motion.div
            key={`${movie.id}-${idx}`}
            className="w-full h-full rounded-2xl bg-cover bg-center shadow-2xl shadow-blue-500/10 border border-white/5"
            style={{ backgroundImage: `url(${posterUrl(movie.poster_path)})` }}
            initial={{ y: Math.random() * 100 - 50 }}
            animate={{ 
                y: [Math.random() * 100 - 50, Math.random() * -100 + 50],
                rotateY: [0, Math.random() * 20 - 10] 
            }}
            transition={{ duration: Math.random() * 15 + 15, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          />
        ))}
      </motion.div>
      
      {/* Deep dark gradient overlay so it fades out at the edges and into the hero text */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020205] via-[#020205]/40 to-transparent z-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020205_80%)] z-20" />
    </div>
  );
}
