import React, { useState, useEffect } from 'react';
import { searchNetworks } from '@/utils/api';
import type { NetworkSummary } from '@/utils/types';
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

// IDs verified against the TMDB daily network export (2026-07-04). Where a
// name appears multiple times in the export (regional duplicates), these are
// the canonical entries.
const TOP_NETWORKS: NetworkSummary[] = [
  { id: 213, name: 'Netflix' },
  { id: 49, name: 'HBO' },
  { id: 3186, name: 'HBO Max' },
  { id: 2739, name: 'Disney+' },
  { id: 1024, name: 'Prime Video' },
  { id: 2552, name: 'Apple TV' },
  { id: 453, name: 'Hulu' },
  { id: 4330, name: 'Paramount+' },
  { id: 174, name: 'AMC' },
  { id: 88, name: 'FX' },
  { id: 67, name: 'Showtime' },
  { id: 4, name: 'BBC One' },
  { id: 71, name: 'The CW' },
  { id: 80, name: 'Adult Swim' },
];

interface NetworkSelectorProps {
  selectedNetworks: NetworkSummary[];
  onChange: (networks: NetworkSummary[]) => void;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  selectedNetworks,
  onChange
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NetworkSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search Debounce Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 2) {
        setIsSearching(true);
        try {
          const data = await searchNetworks(query);
          setResults(data);
        } catch (error) {
          console.error("Failed to search networks", error);
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

  const handleSelect = (networkIdStr: string | null) => {
    if (!networkIdStr) return;
    // Find the network in either our API results or the fallback TOP_NETWORKS
    const id = parseInt(networkIdStr, 10);
    const network = results.find(n => n.id === id) || TOP_NETWORKS.find(n => n.id === id);

    if (network && !selectedNetworks.some(n => n.id === network.id)) {
      onChange([...selectedNetworks, network]);
      setQuery(''); // Reset query after selection
    }
  };

  const handleRemove = (id: number) => {
    onChange(selectedNetworks.filter(n => n.id !== id));
  };

  // Determine what list to show in the dropdown based on search state
  const itemsToShow = query.trim().length > 2 ? results : TOP_NETWORKS;
  // Filter out already selected items so they don't appear in the dropdown
  const availableItems = itemsToShow.filter(
    item => !selectedNetworks.some(selected => selected.id === item.id)
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Selected Network Chips */}
      {selectedNetworks.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-1">
          {selectedNetworks.map(n => (
            <Badge
              key={n.id}
              variant="default"
              className="flex items-center gap-1 bg-amber-500 text-slate-950"
            >
              {n.name}
              <button
                onClick={() => handleRemove(n.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-amber-600 transition-colors"
                aria-label={`Remove ${n.name}`}
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
          placeholder="Search networks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border-slate-700 bg-slate-800/80 text-sm text-slate-100"
        />
        <ComboboxContent className="border-slate-700 bg-slate-900 shadow-xl max-h-60 overflow-y-auto">
          <ComboboxEmpty className="text-slate-400 py-2 px-4 text-sm">
            {isSearching ? "Searching..." : "No networks found."}
          </ComboboxEmpty>
          <ComboboxList>
            {(network) => (
              <ComboboxItem
                key={network.id}
                value={network.id.toString()}
                className="text-slate-300 hover:bg-slate-800 hover:text-slate-100 cursor-pointer py-2 px-4 text-sm w-full text-left"
              >
                {network.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
};
