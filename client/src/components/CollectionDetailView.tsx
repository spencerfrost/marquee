import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCollectionDetails } from '@/utils/api';
import type { CollectionDetail } from '@/utils/types';
import { Alert, AlertDescription } from './ui/alert';
import { DetailContainer } from './DetailContainer';
import MediaCard from './MediaCard';

const CollectionDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchCollectionDetails(Number(id));
        setCollection(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load collection');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <DetailContainer>
        <div className="rounded-xl bg-slate-900 p-6 md:p-8">
          <div className="h-8 w-2/3 animate-pulse rounded bg-slate-800" />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-slate-800/60" />
            ))}
          </div>
        </div>
      </DetailContainer>
    );
  }

  if (error) {
    return (
      <DetailContainer>
        <Alert variant="destructive" className="border-red-900/50 bg-red-950/40 text-red-200">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DetailContainer>
    );
  }

  if (!collection) return null;

  return (
    <DetailContainer>
      <div className="overflow-hidden rounded-xl bg-slate-900">
        {collection.backdropPath && (
          <div className="relative h-48 w-full overflow-hidden sm:h-64">
            <img
              src={collection.backdropPath}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          </div>
        )}

        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl">
            {collection.name}
          </h1>
          {collection.overview && (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
              {collection.overview}
            </p>
          )}

          <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {collection.parts.length} {collection.parts.length === 1 ? 'film' : 'films'}
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {collection.parts
              .slice()
              .sort((a, b) => (a.releaseDate || '9999').localeCompare(b.releaseDate || '9999'))
              .map(part => (
                <MediaCard key={part.id} item={part} />
              ))}
          </div>
        </div>
      </div>
    </DetailContainer>
  );
};

export default CollectionDetailView;
