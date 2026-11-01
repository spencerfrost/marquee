import React, { useState, useEffect } from 'react';
import { searchKeywords } from '@/utils/api';
import type { KeywordSummary } from '@/utils/types';
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

interface KeywordSelectorProps {
  selectedKeywords: KeywordSummary[];
  onChange: (keywords: KeywordSummary[]) => void;
  placeholder?: string;
  badgeClassName?: string;
}

export const KeywordSelector: React.FC<KeywordSelectorProps> = ({
  selectedKeywords,
  onChange,
  placeholder = "Search keywords...",
  badgeClassName = "bg-amber-500 text-slate-950",
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KeywordSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search Debounce Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 2) {
        setIsSearching(true);
        try {
          const data = await searchKeywords(query);
          setResults(data);
        } catch (error) {
          console.error("Failed to search keywords", error);
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

  const handleSelect = (keywordIdStr: string | null) => {
    if (!keywordIdStr) return;
    const id = parseInt(keywordIdStr, 10);
    const keyword = results.find(k => k.id === id);

    if (keyword && !selectedKeywords.some(k => k.id === keyword.id)) {
      onChange([...selectedKeywords, keyword]);
      setQuery('');
    }
  };

  const handleRemove = (id: number) => {
    onChange(selectedKeywords.filter(k => k.id !== id));
  };

  const availableItems = results.filter(
    item => !selectedKeywords.some(selected => selected.id === item.id)
  );

  return (
    <div className="flex flex-col gap-2">
      {selectedKeywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-1">
          {selectedKeywords.map(k => (
            <Badge
              key={k.id}
              variant="default"
              className={`flex items-center gap-1 ${badgeClassName}`}
            >
              {k.name}
              <button
                onClick={() => handleRemove(k.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-black/20 transition-colors"
                aria-label={`Remove ${k.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Combobox items={availableItems} onValueChange={handleSelect}>
        <ComboboxInput
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border-slate-700 bg-slate-800/80 text-sm text-slate-100"
        />
        <ComboboxContent className="border-slate-700 bg-slate-900 shadow-xl">
          <ComboboxEmpty className="text-slate-400 py-2 px-4 text-sm">
            {isSearching ? "Searching..." : query.trim().length > 2 ? "No keywords found." : "Type at least 3 characters."}
          </ComboboxEmpty>
          <ComboboxList>
            {(keyword) => (
              <ComboboxItem
                key={keyword.id}
                value={keyword.id.toString()}
                className="text-slate-300 hover:bg-slate-800 hover:text-slate-100 cursor-pointer py-2 px-4 text-sm w-full text-left"
              >
                {keyword.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
};
