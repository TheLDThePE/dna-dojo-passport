import { useEffect, useRef, useState } from 'react'
import { CircleCheck, LogOut } from 'lucide-react'
import { listStations } from '../api/stationApi'
import { findEmployee, grantPass, trainerCheck } from '../api/trainerApi'
import { errorText } from '../lib/errorText'
import Avatar from '../components/Avatar'

const CREDS_KEY = 'ldna.trainer.creds' // sessionStorage: รหัสผ่านอยู่เฉพาะช่วงที่เปิดแท็บ
const FORM_KEY = 'ldna.trainer.form' // localStorage: จำสถานีและรหัสเทรนเนอร์ล่าสุด (ไม่เก็บรหัสผ่าน)

const readJson = (store, key) => {
  try {
    return JSON.parse(store.getItem(key) || 'null')
  } catch {
    return null
  }
}
const writeJson = (store, key, value) => {
  try {
    if (value === null) store.removeItem(key)
    else store.setItem(key, JSON.stringify(value))
  } catch {
    /* ข้ามได้ */
  }
}
const shortDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : ''

const input =
  'mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30'
const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200'

export default function TrainerPage() {
  const [view, setView] = useState('boot') // boot | login | work
  const [stations, setStations] = useState([])
  const [form, setForm] = useState({ station: '', trainer: '', password: '' })
  const [session, setSession] = useState(null) // { creds, trainerName, station }
  const [target, setTarget] = useState('')
  const [found, setFound] = useState(null)
  const [bonusOn, setBonusOn] = useState(false)
  const [notice, setNotice] = useState(null) // { type: 'ok' | 'error', text }
  const [recent, setRecent] = useState([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const targetRef = useRef(null)
  const booted = useRef(false)

  // ---------- เปิดหน้า: โหลดสถานี + กู้การเข้าสู่ระบบเดิม ----------
  useEffect(() => {
    if (booted.current) return
    booted.current = true
    ;(async () => {
      const list = await listStations()
      const items = list.ok ? list.stations : []
      setStations(items)
      if (!list.ok) setMessage(errorText(list))

      const saved = readJson(localStorage, FORM_KEY) || {}
      setForm((f) => ({
        ...f,
        trainer: saved.trainer || '',
        station: saved.station || items[0]?.code || '',
      }))

      const creds = readJson(sessionStorage, CREDS_KEY)
      if (creds?.trainer && creds?.password && creds?.station) {
        const r = await trainerCheck(creds.trainer, creds.password, creds.station)
        if (r.ok) {
          setSession({ creds, trainerName: r.trainer, station: r.station })
          setView('work')
          return
        }
        writeJson(sessionStorage, CREDS_KEY, null)
      }
      setView('login')
    })()
  }, [])

  // ---------- เข้าสู่ระบบเทรนเนอร์ ----------
  async function submitLogin(e) {
    e.preventDefault()
    const trainer = form.trainer.trim().toUpperCase()
    if (!trainer || !form.password || !form.station) return
    setBusy(true)
    setMessage('')
    const r = await trainerCheck(trainer, form.password, form.station)
    setBusy(false)
    if (!r.ok) return setMessage(errorText(r, 'trainer'))

    const creds = { trainer, password: form.password, station: form.station }
    writeJson(sessionStorage, CREDS_KEY, creds)
    writeJson(localStorage, FORM_KEY, { trainer, station: form.station })
    setSession({ creds, trainerName: r.trainer, station: r.station })
    setForm((f) => ({ ...f, trainer, password: '' }))
    setRecent([])
    setNotice(null)
    setView('work')
  }

  function logout() {
    writeJson(sessionStorage, CREDS_KEY, null)
    setSession(null)
    setFound(null)
    setTarget('')
    setNotice(null)
    setRecent([])
    setForm((f) => ({ ...f, password: '' }))
    setMessage('')
    setView('login')
  }

  // ถ้ารหัสถูกเปลี่ยน/ถอนสิทธิ์ระหว่างใช้งาน ให้กลับไปหน้าเข้าสู่ระบบ
  function sessionLost(r) {
    if (r.error === 'INVALID_CREDENTIALS' || r.error === 'LOCKED') {
      logout()
      setMessage(errorText(r, 'trainer'))
      return true
    }
    return false
  }

  // ---------- ค้นหาพนักงาน ----------
  async function submitFind(e) {
    e.preventDefault()
    const id = target.trim().toUpperCase()
    if (!id) return
    setBusy(true)
    setNotice(null)
    setFound(null)
    const r = await findEmployee(session.creds, id)
    setBusy(false)
    if (r.ok) {
      setFound(r)
      setBonusOn(false)
    } else if (!sessionLost(r)) {
      setNotice({ type: 'error', text: errorText(r, 'trainer') })
    }
  }

  // ---------- กดให้ผ่าน ----------
  async function submitGrant() {
    if (!found || busy) return
    const { emp_no, name_th, surname_th } = found.employee
    const bonus = bonusOn ? session.station.max_bonus : 0
    setBusy(true)
    const r = await grantPass(session.creds, emp_no, bonus)
    setBusy(false)

    if (r.ok) {
      const name = `${name_th} ${surname_th}`
      setNotice({
        type: 'ok',
        text: `บันทึกแล้ว: ${name} ผ่านสถานี ${session.station.code}${bonus ? ` (+${bonus} คะแนน)` : ''} รวมผ่าน ${r.passed_count} จาก ${stations.length || 5} สถานี`,
      })
      setRecent((list) => [{ emp_no, name, bonus, at: new Date() }, ...list].slice(0, 5))
      setFound(null)
      setTarget('')
      targetRef.current?.focus()
    } else if (r.error === 'ALREADY_PASSED') {
      setFound((f) => ({ ...f, already_passed: true, passed_at: new Date().toISOString() }))
      setNotice({ type: 'error', text: errorText(r) })
    } else if (!sessionLost(r)) {
      setNotice({ type: 'error', text: errorText(r, 'trainer') })
    }
  }

  // ---------- หน้าจอ ----------
  if (view === 'boot') {
    return <p className="p-8 text-center text-sm text-slate-500">กำลังโหลด…</p>
  }

  if (view === 'login') {
    return (
      <form onSubmit={submitLogin} className="p-5">
        <div className={card}>
          <h2 className="text-lg font-bold">เข้าสู่ระบบเทรนเนอร์</h2>
          <p className="mt-1 text-sm text-slate-500">เลือกสถานีที่คุณดูแล แล้วใส่รหัสพนักงานและรหัสผ่าน</p>

          <label htmlFor="station" className="mt-5 block text-sm font-medium text-slate-600">
            สถานี
          </label>
          <select
            id="station"
            value={form.station}
            onChange={(e) => setForm({ ...form, station: e.target.value })}
            className={input}
          >
            {stations.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} · {s.name}
              </option>
            ))}
          </select>

          <label htmlFor="trainer" className="mt-4 block text-sm font-medium text-slate-600">
            รหัสพนักงานของเทรนเนอร์
          </label>
          <input
            id="trainer"
            value={form.trainer}
            onChange={(e) => setForm({ ...form, trainer: e.target.value.toUpperCase() })}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={10}
            className={`${input} font-semibold tracking-wider`}
          />

          <label htmlFor="password" className="mt-4 block text-sm font-medium text-slate-600">
            รหัสผ่าน
          </label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="off"
            className={input}
          />

          <p role="alert" className="mt-3 min-h-5 text-sm text-red-600">
            {message}
          </p>
          <button
            type="submit"
            disabled={busy || !form.trainer.trim() || !form.password || !form.station}
            className="mt-2 w-full rounded-xl bg-ink py-3 text-base font-bold text-white transition active:scale-[0.99] disabled:opacity-40"
          >
            {busy ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}
          </button>
        </div>
      </form>
    )
  }

  // ---------- work ----------
  const st = session.station
  const emp = found?.employee

  return (
    <div className="space-y-4 p-4">
      <section className={`${card} flex items-start justify-between gap-3`}>
        <div className="min-w-0">
          <p className="text-sm text-slate-500">สถานีที่ดูแล</p>
          <h2 className="text-lg font-bold">
            สถานี {st.code}
          </h2>
          <p className="text-sm text-slate-600">{st.name}</p>
          <p className="mt-1 text-sm text-slate-500">เทรนเนอร์: {session.trainerName}</p>
        </div>
        <button type="button" onClick={logout} className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-slate-500">
          <LogOut size={16} aria-hidden="true" />
          ออก
        </button>
      </section>

      <form onSubmit={submitFind} className={card}>
        <label htmlFor="target" className="block text-sm font-medium text-slate-600">
          รหัสพนักงานที่จะให้ผ่าน
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id="target"
            ref={targetRef}
            value={target}
            onChange={(e) => setTarget(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={10}
            placeholder="เช่น J3431"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-semibold tracking-wider outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30"
          />
          <button
            type="submit"
            disabled={busy || !target.trim()}
            className="rounded-xl bg-ink px-5 text-base font-bold text-white transition active:scale-[0.99] disabled:opacity-40"
          >
            ค้นหา
          </button>
        </div>
      </form>

      {notice && (
        <p
          role={notice.type === 'error' ? 'alert' : 'status'}
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            notice.type === 'ok' ? 'bg-green-50 text-green-800 ring-1 ring-green-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'
          }`}
        >
          {notice.text}
        </p>
      )}

      {found && (
        <section className={card}>
          <div className="flex items-center gap-4">
            <Avatar empNo={emp.emp_no} size={64} />
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold">
                {emp.name_th} {emp.surname_th}
              </h3>
              <p className="text-sm text-slate-500">
                {emp.dept_code} · รหัส {emp.emp_no}
              </p>
            </div>
          </div>

          {found.already_passed ? (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
              <CircleCheck size={18} aria-hidden="true" />
              ผ่านสถานีนี้แล้ว{found.passed_at ? ` เมื่อ ${shortDate(found.passed_at)}` : ''}
              {found.bonus_points > 0 ? ` (+${found.bonus_points} คะแนน)` : ''}
            </p>
          ) : (
            <>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <span id="bonus-label" className="text-sm font-medium">
                  ให้คะแนนเพิ่ม +{st.max_bonus}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={bonusOn}
                  aria-labelledby="bonus-label"
                  onClick={() => setBonusOn((v) => !v)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${bonusOn ? 'bg-pass' : 'bg-slate-300'}`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                      bonusOn ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
              <button
                type="button"
                onClick={submitGrant}
                disabled={busy}
                className="mt-4 w-full rounded-xl bg-pass py-3.5 text-base font-bold text-white transition active:scale-[0.99] disabled:opacity-50"
              >
                {busy ? 'กำลังบันทึก…' : `ให้ผ่านสถานี ${st.code}`}
              </button>
            </>
          )}
        </section>
      )}

      {recent.length > 0 && (
        <section className={card}>
          <h3 className="text-sm font-bold text-slate-600">บันทึกล่าสุดในครั้งนี้</h3>
          <ul className="mt-2 divide-y divide-slate-100">
            {recent.map((r, i) => (
              <li key={`${r.emp_no}-${i}`} className="flex items-center justify-between py-2 text-sm">
                <span className="min-w-0 truncate">
                  {r.name} <span className="text-slate-400">({r.emp_no})</span>
                </span>
                <span className="shrink-0 pl-3 font-semibold text-pass">{r.bonus ? `+${r.bonus}` : 'ผ่าน'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
