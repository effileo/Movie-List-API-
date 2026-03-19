import { useState } from 'react';
import { UserPlusIcon, UserCheckIcon, SettingsIcon, Loader2Icon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRoutes } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/ToastProvider';

export default function UserCardHeader({ user }) {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  
  // followStatus: null (not following), PENDING, or ACCEPTED
  const [status, setStatus] = useState(user.followStatus || null);
  const [loading, setLoading] = useState(false);

  const isSelf = currentUser?.id === user.id;

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    // Optimistic Update
    const previousStatus = status;
    const isNowFollowing = !status;
    
    setLoading(true);
    setStatus(isNowFollowing ? 'PENDING' : null);
    
    try {
      const res = await apiRoutes.users.follow(user.id);
      setStatus(res.statusText === 'pending' ? 'PENDING' : null);
      showToast(res.statusText === 'pending' ? `Follow request sent to ${user.name}!` : `Unfollowed ${user.name}.`);
    } catch (err) {
      setStatus(previousStatus);
      showToast(err.message || 'Failed to update follow status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="user-card-header glass-morphism">
      <div className="user-info">
        <Link to={`/users/${user.id}`} className="avatar-wrapper hover:scale-110 transition-transform">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="user-avatar" />
          ) : (
            <div className="initial-avatar" style={{ background: `linear-gradient(135deg, #6366f1 0%, #a855f7 100%)` }}>
              {initials}
            </div>
          )}
        </Link>
        <div className="user-details">
          <Link to={`/users/${user.id}`} className="user-name hover:text-cinematic-accent">
            {user.name} {isSelf && <span className="text-[10px] text-cinematic-accent font-bold bg-cinematic-accent/10 px-1.5 py-0.5 rounded ml-1">YOU</span>}
          </Link>
          <span className="user-status">Shared a watchlist</span>
        </div>
      </div>

      {isSelf ? (
        <Link 
          to="/profile" 
          className="follow-btn text-slate-400 hover:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <SettingsIcon size={16} />
          <span>Edit</span>
        </Link>
      ) : (
        <button 
          className={`follow-btn ${status ? 'following' : ''} ${loading ? 'opacity-50' : ''}`} 
          onClick={handleFollow}
          disabled={loading}
        >
          {loading ? (
            <Loader2Icon size={16} className="animate-spin" />
          ) : status === 'ACCEPTED' ? (
            <UserCheckIcon size={16} />
          ) : (
            <UserPlusIcon size={16} />
          )}
          <span>
            {status === 'ACCEPTED' ? 'Following' : status === 'PENDING' ? 'Requested' : 'Follow'}
          </span>
        </button>
      )}
    </div>
  );
}
