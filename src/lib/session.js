// EmpNo จำไว้ในเครื่อง (สะดวกตอนเปิดใหม่) ส่วน PIN เก็บเฉพาะช่วงที่เปิดแท็บอยู่ (sessionStorage)
const EMP_KEY = 'ldna.empNo'
const PIN_KEY = 'ldna.pin'

export function loadSession() {
  try {
    return {
      empNo: localStorage.getItem(EMP_KEY) || '',
      pin: sessionStorage.getItem(PIN_KEY) || '',
    }
  } catch {
    return { empNo: '', pin: '' }
  }
}

export function saveSession(empNo, pin) {
  try {
    localStorage.setItem(EMP_KEY, empNo)
    sessionStorage.setItem(PIN_KEY, pin)
  } catch {
    /* เบราว์เซอร์ปิดการเก็บข้อมูล: ข้ามได้ */
  }
}

// ออกจากระบบ: ลบทั้งรหัสพนักงานและ PIN (เผื่อใช้มือถือร่วมกัน)
export function clearSession() {
  try {
    localStorage.removeItem(EMP_KEY)
    sessionStorage.removeItem(PIN_KEY)
  } catch {
    /* ข้ามได้ */
  }
}
