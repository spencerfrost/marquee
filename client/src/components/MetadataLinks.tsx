import React from 'react';
import { Link } from 'react-router-dom';
import type { MediaDetail } from '@/utils/types';
import { discoverHref } from './DiscoverPage';

const chipClass =
  'rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-amber-500/60 hover:text-amber-400';

// Genre ids differ between movie and TV, so every link keeps the media type
// of the title it came from.
export const GenreLinks: React.FC<{ media: MediaDetail }> = ({ media }) => {
  if (media.genres.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {media.genres.map((genre) => (
        <Link
          key={genre.id}
          to={discoverHref({ mediaType: media.mediaType, genreIds: [genre.id] })}
          className={chipClass}
        >
          {genre.name}
        </Link>
      ))}
    </div>
  );
};

// Networks, studios and keywords, each linking to Discover filtered by it.
export const MetadataLinks: React.FC<{ media: MediaDetail }> = ({ media }) => {
  const { mediaType } = media;
  const groups = [
    {
      label: media.networks.length === 1 ? 'Network' : 'Networks',
      links: media.networks.map((network) => ({
        id: network.id,
        name: network.name,
        to: discoverHref({ mediaType, networks: [network] }),
      })),
    },
    {
      label: media.productionCompanies.length === 1 ? 'Studio' : 'Studios',
      links: media.productionCompanies.map((company) => ({
        id: company.id,
        name: company.name,
        to: discoverHref({
          mediaType,
          companies: [{ id: company.id, name: company.name, logoPath: company.logoPath }],
        }),
      })),
    },
    {
      label: 'Keywords',
      links: media.keywords.map((keyword) => ({
        id: keyword.id,
        name: keyword.name,
        to: discoverHref({ mediaType, keywords: [keyword] }),
      })),
    },
  ].filter((group) => group.links.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="space-y-5 border-t border-slate-800 px-6 py-6 md:px-8">
      {groups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {group.label}
          </h3>
          <div className="flex flex-wrap gap-2">
            {group.links.map((link) => (
              <Link key={link.id} to={link.to} className={chipClass}>
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
