// ส่วนประกอบหน้าตาที่ใช้ร่วมกันในหน้า Admin
export const card = 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200'
export const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30'
export const btnPrimary =
  'rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-40'
export const btnGhost =
  'rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ink ring-1 ring-slate-300 transition active:scale-[0.99] disabled:opacity-40'
export const btnDanger =
  'rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-40'

export function Notice({ notice }) {
  if (!notice) return null
  const ok = notice.type === 'ok'
  return (
    <p
      role={ok ? 'status' : 'alert'}
      className={`rounded-xl px-4 py-3 text-sm font-medium ${
        ok ? 'bg-green-50 text-green-800 ring-1 ring-green-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'
      }`}
    >
      {notice.text}
    </p>
  )
}

export function Field({ id, label, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-600">
        {label}
      </label>
      {children}
    </div>
  )
}
