import { useCallback, useState } from 'react'
import { LogOut } from 'lucide-react'
import { adminLogin } from '../api/adminApi'
import { errorText } from '../lib/errorText'
import DataTab from '../components/admin/DataTab'
import EmployeesTab from '../components/admin/EmployeesTab'
import TrainersTab from '../components/admin/TrainersTab'
import { card, inputCls } from '../components/admin/ui'

const TABS = [
  { id: 'employees', label: 'พนักงาน' },
  { id: 'trainers', label: 'เทรนเนอร์' },
  { id: 'data', label: 'ข้อมูล' },
]
const LOST = ['INVALID_CREDENTIALS', 'LOCKED', 'ADMIN_NOT_SET']

export default function AdminPage() {
  // รหัสผ่าน Admin เก็บในหน่วยความจำเท่านั้น (รีเฟรชหน้าหรือปิดแท็บต้องใส่ใหม่)
  const [pw, setPw] = useState('')
  const [input, setInput] = useState('')
  const [tab, setTab] = useState('employees')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!input) return
    setBusy(true)
    setMessage('')
    const r = await adminLogin(input)
    setBusy(false)
    if (!r.ok) return setMessage(errorText(r, 'admin'))
    setPw(input)
    setInput('')
    setTab('employees')
  }

  const logout = useCallback((msg = '') => {
    setPw('')
    setInput('')
    setMessage(msg)
  }, [])

  // แท็บต่างๆ เรียกฟังก์ชันนี้กับผลลัพธ์ทุกครั้ง: ถ้ารหัส Admin ใช้ไม่ได้แล้ว (ถูกล็อก/เปลี่ยน) ให้ออกจากระบบ
  const fail = useCallback(
    (r) => {
      if (r && LOST.includes(r.error)) {
        logout(errorText(r, 'admin'))
        return true
      }
      return false
    },
    [logout],
  )

  if (!pw) {
    return (
      <form onSubmit={submit} className="p-5">
        <div className={`${card} p-6`}>
          <h2 className="text-lg font-bold">ผู้ดูแลระบบ</h2>
          <p className="mt-1 text-sm text-slate-500">ใส่รหัสผ่าน Admin เพื่อจัดการพนักงาน เทรนเนอร์ และส่งออกข้อมูล</p>
          <label htmlFor="admin-pw" className="mt-5 block text-sm font-medium text-slate-600">
            รหัสผ่าน Admin
          </label>
          <input
            id="admin-pw"
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="current-password"
            className={`${inputCls} mt-1.5`}
          />
          <p role="alert" className="mt-3 min-h-5 text-sm text-red-600">
            {message}
          </p>
          <button
            type="submit"
            disabled={busy || !input}
            className="mt-2 w-full rounded-xl bg-ink py-3 text-base font-bold text-white transition active:scale-[0.99] disabled:opacity-40"
          >
            {busy ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-10 space-y-3 bg-paper px-4 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">ผู้ดูแลระบบ</h2>
          <button type="button" onClick={() => logout()} className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
            <LogOut size={16} aria-hidden="true" />
            ออกจากระบบ
          </button>
        </div>
        <div role="tablist" aria-label="เมนูผู้ดูแล" className="grid grid-cols-3 rounded-xl bg-slate-200 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg py-2 text-sm font-bold transition ${tab === t.id ? 'bg-white text-ink shadow-sm' : 'text-slate-500'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4" role="tabpanel">
        {tab === 'employees' && <EmployeesTab pw={pw} fail={fail} />}
        {tab === 'trainers' && <TrainersTab pw={pw} fail={fail} />}
        {tab === 'data' && <DataTab pw={pw} fail={fail} onPasswordChanged={setPw} />}
      </div>
    </div>
  )
}
