import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDocumentTitle } from '@/utils/useDocumentTitle';
import { BrowseLayout } from './SiteHeader';
import { HomeRails } from './HomeRails';

export const HomePage: React.FC = () => {
  useDocumentTitle();
  const { search } = useLocation();

  // Discover used to live at `/`, with its filters in the query string.
  // Forward those old bookmarks and shared links to the new route.
  if (search) return <Navigate to={`/discover${search}`} replace />;

  return (
    <BrowseLayout>
      <HomeRails />
    </BrowseLayout>
  );
};

export default HomePage;
