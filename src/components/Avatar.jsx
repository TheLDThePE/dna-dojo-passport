import { useState } from 'react'
import { UserRound } from 'lucide-react'
import { photoUrl } from '../lib/supabase'

// รูปพนักงาน (ถ้าไม่มีรูปหรือโหลดไม่ได้ แสดงไอคอนคนแทน)
export default function Avatar({ empNo, size = 64, className = '' }) {
  const [failedFor, setFailedFor] = useState(null)
  const box = { width: size, height: size }

  if (!empNo || failedFor === empNo) {
    return (
      <div
        style={box}
        className={`flex shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-400 ${className}`}
      >
        <UserRound size={Math.round(size * 0.55)} aria-hidden="true" />
      </div>
    )
  }

  return (
    <img
      src={photoUrl(empNo)}
      alt=""
      width={size}
      height={size}
      style={box}
      decoding="async"
      onError={() => setFailedFor(empNo)}
      className={`shrink-0 rounded-full bg-slate-200 object-cover ${className}`}
    />
  )
}
