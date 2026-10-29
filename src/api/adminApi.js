// ชั้นเรียก backend ของหน้า Admin  (pw = รหัสผ่าน Admin ที่ส่งไปตรวจทุกครั้ง)
import { rpc } from './rpc'

export const adminLogin = (pw) => rpc('admin_login', { p_password: pw })
export const adminChangePassword = (pw, next) =>
  rpc('admin_change_password', { p_password: pw, p_new: next })

export const adminFindEmployee = (pw, q) => rpc('admin_find_employee', { p_password: pw, p_q: q })
export const adminAddEmployee = (pw, data) => rpc('admin_add_employee', { p_password: pw, p_data: data })
export const adminResetPin = (pw, empNo) => rpc('admin_reset_pin', { p_password: pw, p_emp_no: empNo })

// empNo = null -> ล้างทั้งหมด (ต้องส่ง confirm = 'RESET ALL')
export const adminResetResults = (pw, { empNo = null, confirm = null, clearPins = false } = {}) =>
  rpc('admin_reset_results', { p_password: pw, p_emp_no: empNo, p_confirm: confirm, p_clear_pins: clearPins })

export const adminListTrainers = (pw) => rpc('admin_list_trainers', { p_password: pw })
export const adminSetTrainer = (pw, empNo, station, trainerPassword) =>
  rpc('admin_set_trainer', { p_password: pw, p_emp_no: empNo, p_station: station, p_trainer_password: trainerPassword })
export const adminRemoveTrainer = (pw, empNo, station) =>
  rpc('admin_remove_trainer', { p_password: pw, p_emp_no: empNo, p_station: station })

export const adminExportMatrix = (pw) => rpc('admin_export_matrix', { p_password: pw })
