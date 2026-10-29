// ชั้นเรียก backend ของหน้า Trainer  creds = { trainer, password, station }
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
