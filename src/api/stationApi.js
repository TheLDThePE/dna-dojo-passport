// รายชื่อสถานี (อ่านตรงจากตาราง stations ได้ เพราะเปิด policy ไว้ให้อ่านอย่างเดียว)
import { supabase } from '../lib/supabase'

export async function listStations() {
  try {
    const { data, error } = await supabase
      .from('stations')
      .select('code,name,sort_order,max_bonus')
      .order('sort_order')
    if (error || !data) return { ok: false, error: 'NETWORK' }
    return { ok: true, stations: data }
  } catch {
    return { ok: false, error: 'NETWORK' }
  }
}
