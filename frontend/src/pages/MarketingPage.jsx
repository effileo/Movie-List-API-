import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Starfield from '../components/Starfield';
import PosterVortex from '../components/PosterVortex';
import MarketingFeatureSections from '../components/marketing/MarketingFeatureSections.jsx';

// The full-page marketing landing view for unauthenticated users
export default function MarketingPage() {
  const navigate = useNavigate();

  return (
    // framer-motion container to handle the dramatic zoom exit on unmount
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5, transition: { duration: 0.8, ease: "easeInOut" } }} // The "zoom through" effect
      className="relative w-full min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-cinematic-accent/30"
    >
      <Starfield />

      {/* Hero Section */}
      <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
        <PosterVortex />
        
        {/* Content on top of Vortex */}
        <div className="relative z-30 flex flex-col items-center text-center px-6 mt-[-10vh]">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-6 drop-shadow-2xl"
          >
            Join the <span className="text-cinematic-accent">Verse</span>.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="text-xl md:text-2xl text-white/50 max-w-2xl mb-12 font-light leading-relaxed"
          >
            More than just a watchlist. Discover, rate, and connect with the ultimate 3D cinematic community.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/register')}
            className="relative group px-12 py-5 rounded-full bg-cinematic-accent text-white font-black text-xl tracking-widest uppercase overflow-hidden shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)] hover:opacity-90 transition-opacity"
          >
            <span className="relative z-10 block">
              Get Started Now
            </span>
          </motion.button>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-30"
        >
          <span className="text-xs uppercase tracking-widest text-white/30">Scroll to Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/30 to-transparent" />
        </motion.div>
      </section>

      <MarketingFeatureSections />

      {/* Bottom CTA */}
      <section className="relative z-30 w-full py-32 text-center border-t border-white/5 bg-gradient-to-t from-white/[0.02] to-transparent">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Ready to jump in?</h2>
        <Link 
          to="/register"
          className="inline-block px-12 py-5 rounded-full bg-cinematic-accent hover:opacity-90 font-black tracking-widest uppercase transition-colors shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)]"
        >
          Create Free Account
        </Link>
        <p className="mt-6 text-white/30 text-sm">Already a member? <Link to="/login" className="text-white/60 hover:text-white transition-colors">Sign In</Link></p>
      </section>

    </motion.div>
  );
}
