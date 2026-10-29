// สร้างและดาวน์โหลดไฟล์ CSV / Excel จากข้อมูลของ admin_export_matrix
// รูปแบบ: 1 แถวต่อพนักงาน, แต่ละสถานีมี 2 คอลัมน์ (ผ่านเมื่อ, คะแนนเพิ่ม), เวลาเป็นเวลาไทย (ข้อความ yyyy-mm-dd hh:mm)

const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

function parts(date) {
  return Object.fromEntries(clock.formatToParts(date).map((p) => [p.type, p.value]))
}

export function bangkokText(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = parts(d)
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`
}

export function stampName(prefix, now = new Date()) {
  const p = parts(now)
  return `${prefix}-${p.year}${p.month}${p.day}-${p.hour}${p.minute}`
}

export function buildMatrix(data, { onlyPassed = false } = {}) {
  const stations = data?.stations ?? []
  const header = [
    'EmpNo', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'Name (EN)', 'Surname (EN)',
    'แผนก', 'กลุ่ม', 'โซน', 'SubProcess', 'ตั้ง PIN ครั้งแรก',
  ]
  for (const s of stations) header.push(`${s.code} ผ่านเมื่อ`, `${s.code} คะแนนเพิ่ม`)
  header.push('คะแนนรวม', 'ผ่านกี่สถานี', 'ผ่านล่าสุด')

  const rows = (data?.rows ?? [])
    .filter((r) => !onlyPassed || r.passed_count > 0)
    .map((r) => {
      const row = [
        r.emp_no, r.title_th ?? '', r.name_th ?? '', r.surname_th ?? '',
        r.name_en ?? '', r.surname_en ?? '', r.dept_code ?? '', r.group_code ?? '',
        r.zone_code ?? '', r.sub_process ?? '', bangkokText(r.registered_at),
      ]
      for (const s of stations) {
        const c = r.stations?.[s.code]
        row.push(c ? bangkokText(c.passed_at) : '', c ? c.bonus_points : '')
      }
      row.push(r.total_points ?? 0, r.passed_count ?? 0, bangkokText(r.last_passed_at))
      return row
    })
  return { header, rows }
}

// ป้องกัน "CSV injection": ข้อความที่ขึ้นต้นด้วย = + - @ จะถูก Excel มองเป็นสูตร
const guard = (v) => (typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? `'${v}` : v)
const esc = (v) => {
  const s = v == null ? '' : String(guard(v))
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// มี BOM (\ufeff) เพื่อให้ Excel อ่านภาษาไทยถูกต้อง
export function toCsv({ header, rows }) {
  return '\ufeff' + [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n'
}

export function toSheetData({ header, rows }) {
  return [
    header.map((h) => ({ value: h, fontWeight: 'bold' })),
    ...rows.map((r) => r.map((v) => (v === '' || v == null ? null : v))),
  ]
}

export function columnWidths({ header }) {
  return header.map((h, i) => ({ width: i === 0 ? 10 : String(h).includes('เมื่อ') || String(h).includes('ล่าสุด') || String(h).includes('PIN') ? 17 : 14 }))
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportCsv(matrix, name) {
  downloadBlob(new Blob([toCsv(matrix)], { type: 'text/csv;charset=utf-8' }), `${name}.csv`)
}

// โหลดไลบรารี Excel เฉพาะตอนกดดาวน์โหลด (ไม่ทำให้หน้าเว็บส่วนอื่นหนักขึ้น)
export async function exportXlsx(matrix, name) {
  const { default: writeExcelFile } = await import('write-excel-file/browser')
  const blob = await writeExcelFile(toSheetData(matrix), {
    columns: columnWidths(matrix),
    stickyRowsCount: 1,
  }).toBlob()
  downloadBlob(blob, `${name}.xlsx`)
}
