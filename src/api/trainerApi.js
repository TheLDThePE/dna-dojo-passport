// ชั้นเรียก backend ของหน้า Trainer และหน้า Player  creds = { trainer, password, station }
import { rpc } from './rpc'

export const trainerCheck = (trainer, password, station) =>
  rpc('trainer_check', { p_trainer_emp: trainer, p_password: password, p_station: station })

export const findEmployee = (c, target) =>
  rpc('trainer_find_employee', {
    p_trainer_emp: c.trainer, p_password: c.password, p_station: c.station, p_target_emp: target,
  })

export const grantPass = (c, target, bonus) =>
  rpc('trainer_grant_pass', {
    p_trainer_emp: c.trainer, p_password: c.password, p_station: c.station,
    p_target_emp: target, p_bonus: bonus,
  })

// ---- หน้า Player (supabase/08_trainer_scan.sql) ----

// ค้นพนักงานจากเลขบัตร (หน้าเว็บอ่าน card_no ตรงไม่ได้ ต้องผ่านฟังก์ชันนี้)
export const findByCard = (c, cardNo) =>
  rpc('trainer_find_by_card', {
    p_trainer_emp: c.trainer, p_password: c.password, p_station: c.station, p_card_no: cardNo,
  })

// ให้ผ่านหลายคนในครั้งเดียว  items = [{ emp_no, bonus }]  (bonus = 0 หรือ max_bonus)
// สำเร็จ: { ok, granted, failed, results: [{ emp_no, ok, bonus_points | error }] }
export const grantPassBatch = (c, items) =>
  rpc('trainer_grant_pass_batch', {
    p_trainer_emp: c.trainer, p_password: c.password, p_station: c.station, p_items: items,
  })
