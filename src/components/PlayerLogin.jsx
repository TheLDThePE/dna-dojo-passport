// ฟอร์มเข้าสู่ระบบเทรนเนอร์ของหน้า Player (หน้าตาเดียวกับหน้า Trainer)
const input =
  'mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30'

export default function PlayerLogin({ stations, form, setForm, busy, message, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="p-5">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold">เข้าสู่ระบบเทรนเนอร์</h2>
        <p className="mt-1 text-sm text-slate-500">
          เลือกสถานี ใส่รหัสพนักงานและรหัสผ่าน แล้วให้ผู้เล่นสแกนบัตรทีละคน
        </p>

        <label htmlFor="player-station" className="mt-5 block text-sm font-medium text-slate-600">
          สถานี
        </label>
        <select
          id="player-station"
          value={form.station}
          onChange={(e) => setForm({ ...form, station: e.target.value })}
          className={input}
        >
          {stations.map((s) => (
            <option key={s.code} value={s.code}>
              {s.code} · {s.name}
            </option>
          ))}
        </select>

        <label htmlFor="player-trainer" className="mt-4 block text-sm font-medium text-slate-600">
          รหัสพนักงานของเทรนเนอร์
        </label>
        <input
          id="player-trainer"
          value={form.trainer}
          onChange={(e) => setForm({ ...form, trainer: e.target.value.toUpperCase() })}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={10}
          className={`${input} font-semibold tracking-wider`}
        />

        <label htmlFor="player-password" className="mt-4 block text-sm font-medium text-slate-600">
          รหัสผ่าน
        </label>
        <input
          id="player-password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          autoComplete="off"
          className={input}
        />

        <p role="alert" className="mt-3 min-h-5 text-sm text-red-600">
          {message}
        </p>
        <button
          type="submit"
          disabled={busy || !form.trainer.trim() || !form.password || !form.station}
          className="mt-2 w-full rounded-xl bg-ink py-3 text-base font-bold text-white transition active:scale-[0.99] disabled:opacity-40"
        >
          {busy ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}
        </button>
      </div>
    </form>
  )
}
