import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, Clapperboard, HeartIcon, UsersIcon } from 'lucide-react';
import { apiRoutes, posterUrl, POSTER_PLACEHOLDER } from '../../api/client';
import './MarketingFeatureSections.css';

/** Fallback when offline / API error — same shape as API results */
const MOCK_CASES = [
  { title: 'Dune: Part Two', year: '2024', poster_path: '/1pdfLvkbY9ohJlCjQH2C4jjgubH.jpg' },
  { title: 'Oppenheimer', year: '2023', poster_path: '/8Gxv8gSFCU0XGDykEGh7gkPHajV.jpg' },
  { title: 'Parasite', year: '2019', poster_path: '/7IiTTgloJzvGI1TAYymCfbLe3s1.jpg' },
  { title: 'The Batman', year: '2022', poster_path: '/74xTEgt7R3p5PbLsrr5CYL8tGwI.jpg' },
  { title: 'Arrival', year: '2016', poster_path: '/xG9iPfzf3oiSJv2c5wqSORSTPRs.jpg' },
  { title: 'Blade Runner 2049', year: '2017', poster_path: '/gajva2L0rPYkEWj3FlkqCrDF7ED.jpg' },
];

const revealProps = {
  initial: { opacity: 0, y: 56 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
};

/** Floating AI recommendation card with soft pulse glow */
function AIRecommendationCard() {
  return (
    <div className="marketing-ai-card-wrap">
      <div className="marketing-ai-card-glow" aria-hidden />
      <motion.div
        className="marketing-ai-card"
        animate={{
          boxShadow: [
            '0 0 40px -12px rgba(225, 29, 72, 0.25)',
            '0 0 56px -8px rgba(225, 29, 72, 0.45)',
            '0 0 40px -12px rgba(225, 29, 72, 0.25)',
          ],
        }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="marketing-ai-card-header">
          <SparklesIcon className="w-5 h-5 text-cinematic-accent shrink-0" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            AI Recommendation
          </span>
        </div>
        <p className="marketing-ai-card-title">Blade Runner 2049</p>
        <p className="marketing-ai-card-meta">Sci-Fi · Neo-noir · 97% match</p>
        <div className="marketing-ai-card-bar">
          <motion.div
            className="marketing-ai-card-bar-fill"
            initial={{ width: '0%' }}
            whileInView={{ width: '97%' }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
          />
        </div>
        <p className="marketing-ai-card-reason">
          Matches your love for atmospheric world-building and practical-effects era sci-fi.
        </p>
      </motion.div>
    </div>
  );
}

function VaultCaseStrip() {
  /** Same source as PosterVortex / dashboard — avoids stale hardcoded poster_path + matches BluRayCase layout */
  const [cases, setCases] = useState(MOCK_CASES);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiRoutes.movies.trending('week', 1);
        const results = data?.results;
        if (!cancelled && Array.isArray(results) && results.length > 0) {
          const mapped = results
            .filter((m) => m.poster_path)
            .slice(0, 6)
            .map((m) => ({
              title: m.title || '—',
              year: (m.release_date || '').slice(0, 4) || '—',
              poster_path: m.poster_path,
            }));
          if (mapped.length >= 6) setCases(mapped);
        }
      } catch {
        /* keep MOCK_CASES */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="marketing-vault-scroll hide-scroll">
      <div className="marketing-vault-track">
        {cases.map((m, i) => {
          const src = posterUrl(m.poster_path) || POSTER_PLACEHOLDER;
          return (
            <div
              key={`${m.title}-${i}`}
              className={`marketing-bluray-case ${i % 2 === 0 ? 'marketing-bluray-case--tilt-a' : 'marketing-bluray-case--tilt-b'}`}
            >
              <div className="marketing-bluray-case-inner">
                <div className="marketing-bluray-spine" aria-hidden />
                {/*
                  Layering matches vault/BluRayCase + CineVault: absolute fill poster, title at bottom.
                  (Flex + justify-end was collapsing the poster area in some layouts.)
                */}
                <div className="marketing-bluray-front">
                  <img
                    className="marketing-bluray-poster-img"
                    src={src}
                    alt=""
                    loading="eager"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = POSTER_PLACEHOLDER;
                    }}
                  />
                  <div className="marketing-bluray-front-shade" aria-hidden />
                  <div className="marketing-bluray-meta">
                    <span className="marketing-bluray-title">{m.title}</span>
                    <span className="marketing-bluray-year">{m.year}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PULSE_ITEMS = [
  { icon: '💫', text: 'Alex just matched with Jordan on Interstellar!' },
  { icon: '🎬', text: 'Sam added Dune: Part Two to their watchlist.' },
  { icon: '❤️', text: 'Morgan liked Riley\'s public watchlist.' },
  { icon: '✨', text: 'Casey & Taylor both swiped right on Arrival — it\'s a match!' },
  { icon: '🍿', text: 'The Cine-Match room is live: Blade Runner vs. 2049 night.' },
  { icon: '🔔', text: 'Invite: Jamie wants to match movies with you!' },
];

function SocialPulseFeed() {
  const doubled = [...PULSE_ITEMS, ...PULSE_ITEMS];

  return (
    <div className="marketing-pulse-feed-outer">
      <div className="marketing-pulse-feed-fade marketing-pulse-feed-fade-top" />
      <div className="marketing-pulse-feed-fade marketing-pulse-feed-fade-bottom" />
      <div className="marketing-pulse-feed-scroll">
        <div className="marketing-pulse-feed-inner marketing-pulse-marquee">
          {doubled.map((item, i) => (
            <div key={`pulse-${i}`} className="marketing-pulse-row">
              <span className="marketing-pulse-emoji" aria-hidden>{item.icon}</span>
              <p className="marketing-pulse-text">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MarketingFeatureSections() {
  return (
    <div id="features" className="marketing-features relative z-30 scroll-mt-24">
      {/* 1. Smart Discovery — visual left, copy right */}
      <section className="marketing-section marketing-section-dark">
        <motion.div className="marketing-section-inner" {...revealProps}>
          <div className="marketing-split">
            <div className="marketing-split-visual">
              <AIRecommendationCard />
            </div>
            <div className="marketing-split-copy">
              <div className="marketing-glass-card">
                <h2 className="marketing-headline">
                  Your AI Film <span className="text-cinematic-accent">Critic.</span>
                </h2>
                <p className="marketing-body">
                  Stop scrolling, start watching. Our AI analyzes your taste to find your next
                  favorite movie across all streaming platforms.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. Social Pulse — visual left, copy right */}
      <section className="marketing-section marketing-section-dark">
        <motion.div className="marketing-section-inner" {...revealProps}>
          <div className="marketing-split">
            <div className="marketing-split-visual">
              <div className="marketing-pulse-shell">
                <div className="marketing-pulse-chrome">
                  <Clapperboard className="w-4 h-4 text-cinematic-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Live Pulse
                  </span>
                </div>
                <SocialPulseFeed />
              </div>
            </div>
            <div className="marketing-split-copy">
              <div className="marketing-glass-card">
                <h2 className="marketing-headline">
                  Watch With <span className="text-cinematic-accent">Friends.</span>
                </h2>
                <p className="marketing-body">
                  Experience Cine-Match and real-time watchlists to make movie night a team sport.
                </p>
                <div className="marketing-inline-icons">
                  <UsersIcon className="w-5 h-5 text-slate-500" />
                  <HeartIcon className="w-5 h-5 text-cinematic-accent/80" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. 3D Vault — full-width copy, then strip (avoids narrow split column) */}
      <section className="marketing-section marketing-section-void marketing-section-vault">
        <motion.div className="marketing-section-inner" {...revealProps}>
          <div className="marketing-vault-stack">
            <div className="marketing-vault-copy">
              <h2 className="marketing-headline marketing-headline-vault text-balance">
                Build Your Digital <span className="text-slate-300">Trophy Room.</span>
              </h2>
              <p className="marketing-body">
                Collect your cinematic milestones in a stunning 3D Vault that grows with your movie
                history.
              </p>
            </div>
            <div className="marketing-vault-strip-wrap">
              <VaultCaseStrip />
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
