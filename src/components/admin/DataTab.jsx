import { useState } from 'react'
import { Download } from 'lucide-react'
import { adminChangePassword, adminExportMatrix, adminResetResults } from '../../api/adminApi'
import { errorText } from '../../lib/errorText'
import { buildMatrix, exportCsv, exportXlsx, stampName } from '../../lib/exportFile'
import { btnDanger, btnGhost, btnPrimary, card, Field, inputCls, Notice } from './ui'

export default function DataTab({ pw, fail, onPasswordChanged }) {
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState('') // '' | 'xlsx' | 'csv' | 'reset' | 'pw'
  const [onlyPassed, setOnlyPassed] = useState(false)
  const [phrase, setPhrase] = useState('')
  const [clearPins, setClearPins] = useState(false)
  const [pwForm, setPwForm] = useState({ next: '', again: '' })

  async function download(kind) {
    setBusy(kind)
    setNotice(null)
    const r = await adminExportMatrix(pw)
    if (fail(r)) return setBusy('')
    if (!r.ok) {
      setBusy('')
      return setNotice({ type: 'error', text: errorText(r, 'admin') })
    }
    try {
      const matrix = buildMatrix(r, { onlyPassed })
      const name = stampName('ldna-passport')
      if (kind === 'csv') exportCsv(matrix, name)
      else await exportXlsx(matrix, name)
      setNotice({ type: 'ok', text: `ดาวน์โหลดแล้ว: ${name}.${kind} (${matrix.rows.length} แถว)` })
    } catch {
      setNotice({
        type: 'error',
        text: kind === 'xlsx' ? 'สร้างไฟล์ Excel ไม่สำเร็จ ลองดาวน์โหลดแบบ CSV แทน (เปิดด้วย Excel ได้)' : 'สร้างไฟล์ไม่สำเร็จ ลองใหม่อีกครั้ง',
      })
    }
    setBusy('')
  }

  async function resetAll(e) {
    e.preventDefault()
    setBusy('reset')
    setNotice(null)
    const r = await adminResetResults(pw, { confirm: 'RESET ALL', clearPins })
    setBusy('')
    if (fail(r)) return
    if (!r.ok) return setNotice({ type: 'error', text: errorText(r, 'admin') })
    setPhrase('')
    setNotice({
      type: 'ok',
      text: `ล้างผลการผ่านแล้ว ${r.completions_deleted} รายการ${clearPins ? ` และล้าง PIN ${r.pins_cleared} คน` : ''}`,
    })
  }

  async function changePassword(e) {
    e.preventDefault()
    setNotice(null)
    if (pwForm.next.length < 8) return setNotice({ type: 'error', text: 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร' })
    if (pwForm.next !== pwForm.again) return setNotice({ type: 'error', text: 'รหัสผ่านใหม่สองช่องไม่ตรงกัน' })
    setBusy('pw')
    const r = await adminChangePassword(pw, pwForm.next)
    setBusy('')
    if (fail(r)) return
    if (!r.ok) {
      return setNotice({ type: 'error', text: r.error === 'BAD_PASSWORD' ? 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร' : errorText(r, 'admin') })
    }
    onPasswordChanged(pwForm.next)
    setPwForm({ next: '', again: '' })
    setNotice({ type: 'ok', text: 'เปลี่ยนรหัสผ่าน Admin แล้ว' })
  }

  return (
    <div className="space-y-4">
      <Notice notice={notice} />

      <section className={`${card} space-y-3`}>
        <h3 className="text-base font-bold">ส่งออกข้อมูล</h3>
        <p className="text-sm text-slate-500">
          1 แถวต่อพนักงาน มีวันเวลาที่ผ่านและคะแนนเพิ่มของแต่ละสถานี (เวลาไทย)
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyPassed} onChange={(e) => setOnlyPassed(e.target.checked)} className="h-4 w-4" />
          เฉพาะคนที่ผ่านอย่างน้อย 1 สถานี
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!!busy} onClick={() => download('xlsx')} className={`${btnPrimary} flex items-center gap-1.5`}>
            <Download size={16} aria-hidden="true" />
            {busy === 'xlsx' ? 'กำลังเตรียมไฟล์…' : 'ดาวน์โหลด Excel (.xlsx)'}
          </button>
          <button type="button" disabled={!!busy} onClick={() => download('csv')} className={`${btnGhost} flex items-center gap-1.5`}>
            <Download size={16} aria-hidden="true" />
            {busy === 'csv' ? 'กำลังเตรียมไฟล์…' : 'ดาวน์โหลด CSV'}
          </button>
        </div>
      </section>

      <form onSubmit={changePassword} className={`${card} space-y-3`}>
        <h3 className="text-base font-bold">เปลี่ยนรหัสผ่าน Admin</h3>
        <Field id="pw-new" label="รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)">
          <input id="pw-new" type="password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} autoComplete="new-password" className={inputCls} />
        </Field>
        <Field id="pw-again" label="ใส่รหัสผ่านใหม่อีกครั้ง">
          <input id="pw-again" type="password" value={pwForm.again} onChange={(e) => setPwForm({ ...pwForm, again: e.target.value })} autoComplete="new-password" className={inputCls} />
        </Field>
        <button type="submit" disabled={!!busy || !pwForm.next} className={`${btnPrimary} w-full`}>
          เปลี่ยนรหัสผ่าน
        </button>
      </form>

      <form onSubmit={resetAll} className="space-y-3 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
        <h3 className="text-base font-bold text-red-800">ล้างผลการผ่านของทุกคน</h3>
        <p className="text-sm text-red-800">
          ใช้เมื่อจบช่วงทดสอบแอป และจะเริ่มใช้งานจริง ลบผลการผ่านและคะแนนทั้งหมด กู้คืนไม่ได้ แนะนำให้ดาวน์โหลดข้อมูลสำรองก่อน
        </p>
        <label className="flex items-center gap-2 text-sm text-red-900">
          <input type="checkbox" checked={clearPins} onChange={(e) => setClearPins(e.target.checked)} className="h-4 w-4" />
          ล้าง PIN และเวลาตั้ง PIN ของทุกคนด้วย (ทุกคนต้องตั้ง PIN ใหม่)
        </label>
        <Field id="reset-phrase" label="พิมพ์ RESET ALL เพื่อยืนยัน">
          <input id="reset-phrase" value={phrase} onChange={(e) => setPhrase(e.target.value)} autoComplete="off" spellCheck={false} className={inputCls} />
        </Field>
        <button type="submit" disabled={!!busy || phrase !== 'RESET ALL'} className={`${btnDanger} w-full`}>
          {busy === 'reset' ? 'กำลังล้าง…' : 'ล้างผลการผ่านทั้งหมด'}
        </button>
      </form>
    </div>
  )
}
