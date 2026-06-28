import React from 'react';
import { Link } from 'react-router-dom';
import type { MediaDetail } from '@/utils/types';

export const CastAndCrew: React.FC<{ media: MediaDetail }> = ({ media }) => {
  const director = media.credits?.crew.find((c) => c.job === 'Director');

return (
  <div className="mt-2">
    {director && (
      <div className="mb-6 flex items-center gap-2 text-sm">
        <span className="font-medium uppercase tracking-wide text-slate-500">Director</span>
        <Link
          to={`/person/${director.id}`}
          className="font-medium text-slate-200 transition-colors hover:text-amber-400"
        >
          {director.name}
        </Link>
      </div>
    )}

    {media.credits?.cast && media.credits.cast.length > 0 && (
      <>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Top cast
        </h3>
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
          {media.credits.cast.slice(0, 10).map((person) => (
            <Link
              key={person.id}
              to={`/person/${person.id}`}
              className="group w-28 flex-shrink-0"
            >
              <div className="mb-2 aspect-[2/3] w-28 overflow-hidden rounded-lg bg-slate-800 ring-1 ring-white/5 transition-all group-hover:ring-amber-500/40">
                {person.profile_path ? (
                  <img
                    src={person.profile_path}
                    alt={person.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-slate-500">
                    No image
                  </div>
                )}
              </div>
              <p className="truncate text-sm font-semibold text-slate-200 transition-colors group-hover:text-amber-400">
                {person.name}
              </p>
              <p className="truncate text-xs text-slate-500">{person.character}</p>
            </Link>
          ))}
        </div>
      </>
    )}
  </div>
);
};