import { Check, Lock } from 'lucide-react'

// แผนที่สถานีแบบซิกแซก 2 คอลัมน์ (คนสุดท้ายถ้าเหลือคนเดียวอยู่กลาง) เส้นประเชื่อมตามลำดับ
const W = 320
const X_LEFT = 80
const X_RIGHT = 240
const X_MID = 160
const Y0 = 58
const Y_STEP = 160

function layout(n) {
  return Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / 2)
    const alone = i === n - 1 && n % 2 === 1
    const x = alone ? X_MID : i % 2 === 0 ? X_LEFT : X_RIGHT
    return { x, y: Y0 + row * Y_STEP }
  })
}

function pathFor(points) {
  return points
    .map((p, i) => {
      if (i === 0) return `M${p.x},${p.y}`
      const a = points[i - 1]
      if (a.y === p.y) return `L${p.x},${p.y}`
      const mid = (a.y + p.y) / 2
      return `C${a.x},${mid} ${p.x},${mid} ${p.x},${p.y}`
    })
    .join(' ')
}

const shortDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : ''

export default function StationMap({ stations }) {
  const pts = layout(stations.length)
  const H = (pts.length ? pts[pts.length - 1].y : 0) + 100

  return (
    <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={pathFor(pts)}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="3"
          strokeDasharray="2 9"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <ol className="absolute inset-0 m-0 list-none p-0">
        {stations.map((s, i) => (
          <li
            key={s.code}
            className="absolute w-32 -translate-x-1/2 -translate-y-9 text-center"
            style={{ left: `${(pts[i].x / W) * 100}%`, top: `${(pts[i].y / H) * 100}%` }}
            aria-label={`${s.code} ${s.name}: ${s.passed ? 'ผ่านแล้ว' : 'ยังไม่ผ่าน'}`}
          >
            <div className="relative mx-auto h-[72px] w-[72px]">
              <div
                className={`flex h-full w-full items-center justify-center rounded-full ring-4 transition ${
                  s.passed
                    ? 'bg-pass text-white ring-pass/25'
                    : 'border-2 border-slate-300 bg-slate-200 text-slate-400 ring-white'
                }`}
              >
                {s.passed ? <Check size={34} strokeWidth={3} aria-hidden="true" /> : <Lock size={28} aria-hidden="true" />}
              </div>
              {s.bonus_points > 0 && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-2 py-0.5 text-[11px] font-bold text-ink shadow-sm">
                  +{s.bonus_points} คะแนน
                </span>
              )}
            </div>
            <p className="mt-2 text-[13px] font-semibold leading-tight text-ink">{s.code}</p>
            <p className="mt-0.5 text-xs leading-snug text-slate-500">{s.name}</p>
            {s.passed && s.passed_at && (
              <p className="mt-0.5 text-xs font-medium text-pass">ผ่านเมื่อ {shortDate(s.passed_at)}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
