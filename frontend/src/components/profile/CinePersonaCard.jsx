import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Share2, FlipHorizontal, Loader2 } from 'lucide-react';
import { useToast } from '../ui/ToastProvider.jsx';
import { apiRoutes, posterUrl } from '../../api/client.js';
import './CinePersonaCard.css';

const LOADING_LINES = [
  'Consulting the archives…',
  'Scanning your cinematic DNA…',
  'Reading between the sprocket holes…',
  'Matching lenses to your taste…',
];

const AURA_RGB = {
  Drama: '196, 72, 110',
  Action: '220, 38, 38',
  Adventure: '234, 88, 12',
  Comedy: '250, 204, 21',
  Horror: '139, 92, 246',
  Thriller: '225, 29, 72',
  Romance: '244, 114, 182',
  'Sci-Fi': '56, 189, 248',
  Fantasy: '167, 139, 250',
  Crime: '71, 85, 105',
  Documentary: '34, 197, 94',
  Animation: '251, 113, 133',
  History: '180, 83, 9',
  War: '120, 53, 15',
  Western: '161, 98, 7',
  Mystery: '99, 102, 241',
  Music: '236, 72, 153',
  Family: '52, 211, 153',
  Cinema: '225, 29, 72',
};

function auraRgb(genre) {
  if (!genre) return AURA_RGB.Cinema;
  return AURA_RGB[genre] || AURA_RGB.Cinema;
}

const RADAR_KEYS = [
  { key: 'emotionalDepth', label: 'Emotional depth' },
  { key: 'actionLevel', label: 'Action level' },
  { key: 'historicalInterest', label: 'Historical interest' },
  { key: 'socialPulse', label: 'Social pulse' },
];

