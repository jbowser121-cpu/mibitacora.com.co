import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { LogIn, LogOut, Plus, Download, Copy, Check, ChevronLeft, ChevronRight, X, BookOpen, Mail } from "lucide-react";

/* ============================================================
   PEGA AQUI TUS DOS DATOS DE SUPABASE
   ============================================================ */
const SUPABASE_URL = "https://ishvzrvtgrxmaeudmtqn.supabase.co";   
const SUPABASE_KEY = "sb_publishable_KSbc7DjuTcZNfCqCUoyGqA_OQLuGkXy"; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ============================ estilos ============================ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
*{box-sizing:border-box}
.bp-root{
  --ink:#14110B; --panel:#1E1A12; --panel2:#231E15; --line:#342E20;
  --gold:#E0B341; --golddim:#9A7B2E; --parch:#EDE4CF; --muted:#9C927C;
  --win:#5FBE85; --loss:#D9624E; --be:#6E8BA0;
  background:var(--ink); color:var(--parch);
  font-family:'Space Grotesk',system-ui,sans-serif;
  min-height:100vh; width:100%;
}
.bp-mono{font-family:'JetBrains Mono',ui-monospace,monospace}
.bp-wrap{max-width:1040px;margin:0 auto;padding:28px 20px 64px}
.bp-eyebrow{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:var(--golddim)}
.bp-h1{font-size:30px;font-weight:700;letter-spacing:-.01em;margin:6px 0 0;line-height:1.05}
.bp-card{background:var(--panel);border:1px solid var(--line);border-radius:14px}
.bp-tape{display:flex;align-items:baseline;gap:18px;flex-wrap:wrap;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:14px 0;margin:18px 0}
.bp-stat{display:flex;flex-direction:column;gap:2px}
.bp-stat .v{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;letter-spacing:-.02em}
.bp-stat .l{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.bp-btn{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:13px;border-radius:9px;padding:9px 14px;border:1px solid var(--line);background:var(--panel2);color:var(--parch);cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:.15s}
.bp-btn:hover{border-color:var(--golddim)}
.bp-btn:disabled{opacity:.5;cursor:default}
.bp-btn.gold{background:var(--gold);color:#1a1407;border-color:var(--gold)}
.bp-btn.gold:hover{filter:brightness(1.06)}
.bp-link{background:none;border:none;color:var(--golddim);font-size:12px;cursor:pointer;text-decoration:underline;font-family:inherit;padding:0}
.bp-input{width:100%;background:var(--ink);border:1px solid var(--line);border-radius:9px;color:var(--parch);padding:10px 12px;font-family:'JetBrains Mono',monospace;font-size:14px;outline:none}
.bp-input:focus{border-color:var(--gold)}
.bp-label{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;display:block}
.bp-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.bp-dow{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);text-align:center;padding:4px 0}
.bp-day{aspect-ratio:1;border:1px solid var(--line);border-radius:9px;padding:7px 8px;display:flex;flex-direction:column;justify-content:space-between;background:var(--panel2);min-height:0}
.bp-day.empty{background:transparent;border-color:transparent}
.bp-day .dn{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted)}
.bp-day .pct{font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;letter-spacing:-.02em}
.bp-day .cnt{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.bp-pill{font-family:'JetBrains Mono',monospace;font-size:11px;padding:2px 8px;border-radius:99px;border:1px solid var(--line)}
.bp-row{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-bottom:1px solid var(--line)}
.bp-row:last-child{border-bottom:none}
.bp-overlay{position:fixed;inset:0;background:rgba(8,6,3,.72);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50}
.bp-note{font-size:12px;color:var(--muted);line-height:1.5}
.bp-tag{display:inline-flex;align-items:center;gap:5px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--golddim);border:1px solid var(--line);border-radius:7px;padding:3px 8px}
.bp-msg{font-size:13px;border-radius:9px;padding:10px 12px;margin-bottom:14px;line-height:1.5}
.bp-msg.ok{background:rgba(95,190,133,.12);border:1px solid rgba(95,190,133,.4);color:var(--win)}
.bp-msg.err{background:rgba(217,98,78,.12);border:1px solid rgba(217,98,78,.4);color:var(--loss)}
@media(max-width:560px){.bp-h1{font-size:24px}.bp-day{padding:5px}.bp-day .pct{font-size:12px}}
`;

/* ============================ indicador MT5 (descarga) ============================ */
const MQL5 = `//+------------------------------------------------------------------+
//|  TP Flotante - Patron (educativo)                                |
//|  Dibuja Entrada, SL, BE (1:1) y TP (1:2) desde tu entrada        |
//+------------------------------------------------------------------+
#property indicator_chart_window
#property indicator_plots 0

