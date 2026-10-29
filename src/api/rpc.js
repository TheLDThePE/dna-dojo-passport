// เรียกฟังก์ชันใน Supabase (supabase/02_functions.sql) แล้วคืนค่ารูปแบบเดียวกันเสมอ:
//   { ok: true, ... }  หรือ  { ok: false, error: 'CODE', ... }
import { supabase } from '../lib/supabase'

export async function rpc(fn, args) {
  try {
    const { data, error } = await supabase.rpc(fn, args)
    if (error || !data) return { ok: false, error: 'NETWORK', message: error?.message }
    return data
  } catch (e) {
    return { ok: false, error: 'NETWORK', message: String(e) }
  }
}
