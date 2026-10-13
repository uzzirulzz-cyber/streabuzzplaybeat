import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LiveChannels from './pages/LiveChannels';
import ChannelDetail from './pages/ChannelDetail';
import { MoviesList, MovieDetail } from './pages/Movies';
import { SeriesList, SeriesDetail } from './pages/Series';
import MusicPage from './pages/MusicPage';
import Favorites from './pages/Favorites';
import Admin from './pages/Admin';
import Monitoring from './pages/Monitoring';
import MusicPlayer from './components/MusicPlayer';
import { AppProvider } from './hooks/store';

// Use HashRouter when embedded in an iframe (so URLs stay inside the iframe),
// BrowserRouter when running standalone.
const Router = window.self !== window.top ? HashRouter : BrowserRouter;

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  return null;
}

export default function App() {
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const onPlayTrack = useCallback((id: string) => setCurrentTrack(id), []);

  return (
    <AppProvider>
      <Router>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard onPlayTrack={onPlayTrack} />} />
            <Route path="/live" element={<LiveChannels />} />
            <Route path="/live/:id" element={<ChannelDetail />} />
            <Route path="/movies" element={<MoviesList />} />
            <Route path="/movies/:id" element={<MovieDetail />} />
            <Route path="/series" element={<SeriesList />} />
            <Route path="/series/:id" element={<SeriesDetail />} />
            <Route path="/music" element={<MusicPage onPlayTrack={onPlayTrack} />} />
            <Route path="/favorites" element={<Favorites onPlayTrack={onPlayTrack} />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <MusicPlayer currentTrackId={currentTrack} onSelectTrack={onPlayTrack} />
      </Router>
    </AppProvider>
  );
}
