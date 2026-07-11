import React, { useMemo, useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import {
  LayoutGrid, CalendarDays, ListOrdered, Activity, Layers, Circle, Plus, TrendingUp, X, Percent, DollarSign, Wallet,
  ChevronLeft, ChevronRight,
} from "lucide-react";

/* =========================================================================
   CONFIGURACIÓN  ── aquí conectas tu cuenta y tu Supabase
   ========================================================================= */
const CONFIG = {
  cuenta: "AXI · XAUUSD.sa",
  modo: "Demo · M15",
  balanceInicial: 10000,          // saldo de referencia para convertir % <-> USD
  dataSource: "demo",             // "demo"  |  "supabase"
  supabase: {
    url: "",                      // https://XXXX.supabase.co
    anonKey: "",                  // eyJhbGciOi...
    tabla: "operaciones",
  },
};

/* Lee de Supabase (REST, sin instalar nada -> funciona en Vercel).
   La tabla debe tener: fecha, simbolo, tf, direccion, estructura, pct, usd */
async function fetchSupabase() {
  const { url, anonKey, tabla } = CONFIG.supabase;
  const r = await fetch(`${url}/rest/v1/${tabla}?select=*&order=fecha.asc`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!r.ok) throw new Error("Supabase " + r.status);
  const rows = await r.json();
  return rows.map((row) => {
    const pct = Number(row.pct) || 0;
    const usd = row.usd != null ? Number(row.usd) : (pct / 100) * CONFIG.balanceInicial;
    const d = String(row.fecha).slice(0, 10);
    return {
      id: row.id, date: d, month: +d.slice(5, 7) - 1, day: +d.slice(8, 10),
      dir: row.direccion || "BUY", estructura: row.estructura || "barato",
      tf: row.tf || "5m", pct, usd,
      resultado: pct > 0 ? "Ganada" : pct < 0 ? "Perdida" : "BE",
    };
  });
}

/* =========================================================================
   PALETA (azul estilo TraderWaves) + helpers
   ========================================================================= */
const C = {
  bg: "#0A0D13", panel: "#10151F", panel2: "#141B27", border: "#1E2733",
  text: "#E6EBF2", sub: "#8A94A6", faint: "#5A6474",
  blue: "#3B82F6", blueSoft: "rgba(59,130,246,0.16)",
  red: "#F0564E", redSoft: "rgba(240,86,78,0.16)",
  gold: "#E3B341", green: "#2ED47A", be: "#6E8BA0",
};
const money = (n) => (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const moneyK = (n) => (n < 0 ? "-$" : "$") + Math.abs(n).toFixed(0);
const pctf = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
const pctK = (n) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
const tone = (n) => (n > 0 ? C.blue : n < 0 ? C.red : C.be);

/* =========================================================================
   DATOS DEMO  (modelo real: %, USD, BUY/SELL, barato/caro, tf, BE)
   ========================================================================= */
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function generateTrades() {
  const r = rng(20260706);
  const tfs = ["5m", "15m", "30m", "H1"], estr = ["barato", "caro"];
  const plan = [{ m: 1, n: 30, b: 0.9 }, { m: 2, n: 42, b: -0.1 }, { m: 3, n: 36, b: 0.7 }, { m: 4, n: 28, b: -0.25 }, { m: 5, n: 26, b: -0.35 }, { m: 6, n: 20, b: 0.6, max: 6 }];
  const out = []; let id = 1;
  plan.forEach(({ m, n, b, max }) => {
    const last = max || new Date(2026, m + 1, 0).getDate();
    for (let i = 0; i < n; i++) {
      const day = 1 + Math.floor(r() * last);
      const dow = new Date(2026, m, day).getDay(); if (dow === 0 || dow === 6) continue;
      const roll = r(); const win = roll < 0.5 + b * 0.08; const be = !win && r() < 0.12;
      const pct = be ? 0 : win ? +(1.8 + r() * 0.5).toFixed(2) : -(0.9 + r() * 0.2);
      const usd = +((pct / 100) * CONFIG.balanceInicial * (0.9 + r() * 0.2)).toFixed(2);
      const date = `2026-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      out.push({
        id: id++, date, month: m, day,
        dir: r() > 0.5 ? "BUY" : "SELL", estructura: estr[r() > 0.5 ? 0 : 1],
        tf: tfs[Math.floor(r() * tfs.length)],
        pct: +pct.toFixed(2), usd, resultado: be ? "BE" : win ? "Ganada" : "Perdida",
      });
    }
  });
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/* =========================================================================
   AGREGACIONES (calcula % y USD a la vez)
   ========================================================================= */
function useAgg(trades, unit) {
  return useMemo(() => {
    const isM = unit === "$"; const V = (t) => (isM ? t.usd : t.pct);
    const byDay = {}, byMonth = {};
    let wins = 0, losses = 0, gW = 0, gL = 0, netUsd = 0, netPct = 0;
    trades.forEach((t) => {
      byDay[t.date] = byDay[t.date] || { pct: 0, usd: 0, n: 0 };
      byDay[t.date].pct += t.pct; byDay[t.date].usd += t.usd; byDay[t.date].n++;
      byMonth[t.month] = byMonth[t.month] || { pct: 0, usd: 0, n: 0 };
      byMonth[t.month].pct += t.pct; byMonth[t.month].usd += t.usd; byMonth[t.month].n++;
      netUsd += t.usd; netPct += t.pct;
      if (t.resultado === "Ganada") { wins++; gW += V(t); }
      else if (t.resultado === "Perdida") { losses++; gL += Math.abs(V(t)); }
    });
    const days = Object.values(byDay);
    const winDays = days.filter((d) => (isM ? d.usd : d.pct) >= 0).length;
    const winRateDaily = days.length ? (winDays / days.length) * 100 : 0;
    const winRate = wins + losses ? (wins / (wins + losses)) * 100 : 0;
    const avgWinDay = days.filter((d) => (isM ? d.usd : d.pct) >= 0).reduce((s, d) => s + (isM ? d.usd : d.pct), 0) / Math.max(1, winDays);
    const avgLossDay = Math.abs(days.filter((d) => (isM ? d.usd : d.pct) < 0).reduce((s, d) => s + (isM ? d.usd : d.pct), 0)) / Math.max(1, days.length - winDays);
    const pf = gL ? gW / gL : gW > 0 ? 99 : 0;
    const net = isM ? netUsd : netPct;
    const expectancy = trades.length ? net / trades.length : 0;

    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
    let cum = 0; const equity = sorted.map((t, i) => { cum += V(t); return { i, v: +cum.toFixed(2) }; });
    let peak = 0, maxDD = 0; equity.forEach((p) => { peak = Math.max(peak, p.v); maxDD = Math.max(maxDD, peak - p.v); });
    let cw = 0, cl = 0, bw = 0, bl = 0;
    sorted.forEach((t) => { if (t.resultado === "Ganada") { cw++; cl = 0; bw = Math.max(bw, cw); } else if (t.resultado === "Perdida") { cl++; cw = 0; bl = Math.max(bl, cl); } });

    const dailySeries = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).map(([d, v]) => ({ date: d.slice(5), v: +(isM ? v.usd : v.pct).toFixed(2) }));

    return {
      byDay, byMonth, netUsd, netPct, net, winRate, winRateDaily, avgWinDay, avgLossDay,
      pf, expectancy, maxDD, bw, bl, wins, losses, nTrades: trades.length, gW, gL, equity, dailySeries, isM,
    };
  }, [trades, unit]);
}

/* =========================================================================
   PIEZAS
   ========================================================================= */
function Card({ children, style, title, right }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, ...style }}>
      {(title || right) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: C.sub, letterSpacing: 0.5, fontWeight: 600, textTransform: "uppercase" }}>{title}</span>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}
function Gauge({ value }) {
  const p = Math.max(0, Math.min(100, value)); const R = 52, cx = 70, cy = 66; const a = Math.PI * (1 - p / 100);
  const x = cx + R * Math.cos(a), y = cy - R * Math.sin(a); const c = p >= 50 ? C.blue : C.red;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="140" height="80" viewBox="0 0 140 80">
        <path d="M18 66 A52 52 0 0 1 122 66" fill="none" stroke={C.border} strokeWidth="10" strokeLinecap="round" />
        <path d={`M18 66 A52 52 0 0 1 ${x} ${y}`} fill="none" stroke={c} strokeWidth="10" strokeLinecap="round" />
      </svg>
      <div style={{ marginTop: -8, fontSize: 26, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{p.toFixed(1)}%</div>
    </div>
  );
}
function fmtBoth(usd, pct, isM) {
  return isM
    ? { big: money(usd), small: pctf(pct) }
    : { big: pctf(pct), small: money(usd) };
}

/* Calendario con total semanal */
function CalendarMonth({ year, month, byDay, isM }) {
  const first = new Date(year, month, 1); const startDow = (first.getDay() + 6) % 7;
  const dim = new Date(year, month + 1, 0).getDate(); const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const weeks = []; for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const dn = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
  const key = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const short = (v) => (isM ? moneyK(v) : pctK(v));
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr) 0.85fr", gap: 6, marginBottom: 6 }}>
        {dn.map((n) => <div key={n} style={{ fontSize: 11, color: C.faint, textAlign: "center", textTransform: "uppercase" }}>{n}</div>)}
        <div style={{ fontSize: 11, color: C.faint, textAlign: "center" }}>Sem</div>
      </div>
      {weeks.map((w, wi) => {
        const wt = w.reduce((s, d) => (d ? s + (byDay[key(d)]?.[isM ? "usd" : "pct"] || 0) : s), 0);
        const wc = w.reduce((s, d) => (d ? s + (byDay[key(d)]?.n || 0) : s), 0);
        return (
          <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr) 0.85fr", gap: 6, marginBottom: 6 }}>
            {w.map((d, di) => {
              if (!d) return <div key={di} />;
              const info = byDay[key(d)]; const v = info ? info[isM ? "usd" : "pct"] : 0; const has = !!info;
              return (
                <div key={di} style={{ minHeight: 56, borderRadius: 8, padding: "6px 8px", background: has ? (v >= 0 ? C.blueSoft : C.redSoft) : C.panel2, border: `1px solid ${has ? (v >= 0 ? "rgba(59,130,246,.35)" : "rgba(240,86,78,.35)") : C.border}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: C.faint }}>{d}</span>
                  {has && <div><div style={{ fontSize: 12, fontWeight: 700, color: tone(v) }}>{short(v)}</div><div style={{ fontSize: 9, color: C.faint }}>{info.n} ops</div></div>}
                </div>
              );
            })}
            <div style={{ borderRadius: 8, padding: "6px 8px", background: C.bg, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: wc ? tone(wt) : C.faint }}>{wc ? short(wt) : "—"}</div>
              <div style={{ fontSize: 9, color: C.faint }}>{wc} ops</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Calendario NAVEGABLE: flechas ‹ › para moverse entre meses y botón Hoy */
