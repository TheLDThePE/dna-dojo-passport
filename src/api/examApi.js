// ชั้นเรียก backend ของหน้าข้อสอบ (supabase/10_exam.sql)  ใช้ EmpNo + PIN ของพนักงานเอง
import { rpc } from './rpc'

// ดึงข้อสอบของสถานี (ไม่มีเฉลย) หรือถ้าเคยทำแล้วคืนคะแนนเดิม
// สำเร็จ: { ok, taken:false, station:{code,name}, total, questions:[{ q_no, text, image, options:[{letter,text,image}] }] }
//     หรือ { ok, taken:true, score, total }
// ไม่สำเร็จ: NOT_PASSED / NO_EXAM / BAD_STATION / INVALID_CREDENTIALS / LOCKED / NOT_REGISTERED / NETWORK
export const getExam = (empNo, pin, station) =>
  rpc('exam_get', { p_emp_no: empNo, p_pin: pin, p_station: station })

// ส่งคำตอบ answers = { "1": "A", "2": "C", ... } ต้องตอบครบทุกข้อ  สำเร็จ: { ok, score, total }
// ไม่สำเร็จ: ALREADY_TAKEN (+score,total) / BAD_ANSWERS / NOT_PASSED / ...
export const submitExam = (empNo, pin, station, answers) =>
  rpc('exam_submit', { p_emp_no: empNo, p_pin: pin, p_station: station, p_answers: answers })
