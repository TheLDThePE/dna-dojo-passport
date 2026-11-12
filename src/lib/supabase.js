import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_KEY

if (!url || !key) {
  console.error('ไม่พบ VITE_SUPABASE_URL / VITE_SUPABASE_KEY (ตรวจไฟล์ .env และ Environment Variables บน Vercel)')
}

// ไม่ใช้ Supabase Auth (เราตรวจ PIN/รหัสผ่านเองในฟังก์ชันฐานข้อมูล) จึงปิดการเก็บ session
export const supabase = createClient(url || 'http://invalid.local', key || 'missing-key', {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

// รูปพนักงาน: bucket "photos" ชื่อไฟล์ = EmpNo.jpg
export const photoUrl = (empNo) =>
  `${url}/storage/v1/object/public/photos/${encodeURIComponent(empNo)}.jpg`

// รูปข้อสอบ: bucket "exam" (แยกจากรูปพนักงาน) ชื่อไฟล์ตามที่ระบุในข้อสอบ เช่น Q_D1_1.png, A_D1_3_B.png
export const examImageUrl = (file) =>
  `${url}/storage/v1/object/public/exam/${encodeURIComponent(file)}`
