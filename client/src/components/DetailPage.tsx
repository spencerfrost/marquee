import React from 'react';
import { useParams } from 'react-router-dom';
import MovieDetailView from './MovieDetailView';
import TvDetailView from './TvDetailView';
import { DetailContainer } from './DetailContainer';
import { NotFoundPage } from './NotFoundPage';

const DetailPage: React.FC = () => {
    const { mediaType, id } = useParams<{ mediaType: string; id: string }>();

    // /:mediaType/:id catches any two-segment path, so this doubles as the 404
    if (!id || !/^\d+$/.test(id) || (mediaType !== 'movie' && mediaType !== 'tv')) {
        return <NotFoundPage />;
    }

    const numericId = parseInt(id, 10);

    return (
        <DetailContainer>
            {mediaType === 'movie' ? (
                <MovieDetailView id={numericId} />
            ) : (
                <TvDetailView id={numericId} />
            )}
        </DetailContainer>
    );
};

export default DetailPage;