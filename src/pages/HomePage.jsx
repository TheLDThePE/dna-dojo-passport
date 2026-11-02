import { useEffect, useState } from 'react'
import { ChevronRight, CircleHelp, GitCompare, LineChart, ShieldCheck, Tv, X, Zap } from 'lucide-react'

/* ---------------- Data ---------------- */

const THEMES = {
  blue:   { iconBox: 'bg-blue-50 border-blue-200 text-blue-700',       hover: 'hover:border-blue-500',   head: 'bg-blue-900',   sub: 'text-blue-300',   close: 'text-blue-200',   strip: 'bg-blue-50 border-blue-200',     stripText: 'text-blue-900',   btn: 'bg-blue-900' },
  amber:  { iconBox: 'bg-amber-50 border-amber-200 text-amber-700',    hover: 'hover:border-amber-500',  head: 'bg-amber-900',  sub: 'text-amber-300',  close: 'text-amber-200',  strip: 'bg-amber-50 border-amber-200',   stripText: 'text-amber-900',  btn: 'bg-amber-900' },
  indigo: { iconBox: 'bg-indigo-50 border-indigo-200 text-indigo-700', hover: 'hover:border-indigo-500', head: 'bg-indigo-900', sub: 'text-indigo-300', close: 'text-indigo-200', strip: 'bg-indigo-50 border-indigo-200', stripText: 'text-indigo-900', btn: 'bg-indigo-900' },
  rose:   { iconBox: 'bg-rose-50 border-rose-200 text-rose-700',       hover: 'hover:border-rose-500',   head: 'bg-rose-900',   sub: 'text-rose-300',   close: 'text-rose-200',   strip: 'bg-rose-50 border-rose-200',     stripText: 'text-rose-900',   btn: 'bg-slate-700' },
  teal:   { iconBox: 'bg-teal-50 border-teal-200 text-teal-700',       hover: 'hover:border-teal-500',   head: 'bg-teal-900',   sub: 'text-teal-300',   close: 'text-teal-200',   strip: 'bg-teal-50 border-teal-200',     stripText: 'text-teal-900',   btn: 'bg-slate-700' },
}

const BADGES = {
  passed: 'bg-emerald-100 text-emerald-800',
  progress: 'bg-blue-100 text-blue-800',
  locked: 'bg-slate-200 text-slate-600',
}

const STATIONS = [
  {
    id: 'st1', no: '01', theme: 'blue', icon: Tv,
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
    statusLabel: 'Curriculum Status:',
    status: { text: 'In Progress (2/3 Modules)', cls: 'text-blue-700 bg-blue-100' },
    sectionTitle: 'Standard Operating Criteria:',
    items: [
      ['1. Wrist Strap & Footwear Impedance:', 'Daily log-in resistance test within 750 kΩ – 35 MΩ tolerance.'],
      ['2. Electric Puck Discharge Verification:', 'Direct contact decay time validation (<1.0s decay to ±50V).'],
      ['3. Ionizer Airflow & Balance Calibration (Pending):', 'Target offset voltage within ±15V.', true],
    ],
    footerNote: 'Module 3 Uncompleted',
    closeLabel: 'Resume Module 3',
  },
  {
    id: 'st3', no: '03', theme: 'indigo', icon: GitCompare,
    title: 'Comparative Instruction (WI & QI)',
    modalTitle: 'Clear Comparative Instruction (WI & QI)',
    subtitle: 'Work Instructions vs Quality Inspection limit samples',
    badge: { text: '3/3 Passed', tone: 'passed' },
    statusLabel: 'Curriculum Status:',
    status: { text: 'Certified (3/3 Completed)', cls: 'text-emerald-700 bg-emerald-100' },
    sectionTitle: 'Instruction Alignment Competencies:',
    items: [
      ['1. WI (Work Instruction) Mastery:', 'Standard sequence order, cycle-time compliance, and tool holding posture.'],
      ['2. QI (Quality Inspection) Cross-Check:', 'Critical-to-Quality (CTQ) visual parameters and test criteria.'],
      ['3. Boundary Sample Differentiation:', 'Fast distinction of borderline OK vs NG physical samples.'],
    ],
    closeLabel: 'Close',
  },
  {
    id: 'st4', no: '04', theme: 'rose', icon: LineChart,
    title: 'COPQ & Quality Awareness',
    modalTitle: 'COPQ & Quality Awareness Station',
    subtitle: 'Scrap loss, internal re-work cost & customer trust',
    badge: { text: 'Locked', tone: 'locked' },
    statusLabel: 'Prerequisite Requirement:',
    status: { text: 'Locked (Complete St. 2 first)', cls: 'text-rose-700 bg-rose-100' },
    sectionTitle: 'Course Curriculum Highlights:',
    items: [
      ['1. COPQ (Cost of Poor Quality):', 'Scrap cost multipliers, rework hours, and yield drop calculation.'],
      ['2. Customer Impact Case Studies:', 'Analysis of market field-returns, defect escapes, and brand risk.'],
      ['3. Stop-Call-Wait Protocol:', 'Immediate machine escalation drill whenever 2 consecutive anomalies occur.'],
    ],
    closeLabel: 'Back to Home',
  },
  {
    id: 'st5', no: '05', theme: 'teal', icon: ShieldCheck,
    title: 'Safety Mind & 5S Station',
    modalTitle: 'Safety Mind & 5S Station',
    subtitle: 'Seiri, Seiton, PPE compliance & safety protocols',
    badge: { text: 'Locked', tone: 'locked' },
    statusLabel: 'Prerequisite Requirement:',
    status: { text: 'Locked (Final Certification)', cls: 'text-teal-700 bg-teal-100' },
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
      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
        <span>Standards &amp; Vision</span>
        <ChevronRight size={12} className="text-slate-400" />
      </div>
    </button>
  )
}

