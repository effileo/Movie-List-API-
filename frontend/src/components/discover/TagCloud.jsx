import { useState, useEffect } from 'react';
import { apiRoutes } from '../../api/client';

export default function TagCloud({ onSelect, activeTag }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRoutes.users.topGenres()
      .then(res => setTags(res.data || []))
      .catch(err => console.error('Failed to load genres', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading && tags.length === 0) return <div className="tag-cloud-shimmer" />;

  return (
    <div className="tag-cloud">
      <button 
        className={`tag-btn ${!activeTag ? 'active' : ''}`} 
        onClick={() => onSelect(null)}
      >
        All Watchlists
      </button>
      {tags.map(tag => (
        <button 
          key={tag} 
          className={`tag-btn ${activeTag === tag ? 'active' : ''}`} 
          onClick={() => onSelect(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
