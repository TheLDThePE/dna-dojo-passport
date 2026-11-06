import { useEffect, useRef, useState } from 'react'

import { ChevronRight, CircleHelp, CirclePlay, GitCompare, Lightbulb, LineChart, ShieldCheck, Tv, X, Zap } from 'lucide-react'
/* ---------------- Data ---------------- */

const THEMES = {
  sky:    { iconBox: 'bg-sky-50 border-sky-200 text-sky-700',           hover: 'hover:border-sky-500',     head: 'bg-sky-900',    sub: 'text-sky-300',    close: 'text-sky-200',    strip: 'bg-sky-50 border-sky-200',       stripText: 'text-sky-900',    btn: 'bg-sky-900' },
  amber:  { iconBox: 'bg-amber-50 border-amber-200 text-amber-700',     hover: 'hover:border-amber-500',   head: 'bg-amber-900',  sub: 'text-amber-300',  close: 'text-amber-200',  strip: 'bg-amber-50 border-amber-200',   stripText: 'text-amber-900',  btn: 'bg-amber-900' },
  violet: { iconBox: 'bg-violet-50 border-violet-200 text-violet-700',  hover: 'hover:border-violet-500',  head: 'bg-violet-900', sub: 'text-violet-300', close: 'text-violet-200', strip: 'bg-violet-50 border-violet-200', stripText: 'text-violet-900', btn: 'bg-violet-900' },
  rose:   { iconBox: 'bg-rose-50 border-rose-200 text-rose-700',        hover: 'hover:border-rose-500',    head: 'bg-rose-900',   sub: 'text-rose-300',   close: 'text-rose-200',   strip: 'bg-rose-50 border-rose-200',     stripText: 'text-rose-900',   btn: 'bg-rose-900' },
  emerald:{ iconBox: 'bg-emerald-50 border-emerald-200 text-emerald-700', hover: 'hover:border-emerald-500', head: 'bg-emerald-900', sub: 'text-emerald-300', close: 'text-emerald-200', strip: 'bg-emerald-50 border-emerald-200', stripText: 'text-emerald-900', btn: 'bg-emerald-900' },
}

// const BADGES = {
//   passed: 'bg-emerald-100 text-emerald-800',
//   progress: 'bg-blue-100 text-blue-800',
//   locked: 'bg-slate-200 text-slate-600',
// }

