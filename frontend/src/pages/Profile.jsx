import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRoutes } from '../api/client.js';
import './Profile.css';

export default function Profile() {
  const { id } = useParams();
  const { user: me, loading: authLoading, loadMe } = useAuth();
  const isOwn = !id || (me && String(me.id) === id);
  const [profile, setProfile] = useState(null);
  const [watchlist, setWatchlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', avatarUrl: '', watchlistPublic: true });
  const [saving, setSaving] = useState(false);

  const targetId = id || (me?.id);

  useEffect(() => {
    if (!targetId && !me) {
      setLoading(false);
      return;
    }
    if (!targetId && me) {
      setProfile(me);
      setForm({ name: me.name ?? '', bio: me.bio ?? '', avatarUrl: me.avatarUrl ?? '', watchlistPublic: me.watchlistPublic ?? true });
      apiRoutes.watchlist.list()
        .then((res) => setWatchlist(res.data ?? []))
        .catch(() => setWatchlist([]))
        .finally(() => setLoading(false));
      return;
    }
    (async () => {
      try {
        const [{ data: userData }, { data: watchlistData }] = await Promise.all([
          apiRoutes.users.get(targetId),
          apiRoutes.users.watchlist(targetId).catch(() => ({ data: null })),
        ]);
        setProfile(userData);
        setWatchlist(watchlistData ?? []);
        if (isOwn && me) setForm({ name: me.name ?? '', bio: userData.bio ?? '', avatarUrl: userData.avatarUrl ?? '', watchlistPublic: userData.watchlistPublic ?? true });
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [targetId, me, isOwn]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await apiRoutes.auth.updateProfile(form);
      setProfile(data);
      setEditMode(false);
      loadMe();
    } catch (err) {
      setError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || (targetId && loading)) return <div className="page-center">Loading…</div>;
  if (!me && !id) return <div className="page-center"><p>Log in or view a user profile.</p><Link to="/login">Log in</Link></div>;
  if (error && !profile) return <div className="page-center"><p className="movies-message">{error}</p><Link to="/">Home</Link></div>;

  const displayUser = profile || me;

  return (
    <div className="profile-page">
      <div className="profile-header">
        {displayUser?.avatarUrl ? (
          <img src={displayUser.avatarUrl} alt="" className="profile-avatar" />
        ) : (
          <div className="profile-avatar placeholder" />
        )}
        <div className="profile-info">
          {editMode && isOwn ? (
            <form onSubmit={handleSaveProfile} className="profile-form">
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" required />
              <input value={form.avatarUrl} onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))} placeholder="Avatar URL" />
              <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Bio" rows={3} />
              <label><input type="checkbox" checked={form.watchlistPublic} onChange={(e) => setForm((f) => ({ ...f, watchlistPublic: e.target.checked }))} /> Watchlist public</label>
              <div className="profile-form-actions">
                <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                <button type="button" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <h1>{displayUser?.name}</h1>
              {displayUser?.bio && <p className="profile-bio">{displayUser.bio}</p>}
              {isOwn && <button type="button" className="btn btn-secondary" onClick={() => setEditMode(true)}>Edit profile</button>}
            </>
          )}
        </div>
      </div>
      {error && <p className="movies-message">{error}</p>}
      {displayUser?.watchlistPublic !== false && (
        <section className="profile-watchlist">
          <h2>{isOwn ? 'My watchlist' : `${displayUser?.name}'s watchlist`}</h2>
          {watchlist && watchlist.length > 0 ? (
            <ul className="profile-watchlist-list">
              {watchlist.slice(0, 10).map((item) => (
                <li key={item.id}><Link to={`/movies/${item.movie.id}`}>{item.movie.title}</Link> — {item.status}</li>
              ))}
              {watchlist.length > 10 && <li>… and {watchlist.length - 10} more</li>}
            </ul>
          ) : (
            <p className="muted">{isOwn ? 'Your watchlist is empty.' : 'No movies in this list.'}</p>
          )}
          {isOwn && (
            <>
              <Link to="/watchlist" className="btn btn-small">View full watchlist</Link>
              {displayUser?.watchlistPublic && (
                <Link to={`/users/${displayUser.id}/watchlist`} className="btn btn-small btn-ghost">Share watchlist (others can like & comment)</Link>
              )}
            </>
          )}
          {!isOwn && displayUser?.watchlistPublic && watchlist?.length > 0 && (
            <Link to={`/users/${displayUser.id}/watchlist`} className="btn btn-small">View full watchlist · Like & comment</Link>
          )}
        </section>
      )}
    </div>
  );
}
