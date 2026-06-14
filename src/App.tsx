import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MenuPage } from '@/pages/MenuPage';
import { TutorialPage } from '@/pages/TutorialPage';
import { LevelsPage } from '@/pages/LevelsPage';
import { GamePage } from '@/pages/GamePage';
import { ResultPage } from '@/pages/ResultPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/tutorial" element={<TutorialPage />} />
        <Route path="/levels" element={<LevelsPage />} />
        <Route path="/game/:levelId" element={<GamePage />} />
        <Route path="/result/:levelId" element={<ResultPage />} />
        <Route path="*" element={<MenuPage />} />
      </Routes>
    </Router>
  );
}
