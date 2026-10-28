// หน้าที่ยังไม่ได้ทำ (จะแทนที่ในขั้นถัดไป)
export default function ComingSoon({ title, children }) {
  return (
    <div className="p-5">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{children}</p>
      </div>
    </div>
  )
}