const STATIONS = [
  {
    id: 'st1', no: '01', theme: 'sky', icon: Tv,
    title: 'BLU + Panel Structure & Defect',
    modalTitle: 'BLU + Panel Structure & Defect',
    subtitle: 'Optical layers, LGP inspection, Mura/Pixel criteria',
    badge: { text: '4/4 Passed', tone: 'passed' },
    statusLabel: 'Curriculum Status:',
    status: { text: 'Certified (4/4 Completed)', cls: 'text-emerald-700 bg-emerald-100' },
    sectionTitle: 'Standard Inspection Breakdown:',
    items: [
      ['1. BLU Stack Alignment:', 'Reflector, Light Guide Plate (LGP), Diffuser, and Dual Prism sheet orientation checks.'],
      ['2. Optical Defect Classification:', 'Spot Mura, Line Mura, White Spots, and Foreign Material contamination boundaries.'],
      ['3. Cell Assembly Integrity:', 'FPC bonding, polarizer scratch criteria (≤0.05mm limit samples), and bezel latch verification.'],
    ],
    footerNote: 'Passing Grade: ≥95%',
    closeLabel: 'Close',
  },
  {
    id: 'st2', no: '02', theme: 'amber', icon: Zap,
    title: 'ESD / Electric Puck Type',
    modalTitle: 'ESD / Electric Puck Type Station',
    subtitle: 'Grounding wrist band, ionization, puck calibration',
    badge: { text: '2/3 Done', tone: 'progress' },
    activity: [
      {
        lang: 'th',
        title: 'กิจกรรมส่งเสริมความรู้และสร้างความตระหนักเกี่ยวกับไฟฟ้าสถิต',
        intro: 'ให้กับพนักงานผ่านการเล่นเกมส์และทดลอง โดยแบ่งออกเป็น 2 ฐาน คือ',
        stations: [
          {
            name: 'ฐานที่ 1 ESD Game board',
            text: 'เรียนรู้ผ่านเกมส์จับคู่ระหว่างอุปกรณ์ป้องกันไฟฟ้าสถิต คุณสมบัติ และผลกระทบจากการไม่ใช้งาน',
          },
          {
            name: 'ฐานที่ 2 ESD Magic station',
            text: 'เรียนรู้จากการทดลอง เป็นกิจกรรมสาธิตการเกิดไฟฟ้าสถิตและการทำงานของ Ionizer โดยใช้แผ่นพลาสติกและเม็ดโฟม เพื่อให้พนักงานมองเห็นผลของไฟฟ้าสถิตได้อย่างชัดเจน',
          },
        ],
      },
      {
        lang: 'en',
        title: 'ESD Knowledge and Awareness Activity',
        intro: 'Engaging employees through interactive games and demonstrations across 2 stations.',
        stations: [
          {
            name: 'Station 1: ESD Game board',
            text: 'Learn about ESD protection equipment through a matching game. Match each piece of equipment with its function and the possible problem if it is not used.',
          },
          {
            name: 'Station 2: ESD Magic station',
            text: 'Demonstrates static electricity and how an Ionizer works using plastic sheets and foam beads. Compare the results with the Ionizer ON and OFF to understand the effects of static electricity.',
          },
        ],
      },
    ],
    link: {
      label: 'See VDO',
      url: 'https://www.loom.com/share/398da1184240484f8cc464cde10db6a2',
    },
  },
    {
    id: 'st3', no: '03', theme: 'violet', icon: GitCompare,
    title: 'Comparative Instruction (WI & QI)',
    modalTitle: 'Clear Comparative Instruction (WI & QI)',
    subtitle: 'Work Instructions vs Quality Inspection limit samples',
    badge: { text: '3/3 Passed', tone: 'passed' },
    activity: [
      {
        lang: 'th',
        title: 'กิจกรรมต่อโลโก้เปรียบเทียบ WI และ QI',
        stations: [
          {
            name: 'ต่อโลโก้',
            text: 'ให้ผู้เข้าอบรมแบ่งเป็น 3 กลุ่ม ต่อโลโก้จากตัวต่อชุดเดียวกันภายใน 5 นาที โดยแต่ละกลุ่มได้ WI ไม่เหมือนกัน (ไม่มี WI / WI ไม่สมบูรณ์ / WI สมบูรณ์)',
          },
          {
            name: 'ตรวจผลงาน (QI)',
            text: 'จากนั้นตรวจผลงานเทียบกับ master sample ด้วย check list (QI)',
          },
          {
            name: 'สิ่งที่ได้เรียนรู้',
            text: 'เพื่อให้เห็นว่า WI ทำให้ทุกคน "ทำเหมือนกัน" และ QI ทำให้ทุกคน "ตัดสินเหมือนกัน"',
          },
          {
            name: 'เวลาและค่าใช้จ่าย',
            text: 'ใช้เวลา 20–25 นาที ไม่มีค่าใช้จ่ายเพิ่ม',
          },
        ],
      },
      {
        lang: 'en',
        title: 'WI & QI Logo-Building Activity',
        stations: [
          {
            name: 'Build the logo',
            text: 'Participants form 3 groups and build the same logo from the same blocks in 5 minutes. Each group gets a different WI (no WI / incomplete WI / complete WI).',
          },
          {
            name: 'Check the results (QI)',
            text: 'Each result is then checked against a master sample with a checklist (QI).',
          },
          {
            name: 'What participants learn',
            text: 'WI makes everyone "work the same way" and QI makes everyone "judge the same way".',
          },
          {
            name: 'Time and cost',
            text: 'It takes 20–25 minutes and has no extra cost.',
          },
        ],
      },
    ],
    link: {
      label: 'See VDO',
      url: 'https://www.loom.com/share/f0b38bb8c58e43c7881a3bd9b6eda33b',
    },
  },
   {
    id: 'st4', no: '04', theme: 'rose', icon: LineChart,
    title: 'COPQ & Quality Awareness',
    modalTitle: 'COPQ & Quality Awareness Station',
    subtitle: 'Scrap loss, internal re-work cost & customer trust',
    badge: { text: 'Locked', tone: 'locked' },
    activity: [
      {
        lang: 'th',
        title: 'กิจกรรมผลกระทบเมื่อชิ้นงานไม่ได้คุณภาพหลุดไปหาลูกค้า',
        stations: [
          {
            name: 'วิธีเล่น',
            text: 'ให้ผู้เข้าร่วมอบรมช่วยกันติดป้ายผลกระทบที่เกิดขึ้นเมื่อชิ้นงานไม่ได้คุณภาพหลุดไปหาลูกค้าแล้วทำให้ลูกค้า claim กลับมา',
          },
          {
            name: 'การแบ่งผลกระทบ',
            text: 'แบ่งเป็นผลกระทบที่เห็นได้ชัดเจน (ภูเขาน้ำแข็งเหนือน้ำ) และผลกระทบแฝง (ภูเขาน้ำแข็งใต้น้ำ)',
          },
          {
            name: 'เฉลย',
            text: 'เมื่อกดเฉลย ถ้าวางถูกตำแหน่งไฟจะขึ้นสีเขียว ถ้าวางผิดตำแหน่งไฟจะขึ้นสีแดง',
          },
        ],
      },
      {
        lang: 'en',
        title: 'Impact of Non-Conforming Parts Escaping to the Customer',
        stations: [
          {
            name: 'How it works',
            text: 'Participants collaborate to place flashcards representing the impacts of non-conforming parts escaping to the customer and causing customer claims.',
          },
          {
            name: 'Impact categories',
            text: 'The impacts are divided into visible cost impacts (the iceberg above the water) and hidden cost impacts (the iceberg below the water).',
          },
          {
            name: 'Reveal the answers',
            text: 'When the answers are revealed, correctly placed flashcards show green lights, while incorrect placements show red lights.',
          },
        ],
      },
    ],
    link: {
      label: 'See VDO',
      url: 'https://www.loom.com/share/5f9105dcf45a410d99498e915281a4f9',
    },
  },


    {
    id: 'st5', no: '05', theme: 'emerald', icon: ShieldCheck,
    title: 'Safety Mind & 5S Station',
    modalTitle: 'Safety Mind & 5S Station',
    subtitle: 'Seiri, Seiton, PPE compliance & safety protocols',
    badge: { text: 'Locked', tone: 'locked' },
    statusLabel: 'Prerequisite Requirement:',
    status: { text: 'Locked (Final Certification)', cls: 'text-emerald-700 bg-emerald-100' },
    sectionTitle: 'Shop-Floor Discipline Training:',
    items: [
      ['1. Cleanroom PPE Discipline:', 'Cap, hood, mask, smock, and ESD shoe grounding check.'],
      ['2. 5S Implementation Audit:', 'Seiri (Sort), Seiton (Set in order), Seiso (Shine), Seiketsu (Standardize), Shitsuke (Sustain).'],
      ['3. KYT (Kiken Yochi Training):', 'Hazard prediction and finger-pointing-and-calling drills.'],
    ],
    closeLabel: 'Back to Home',
  },
]

