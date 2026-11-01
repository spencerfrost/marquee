import React, { useEffect, useState } from 'react';
import { fetchWatchProviderRegions } from '@/utils/api';
import type { WatchRegion } from '@/utils/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const STORAGE_KEY = 'marquee:watchRegion';
// The deploy is Canadian — see the Seerr link in MediaCard.tsx.
const DEFAULT_REGION = 'CA';

// Module-level so every component reading the region (RegionPicker itself,
// WatchProviders on detail pages) stays in sync without a React context.
let listeners: Array<(region: string) => void> = [];

export function getWatchRegion(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_REGION;
  } catch {
    return DEFAULT_REGION;
  }
}

export function setWatchRegion(region: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, region);
  } catch {
    // Private browsing / storage disabled — region just won't persist.
  }
  listeners.forEach((listener) => listener(region));
}

export function useWatchRegion(): string {
  const [region, setRegion] = useState<string>(getWatchRegion());

  useEffect(() => {
    listeners.push(setRegion);
    return () => {
      listeners = listeners.filter((l) => l !== setRegion);
    };
  }, []);

  return region;
}

// The single app-level watch-region setting: used both for the "can I
// stream this already?" provider info on detail pages and, eventually, the
// with_watch_providers discover filter. One control, one source of truth.
export const RegionPicker: React.FC = () => {
  const region = useWatchRegion();
  const [regions, setRegions] = useState<WatchRegion[]>([]);

  useEffect(() => {
    fetchWatchProviderRegions()
      .then((list) => setRegions(list.sort((a, b) => a.english_name.localeCompare(b.english_name))))
      .catch(console.error);
  }, []);

  return (
    <Select
      items={regions.map((r) => ({ value: r.iso_3166_1, label: r.english_name }))}
      value={region}
      onValueChange={(value: string | null) => value && setWatchRegion(value)}
    >
      <SelectTrigger
        className="w-36 border-slate-700 bg-slate-800/80 text-slate-100 hover:bg-slate-800"
        aria-label="Watch provider region"
      >
        <SelectValue placeholder={region} />
      </SelectTrigger>
      <SelectContent className="border-slate-700 bg-slate-900 text-slate-300 shadow-xl">
        {regions.map((r) => (
          <SelectItem
            key={r.iso_3166_1}
            value={r.iso_3166_1}
            className="cursor-pointer focus:bg-slate-800 focus:text-slate-100"
          >
            {r.english_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
