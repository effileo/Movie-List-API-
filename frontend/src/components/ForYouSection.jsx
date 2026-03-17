import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRoutes } from '../api/client';
import GenreSurvey from './GenreSurvey';
import BentoGrid from './BentoGrid';
import SurpriseMeButton from './SurpriseMeButton';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ForYouSection() {
  const [surveyGenres, setSurveyGenres] = useState('');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Use React Query for caching recommendations
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['recommendations', surveyGenres],
    queryFn: () => apiRoutes.users.recommendations(surveyGenres),
    enabled: !!user, // Only run the query if the user is authenticated
    // If the backend returns needsOnboarding, that's fine, we handle it in state.
  });

  const handleSurveySubmit = async (selectedIds) => {
    const genreString = selectedIds.join(',');
    setSurveyGenres(genreString);
    // Component will auto-refetch due to queryKey change
  };

  const handleSurpriseResult = (movieResult) => {
    // If we want to dynamically inject the surprise into the currently viewed list:
    // We can manually update the cached data, pushing it to index 1 or replacing the grid
    queryClient.setQueryData(['recommendations', surveyGenres], (oldData) => {
        if (!oldData || !oldData.results) return oldData;
        const newResults = [movieResult, ...oldData.results.filter(m => m.id !== movieResult.id)].slice(0, 5);
        return { ...oldData, results: newResults };
    });
  };

  if (!user) {
    return (
      <section className="w-full">
        <div className="flex flex-col mb-8 pb-4 border-b border-cinematic-border/50">
          <h2 className="text-3xl font-black tracking-tight text-white mb-1">
            For You
          </h2>
          <p className="text-cinematic-muted text-sm tracking-wide">
            Personalized picks based on your watchlist and ratings.
          </p>
        </div>
        
        <div className="w-full flex flex-col items-center justify-center text-center py-16 bg-white/5 border border-white/10 rounded-3xl">
          <h3 className="text-xl font-bold text-white mb-2">Want personalized recommendations?</h3>
          <p className="text-cinematic-muted mb-8">Sign in to kickstart our AI recommendation engine.</p>
          <Link to="/login" className="px-8 py-4 rounded-full bg-cinematic-accent hover:bg-blue-600 text-white font-bold tracking-wide transition-colors">
            Sign In to HealthNet
          </Link>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-cinematic-accent border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full text-center py-10 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
        Failed to load recommendations. Please try again.
      </div>
    );
  }

  const { needsOnboarding, results } = data || {};

  return (
    <section className="w-full">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 pb-4 border-b border-cinematic-border/50 gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white mb-1">
            For You
          </h2>
          <p className="text-cinematic-muted text-sm tracking-wide">
            Personalized picks based on your watchlist and ratings.
          </p>
        </div>
        
        {!needsOnboarding && (
          <SurpriseMeButton onSurpriseResult={handleSurpriseResult} />
        )}
      </div>

      {needsOnboarding ? (
        <GenreSurvey onSubmit={handleSurveySubmit} />
      ) : (
        <BentoGrid recommendations={results} />
      )}
    </section>
  );
}
