import React from 'react';
import type { WatchProviderEntry } from '@/utils/types';
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
  providers: WatchProviderEntry[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

// Mirrors GenreSelector: a short, fully-fetched list filtered locally rather
// than searched server-side. `providers` comes from /api/watch-providers and
// is region-scoped — the caller is responsible for clearing selectedIds when
// the region changes, since a provider id selected in one region may not
// exist (or mean the same availability) in another.
export const WatchProviderSelector: React.FC<Props> = ({ providers, selectedIds, onChange }) => {
  const selectedProviders = providers.filter(p => selectedIds.includes(p.providerId));
  const availableProviders = providers.filter(p => !selectedIds.includes(p.providerId));

  const handleRemove = (id: number) => {
    onChange(selectedIds.filter(i => i !== id));
  };

  return (
    <div className="flex flex-col gap-2">
      {selectedProviders.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-2">
          {selectedProviders.map((p) => (
            <Badge
              key={p.providerId}
              variant="default"
              className="flex items-center gap-1 bg-amber-500 text-slate-950"
            >
              {p.providerName}
              <button
                onClick={() => handleRemove(p.providerId)}
                className="ml-1 rounded-full p-0.5 hover:bg-amber-600 transition-colors"
                aria-label={`Remove ${p.providerName}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Combobox
        items={availableProviders}
        multiple
        value={selectedProviders}
        onValueChange={(value: WatchProviderEntry[]) => onChange(value.map(p => p.providerId))}
        itemToStringLabel={(p: WatchProviderEntry) => p.providerName}
      >
        <ComboboxInput placeholder="Search or select a service..." className="border-slate-700 bg-slate-800/80 text-sm text-slate-100" />
        <ComboboxContent className="border-slate-700 bg-slate-900 shadow-xl max-h-60 overflow-y-auto">
          <ComboboxEmpty className="text-slate-400">No streaming services found.</ComboboxEmpty>
          <ComboboxList>
            {(provider) => (
              <ComboboxItem
                key={provider.providerId}
                value={provider}
                className="text-slate-300 hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
              >
                {provider.providerName}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
};
