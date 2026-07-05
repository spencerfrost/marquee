import React, { useState, useEffect } from 'react';
import { searchCompanies } from '@/utils/api';
import type { CompanySummary } from '@/utils/types';
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

const TOP_COMPANIES: CompanySummary[] = [
  { id: 178464, name: 'Netflix', logoPath: null, originCountry: 'US' },
  { id: 20580, name: 'Amazon Studios', logoPath: null, originCountry: 'US' },
  { id: 210099, name: 'Amazon MGM Studios', logoPath: null, originCountry: 'US' },
  { id: 7, name: 'DreamWorks Pictures', logoPath: null, originCountry: 'US' },
  { id: 194232, name: 'Apple Studios', logoPath: null, originCountry: 'US' },
  { id: 3268, name: 'HBO', logoPath: null, originCountry: 'US' },
  { id: 41077, name: 'A24', logoPath: null, originCountry: 'US' },
  { id: 2, name: 'Walt Disney Pictures', logoPath: null, originCountry: 'US' },
  { id: 174, name: 'Warner Bros. Pictures', logoPath: null, originCountry: 'US' },
  { id: 33, name: 'Universal Pictures', logoPath: null, originCountry: 'US' },
  { id: 4, name: 'Paramount Pictures', logoPath: null, originCountry: 'US' },
  { id: 5, name: 'Columbia Pictures', logoPath: null, originCountry: 'US' },
  { id: 838, name: 'Paramount Vantage', logoPath: null, originCountry: 'US' },
  { id: 3, name: 'Pixar', logoPath: null, originCountry: 'US' },
];

interface CompanySelectorProps {
  selectedCompanies: CompanySummary[];
  onChange: (companies: CompanySummary[]) => void;
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({ 
  selectedCompanies, 
  onChange 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompanySummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search Debounce Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 2) {
        setIsSearching(true);
        try {
          const data = await searchCompanies(query);
          setResults(data);
        } catch (error) {
          console.error("Failed to search companies", error);
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

  const handleSelect = (companyIdStr: string | null) => {
    if (companyIdStr === null) return;
    // Find the company in either our API results or the fallback TOP_COMPANIES
    const id = parseInt(companyIdStr, 10);
    const company = results.find(c => c.id === id) || TOP_COMPANIES.find(c => c.id === id);
    
    if (company && !selectedCompanies.some(c => c.id === company.id)) {
      onChange([...selectedCompanies, company]);
      setQuery(''); // Reset query after selection
    }
  };

  const handleRemove = (id: number) => {
    onChange(selectedCompanies.filter(c => c.id !== id));
  };

  // Determine what list to show in the dropdown based on search state
  const itemsToShow = query.trim().length > 2 ? results : TOP_COMPANIES;
  // Filter out already selected items so they don't appear in the dropdown
  const availableItems = itemsToShow.filter(
    item => !selectedCompanies.some(selected => selected.id === item.id)
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Selected Company Chips */}
      {selectedCompanies.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-1">
          {selectedCompanies.map(c => (
            <Badge 
              key={c.id} 
              variant="default" 
              className="flex items-center gap-1 bg-amber-500 text-slate-950"
            >
              {c.name} {c.originCountry === 'US' ? '' : `(${c.originCountry})`}
              <button 
                onClick={() => handleRemove(c.id)} 
                className="ml-1 rounded-full p-0.5 hover:bg-amber-600 transition-colors"
                aria-label={`Remove ${c.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Combobox Dropdown */}
      <Combobox items={availableItems} onValueChange={handleSelect}>
        <ComboboxInput 
          placeholder="Search studios..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border-slate-700 bg-slate-800/80 text-sm text-slate-100" 
        />
        <ComboboxContent className="border-slate-700 bg-slate-900 shadow-xl">
          <ComboboxEmpty className="text-slate-400 py-2 px-4 text-sm">
            {isSearching ? "Searching..." : "No studios found."}
          </ComboboxEmpty>
          <ComboboxList>
            {(company) => (
              <ComboboxItem 
                key={company.id} 
                value={company.id.toString()}
                className="text-slate-300 hover:bg-slate-800 hover:text-slate-100 cursor-pointer py-2 px-4 text-sm w-full text-left"
              >
                {company.name} {company.originCountry === 'US' ? '' : `(${company.originCountry})`}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
};