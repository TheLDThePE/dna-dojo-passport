// ชั้นเรียก backend ของหน้า Rank (เปิดดูได้โดยไม่ต้อง login)
import { rpc } from './rpc'

// sort: 'points' | 'speed'   search: รหัสพนักงานหรือชื่อ (ว่างได้)   limit: 1-500
export const getRank = ({ sort = 'points', search = '', limit = 100 } = {}) =>
  rpc('get_rank', { p_sort: sort, p_search: search || null, p_limit: limit })