function StationCard({ station, onOpen }) {
  const t = THEMES[station.theme]
  const Icon = station.icon
  return (
    <article
      className={`flex min-h-[88px] flex-1 basis-0 items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2 shadow-xs transition ${t.hover}`}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border ${t.iconBox}`}>
          <Icon size={28} />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-400">#{station.no}</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${BADGES[station.badge.tone]}`}>
              {station.badge.text}
            </span>
          </div>
          <h2 className="line-clamp-2 text-base font-bold leading-snug text-slate-900">{station.title}</h2>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{station.subtitle}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(station.id)}
        className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-white transition active:scale-95 ${t.btn}`}
      >
        More detail
        <ChevronRight size={14} />
      </button>
    </article>
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

function DojoModal({ onClose }) {
  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center justify-between bg-slate-900 p-4 text-white">
        <div>
          <h3 className="text-sm font-bold">What is LDNA DOJO?</h3>
          <p className="text-[11px] text-slate-400">Technical Manufacturing Training Center</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="px-2 text-slate-300 hover:text-white">
          <X size={18} />
        </button>
      </div>
      <div className="space-y-3 overflow-y-auto p-4 text-xs text-slate-700">
        <p className="leading-relaxed">
          <strong>LDNA DOJO</strong> is a standardized training methodology and physical simulator designed to
          cultivate zero-defect mindsets, operational dexterity, and rigorous adherence to standard operating
          procedures before operators enter live cleanroom lines.
        </p>
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-xs font-bold text-slate-900">Core Objectives:</h4>
          <ul className="list-disc space-y-1 pl-4 text-slate-600">
            <li><strong>Zero Escape:</strong> Detect and intercept defects at the station of origin.</li>
            <li><strong>Standardized Motion:</strong> Eliminate micro-waste and ergonomic variance.</li>
            <li><strong>Verification Competency:</strong> Calibrate eye acuity for optical limit samples (OK vs NG).</li>
          </ul>
        </div>
      </div>
      <div className="flex justify-end border-t border-slate-200 bg-slate-100 p-3">
        <button onClick={onClose} className="rounded bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white">
          Understood
        </button>
      </div>
    </Sheet>
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
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {station.footerNote ? (
          <span className="font-mono text-[11px] text-slate-500">{station.footerNote}</span>
        ) : (
          <span />
        )}
        <button onClick={onClose} className={`rounded px-4 py-1.5 text-xs font-semibold text-white ${t.btn}`}>
          {station.closeLabel}
        </button>
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
