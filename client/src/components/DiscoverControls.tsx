import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import type { Genre, CompanySummary, NetworkSummary, KeywordSummary, PersonSummary, WatchProviderEntry } from '@/utils/types';
import type { DiscoverFilters, FilterAction } from './DiscoverPage';
import { GenreSelector } from './GenreSelector';
import { CompanySelector } from './CompanySelector';
import { NetworkSelector } from './NetworkSelector';
import { DateRangeSelector } from './DateRangeSelector';
import { KeywordSelector } from './KeywordSelector';
import { PersonSelector } from './PersonSelector';
import { WatchProviderSelector } from './WatchProviderSelector';

// Mirrors the server's fallback floor in discoverFiltered.ts — keep in sync
export const DEFAULT_MIN_VOTES = { movie: 200, tv: 50 } as const;

const ANY_VALUE = '__any__';

const LANGUAGES = [
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'zh', label: 'Chinese' },
  { value: 'hi', label: 'Hindi' },
];

const ORIGIN_COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Germany' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'CN', label: 'China' },
  { value: 'IN', label: 'India' },
  { value: 'CA', label: 'Canada' },
];

// Movie only — TMDB discover has no equivalent certification filter for TV.
const CERTIFICATIONS = ['G', 'PG', 'PG-13', 'R', 'NC-17'];

// Verified by sampling each value against /discover/tv — see task doc.
const TV_TYPES = [
  { value: 0, label: 'Documentary' },
  { value: 1, label: 'News' },
  { value: 2, label: 'Miniseries' },
  { value: 3, label: 'Reality' },
  { value: 4, label: 'Scripted' },
  { value: 5, label: 'Talk Show' },
  { value: 6, label: 'Video' },
];

const TV_STATUSES = [
  { value: 0, label: 'Returning Series' },
  { value: 1, label: 'Planned' },
  { value: 2, label: 'In Production' },
  { value: 3, label: 'Ended' },
  { value: 4, label: 'Canceled' },
  { value: 5, label: 'Pilot' },
];

function toggleInArray(current: number[], value: number): number[] {
  return current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
}

interface DiscoverControlsProps {
  filters: DiscoverFilters;
  dispatch: React.Dispatch<FilterAction>;
  genres: Genre[];
  watchProviderOptions: WatchProviderEntry[];
  onSearch: () => void;
  loading: boolean;
}

