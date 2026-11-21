import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchMulti } from '@/utils/api';
import { useDocumentTitle } from '@/utils/useDocumentTitle';
import type { SearchHit } from '@/utils/types';
import { User } from 'lucide-react';
import { BrowseLayout } from './SiteHeader';

const GROUP_LABELS: Record<SearchHit['kind'], string> = {
  person: 'People',
  movie: 'Movies',
  tv: 'TV',
  collection: 'Collections',
};

const GROUP_ORDER: SearchHit['kind'][] = ['person', 'movie', 'tv', 'collection'];

// Tab order puts titles first; the All view keeps GROUP_ORDER's sections.
const TAB_ORDER: SearchHit['kind'][] = ['movie', 'tv', 'person', 'collection'];
type Tab = 'all' | SearchHit['kind'];
const isKind = (value: string | null): value is SearchHit['kind'] =>
  (GROUP_ORDER as (string | null)[]).includes(value);


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

const HitGrid: React.FC<{ hits: SearchHit[] }> = ({ hits }) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
    {hits.map(hit => (
      <HitCard key={`${hit.kind}-${hit.id}`} hit={hit} />
    ))}
  </div>
);

export const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const typeParam = searchParams.get('type');
  const requestedTab: Tab = isKind(typeParam) ? typeParam : 'all';
  useDocumentTitle(query.trim() ? `Search: ${query.trim()}` : 'Search');

  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchMulti(query)
      .then(({ hits: results }) => {
        if (!cancelled) setHits(results);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Search failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const grouped = GROUP_ORDER.map(kind => ({
    kind,
    items: hits.filter(h => h.kind === kind),
  })).filter(g => g.items.length > 0);

  // Tabs filter the one page of /search/multi results already loaded. A tab
  // with no hits isn't shown, and a ?type= pointing at one falls back to All.
  const tabs = TAB_ORDER.filter(kind => grouped.some(g => g.kind === kind));
  const tab: Tab = requestedTab !== 'all' && (loading || tabs.includes(requestedTab)) ? requestedTab : 'all';
  const selectTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('type');
    else params.set('type', next);
    setSearchParams(params, { replace: true });
  };
  const visible = tab === 'all' ? hits : hits.filter(h => h.kind === tab);

  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-slate-100'
    }`;

  return (
    <BrowseLayout>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
        Search results for "{query}"
      </h1>
      {!loading && (
        <p className="mt-1 text-sm text-slate-500">
          {visible.length} {visible.length === 1 ? 'result' : 'results'}
        </p>
      )}

      {!loading && tabs.length > 1 && (
        <div role="tablist" aria-label="Filter results by type" className="mt-4 flex flex-wrap gap-1">
          <button type="button" role="tab" aria-selected={tab === 'all'} className={tabClass(tab === 'all')} onClick={() => selectTab('all')}>
            All <span className="text-slate-500">{hits.length}</span>
          </button>
          {tabs.map(kind => {
            const count = grouped.find(g => g.kind === kind)?.items.length ?? 0;
            return (
              <button key={kind} type="button" role="tab" aria-selected={tab === kind} className={tabClass(tab === kind)} onClick={() => selectTab(kind)}>
                {GROUP_LABELS[kind]} <span className="text-slate-500">{count}</span>
              </button>
            );
          })}
        </div>
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
      ) : visible.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-20 text-center">
          <p className="text-sm font-medium text-slate-300">No results found</p>
        </div>
      ) : tab === 'all' ? (
        grouped.map(group => (
          <section key={group.kind} className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {GROUP_LABELS[group.kind]}
            </h2>
            <HitGrid hits={group.items} />
          </section>
        ))
      ) : (
        <div className="mt-8">
          <HitGrid hits={visible} />
        </div>
      )}
    </BrowseLayout>
  );
};

export default SearchResultsPage;
