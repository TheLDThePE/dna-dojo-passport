// แปลงรหัส error จาก backend เป็นข้อความภาษาไทยสำหรับผู้ใช้
// who = 'passport' (พนักงานใส่ PIN) หรือ 'trainer' (เทรนเนอร์ใส่รหัสผ่าน)
export function errorText(r, who = 'passport') {
  const trainer = who === 'trainer'
  switch (r?.error) {
    case 'INVALID_CREDENTIALS':
      if (r.attempts_left != null) {
        return trainer
          ? `รหัสผ่านไม่ถูกต้อง เหลืออีก ${r.attempts_left} ครั้ง`
          : `PIN ไม่ถูกต้อง เหลืออีก ${r.attempts_left} ครั้ง`
      }
      return trainer
        ? 'รหัสเทรนเนอร์หรือรหัสผ่านไม่ถูกต้อง หรือไม่ได้ดูแลสถานีนี้'
        : 'รหัสพนักงานหรือ PIN ไม่ถูกต้อง'
    case 'LOCKED':
      return `ใส่ผิดหลายครั้ง ลองใหม่ในอีก ${Math.max(1, Math.ceil((r.retry_after_seconds || 0) / 60))} นาที`
    case 'NETWORK':
      return 'เชื่อมต่อไม่ได้ ตรวจสัญญาณอินเทอร์เน็ตแล้วลองอีกครั้ง'
    case 'NOT_FOUND':
      return 'ไม่พบรหัสพนักงานนี้ ตรวจรหัสแล้วลองอีกครั้ง'
    case 'ALREADY_REGISTERED':
      return 'รหัสนี้ตั้ง PIN ไปแล้ว ให้ใส่ PIN เดิม'
    case 'BAD_PIN_FORMAT':
      return 'PIN ต้องเป็นตัวเลข 6 หลัก'
    case 'ALREADY_PASSED':
      return 'พนักงานคนนี้ผ่านสถานีนี้ไปแล้ว'
    case 'BAD_BONUS':
      return 'คะแนนเพิ่มไม่ถูกต้อง'
    default:
      return 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง'
  }
}
