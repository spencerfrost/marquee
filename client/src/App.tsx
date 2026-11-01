import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DiscoverPage } from "./components/DiscoverPage";
import DetailPage from "./components/DetailPage";
import EpisodeDetailView from "./components/EpisodeDetailView";
import PersonDetailView from "./components/PersonDetailView";
import CollectionDetailView from "./components/CollectionDetailView";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-gray-900 text-white">
            <DiscoverPage />
          </div>
        } />
        <Route path="/collection/:id" element={<CollectionDetailView />} />
        <Route path="/:mediaType/:id" element={<DetailPage />} />
        <Route path="/person/:id" element={<PersonDetailView />} />
        <Route
          path="/tv/:seriesId/season/:seasonNumber/episode/:episodeNumber" 
          element={<EpisodeDetailView />} 
        />
      </Routes>
    </Router>
  );
};

export default App;
