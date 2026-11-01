import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchMulti } from '@/utils/api';
import type { SearchHit } from '@/utils/types';
import { Search, User } from 'lucide-react';

// Flattened for keyboard nav; visual grouping (People / Movies / TV) is
// derived from this same order so indices line up with what's on screen.
function groupOrder(hits: SearchHit[]): SearchHit[] {
  const order: SearchHit['kind'][] = ['person', 'movie', 'tv', 'collection'];
  return order.flatMap(kind => hits.filter(h => h.kind === kind));
}

const GROUP_LABELS: Record<SearchHit['kind'], string> = {
  person: 'People',
  movie: 'Movies',
  tv: 'TV',
  collection: 'Collections',
};

export const OmniSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsSearching(true);
        try {
          const { hits: results } = await searchMulti(query.trim());
          setHits(groupOrder(results));
          setActiveIndex(-1);
        } catch (error) {
          console.error('Failed to search', error);
          setHits([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setHits([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goToHit = (hit: SearchHit) => {
    setIsOpen(false);
    setQuery('');
    setHits([]);
    if (hit.kind === 'person') {
      navigate(`/person/${hit.id}`);
    } else if (hit.kind === 'collection') {
      navigate(`/collection/${hit.id}`);
    } else {
      navigate(`/${hit.kind}/${hit.id}`);
    }
  };

  const goToResultsPage = () => {
    if (!query.trim()) return;
    setIsOpen(false);
    navigate(`/search?query=${encodeURIComponent(query.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && hits[activeIndex]) {
        goToHit(hits[activeIndex]);
      } else {
        goToResultsPage();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  let renderedGroup: SearchHit['kind'] | null = null;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search people, movies, TV..."
          aria-label="Search people, movies, and TV"
          className="w-full rounded-lg border border-slate-700 bg-slate-800/80 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        />
      </div>

      {isOpen && query.trim().length > 1 && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
          {isSearching ? (
            <div className="px-4 py-3 text-sm text-slate-400">Searching...</div>
          ) : hits.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400">No results found.</div>
          ) : (
            <div className="max-h-96 overflow-y-auto py-1">
              {hits.map((hit, index) => {
                const showLabel = hit.kind !== renderedGroup;
                renderedGroup = hit.kind;
                return (
                  <React.Fragment key={`${hit.kind}-${hit.id}`}>
                    {showLabel && (
                      <div className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {GROUP_LABELS[hit.kind]}
                      </div>
                    )}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goToHit(hit)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                        index === activeIndex ? 'bg-slate-800 text-white' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex h-10 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-slate-800">
                        {hit.kind === 'person' ? (
                          hit.profilePath ? (
                            <img src={hit.profilePath} alt={hit.name} className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-4 w-4 text-slate-600" />
                          )
                        ) : hit.posterPath ? (
                          <img
                            src={hit.posterPath}
                            alt={hit.kind === 'collection' ? hit.name : hit.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-800" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {hit.kind === 'person' || hit.kind === 'collection' ? hit.name : hit.title}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {hit.kind === 'person'
                            ? hit.knownFor.slice(0, 3).join(' | ') || hit.knownForDepartment
                            : hit.kind === 'collection'
                              ? 'Collection'
                              : hit.year}
                        </p>
                      </div>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={goToResultsPage}
            className="w-full border-t border-slate-800 px-4 py-2 text-left text-xs font-medium text-amber-400 hover:bg-slate-800"
          >
            See all results for "{query.trim()}"
          </button>
        </div>
      )}
    </div>
  );
};
