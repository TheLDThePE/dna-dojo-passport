// ชั้นเรียก backend ของหน้า Passport
import { rpc } from './rpc'

export const lookupEmployee = (empNo) => rpc('employee_lookup', { p_emp_no: empNo })
export const registerPin = (empNo, pin) => rpc('register_pin', { p_emp_no: empNo, p_pin: pin })
export const loginPassport = (empNo, pin) => rpc('passport_login', { p_emp_no: empNo, p_pin: pin })

// Restart: ล้างผลการผ่าน/คะแนนของตัวเอง (supabase/09_restart_rank.sql)
// สำเร็จ: ข้อมูล Passport ใหม่ (เหมือน loginPassport) + { restarted: true, archived_points }
// ไม่สำเร็จ: INVALID_CREDENTIALS / LOCKED / NOT_ALL_PASSED (+passed_count, total)
export const restartPassport = (empNo, pin) => rpc('passport_restart', { p_emp_no: empNo, p_pin: pin })
