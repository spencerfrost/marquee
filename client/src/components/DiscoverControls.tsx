import React, { useState } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import type { Genre, CompanySummary } from '@/utils/types';
import { GenreSelector } from './GenreSelector';
import { CompanySelector } from './CompanySelector';

interface DiscoverControlsProps {
  mediaType: 'movie' | 'tv';
  setMediaType: (type: 'movie' | 'tv') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  fetchByYear: boolean;
  setFetchByYear: (fetch: boolean) => void;
  year: number;
  setYear: (year: number) => void;
  minRating: number;
  setMinRating: (rating: number) => void;
  genres: Genre[];
  genreIds: number[];
  setGenreIds: (ids: number[]) => void;
  selectedCompanies: CompanySummary[];
  setSelectedCompanies: (companies: CompanySummary[]) => void;
  onSearch: () => void;
  loading: boolean;
}

export const DiscoverControls: React.FC<DiscoverControlsProps> = ({
  mediaType,
  setMediaType,
  searchQuery,
  setSearchQuery,
  fetchByYear,
  setFetchByYear,
  year,
  setYear,
  minRating,
  setMinRating,
  genres,
  genreIds,
  setGenreIds,
  selectedCompanies,
  setSelectedCompanies,
  onSearch,
  loading,
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Calculate how many advanced filters are currently active
  const activeFilterCount =
    (fetchByYear ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    genreIds.length +
    selectedCompanies.length;

  return (
    <div className="sticky top-4 z-20 rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-black/30 backdrop-blur-md transition-all duration-300">
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
                  setMediaType(groupValue[0] as 'movie' | 'tv');
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 focus-visible:ring-amber-500/40 focus-visible:border-amber-500/60"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto shrink-0">
            <Button
              onClick={onSearch}
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
                <Checkbox
                  id="fetch-by-year"
                  checked={fetchByYear}
                  onCheckedChange={(checked) => setFetchByYear(checked as boolean)}
                  className="border-slate-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <Label htmlFor="fetch-by-year" className="text-sm font-medium text-slate-300">
                  Year
                </Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  disabled={!fetchByYear}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  className="w-24 border-slate-700 bg-slate-800/80 font-mono text-sm text-slate-100 disabled:opacity-40"
                />
              </div>

              <div className="flex items-center gap-4">
                <Label htmlFor="min-rating" className="whitespace-nowrap text-sm font-medium text-slate-300">
                  Min Rating:{' '}
                  <span className="font-mono text-amber-400 ml-1">{minRating.toFixed(1)}</span>
                </Label>
                <Input
                  id="min-rating"
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={minRating}
                  disabled={!!searchQuery}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  className="w-40 accent-amber-500 disabled:opacity-40"
                />
                {searchQuery && (
                  <span className="text-xs text-slate-500 italic">
                    (Disabled during title search)
                  </span>
                )}
              </div>
            </div>

            {/* Categorical Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Genres
                </Label>
                <GenreSelector
                  genres={genres}
                  selectedIds={genreIds}
                  onChange={setGenreIds}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Studios
                </Label>
                <CompanySelector
                  selectedCompanies={selectedCompanies}
                  onChange={setSelectedCompanies}
                />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};