export const DiscoverControls: React.FC<DiscoverControlsProps> = ({
  filters,
  dispatch,
  genres,
  watchProviderOptions,
  onSearch,
  loading,
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Draft input, decoupled from the committed filters.searchQuery so typing
  // doesn't fire a request per keystroke. Committed on Search/Enter, or
  // ~400ms after the user stops typing — dispatch (trackedDispatch) already
  // flips `browsing` false as a side effect, so committing alone is enough
  // to leave the home rails and trigger a fetch.
  const [searchDraft, setSearchDraft] = useState(filters.searchQuery);
  const committedSearchRef = useRef(filters.searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitSearch = (value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const trimmed = value.trim();
    if (trimmed === committedSearchRef.current) return;
    committedSearchRef.current = trimmed;
    dispatch({ type: 'SET_SEARCH_QUERY', value: trimmed });
  };

  useEffect(() => {
    if (searchDraft.trim() === committedSearchRef.current) return;
    debounceRef.current = setTimeout(() => commitSearch(searchDraft), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  const handleSearchCommit = () => {
    commitSearch(searchDraft);
    onSearch();
  };

  const { mediaType } = filters;
  const effectiveMinVotes = filters.minVoteCount ?? DEFAULT_MIN_VOTES[mediaType];

  // Values equal to the media-type default normalize back to null ("use
  // default"), so retyping the default clears the override and the badge.
  const handleMinVotesChange = (raw: number) => {
    const clamped = Math.max(0, Math.floor(raw) || 0);
    dispatch({
      type: 'SET_MIN_VOTE_COUNT',
      value: clamped === DEFAULT_MIN_VOTES[mediaType] ? null : clamped,
    });
  };

  // Calculate how many advanced filters are currently active.
  // Networks/certification/tv type/status only count for the media type
  // they apply to — selections are kept in state when switching (so
  // toggling back restores them) but aren't applied or counted otherwise.
  const activeFilterCount =
    (filters.releaseDateFrom !== null || filters.releaseDateTo !== null ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.minVoteCount !== null ? 1 : 0) +
    (filters.runtimeMin !== null || filters.runtimeMax !== null ? 1 : 0) +
    (filters.originalLanguage !== null ? 1 : 0) +
    (filters.originCountry !== null ? 1 : 0) +
    (mediaType === 'movie' && filters.certification !== null ? 1 : 0) +
    filters.genreIds.length +
    filters.companies.length +
    (mediaType === 'tv' ? filters.networks.length : 0) +
    (mediaType === 'tv' ? filters.tvTypes.length + filters.tvStatuses.length : 0) +
    filters.keywords.length +
    filters.excludeKeywords.length +
    filters.people.length +
    filters.watchProviderIds.length;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-black/30 backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col gap-4">

        {/* Top Row: Media Type, Search, & Actions */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end">

          <div className="flex flex-col gap-1.5 shrink-0">
            <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Type
            </Label>
            <ToggleGroup
              value={[mediaType]}
              onValueChange={(groupValue: string[]) => {
                // Empty when the user clicks the already-pressed item; keep the current selection
                if (groupValue.length > 0) {
                  dispatch({ type: 'SET_MEDIA_TYPE', value: groupValue[0] as 'movie' | 'tv' });
                }
              }}
            >
              <ToggleGroupItem value="movie">Movies</ToggleGroupItem>
              <ToggleGroupItem value="tv">TV Shows</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex flex-grow flex-col gap-1.5">
            <Label htmlFor="search" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Search
            </Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by title, e.g. Batman..."
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchCommit();
              }}
              className="w-full border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:ring-amber-500/40 focus-visible:border-amber-500/60"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto shrink-0">
            <Button
              onClick={handleSearchCommit}
              disabled={loading}
              className="flex-1 bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50 md:w-auto"
            >
              {loading ? 'Searching…' : 'Search'}
            </Button>

            <Button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`flex-1 border transition-colors md:w-auto ${isFiltersOpen
                ? 'bg-slate-800 border-slate-600 text-white'
                : 'bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
            >
              Filters {activeFilterCount > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Collapsible Bottom Row: Advanced Filters */}
        {isFiltersOpen && (
          <div className="mt-2 flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 border-t border-slate-800 pt-4">

            {/* Numerical/Toggle Filters */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium text-slate-300">
                  Release Date
                </Label>
                <DateRangeSelector
                  from={filters.releaseDateFrom}
                  to={filters.releaseDateTo}
                  onChange={(from, to) => dispatch({ type: 'SET_DATE_RANGE', from, to })}
                />
              </div>

              <div className="flex items-center gap-4">
                <Label htmlFor="min-rating" className="whitespace-nowrap text-sm font-medium text-slate-300">
                  Min Rating:{' '}
                  <span className="font-mono text-amber-400 ml-1">{filters.minRating.toFixed(1)}</span>
                </Label>
                {/* Fixed-width wrapper: the slider root stretches to w-full,
                    which collapses inside a flex row without it */}
                <div className="w-48">
                  <Slider
                    id="min-rating"
                    min={0}
                    max={10}
                    step={0.5}
                    value={[filters.minRating]}
                    onValueChange={(value) =>
                      dispatch({ type: 'SET_MIN_RATING', value: Array.isArray(value) ? value[0] : value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Label htmlFor="min-votes" className="whitespace-nowrap text-sm font-medium text-slate-300">
                  Min Votes
                </Label>
                {/* Single-element array: the ui/slider wrapper renders one
                    thumb per value; slider pegs at 1000 for larger typed values */}
                <div className="w-48">
                  <Slider
                    id="min-votes"
                    min={0}
                    max={1000}
                    step={50}
                    value={[Math.min(effectiveMinVotes, 1000)]}
                    onValueChange={(value) =>
                      handleMinVotesChange(Array.isArray(value) ? value[0] : value)
                    }
                  />
                </div>
                <Input
                  type="number"
                  min="0"
                  step="50"
                  aria-label="Min Votes"
                  value={effectiveMinVotes}
                  onChange={(e) => handleMinVotesChange(e.target.valueAsNumber)}
                  className="w-24 border-slate-700 bg-slate-800/80 font-mono text-slate-100 focus-visible:ring-amber-500/40 focus-visible:border-amber-500/60"
                />
              </div>

              <div className="flex items-center gap-3">
                <Label className="whitespace-nowrap text-sm font-medium text-slate-300">
                  Runtime (min)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="5"
                  placeholder="Min"
                  aria-label="Minimum runtime"
                  value={filters.runtimeMin ?? ''}
                  onChange={(e) => dispatch({
                    type: 'SET_RUNTIME_RANGE',
                    min: Number.isNaN(e.target.valueAsNumber) ? null : e.target.valueAsNumber,
                    max: filters.runtimeMax,
                  })}
                  className="w-20 border-slate-700 bg-slate-800/80 font-mono text-slate-100 focus-visible:ring-amber-500/40 focus-visible:border-amber-500/60"
                />
                <span className="text-slate-500">–</span>
                <Input
                  type="number"
                  min="0"
                  step="5"
                  placeholder="Max"
                  aria-label="Maximum runtime"
                  value={filters.runtimeMax ?? ''}
                  onChange={(e) => dispatch({
                    type: 'SET_RUNTIME_RANGE',
                    min: filters.runtimeMin,
                    max: Number.isNaN(e.target.valueAsNumber) ? null : e.target.valueAsNumber,
                  })}
                  className="w-20 border-slate-700 bg-slate-800/80 font-mono text-slate-100 focus-visible:ring-amber-500/40 focus-visible:border-amber-500/60"
                />
              </div>
            </div>

            {/* Language / Origin / Certification */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <div className="flex items-center gap-3">
                <Label className="whitespace-nowrap text-sm font-medium text-slate-300">
                  Language
                </Label>
                <Select
                  items={[{ value: ANY_VALUE, label: 'Any language' }, ...LANGUAGES]}
                  value={filters.originalLanguage ?? ANY_VALUE}
                  onValueChange={(value: string | null) =>
                    dispatch({ type: 'SET_ORIGINAL_LANGUAGE', value: value === ANY_VALUE ? null : value })
                  }
                >
                  <SelectTrigger className="w-40 border-slate-700 bg-slate-800/80 text-slate-100 hover:bg-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-900 text-slate-300 shadow-xl">
                    <SelectItem value={ANY_VALUE} className="cursor-pointer focus:bg-slate-800 focus:text-slate-100">
                      Any language
                    </SelectItem>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value} className="cursor-pointer focus:bg-slate-800 focus:text-slate-100">
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Label className="whitespace-nowrap text-sm font-medium text-slate-300">
                  Origin Country
                </Label>
                <Select
                  items={[{ value: ANY_VALUE, label: 'Any country' }, ...ORIGIN_COUNTRIES]}
                  value={filters.originCountry ?? ANY_VALUE}
                  onValueChange={(value: string | null) =>
                    dispatch({ type: 'SET_ORIGIN_COUNTRY', value: value === ANY_VALUE ? null : value })
                  }
                >
                  <SelectTrigger className="w-44 border-slate-700 bg-slate-800/80 text-slate-100 hover:bg-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-900 text-slate-300 shadow-xl">
                    <SelectItem value={ANY_VALUE} className="cursor-pointer focus:bg-slate-800 focus:text-slate-100">
                      Any country
                    </SelectItem>
                    {ORIGIN_COUNTRIES.map((country) => (
                      <SelectItem key={country.value} value={country.value} className="cursor-pointer focus:bg-slate-800 focus:text-slate-100">
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* TMDB has no discover-side certification filter for TV */}
              {mediaType === 'movie' && (
                <div className="flex items-center gap-3">
                  <Label className="whitespace-nowrap text-sm font-medium text-slate-300">
                    Certification (US)
                  </Label>
                  <Select
                    items={[{ value: ANY_VALUE, label: 'Any' }, ...CERTIFICATIONS.map(c => ({ value: c, label: c }))]}
                    value={filters.certification ?? ANY_VALUE}
                    onValueChange={(value: string | null) =>
                      dispatch({ type: 'SET_CERTIFICATION', value: value === ANY_VALUE ? null : value })
                    }
                  >
                    <SelectTrigger className="w-28 border-slate-700 bg-slate-800/80 text-slate-100 hover:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-900 text-slate-300 shadow-xl">
                      <SelectItem value={ANY_VALUE} className="cursor-pointer focus:bg-slate-800 focus:text-slate-100">
                        Any
                      </SelectItem>
                      {CERTIFICATIONS.map((cert) => (
                        <SelectItem key={cert} value={cert} className="cursor-pointer focus:bg-slate-800 focus:text-slate-100">
                          {cert}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Categorical Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Genres
                </Label>
                <GenreSelector
                  genres={genres}
                  selectedIds={filters.genreIds}
                  onChange={(ids) => dispatch({ type: 'SET_GENRE_IDS', value: ids })}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Studios
                </Label>
                <CompanySelector
                  selectedCompanies={filters.companies}
                  onChange={(companies: CompanySummary[]) => dispatch({ type: 'SET_COMPANIES', value: companies })}
                />
              </div>

              {/* TMDB only supports network filtering on /discover/tv */}
              {mediaType === 'tv' && (
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Networks
                  </Label>
                  <NetworkSelector
                    selectedNetworks={filters.networks}
                    onChange={(networks: NetworkSummary[]) => dispatch({ type: 'SET_NETWORKS', value: networks })}
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Keywords
                </Label>
                <KeywordSelector
                  selectedKeywords={filters.keywords}
                  onChange={(keywords: KeywordSummary[]) => dispatch({ type: 'SET_KEYWORDS', value: keywords })}
                  placeholder="e.g. time loop..."
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Exclude Keywords
                </Label>
                <KeywordSelector
                  selectedKeywords={filters.excludeKeywords}
                  onChange={(keywords: KeywordSummary[]) => dispatch({ type: 'SET_EXCLUDE_KEYWORDS', value: keywords })}
                  placeholder="e.g. superhero..."
                  badgeClassName="bg-red-500/20 text-red-300 border border-red-500/40"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {mediaType === 'movie' ? 'Cast & Crew' : 'Cast & Crew (shows their TV credits)'}
                </Label>
                <PersonSelector
                  selectedPeople={filters.people}
                  onChange={(people: PersonSummary[]) => dispatch({ type: 'SET_PEOPLE', value: people })}
                  maxSelections={mediaType === 'tv' ? 1 : undefined}
                />
                {/* TMDB has no with_people equivalent for /discover/tv */}
                {mediaType === 'tv' && (
                  <p className="text-xs text-slate-500">
                    TV has no person filter on TMDB — selecting someone shows their TV credits instead of narrowing the grid.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Where to Watch
                </Label>
                <WatchProviderSelector
                  providers={watchProviderOptions}
                  selectedIds={filters.watchProviderIds}
                  onChange={(ids) => dispatch({ type: 'SET_WATCH_PROVIDER_IDS', value: ids })}
                />
              </div>
            </div>

            {/* TV-only: type & status */}
            {mediaType === 'tv' && (
              <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    TV Type
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {TV_TYPES.map((type) => {
                      const active = filters.tvTypes.includes(type.value);
                      return (
                        <button
                          key={type.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => dispatch({ type: 'SET_TV_TYPES', value: toggleInArray(filters.tvTypes, type.value) })}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${active
                            ? 'border-amber-500/60 bg-amber-500/20 text-amber-400'
                            : 'border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    TV Status
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {TV_STATUSES.map((status) => {
                      const active = filters.tvStatuses.includes(status.value);
                      return (
                        <button
                          key={status.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => dispatch({ type: 'SET_TV_STATUSES', value: toggleInArray(filters.tvStatuses, status.value) })}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${active
                            ? 'border-amber-500/60 bg-amber-500/20 text-amber-400'
                            : 'border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                          {status.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};