input double Entrada  = 0.0;    // Entrada (0 = precio actual)
input double SL       = 0.0;    // Stop Loss
input bool   EsCompra = true;   // true=COMPRA, false=VENTA
input double RatioTP  = 2.0;    // TP en R (1:2)
input double RatioBE  = 1.0;    // BE en R (1:1)

int OnInit(){ return(INIT_SUCCEEDED); }

void Linea(string n,double p,color c,string t){
  if(ObjectFind(0,n)<0) ObjectCreate(0,n,OBJ_HLINE,0,0,p);
  ObjectSetDouble(0,n,OBJPROP_PRICE,p);
  ObjectSetInteger(0,n,OBJPROP_COLOR,c);
  ObjectSetInteger(0,n,OBJPROP_WIDTH,2);
  ObjectSetString(0,n,OBJPROP_TEXT,t);
}

int OnCalculate(const int rt,const int pc,const datetime &t[],
  const double &o[],const double &h[],const double &l[],
  const double &cl[],const long &tv[],const long &v[],const int &sp[]){
  if(SL<=0) return(rt);
  double e = (Entrada>0)? Entrada : cl[rt-1];
  double r = MathAbs(e-SL);
  double tp,be;
  if(EsCompra){ tp=e+r*RatioTP; be=e+r*RatioBE; }
  else        { tp=e-r*RatioTP; be=e-r*RatioBE; }
  Linea("PAT_ENTRADA",e, clrGold,      "Entrada");
  Linea("PAT_SL",     SL,clrTomato,    "SL");
  Linea("PAT_BE",     be,clrSkyBlue,   "BE 1:1");
  Linea("PAT_TP",     tp,clrLimeGreen, "TP 1:2");
  return(rt);
}

