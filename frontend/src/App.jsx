import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './context/AuthContext.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Search from './pages/Search.jsx';
import Watchlist from './pages/Watchlist.jsx';
import MovieDetail from './pages/MovieDetail.jsx';
import TmdbMovie from './pages/TmdbMovie.jsx';
import MovieListPage from './pages/MovieListPage.jsx';
import Profile from './pages/Profile.jsx';
import PublicWatchlist from './pages/PublicWatchlist.jsx';
import DiscoverWatchlists from './pages/DiscoverWatchlists.jsx';
import { FilmIcon, SearchIcon, UserIcon, LogOutIcon } from 'lucide-react';
import './App.css';

// Sleek glassmorphic Navbar
function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/', { replace: true });
  }

  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-cinematic-bg/60 backdrop-blur-xl border-b border-cinematic-border/50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cinematic-accent to-purple-600 shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:scale-105 transition-transform duration-300">
            <FilmIcon className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-widest text-white/90 group-hover:text-white transition-colors">
            CINÉVERSE
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
          {user ? (
            <>
              <Link to="/search" className="text-cinematic-muted hover:text-white transition-colors flex items-center gap-2">
                <SearchIcon className="w-4 h-4" /> Search
              </Link>
              <Link to="/watchlist" className="text-cinematic-muted hover:text-white transition-colors">Watchlist</Link>
              <Link to="/discover" className="text-cinematic-muted hover:text-white transition-colors">Discover</Link>
              <Link to="/profile" className="flex items-center gap-2 px-4 py-2 rounded-full border border-cinematic-border bg-cinematic-surface text-white hover:bg-white/10 transition-colors">
                <UserIcon className="w-4 h-4" /> {user.name}
              </Link>
              <button type="button" onClick={handleLogout} className="text-cinematic-muted hover:text-red-400 transition-colors">
                <LogOutIcon className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/discover" className="text-cinematic-muted hover:text-white transition-colors">Discover</Link>
              <Link to="/login" className="text-cinematic-muted hover:text-white transition-colors">Log in</Link>
              <Link to="/register" className="px-5 py-2.5 rounded-full bg-cinematic-accent text-white hover:bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all hover:scale-105">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// Wrapping layout that provides the cinematic background
export default function App() {
  const [activeBackdrop, setActiveBackdrop] = useState(null);

  return (
    <BrowserRouter>
      {/* Expose background setter via context if needed, or window for deep components */}
      <div 
        className="relative min-h-screen w-full bg-cinematic-bg text-cinematic-text overflow-hidden selection:bg-cinematic-accent selection:text-white"
        // We attach setActiveBackdrop to window so deeply nested components (like Landing) can trigger backdrops easily without heavy prop drilling.
        ref={(el) => { if (el) window.__setBackground = setActiveBackdrop; }}
      >
        
        {/* Cinematic Parallax Background */}
        <AnimatePresence>
          {activeBackdrop && (
            <motion.div
              key={activeBackdrop}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="fixed inset-0 z-0 select-none pointer-events-none"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${activeBackdrop})` }}
              />
              {/* Deep Vignette overlay to fade into #050510 */}
              <div className="absolute inset-0 bg-gradient-to-t from-cinematic-bg via-cinematic-bg/90 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-cinematic-bg via-transparent to-cinematic-bg/80" />
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Application Layer */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Nav />
          <main className="flex-1 w-full pt-20">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/search" element={<Search />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/discover" element={<DiscoverWatchlists />} />
              <Route path="/users/:id" element={<Profile />} />
              <Route path="/users/:id/watchlist" element={<PublicWatchlist />} />
              <Route path="/movies/list/:listType" element={<MovieListPage />} />
              <Route path="/movies/:id" element={<MovieDetail />} />
              <Route path="/movie/tmdb/:tmdbId" element={<TmdbMovie />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
