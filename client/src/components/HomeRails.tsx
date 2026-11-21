import React, { useEffect, useState } from 'react';
import { fetchTrending } from '@/utils/api';
import type { TrendingList } from '@/utils/api';
import type { MediaSummary } from '@/utils/types';
import { Link } from 'react-router-dom';
import MediaCard from './MediaCard';
import { discoverHref } from './DiscoverPage';

// `seeAll` opens the equivalent Discover grid. Only rails whose TMDB list maps
// cleanly onto discover filters get one — trending, now playing, on the air
// and upcoming are TMDB-curated lists with no exact discover equivalent.
const RAILS: { key: TrendingList; title: string; seeAll?: string }[] = [
  { key: 'trending-week', title: 'Trending this week' },
  { key: 'movie-now-playing', title: 'Now playing' },
  { key: 'tv-on-the-air', title: 'On the air' },
  { key: 'movie-popular', title: 'Popular movies', seeAll: discoverHref({ mediaType: 'movie' }) },
  { key: 'tv-popular', title: 'Popular TV', seeAll: discoverHref({ mediaType: 'tv' }) },
  { key: 'movie-top-rated', title: 'Top rated movies', seeAll: discoverHref({ mediaType: 'movie', sortField: 'rating' }) },
  { key: 'tv-top-rated', title: 'Top rated TV', seeAll: discoverHref({ mediaType: 'tv', sortField: 'rating' }) },
  { key: 'movie-upcoming', title: 'Upcoming movies' },
];

const Rail: React.FC<{ title: string; seeAll?: string; items: MediaSummary[]; loading: boolean }> = ({
  title,
  seeAll,
  items,
  loading,
}) => {
  if (!loading && items.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        {seeAll && (
          <Link to={seeAll} className="text-sm font-medium text-slate-400 transition-colors hover:text-amber-400">
            See all
          </Link>
        )}
      </div>
      {/* Same horizontal-scroll pattern as PersonDetailView's filmography rail */}
      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] w-36 flex-shrink-0 animate-pulse rounded-xl bg-slate-800/60 md:w-40"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))
          : items.map((item) => (
            <div key={`${item.mediaType}-${item.id}`} className="w-36 flex-shrink-0 md:w-40">
              <MediaCard item={item} />
            </div>
          ))}
      </div>
    </section>
  );
};

export const HomeRails: React.FC = () => {
  const [data, setData] = useState<Partial<Record<TrendingList, MediaSummary[]>>>({});
  const [pending, setPending] = useState<Set<TrendingList>>(new Set(RAILS.map((r) => r.key)));

  useEffect(() => {
    let cancelled = false;

    RAILS.forEach(({ key }) => {
      fetchTrending(key)
        .then((results) => {
          if (cancelled) return;
          setData((prev) => ({ ...prev, [key]: results }));
        })
        .catch((err) => console.error(`Failed to load rail "${key}"`, err))
        .finally(() => {
          if (cancelled) return;
          setPending((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      {RAILS.map(({ key, title, seeAll }) => (
        <Rail key={key} title={title} seeAll={seeAll} items={data[key] ?? []} loading={pending.has(key)} />
      ))}
    </div>
  );
};

export default HomeRails;
