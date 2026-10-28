// ชั้นเรียก backend ของหน้า Passport (ทุกฟังก์ชันอยู่ใน supabase/02_functions.sql)
// คืนค่ารูปแบบเดียวกันเสมอ: { ok: true, ... } หรือ { ok: false, error: 'CODE', ... }
import { supabase } from '../lib/supabase'

async function call(fn, args) {
  try {
    const { data, error } = await supabase.rpc(fn, args)
    if (error || !data) return { ok: false, error: 'NETWORK', message: error?.message }
    return data
  } catch (e) {
    return { ok: false, error: 'NETWORK', message: String(e) }
  }
}

export const lookupEmployee = (empNo) => call('employee_lookup', { p_emp_no: empNo })
export const registerPin = (empNo, pin) => call('register_pin', { p_emp_no: empNo, p_pin: pin })
export const loginPassport = (empNo, pin) => call('passport_login', { p_emp_no: empNo, p_pin: pin })
