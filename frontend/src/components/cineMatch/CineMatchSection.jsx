import { useState, useEffect } from 'react';
import CineMatchStack from './CineMatchStack';
import { apiRoutes } from '../../api/client';
import './CineMatch.css';

export default function CineMatchSection() {
  const [friends, setFriends] = useState([]);
  const [friendId, setFriendId] = useState(null);
  const [loadingFriends, setLoadingFriends] = useState(true);

  useEffect(() => {
    apiRoutes.cineMatch
      .friends()
      .then((res) => setFriends(res.data ?? []))
      .catch(() => setFriends([]))
      .finally(() => setLoadingFriends(false));
  }, []);

  return (
    <section className="cine-match-section">
      <div className="cine-match-header">
        <h2 className="cine-match-heading">Cine-Match</h2>
        <p className="cine-match-desc">Swipe to find a movie to watch together with a friend.</p>
        <div className="cine-match-friend-wrap">
          <label htmlFor="cine-match-friend" className="cine-match-friend-label">
            Match with friend
          </label>
          <select
            id="cine-match-friend"
            className="cine-match-friend-select"
            value={friendId ?? ''}
            onChange={(e) => setFriendId(e.target.value ? Number(e.target.value) : null)}
            disabled={loadingFriends}
          >
            <option value="">No friend selected</option>
            {friends.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <CineMatchStack friendId={friendId} friends={friends} />
    </section>
  );
}
