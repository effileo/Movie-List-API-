import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Search from './pages/Search.jsx';
import Watchlist from './pages/Watchlist.jsx';
import MovieDetail from './pages/MovieDetail.jsx';
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
            <span className="nav-user">{user.name}</span>
            <button type="button" className="nav-btn" onClick={logout}>Log out</button>
          </>
        ) : (
          <>
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
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/search" element={<Search />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/movies/:id" element={<MovieDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
