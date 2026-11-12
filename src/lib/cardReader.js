// รับค่าจากเครื่องอ่านบัตร RFID แบบจำลองคีย์บอร์ด (เช่น R80CP)
//
// เครื่องอ่านพิมพ์เลขบัตรเข้ามาเหมือนคีย์บอร์ดเร็วๆ แล้ว "ไม่ส่ง Enter" ตอนจบ
// จึงตัดสินว่าสแกนจบเมื่อ  (1) ได้ครบ 10 หลัก  หรือ  (2) ตัวเลขหยุดมา IDLE_MS มิลลิวินาที
// ดักที่ระดับหน้าต่าง (window) ไม่ต้องโฟกัสช่องข้อความ และจะไม่ดักเมื่อกำลังพิมพ์ในช่องกรอก
import { useEffect, useEffectEvent } from 'react'

export const CARD_LENGTH = 10 // เลขบัตรครบ 10 หลัก (บัตรที่ได้ 9 หลักจะเติม 0 นำหน้า)
export const MIN_DIGITS = 6 // สั้นกว่านี้ถือเป็นการกดแป้นเฉยๆ ไม่ใช่การสแกน
export const IDLE_MS = 150 // ปรับได้ถ้าเครื่องอ่านรุ่นนี้ส่งตัวเลขช้า

// เติม 0 นำหน้าให้ครบ 10 หลัก; ไม่ใช่ตัวเลข/ว่าง/เกิน 10 หลัก คืน null
export function normalizeCard(raw) {
  const s = String(raw ?? '').trim()
  if (!/^[0-9]{1,10}$/.test(s)) return null
  return s.padStart(CARD_LENGTH, '0')
}

// อ่านตัวเลขจากคีย์ที่กด โดยดู e.code เป็นหลักสำรอง เพราะถ้าเครื่องเปิดแป้นพิมพ์ภาษาไทย
// แถวตัวเลขจะให้ตัวอักษรไทยใน e.key แต่ e.code ยังเป็น Digit1..Digit0 เสมอ
function digitOf(e) {
  if (typeof e.key === 'string' && /^[0-9]$/.test(e.key)) return e.key
  const m = /^(?:Digit|Numpad)([0-9])$/.exec(e.code || '')
  return m ? m[1] : null
}

const TEXT_INPUT_TYPES = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'file', 'image', 'color'])

// กำลังพิมพ์ในช่องกรอกอยู่หรือเปล่า (ถ้าใช่ ปล่อยให้ตัวเลขเข้าช่องนั้นตามปกติ)
function isTextEntry(el) {
  if (!el || !el.tagName) return false
  const tag = el.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag === 'INPUT') return !TEXT_INPUT_TYPES.has((el.type || 'text').toLowerCase())
  return el.isContentEditable === true
}

const IGNORED_KEYS = new Set(['Shift', 'CapsLock', 'NumLock', 'Control', 'Alt', 'Meta'])

// enabled = true เฉพาะตอนที่พร้อมรับสแกน; onScan(เลข) ถูกเรียกหนึ่งครั้งต่อการสแกนหนึ่งใบ
export function useCardReader({ enabled, onScan }) {
  const handleScan = useEffectEvent(onScan)

  useEffect(() => {
    if (!enabled) return undefined
    let buffer = ''
    let timer = null

    const reset = () => {
      buffer = ''
      clearTimeout(timer)
      timer = null
    }
    const flush = () => {
      const value = buffer
      reset()
      if (value.length >= MIN_DIGITS) handleScan(value)
    }

    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTextEntry(e.target)) return reset()
      const d = digitOf(e)
      if (d !== null) {
        buffer += d
        clearTimeout(timer)
        if (buffer.length >= CARD_LENGTH) flush()
        else timer = setTimeout(flush, IDLE_MS)
        return undefined
      }
      if (e.key === 'Enter') return flush() // เผื่อเครื่องอ่านที่ตั้งให้ส่ง Enter
      if (IGNORED_KEYS.has(e.key)) return undefined
      return reset()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      clearTimeout(timer)
    }
  }, [enabled])
}
