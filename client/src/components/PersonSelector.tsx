import React, { useState, useEffect } from 'react';
import { searchPeople } from '@/utils/api';
import type { PersonSummary } from '@/utils/types';
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

interface PersonSelectorProps {
  selectedPeople: PersonSummary[];
  onChange: (people: PersonSummary[]) => void;
  // TV has no with_people discover param, so the TV path caps selection to
  // one person and renders their credits directly instead of filtering.
  maxSelections?: number;
}

export const PersonSelector: React.FC<PersonSelectorProps> = ({
  selectedPeople,
  onChange,
  maxSelections,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PersonSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 2) {
        setIsSearching(true);
        try {
          const data = await searchPeople(query);
          setResults(data);
        } catch (error) {
          console.error("Failed to search people", error);
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const atLimit = maxSelections !== undefined && selectedPeople.length >= maxSelections;

  const handleSelect = (personIdStr: string | null) => {
    if (!personIdStr || atLimit) return;
    const id = parseInt(personIdStr, 10);
    const person = results.find(p => p.id === id);

    if (person && !selectedPeople.some(p => p.id === person.id)) {
      onChange(maxSelections !== undefined ? [person] : [...selectedPeople, person]);
      setQuery('');
    }
  };

  const handleRemove = (id: number) => {
    onChange(selectedPeople.filter(p => p.id !== id));
  };

  const availableItems = results.filter(
    item => !selectedPeople.some(selected => selected.id === item.id)
  );

  return (
    <div className="flex flex-col gap-2">
      {selectedPeople.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-1">
          {selectedPeople.map(p => (
            <Badge
              key={p.id}
              variant="default"
              className="flex items-center gap-1 bg-amber-500 text-slate-950"
            >
              {p.name}
              <button
                onClick={() => handleRemove(p.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-amber-600 transition-colors"
                aria-label={`Remove ${p.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Combobox items={availableItems} onValueChange={handleSelect}>
        <ComboboxInput
          placeholder={atLimit ? "Remove the selected person to change" : "Search people..."}
          value={query}
          disabled={atLimit}
          onChange={(e) => setQuery(e.target.value)}
          className="border-slate-700 bg-slate-800/80 text-sm text-slate-100"
        />
        <ComboboxContent className="border-slate-700 bg-slate-900 shadow-xl max-h-72 overflow-y-auto">
          <ComboboxEmpty className="text-slate-400 py-2 px-4 text-sm">
            {isSearching ? "Searching..." : "No people found."}
          </ComboboxEmpty>
          <ComboboxList>
            {(person) => (
              <ComboboxItem
                key={person.id}
                value={person.id.toString()}
                className="text-slate-300 hover:bg-slate-800 hover:text-slate-100 cursor-pointer py-2 px-4 text-sm w-full text-left"
              >
                <div className="flex flex-col">
                  <span>{person.name}</span>
                  {person.knownForDepartment && (
                    <span className="text-xs text-slate-500">{person.knownForDepartment}</span>
                  )}
                </div>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
};
