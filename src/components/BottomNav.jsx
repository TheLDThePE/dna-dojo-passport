import { NavLink } from 'react-router-dom'
import { Award, BookOpen, ChartNoAxesColumn, House, UserRound } from 'lucide-react'

const ITEMS = [
  { to: '/', label: 'Home', Icon: House, end: true },
  { to: '/passport', label: 'Passport', Icon: Award },
  { to: '/trainer', label: 'Trainer', Icon: BookOpen },
  { to: '/rank', label: 'Rank', Icon: ChartNoAxesColumn },
  { to: '/profile', label: 'Profile', Icon: UserRound },
]

export default function BottomNav() {
  return (
    <nav
      aria-label="เมนูหลัก"
      className="flex shrink-0 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      {ITEMS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 ${
              isActive ? 'text-blue-700' : 'text-slate-400'
            }`
          }
        >
          <Icon size={22} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