function PersonaRadar({ radar, rgb }) {
  const cx = 90;
  const cy = 90;
  const R = 62;
  const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

  const pts = RADAR_KEYS.map(({ key }, i) => {
    const v = Math.min(100, Math.max(0, Number(radar?.[key]) || 0)) / 100;
    const r = R * v;
    const a = angles[i];
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  });

  const poly = pts.join(' ');

  return (
    <div className="cp-radar-wrap">
      <svg className="cp-radar-svg" viewBox="0 0 180 180" aria-hidden>
        <defs>
          <linearGradient id="cp-radar-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`rgba(${rgb},0.35)`} />
            <stop offset="100%" stopColor={`rgba(${rgb},0.08)`} />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((t) => {
          const ring = angles
            .map((a) => {
              const rr = R * t;
              return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
            })
            .join(' ');
          return (
            <polygon
              key={t}
              points={ring}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          );
        })}
        <polygon points={poly} fill="url(#cp-radar-fill)" stroke={`rgba(${rgb},0.85)`} strokeWidth="1.5" />
        {RADAR_KEYS.map(({ key }, i) => {
          const v = Math.min(100, Math.max(0, Number(radar?.[key]) || 0)) / 100;
          const r = R * v;
          const a = angles[i];
          const x = cx + r * Math.cos(a);
          const y = cy + r * Math.sin(a);
          return <circle key={key} cx={x} cy={y} r={3.5} fill={`rgb(${rgb})`} className="cp-radar-dot" />;
        })}
      </svg>
      <ul className="cp-radar-legend">
        {RADAR_KEYS.map(({ key, label }) => (
          <li key={key}>
            <span className="cp-legend-label">{label}</span>
            <span className="cp-legend-val">{radar?.[key] ?? '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilmReelLoader({ line }) {
  return (
    <div className="cp-reel-stage" aria-busy="true">
      <div className="cp-reel">
        <div className="cp-reel-hub" />
        <div className="cp-reel-hole cp-reel-h1" />
        <div className="cp-reel-hole cp-reel-h2" />
        <div className="cp-reel-hole cp-reel-h3" />
        <div className="cp-reel-hole cp-reel-h4" />
      </div>
      <p className="cp-reel-text">{line}</p>
    </div>
  );
}

export default function CinePersonaCard({ userId, userName, isOwn, enabled }) {
  const { showToast } = useToast();
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [revealBurst, setRevealBurst] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await apiRoutes.users.cinePersona(userId);
      setPersona(res.data?.persona ?? null);
    } catch (e) {
      showToast(e.message || 'Could not load persona', 'error');
      setPersona(null);
    } finally {
      setLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    if (!enabled || !userId) {
      setPersona(null);
      return;
    }
    load();
  }, [enabled, userId, load]);

  useEffect(() => {
    if (!refreshing) return;
    const t = setInterval(() => setLineIdx((i) => (i + 1) % LOADING_LINES.length), 2200);
    return () => clearInterval(t);
  }, [refreshing]);

  const rgb = useMemo(() => auraRgb(persona?.auraGenre), [persona?.auraGenre]);

  async function handleRefresh() {
    if (!isOwn) return;
    setRefreshing(true);
    setLineIdx(0);
    try {
      const res = await apiRoutes.auth.refreshCinePersona();
      setPersona(res.data?.persona ?? null);
      setRevealBurst(true);
      setTimeout(() => setRevealBurst(false), 900);
      showToast('Cine-Persona revealed');
    } catch (e) {
      showToast(e.message || 'Could not refresh persona', 'error');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleShare() {
    if (!persona) return;
    const origin = window.location.origin;
    const url = `${origin}/users/${userId}#cine-persona`;
    const text = `${userName || 'A cinephile'} on CINÉVERSE — "${persona.title}"\n${persona.bio.slice(0, 160)}${persona.bio.length > 160 ? '…' : ''}\n${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: persona.title, text, url });
        showToast('Shared');
      } else {
        await navigator.clipboard.writeText(text);
        showToast('Copied persona summary + link');
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copied persona summary + link');
      } catch {
        showToast('Could not share', 'error');
      }
    }
  }

  if (!enabled || !userId) return null;

  const busy = loading || refreshing;

  return (
    <section id="cine-persona" className="profile-section cp-root" aria-labelledby="cp-heading">
      <div className="cp-section-head">
        <h2 id="cp-heading" className="profile-section-title">
          <Sparkles className="profile-section-title-icon" aria-hidden />
          Cine-Persona
        </h2>
        <p className="profile-section-lead">
          {isOwn
            ? 'A one-of-a-kind read on how you watch — generated from your completed films, then saved until you refresh.'
            : `${userName}'s cinematic identity (cached).`}
        </p>
      </div>

      {busy && (
        <FilmReelLoader line={refreshing ? LOADING_LINES[lineIdx] : 'Loading persona…'} />
      )}

      {!busy && !persona && (
        <div className="cp-empty glass-panel">
          <p className="muted">
            {isOwn
              ? 'No persona yet. We analyze your top completed picks, ratings, and genres — then consult the model (or our offline critic if no API key).'
              : 'They have not generated a persona yet.'}
          </p>
          {isOwn && (
            <button type="button" className="cp-btn cp-btn-primary" onClick={handleRefresh}>
              <Sparkles className="w-4 h-4" aria-hidden />
              Generate Cine-Persona
            </button>
          )}
        </div>
      )}

      {!busy && persona && (
        <div className="cp-scene-wrap">
          <AnimatePresence>
            {revealBurst && (
              <motion.div
                className="cp-flash"
                initial={{ opacity: 0.85, scale: 0.92 }}
                animate={{ opacity: 0, scale: 1.35 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.85, ease: 'easeOut' }}
                style={{
                  background: `radial-gradient(circle, rgba(${rgb},0.55) 0%, transparent 65%)`,
                }}
              />
            )}
          </AnimatePresence>

          <motion.div
            className="cp-scene"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className={`cp-flip-inner ${flipped ? 'is-flipped' : ''}`}>
              <div
                className="cp-face cp-face-front glass-panel"
                style={{
                  borderColor: `rgba(${rgb},0.45)`,
                  boxShadow: `0 0 40px rgba(${rgb},0.12), inset 0 0 60px rgba(${rgb},0.06)`,
                }}
              >
                <div
                  className="cp-aura"
                  style={{
                    background: `radial-gradient(ellipse at 50% 20%, rgba(${rgb},0.45), transparent 55%), radial-gradient(circle at 80% 80%, rgba(${rgb},0.15), transparent 40%)`,
                  }}
                />
                <div className="cp-front-content">
                  <p className="cp-aura-label">{persona.auraGenre}</p>
                  <h3 className="cp-title">{persona.title}</h3>
                  <PersonaRadar radar={persona.radar} rgb={rgb} />
                </div>
                <div className="cp-card-actions">
                  <button type="button" className="cp-icon-btn" onClick={() => setFlipped((f) => !f)} title="Flip card">
                    <FlipHorizontal className="w-4 h-4" />
                    <span>Bio & picks</span>
                  </button>
                </div>
              </div>

              <div
                className="cp-face cp-face-back glass-panel"
                style={{
                  borderColor: `rgba(${rgb},0.4)`,
                  boxShadow: `0 0 36px rgba(${rgb},0.1)`,
                }}
              >
                <div className="cp-back-inner">
                  <h3 className="cp-back-title">The script</h3>
                  <p className="cp-bio">{persona.bio}</p>
                  <h4 className="cp-classics-heading">Recommended classics</h4>
                  <ul className="cp-classics">
                    {(persona.classics || []).map((c) => {
                      const img = posterUrl(c.posterPath);
                      return (
                        <li key={`${c.tmdbId}-${c.title}`} className="cp-classic-row">
                          <div className="cp-classic-poster">
                            {img ? <img src={img} alt="" /> : <span className="cp-poster-fallback">—</span>}
                          </div>
                          <div>
                            <span className="cp-classic-title">{c.title}</span>
                            {c.year != null && <span className="cp-classic-year muted"> · {c.year}</span>}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {(!persona.classics || persona.classics.length === 0) && (
                    <p className="muted cp-classics-empty">Titles will appear after the next refresh.</p>
                  )}
                </div>
                <div className="cp-card-actions">
                  <button type="button" className="cp-icon-btn" onClick={() => setFlipped((f) => !f)} title="Flip back">
                    <FlipHorizontal className="w-4 h-4" />
                    <span>Front</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="cp-toolbar-bottom">
            {isOwn && (
              <button type="button" className="cp-btn" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? <Loader2 className="w-4 h-4 cp-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh persona
              </button>
            )}
            <button type="button" className="cp-btn cp-btn-ghost" onClick={handleShare} disabled={!persona}>
              <Share2 className="w-4 h-4" />
              Share persona
            </button>
          </div>
          {persona.updatedAt && (
            <p className="cp-updated muted">
              Last generated {new Date(persona.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
