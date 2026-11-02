import { Navigate, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import PassportPage from './pages/PassportPage'
import RankPage from './pages/RankPage'
import TrainerPage from './pages/TrainerPage'
import AdminPage from './pages/AdminPage'
import LdnaLogo from './components/LdnaLogo'

export default function App() {
  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-paper shadow-xl">
      <header className="shrink-0 bg-ink px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <LdnaLogo className="h-14 w-auto" />
          <span className="inline-flex items-center gap-1.5 rounded border border-emerald-800/60 bg-emerald-950/80 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            ONLINE
          </span>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/passport" element={<PassportPage />} />
          <Route path="/rank" element={<RankPage />} />
          <Route path="/trainer" element={<TrainerPage />} />
          <Route path="/admin" element={<AdminPage />} />
          {/* ลิงก์เก่า (/profile) พาไปหน้า Admin */}
          <Route path="/profile" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <BottomNav />
    </div>
  )
}
