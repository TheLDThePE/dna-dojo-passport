import { useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import {
  adminAddEmployee, adminFindEmployee, adminResetPin, adminResetResults,
} from '../../api/adminApi'
import { errorText } from '../../lib/errorText'
import Avatar from '../Avatar'
import { btnDanger, btnGhost, btnPrimary, card, Field, inputCls, Notice } from './ui'

const EMPTY = { emp_no: '', title_th: '', name_th: '', surname_th: '', name_en: '', surname_en: '', dept_code: '' }

export default function EmployeesTab({ pw, fail }) {
  const [q, setQ] = useState('')
  const [searched, setSearched] = useState('')
  const [rows, setRows] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const [confirm, setConfirm] = useState(null) // { empNo, action: 'pin' | 'results' }
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)

  async function search(term) {
    const t = term.trim()
    if (!t) return
    setBusy(true)
    const r = await adminFindEmployee(pw, t)
    setBusy(false)
    if (fail(r)) return
    if (!r.ok) return setNotice({ type: 'error', text: errorText(r, 'admin') })
    setSearched(t)
    setRows(r.rows)
  }

  function onSearch(e) {
    e.preventDefault()
    setNotice(null)
    setConfirm(null)
    search(q)
  }

  async function runAction() {
    const { empNo, action } = confirm
    setConfirm(null)
    setBusy(true)
    const r = action === 'pin' ? await adminResetPin(pw, empNo) : await adminResetResults(pw, { empNo })
    setBusy(false)
    if (fail(r)) return
    if (!r.ok) return setNotice({ type: 'error', text: errorText(r, 'admin') })
    setNotice({
      type: 'ok',
      text:
        action === 'pin'
          ? `รีเซ็ต PIN ของ ${empNo} แล้ว ให้ตั้ง PIN ใหม่ตอนเข้า Passport ครั้งถัดไป`
          : `ล้างผลการผ่านของ ${empNo} แล้ว (${r.completions_deleted} รายการ)`,
    })
    search(searched)
  }

  async function onAdd(e) {
    e.preventDefault()
    setBusy(true)
    setNotice(null)
    const r = await adminAddEmployee(pw, form)
    setBusy(false)
    if (fail(r)) return
    if (!r.ok) return setNotice({ type: 'error', text: errorText(r, 'admin') })
    setNotice({ type: 'ok', text: `เพิ่มพนักงาน ${r.emp_no} แล้ว` })
    setForm(EMPTY)
  }

  const set = (key) => (e) => setForm({ ...form, [key]: key === 'emp_no' ? e.target.value.toUpperCase() : e.target.value })

  return (
    <div className="space-y-4">
      <form onSubmit={onSearch} className={card}>
        <label htmlFor="adm-q" className="mb-1 block text-sm font-medium text-slate-600">
          ค้นหาพนักงาน (รหัสหรือชื่อ)
        </label>
        <div className="flex gap-2">
          <input
            id="adm-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className={`${inputCls} min-w-0 flex-1`}
          />
          <button type="submit" disabled={busy || !q.trim()} className={`${btnPrimary} flex items-center gap-1.5`}>
            <Search size={16} aria-hidden="true" />
            ค้นหา
          </button>
        </div>
      </form>

      <Notice notice={notice} />

      {rows && rows.length === 0 && (
        <p className={`${card} text-center text-sm text-slate-500`}>ไม่พบ "{searched}"</p>
      )}

      {rows && rows.length > 0 && (
        <ul className="space-y-3">
          {rows.map((r) => {
            const asking = confirm?.empNo === r.emp_no
            return (
              <li key={r.emp_no} className={card}>
                <div className="flex items-center gap-3">
                  <Avatar empNo={r.emp_no} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {r.name_th} {r.surname_th}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {r.dept_code} · {r.emp_no}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {r.registered ? 'ตั้ง PIN แล้ว' : 'ยังไม่ตั้ง PIN'} · ผ่าน {r.passed_count} สถานี · {r.total_points} คะแนน
                    </p>
                  </div>
                </div>

                {asking ? (
                  <div className="mt-3 rounded-xl bg-red-50 p-3 ring-1 ring-red-200">
                    <p className="text-sm font-medium text-red-800">
                      {confirm.action === 'pin'
                        ? `รีเซ็ต PIN ของ ${r.emp_no}?`
                        : `ล้างผลการผ่านและคะแนนทั้งหมดของ ${r.emp_no}?`}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={runAction} disabled={busy} className={btnDanger}>
                        ยืนยัน
                      </button>
                      <button type="button" onClick={() => setConfirm(null)} className={btnGhost}>
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy || !r.registered}
                      onClick={() => setConfirm({ empNo: r.emp_no, action: 'pin' })}
                      aria-label={`รีเซ็ต PIN ${r.emp_no}`}
                      className={btnGhost}
                    >
                      รีเซ็ต PIN
                    </button>
                    <button
                      type="button"
                      disabled={busy || r.passed_count === 0}
                      onClick={() => setConfirm({ empNo: r.emp_no, action: 'results' })}
                      aria-label={`ล้างผลการผ่าน ${r.emp_no}`}
                      className={btnGhost}
                    >
                      ล้างผลการผ่าน
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <section className={card}>
        <button
          type="button"
          aria-expanded={addOpen}
          onClick={() => setAddOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left text-base font-bold"
        >
          เพิ่มพนักงานใหม่
          <ChevronDown size={20} className={`transition ${addOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {addOpen && (
          <form onSubmit={onAdd} className="mt-4 space-y-3">
            <Field id="add-emp" label="รหัสพนักงาน *">
              <input id="add-emp" value={form.emp_no} onChange={set('emp_no')} maxLength={10} autoComplete="off" className={inputCls} />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field id="add-title" label="คำนำหน้า">
                <input id="add-title" value={form.title_th} onChange={set('title_th')} className={inputCls} />
              </Field>
              <div className="col-span-2">
                <Field id="add-name" label="ชื่อ (ไทย) *">
                  <input id="add-name" value={form.name_th} onChange={set('name_th')} className={inputCls} />
                </Field>
              </div>
            </div>
            <Field id="add-surname" label="นามสกุล (ไทย) *">
              <input id="add-surname" value={form.surname_th} onChange={set('surname_th')} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field id="add-name-en" label="Name (EN)">
                <input id="add-name-en" value={form.name_en} onChange={set('name_en')} className={inputCls} />
              </Field>
              <Field id="add-surname-en" label="Surname (EN)">
                <input id="add-surname-en" value={form.surname_en} onChange={set('surname_en')} className={inputCls} />
              </Field>
            </div>
            <Field id="add-dept" label="แผนก">
              <input id="add-dept" value={form.dept_code} onChange={set('dept_code')} className={inputCls} />
            </Field>
            <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
              เพิ่มพนักงาน
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
