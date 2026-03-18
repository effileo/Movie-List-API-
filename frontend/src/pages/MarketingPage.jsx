import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { SparklesIcon, UsersIcon } from 'lucide-react';
import Starfield from '../components/Starfield';
import PosterVortex from '../components/PosterVortex';

// The full-page marketing landing view for unauthenticated users
export default function MarketingPage() {
  const navigate = useNavigate();

  return (
    // framer-motion container to handle the dramatic zoom exit on unmount
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5, transition: { duration: 0.8, ease: "easeInOut" } }} // The "zoom through" effect
      className="relative w-full min-h-screen bg-[#020205] text-white overflow-x-hidden selection:bg-purple-500/30"
    >
      <Starfield />

      {/* Hero Section */}
      <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
        <PosterVortex />
        
        {/* Content on top of Vortex */}
        <div className="relative z-30 flex flex-col items-center text-center px-6 mt-[-10vh]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="flex items-center gap-3 mb-6 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-md"
          >
            <SparklesIcon className="w-4 h-4 text-purple-400" />
            <span className="text-purple-200 text-sm font-semibold tracking-widest uppercase">The Next Evolution of Cinema Tracking</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-6 drop-shadow-2xl"
          >
            Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Verse</span>.
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
            className="relative group px-12 py-5 rounded-full bg-white text-black font-black text-xl tracking-widest uppercase overflow-hidden"
          >
            {/* Hover Glow Behind Button */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl scale-150" />
            <span className="relative z-10 block transition-colors duration-300 group-hover:text-white">
              Get Started Now
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0" />
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

      {/* Beyond a Watchlist: Bento Grid Pitch */}
      <section className="relative z-30 w-full max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Beyond a Watchlist</h2>
          <p className="text-white/50 text-xl font-light">The tools you need to build your ultimate cinema profile.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 w-full auto-rows-[300px]">
          
          {/* Card 1: Social Pulse */}
          <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-10 group hover:bg-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -z-10 group-hover:bg-blue-500/20 transition-colors" />
            <UsersIcon className="w-12 h-12 text-blue-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4">Social Pulse</h3>
            <p className="text-white/60 text-lg leading-relaxed max-w-md">
              A real-time, global feed of what your friends are adding, rating, and reviewing. Never miss a masterpiece again.
            </p>
          </div>

          {/* Card 2: AI Matcher */}
          <div className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-10 group hover:bg-white/10 transition-colors">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -z-10 group-hover:bg-purple-500/20 transition-colors" />
            <SparklesIcon className="w-12 h-12 text-purple-400 mb-6" />
            <h3 className="text-3xl font-bold mb-4">AI Matcher</h3>
            <p className="text-white/60 text-lg leading-relaxed">
              Our 'For You' engine analyzes your top actors and genres to find hidden gems perfectly tailored to your taste.
            </p>
          </div>



        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-30 w-full py-32 text-center border-t border-white/5 bg-gradient-to-t from-white/[0.02] to-transparent">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Ready to jump in?</h2>
        <Link 
          to="/register"
          className="inline-block px-12 py-5 rounded-full bg-cinematic-accent hover:bg-blue-600 font-black tracking-widest uppercase transition-colors shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:shadow-[0_0_60px_rgba(59,130,246,0.8)]"
        >
          Create Free Account
        </Link>
        <p className="mt-6 text-white/30 text-sm">Already a member? <Link to="/login" className="text-white/60 hover:text-white transition-colors">Sign In</Link></p>
      </section>

    </motion.div>
  );
}
