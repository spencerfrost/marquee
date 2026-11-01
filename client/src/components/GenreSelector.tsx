// client/src/components/GenreSelector.tsx
import React from 'react';
import type { Genre } from '@/utils/types';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

interface Props {
  genres: Genre[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export const GenreSelector: React.FC<Props> = ({ genres, selectedIds, onChange }) => {
  // Separate selected genres for badges and unselected for the dropdown
  const selectedGenres = genres.filter(g => selectedIds.includes(g.id));
  const availableGenres = genres.filter(g => !selectedIds.includes(g.id));

  const handleRemove = (id: number) => {
    onChange(selectedIds.filter(i => i !== id));
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Selected Genres Chips */}
      {selectedGenres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-1">
          {selectedGenres.map((g) => (
            <Badge
              key={g.id}
              variant="default"
              className="flex items-center gap-1 bg-amber-500 text-slate-950"
            >
              {g.name}
              <button 
                onClick={() => handleRemove(g.id)} 
                className="ml-1 rounded-full p-0.5 hover:bg-amber-600 transition-colors"
                aria-label={`Remove ${g.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Combobox Dropdown */}
      <Combobox
        items={availableGenres}
        multiple
        value={selectedGenres}
        onValueChange={(value: Genre[]) => onChange(value.map(g => g.id))}
        itemToStringLabel={(g: Genre) => g.name}
      >
        <ComboboxInput placeholder="Search or select a genre..." className="border-slate-700 bg-slate-800/80 text-sm text-slate-100" />
        <ComboboxContent className="border-slate-700 bg-slate-900 shadow-xl">
          <ComboboxEmpty className="text-slate-400">No genres found.</ComboboxEmpty>
          <ComboboxList>
            {(genre) => (
              <ComboboxItem
                key={genre.id}
                value={genre}
                className="text-slate-300 hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
              >
                {genre.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
};