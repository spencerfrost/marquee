import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchMulti } from '@/utils/api';
import type { SearchHit } from '@/utils/types';
import { User } from 'lucide-react';

const GROUP_LABELS: Record<SearchHit['kind'], string> = {
  person: 'People',
  movie: 'Movies',
  tv: 'TV',
  collection: 'Collections',
};

const GROUP_ORDER: SearchHit['kind'][] = ['person', 'movie', 'tv', 'collection'];

const hitHref = (hit: SearchHit): string =>
  hit.kind === 'person' ? `/person/${hit.id}` : `/${hit.kind}/${hit.id}`;

const hitLabel = (hit: SearchHit): string =>
  hit.kind === 'person' || hit.kind === 'collection' ? hit.name : hit.title;

const HitCard: React.FC<{ hit: SearchHit }> = ({ hit }) => (
  <Link
    to={hitHref(hit)}
    className="group flex flex-col gap-2"
  >
    <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-slate-800 ring-1 ring-white/5 transition-all group-hover:ring-amber-500/40">
      {hit.kind === 'person' ? (
        hit.profilePath ? (
          <img src={hit.profilePath} alt={hit.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-600">
            <User className="h-8 w-8" />
          </div>
        )
      ) : hit.posterPath ? (
        <img src={hit.posterPath} alt={hitLabel(hit)} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-slate-500">
          {hitLabel(hit)}
        </div>
      )}
    </div>
    <div>
      <p className="truncate text-sm font-semibold text-slate-200 group-hover:text-amber-400">
        {hitLabel(hit)}
      </p>
      <p className="truncate text-xs text-slate-500">
        {hit.kind === 'person' ? hit.knownForDepartment : hit.kind === 'collection' ? 'Collection' : hit.year}
      </p>
    </div>
  </Link>
);

export const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';

  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }
    setLoading(true);
    setError(null);
    searchMulti(query)
      .then(({ hits: results }) => {
        setHits(results);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Search failed'))
      .finally(() => setLoading(false));
  }, [query]);

  const grouped = GROUP_ORDER.map(kind => ({
    kind,
    items: hits.filter(h => h.kind === kind),
  })).filter(g => g.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
          Search results for "{query}"
        </h1>
        {!loading && (
          <p className="mt-1 text-sm text-slate-500">
            {hits.length} {hits.length === 1 ? 'result' : 'results'}
          </p>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}

        {loading ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-slate-800/60" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-20 text-center">
            <p className="text-sm font-medium text-slate-300">No results found</p>
          </div>
        ) : (
          grouped.map(group => (
            <section key={group.kind} className="mt-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {GROUP_LABELS[group.kind]}
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {group.items.map(hit => (
                  <HitCard key={`${hit.kind}-${hit.id}`} hit={hit} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
