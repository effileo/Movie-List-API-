import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
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
import './App.css';

function Nav() {
  const { user, logout } = useAuth();
  return (
    <nav className="nav">
      <Link to="/" className="nav-brand">Movie Watchlist</Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/search">Search</Link>
            <Link to="/watchlist">Watchlist</Link>
            <Link to="/discover">Discover</Link>
            <Link to="/profile">Profile</Link>
            <span className="nav-user">{user.name}</span>
            <button type="button" className="nav-btn" onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/discover">Discover</Link>
            <Link to="/login">Log in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Nav />
        <main className="main">
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
    </BrowserRouter>
  );
}