const MESES_FULL = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function NavigableCalendar({ byDay, isM }) {
  const hoy = new Date();
  const [ym, setYm] = useState({ y: hoy.getFullYear(), m: hoy.getMonth() });
  const mover = (d) => setYm(({ y, m }) => {
    const nm = m + d;
    return { y: y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
  });
  const btn = {
    background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.sub, cursor: "pointer", padding: "4px 8px",
    display: "flex", alignItems: "center",
  };
  return (
    <Card
      title={`${MESES_FULL[ym.m]} ${ym.y}`}
      right={
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={() => mover(-1)} style={btn} title="Mes anterior"><ChevronLeft size={15} /></button>
          <button onClick={() => setYm({ y: hoy.getFullYear(), m: hoy.getMonth() })} style={{ ...btn, fontSize: 11, fontWeight: 600 }}>Hoy</button>
          <button onClick={() => mover(1)} style={btn} title="Mes siguiente"><ChevronRight size={15} /></button>
        </div>
      }
    >
      <CalendarMonth year={ym.y} month={ym.m} byDay={byDay} isM={isM} />
    </Card>
  );
}

function Kpi({ label, big, small, tone: tn }) {
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ fontSize: 11, color: C.sub, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 21, fontWeight: 700, color: tn || C.text, fontVariantNumeric: "tabular-nums" }}>{big}</div>
      {small && <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{small}</div>}
    </Card>
  );
}

