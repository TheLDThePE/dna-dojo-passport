import { useEffect, useEffectEvent, useId, useRef } from 'react'

// หน้าต่างแจ้งเตือน/ยืนยันแบบเลื่อนขึ้นจากล่างจอ (กด Esc หรือแตะข้างนอกเพื่อปิด; busy = กำลังทำงาน ปิดไม่ได้)
export default function Modal({ title, onClose, busy = false, children }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const close = useEffectEvent(() => {
    if (!busy) onClose()
  })

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50"
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="max-h-dvh w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl outline-none"
      >
        <h3 id={titleId} className="text-lg font-bold">
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
}
