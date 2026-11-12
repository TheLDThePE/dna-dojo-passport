import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Info } from 'lucide-react'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import PassportPage from './pages/PassportPage'
import RankPage from './pages/RankPage'
import PlayerPage from './pages/PlayerPage'
import AwardPage from './pages/AwardPage'
import ExamPage from './pages/ExamPage'
import TrainerPage from './pages/TrainerPage'
import AdminPage from './pages/AdminPage'
import LdnaLogo from './components/LdnaLogo'
import LdnaMarquee from './components/LdnaMarquee'
import ValuesSheet from './components/ValuesSheet'

export default function App() {
  const [showValues, setShowValues] = useState(false)

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-paper shadow-xl">
      <header className="shrink-0 bg-ink px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => setShowValues(true)}
          aria-label="ดูค่านิยม LDNA"
          className="flex w-full items-center gap-3 text-left"
        >
          <span className="flex shrink-0 items-start gap-1">
            <LdnaLogo className="h-14 w-auto shrink-0" />
            <Info size={14} className="mt-1 shrink-0 text-slate-400" aria-hidden="true" />
          </span>
          <LdnaMarquee />
        </button>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/passport" element={<PassportPage />} />
          <Route path="/passport/exam/:code" element={<ExamPage />} />
          <Route path="/rank" element={<RankPage />} />
          <Route path="/player" element={<PlayerPage />} />
          <Route path="/award" element={<AwardPage />} />
          <Route path="/trainer" element={<TrainerPage />} />
          <Route path="/admin" element={<AdminPage />} />
          {/* ลิงก์เก่า (/profile) พาไปหน้า Admin */}
          <Route path="/profile" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <BottomNav />

      {showValues && <ValuesSheet onClose={() => setShowValues(false)} />}
    </div>
  )
}
