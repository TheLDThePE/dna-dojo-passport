// แปลงรหัส error จาก backend เป็นข้อความภาษาไทยสำหรับผู้ใช้
// who = 'passport' (พนักงานใส่ PIN) | 'trainer' (เทรนเนอร์ใส่รหัสผ่าน) | 'admin'
export function errorText(r, who = 'passport') {
  const trainer = who === 'trainer'
  switch (r?.error) {
    case 'INVALID_CREDENTIALS':
      if (who === 'admin') {
        return r.attempts_left != null
          ? `รหัสผ่าน Admin ไม่ถูกต้อง เหลืออีก ${r.attempts_left} ครั้ง`
          : 'รหัสผ่าน Admin ไม่ถูกต้อง'
      }
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
    case 'NOT_PASSED':
      return 'ยังไม่ผ่านสถานีนี้ ไปให้เทรนเนอร์ประจำสถานีกดผ่านก่อน'
    case 'NO_EXAM':
      return 'ข้อสอบสถานีนี้ยังไม่เปิดให้ทำ'
    case 'ALREADY_TAKEN':
      return 'สถานีนี้ทำข้อสอบไปแล้ว (ทำได้ครั้งเดียว)'
    case 'BAD_ANSWERS':
      return 'ตอบไม่ครบหรือรูปแบบไม่ถูกต้อง ตรวจคำตอบแล้วลองอีกครั้ง'
    case 'NOT_REGISTERED':
      return 'ยังไม่ได้ตั้ง PIN ให้ตั้ง PIN ที่หน้า Passport ก่อน'
    case 'NOT_ALL_PASSED':
      return 'ต้องผ่านครบทุกสถานีก่อนจึงจะ Restart ได้'
    case 'BAD_CARD':
      return 'อ่านเลขบัตรไม่ได้ ลองสแกนอีกครั้ง'
    case 'BAD_ITEMS':
      return 'ส่งผลไม่ได้ รายการไม่ถูกต้อง (ส่งได้สูงสุด 200 คนต่อครั้ง)'
    case 'ADMIN_NOT_SET':
      return 'ยังไม่ได้ตั้งรหัสผ่าน Admin (ตั้งครั้งแรกด้วย admin_init ใน SQL Editor)'
    case 'MISSING_FIELDS':
      return 'กรอกรหัสพนักงาน ชื่อ และนามสกุลให้ครบ'
    case 'ALREADY_EXISTS':
      return 'รหัสพนักงานนี้มีอยู่แล้ว'
    case 'BAD_STATION':
      return 'ไม่พบสถานีนี้'
    case 'CONFIRM_REQUIRED':
      return 'ต้องพิมพ์คำยืนยันให้ถูกต้องก่อน'
    default:
      return 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง'
  }
}
