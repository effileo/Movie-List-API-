import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-center">Loading…</div>;
  }

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1>Movie Watchlist</h1>
        <p>Search movies, add them to your watchlist, and track what you want to watch.</p>
      </div>
      <div className="home-actions">
        {user ? (
          <>
            <Link to="/search" className="btn btn-primary">Search movies</Link>
            <Link to="/watchlist" className="btn btn-secondary">My watchlist</Link>
            <p className="home-user">Logged in as <strong>{user.name}</strong></p>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-primary">Log in</Link>
            <Link to="/register" className="btn btn-secondary">Register</Link>
          </>
        )}
      </div>
    </div>
  );
}
