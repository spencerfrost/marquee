import React, { useEffect, useState } from 'react';
import { fetchTrending } from '@/utils/api';
import type { TrendingList } from '@/utils/api';
import type { MediaSummary } from '@/utils/types';
import MediaCard from './MediaCard';

const RAILS: { key: TrendingList; title: string }[] = [
  { key: 'trending-week', title: 'Trending this week' },
  { key: 'movie-now-playing', title: 'Now playing' },
  { key: 'tv-on-the-air', title: 'On the air' },
  { key: 'movie-popular', title: 'Popular movies' },
  { key: 'tv-popular', title: 'Popular TV' },
  { key: 'movie-top-rated', title: 'Top rated movies' },
  { key: 'tv-top-rated', title: 'Top rated TV' },
  { key: 'movie-upcoming', title: 'Upcoming movies' },
];

const Rail: React.FC<{ title: string; items: MediaSummary[]; loading: boolean }> = ({
  title,
  items,
  loading,
}) => {
  if (!loading && items.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-slate-100">{title}</h2>
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
      {RAILS.map(({ key, title }) => (
        <Rail key={key} title={title} items={data[key] ?? []} loading={pending.has(key)} />
      ))}
    </div>
  );
};

export default HomeRails;
