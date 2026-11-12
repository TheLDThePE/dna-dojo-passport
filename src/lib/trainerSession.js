// เก็บสถานะของเทรนเนอร์ที่หน้า Player ใช้ (ใช้คีย์เดียวกับหน้า Trainer จึงล็อกอินครั้งเดียวใช้ได้ทั้งสองหน้า)
//  - creds   (sessionStorage) : สถานี + รหัสเทรนเนอร์ + รหัสผ่าน อยู่เฉพาะช่วงที่เปิดแท็บ
//  - form    (localStorage)   : จำสถานีและรหัสเทรนเนอร์ล่าสุด ไม่เก็บรหัสผ่าน
//  - pending (sessionStorage) : รายชื่อที่สแกนแล้วแต่ยังไม่ได้ Submit กันหายตอนสลับไปหน้าอื่นหรือรีเฟรช
const CREDS_KEY = 'ldna.trainer.creds'
const FORM_KEY = 'ldna.trainer.form'
const PENDING_KEY = 'ldna.player.pending'

function read(store, key) {
  try {
    return JSON.parse(store.getItem(key) || 'null')
  } catch {
    return null
  }
}

function write(store, key, value) {
  try {
    if (value === null) store.removeItem(key)
    else store.setItem(key, JSON.stringify(value))
  } catch {
    /* เบราว์เซอร์ปิดการเก็บข้อมูล: ข้ามได้ */
  }
}

export const loadCreds = () => {
  const c = read(sessionStorage, CREDS_KEY)
  return c?.trainer && c?.password && c?.station ? c : null
}
export const saveCreds = (creds) => write(sessionStorage, CREDS_KEY, creds)
export const clearCreds = () => write(sessionStorage, CREDS_KEY, null)

export const loadForm = () => read(localStorage, FORM_KEY) || {}
export const saveForm = (form) => write(localStorage, FORM_KEY, form)

// รายชื่อที่ค้างอยู่ใช้ได้เฉพาะเมื่อเป็นเทรนเนอร์คนเดิมและสถานีเดิม
export function loadPending(creds) {
  const p = read(sessionStorage, PENDING_KEY)
  if (!p || p.trainer !== creds.trainer || p.station !== creds.station) return []
  return Array.isArray(p.players) ? p.players : []
}

export function savePending(creds, players) {
  write(
    sessionStorage,
    PENDING_KEY,
    players.length ? { trainer: creds.trainer, station: creds.station, players } : null,
  )
}

export const clearPending = () => write(sessionStorage, PENDING_KEY, null)
