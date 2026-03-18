import { useState } from 'react';
import { UserPlusIcon, UserCheckIcon } from 'lucide-react';
import { apiRoutes } from '../../api/client';

export default function UserCardHeader({ user }) {
  const [following, setFollowing] = useState(false); // Should ideally come from backend
  const [loading, setLoading] = useState(false);

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await apiRoutes.users.follow(user.id);
      setFollowing(res.followed);
    } catch (err) {
      console.error('Follow failed', err);
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
        <div className="avatar-wrapper">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="user-avatar" />
          ) : (
            <div className="initial-avatar" style={{ background: `linear-gradient(135deg, #6366f1 0%, #a855f7 100%)` }}>
              {initials}
            </div>
          )}
        </div>
        <div className="user-details">
          <span className="user-name">{user.name}</span>
          <span className="user-status">Shared a watchlist</span>
        </div>
      </div>
      <button 
        className={`follow-btn ${following ? 'following' : ''}`} 
        onClick={handleFollow}
        disabled={loading}
      >
        {following ? <UserCheckIcon size={16} /> : <UserPlusIcon size={16} />}
        <span>{following ? 'Following' : 'Follow'}</span>
      </button>
    </div>
  );
}
