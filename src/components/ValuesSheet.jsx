import { useEffect } from 'react'
import { X } from 'lucide-react'

const VALUES = [
  { letter: 'L', en: 'Leadership culture', th: 'ไม่ได้ทำแค่ตามหน้าที่ แต่ทำด้วยหัวใจที่รู้สึกเป็นเจ้าของร่วมกัน' },
  { letter: 'D', en: 'Different Thinking to create value', th: 'คิดต่าง สร้างคุณค่า' },
  { letter: 'N', en: 'No. 1 in the world', th: 'อันดับ 1 ของโลก ด้านการประกอบ Backlight' },
  { letter: 'A', en: 'Assistance', th: 'ยื่นมือช่วยเหลือ ร่วมมือแก้ปัญหา ก้าวหน้าไปด้วยกัน' },
]

export default function ValuesSheet({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="LDNA Values"
    >
      <div className="flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-ink p-4 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Our values</p>
            <h3 className="text-lg font-extrabold tracking-wider">
              LDN<span className="text-rose-500">A</span>
            </h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="px-2 text-slate-300 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <ul className="space-y-2.5 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {VALUES.map(({ letter, en, th }) => (
            <li key={letter} className="flex items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ink text-2xl font-extrabold text-rose-500">
                {letter}
              </span>
              <div className="min-w-0">
                <h4 className="text-sm font-bold leading-snug text-slate-900">{en}</h4>
                <p className="mt-0.5 text-[13px] leading-snug text-slate-600">{th}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
