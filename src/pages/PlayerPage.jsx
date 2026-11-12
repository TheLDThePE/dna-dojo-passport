import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { CircleCheck, Keyboard, LoaderCircle, LogOut, ScanLine, X } from 'lucide-react'
import { listStations } from '../api/stationApi'
import { findByCard, findEmployee, grantPassBatch, trainerCheck } from '../api/trainerApi'
import { errorText } from '../lib/errorText'
import { normalizeCard, useCardReader } from '../lib/cardReader'
import {
  clearCreds,
  clearPending,
  loadCreds,
  loadForm,
  loadPending,
  saveCreds,
  saveForm,
  savePending,
} from '../lib/trainerSession'
import Avatar from '../components/Avatar'
import PlayerLogin from '../components/PlayerLogin'

const MAX_PLAYERS = 200 // ตรงกับขีดจำกัดของ trainer_grant_pass_batch

const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200'

const vibrate = (pattern) => {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* ไม่รองรับ: ข้ามได้ */
  }
}

// ---------------------------------------------------------------------------
// หน้า Player: เทรนเนอร์ล็อกอินครั้งเดียว ผู้เล่นสแกนบัตรทีละคน ติ๊กคะแนนเพิ่ม แล้ว Submit
// ทั้งรอบ จากนั้นล้างรายการเริ่มรอบใหม่โดยไม่ออกจากหน้า จนกว่าจะกด "ออก"
//
// แถวผู้เล่น (state players)  { key, status: 'loading' | 'ready', emp_no, name, dept, passed, bonus }
//   key = เลขบัตร 10 หลัก (หรือ "m:EMPNO" ถ้าใส่รหัสพนักงานเอง)
// ---------------------------------------------------------------------------
export default function PlayerPage() {
  const [view, setView] = useState('boot') // boot | login | work
  const [stations, setStations] = useState([])
  const [form, setForm] = useState({ station: '', trainer: '', password: '' })
  const [session, setSession] = useState(null) // { creds, trainerName, station }
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const [players, setPlayers] = useState([])
  const [notice, setNotice] = useState(null) // { type: 'ok' | 'warn' | 'error', text, lines? }
  const [manualOpen, setManualOpen] = useState(false)
  const [manual, setManual] = useState('')
  const [typing, setTyping] = useState(false) // กำลังพิมพ์ในช่องรหัสพนักงาน (พักการสแกนบัตร)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  const playersRef = useRef(players) // ให้โค้ดหลัง await อ่านรายการล่าสุดได้
  const epoch = useRef(0) // เพิ่มทุกครั้งที่ออกจากระบบ เพื่อทิ้งผลของคำขอที่ค้างอยู่
  const booted = useRef(false)

  useEffect(() => {
    playersRef.current = players
  }, [players])

  // เก็บรายชื่อที่ยังไม่ Submit ไว้ในแท็บนี้ (กันหายเมื่อสลับไปหน้า Rank แล้วกลับมา หรือรีเฟรช)
  useEffect(() => {
    if (!session) return
    savePending(session.creds, players.filter((p) => p.status === 'ready'))
  }, [players, session])

  // ---------- เปิดหน้า: โหลดสถานี + กู้การเข้าสู่ระบบเดิม + รายชื่อที่ค้างอยู่ ----------
  useEffect(() => {
    if (booted.current) return
    booted.current = true
    ;(async () => {
      const list = await listStations()
      const items = list.ok ? list.stations : []
      setStations(items)
      if (!list.ok) setMessage(errorText(list))

      const saved = loadForm()
      setForm((f) => ({
        ...f,
        trainer: saved.trainer || '',
        station: saved.station || items[0]?.code || '',
      }))

      const creds = loadCreds()
      if (creds) {
        const r = await trainerCheck(creds.trainer, creds.password, creds.station)
        if (r.ok) {
          setPlayers(loadPending(creds))
          setSession({ creds, trainerName: r.trainer, station: r.station })
          setView('work')
          return
        }
        clearCreds()
      }
      setView('login')
    })()
  }, [])

  // ---------- เข้าสู่ระบบ / ออกจากระบบ ----------
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
    saveCreds(creds)
    saveForm({ trainer, station: form.station })
    clearPending() // เข้าใหม่ = เริ่มรอบใหม่
    setPlayers([])
    setNotice(null)
    setSession({ creds, trainerName: r.trainer, station: r.station })
    setForm((f) => ({ ...f, trainer, password: '' }))
    setView('work')
  }

  function logout() {
    epoch.current += 1
    clearCreds()
    clearPending()
    setSession(null)
    setPlayers([])
    setNotice(null)
    setManualOpen(false)
    setManual('')
    setTyping(false)
    setConfirmOpen(false)
    setSending(false)
    setSendError('')
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

  // ---------- เพิ่มผู้เล่น (จากบัตร หรือจากรหัสพนักงานที่พิมพ์เอง) ----------
  async function lookup(key, request, how) {
    const mine = epoch.current
    setNotice(null)
    setPlayers((list) => [{ key, status: 'loading' }, ...list])
    const r = await request()
    if (mine !== epoch.current) return // ออกจากระบบไปแล้ว

    if (!r.ok) {
      setPlayers((list) => list.filter((p) => p.key !== key))
      if (sessionLost(r)) return
      vibrate([80, 60, 80])
      setNotice({
        type: 'error',
        text:
          r.error === 'NOT_FOUND' && how === 'card'
            ? 'ไม่พบบัตรใบนี้ในระบบ แจ้งผู้ดูแลระบบ หรือใช้ช่อง "ลืมบัตร" แทน'
            : errorText(r, 'trainer'),
      })
      return
    }

    const e = r.employee
    const name = `${e.name_th ?? ''} ${e.surname_th ?? ''}`.trim()
    if (playersRef.current.some((p) => p.key !== key && p.emp_no === e.emp_no)) {
      setPlayers((list) => list.filter((p) => p.key !== key))
      vibrate([80, 60, 80])
      setNotice({ type: 'warn', text: `สแกนซ้ำ: ${name} อยู่ในรายการแล้ว` })
      return
    }

    setPlayers((list) =>
      list.map((p) =>
        p.key === key
          ? { key, status: 'ready', emp_no: e.emp_no, name, dept: e.dept_code, passed: r.already_passed, bonus: false }
          : p,
      ),
    )
    if (r.already_passed) {
      vibrate([80, 60, 80])
      setNotice({ type: 'warn', text: `${name} ผ่านสถานีนี้แล้ว ไม่ต้องให้ผ่านซ้ำ` })
    } else {
      vibrate(40)
    }
  }

  function canAdd(key, empNo) {
    if (playersRef.current.length >= MAX_PLAYERS) {
      setNotice({ type: 'warn', text: `รายการเต็ม ${MAX_PLAYERS} คน กด Submit ก่อน แล้วค่อยสแกนต่อ` })
      return false
    }
    if (playersRef.current.some((p) => p.key === key || (empNo && p.emp_no === empNo))) {
      vibrate([80, 60, 80])
      setNotice({ type: 'warn', text: 'สแกนซ้ำ: คนนี้อยู่ในรายการแล้ว' })
      return false
    }
    return true
  }

  function handleScan(raw) {
    const cardNo = normalizeCard(raw)
    if (!cardNo || !canAdd(cardNo)) return
    lookup(cardNo, () => findByCard(session.creds, cardNo), 'card')
  }

  function submitManual(e) {
    e.preventDefault()
    const id = manual.trim().toUpperCase()
    if (!id || !canAdd(`m:${id}`, id)) return
    setManual('')
    setManualOpen(false)
    setTyping(false)
    lookup(`m:${id}`, () => findEmployee(session.creds, id), 'manual')
  }

  const scanLive = view === 'work' && !confirmOpen && !typing
  useCardReader({ enabled: scanLive, onScan: handleScan })

  // ---------- ติ๊กคะแนน / เอาออก ----------
  const toggleBonus = (key) =>
    setPlayers((list) => list.map((p) => (p.key === key ? { ...p, bonus: !p.bonus } : p)))
  const removePlayer = (key) => setPlayers((list) => list.filter((p) => p.key !== key))

  // ---------- Submit ทั้งรอบ ----------
  async function sendAll() {
    const mine = epoch.current
    const max = session.station.max_bonus
    const sendable = players.filter((p) => p.status === 'ready' && !p.passed)
    if (!sendable.length || sending) return

    setSending(true)
    setSendError('')
    const r = await grantPassBatch(
      session.creds,
      sendable.map((p) => ({ emp_no: p.emp_no, bonus: p.bonus ? max : 0 })),
    )
    if (mine !== epoch.current) return
    setSending(false)

    if (!r.ok) {
      if (sessionLost(r)) return
      setSendError(errorText(r, 'trainer')) // รายการยังอยู่ ลองกดยืนยันอีกครั้งได้
      return
    }

    const byEmp = Object.fromEntries(sendable.map((p) => [p.emp_no, p]))
    const failedRows = r.results.filter((x) => !x.ok)
    const bonusDone = r.results.filter((x) => x.ok && x.bonus_points > 0).length
    setConfirmOpen(false)
    setPlayers([]) // ล้างรายการเก่า พร้อมรับผู้เล่นรอบถัดไป
    setNotice({
      type: failedRows.length ? 'warn' : 'ok',
      text: `บันทึกแล้ว ${r.granted} คน${bonusDone ? ` (ได้คะแนนเพิ่ม +${max} จำนวน ${bonusDone} คน)` : ''}${
        failedRows.length ? ` · ไม่สำเร็จ ${failedRows.length} คน` : ''
      }`,
      lines: failedRows.map((x) => `${byEmp[x.emp_no]?.name || x.emp_no} (${x.emp_no}): ${errorText(x, 'trainer')}`),
    })
    vibrate(failedRows.length ? [80, 60, 80] : 60)
  }

  // ---------- หน้าจอ ----------
  if (view === 'boot') {
    return <p className="p-8 text-center text-sm text-slate-500">กำลังโหลด…</p>
  }

  if (view === 'login') {
    return (
      <PlayerLogin
        stations={stations}
        form={form}
        setForm={setForm}
        busy={busy}
        message={message}
        onSubmit={submitLogin}
      />
    )
  }

  const st = session.station
  const ready = players.filter((p) => p.status === 'ready')
  const sendable = ready.filter((p) => !p.passed)
  const loadingCount = players.length - ready.length
  const bonusCount = sendable.filter((p) => p.bonus).length

  return (
    <div className="space-y-4 px-4 pt-4">
      <section className={`${card} flex items-start justify-between gap-3`}>
        <div className="min-w-0">
          <p className="text-sm text-slate-500">สถานีที่ดูแล</p>
          <h2 className="text-lg font-bold">สถานี {st.code}</h2>
          <p className="text-sm text-slate-600">{st.name}</p>
          <p className="mt-1 text-sm text-slate-500">เทรนเนอร์: {session.trainerName}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-slate-500"
        >
          <LogOut size={16} aria-hidden="true" />
          ออก
        </button>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-3">
          <p role="status" className="flex items-center gap-2 text-sm font-semibold">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${scanLive ? 'animate-pulse bg-pass' : 'bg-amber-400'}`}
            />
            {scanLive
              ? 'พร้อมสแกนบัตร'
              : confirmOpen
                ? 'พักการสแกน (กำลังยืนยัน)'
                : 'พักการสแกน (กำลังพิมพ์รหัส)'}
          </p>
          <button
            type="button"
            onClick={() => {
              setManualOpen((v) => !v)
              setTyping(false)
            }}
            aria-expanded={manualOpen}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-700"
          >
            <Keyboard size={16} aria-hidden="true" />
            {manualOpen ? 'ปิดช่องรหัส' : 'ลืมบัตร?'}
          </button>
        </div>

        {manualOpen && (
          <form onSubmit={submitManual} className="mt-3">
            <label htmlFor="player-manual" className="block text-sm font-medium text-slate-600">
              รหัสพนักงาน (ระหว่างพิมพ์ เครื่องอ่านบัตรจะพักไว้)
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="player-manual"
                autoFocus
                value={manual}
                onChange={(e) => setManual(e.target.value.toUpperCase())}
                onFocus={() => setTyping(true)}
                onBlur={() => setTyping(false)}
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
                disabled={!manual.trim()}
                className="rounded-xl bg-ink px-5 text-base font-bold text-white transition active:scale-[0.99] disabled:opacity-40"
              >
                เพิ่ม
              </button>
            </div>
          </form>
        )}
      </section>

      {notice && (
        <div
          role={notice.type === 'ok' ? 'status' : 'alert'}
          className={`rounded-xl px-4 py-3 text-sm font-medium ring-1 ${
            notice.type === 'ok'
              ? 'bg-green-50 text-green-800 ring-green-200'
              : notice.type === 'warn'
                ? 'bg-amber-50 text-amber-900 ring-amber-200'
                : 'bg-red-50 text-red-700 ring-red-200'
          }`}
        >
          <p>{notice.text}</p>
          {notice.lines?.length > 0 && (
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 font-normal">
              {notice.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {players.length === 0 ? (
        <section className="flex flex-col items-center rounded-2xl bg-white px-6 py-10 text-center shadow-sm ring-1 ring-slate-200">
          <ScanLine size={40} className="text-slate-300" aria-hidden="true" />
          <h3 className="mt-3 text-base font-bold">ให้ผู้เล่นแตะบัตรที่เครื่องอ่าน</h3>
          <p className="mt-1 text-sm text-slate-500">
            ชื่อจะขึ้นในรายการนี้ทีละคน ติ๊กให้คะแนนเพิ่ม แล้วกด Submit เมื่อครบทั้งรอบ
          </p>
        </section>
      ) : (
        <section>
          <p className="mb-2 text-sm text-slate-500">
            ผู้เล่น {players.length} คน · ติ๊ก = ให้คะแนนเพิ่ม +{st.max_bonus}
          </p>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            {players.map((p) => (
              <PlayerRow
                key={p.key}
                p={p}
                max={st.max_bonus}
                onToggle={() => toggleBonus(p.key)}
                onRemove={() => removePlayer(p.key)}
              />
            ))}
          </ul>
        </section>
      )}

      {players.length > 0 && (
        <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 text-sm text-slate-600">
              <span className="font-bold text-ink">{sendable.length} คน</span>
              {bonusCount > 0 ? ` · +${st.max_bonus} จำนวน ${bonusCount} คน` : ''}
            </p>
            <button
              type="button"
              onClick={() => {
                setSendError('')
                setConfirmOpen(true)
              }}
              disabled={sendable.length === 0 || loadingCount > 0}
              className="shrink-0 rounded-xl bg-pass px-6 py-3 text-base font-bold text-white transition active:scale-[0.99] disabled:opacity-40"
            >
              {loadingCount > 0 ? 'กำลังตรวจรายชื่อ…' : 'Submit'}
            </button>
          </div>
        </div>
      )}

      {confirmOpen && (
        <ConfirmSheet
          station={st}
          rows={sendable}
          sending={sending}
          error={sendError}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={sendAll}
        />
      )}
    </div>
  )
}

// แถวผู้เล่น: [ติ๊ก] [รูป] [รหัส/ชื่อ] [ป้าย] [ลบ]  — แตะที่แถวตรงไหนก็ติ๊กได้
function PlayerRow({ p, max, onToggle, onRemove }) {
  if (p.status === 'loading') {
    return (
      <li className="flex items-center gap-3 px-3 py-4 text-sm text-slate-500">
        <LoaderCircle size={24} className="animate-spin text-slate-400" aria-hidden="true" />
        กำลังตรวจบัตร…
      </li>
    )
  }

  const body = (
    <>
      {p.passed ? (
        <CircleCheck size={28} className="shrink-0 text-pass" aria-hidden="true" />
      ) : (
        <input
          type="checkbox"
          checked={p.bonus}
          onChange={onToggle}
          aria-label={`ให้คะแนนเพิ่ม +${max} แก่ ${p.name}`}
          className="h-7 w-7 shrink-0 cursor-pointer accent-pass"
        />
      )}
      <Avatar empNo={p.emp_no} size={44} />
      <span className="min-w-0 flex-1">
        <span className="block font-bold tracking-wide">{p.emp_no}</span>
        <span className="block truncate text-sm text-slate-600">{p.name}</span>
      </span>
      {p.passed ? (
        <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
          ผ่านแล้ว
        </span>
      ) : (
        p.bonus && (
          <span className="shrink-0 rounded-full bg-pass px-2.5 py-1 text-xs font-bold text-white">+{max}</span>
        )
      )}
    </>
  )

  const rowClass = 'flex min-w-0 flex-1 items-center gap-3 px-3 py-3'
  return (
    <li className={`flex items-center ${p.passed ? 'bg-slate-50' : p.bonus ? 'bg-green-50' : ''}`}>
      {p.passed ? (
        <div className={rowClass}>{body}</div>
      ) : (
        <label className={`${rowClass} cursor-pointer`}>{body}</label>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`เอา ${p.name} ออกจากรายการ`}
        className="mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 active:bg-slate-100"
      >
        <X size={20} aria-hidden="true" />
      </button>
    </li>
  )
}

// หน้าต่างสรุปให้ยืนยันก่อนส่งผลจริง
function ConfirmSheet({ station, rows, sending, error, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const max = station.max_bonus
  const bonusCount = rows.filter((p) => p.bonus).length

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  const cancel = useEffectEvent(() => {
    if (!sending) onCancel()
  })
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') cancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50"
      onClick={() => !sending && onCancel()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl outline-none"
      >
        <h3 id="confirm-title" className="text-lg font-bold">
          ยืนยันส่งผลสถานี {station.code}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          ผ่านสถานี <b>{rows.length} คน</b> · ได้คะแนนเพิ่ม +{max} <b>{bonusCount} คน</b> · ไม่ได้คะแนนเพิ่ม{' '}
          <b>{rows.length - bonusCount} คน</b>
        </p>

        <ul className="mt-3 max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-xl ring-1 ring-slate-200">
          {rows.map((p) => (
            <li key={p.key} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 truncate">
                <span className="font-semibold">{p.emp_no}</span> {p.name}
              </span>
              <span className={`shrink-0 font-bold ${p.bonus ? 'text-pass' : 'text-slate-400'}`}>
                {p.bonus ? `+${max}` : 'ผ่าน'}
              </span>
            </li>
          ))}
        </ul>

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
            {error}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            className="rounded-xl bg-slate-100 py-3 text-base font-bold text-slate-700 disabled:opacity-50"
          >
            ย้อนกลับ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={sending}
            className="rounded-xl bg-pass py-3 text-base font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
          >
            {sending ? 'กำลังบันทึก…' : 'ยืนยัน'}
          </button>
        </div>
      </div>
    </div>
  )
}
