import { useLayoutEffect, useRef, useState } from 'react'

// [ตัวอักษร, อังกฤษ, ไทย]
const ITEMS = [
  ['L', 'Leadership culture', 'ทำด้วยหัวใจ เป็นเจ้าของร่วมกัน'],
  ['D', 'Different Thinking to create value', 'คิดต่าง สร้างคุณค่า'],
  ['N', 'No. 1 in the world', 'อันดับ 1 ของโลก ด้าน Backlight'],
  ['A', 'Assistance', 'ยื่นมือช่วย ก้าวไปด้วยกัน'],
]

const SPEED = 30 // พิกเซลต่อวินาที (ยิ่งน้อยยิ่งช้า)

function Copy({ innerRef, width, hidden }) {
  return (
    <div className="shrink-0" style={width ? { width } : undefined} aria-hidden={hidden || undefined}>
      <div ref={innerRef} className="flex w-max items-center gap-7 pr-7">
        {ITEMS.map(([letter, en, th]) => (
          <span key={letter} className="inline-flex items-center gap-2">
            <span className="text-2xl font-extrabold leading-none text-rose-500">{letter}</span>
            <span className="flex flex-col">
              <span className="text-[11px] font-semibold leading-snug text-slate-100">{en}</span>
              <span className="text-[10px] leading-snug text-slate-400">{th}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function LdnaMarquee() {
  const innerRef = useRef(null)
  const [w, setW] = useState(0)

  useLayoutEffect(() => {
    const el = innerRef.current
    if (!el) return
    const measure = () => setW(Math.ceil(el.getBoundingClientRect().width))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
      <div
        className={`flex w-max items-center whitespace-nowrap will-change-transform ${
          w ? 'animate-ldna-marquee' : ''
        }`}
        style={w ? { '--marquee-shift': `${w}px`, '--marquee-duration': `${w / SPEED}s` } : undefined}
      >
        <Copy innerRef={innerRef} width={w} />
        <Copy width={w} hidden />
      </div>
    </div>
  )
}
