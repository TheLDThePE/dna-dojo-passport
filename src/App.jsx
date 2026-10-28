import { Navigate, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import PassportPage from './pages/PassportPage'
import TrainerPage from './pages/TrainerPage'
import RankPage from './pages/RankPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-paper shadow-xl">
      <header className="shrink-0 bg-ink px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <h1 className="text-base font-extrabold tracking-wide text-white">LDNA DOJO e-Passport</h1>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/passport" element={<PassportPage />} />
          <Route path="/trainer" element={<TrainerPage />} />
          <Route path="/rank" element={<RankPage />} />
          <Route path="/profile" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <BottomNav />
    </div>
  )
}
