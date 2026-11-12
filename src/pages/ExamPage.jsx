import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ClipboardCheck } from 'lucide-react'
import { getExam, submitExam } from '../api/examApi'
import { errorText } from '../lib/errorText'
import { loadSession } from '../lib/session'
import { examImageUrl } from '../lib/supabase'
import Modal from '../components/Modal'

const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200'

// ---- เก็บคำตอบที่ยังไม่ส่งไว้ในแท็บนี้ (รีเฟรชหรือสลับหน้าแล้วกลับมาไม่หาย) ----
const progressKey = (emp, code) => `ldna.exam.${emp}.${code}`

function readProgress(emp, code, questions) {
  try {
    const p = JSON.parse(sessionStorage.getItem(progressKey(emp, code)) || 'null')
    const valid = new Set(questions.map((q) => q.q_no))
    const answers = {}
    for (const [k, v] of Object.entries(p?.answers || {})) {
      if (valid.has(Number(k)) && typeof v === 'string' && /^[A-D]$/.test(v)) answers[k] = v
    }
    const idx = Number.isInteger(p?.idx) && p.idx >= 0 && p.idx < questions.length ? p.idx : 0
    return { answers, idx }
  } catch {
    return { answers: {}, idx: 0 }
  }
}

function writeProgress(emp, code, answers, idx) {
  try {
    sessionStorage.setItem(progressKey(emp, code), JSON.stringify({ answers, idx }))
  } catch {
    /* ข้ามได้ */
  }
}

function clearProgress(emp, code) {
  try {
    sessionStorage.removeItem(progressKey(emp, code))
  } catch {
    /* ข้ามได้ */
  }
}

function BackLink() {
  return (
    <p>
      <Link to="/passport" className="text-sm font-medium text-blue-700">
        ← กลับไป Passport
      </Link>
    </p>
  )
}

function Notice({ title, children, action }) {
  return (
    <div className="space-y-4 px-4 pt-4">
      <section className={card}>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{children}</p>
        {action}
      </section>
      <BackLink />
    </div>
  )
}

function ExamImage({ file, alt }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <p className="rounded-lg bg-slate-100 px-3 py-6 text-center text-xs text-slate-400">โหลดรูปไม่ได้</p>
    )
  }
  return (
    <img
      src={examImageUrl(file)}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="block max-h-48 w-full rounded-lg bg-slate-50 object-contain"
    />
  )
}

