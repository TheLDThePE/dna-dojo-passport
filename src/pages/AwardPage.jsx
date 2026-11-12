import { Trophy } from 'lucide-react'

export default function AwardPage() {
  return (
    <div className="p-5">
      <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-slate-200">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-gold ring-1 ring-amber-200">
          <Trophy size={40} aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-lg font-bold text-ink">Award</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">Coming Soon</p>
      </div>
    </div>
  )
}
