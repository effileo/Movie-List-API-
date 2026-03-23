import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { apiRoutes, posterUrl } from '../api/client';

function VortexOverlays() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent z-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020205_80%)] z-20" />
    </>
  );
}

export default function PosterVortex() {
  const [posters, setPosters] = useState([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiRoutes.movies.trending('day', 1);
        if (cancelled || !data?.results?.length) return;
        const withPosters = data.results.filter((m) => m.poster_path);
        const pool = [...withPosters, ...withPosters].sort(() => 0.5 - Math.random());
        setPosters(pool.slice(0, 16));
      } catch (err) {
        console.error('Failed to load posters for vortex', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none" style={{ perspective: '1000px' }}>
      {posters.length > 0 ? (
        <motion.div
          initial={{ rotateX: 60, rotateZ: -10, scale: 1, z: -1000 }}
          animate={{ rotateX: 55, rotateZ: 5, scale: 1.5, z: 200 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 60, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }
          }
          className="absolute top-1/2 left-1/2 w-[200vw] h-[200vh] -translate-x-1/2 -translate-y-1/2 grid grid-cols-4 grid-rows-4 gap-8 opacity-40"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {posters.map((movie, idx) => (
            <motion.div
              key={`${movie.id}-${idx}`}
              className="w-full h-full rounded-2xl bg-cover bg-center shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)] border border-white/5"
              style={{ backgroundImage: `url(${posterUrl(movie.poster_path)})` }}
              initial={{ y: reduceMotion ? 0 : Math.random() * 100 - 50 }}
              animate={
                reduceMotion
                  ? { y: 0, rotateY: 0 }
                  : {
                      y: [Math.random() * 100 - 50, Math.random() * -100 + 50],
                      rotateY: [0, Math.random() * 20 - 10],
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: Math.random() * 15 + 15, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
              }
            />
          ))}
        </motion.div>
      ) : (
        <div className="absolute inset-0 z-[15]" aria-hidden>
          <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[min(90vw,42rem)] h-[min(90vw,42rem)] rounded-full bg-cinematic-accent/[0.07] blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] max-w-3xl max-h-[min(70vw,36rem)] rounded-full bg-white/[0.025] blur-[90px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_55%_45%_at_50%_45%,rgba(255,255,255,0.04),transparent_72%)]" />
        </div>
      )}

      <VortexOverlays />
    </div>
  );
}
