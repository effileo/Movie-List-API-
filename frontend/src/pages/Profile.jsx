import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Archive,
  Compass,
  Link2,
  Settings2,
  LogOut,
  Pencil,
  User,
  Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ui/ToastProvider.jsx';
import { apiRoutes } from '../api/client.js';
import './Profile.css';

function formatJoined(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

const MAX_AVATAR_FILE_BYTES = 1.5 * 1024 * 1024;
const MAX_AVATAR_DATA_URL_LEN = 550_000;

/** Resize to JPEG data URL for storage in avatarUrl (matches API validator). */
function fileToResizedJpegDataUrl(file, maxSide = 400, quality = 0.88) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('Please choose an image file'));
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) {
          reject(new Error('Could not read this image'));
          return;
        }
        const scale = Math.min(1, maxSide / Math.max(w, h));
        const cw = Math.max(1, Math.round(w * scale));
        const ch = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not process image'));
          return;
        }
        ctx.drawImage(img, 0, 0, cw, ch);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Could not process image'));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Could not load image'));
    };
    img.src = blobUrl;
  });
}

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: me, loading: authLoading, loadMe, logout } = useAuth();
  const isOwn = !id || (me && String(me.id) === id);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', avatarUrl: '' });
  const [saving, setSaving] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const targetId = id || me?.id;

  useEffect(() => {
    if (!targetId && !me) {
      setLoading(false);
      return;
    }
    if (!targetId && me) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data: userData } = await apiRoutes.users.get(targetId);
        setProfile(userData);
        if (isOwn && me) {
          setForm({
            name: me.name ?? '',
            bio: userData.bio ?? '',
            avatarUrl: userData.avatarUrl ?? '',
          });
        }
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
      const { data } = await apiRoutes.auth.updateProfile({
        name: form.name,
        bio: form.bio || null,
        avatarUrl: form.avatarUrl?.trim() || null,
      });
      setProfile((p) => (p ? { ...p, ...data, _count: p._count } : data));
      setEditMode(false);
      loadMe();
    } catch (err) {
      setError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  async function handlePrivacyToggle(next) {
    if (!isOwn) return;
    setSavingPrivacy(true);
    setError('');
    try {
      const { data } = await apiRoutes.auth.updateProfile({ watchlistPublic: next });
      setProfile((p) => (p ? { ...p, watchlistPublic: data.watchlistPublic } : p));
      loadMe();
    } catch (err) {
      setError(err.message || 'Failed to update privacy');
    } finally {
      setSavingPrivacy(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/', { replace: true });
    showToast('Logged out successfully');
  }

  async function handleAvatarFileInput(e, mode) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !isOwn) return;
    if (file.size > MAX_AVATAR_FILE_BYTES) {
      showToast('Image is too large (max about 1.5 MB)', 'error');
      return;
    }
    setUploadingAvatar(true);
    setError('');
    try {
      const dataUrl = await fileToResizedJpegDataUrl(file);
      if (dataUrl.length > MAX_AVATAR_DATA_URL_LEN) {
        showToast('Image is still too large — try a smaller photo.', 'error');
        return;
      }
      if (mode === 'form') {
        setForm((f) => ({ ...f, avatarUrl: dataUrl }));
        showToast('Photo added — click Save to apply');
        return;
      }
      const { data } = await apiRoutes.auth.updateProfile({ avatarUrl: dataUrl });
      setProfile((p) => (p ? { ...p, ...data, _count: p._count } : data));
      await loadMe();
      showToast('Profile photo updated');
    } catch (err) {
      showToast(err.message || 'Could not update photo', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  }

  if (authLoading || (targetId && loading)) {
    return <div className="page-center profile-loading">Loading…</div>;
  }
  if (!me && !id) {
    return (
      <div className="page-center">
        <p>Log in or view a user profile.</p>
        <Link to="/login">Log in</Link>
      </div>
    );
  }
  if (error && !profile) {
    return (
      <div className="page-center">
        <p className="movies-message">{error}</p>
        <Link to="/">Home</Link>
      </div>
    );
  }

  const displayUser = profile || me;
  const joined = formatJoined(displayUser?.createdAt);
  const wlCount = profile?._count?.watchListItems ?? 0;
  const reviewsCount = profile?._count?.reviews ?? 0;
  const watchlistPublic = displayUser?.watchlistPublic !== false;

  return (
    <div className="profile-page">
      <header className="profile-hero">
        <div className="profile-avatar-column">
          {displayUser?.avatarUrl ? (
            <>
              <img src={displayUser.avatarUrl} alt="" className="profile-avatar" />
              {isOwn && !editMode && (
                <label className="profile-avatar-change">
                  <span>{uploadingAvatar ? 'Uploading…' : 'Change photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="profile-file-input-overlay"
                    disabled={uploadingAvatar}
                    onChange={(e) => handleAvatarFileInput(e, 'save')}
                  />
                </label>
              )}
            </>
          ) : isOwn && !editMode ? (
            <label
              className={`profile-avatar profile-avatar-upload placeholder${uploadingAvatar ? ' is-busy' : ''}`}
              aria-label={uploadingAvatar ? 'Uploading photo' : 'Add profile photo'}
            >
              <Camera className="profile-avatar-camera" strokeWidth={1.5} aria-hidden />
              <span className="profile-avatar-upload-text">{uploadingAvatar ? 'Uploading…' : 'Add photo'}</span>
              <input
                type="file"
                accept="image/*"
                className="profile-avatar-file-input"
                disabled={uploadingAvatar}
                onChange={(e) => handleAvatarFileInput(e, 'save')}
              />
            </label>
          ) : (
            <div className="profile-avatar placeholder" aria-hidden>
              <User className="profile-avatar-icon" strokeWidth={1.25} />
            </div>
          )}
        </div>
        <div className="profile-hero-main">
          {editMode && isOwn ? (
            <form onSubmit={handleSaveProfile} className="profile-form">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Display name"
                required
              />
              <div className="profile-avatar-file-row">
                <label className="profile-btn profile-btn-ghost profile-file-upload-btn">
                  <Camera className="w-4 h-4" aria-hidden />
                  {uploadingAvatar ? 'Processing…' : 'Upload photo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="profile-file-input-overlay"
                    disabled={uploadingAvatar || saving}
                    onChange={(e) => handleAvatarFileInput(e, 'form')}
                  />
                </label>
                <span className="profile-file-hint muted">from your device · applied when you Save</span>
              </div>
              <input
                value={form.avatarUrl.startsWith('data:') ? '' : form.avatarUrl}
                onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                placeholder="Or paste an image URL (https://…)"
              />
              {form.avatarUrl.startsWith('data:') && (
                <p className="profile-pending-photo muted">New photo ready — save to keep it, or upload another.</p>
              )}
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell others about your favorite genres, directors, or how you pick what to watch…"
                rows={4}
                maxLength={500}
              />
              <p className="profile-char-hint">{form.bio.length}/500</p>
              <div className="profile-form-actions">
                <button type="submit" className="profile-btn profile-btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" className="profile-btn" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="profile-title-row">
                <h1>{displayUser?.name}</h1>
                {isOwn && (
                  <button
                    type="button"
                    className="profile-btn profile-btn-ghost profile-edit-btn"
                    onClick={() => setEditMode(true)}
                  >
                    <Pencil className="w-4 h-4" aria-hidden />
                    Edit profile
                  </button>
                )}
              </div>
              <div className="profile-meta">
                {joined && <span>Member since {joined}</span>}
                {(wlCount > 0 || reviewsCount > 0) && (
                  <span className="profile-meta-stats">
                    {wlCount > 0 && (
                      <span>
                        {wlCount} {wlCount === 1 ? 'title' : 'titles'} on watchlist
                      </span>
                    )}
                    {wlCount > 0 && reviewsCount > 0 && <span className="profile-meta-dot">·</span>}
                    {reviewsCount > 0 && (
                      <span>
                        {reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {error && <p className="movies-message profile-inline-error">{error}</p>}

      {!editMode && (
        <>
          <section className="profile-section" aria-labelledby="profile-about-heading">
            <h2 id="profile-about-heading" className="profile-section-title">
              About
            </h2>
            {displayUser?.bio?.trim() ? (
              <p className="profile-bio">{displayUser.bio}</p>
            ) : isOwn ? (
              <p className="profile-bio profile-bio-placeholder">
                You haven&apos;t added a bio yet. Use <strong>Edit profile</strong> to share your taste,
                favorite eras, or what you&apos;re into lately.
              </p>
            ) : (
              <p className="profile-bio profile-bio-placeholder muted">No bio yet.</p>
            )}
          </section>

          {isOwn && (
            <section className="profile-section" aria-labelledby="profile-activity-heading">
              <h2 id="profile-activity-heading" className="profile-section-title">
                Your library
              </h2>
              <p className="profile-section-lead">
                Manage titles and collections from these pages — your profile stays for identity and
                preferences.
              </p>
              <ul className="profile-shortcuts">
                <li>
                  <Link to="/watchlist" className="profile-shortcut">
                    <Bookmark className="profile-shortcut-icon" aria-hidden />
                    <span className="profile-shortcut-label">Watchlist</span>
                    <span className="profile-shortcut-desc">Plan, track, and sort what you want to watch</span>
                  </Link>
                </li>
                <li>
                  <Link to="/vault" className="profile-shortcut">
                    <Archive className="profile-shortcut-icon" aria-hidden />
                    <span className="profile-shortcut-label">Cine Vault</span>
                    <span className="profile-shortcut-desc">Shelf view of your collection</span>
                  </Link>
                </li>
                <li>
                  <Link to="/discover" className="profile-shortcut">
                    <Compass className="profile-shortcut-icon" aria-hidden />
                    <span className="profile-shortcut-label">Discover</span>
                    <span className="profile-shortcut-desc">Browse public lists from the community</span>
                  </Link>
                </li>
              </ul>
              {watchlistPublic && displayUser?.id && (
                <div className="profile-share-row">
                  <Link to={`/users/${displayUser.id}/watchlist`} className="profile-share-link">
                    <Link2 className="w-4 h-4" aria-hidden />
                    Open your public watchlist page
                  </Link>
                  <span className="muted profile-share-hint">Others can like and comment when this link is shared.</span>
                </div>
              )}
            </section>
          )}

          {!isOwn && watchlistPublic && (
            <section className="profile-section profile-section-cta">
              <h2 className="profile-section-title">Watchlist</h2>
              <p className="profile-section-lead">
                {wlCount > 0
                  ? `${displayUser?.name} has ${wlCount} ${wlCount === 1 ? 'title' : 'titles'} on their list.`
                  : 'Their list is empty for now.'}
              </p>
              {wlCount > 0 && (
                <Link to={`/users/${displayUser.id}/watchlist`} className="profile-btn profile-btn-primary">
                  View full watchlist
                </Link>
              )}
            </section>
          )}

          {!isOwn && !watchlistPublic && (
            <section className="profile-section">
              <p className="muted">This user&apos;s watchlist is private.</p>
            </section>
          )}

          {isOwn && (
            <section className="profile-section profile-settings" aria-labelledby="profile-settings-heading">
              <h2 id="profile-settings-heading" className="profile-section-title">
                <Settings2 className="profile-section-title-icon" aria-hidden />
                Settings
              </h2>
              <div className="profile-setting-row">
                <div>
                  <p className="profile-setting-label">Public watchlist</p>
                  <p className="profile-setting-desc">
                    When on, your list appears in Discover and anyone with your link can view, like, and
                    comment.
                  </p>
                </div>
                <label className="profile-toggle">
                  <input
                    type="checkbox"
                    checked={watchlistPublic}
                    disabled={savingPrivacy}
                    onChange={(e) => handlePrivacyToggle(e.target.checked)}
                  />
                  <span className="profile-toggle-ui" aria-hidden />
                </label>
              </div>
              {me?.email && (
                <p className="profile-account-email">
                  <span className="muted">Signed in as</span> {me.email}
                </p>
              )}
              <button type="button" className="profile-btn profile-logout" onClick={handleLogout}>
                <LogOut className="w-4 h-4" aria-hidden />
                Log out
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}