/* ---------------- Components ---------------- */
function WhatIsDojoButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full shrink-0 items-center justify-between rounded-lg border border-slate-300 bg-slate-200/90 px-3 py-2 shadow-xs transition hover:bg-slate-300 active:scale-[0.99]"
    >
      <div className="flex items-center gap-2 text-left">
        <CircleHelp size={16} className="text-rose-600" />
        <span className="text-xs font-bold uppercase tracking-wide text-rose-600">What is DOJO?</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Lightbulb size={18} className="text-gold" aria-hidden="true" />
        <ChevronRight size={14} className="text-slate-400" />
      </div>
    </button>
  )
}

function StationCard({ station, onOpen }) {
  const t = THEMES[station.theme]
  const Icon = station.icon
  return (
    <button
      type="button"
      onClick={() => onOpen(station.id)}
      className={`flex min-h-[88px] w-full flex-1 basis-0 items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2 text-left shadow-xs transition active:scale-[0.99] ${t.hover}`}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border ${t.iconBox}`}>
          <Icon size={28} />
        </div>
        <div className="min-w-0 leading-tight">
          <span className="font-mono text-xs font-bold text-slate-400">#{station.no}</span>
          <h2 className="line-clamp-2 text-base font-bold leading-snug text-slate-900">{station.title}</h2>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{station.subtitle}</p>
        </div>
      </div>

      <ChevronRight size={20} className="shrink-0 text-slate-400" aria-hidden="true" />
    </button>
  )
}

function Sheet({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl">
        {children}
      </div>
    </div>
  )
}

const DOJO_LANGS = ['th', 'en', 'ja']

const DOJO_TEXT = {
  th: {
    tab: 'ไทย',
    title: 'DOJO คืออะไร?',
    subtitle: 'ความหมายและที่มาของคำ',
    doRead: 'โด',
    doMeaning: 'วิธีการปฏิบัติ หรือแนวทางปฏิบัติ',
    joRead: 'โจ',
    joMeaning: 'ห้องโถง หรือสถานที่ขนาดใหญ่',
    paragraphs: [
      'DOJO Training คือเครื่องมือฝึกอบรมที่ช่วยพัฒนาเจ้าหน้าที่ฝ่ายควบคุมคุณภาพและเจ้าหน้าที่ฝ่ายปฏิบัติการในกระบวนการผลิต ซึ่งเป็นมากกว่าการอบรมทั่วไป',
      'DOJO Training จึงหมายถึงสถานที่สำหรับฝึกปฏิบัติ เปรียบเสมือนโรงเรียน พนักงานจะได้เรียนรู้ทั้งภาคทฤษฎีและลงมือปฏิบัติด้วยตนเองจนเข้าใจและชำนาญ แล้วจึงส่งเข้าไปปฏิบัติงานตามจุดต่างๆ',
    ],
    ok: 'เข้าใจแล้ว',
  },
  en: {
    tab: 'English',
    title: 'What is DOJO?',
    subtitle: 'Meaning and origin of the word',
    doRead: 'dō',
    doMeaning: 'A way, method, or practice',
    joRead: 'jō',
    joMeaning: 'A hall or large place',
    paragraphs: [
      'DOJO Training is a development tool for Quality Control and Production Operation staff. It is more than a standard training course.',
      'A DOJO is therefore a place to practice, much like a school. Employees learn the theory and then practice hands-on until they truly understand and master it, before being assigned to their stations.',
    ],
    ok: 'Understood',
  },
  ja: {
    tab: '日本語',
    title: 'DOJOとは？',
    subtitle: '言葉の意味と由来',
    doRead: 'どう',
    doMeaning: '方法、やり方、実践の道',
    joRead: 'じょう',
    joMeaning: '広間、大きな場所',
    paragraphs: [
      'DOJO Training（道場トレーニング）は、品質管理担当者と製造現場のオペレーターを育成するための教育ツールであり、単なる研修にとどまりません。',
      '道場とは、やり方を実践して身につける場所です。学校のように、従業員は理論を学び、自ら手を動かして理解し習熟してから、各現場へ配属されます。',
    ],
    ok: 'わかりました',
  },
}

// เส้นรัศมีครึ่งวงกลมด้านบน (คำนวณครั้งเดียวระดับไฟล์)
const BULB_RAYS = [-180, -150, -120, -90, -60, -30, 0].map((deg) => {
  const r = (deg * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  return {
    x1: (28 + 20 * c).toFixed(1),
    y1: (28 + 20 * s).toFixed(1),
    x2: (28 + 26 * c).toFixed(1),
    y2: (28 + 26 * s).toFixed(1),
  }
})

function LitBulb() {
  return (
    <span className="relative flex h-14 w-14 shrink-0 items-center justify-center text-gold" aria-hidden="true">
      {/* แสงเรืองด้านหลัง */}
      <span className="absolute inset-2 animate-pulse rounded-full bg-gold/40 blur-md" />

      {/* เส้นรัศมี */}
      <svg viewBox="0 0 56 56" className="absolute inset-0 animate-pulse" fill="none">
        {BULB_RAYS.map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}
      </svg>

      {/* หลอดไฟทึบ */}
      <Lightbulb size={26} fill="currentColor" className="relative drop-shadow-[0_0_6px_rgba(245,179,1,0.9)]" />
    </span>
  )
}






function DojoModal({ onClose }) {
  const [lang, setLang] = useState('th')
  const [progress, setProgress] = useState(0)
  const scrollRef = useRef(null)
  const t = DOJO_TEXT[lang]

  const onScroll = (e) => {
    const el = e.currentTarget
    const max = el.scrollHeight - el.clientHeight
    setProgress(max > 0 ? el.scrollTop / max : 1)
  }

  const changeLang = (next) => {
    setLang(next)
    setProgress(0)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }

  return (
    <Sheet onClose={onClose}>
      {/* หัว */}
      <div className="flex items-center justify-between bg-ink p-4 text-white">
        <div className="flex items-center gap-3">

          <LitBulb />
          {/* <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold">
            <Lightbulb size={24} aria-hidden="true" />
          </span> */}
          <div>
            <h3 className="text-sm font-bold" lang={lang}>{t.title}</h3>
            <p className="text-[11px] text-slate-400" lang={lang}>{t.subtitle}</p>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close" className="px-2 text-slate-300 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* เลือกภาษา */}
      <div className="flex gap-1 border-b border-slate-200 bg-white p-2" role="tablist" aria-label="Language">
        {DOJO_LANGS.map((code) => (
          <button
            key={code}
            role="tab"
            aria-selected={lang === code}
            onClick={() => changeLang(code)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
              lang === code ? 'bg-ink text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {DOJO_TEXT[code].tab}
          </button>
        ))}
      </div>

      {/* แถบความคืบหน้าการอ่าน */}
      <div className="h-0.5 shrink-0 bg-slate-200" aria-hidden="true">
        <div className="h-full bg-[#ef2b2d] transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* เนื้อหา */}
      <div ref={scrollRef} onScroll={onScroll} lang={lang} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {/* 道 + 場 = DOJO */}
        <div className="flex items-stretch gap-2">
          <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
            <p lang="ja" className="text-4xl font-bold leading-none text-ink">道</p>
            <p className="mt-2 text-xs font-extrabold tracking-wider text-[#ef2b2d]">DO · {t.doRead}</p>
            <p className="mt-1 text-xs leading-snug text-slate-600">{t.doMeaning}</p>
          </div>
          <span className="flex items-center text-lg font-bold text-slate-300">+</span>
          <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
            <p lang="ja" className="text-4xl font-bold leading-none text-ink">場</p>
            <p className="mt-2 text-xs font-extrabold tracking-wider text-[#ef2b2d]">JO · {t.joRead}</p>
            <p className="mt-1 text-xs leading-snug text-slate-600">{t.joMeaning}</p>
          </div>
        </div>

        {t.paragraphs.map((p) => (
          <p key={p} className="text-[15px] leading-7 text-slate-700">
            {p}
          </p>
        ))}
      </div>

      {/* ปุ่มติดด้านล่าง */}
      <div className="flex justify-end border-t border-slate-200 bg-slate-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button onClick={onClose} className="rounded bg-ink px-5 py-2 text-xs font-semibold text-white" lang={lang}>
          {t.ok}
        </button>
      </div>
    </Sheet>
  )
}
function ActivityBody({ activity }) {
  return (
    <div className="space-y-5">
      {activity.map((block, i) => (
        <section
          key={block.lang}
          lang={block.lang}
          className={`space-y-3 ${i > 0 ? 'border-t border-slate-200 pt-5' : ''}`}
        >
          <h4 className="text-sm font-bold leading-snug text-slate-900">{block.title}</h4>
          {block.intro && <p className="text-[13px] leading-6 text-slate-700">{block.intro}</p>}
          <ul className="space-y-2">
            {block.stations.map((s) => (
              <li key={s.name} className="rounded border border-slate-200 bg-slate-50 p-2.5">
                <p className="text-[13px] font-semibold leading-snug text-slate-800">{s.name}</p>
                <p className="mt-1 text-[13px] leading-6 text-slate-600">{s.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function StationModal({ station, onClose }) {
  const t = THEMES[station.theme]
  return (
    <Sheet onClose={onClose}>
      <div className={`flex items-center justify-between p-4 text-white ${t.head}`}>
        <div>
          <span className={`font-mono text-[10px] font-bold ${t.sub}`}>STATION {station.no}</span>
          <h3 className="text-sm font-bold">{station.modalTitle}</h3>
        </div>
        <button onClick={onClose} aria-label="Close" className={`px-2 hover:text-white ${t.close}`}>
          <X size={18} />
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto p-4 text-xs text-slate-700">
        {station.activity ? (
          <ActivityBody activity={station.activity} />
        ) : (
          <>
            <div className={`flex items-center justify-between rounded border p-2 ${t.strip}`}>
              <span className={`font-semibold ${t.stripText}`}>{station.statusLabel}</span>
              <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${station.status.cls}`}>
                {station.status.text}
              </span>
            </div>

            <div>
              <h4 className="mb-1 font-bold text-slate-900">{station.sectionTitle}</h4>
              <ul className="space-y-1.5">
                {station.items.map(([label, text, pending]) => (
                  <li
                    key={label}
                    className={`rounded border p-2 ${pending ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 bg-slate-50'}`}
                  >
                    <span className={`font-semibold ${pending ? 'text-amber-800' : 'text-slate-800'}`}>{label}</span>{' '}
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {station.footerNote ? (
          <span className="font-mono text-[11px] text-slate-500">{station.footerNote}</span>
        ) : (
          <span />
        )}

        {station.link ? (
          <a
            href={station.link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded px-4 py-2 text-xs font-semibold text-white ${t.btn}`}
          >
            <CirclePlay size={16} aria-hidden="true" />
            {station.link.label}
          </a>
        ) : (
          <button onClick={onClose} className={`rounded px-4 py-1.5 text-xs font-semibold text-white ${t.btn}`}>
            {station.closeLabel}
          </button>
        )}
      </div>
    </Sheet>
  )
}



/* ---------------- Page ---------------- */

export default function HomePage() {
  const [openId, setOpenId] = useState(null) // null | 'dojo' | station id
  const close = () => setOpenId(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpenId(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const activeStation = STATIONS.find((s) => s.id === openId)

  return (
    <div className="flex h-full min-h-fit flex-col gap-1.5 px-3 py-2">
      <WhatIsDojoButton onClick={() => setOpenId('dojo')} />

      {STATIONS.map((s) => (
        <StationCard key={s.id} station={s} onOpen={setOpenId} />
      ))}

      {openId === 'dojo' && <DojoModal onClose={close} />}
      {activeStation && <StationModal station={activeStation} onClose={close} />}
    </div>
  )
}
