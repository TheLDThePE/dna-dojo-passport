import { useEffect, useId, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Award,
  BookOpen,
  ChartNoAxesColumn,
  Gamepad2,
  House,
  Menu,
  ShieldCheck,
  Trophy,
} from 'lucide-react'

// เมนูหลัก: Home, Passport, Rank, Player, Award
const ITEMS = [
  { to: '/', label: 'Home', Icon: House, end: true },
  { to: '/passport', label: 'Passport', Icon: Award },
  { to: '/rank', label: 'Rank', Icon: ChartNoAxesColumn },
  { to: '/player', label: 'Player', Icon: Gamepad2 },
  { to: '/award', label: 'Award', Icon: Trophy },
]

// เมนูย่อยใต้ปุ่ม ☰ (สำหรับผู้ดูแล)
const MORE_ITEMS = [
  { to: '/trainer', label: 'Trainer', Icon: BookOpen },
  { to: '/admin', label: 'Admin', Icon: ShieldCheck },
]

const itemClass = (active) =>
  `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 ${
    active ? 'text-blue-700' : 'text-slate-400'
  }`

export default function BottomNav() {
  const { pathname } = useLocation()
  const menuId = useId()
  // เก็บ "หน้าที่เปิดเมนูไว้" แทนการเก็บ true/false
  // พอเปลี่ยนหน้า pathname ไม่ตรง เมนูจะปิดเองโดยไม่ต้องใช้ setState ใน useEffect
  const [openAt, setOpenAt] = useState(null)
  const open = openAt === pathname
  const moreActive = MORE_ITEMS.some((m) => pathname.startsWith(m.to))

  // กด Esc เพื่อปิดเมนู (ลงทะเบียนเฉพาะตอนเมนูเปิดอยู่)
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenAt(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <nav
      aria-label="เมนูหลัก"
      className="relative flex shrink-0 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      {/* แตะนอกเมนูเพื่อปิด */}
      {open && (
        <button
          type="button"
          aria-label="ปิดเมนู"
          tabIndex={-1}
          onClick={() => setOpenAt(null)}
          className="fixed inset-0 z-20 cursor-default"
        />
      )}

      {ITEMS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => itemClass(isActive)}
        >
          <Icon size={22} aria-hidden="true" />
          {label}
        </NavLink>
      ))}

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpenAt(open ? null : pathname)}
        className={`${itemClass(open || moreActive)} cursor-pointer`}
      >
        <Menu size={22} aria-hidden="true" />
        More
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="เมนูผู้ดูแล"
          className="absolute bottom-full right-2 z-30 mb-2 w-44 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200"
        >
          {MORE_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              role="menuitem"
              onClick={() => setOpenAt(null)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-ink'
                }`
              }
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  )
}
