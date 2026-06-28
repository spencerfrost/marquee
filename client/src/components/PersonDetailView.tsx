// PersonDetailView.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPersonDetails } from '@/utils/api';
import type { PersonDetail } from '@/utils/types';
import { Alert, AlertDescription } from './ui/alert';
import { DetailContainer } from './DetailContainer';

const PersonDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadPerson = async () => {
      setLoading(true);
      try {
        const data = await fetchPersonDetails(Number(id));
        setPerson(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load person');
      } finally {
        setLoading(false);
      }
    };
    loadPerson();
  }, [id]);

  if (loading) {
    return (
      <DetailContainer>
        <div className="rounded-xl bg-slate-900 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="aspect-[3/4] w-full flex-shrink-0 animate-pulse rounded-lg bg-slate-800 md:w-56" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-2/3 animate-pulse rounded bg-slate-800" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-slate-800" />
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-slate-800" />
                <div className="h-3 w-full animate-pulse rounded bg-slate-800" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-slate-800" />
              </div>
            </div>
          </div>
        </div>
      </DetailContainer>
    );
  }

  if (error) {
    return (
      <DetailContainer>
        <Alert
          variant="destructive"
          className="border-red-900/50 bg-red-950/40 text-red-200"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DetailContainer>
    );
  }

  if (!person) return null;

  // Sort credits by release date (newest first) for better UX
  const sortedCast =
    person.combined_credits?.cast.slice().sort((a, b) => {
      const dateA = a.release_date || a.first_air_date || '1900-01-01';
      const dateB = b.release_date || b.first_air_date || '1900-01-01';
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    }) || [];

  return (
    <DetailContainer>
      <div className="overflow-hidden rounded-xl bg-slate-900">
        {/* Biography Section */}
        <div className="flex flex-col gap-6 p-6 md:flex-row md:p-8">
          <div className="w-40 flex-shrink-0 md:w-56">
            {person.profile_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
                alt={person.name}
                className="w-full rounded-lg object-cover shadow-2xl shadow-black/40 ring-1 ring-white/10"
              />
            ) : (
              <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-slate-800 text-sm text-slate-500">
                No image
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl">
              {person.name}
            </h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              {person.place_of_birth || 'Birthplace unknown'}
            </p>

            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Biography
            </h3>
            <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-slate-300">
              {person.biography || `We don't have a biography for ${person.name}.`}
            </p>
          </div>
        </div>

        {/* Filmography / Credits Section */}
        {sortedCast.length > 0 && (
          <div className="border-t border-slate-800 p-6 md:p-8">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Known for
            </h3>
            <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
              {sortedCast.map((credit) => (
                <Link
                  key={credit.credit_id}
                  to={`/${credit.media_type}/${credit.id}`}
                  className="group w-32 flex-shrink-0"
                >
                  <div className="mb-2 aspect-[2/3] w-32 overflow-hidden rounded-lg bg-slate-800 ring-1 ring-white/5 transition-all group-hover:ring-amber-500/40">
                    {credit.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${credit.poster_path}`}
                        alt={credit.title || credit.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-slate-500">
                        No poster
                      </div>
                    )}
                  </div>
                  <p className="truncate text-sm font-semibold text-slate-200 transition-colors group-hover:text-amber-400">
                    {credit.title || credit.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {credit.character || 'Self'}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </DetailContainer>
  );
};

export default PersonDetailView;