export default function ExamPage() {
  const { code: rawCode } = useParams()
  const code = String(rawCode || '').toUpperCase()
  const [session] = useState(loadSession)
  const authed = Boolean(session.empNo && session.pin)

  const [load, setLoad] = useState(null) // null = กำลังโหลด, ไม่ใช่ null = ผลของ getExam
  const [tryKey, setTryKey] = useState(0)
  const [answers, setAnswers] = useState({}) // { "1": "A", ... }
  const [idx, setIdx] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [result, setResult] = useState(null) // { score, total, fresh } หลังส่งคำตอบ

  useEffect(() => {
    if (!authed) return undefined
    let ignore = false
    getExam(session.empNo, session.pin, code).then((r) => {
      if (ignore) return
      if (r.ok && !r.taken) {
        const saved = readProgress(session.empNo, code, r.questions)
        setAnswers(saved.answers)
        setIdx(saved.idx)
      }
      setLoad(r)
    })
    return () => {
      ignore = true
    }
  }, [authed, session.empNo, session.pin, code, tryKey])

  function retry() {
    setLoad(null)
    setTryKey((k) => k + 1)
  }

  function scrollTop() {
    document.querySelector('main')?.scrollTo?.({ top: 0 })
  }

  function choose(qNo, letter) {
    const next = { ...answers, [qNo]: letter }
    setAnswers(next)
    writeProgress(session.empNo, code, next, idx)
  }

  function go(i) {
    setIdx(i)
    writeProgress(session.empNo, code, answers, i)
    scrollTop()
  }

  async function send() {
    const questions = load.questions
    setSending(true)
    setSendError('')
    const payload = Object.fromEntries(questions.map((q) => [String(q.q_no), answers[q.q_no]]))
    const r = await submitExam(session.empNo, session.pin, code, payload)
    setSending(false)
    if (r.ok || r.error === 'ALREADY_TAKEN') {
      clearProgress(session.empNo, code)
      setConfirmOpen(false)
      setResult({ score: r.score, total: r.total, fresh: Boolean(r.ok) })
      scrollTop()
      return
    }
    setSendError(errorText(r))
  }

  // ---------- หน้าจอ ----------
  if (!authed) {
    return (
      <Notice title="ต้องเข้าสู่ระบบก่อน">
        กลับไปที่ Passport แล้วใส่รหัสพนักงานและ PIN จากนั้นแตะวงกลมสีเขียวของสถานีเพื่อทำข้อสอบ
      </Notice>
    )
  }

  if (load === null) {
    return <p className="p-8 text-center text-sm text-slate-500">กำลังโหลดข้อสอบ…</p>
  }

  if (!load.ok) {
    if (load.error === 'NOT_PASSED') {
      return <Notice title={`ยังไม่ผ่านสถานี ${code}`}>{errorText(load)}</Notice>
    }
    if (load.error === 'NO_EXAM') {
      return <Notice title="ยังไม่เปิดข้อสอบ">ข้อสอบสถานี {code} ยังไม่พร้อมให้ทำ โปรดรอประกาศ</Notice>
    }
    if (['INVALID_CREDENTIALS', 'LOCKED', 'NOT_REGISTERED'].includes(load.error)) {
      return <Notice title="เข้าสู่ระบบใหม่">{errorText(load)} กลับไปที่ Passport เพื่อเข้าสู่ระบบอีกครั้ง</Notice>
    }
    return (
      <Notice
        title="โหลดข้อสอบไม่ได้"
        action={
          <button
            type="button"
            onClick={retry}
            className="mt-4 w-full rounded-xl bg-ink py-3 text-base font-bold text-white"
          >
            ลองอีกครั้ง
          </button>
        }
      >
        {errorText(load)}
      </Notice>
    )
  }

  if (load.taken || result) {
    const score = result ? result.score : load.score
    const total = result ? result.total : load.total
    return (
      <div className="space-y-4 px-4 pt-4">
        <section className={`${card} text-center`}>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <ClipboardCheck size={28} aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-lg font-bold">ข้อสอบสถานี {code}</h2>
          <p className="mt-4 text-5xl font-extrabold leading-none text-blue-700">
            {score}
            <span className="text-2xl font-bold text-slate-400">/{total}</span>
          </p>
          <p className="mt-2 text-sm text-slate-500">คะแนนข้อสอบของคุณ</p>
          <p className="mt-4 text-sm text-slate-600">
            {result?.fresh
              ? 'ส่งคำตอบเรียบร้อย คะแนนถูกรวมในคะแนนรวมของคุณแล้ว'
              : 'คุณทำข้อสอบสถานีนี้แล้ว ทำได้ครั้งเดียว'}
          </p>
        </section>
        <BackLink />
      </div>
    )
  }

  const qs = load.questions
  const total = qs.length
  const q = qs[idx]
  const answeredCount = qs.filter((x) => answers[x.q_no]).length
  const allDone = answeredCount === total
  const missing = qs.filter((x) => !answers[x.q_no]).map((x) => qs.indexOf(x) + 1)
  const imageOptions = q.options.some((o) => o.image)
  const last = idx === total - 1

  return (
    <div className="space-y-4 px-4 pt-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-sm font-bold leading-snug">
          ข้อสอบสถานี {code} <span className="font-normal text-slate-500">· {load.station.name}</span>
        </h2>
        <nav aria-label="เลือกข้อ" className="mt-3 flex gap-2">
          {qs.map((x, i) => {
            const done = Boolean(answers[x.q_no])
            return (
              <button
                key={x.q_no}
                type="button"
                onClick={() => go(i)}
                aria-label={`ไปข้อ ${i + 1}${done ? ' (ตอบแล้ว)' : ''}`}
                aria-current={i === idx ? 'step' : undefined}
                className={`h-8 min-w-8 flex-1 rounded-full text-sm font-bold transition ${
                  done ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                } ${i === idx ? 'ring-2 ring-blue-600 ring-offset-2' : ''}`}
              >
                {i + 1}
              </button>
            )
          })}
        </nav>
        <p className="mt-2 text-xs text-slate-500">
          ตอบแล้ว {answeredCount} จาก {total} ข้อ · ข้อละ 1 คะแนน
        </p>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold text-blue-700">
          ข้อ {idx + 1} จาก {total}
        </p>
        {q.text && <p className="mt-1.5 whitespace-pre-line text-base font-semibold leading-relaxed">{q.text}</p>}
        {q.image && (
          <div className="mt-3">
            <ExamImage key={q.image} file={q.image} alt={`รูปประกอบข้อ ${idx + 1}`} />
          </div>
        )}
      </section>

      <fieldset>
        <legend className="sr-only">เลือกคำตอบข้อ {idx + 1}</legend>
        <div className={imageOptions ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
          {q.options.map((o) => {
            const picked = answers[q.q_no] === o.letter
            return (
              <label
                key={o.letter}
                className={`flex cursor-pointer rounded-2xl border-2 p-3 transition has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-600 ${
                  picked ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'
                } ${o.image ? 'flex-col gap-2' : 'items-center gap-3'}`}
              >
                <input
                  type="radio"
                  name={`q${q.q_no}`}
                  value={o.letter}
                  checked={picked}
                  onChange={() => choose(q.q_no, o.letter)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    picked ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {o.letter}
                </span>
                {o.image && <ExamImage key={o.image} file={o.image} alt={`ตัวเลือก ${o.letter}`} />}
                {o.text && <span className="min-w-0 text-[15px] leading-snug">{o.text}</span>}
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        {last && !allDone && (
          <p className="mb-2 text-xs text-amber-700">ยังไม่ได้ตอบ: ข้อ {missing.join(', ')}</p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => go(idx - 1)}
            disabled={idx === 0}
            className="flex items-center gap-1 rounded-xl bg-slate-100 px-4 py-3 text-base font-bold text-slate-700 disabled:opacity-40"
          >
            <ChevronLeft size={18} aria-hidden="true" />
            ก่อนหน้า
          </button>
          {last ? (
            <button
              type="button"
              onClick={() => {
                setSendError('')
                setConfirmOpen(true)
              }}
              disabled={!allDone}
              className="flex-1 rounded-xl bg-pass py-3 text-base font-bold text-white transition active:scale-[0.99] disabled:opacity-40"
            >
              ตรวจทานและส่ง
            </button>
          ) : (
            <button
              type="button"
              onClick={() => go(idx + 1)}
              disabled={!answers[q.q_no]}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-ink py-3 text-base font-bold text-white transition active:scale-[0.99] disabled:opacity-40"
            >
              ถัดไป
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {confirmOpen && (
        <Modal title="ส่งคำตอบ?" onClose={() => setConfirmOpen(false)} busy={sending}>
          <p className="mt-2 text-sm text-slate-600">
            ตอบครบ {total} ข้อ ส่งแล้วแก้ไขไม่ได้ และทำข้อสอบสถานีนี้ได้ครั้งเดียว
          </p>
          <ul className="mt-3 grid grid-cols-5 gap-2 text-center">
            {qs.map((x, i) => (
              <li key={x.q_no} className="rounded-xl bg-slate-50 py-2 ring-1 ring-slate-200">
                <p className="text-[11px] text-slate-500">ข้อ {i + 1}</p>
                <p className="text-base font-bold text-blue-700">{answers[x.q_no]}</p>
              </li>
            ))}
          </ul>
          {sendError && (
            <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
              {sendError}
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={sending}
              className="rounded-xl bg-slate-100 py-3 text-base font-bold text-slate-700 disabled:opacity-50"
            >
              ย้อนกลับ
            </button>
            <button
              type="button"
              onClick={send}
              disabled={sending}
              className="rounded-xl bg-pass py-3 text-base font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
            >
              {sending ? 'กำลังส่ง…' : 'ยืนยันส่ง'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
