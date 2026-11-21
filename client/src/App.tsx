import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DiscoverPage } from "./components/DiscoverPage";
import { HomePage } from "./components/HomePage";
import DetailPage from "./components/DetailPage";
import EpisodeDetailView from "./components/EpisodeDetailView";
import PersonDetailView from "./components/PersonDetailView";
import CollectionDetailView from "./components/CollectionDetailView";
import { SearchResultsPage } from "./components/SearchResultsPage";
import { ScrollToTop } from "./components/ScrollToTop";
import { NotFoundPage } from "./components/NotFoundPage";

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/collection/:id" element={<CollectionDetailView />} />
        <Route path="/:mediaType/:id" element={<DetailPage />} />
        <Route path="/person/:id" element={<PersonDetailView />} />
        <Route
          path="/tv/:seriesId/season/:seasonNumber/episode/:episodeNumber" 
          element={<EpisodeDetailView />} 
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App;
