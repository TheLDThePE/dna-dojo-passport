// แปลงวินาทีเป็นข้อความไทย เช่น "5 ชม. 30 นาที", "2 วัน 3 ชม."
export function formatDuration(sec) {
  if (sec == null || Number.isNaN(Number(sec))) return '-'
  const s = Math.max(0, Math.floor(Number(sec)))
  if (s < 60) return 'ไม่ถึง 1 นาที'
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const mins = Math.floor((s % 3600) / 60)
  if (days > 0) return hours ? `${days} วัน ${hours} ชม.` : `${days} วัน`
  if (hours > 0) return mins ? `${hours} ชม. ${mins} นาที` : `${hours} ชม.`
  return `${mins} นาที`
}
