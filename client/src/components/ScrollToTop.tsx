import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// BrowserRouter doesn't reset scroll, so following a link from the bottom of
// one page (e.g. a recommendation) would open the next one scrolled down too.
// Search-param changes (Discover filters) don't count as a new page.
// DiscoverPage restores its own saved position on Back, after this runs.
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