/* =========================================================================
   APP
   ========================================================================= */
export default function App() {
  const [tab, setTab] = useState("panel");
  const [unit, setUnit] = useState("$");           // "$" | "%"
  const [showAdd, setShowAdd] = useState(false);
  const [base, setBase] = useState([]);
  const [extra, setExtra] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => { (async () => {
    try {
      if (CONFIG.dataSource === "supabase") setBase(await fetchSupabase());
      else setBase(generateTrades());
    } catch (e) { setErr(e.message); setBase(generateTrades()); }
    setLoading(false);
  })(); }, []);

  const trades = useMemo(() => [...base, ...extra], [base, extra]);
  const A = useAgg(trades, unit);
  const isM = unit === "$";
  const equityNow = CONFIG.balanceInicial + A.netUsd;

  const nav = [
    { id: "panel", label: "Panel", icon: LayoutGrid },
    { id: "calendario", label: "Calendario", icon: CalendarDays },
    { id: "operaciones", label: "Operaciones", icon: ListOrdered },
    { id: "metricas", label: "Métricas", icon: Activity },
    { id: "analisis", label: "Análisis", icon: Layers },
  ];

  return (
    <div style={{ display: "flex", minHeight: 720, background: C.bg, color: C.text, fontFamily: "Inter, system-ui, sans-serif", fontSize: 14 }}>
      {/* SIDEBAR */}
      <aside style={{ width: 190, background: C.panel, borderRight: `1px solid ${C.border}`, padding: "18px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 18px" }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: C.gold }} />
          <span style={{ fontWeight: 800, letterSpacing: 1, fontSize: 14 }}>BITÁCORA<span style={{ color: C.gold }}>·</span>XAU</span>
        </div>
        <div style={{ fontSize: 10, color: C.faint, padding: "0 8px 6px", letterSpacing: 1 }}>PANEL</div>
        {nav.map((n) => { const I = n.icon; const on = tab === n.id;
          return (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: on ? C.blueSoft : "transparent", color: on ? C.blue : C.sub, fontWeight: on ? 600 : 500, fontSize: 13, textAlign: "left" }}>
              <I size={16} /> {n.label}
            </button>
          );
        })}
        <div style={{ marginTop: "auto", padding: 10, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: C.faint, display: "flex", alignItems: "center", gap: 5 }}><Wallet size={12} /> EQUITY</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 3, color: tone(A.netUsd) }}>{money(equityNow)}</div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: 20, overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 12px" }}>
            <Circle size={9} fill={C.green} color={C.green} />
            <span style={{ fontWeight: 600 }}>{CONFIG.cuenta}</span>
            <span style={{ fontSize: 11, color: C.faint }}>{CONFIG.modo}</span>
            <span style={{ fontSize: 10, color: CONFIG.dataSource === "supabase" ? C.green : C.gold, border: `1px solid ${C.border}`, borderRadius: 6, padding: "2px 6px", marginLeft: 4 }}>
              {CONFIG.dataSource === "supabase" ? "Supabase" : "Demo"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
              {["$", "%"].map((u) => (
                <button key={u} onClick={() => setUnit(u)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", border: "none", cursor: "pointer", background: unit === u ? C.blueSoft : "transparent", color: unit === u ? C.blue : C.sub, fontWeight: 600, fontSize: 13 }}>
                  {u === "$" ? <DollarSign size={13} /> : <Percent size={13} />} {u === "$" ? "USD" : "%"}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.gold, color: "#1a1408", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
              <Plus size={15} /> Registrar
            </button>
          </div>
        </div>

        {err && <div style={{ marginBottom: 12, padding: 10, background: C.redSoft, border: `1px solid ${C.red}`, borderRadius: 8, fontSize: 12, color: C.red }}>Supabase: {err} — mostrando datos demo.</div>}
        {loading ? <div style={{ padding: 40, color: C.sub }}>Cargando…</div> : (
          <>
            {tab === "panel" && <Panel A={A} isM={isM} />}
            {tab === "calendario" && <NavigableCalendar byDay={A.byDay} isM={isM} />}
            {tab === "operaciones" && <TradeTable trades={[...trades].reverse()} isM={isM} onDelete={(id) => setExtra((e) => e.filter((x) => x.id !== id))} />}
            {tab === "metricas" && <Metrics A={A} />}
            {tab === "analisis" && <Analisis trades={trades} isM={isM} />}
          </>
        )}
      </main>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSave={(t) => { setExtra((e) => [...e, t]); setShowAdd(false); }} />}
    </div>
  );
}

/* ---------- PANEL ---------- */
function Panel({ A, isM }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
        <Kpi label="P&L Neto" big={isM ? money(A.netUsd) : pctf(A.netPct)} small={isM ? pctf(A.netPct) : money(A.netUsd)} tone={tone(A.net)} />
        <Kpi label="Profit Factor" big={A.pf.toFixed(2)} small="ganancia / pérdida" tone={A.pf >= 1 ? C.blue : C.red} />
        <Kpi label="Win Rate" big={`${A.winRate.toFixed(1)}%`} small={`${A.wins}G · ${A.losses}P`} />
        <Kpi label="Expectancy" big={isM ? money(A.expectancy) : pctf(A.expectancy)} small="por operación" tone={tone(A.expectancy)} />
        <Kpi label="Max Drawdown" big={isM ? money(-A.maxDD) : pctf(-A.maxDD)} small="pico a valle" tone={C.red} />
        <Kpi label="Racha" big={`${A.bw}W · ${A.bl}L`} small={`${A.nTrades} operaciones`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.9fr) minmax(0,1fr)", gap: 16 }}>
        <NavigableCalendar byDay={A.byDay} isM={isM} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card title="Win Rate diario"><Gauge value={A.winRateDaily} /></Card>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: C.sub }}>Ganancia / Pérdida prom.</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: A.avgLossDay ? (A.avgWinDay / A.avgLossDay >= 1 ? C.blue : C.red) : C.blue }}>
                {A.avgLossDay ? (A.avgWinDay / A.avgLossDay).toFixed(2) : "—"}
              </span>
            </div>
            <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", background: C.border }}>
              <div style={{ width: `${(A.avgWinDay / (A.avgWinDay + A.avgLossDay || 1)) * 100}%`, background: C.blue }} />
              <div style={{ flex: 1, background: C.red }} />
            </div>
          </Card>
          <Card title="P&L Neto Diario">
            <div style={{ fontSize: 22, fontWeight: 800, color: tone(A.net), marginBottom: 8 }}>{isM ? money(A.netUsd) : pctf(A.netPct)}</div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={A.dailySeries}>
                <XAxis dataKey="date" hide /><ReferenceLine y={0} stroke={C.border} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,.03)" }} contentStyle={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v) => [isM ? money(v) : pctf(v), "P&L"]} />
                <Bar dataKey="v" radius={[2, 2, 0, 0]}>{A.dailySeries.map((d, i) => <Cell key={i} fill={d.v >= 0 ? C.blue : C.red} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      <Card title="Curva de capital" right={<span style={{ fontSize: 11, color: C.faint }}>{isM ? "USD acumulado" : "% acumulado"}</span>}>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={A.equity}>
            <defs><linearGradient id="eq" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue} stopOpacity={0.35} /><stop offset="100%" stopColor={C.blue} stopOpacity={0} /></linearGradient></defs>
            <XAxis dataKey="i" hide /><YAxis hide domain={["auto", "auto"]} /><ReferenceLine y={0} stroke={C.border} />
            <Tooltip contentStyle={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v) => [isM ? money(v) : pctf(v), "Capital"]} labelFormatter={() => ""} />
            <Area type="monotone" dataKey="v" stroke={C.blue} strokeWidth={2} fill="url(#eq)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Rendimiento anual · 2026">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(84px,1fr))", gap: 8 }}>
          {MESES.map((m, i) => {
            const info = A.byMonth[i]; const has = !!info; const v = has ? info[isM ? "usd" : "pct"] : 0;
            return (
              <div key={m} style={{ borderRadius: 8, padding: "10px 8px", minHeight: 66, background: has ? (v >= 0 ? C.blueSoft : C.redSoft) : C.panel2, border: `1px solid ${has ? (v >= 0 ? "rgba(59,130,246,.35)" : "rgba(240,86,78,.35)") : C.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.faint, textTransform: "uppercase" }}>{m}</div>
                {has ? <><div style={{ fontSize: 14, fontWeight: 700, color: tone(v), marginTop: 6 }}>{isM ? moneyK(v) : pctK(v)}</div><div style={{ fontSize: 10, color: C.faint }}>{info.n} ops</div></> : <div style={{ fontSize: 16, color: C.border, marginTop: 10 }}>–</div>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ---------- OPERACIONES ---------- */
function TradeTable({ trades, isM, onDelete }) {
  const th = { padding: "10px 12px", fontSize: 11, color: C.sub, textAlign: "left", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 };
  const td = { padding: "10px 12px", fontSize: 13, borderTop: `1px solid ${C.border}` };
  return (
    <Card title={`Operaciones (${trades.length})`}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={th}>Fecha</th><th style={th}>Dir.</th><th style={th}>Estructura</th><th style={th}>TF</th>
            <th style={{ ...th, textAlign: "right" }}>%</th><th style={{ ...th, textAlign: "right" }}>USD</th><th style={th}>Resultado</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {trades.slice(0, 80).map((t) => (
              <tr key={t.id}>
                <td style={{ ...td, color: C.sub }}>{t.date}</td>
                <td style={{ ...td, color: t.dir === "BUY" ? C.blue : C.red, fontWeight: 600 }}>{t.dir}</td>
                <td style={{ ...td, color: C.gold }}>{t.estructura}</td>
                <td style={{ ...td, color: C.sub }}>{t.tf}</td>
                <td style={{ ...td, textAlign: "right", color: tone(t.pct), fontVariantNumeric: "tabular-nums" }}>{pctf(t.pct)}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600, color: tone(t.usd), fontVariantNumeric: "tabular-nums" }}>{money(t.usd)}</td>
                <td style={td}><span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: t.resultado === "Ganada" ? C.blueSoft : t.resultado === "Perdida" ? C.redSoft : "rgba(110,139,160,.16)", color: t.resultado === "Ganada" ? C.blue : t.resultado === "Perdida" ? C.red : C.be }}>{t.resultado}</span></td>
                <td style={td}>{onDelete && <button onClick={() => onDelete(t.id)} style={{ background: "none", border: "none", color: C.faint, cursor: "pointer" }}><X size={14} /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {trades.length > 80 && <div style={{ textAlign: "center", padding: 12, fontSize: 12, color: C.faint }}>Mostrando 80 de {trades.length}</div>}
      </div>
    </Card>
  );
}

/* ---------- MÉTRICAS ---------- */
function Metrics({ A }) {
  const rows = [
    ["P&L neto (USD)", money(A.netUsd)], ["P&L neto (%)", pctf(A.netPct)],
    ["Ganancia bruta", A.isM ? money(A.gW) : pctf(A.gW)], ["Pérdida bruta", A.isM ? money(-A.gL) : pctf(-A.gL)],
    ["Profit factor", A.pf.toFixed(2)], ["Expectancy / op.", A.isM ? money(A.expectancy) : pctf(A.expectancy)],
    ["Win rate (op.)", `${A.winRate.toFixed(1)}%`], ["Win rate (diario)", `${A.winRateDaily.toFixed(1)}%`],
    ["Max drawdown", A.isM ? money(-A.maxDD) : pctf(-A.maxDD)], ["Racha ganadora máx.", `${A.bw} ops`],
    ["Racha perdedora máx.", `${A.bl} ops`], ["Operaciones", A.nTrades],
    ["Ganadas", A.wins], ["Perdidas", A.losses],
  ];
  return (
    <Card title="Resumen de rendimiento">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "11px 6px", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ color: C.sub, fontSize: 13 }}>{k}</span>
            <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{v}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- ANÁLISIS (por estructura / dirección / temporalidad) ---------- */
function Analisis({ trades, isM }) {
  const group = (field) => {
    const map = {};
    trades.forEach((t) => {
      const k = t[field]; map[k] = map[k] || { n: 0, net: 0, w: 0, l: 0, gW: 0, gL: 0 };
      const v = isM ? t.usd : t.pct; map[k].n++; map[k].net += v;
      if (t.resultado === "Ganada") { map[k].w++; map[k].gW += v; } else if (t.resultado === "Perdida") { map[k].l++; map[k].gL += Math.abs(v); }
    });
    return Object.entries(map).map(([k, m]) => ({ k, ...m, wr: m.w + m.l ? (m.w / (m.w + m.l)) * 100 : 0, pf: m.gL ? m.gW / m.gL : m.gW > 0 ? 99 : 0 }));
  };
  const blocks = [["Por estructura", group("estructura")], ["Por dirección", group("dir")], ["Por temporalidad", group("tf")]];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {blocks.map(([title, rows]) => (
        <Card key={title} title={title}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
            {rows.map((r) => (
              <div key={r.k} style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <TrendingUp size={14} color={C.gold} /><span style={{ fontWeight: 700 }}>{r.k}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: C.faint }}>{r.n} ops</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><div style={{ fontSize: 10, color: C.sub }}>P&L</div><div style={{ fontSize: 17, fontWeight: 700, color: tone(r.net) }}>{isM ? money(r.net) : pctf(r.net)}</div></div>
                  <div><div style={{ fontSize: 10, color: C.sub }}>Profit factor</div><div style={{ fontSize: 17, fontWeight: 700, color: r.pf >= 1 ? C.blue : C.red }}>{r.pf.toFixed(2)}</div></div>
                  <div><div style={{ fontSize: 10, color: C.sub }}>Win rate</div><div style={{ fontSize: 15, fontWeight: 600 }}>{r.wr.toFixed(0)}%</div></div>
                  <div><div style={{ fontSize: 10, color: C.sub }}>G / P</div><div style={{ fontSize: 15, fontWeight: 600 }}>{r.w} / {r.l}</div></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ---------- MODAL REGISTRAR ---------- */
function AddModal({ onClose, onSave }) {
  const [f, setF] = useState({ date: "2026-07-06", dir: "BUY", estructura: "barato", tf: "5m", resultado: "Ganada", pct: "2.00" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const sug = (res) => { set("resultado", res); set("pct", res === "Ganada" ? "2.00" : res === "Perdida" ? "-1.00" : "0.00"); };
  const inp = { width: "100%", padding: "9px 10px", background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, outline: "none" };
  const lbl = { fontSize: 11, color: C.sub, marginBottom: 5, display: "block" };
  const chips = (val, key, opts, onPick) => (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {opts.map((o) => <button key={o} onClick={() => (onPick ? onPick(o) : set(key, o))} style={{ padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, background: val === o ? C.blueSoft : C.panel2, color: val === o ? C.blue : C.sub, border: `1px solid ${val === o ? C.blue : C.border}` }}>{o}</button>)}
    </div>
  );
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 440, maxWidth: "94vw", background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Registrar operación</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={lbl}>Fecha</label><input style={inp} type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></div>
          <div><label style={lbl}>Dirección</label>{chips(f.dir, "dir", ["BUY", "SELL"])}</div>
          <div><label style={lbl}>Estructura</label>{chips(f.estructura, "estructura", ["barato", "caro"])}</div>
          <div><label style={lbl}>Temporalidad</label>{chips(f.tf, "tf", ["5m", "15m", "30m", "H1"])}</div>
          <div><label style={lbl}>Resultado</label>{chips(f.resultado, "resultado", ["Ganada", "Perdida", "BE"], sug)}</div>
          <div><label style={lbl}>Resultado %</label><input style={inp} value={f.pct} onChange={(e) => set("pct", e.target.value)} /></div>
        </div>
        <button onClick={() => {
          const pct = parseFloat(f.pct) || 0; const m = parseInt(f.date.slice(5, 7)) - 1;
          onSave({ id: Date.now(), date: f.date, month: m, day: parseInt(f.date.slice(8)), dir: f.dir, estructura: f.estructura, tf: f.tf, pct, usd: +((pct / 100) * CONFIG.balanceInicial).toFixed(2), resultado: pct > 0 ? "Ganada" : pct < 0 ? "Perdida" : "BE" });
        }} style={{ width: "100%", marginTop: 18, padding: 11, background: C.gold, color: "#1a1408", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Guardar operación</button>
      </div>
    </div>
  );
}