void OnDeinit(const int reason){
  ObjectDelete(0,"PAT_ENTRADA"); ObjectDelete(0,"PAT_SL");
  ObjectDelete(0,"PAT_BE");      ObjectDelete(0,"PAT_TP");
}`;

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DOW = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"];
const hoy = () => new Date().toISOString().slice(0,10);
const configOK = !SUPABASE_URL.startsWith("PEGA_") && !SUPABASE_KEY.startsWith("PEGA_");

export default function App(){
  const [session,setSession] = useState(null);
  const [ready,setReady] = useState(false);
  const [trades,setTrades] = useState([]);
  const [cargandoDatos,setCargandoDatos] = useState(false);
  const [cursor,setCursor] = useState(()=>{ const d=new Date(); return {y:d.getFullYear(),m:d.getMonth()}; });
  const [showAdd,setShowAdd] = useState(false);
  const [tab,setTab] = useState("bitacora");

  useEffect(()=>{
    if(!configOK){ setReady(true); return; }
    supabase.auth.getSession().then(({data})=>{ setSession(data.session); setReady(true); });
    const { data:sub } = supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=> sub.subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session){ setTrades([]); return; }
    cargarTrades();
  },[session]);

  const cargarTrades = async ()=>{
    setCargandoDatos(true);
    const { data, error } = await supabase.from("operaciones").select("*").order("fecha",{ascending:false});
    if(!error && data) setTrades(data);
    setCargandoDatos(false);
  };

  const agregarTrade = async (t)=>{
    const fila = { fecha:t.fecha, simbolo:t.simbolo, tf:t.tf, direccion:t.direccion, estructura:t.estructura, resultado:t.resultado, pct:Number(t.pct)||0 };
    const { data, error } = await supabase.from("operaciones").insert(fila).select();
    if(!error && data) setTrades(prev=>[data[0],...prev]);
  };

  const borrarTrade = async (id)=>{
    const { error } = await supabase.from("operaciones").delete().eq("id",id);
    if(!error) setTrades(prev=>prev.filter(x=>x.id!==id));
  };

  const monthTrades = useMemo(()=> trades.filter(t=>{
    const d = new Date(t.fecha+"T00:00:00");
    return d.getFullYear()===cursor.y && d.getMonth()===cursor.m;
  }), [trades,cursor]);

  const stats = useMemo(()=>{
    const n = monthTrades.length;
    const wins = monthTrades.filter(t=>t.resultado==="Ganada").length;
    const losses = monthTrades.filter(t=>t.resultado==="Perdida").length;
    const net = monthTrades.reduce((s,t)=>s+(Number(t.pct)||0),0);
    const wr = (wins+losses)>0 ? (wins/(wins+losses)*100) : 0;
    return { n, wins, losses, net, wr };
  },[monthTrades]);

  const byDay = useMemo(()=>{
    const map = {};
    monthTrades.forEach(t=>{
      const day = new Date(t.fecha+"T00:00:00").getDate();
      if(!map[day]) map[day]={count:0,net:0};
      map[day].count++; map[day].net += (Number(t.pct)||0);
    });
    return map;
  },[monthTrades]);

  if(!configOK) return <Shell><ConfigFaltante/></Shell>;
  if(!ready) return <Shell><div className="bp-wrap"><p className="bp-note">Cargando…</p></div></Shell>;
  if(!session) return <Gate/>;

  const first = new Date(cursor.y,cursor.m,1);
  const startDow = (first.getDay()+6)%7;
  const days = new Date(cursor.y,cursor.m+1,0).getDate();
  const cells = [];
  for(let i=0;i<startDow;i++) cells.push(null);
  for(let d=1;d<=days;d++) cells.push(d);

  const moveMonth = (dir)=> setCursor(c=>{
    let m=c.m+dir, y=c.y; if(m<0){m=11;y--;} if(m>11){m=0;y++;} return {y,m};
  });

  return (
    <Shell>
      <div className="bp-wrap">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
          <div>
            <div className="bp-eyebrow">Bitácora · Patrón Institucional</div>
            <h1 className="bp-h1">Registro de operaciones</h1>
            <div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}>
              <span className="bp-tag"><BookOpen size={12}/> XAUUSD</span>
              <span className="bp-tag">TP 1:2 · BE 1:1</span>
              <span className="bp-tag"><Mail size={12}/> {session.user.email}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="bp-btn" onClick={()=>setTab(tab==="bitacora"?"descargas":"bitacora")}>
              {tab==="bitacora" ? <><Download size={15}/> Descargas</> : <><BookOpen size={15}/> Bitácora</>}
            </button>
            <button className="bp-btn" onClick={()=>supabase.auth.signOut()}><LogOut size={15}/> Salir</button>
          </div>
        </div>

        {tab==="bitacora" ? (
          <>
            <div className="bp-tape">
              <div className="bp-stat"><span className="v" style={{color:"var(--gold)"}}>{stats.n}</span><span className="l">Entradas mes</span></div>
              <div className="bp-stat"><span className="v">{stats.wr.toFixed(0)}%</span><span className="l">Aciertos</span></div>
              <div className="bp-stat"><span className="v" style={{color:"var(--win)"}}>{stats.wins}</span><span className="l">Ganadas</span></div>
              <div className="bp-stat"><span className="v" style={{color:"var(--loss)"}}>{stats.losses}</span><span className="l">Perdidas</span></div>
              <div className="bp-stat">
                <span className="v" style={{color: stats.net>0?"var(--win)":stats.net<0?"var(--loss)":"var(--parch)"}}>
                  {stats.net>0?"+":""}{stats.net.toFixed(2)}%
                </span>
                <span className="l">Resultado neto</span>
              </div>
            </div>

            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"4px 0 14px"}}>
              <button className="bp-btn" onClick={()=>moveMonth(-1)}><ChevronLeft size={16}/></button>
              <div style={{fontWeight:600,fontSize:18}} className="bp-mono">{MESES[cursor.m]} {cursor.y}</div>
              <div style={{display:"flex",gap:8}}>
                <button className="bp-btn" onClick={()=>moveMonth(1)}><ChevronRight size={16}/></button>
                <button className="bp-btn gold" onClick={()=>setShowAdd(true)}><Plus size={16}/> Registrar</button>
              </div>
            </div>

            <div className="bp-grid" style={{marginBottom:8}}>
              {DOW.map(d=><div key={d} className="bp-dow">{d}</div>)}
            </div>
            <div className="bp-grid">
              {cells.map((d,i)=>{
                if(d===null) return <div key={i} className="bp-day empty"/>;
                const info = byDay[d];
                const col = !info ? "var(--muted)" : info.net>0?"var(--win)":info.net<0?"var(--loss)":"var(--be)";
                return (
                  <div key={i} className="bp-day" style={info?{borderColor:col+"55"}:{}}>
                    <span className="dn">{d}</span>
                    {info ? (
                      <div>
                        <div className="pct" style={{color:col}}>{info.net>0?"+":""}{info.net.toFixed(1)}%</div>
                        <div className="cnt">{info.count} {info.count===1?"entrada":"entradas"}</div>
                      </div>
                    ) : <div className="cnt" style={{opacity:.4}}>—</div>}
                  </div>
                );
              })}
            </div>

            <div className="bp-card" style={{marginTop:22}}>
              <div className="bp-row" style={{color:"var(--muted)",fontSize:11,letterSpacing:".12em",textTransform:"uppercase"}}>
                <span>Detalle del mes</span><span>{cargandoDatos?"cargando…":monthTrades.length+" registros"}</span>
              </div>
              {monthTrades.length===0 ? (
                <div style={{padding:"22px 14px"}} className="bp-note">{cargandoDatos?"Trayendo tus datos de la nube…":"Aún no hay entradas este mes. Pulsa “Registrar” cuando el bot mande una señal y anota su resultado."}</div>
              ) : (
                [...monthTrades].sort((a,b)=>a.fecha<b.fecha?1:-1).map(t=>(
                  <div key={t.id} className="bp-row">
                    <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                      <span className="bp-mono" style={{fontSize:12,color:"var(--muted)"}}>{t.fecha}</span>
                      <span className="bp-pill" style={{color:t.direccion==="SELL"?"var(--loss)":"var(--win)"}}>{t.direccion}</span>
                      <span className="bp-pill">{t.tf}</span>
                      <span className="bp-pill" style={{color:"var(--golddim)"}}>{t.estructura}</span>
                    </div>
                    <div style={{display:"flex",gap:12,alignItems:"center"}}>
                      <span className="bp-mono" style={{fontWeight:700,color:(Number(t.pct)||0)>0?"var(--win)":(Number(t.pct)||0)<0?"var(--loss)":"var(--be)"}}>
                        {(Number(t.pct)||0)>0?"+":""}{(Number(t.pct)||0).toFixed(2)}%
                      </span>
                      <button className="bp-btn" style={{padding:"5px 8px"}} onClick={()=>borrarTrade(t.id)}><X size={13}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <p className="bp-note" style={{marginTop:14}}>
              Tus datos se guardan en la nube (Supabase) y solo tú los ves. Puedes abrir esta bitácora desde cualquier dispositivo con tu correo y contraseña.
            </p>
          </>
        ) : (
          <Descargas/>
        )}
      </div>

      {showAdd && <AddForm onClose={()=>setShowAdd(false)} onSave={async (t)=>{ await agregarTrade(t); setShowAdd(false); }} />}
    </Shell>
  );
}

function Shell({children}){
  return <div className="bp-root"><style>{CSS}</style>{children}</div>;
}

/* ============================ aviso si faltan credenciales ============================ */
function ConfigFaltante(){
  return (
    <div className="bp-wrap" style={{maxWidth:520,paddingTop:80}}>
      <div className="bp-eyebrow">Configuración</div>
      <h1 className="bp-h1" style={{marginBottom:10}}>Falta pegar tus datos de Supabase</h1>
      <div className="bp-card" style={{padding:20}}>
        <p className="bp-note" style={{marginBottom:10}}>Abre el archivo <span className="bp-mono">src/App.jsx</span> y, arriba del todo, reemplaza:</p>
        <pre className="bp-mono" style={{background:"var(--ink)",border:"1px solid var(--line)",borderRadius:10,padding:14,fontSize:12,color:"var(--parch)",overflow:"auto"}}>{`const SUPABASE_URL = "https://....supabase.co";
