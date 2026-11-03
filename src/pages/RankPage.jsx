import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { getRank } from "../api/rankApi";
import { errorText } from "../lib/errorText";
import { loadSession } from "../lib/session";
import Avatar from "../components/Avatar";

const PAGE = 100;
const MAX = 500;

// id "speed" ใช้ต่อได้ เพราะใน SQL ถือเป็นชื่อแทนของ 'finish' (ครบก่อน)
const TABS = [
  { id: "points", label: "คะแนน" },
  { id: "speed", label: "ครบก่อน" },
];

const chipColor = (rank) =>
  rank === 1
    ? "bg-gold text-ink"
    : rank === 2
      ? "bg-slate-300 text-ink"
      : rank === 3
        ? "bg-amber-700 text-white"
        : "bg-slate-100 text-slate-600";

// วันเวลาที่ครบ เป็นเวลาไทย เช่น "3 พ.ย. 14:20"
const finishFormatter = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function formatFinish(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = Object.fromEntries(
    finishFormatter.formatToParts(d).map((x) => [x.type, x.value]),
  );
  return `${p.day} ${p.month} ${p.hour}:${p.minute}`;
}

export default function RankPage() {
  const [sort, setSort] = useState("points");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  // พารามิเตอร์ของคำขอที่ข้อมูลชุดปัจจุบันมาจาก — ใช้ derive สถานะ loading
  // (ไม่เก็บ loading เป็น state เพื่อเลี่ยง setState sync ใน effect)
  const [loadedFor, setLoadedFor] = useState(null);
  const reqId = useRef(0);
  const me = useMemo(() => loadSession().empNo, []);

  // loading = พารามิเตอร์ปัจจุบัน ยังไม่ตรงกับที่โหลดมา
  const loading =
    !loadedFor ||
    loadedFor.sort !== sort ||
    loadedFor.search !== search ||
    loadedFor.limit !== limit ||
    loadedFor.reloadKey !== reloadKey;

  // รอผู้ใช้พิมพ์ค้นหาเสร็จ 0.3 วินาทีก่อนค่อยเรียก backend
  // (รีเซ็ตจำนวนแถวเฉพาะเมื่อคำค้นเปลี่ยนจริง ไม่งั้นปุ่ม "แสดงเพิ่ม" จะถูกรีเซ็ตเอง)
  const searchRef = useRef("");
  useEffect(() => {
    const t = setTimeout(() => {
      const next = query.trim();
      if (next === searchRef.current) return;
      searchRef.current = next;
      setSearch(next);
      setLimit(PAGE);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // โหลดข้อมูล (ถ้ามีคำขอใหม่ซ้อนเข้ามา ผลของคำขอเก่าจะถูกทิ้ง)
  useEffect(() => {
    const id = ++reqId.current;
    const params = { sort, search, limit, reloadKey };
    getRank({ sort, search, limit }).then((r) => {
      if (id !== reqId.current) return;
      // setLoadedFor ใน .then (async) ไม่ผิดกฎ set-state-in-effect
      setLoadedFor(params);
      if (r.ok) {
        setData(r);
        setError("");
      } else {
        setError(errorText(r));
      }
    });
  }, [sort, search, limit, reloadKey]);

  // กลับมาเปิดแท็บ/แอปอีกครั้งให้โหลดข้อมูลล่าสุด
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setReloadKey((k) => k + 1);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  function changeSort(id) {
    setSort(id);
    setLimit(PAGE);
  }

  const rows = data?.rows ?? [];
  const isFinish = sort === "speed";
  const canMore = rows.length >= limit && limit < MAX;

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-10 space-y-3 bg-paper px-4 pb-3 pt-4">
        <div
          role="tablist"
          aria-label="เรียงอันดับตาม"
          className="grid grid-cols-2 rounded-xl bg-slate-200 p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={sort === t.id}
              aria-controls="rank-panel"
              onClick={() => changeSort(t.id)}
              className={`rounded-lg py-2 text-sm font-bold transition ${
                sort === t.id ? "bg-white text-ink shadow-sm" : "text-slate-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="ค้นหาด้วยรหัสพนักงานหรือชื่อ"
            placeholder="ค้นหารหัสพนักงานหรือชื่อ"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30"
          />
        </div>
      </div>

      <section
        id="rank-panel"
        role="tabpanel"
        aria-labelledby={`tab-${sort}`}
        aria-busy={loading}
        className="px-4"
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <p className="text-sm text-slate-500">
            {isFinish
              ? "เฉพาะคนที่ผ่านครบทุกสถานี เรียงตามเวลาที่ผ่านสถานีสุดท้าย ครบก่อนอยู่บนสุด"
              : "เรียงตามคะแนนเพิ่ม แสดงเฉพาะคนที่ผ่านอย่างน้อย 1 สถานี"}
            {data ? ` (${data.total_ranked} คน)` : ""}
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            disabled={loading}
            aria-label="อัปเดตอันดับ"
            className="shrink-0 rounded-full p-1.5 text-blue-700 disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={loading ? "animate-spin" : ""}
              aria-hidden="true"
            />
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200"
          >
            {error}
          </p>
        )}

        {!data && !error && (
          <p className="py-10 text-center text-sm text-slate-500">กำลังโหลด…</p>
        )}

        {data && rows.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            {search
              ? `ไม่พบ "${search}" ในอันดับนี้`
              : isFinish
                ? "ยังไม่มีใครผ่านครบทุกสถานี"
                : "ยังไม่มีใครผ่านสถานี"}
          </p>
        )}

        {rows.length > 0 && (
          <ol
            className={`divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-opacity ${loading ? "opacity-60" : ""}`}
          >
            {rows.map((r) => {
              const mine = me && r.emp_no === me;
              return (
                <li
                  key={r.emp_no}
                  className={`flex items-center gap-3 px-3 py-3 ${mine ? "bg-blue-50" : ""}`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${chipColor(r.rank)}`}
                  >
                    {r.rank}
                  </span>
                  <Avatar empNo={r.emp_no} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">
                      {r.name}
                      {mine && (
                        <span className="ml-2 rounded-full bg-blue-700 px-2 py-0.5 align-middle text-[11px] font-bold text-white">
                          คุณ
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {r.dept_code} · {r.emp_no}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {isFinish ? (
                      <>
                        <p className="text-[11px] text-slate-500">ครบเมื่อ</p>
                        <p className="mt-0.5 text-sm font-bold leading-none text-ink">
                          {formatFinish(r.last_passed_at)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-base font-extrabold leading-none text-ink">
                          {r.points}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          ผ่าน {r.passed_count} สถานี
                        </p>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {canMore && (
          <button
            type="button"
            onClick={() => setLimit((l) => Math.min(l + PAGE, MAX))}
            className="mt-4 w-full rounded-xl bg-white py-3 text-sm font-bold text-blue-700 shadow-sm ring-1 ring-slate-200"
          >
            แสดงเพิ่ม
          </button>
        )}
      </section>
    </div>
  );
}
