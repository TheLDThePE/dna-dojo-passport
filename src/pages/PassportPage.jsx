import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, LogOut, RefreshCw, RotateCcw } from 'lucide-react'
import { loginPassport, lookupEmployee, registerPin, restartPassport } from '../api/passportApi'
import { clearSession, loadSession, saveSession } from '../lib/session'
import { errorText } from '../lib/errorText'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'
import PinPad from '../components/PinPad'
import StationMap from '../components/StationMap'

const PIN_LENGTH = 6

// คำนวณสถานะเริ่มต้นจาก session ครั้งเดียวตอน mount (ไม่ต้องใช้ effect)
function readBootState() {
  const s = loadSession()
  if (!s.empNo) return { view: 'emp', empNo: '', session: s }
  if (!s.pin) return { view: 'pin', empNo: s.empNo, session: s }
  return { view: 'boot', empNo: s.empNo, session: s } // มีทั้ง empNo + pin → ลอง login เงียบๆ
}

export default function PassportPage() {
  // boot | emp | pin | create | confirm | passport
  const [boot] = useState(readBootState)
  const [view, setView] = useState(boot.view)
  const [empNo, setEmpNo] = useState(boot.empNo)
  const [pin, setPin] = useState('')
  const [firstPin, setFirstPin] = useState('')
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState('')
  const pinRef = useRef('') // PIN ที่ login สำเร็จ ใช้รีเฟรชข้อมูลเงียบๆ
  const navigate = useNavigate()

  // ป๊อปอัป: สถานีที่ยังไม่ผ่านถูกแตะ / ขั้นตอน Restart (null | 'blocked' | 'confirm' | 'pin')
  const [lockedStation, setLockedStation] = useState(null)
  const [restartStep, setRestartStep] = useState(null)
  const [restartPin, setRestartPin] = useState('')
  const [restartMsg, setRestartMsg] = useState('')
  const [restarting, setRestarting] = useState(false)
  const [notice, setNotice] = useState('')

  // ---------- เข้าสู่ระบบ ----------
  const doLogin = useCallback(async (id, p) => {
    setBusy(true)
    setMessage('')
    const r = await loginPassport(id, p)
    setBusy(false)
    setPin('')
    if (r.ok) {
      pinRef.current = p
      saveSession(id, p)
      setData(r)
      setView('passport')
      return
    }
    if (r.error === 'NOT_REGISTERED') {
      setView('create')
      return
    }
    setMessage(errorText(r))
  }, [])

  // ---------- boot: ถ้ามี session เดิมครบ ให้ลอง login เงียบๆ ----------
  useEffect(() => {
    if (boot.view !== 'boot') return
    let ignore = false
    ;(async () => {
      const r = await loginPassport(boot.session.empNo, boot.session.pin)
      if (ignore) return
      if (r.ok) {
        pinRef.current = boot.session.pin
        setData(r)
        setView('passport')
      } else {
        setView(r.error === 'NOT_REGISTERED' ? 'create' : 'pin')
        if (r.error !== 'INVALID_CREDENTIALS') setMessage(errorText(r))
      }
    })()
    return () => {
      ignore = true
    }
  }, [boot])

  // ---------- PIN ครบ 6 หลัก → ทำงานต่อ (ย้ายจาก effect มาเป็น handler) ----------
  const handlePinChange = useCallback(
    (newPin) => {
      setPin(newPin)
      if (newPin.length !== PIN_LENGTH || busy) return

      if (view === 'pin') {
        doLogin(empNo, newPin)
        return
      }

      if (view === 'create') {
        setFirstPin(newPin)
        setPin('')
        setMessage('')
        setView('confirm')
        return
      }

      if (view === 'confirm') {
        if (newPin !== firstPin) {
          setPin('')
          setFirstPin('')
          setMessage('PIN สองครั้งไม่ตรงกัน ตั้งใหม่อีกครั้ง')
          setView('create')
          return
        }
        ;(async () => {
          setBusy(true)
          const r = await registerPin(empNo, newPin)
          setBusy(false)
          if (r.ok) {
            doLogin(empNo, newPin)
          } else {
            setPin('')
            setFirstPin('')
            setMessage(errorText(r))
            setView(r.error === 'ALREADY_REGISTERED' ? 'pin' : 'create')
          }
        })()
      }
    },
    [view, busy, empNo, firstPin, doLogin]
  )

  // ---------- รีเฟรชข้อมูล (หลังเทรนเนอร์กดให้ผ่าน) ----------
  const refresh = useCallback(async () => {
    if (!pinRef.current || !empNo) return
    setRefreshing(true)
    const r = await loginPassport(empNo, pinRef.current)
    setRefreshing(false)
    if (r.ok) setData(r)
    else if (r.error === 'INVALID_CREDENTIALS' || r.error === 'NOT_REGISTERED') {
      // PIN ถูกรีเซ็ตโดย Admin
      pinRef.current = ''
      setPin('')
      setView(r.error === 'NOT_REGISTERED' ? 'create' : 'pin')
    }
  }, [empNo])

  useEffect(() => {
    if (view !== 'passport') return
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [view, refresh])

  // ---------- การกระทำบนหน้าจอ ----------
  async function submitEmp(e) {
    e.preventDefault()
    const id = empNo.trim().toUpperCase()
    if (!id) return
    setBusy(true)
    setMessage('')
    const r = await lookupEmployee(id)
    setBusy(false)
    if (!r.ok) return setMessage(errorText(r))
    if (!r.exists) return setMessage(errorText({ error: 'NOT_FOUND' }))
    setEmpNo(id)
    setPin('')
    setFirstPin('')
    setView(r.registered ? 'pin' : 'create')
  }

  function changeEmployee() {
    setPin('')
    setFirstPin('')
    setMessage('')
    setView('emp')
  }

  function logout() {
    clearSession()
    pinRef.current = ''
    setData(null)
    setEmpNo('')
    setPin('')
    setFirstPin('')
    setMessage('')
    setView('emp')
  }

  // ---------- แตะสถานี: ผ่านแล้ว = ไปทำข้อสอบ, ยังไม่ผ่าน = แจ้งเตือน ----------
  function selectStation(st) {
    setNotice('')
    if (st.passed) navigate(`/passport/exam/${st.code}`)
    else setLockedStation(st)
  }

  // ---------- Restart (ต้องผ่านครบทุกสถานีก่อน + ยืนยัน 2 ชั้น: อ่านคำเตือน แล้วใส่ PIN) ----------
  function openRestart() {
    setNotice('')
    setRestartMsg('')
    setRestartPin('')
    const all = (data?.stations?.length ?? 0) > 0 && data.passed_count === data.stations.length
    setRestartStep(all ? 'confirm' : 'blocked')
  }

  function closeRestart() {
    setRestartStep(null)
    setRestartPin('')
    setRestartMsg('')
  }

  async function doRestart(p) {
    setRestarting(true)
    setRestartMsg('')
    const r = await restartPassport(empNo, p)
    setRestarting(false)
    setRestartPin('')
    if (r.ok) {
      setData(r)
      setRestartStep(null)
      setNotice('Restart เรียบร้อย ข้อมูลเดิมถูกล้างแล้ว เริ่มเล่นใหม่ได้เลย')
      return
    }
    setRestartMsg(errorText(r))
    if (r.error === 'NOT_ALL_PASSED') {
      setRestartStep('blocked') // ข้อมูลบนหน้าจอเก่า (เช่น Admin ล้างผลไปแล้ว)
      refresh()
    }
  }

  function handleRestartPin(newPin) {
    setRestartPin(newPin)
    if (newPin.length === PIN_LENGTH && !restarting) doRestart(newPin)
  }

  // ---------- หน้าจอ ----------
  if (view === 'boot') {
    return <p className="p-8 text-center text-sm text-slate-500">กำลังโหลด…</p>
  }

  if (view === 'emp') {
    return (
      <form onSubmit={submitEmp} className="p-5">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-bold">เข้าดู Passport ของคุณ</h2>
          <label htmlFor="emp" className="mt-5 block text-sm font-medium text-slate-600">
            รหัสพนักงาน
          </label>
          <input
            id="emp"
            value={empNo}
            onChange={(e) => setEmpNo(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={10}
            placeholder="เช่น J3431"
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-semibold tracking-wider outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30"
          />
          <p role="alert" className="mt-3 min-h-5 text-sm text-red-600">
            {message}
          </p>
          <button
            type="submit"
            disabled={busy || !empNo.trim()}
            className="mt-2 w-full rounded-xl bg-ink py-3 text-base font-bold text-white transition active:scale-[0.99] disabled:opacity-40"
          >
            {busy ? 'กำลังตรวจสอบ…' : 'ต่อไป'}
          </button>
        </div>
      </form>
    )
  }

  if (view === 'pin' || view === 'create' || view === 'confirm') {
    const heading =
      view === 'pin' ? 'ใส่ PIN 6 หลัก' : view === 'create' ? 'ตั้ง PIN ครั้งแรก' : 'ยืนยัน PIN อีกครั้ง'
    const hint =
      view === 'pin'
        ? 'ลืม PIN ให้แจ้งผู้ดูแลระบบเพื่อรีเซ็ต'
        : view === 'create'
          ? 'ตั้งเลข 6 หลักที่จำง่าย ใช้เข้าดู Passport ครั้งต่อไป'
          : 'ใส่เลข 6 หลักเดิมอีกครั้ง'
    return (
      <div className="p-5">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col items-center text-center">
            <Avatar empNo={empNo} size={64} />
            <p className="mt-2 text-sm font-semibold text-slate-500">รหัส {empNo}</p>
            <h2 className="mt-3 text-lg font-bold">{heading}</h2>
            <p className="mt-1 text-sm text-slate-500">{hint}</p>
          </div>
          <div className="mt-6">
            <PinPad value={pin} onChange={handlePinChange} length={PIN_LENGTH} disabled={busy} />
          </div>
          <p role="alert" className="mt-4 min-h-5 text-center text-sm text-red-600">
            {busy ? '' : message}
          </p>
          <button
            type="button"
            onClick={changeEmployee}
            className="mx-auto mt-2 block text-sm font-medium text-blue-700 underline-offset-2 hover:underline"
          >
            ไม่ใช่รหัสนี้? เปลี่ยนรหัสพนักงาน
          </button>
        </div>
      </div>
    )
  }

  // ---------- passport ----------
  const stations = data?.stations ?? []
  const total = stations.length
  const passed = data?.passed_count ?? 0
  const percent = total ? Math.round((passed / total) * 100) : 0
  const emp = data?.employee ?? {}
  const done = total > 0 && passed === total
  const examSum = stations.reduce((sum, st) => sum + (st.exam_score ?? 0), 0)

  return (
    <div className="space-y-4 p-4">
      <section className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <Avatar
          empNo={emp.emp_no}
          size={72}
          className={`ring-4 ${done ? 'ring-gold' : 'ring-slate-200'}`}
        />
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-lg font-bold leading-snug">
            {emp.name_th} {emp.surname_th}
          </h2>
          <p className="text-sm text-slate-500">{emp.dept_code}</p>
          <p className="text-sm text-slate-500">รหัส {emp.emp_no}</p>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-2xl font-extrabold leading-none text-ink">{data?.total_points ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">คะแนน</p>
          <button
            type="button"
            onClick={openRestart}
            className="mt-2 inline-flex items-center gap-1 rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 active:bg-slate-100"
          >
            <RotateCcw size={12} aria-hidden="true" />
            Restart
          </button>
        </div>
      </section>

      {notice && (
        <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800 ring-1 ring-green-200">
          {notice}
        </p>
      )}

      <section className="rounded-2xl bg-white px-4 pb-5 pt-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-center text-base font-bold">Passport การฝึกอบรม</h3>
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2 text-[13px] font-medium leading-snug text-blue-900 ring-1 ring-blue-100">
          <ClipboardCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          อย่าลืมกดที่สถานีที่ผ่านแล้ว (วงกลมเขียว ✓) เพื่อทำข้อสอบรับคะแนนเพิ่ม
        </p>
        <div className="mt-4">
          <StationMap stations={stations} onSelect={selectStation} />
        </div>

        <div className="mt-2 border-t border-slate-100 pt-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold">
              ผ่านแล้ว {passed} จาก {total} สถานี
            </span>
            <span className="font-bold text-blue-700">{percent}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-pass transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>
          {done && <p className="mt-3 text-center text-sm font-semibold text-pass">ผ่านครบทุกสถานีแล้ว</p>}
        </div>
      </section>

      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
          อัปเดตข้อมูล
        </button>
        <button type="button" onClick={logout} className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
          <LogOut size={16} aria-hidden="true" />
          ออกจากระบบ
        </button>
      </div>

      {lockedStation && (
        <Modal title={`ยังไม่ผ่านสถานี ${lockedStation.code}`} onClose={() => setLockedStation(null)}>
          <p className="mt-2 text-sm text-slate-600">
            ไปให้เทรนเนอร์ประจำสถานีนี้กดผ่านก่อน จึงจะทำข้อสอบของสถานีนี้ได้
          </p>
          <button
            type="button"
            onClick={() => setLockedStation(null)}
            className="mt-5 w-full rounded-xl bg-ink py-3 text-base font-bold text-white"
          >
            ตกลง
          </button>
        </Modal>
      )}

      {restartStep === 'blocked' && (
        <Modal title="ยัง Restart ไม่ได้" onClose={closeRestart}>
          <p className="mt-2 text-sm text-slate-600">
            ต้องผ่านครบทุกสถานีก่อนจึงจะ Restart ได้ ตอนนี้ผ่านแล้ว {passed} จาก {total} สถานี
          </p>
          <button
            type="button"
            onClick={closeRestart}
            className="mt-5 w-full rounded-xl bg-ink py-3 text-base font-bold text-white"
          >
            ตกลง
          </button>
        </Modal>
      )}

      {restartStep === 'confirm' && (
        <Modal title="Restart เริ่มเล่นใหม่?" onClose={closeRestart}>
          <p className="mt-2 text-sm text-slate-600">จะล้างข้อมูลต่อไปนี้ของคุณทั้งหมด:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-ink">
            <li>
              ผ่านสถานี {passed} จาก {total} สถานี
            </li>
            <li>คะแนนรวม {data?.total_points ?? 0} คะแนน</li>
            {examSum > 0 && <li>คะแนนข้อสอบ {examSum} คะแนน</li>}
          </ul>
          <p className="mt-3 text-sm text-red-700">
            ชื่อของคุณจะหายจากหน้า Rank จนกว่าจะผ่านสถานีใหม่ และย้อนกลับไม่ได้
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={closeRestart}
              className="rounded-xl bg-slate-100 py-3 text-base font-bold text-slate-700"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => setRestartStep('pin')}
              className="rounded-xl bg-red-600 py-3 text-base font-bold text-white"
            >
              ต่อไป
            </button>
          </div>
        </Modal>
      )}

      {restartStep === 'pin' && (
        <Modal title="ใส่ PIN เพื่อยืนยัน Restart" onClose={closeRestart} busy={restarting}>
          <p className="mt-1 text-sm text-slate-500">ใส่ PIN 6 หลักของคุณอีกครั้ง</p>
          <div className="mt-5">
            <PinPad value={restartPin} onChange={handleRestartPin} length={PIN_LENGTH} disabled={restarting} />
          </div>
          <p role="alert" className="mt-4 min-h-5 text-center text-sm text-red-600">
            {restarting ? 'กำลังล้างข้อมูล…' : restartMsg}
          </p>
          <button
            type="button"
            onClick={closeRestart}
            disabled={restarting}
            className="mt-2 w-full rounded-xl bg-slate-100 py-3 text-base font-bold text-slate-700 disabled:opacity-50"
          >
            ยกเลิก
          </button>
        </Modal>
      )}
    </div>
  )
}
