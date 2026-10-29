import { useCallback, useEffect, useState } from 'react'
import { adminListTrainers, adminRemoveTrainer, adminSetTrainer } from '../../api/adminApi'
import { listStations } from '../../api/stationApi'
import { errorText } from '../../lib/errorText'
import { btnDanger, btnGhost, btnPrimary, card, Field, inputCls, Notice } from './ui'

const messageFor = (r) =>
  r.error === 'BAD_PASSWORD'
    ? 'รหัสผ่านเทรนเนอร์ต้องยาวอย่างน้อย 6 ตัวอักษร'
    : r.error === 'NOT_FOUND'
      ? 'ไม่พบรหัสพนักงานนี้ในระบบ (เพิ่มในแท็บพนักงานก่อน)'
      : errorText(r, 'admin')

export default function TrainersTab({ pw, fail }) {
  const [stations, setStations] = useState([])
  const [trainers, setTrainers] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const [confirm, setConfirm] = useState(null) // { empNo, station }
  const [form, setForm] = useState({ station: '', emp_no: '', password: '' })

  const load = useCallback(async () => {
    const [t, s] = await Promise.all([adminListTrainers(pw), listStations()])
    if (fail(t)) return
    if (!t.ok) return setNotice({ type: 'error', text: errorText(t, 'admin') })
    setTrainers(t.rows)
    if (s.ok) {
      setStations(s.stations)
      setForm((f) => (f.station ? f : { ...f, station: s.stations[0]?.code || '' }))
    }
  }, [pw, fail])

  useEffect(() => {
    load()
  }, [load])

  async function onSave(e) {
    e.preventDefault()
    setBusy(true)
    setNotice(null)
    const empNo = form.emp_no.trim().toUpperCase()
    const r = await adminSetTrainer(pw, empNo, form.station, form.password)
    setBusy(false)
    if (fail(r)) return
    if (!r.ok) return setNotice({ type: 'error', text: messageFor(r) })
    setNotice({ type: 'ok', text: `บันทึกเทรนเนอร์ ${empNo} สถานี ${form.station} แล้ว` })
    setForm((f) => ({ ...f, emp_no: '', password: '' }))
    load()
  }

  async function onRemove() {
    const { empNo, station } = confirm
    setConfirm(null)
    setBusy(true)
    const r = await adminRemoveTrainer(pw, empNo, station)
    setBusy(false)
    if (fail(r)) return
    if (!r.ok) return setNotice({ type: 'error', text: messageFor(r) })
    setNotice({ type: 'ok', text: `ลบ ${empNo} ออกจากสถานี ${station} แล้ว` })
    load()
  }

  return (
    <div className="space-y-4">
      <Notice notice={notice} />

      {!trainers && !notice && <p className="py-6 text-center text-sm text-slate-500">กำลังโหลด…</p>}

      {trainers &&
        (stations.length ? stations : [...new Set(trainers.map((t) => t.station_code))].map((code) => ({ code, name: '' }))).map((s) => {
          const list = trainers.filter((t) => t.station_code === s.code)
          return (
            <section key={s.code} className={card}>
              <h3 className="text-sm font-bold">
                {s.code} <span className="font-medium text-slate-500">{s.name}</span>
                <span className="ml-2 text-xs font-medium text-slate-400">({list.length} คน)</span>
              </h3>
              {list.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">ยังไม่มีเทรนเนอร์</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100">
                  {list.map((t) => {
                    const asking = confirm?.empNo === t.emp_no && confirm?.station === t.station_code
                    return (
                      <li key={t.emp_no} className="py-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate text-sm">
                            {t.name} <span className="text-slate-400">({t.emp_no})</span>
                          </span>
                          {!asking && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setConfirm({ empNo: t.emp_no, station: t.station_code })}
                              aria-label={`ลบ ${t.emp_no} ออกจาก ${t.station_code}`}
                              className="shrink-0 text-sm font-medium text-red-600"
                            >
                              ลบ
                            </button>
                          )}
                        </div>
                        {asking && (
                          <div className="mt-2 rounded-xl bg-red-50 p-3 ring-1 ring-red-200">
                            <p className="text-sm font-medium text-red-800">
                              ลบ {t.emp_no} ออกจากสถานี {t.station_code}?
                            </p>
                            <div className="mt-2 flex gap-2">
                              <button type="button" onClick={onRemove} disabled={busy} className={btnDanger}>
                                ยืนยัน
                              </button>
                              <button type="button" onClick={() => setConfirm(null)} className={btnGhost}>
                                ยกเลิก
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}

      <form onSubmit={onSave} className={`${card} space-y-3`}>
        <h3 className="text-base font-bold">เพิ่ม / เปลี่ยนรหัสผ่านเทรนเนอร์</h3>
        <p className="text-sm text-slate-500">ถ้ามีเทรนเนอร์ในสถานีนั้นอยู่แล้ว ระบบจะเปลี่ยนรหัสผ่านให้</p>
        <Field id="tr-station" label="สถานี">
          <select
            id="tr-station"
            value={form.station}
            onChange={(e) => setForm({ ...form, station: e.target.value })}
            className={inputCls}
          >
            {stations.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} · {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="tr-emp" label="รหัสพนักงานของเทรนเนอร์">
          <input
            id="tr-emp"
            value={form.emp_no}
            onChange={(e) => setForm({ ...form, emp_no: e.target.value.toUpperCase() })}
            maxLength={10}
            autoComplete="off"
            className={inputCls}
          />
        </Field>
        <Field id="tr-pw" label="รหัสผ่านเทรนเนอร์ (อย่างน้อย 6 ตัว)">
          <input
            id="tr-pw"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
            className={inputCls}
          />
        </Field>
        <button type="submit" disabled={busy || !form.emp_no.trim() || !form.password} className={`${btnPrimary} w-full`}>
          บันทึกเทรนเนอร์
        </button>
      </form>
    </div>
  )
}
