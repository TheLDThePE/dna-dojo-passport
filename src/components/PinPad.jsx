import { useCallback, useEffect } from 'react'
import { Delete } from 'lucide-react'

// แป้นตัวเลขสำหรับใส่ PIN (ควบคุมค่าจากหน้าที่เรียกใช้ผ่าน value/onChange)
export default function PinPad({ value, onChange, length = 6, disabled = false }) {
  const press = useCallback(
    (d) => {
      if (!disabled && value.length < length) onChange(value + d)
    },
    [disabled, value, length, onChange]
  )

  const back = useCallback(() => {
    if (!disabled) onChange(value.slice(0, -1))
  }, [disabled, value, onChange])

  // รองรับคีย์บอร์ดจริงตอนใช้บนคอมพิวเตอร์
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (/^[0-9]$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press, back])

  const key =
    'flex h-14 items-center justify-center rounded-full bg-white text-xl font-semibold text-ink shadow-sm ring-1 ring-slate-200 transition active:scale-95 active:bg-slate-100 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'

  return (
    <div>
      <div
        className="flex justify-center gap-3"
        role="img"
        aria-label={`ใส่แล้ว ${value.length} จาก ${length} หลัก`}
      >
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full border-2 transition ${
              i < value.length ? 'border-ink bg-ink' : 'border-slate-300'
            }`}
          />
        ))}
      </div>

      <div className="mx-auto mt-7 grid max-w-[17rem] grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" className={key} disabled={disabled} onClick={() => press(d)}>
            {d}
          </button>
        ))}
        <span aria-hidden="true" />
        <button type="button" className={key} disabled={disabled} onClick={() => press('0')}>
          0
        </button>
        <button type="button" className={key} disabled={disabled} onClick={back} aria-label="ลบหลักสุดท้าย">
          <Delete size={22} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
