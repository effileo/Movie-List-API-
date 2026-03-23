import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import Starfield from '../components/Starfield';
import PosterVortex from '../components/PosterVortex';
import MarketingFeatureSections from '../components/marketing/MarketingFeatureSections.jsx';

export default function MarketingPage() {
  const reduceMotion = useReducedMotion();

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const fadeUp = (delay) => ({
    initial: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion
      ? { duration: 0 }
      : { delay, duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5, transition: { duration: 0.8, ease: 'easeInOut' } }}
      className="relative w-full min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-cinematic-accent/30"
    >
      <Starfield />

      <main className="relative">
        <section
          className="relative w-full min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden"
          aria-labelledby="marketing-hero-heading"
        >
          <PosterVortex />

          <div className="relative z-30 flex flex-col items-center text-center px-5 sm:px-8 max-w-4xl mx-auto mt-[-6vh] md:mt-[-10vh]">
            <div className="w-full rounded-3xl px-5 py-10 sm:px-10 sm:py-11 md:px-0 md:py-0 md:bg-transparent bg-black/35 backdrop-blur-md border border-white/[0.07] md:border-0 md:backdrop-blur-none shadow-[0_32px_64px_-32px_rgba(0,0,0,0.85)] md:shadow-none">
              <motion.p
                {...fadeUp(reduceMotion ? 0 : 0.12)}
                className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.28em] text-cinematic-accent/90 mb-5 md:mb-6"
              >
                The social cinema graph
              </motion.p>

              <motion.h1
                id="marketing-hero-heading"
                {...fadeUp(reduceMotion ? 0 : 0.28)}
                className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-5 md:mb-6 drop-shadow-2xl text-balance"
              >
                Join the <span className="text-cinematic-accent">Verse</span>.
              </motion.h1>

              <motion.p
                {...fadeUp(reduceMotion ? 0 : 0.42)}
                className="text-lg sm:text-xl md:text-2xl text-white/55 max-w-2xl mx-auto mb-10 md:mb-12 font-light leading-relaxed text-balance"
              >
                More than a watchlist—discover films, rate what you love, and match with friends in a
                3D cinematic home.
              </motion.p>

              <motion.div
                {...fadeUp(reduceMotion ? 0 : 0.52)}
                className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full sm:w-auto"
              >
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-6 py-2.5 md:px-8 md:py-3 rounded-full bg-cinematic-accent text-white font-bold text-xs md:text-sm tracking-wide uppercase shadow-[0_0_28px_-12px_rgba(225,29,72,0.45)] hover:opacity-92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinematic-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] transition-opacity"
                >
                  Get started
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-6 py-2.5 md:px-8 md:py-3 rounded-full border border-white/15 bg-white/[0.04] text-white/90 font-medium text-xs md:text-sm tracking-wide hover:bg-white/[0.08] hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] transition-colors"
                >
                  Sign in
                </Link>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduceMotion ? { duration: 0 } : { delay: 1.2, duration: 1.2 }}
            className="absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-30"
          >
            <button
              type="button"
              onClick={scrollToFeatures}
              className="group flex flex-col items-center gap-2 rounded-lg px-3 py-1 text-white/40 hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] transition-colors"
            >
              <span className="text-[10px] uppercase tracking-[0.2em]">Explore</span>
              <ChevronDown
                className="w-4 h-4 opacity-70 motion-safe:group-hover:translate-y-0.5 transition-transform"
                aria-hidden
              />
            </button>
            <div className="w-px h-10 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
          </motion.div>
        </section>

        <MarketingFeatureSections />

        <section
          className="relative z-30 w-full py-24 md:py-32 px-6 text-center border-t border-white/5 bg-gradient-to-t from-white/[0.03] to-transparent"
          aria-labelledby="marketing-footer-cta"
        >
          <div className="max-w-2xl mx-auto">
            <h2
              id="marketing-footer-cta"
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 text-balance"
            >
              Ready to jump in?
            </h2>
            <p className="text-white/45 text-sm md:text-base mb-10 leading-relaxed">
              Free to join. Bring your watchlist—or start fresh—and see what the community is watching.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-6 py-2.5 md:px-8 md:py-3 rounded-full bg-cinematic-accent hover:opacity-92 font-bold text-xs md:text-sm tracking-wide uppercase transition-opacity shadow-[0_0_28px_-12px_rgba(225,29,72,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinematic-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
            >
              Create free account
            </Link>
            <p className="mt-8 text-white/35 text-sm">
              Already a member?{' '}
              <Link
                to="/login"
                className="text-white/65 hover:text-white underline-offset-4 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </main>
    </motion.div>
  );
}
