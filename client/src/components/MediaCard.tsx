import type { MediaSummary } from '@/utils/types';
import React from 'react';
import { Link } from 'react-router-dom';

interface MediaCardProps {
  item: MediaSummary;
}

const MediaCard: React.FC<MediaCardProps> = ({ item }) => {
  const tmdbUrl = `https://www.themoviedb.org/${item.mediaType}/${item.id}`;
  const seerrUrl = `https://seerr.mrspinn.ca/${item.mediaType}/${item.id}`;
  const detailPath = `/${item.mediaType}/${item.id}`;

  // Circular score ring math
  const score = Math.max(0, Math.min(10, item.rating ?? 0));
  const pct = score * 10;
  const circumference = 2 * Math.PI * 16; // r=16
  const dashOffset = circumference * (1 - pct / 100);
  const scoreColor =
    pct >= 70 ? '#4ADE80' : pct >= 40 ? '#FBBF24' : '#F87171';

  const handleStopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Link
      to={detailPath}
      className="group relative block aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-900 ring-1 ring-white/5 transition-shadow duration-300 hover:shadow-2xl hover:shadow-black/60"
    >
      {/* Poster */}
      {item.posterPath ? (
        <img
          src={item.posterPath}
          alt={item.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 px-4 text-center text-sm text-slate-500">
          {item.title}
        </div>
      )}

      {/* Permanent bottom gradient for legibility */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

      {/* Score ring - top left, always visible */}
      <div className="absolute left-2.5 top-2.5 z-10">
        <svg width="38" height="38" viewBox="0 0 38 38" className="drop-shadow-md">
          <circle
            cx="19"
            cy="19"
            r="16"
            fill="rgba(15,23,42,0.85)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="2"
          />
          <circle
            cx="19"
            cy="19"
            r="16"
            fill="none"
            stroke={scoreColor}
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 19 19)"
          />
          <text
            x="19"
            y="20"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="10.5"
            fontWeight="700"
          >
            {score.toFixed(1)}
          </text>
        </svg>
      </div>

      {/* External links - revealed on hover, top right */}
      <div className="absolute right-2.5 top-2.5 z-10 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <a
          href={tmdbUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="View on TMDB"
          onClick={handleStopPropagation}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 ring-1 ring-white/10 backdrop-blur-sm transition hover:ring-white/30"
        >
          <img
            src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg"
            alt="TMDB"
            className="h-4 w-4 rounded-sm"
          />
        </a>
        <a
          href={seerrUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="View on Seerr"
          onClick={handleStopPropagation}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 ring-1 ring-white/10 backdrop-blur-sm transition hover:ring-white/30"
        >
          <img src="https://seerr.dev/os_logo_filled.svg" alt="Seerr" className="h-4 w-4" />
        </a>
      </div>

      {/* Title and metadata */}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow-sm">
          {item.title}
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-400">
          {item.releaseDate
            ? new Date(item.releaseDate).getFullYear()
            : 'Unknown year'}
        </p>
      </div>
    </Link>
  );
};

export default MediaCard;