import React from 'react';
import type { RegionWatchProviders, WatchProviderEntry } from '@/utils/types';
import { useWatchRegion } from './RegionPicker';

const GROUPS: { key: keyof Pick<RegionWatchProviders, 'flatrate' | 'rent' | 'buy'>; label: string }[] = [
  { key: 'flatrate', label: 'Stream' },
  { key: 'rent', label: 'Rent' },
  { key: 'buy', label: 'Buy' },
];

const ProviderLogos: React.FC<{ providers: WatchProviderEntry[] }> = ({ providers }) => (
  <div className="flex flex-wrap gap-2">
    {providers.map((provider) => (
      <div
        key={provider.providerId}
        title={provider.providerName}
        className="h-10 w-10 overflow-hidden rounded-lg ring-1 ring-white/10"
      >
        {provider.logoPath ? (
          <img src={provider.logoPath} alt={provider.providerName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800 text-[9px] text-slate-400">
            {provider.providerName.slice(0, 2)}
          </div>
        )}
      </div>
    ))}
  </div>
);

interface WatchProvidersProps {
  providersByRegion: Record<string, RegionWatchProviders>;
}

export const WatchProviders: React.FC<WatchProvidersProps> = ({ providersByRegion }) => {
  const region = useWatchRegion();
  const entry = providersByRegion[region];

  const hasAny = entry && GROUPS.some((g) => (entry[g.key]?.length ?? 0) > 0);
  if (!hasAny) {
    return (
      <div className="text-sm text-slate-500">
        Not available to stream, rent, or buy in {region} right now.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {GROUPS.map(({ key, label }) => {
        const providers = entry[key];
        if (!providers || providers.length === 0) return null;
        return (
          <div key={key}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <ProviderLogos providers={providers} />
          </div>
        );
      })}
      {entry.link && (
        <a
          href={entry.link}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit text-xs font-medium text-amber-400 transition-colors hover:text-amber-300"
        >
          More watch options on TMDB →
        </a>
      )}
    </div>
  );
};

export default WatchProviders;
