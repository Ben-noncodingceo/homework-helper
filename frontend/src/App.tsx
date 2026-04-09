import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PreviewPage from './pages/PreviewPage';
import QuizPage from './pages/QuizPage';
import ConfigPage from './pages/ConfigPage';
import HistoryPage from './pages/HistoryPage';

function Nav() {
  const loc = useLocation();
  const links = [
    { to: '/', label: '生成作业' },
    { to: '/history', label: '历史记录' },
    { to: '/config', label: '⚙ 设置' },
  ];
  return (
    <header className="no-print sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center gap-6 px-4 h-12">
        <span className="font-bold text-blue-600 text-lg">🎓 AI 作业生成器</span>
        <nav className="flex gap-4 text-sm">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`transition-colors hover:text-blue-600 ${
                loc.pathname === to ? 'text-blue-600 font-semibold' : 'text-gray-600'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main className="min-h-[calc(100vh-3rem)] bg-gray-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/preview/:id" element={<PreviewPage />} />
          <Route path="/quiz/:id" element={<QuizPage />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