const SUPABASE_KEY = "sb_publishable_....";`}</pre>
        <p className="bp-note" style={{marginTop:10}}>Guarda el archivo y la página se conectará sola.</p>
      </div>
    </div>
  );
}

/* ============================ login / registro / recuperar ============================ */
function Gate(){
  const [modo,setModo] = useState("entrar"); // entrar | registrar | recuperar
  const [email,setEmail] = useState(""); const [pass,setPass] = useState("");
  const [busy,setBusy] = useState(false);
  const [err,setErr] = useState(""); const [ok,setOk] = useState("");

  const limpiar = ()=>{ setErr(""); setOk(""); };

  const entrar = async ()=>{
    limpiar(); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email:email.trim(), password:pass });
    setBusy(false);
    if(error){
      if(/Email not confirmed/i.test(error.message)) return setErr("Aún no confirmas tu correo. Revisa tu bandeja (y spam) y haz clic en el enlace.");
      return setErr("Correo o contraseña incorrectos.");
    }
  };

  const registrar = async ()=>{
    limpiar();
    if(pass.length<6) return setErr("La contraseña debe tener al menos 6 caracteres.");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email:email.trim(), password:pass });
    setBusy(false);
    if(error) return setErr(error.message);
    if(data.user && !data.session){
      setOk("¡Listo! Te enviamos un correo de confirmación. Ábrelo, haz clic en el enlace y luego entra aquí.");
      setModo("entrar");
    }
  };

  const recuperar = async ()=>{
    limpiar();
    if(!email.trim()) return setErr("Escribe tu correo para enviarte el enlace de recuperación.");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    setBusy(false);
    if(error) return setErr(error.message);
    setOk("Te enviamos un correo para restablecer tu contraseña. Revisa tu bandeja (y spam).");
  };

  const titulo = modo==="registrar" ? "Crear tu cuenta" : modo==="recuperar" ? "Recuperar contraseña" : "Entrar a tu bitácora";
  const sub = modo==="registrar" ? "Regístrate con tu correo. Te enviaremos un enlace de confirmación."
            : modo==="recuperar" ? "Te enviaremos un enlace a tu correo para crear una nueva contraseña."
            : "Ingresa con tu correo y contraseña.";

  return (
    <Shell>
      <div className="bp-wrap" style={{maxWidth:420,paddingTop:70}}>
        <div className="bp-eyebrow">Patrón Institucional</div>
        <h1 className="bp-h1" style={{marginBottom:4}}>{titulo}</h1>
        <p className="bp-note" style={{marginBottom:22}}>{sub}</p>
        <div className="bp-card" style={{padding:20}}>
          {ok && <div className="bp-msg ok">{ok}</div>}
          {err && <div className="bp-msg err">{err}</div>}

          <label className="bp-label">Correo electrónico</label>
          <input className="bp-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" style={{marginBottom:14}}/>

          {modo!=="recuperar" && <>
            <label className="bp-label">Contraseña</label>
            <input className="bp-input" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••" style={{marginBottom:18}}
              onKeyDown={e=>{ if(e.key==="Enter") (modo==="registrar"?registrar():entrar()); }}/>
          </>}

          {modo==="entrar" && <>
            <button className="bp-btn gold" disabled={busy} style={{width:"100%",justifyContent:"center"}} onClick={entrar}>
              <LogIn size={16}/> {busy?"Entrando…":"Entrar"}
            </button>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:14}}>
              <button className="bp-link" onClick={()=>{limpiar();setModo("registrar");}}>Crear cuenta nueva</button>
              <button className="bp-link" onClick={()=>{limpiar();setModo("recuperar");}}>Olvidé mi contraseña</button>
            </div>
          </>}

          {modo==="registrar" && <>
            <button className="bp-btn gold" disabled={busy} style={{width:"100%",justifyContent:"center"}} onClick={registrar}>
              <Check size={16}/> {busy?"Creando…":"Crear cuenta"}
            </button>
            <div style={{marginTop:14,textAlign:"center"}}>
              <button className="bp-link" onClick={()=>{limpiar();setModo("entrar");}}>Ya tengo cuenta · Entrar</button>
            </div>
          </>}

          {modo==="recuperar" && <>
            <button className="bp-btn gold" disabled={busy} style={{width:"100%",justifyContent:"center"}} onClick={recuperar}>
              <Mail size={16}/> {busy?"Enviando…":"Enviar enlace"}
            </button>
            <div style={{marginTop:14,textAlign:"center"}}>
              <button className="bp-link" onClick={()=>{limpiar();setModo("entrar");}}>Volver a entrar</button>
            </div>
          </>}
        </div>
        <p className="bp-note" style={{marginTop:16}}>Tus datos quedan guardados de forma segura en la nube y solo tú puedes verlos.</p>
      </div>
    </Shell>
  );
}

/* ============================ formulario ============================ */
function AddForm({onClose,onSave}){
  const [f,setF] = useState({ fecha:hoy(), simbolo:"XAUUSD", tf:"5m", direccion:"BUY", estructura:"barato", resultado:"Ganada", pct:"2.00" });
  const [guardando,setGuardando] = useState(false);
  const set = (k,v)=>setF(s=>({...s,[k]:v}));
  const sugerir = (res)=>{ set("resultado",res); if(res==="Ganada") set("pct","2.00"); else if(res==="Perdida") set("pct","-1.00"); else set("pct","0.00"); };

  const sel = (label,val,key,opts)=>(
    <div>
      <label className="bp-label">{label}</label>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {opts.map(o=>(
          <button key={o} className="bp-btn" style={val===o?{borderColor:"var(--gold)",color:"var(--gold)"}:{}} onClick={()=> key==="resultado"?sugerir(o):set(key,o)}>{o}</button>
        ))}
      </div>
    </div>
  );

  const guardar = async ()=>{ setGuardando(true); await onSave(f); setGuardando(false); };

  return (
    <div className="bp-overlay" onClick={onClose}>
      <div className="bp-card" style={{padding:22,width:"100%",maxWidth:460}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div className="bp-eyebrow">Nueva entrada</div>
          <button className="bp-btn" style={{padding:"6px 9px"}} onClick={onClose}><X size={15}/></button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:140}}>
              <label className="bp-label">Fecha</label>
              <input className="bp-input" type="date" value={f.fecha} onChange={e=>set("fecha",e.target.value)}/>
            </div>
            <div style={{flex:1,minWidth:140}}>
              <label className="bp-label">Símbolo</label>
              <input className="bp-input" value={f.simbolo} onChange={e=>set("simbolo",e.target.value)}/>
            </div>
          </div>
          {sel("Temporalidad",f.tf,"tf",["5m","15m","30m","H1"])}
          {sel("Dirección",f.direccion,"direccion",["BUY","SELL"])}
          {sel("Estructura",f.estructura,"estructura",["barato","caro"])}
          {sel("Resultado",f.resultado,"resultado",["Ganada","Perdida","BE"])}
          <div>
            <label className="bp-label">Resultado %</label>
            <input className="bp-input" type="number" step="0.01" value={f.pct} onChange={e=>set("pct",e.target.value)}/>
          </div>
          <button className="bp-btn gold" disabled={guardando} style={{justifyContent:"center"}} onClick={guardar}><Check size={16}/> {guardando?"Guardando…":"Guardar entrada"}</button>
        </div>
      </div>
    </div>
  );
}

/* ============================ descargas ============================ */
function Descargas(){
  const [copied,setCopied] = useState(false);
  const descargar = ()=>{
    const blob = new Blob([MQL5],{type:"text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="TP_Flotante_Patron.mq5"; a.click();
    URL.revokeObjectURL(url);
  };
  const copiar = async ()=>{ try{ await navigator.clipboard.writeText(MQL5); setCopied(true); setTimeout(()=>setCopied(false),1500);}catch(e){} };

  return (
    <>
      <div className="bp-tape" style={{borderBottom:"none"}}>
        <div className="bp-stat"><span className="v" style={{color:"var(--gold)"}}>MT5</span><span className="l">Compatible con MetaTrader 5</span></div>
      </div>
      <div className="bp-card" style={{padding:22,marginTop:4}}>
        <div className="bp-eyebrow">Indicador</div>
        <h2 style={{fontSize:20,fontWeight:700,margin:"6px 0 6px"}}>Regla de TP flotante</h2>
        <p className="bp-note" style={{marginBottom:16}}>
          Dibuja en tu gráfico las líneas de Entrada, SL, BE (1:1) y TP (1:2) a partir de la entrada y el SL que le indiques. Útil para visualizar el riesgo de cada operación del patrón.
        </p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:18}}>
          <button className="bp-btn gold" onClick={descargar}><Download size={16}/> Descargar .mq5</button>
          <button className="bp-btn" onClick={copiar}>{copied?<><Check size={15}/> Copiado</>:<><Copy size={15}/> Copiar código</>}</button>
        </div>
        <pre className="bp-mono" style={{background:"var(--ink)",border:"1px solid var(--line)",borderRadius:10,padding:14,overflow:"auto",fontSize:11.5,lineHeight:1.55,maxHeight:300,color:"var(--parch)"}}>{MQL5}</pre>
        <div style={{marginTop:16,borderTop:"1px solid var(--line)",paddingTop:14}}>
          <div className="bp-label" style={{marginBottom:8}}>Cómo instalarlo</div>
          <ol className="bp-note" style={{paddingLeft:18,lineHeight:1.7}}>
            <li>MT5 → Archivo → Abrir carpeta de datos → MQL5 → Indicators.</li>
            <li>Pega ahí el archivo <span className="bp-mono">TP_Flotante_Patron.mq5</span>.</li>
            <li>En MetaEditor pulsa Compilar (F7).</li>
            <li>Arrástralo al gráfico y escribe tu Entrada y SL en las opciones.</li>
          </ol>
        </div>
      </div>
    </>
  );
}
