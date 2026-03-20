import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import MovieRow from '../components/MovieRow';
import ActivityFeed from '../components/ActivityFeed';
import ForYouSection from '../components/ForYouSection';
import CineMatchSection from '../components/cineMatch/CineMatchSection';

export default function Landing() {
  // Grab the window-attached active backdrop setter established in App.jsx wrapper
  // This allows the Landing page's rows to communicate with the App's fixed background
  const setAppBackdrop = window.__setBackground || (() => {});

  // Reset the backdrop when unmounting landing to prevent weird states
  useEffect(() => {
    return () => setAppBackdrop(null);
  }, []);

  return (
    <div className="w-full relative">
      <HeroSection setHeroBackdrop={setAppBackdrop} />

      {/* 
        Negative margin pulls the rows up over the bottom of the hero vignette 
        for a seamless flowy integration
      */}
      <div className="relative z-20 flex flex-col gap-12 mt-[-80px] pb-24">
        
        <section>
          <div className="px-6 md:px-16 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-2xl md:text-3xl font-bold tracking-wide drop-shadow-md text-white">Trending Now</h2>
                <p className="text-cinematic-muted text-sm mt-1">The most talked about movies this week</p>
              </div>
              <Link
                to="/movies/list/trending"
                className="shrink-0 text-sm font-semibold text-cinematic-accent hover:text-white transition-colors pt-1 md:pt-2"
              >
                See more
              </Link>
            </div>
            <div className="hidden md:block h-[1px] w-full mt-4 bg-gradient-to-r from-cinematic-accent/50 to-transparent" />
          </div>
          <MovieRow endpoint="/api/movies/trending?window=week" onHoverBackdrop={setAppBackdrop} />
        </section>

        <section>
          <div className="px-6 md:px-16 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-2xl md:text-3xl font-bold tracking-wide drop-shadow-md text-white">Popular Picks</h2>
                <p className="text-cinematic-muted text-sm mt-1">Highest viewing metrics right now</p>
              </div>
              <Link
                to="/movies/list/popular"
                className="shrink-0 text-sm font-semibold text-cinematic-accent hover:text-white transition-colors pt-1 md:pt-2"
              >
                See more
              </Link>
            </div>
            <div className="hidden md:block h-[1px] w-full mt-4 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <MovieRow endpoint="/api/movies/popular" onHoverBackdrop={setAppBackdrop} />
        </section>

        <section className="px-6 md:px-16 mt-8">
          <ForYouSection />
        </section>

        {/* Cine-Match: swipe to match with a friend */}
        <section className="px-6 md:px-16">
          <CineMatchSection />
        </section>

        {/* Social Pulse Activity Feed */}
        <section className="px-6 md:px-16 mt-8">
          <div className="hidden md:block h-[1px] w-full mb-10 bg-gradient-to-r from-transparent via-slate-700/50 to-transparent"></div>
          <ActivityFeed />
        </section>
      </div>
    </div>
  );
}

