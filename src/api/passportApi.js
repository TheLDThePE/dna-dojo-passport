// ชั้นเรียก backend ของหน้า Passport
import { rpc } from './rpc'

export const lookupEmployee = (empNo) => rpc('employee_lookup', { p_emp_no: empNo })
export const registerPin = (empNo, pin) => rpc('register_pin', { p_emp_no: empNo, p_pin: pin })
export const loginPassport = (empNo, pin) => rpc('passport_login', { p_emp_no: empNo, p_pin: pin })
