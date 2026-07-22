import React, { useState, useMemo, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

const INK="#1B1B29", PAPER="#FAF8F3", LINE="#E4E0D6", ACCENT="#3D5A80", MUTED="#8A8577";
const RED="#D1495B", YELLOW="#E0A800", GREEN="#5C8001", ROSE="#B5838D";
const CAT_COLORS=["#3D5A80","#98C1D9","#EE6C4D","#8AA399","#C9A227","#6D6875","#B5838D","#5C8001","#E29578","#606C38","#9D8189","#457B9D","#BC6C25","#7D8597"];
const STARTER_CATS=["Sleep","University","Reading","Transportation","Work / Internship","Exercise","Meals","Social / Family","Prayer / Reflection","Chores / Errands","Entertainment","Applications / Career"];
const STORE_KEY="hours-tracker-v2";

const pad=n=>String(n).padStart(2,"0");
// 96 quarter-hour slots, offset by start hour
function buildSlots(startHour){
  return Array.from({length:96},(_,i)=>{
    const totalMin=startHour*60+i*15;
    const sH=Math.floor(totalMin/60)%24,sM=totalMin%60;
    const eMin=totalMin+15,eH=Math.floor(eMin/60)%24,eM=eMin%60;
    return `${pad(sH)}:${pad(sM)}-${pad(eH)}:${pad(eM)}`;
  });
}
const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};
const fmtDate=k=>{const[y,m,dd]=k.split("-").map(Number);return new Date(y,m-1,dd).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});};
const weekStartKey=k=>{const[y,m,dd]=k.split("-").map(Number);const d=new Date(y,m-1,dd);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};
const monthKey=k=>k.slice(0,7);
const yearKey=k=>k.slice(0,4);
const addDaysKey=(k,n)=>{const[y,m,dd]=k.split("-").map(Number);const d=new Date(y,m-1,dd+n);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};
const daysBetween=(a,b)=>{const[ay,am,ad]=a.split("-").map(Number);const[by,bm,bd]=b.split("-").map(Number);return Math.round((new Date(by,bm-1,bd)-new Date(ay,am-1,ad))/86400000);};

function loadStore(){try{const raw=localStorage.getItem(STORE_KEY);if(!raw)return null;return JSON.parse(raw);}catch{return null;}}

export default function TimeTracker(){
  const saved=typeof window!=="undefined"?loadStore():null;
  const [cats,setCats]=useState(saved?.cats||STARTER_CATS);
  const [log,setLog]=useState(saved?.log||{});
  const [goals,setGoals]=useState(saved?.goals||{});
  const [startHour,setStartHour]=useState(typeof saved?.startHour==="number"?saved.startHour:23);
  const [workouts,setWorkouts]=useState(saved?.workouts||{});     // {date: "resistance"|"cardio"}
  const [protein,setProtein]=useState(saved?.protein||{});         // {date: grams}
  const [pMin,setPMin]=useState(typeof saved?.pMin==="number"?saved.pMin:55);
  const [pTarget,setPTarget]=useState(typeof saved?.pTarget==="number"?saved.pTarget:78);
  const [periods,setPeriods]=useState(saved?.periods||{});         // {date:true}
  const [books,setBooks]=useState(saved?.books||[]);               // [{id,title,lang,total,page,status,goal,finishedOn}]
  const [reading,setReading]=useState(saved?.reading||{});         // {date: pagesRead}
  const [nb,setNb]=useState({title:"",lang:"English",total:""});
  const [date,setDate]=useState(todayKey());
  const [active,setActive]=useState((saved?.cats||STARTER_CATS)[0]);
  const [newCat,setNewCat]=useState("");
  const [editCats,setEditCats]=useState(false);
  const [range,setRange]=useState("day");
  const [tab,setTab]=useState("day");
  const [showSettings,setShowSettings]=useState(false);
  const [savedFlash,setSavedFlash]=useState(false);
  const dragRef=useRef(false);
  const fileRef=useRef();

  useEffect(()=>{
    try{
      localStorage.setItem(STORE_KEY,JSON.stringify({cats,log,goals,startHour,workouts,protein,pMin,pTarget,periods,books,reading}));
      setSavedFlash(true);const t=setTimeout(()=>setSavedFlash(false),900);return ()=>clearTimeout(t);
    }catch{}
  },[cats,log,goals,startHour,workouts,protein,pMin,pTarget,periods,books,reading]);

  const SLOTS=useMemo(()=>buildSlots(startHour),[startHour]);
  const dayLog=log[date]||{};
  const logged=Object.keys(dayLog).length;

  const applySlot=slot=>setLog(prev=>{const day={...(prev[date]||{})};day[slot]=active;const next={...prev,[date]:day};return next;});
  const clearSlot=slot=>setLog(prev=>{const day={...(prev[date]||{})};delete day[slot];const next={...prev,[date]:day};if(Object.keys(day).length===0)delete next[date];return next;});
  const toggleSlot=slot=>{const cur=(log[date]||{})[slot];if(cur===active)clearSlot(slot);else applySlot(slot);};
  const addCat=()=>{const c=newCat.trim();if(c&&!cats.includes(c)){setCats([...cats,c]);setActive(c);}setNewCat("");};
  const deleteCat=c=>{
    setCats(prev=>{const next=prev.filter(x=>x!==c);if(active===c)setActive(next[0]||"");return next;});
    setGoals(prev=>{const n={...prev};delete n[c];return n;});
    setLog(prev=>{const n={};for(const d in prev){const day={};for(const s in prev[d]){if(prev[d][s]!==c)day[s]=prev[d][s];}if(Object.keys(day).length)n[d]=day;}return n;});
  };
  const catColor=n=>CAT_COLORS[cats.indexOf(n)%CAT_COLORS.length];
  const shiftDate=n=>setDate(addDaysKey(date,n));

  const loggedDates=useMemo(()=>Object.keys(log).filter(d=>Object.keys(log[d]).length>0).sort(),[log]);
  const daysLogged=loggedDates.length;
  // shared streak: any activity that day counts (time, workout, protein, reading, period)
  const activeDates=useMemo(()=>{
    const s=new Set();
    Object.keys(log).forEach(d=>{if(Object.keys(log[d]).length>0)s.add(d);});
    Object.keys(workouts).forEach(d=>s.add(d));
    Object.keys(protein).forEach(d=>s.add(d));
    Object.keys(reading).forEach(d=>{if(reading[d]>0)s.add(d);});
    return s;
  },[log,workouts,protein,reading]);
  const streak=useMemo(()=>{if(!activeDates.size)return 0;let cur=activeDates.has(todayKey())?todayKey():[...activeDates].sort().pop();let n=0;while(activeDates.has(cur)){n++;cur=addDaysKey(cur,-1);}return n;},[activeDates]);

  const totals=useMemo(()=>{
    const acc={};
    const inRange=k=>range==="day"?k===date:range==="week"?weekStartKey(k)===weekStartKey(date):monthKey(k)===monthKey(date);
    Object.entries(log).forEach(([k,day])=>{if(!inRange(k))return;Object.values(day).forEach(c=>acc[c]=(acc[c]||0)+0.25);});
    return Object.entries(acc).map(([name,hours])=>({name,hours})).sort((a,b)=>b.hours-a.hours);
  },[log,range,date]);
  const totalHours=totals.reduce((s,t)=>s+t.hours,0);

  const weekHours=useMemo(()=>{const acc={};const ws=weekStartKey(date);Object.entries(log).forEach(([k,day])=>{if(weekStartKey(k)!==ws)return;Object.values(day).forEach(c=>acc[c]=(acc[c]||0)+0.25);});return acc;},[log,date]);

  const weeklyTrend=useMemo(()=>{const byWeek={};Object.entries(log).forEach(([k,day])=>{if(monthKey(k)!==monthKey(date))return;const w=weekStartKey(k);Object.values(day).forEach(c=>{byWeek[w]=byWeek[w]||{};byWeek[w][c]=(byWeek[w][c]||0)+0.25;});});return Object.entries(byWeek).sort().map(([w,obj])=>({week:fmtDate(w).replace(/^\w+, /,""),...obj}));},[log,date]);

  // ---- workouts ---- shape: {date:{kind:"resistance"|"cardio", type:string}}
  const wKind=k=>{const w=workouts[k];return w?(typeof w==="string"?w:w.kind):null;};
  const wType=k=>{const w=workouts[k];return w&&typeof w==="object"?w.type:null;};
  const thisWeekWorkouts=useMemo(()=>{const ws=weekStartKey(date);const list=Object.entries(workouts).filter(([k])=>weekStartKey(k)===ws);const kindOf=w=>typeof w==="string"?w:w.kind;return {resistance:list.filter(([,w])=>kindOf(w)==="resistance").length,cardio:list.filter(([,w])=>kindOf(w)==="cardio").length};},[workouts,date]);
  const monthWorkoutDays=useMemo(()=>Object.entries(workouts).filter(([k])=>monthKey(k)===monthKey(date)),[workouts,date]);
  const setWorkoutFull=(k,kind,type)=>setWorkouts(prev=>{const next={...prev};const cur=prev[k];const curKind=cur?(typeof cur==="string"?cur:cur.kind):null;const curType=cur&&typeof cur==="object"?cur.type:null;if(curKind===kind&&curType===type)delete next[k];else next[k]={kind,type};return next;});
  const clearWorkout=k=>setWorkouts(prev=>{const next={...prev};delete next[k];return next;});
  const RES_TYPES=["Upper","Lower","Belly"];const CARDIO_TYPES=["Running","Tennis","Cycling"];

  // ---- protein ----
  const proteinColor=g=>g==null||g===""?LINE:g<pMin?RED:g>=pTarget?GREEN:YELLOW;
  const monthProtein=useMemo(()=>Object.entries(protein).filter(([k])=>monthKey(k)===monthKey(date)).sort().map(([k,g])=>({day:k.slice(8),grams:Number(g)})),[protein,date]);

  // ---- periods ----
  const periodDates=useMemo(()=>Object.keys(periods).filter(k=>periods[k]).sort(),[periods]);
  const cycleInfo=useMemo(()=>{
    if(periodDates.length<2)return null;
    // group consecutive days into period-starts
    const starts=[];let prev=null;
    periodDates.forEach(d=>{if(prev===null||daysBetween(prev,d)>2)starts.push(d);prev=d;});
    if(starts.length<2)return {starts,avg:null,next:null};
    const gaps=[];for(let i=1;i<starts.length;i++)gaps.push(daysBetween(starts[i-1],starts[i]));
    const avg=Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length);
    const next=addDaysKey(starts[starts.length-1],avg);
    return {starts,avg,next};
  },[periodDates]);
  const togglePeriod=k=>setPeriods(prev=>{const next={...prev};if(next[k])delete next[k];else next[k]=true;return next;});

  // ---- reading ----
  const currentBook=books.find(b=>b.status==="reading")||null;
  const readingList=books.filter(b=>b.status==="reading");
  const finishedList=books.filter(b=>b.status==="finished");
  const wantList=books.filter(b=>b.status==="want");
  const booksThisYear=finishedList.filter(b=>b.finishedOn&&yearKey(b.finishedOn)===yearKey(date)).length;
  // pace: avg pages/day over last 14 active reading days
  const pace=useMemo(()=>{
    const entries=Object.entries(reading).filter(([,p])=>p>0).sort();
    if(!entries.length)return null;
    const recent=entries.slice(-14);
    const sum=recent.reduce((a,[,p])=>a+Number(p),0);
    return Math.round(sum/recent.length);
  },[reading]);
  const addBook=()=>{const t=nb.title.trim();if(!t)return;setBooks(b=>[...b,{id:Date.now(),title:t,lang:nb.lang,total:Number(nb.total)||0,page:0,status:"want",goal:20}]);setNb({title:"",lang:"English",total:""});};
  const updateBook=(id,patch)=>setBooks(b=>b.map(x=>x.id===id?{...x,...patch}:x));
  const removeBook=id=>setBooks(b=>b.filter(x=>x.id!==id));
  const logPages=(book,pagesToday)=>{
    const newPage=Math.min(book.total||999999,(book.page||0)+pagesToday);
    updateBook(book.id,{page:newPage, ...(book.total&&newPage>=book.total?{status:"finished",finishedOn:date}:{})});
    setReading(r=>({...r,[date]:(r[date]||0)+pagesToday}));
  };

  const exportData=()=>{const blob=new Blob([JSON.stringify({cats,log,goals,startHour,workouts,protein,pMin,pTarget,periods,books,reading},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`hours-backup-${todayKey()}.json`;a.click();URL.revokeObjectURL(url);};
  const importData=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const p=JSON.parse(r.result);if(p.cats)setCats(p.cats);if(p.log)setLog(p.log);if(p.goals)setGoals(p.goals);if(typeof p.startHour==="number")setStartHour(p.startHour);if(p.workouts)setWorkouts(p.workouts);if(p.protein)setProtein(p.protein);if(typeof p.pMin==="number")setPMin(p.pMin);if(typeof p.pTarget==="number")setPTarget(p.pTarget);if(p.periods)setPeriods(p.periods);if(p.books)setBooks(p.books);if(p.reading)setReading(p.reading);}catch{alert("That file couldn't be read. Pick a backup file.");}};r.readAsText(f);e.target.value="";};

  const goalCats=cats.filter(c=>goals[c]>0);
  const TABS=[["day","Day"],["reading","Reading"],["workout","Workout"],["protein","Protein"],["cycle","Cycle"]];

  // build a month calendar grid for the displayed month
  const monthCalendar=useMemo(()=>{
    const [y,m]=[Number(yearKey(date)),Number(monthKey(date).slice(5))];
    const first=new Date(y,m-1,1);const startPad=(first.getDay()+6)%7;const days=new Date(y,m,0).getDate();
    const cells=[];for(let i=0;i<startPad;i++)cells.push(null);
    for(let d=1;d<=days;d++)cells.push(`${y}-${pad(m)}-${pad(d)}`);
    return cells;
  },[date]);

  return(
    <div style={{minHeight:"100vh",background:PAPER,color:INK,fontFamily:"'Georgia',serif"}}>
      <style>{`
        *{box-sizing:border-box;} .sans{font-family:-apple-system,'Segoe UI',system-ui,sans-serif;} .mono{font-family:'Courier New',monospace;}
        button{cursor:pointer;font-family:inherit;} .slot{transition:background .1s;} .slot:focus-visible,.chip:focus-visible{outline:2px solid ${ACCENT};outline-offset:2px;}
        input:focus-visible,select:focus-visible{outline:2px solid ${ACCENT};}
        @media(prefers-reduced-motion:reduce){.slot{transition:none;}}
      `}</style>
      <div style={{maxWidth:920,margin:"0 auto",padding:"28px 20px 60px"}}>
        <header style={{borderBottom:`1px solid ${LINE}`,paddingBottom:18,marginBottom:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",flexWrap:"wrap",gap:10}}>
            <h1 style={{margin:0,fontSize:28,letterSpacing:"-0.02em"}}>My Day Spent <span className="sans" style={{fontSize:12,color:MUTED,marginLeft:6}}>🔥 {streak}</span><span className="sans" style={{fontSize:11,color:savedFlash?ACCENT:"transparent",transition:"color .3s",marginLeft:8}}>· saved</span></h1>
            <div className="sans" style={{fontSize:12,color:MUTED,display:"flex",gap:14}}>
              <button onClick={()=>setShowSettings(s=>!s)} style={linkBtn}>Settings</button>
              <button onClick={exportData} style={linkBtn}>Backup</button>
              <button onClick={()=>fileRef.current?.click()} style={linkBtn}>Restore</button>
              <input ref={fileRef} type="file" accept="application/json" onChange={importData} style={{display:"none"}}/>
            </div>
          </div>
        </header>

        {/* tabs */}
        <div className="sans" style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
          {TABS.map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{padding:"7px 16px",fontSize:14,borderRadius:8,border:`1px solid ${tab===id?INK:LINE}`,background:tab===id?INK:"transparent",color:tab===id?PAPER:INK}}>{label}</button>
          ))}
        </div>

        {showSettings&&(
          <div className="sans" style={{border:`1px solid ${LINE}`,borderRadius:10,padding:"16px 18px",marginBottom:22,background:"#fff"}}>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:13,fontWeight:600}}>Day starts at</label>
              <div style={{fontSize:11,color:MUTED,margin:"3px 0 8px"}}>Set this to when you go to sleep, so one night stays in one day.</div>
              <select value={startHour} onChange={e=>setStartHour(Number(e.target.value))} style={{padding:"7px 10px",borderRadius:8,border:`1px solid ${LINE}`,fontSize:13,background:PAPER}}>
                {Array.from({length:24},(_,h)=><option key={h} value={h}>{pad(h)}:00</option>)}
              </select>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:13,fontWeight:600}}>Protein thresholds (grams)</label>
              <div style={{fontSize:11,color:MUTED,margin:"3px 0 8px"}}>Below minimum = red · between = yellow · at/above target = green.</div>
              <div style={{display:"flex",gap:14,alignItems:"center"}}>
                <label style={{fontSize:12}}>Min <input type="number" value={pMin} onChange={e=>setPMin(Number(e.target.value))} style={{width:56,padding:"4px 6px",borderRadius:6,border:`1px solid ${LINE}`,marginLeft:4}}/></label>
                <label style={{fontSize:12}}>Target <input type="number" value={pTarget} onChange={e=>setPTarget(Number(e.target.value))} style={{width:56,padding:"4px 6px",borderRadius:6,border:`1px solid ${LINE}`,marginLeft:4}}/></label>
              </div>
            </div>
            <div>
              <label style={{fontSize:13,fontWeight:600}}>Weekly time targets</label>
              <div style={{fontSize:11,color:MUTED,margin:"3px 0 10px"}}>Optional. Set hours-per-week you want to spend on a category (e.g. Reading 5h). A progress bar on the Day tab tracks it. A nudge, not a rule.</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8}}>
                {cats.map(c=>(<div key={c} style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:8,height:8,borderRadius:"50%",background:catColor(c),flexShrink:0}}/><span style={{fontSize:12,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c}</span><input type="number" min="0" step="0.5" value={goals[c]||""} placeholder="—" onChange={e=>setGoals(g=>({...g,[c]:Number(e.target.value)}))} style={{width:52,padding:"4px 6px",borderRadius:6,border:`1px solid ${LINE}`,fontSize:12}}/></div>))}
              </div>
            </div>
          </div>
        )}

        {/* date nav (shared) */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <button onClick={()=>shiftDate(-1)} style={navBtn} aria-label="Previous day">←</button>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:20}}>{fmtDate(date)}</div>
            <div className="mono" style={{fontSize:11,color:MUTED,marginTop:2}}>
              {tab==="day"&&`${logged}/96 slots · ${(logged*0.25).toFixed(2)}h`}
              {tab==="workout"&&`${daysLogged} days tracked`}
              {tab==="protein"&&(protein[date]!=null?`${protein[date]} g today`:"no protein logged")}
              {tab==="cycle"&&(cycleInfo?.avg?`~${cycleInfo.avg}-day cycle`:"log to estimate")}
            </div>
          </div>
          <button onClick={()=>shiftDate(1)} style={navBtn} aria-label="Next day">→</button>
        </div>

        {/* ============ DAY TAB ============ */}
        {tab==="day"&&(<>
          <div className="sans" style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
            {cats.map(c=>(<div key={c} style={{display:"inline-flex",alignItems:"center"}}><button className="chip" onClick={()=>!editCats&&setActive(c)} style={{padding:"6px 12px",borderRadius:editCats?"20px 0 0 20px":20,fontSize:13,border:`1px solid ${active===c&&!editCats?INK:LINE}`,background:active===c&&!editCats?INK:"transparent",color:active===c&&!editCats?PAPER:INK,display:"flex",alignItems:"center",gap:7}}><span style={{width:9,height:9,borderRadius:"50%",background:catColor(c),display:"inline-block"}}/>{c}</button>{editCats&&<button onClick={()=>{if(confirm(`Delete "${c}"? This removes it from any logged time.`))deleteCat(c);}} aria-label={`Delete ${c}`} style={{padding:"6px 9px",borderRadius:"0 20px 20px 0",border:`1px solid ${LINE}`,borderLeft:"none",background:"#fff",color:RED,fontSize:13}}>✕</button>}</div>))}
            <button onClick={()=>setEditCats(e=>!e)} className="sans" style={{padding:"6px 12px",borderRadius:20,fontSize:12,border:`1px solid ${LINE}`,background:editCats?INK:"transparent",color:editCats?PAPER:MUTED}}>{editCats?"Done":"Edit"}</button>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <input value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCat()} placeholder="add category" className="sans" style={{padding:"6px 10px",borderRadius:20,fontSize:13,border:`1px dashed ${LINE}`,background:"transparent",color:INK,width:130}}/>
              <button onClick={addCat} style={{...navBtn,width:32,height:32,fontSize:18,borderRadius:"50%"}} aria-label="Add category">+</button>
            </div>
          </div>
          <p className="sans" style={{margin:"0 0 12px",fontSize:12,color:MUTED}}>Tap a category, then tap or drag across the quarter-hours you spent on it. Tap a filled slot again to clear it.</p>
          <div onMouseLeave={()=>dragRef.current=false} style={{border:`1px solid ${LINE}`,borderRadius:10,overflow:"hidden",marginBottom:30,background:"#fff"}}>
            {Array.from({length:24},(_,row)=>{
              const idx=row*4;const label=SLOTS[idx].split("-")[0];
              return(<div key={row} style={{display:"grid",gridTemplateColumns:"52px repeat(4,1fr)",borderTop:row?`1px solid ${LINE}`:"none"}}>
                <div className="mono" style={{fontSize:10,color:MUTED,display:"flex",alignItems:"center",justifyContent:"center",background:PAPER}}>{label}</div>
                {[0,1,2,3].map(q=>{const slot=SLOTS[idx+q];const c=dayLog[slot];return(
                  <button key={slot} className="slot"
                    onMouseDown={()=>{dragRef.current=true;toggleSlot(slot);}}
                    onMouseEnter={()=>{if(dragRef.current)applySlot(slot);}}
                    onMouseUp={()=>dragRef.current=false}
                    onClick={()=>{}} title={`${slot}${c?` · ${c}`:""}`}
                    style={{border:"none",borderLeft:`1px solid ${LINE}`,height:28,background:c?catColor(c):"transparent",color:c?"#fff":"transparent",fontSize:9,fontFamily:"-apple-system,sans-serif",textAlign:"left",padding:"0 6px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c||""}</button>
                );})}
              </div>);
            })}
          </div>
          {goalCats.length>0&&(<div style={{marginBottom:34}}><h2 style={{margin:"0 0 14px",fontSize:22}}>This week's goals</h2><div className="sans" style={{display:"grid",gap:12}}>{goalCats.map(c=>{const have=weekHours[c]||0,want=goals[c],pct=Math.min(100,(have/want)*100);return(<div key={c}><div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}><span style={{display:"flex",alignItems:"center",gap:7}}><span style={{width:9,height:9,borderRadius:"50%",background:catColor(c)}}/>{c}</span><span className="mono" style={{color:MUTED}}>{have.toFixed(1)} / {want}h</span></div><div style={{height:8,borderRadius:5,background:LINE,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:catColor(c),borderRadius:5,transition:"width .3s"}}/></div></div>);})}</div></div>)}
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}><h2 style={{margin:0,fontSize:22}}>Where the time went</h2><div className="sans" style={{display:"flex",gap:6}}>{["day","week","month"].map(r=>(<button key={r} onClick={()=>setRange(r)} style={{padding:"5px 12px",fontSize:12,borderRadius:6,textTransform:"capitalize",border:`1px solid ${range===r?ACCENT:LINE}`,background:range===r?ACCENT:"transparent",color:range===r?"#fff":INK}}>{r}</button>))}</div></div>
          {totalHours===0?(<div className="sans" style={{padding:"40px 20px",textAlign:"center",color:MUTED,border:`1px dashed ${LINE}`,borderRadius:10}}>Nothing logged for this {range} yet. Tap some slots above to begin.</div>):(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:24}}><div style={{height:260}}><ResponsiveContainer><PieChart><Pie data={totals} dataKey="hours" nameKey="name" innerRadius={45} outerRadius={90} paddingAngle={1}>{totals.map((t,i)=><Cell key={i} fill={catColor(t.name)}/>)}</Pie><Tooltip formatter={v=>`${v}h`}/></PieChart></ResponsiveContainer></div><div style={{height:260}}><ResponsiveContainer><BarChart data={totals} layout="vertical" margin={{left:8,right:16}}><XAxis type="number" tick={{fontSize:11}}/><YAxis type="category" dataKey="name" width={110} tick={{fontSize:11}}/><Tooltip formatter={v=>`${v}h`}/><Bar dataKey="hours" radius={[0,4,4,0]}>{totals.map((t,i)=><Cell key={i} fill={catColor(t.name)}/>)}</Bar></BarChart></ResponsiveContainer></div></div>)}
          {weeklyTrend.length>1&&(<div style={{marginTop:36}}><h2 style={{margin:"0 0 14px",fontSize:22}}>Weekly trend · {monthKey(date)}</h2><div style={{height:280}}><ResponsiveContainer><BarChart data={weeklyTrend} margin={{left:0,right:16}}><XAxis dataKey="week" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip formatter={v=>`${v}h`}/><Legend wrapperStyle={{fontSize:11}}/>{cats.map(c=><Bar key={c} dataKey={c} stackId="a" fill={catColor(c)}/>)}</BarChart></ResponsiveContainer></div></div>)}
        </>)}

        {/* ============ READING TAB ============ */}
        {tab==="reading"&&(<>
          {currentBook?(()=>{
            const b=currentBook;const pct=b.total?Math.min(100,Math.round((b.page/b.total)*100)):0;
            const remaining=b.total?Math.max(0,b.total-b.page):null;
            const perDay=pace||b.goal||20;
            const eta=remaining!=null&&perDay>0?Math.ceil(remaining/perDay):null;
            return(
              <div style={{border:`1px solid ${LINE}`,borderRadius:12,padding:"18px 20px",background:"#fff",marginBottom:26}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                  <div><div style={{fontSize:11,color:MUTED,letterSpacing:"0.05em"}} className="sans">NOW READING</div><h2 style={{margin:"2px 0 0",fontSize:22}}>{b.title}</h2><div className="sans" style={{fontSize:12,color:MUTED}}>{b.lang}</div></div>
                  <span className="sans" style={{fontSize:24,fontWeight:700,color:ACCENT}}>{pct}%</span>
                </div>
                <div style={{height:12,borderRadius:7,background:LINE,overflow:"hidden",margin:"14px 0 6px"}}><div style={{width:`${pct}%`,height:"100%",background:ACCENT,borderRadius:7,transition:"width .3s"}}/></div>
                <div className="sans" style={{fontSize:12,color:MUTED,marginBottom:16}}>Page {b.page} / {b.total||"?"}</div>
                <div className="sans" style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:12}}>
                  <span style={{fontSize:13}}>Log pages read today:</span>
                  <input type="number" min="1" id="pagesIn" placeholder="e.g. 20" style={{width:80,padding:"7px 9px",borderRadius:8,border:`1px solid ${LINE}`,fontSize:14}}/>
                  <button onClick={()=>{const el=document.getElementById("pagesIn");const v=Number(el.value);if(v>0){logPages(b,v);el.value="";}}} style={{padding:"7px 16px",borderRadius:8,border:"none",background:INK,color:PAPER,fontSize:13}}>Add</button>
                </div>
                <div className="sans" style={{display:"flex",gap:18,fontSize:12,color:MUTED,alignItems:"center"}}>
                  <span>Daily goal: <input type="number" value={b.goal||""} onChange={e=>updateBook(b.id,{goal:Number(e.target.value)})} style={{width:46,padding:"3px 5px",borderRadius:5,border:`1px solid ${LINE}`,fontSize:12}}/> pages</span>
                  {eta!=null&&<span>⏱️ ~{eta} days left at {perDay}/day</span>}
                </div>
              </div>
            );
          })():(<div className="sans" style={{padding:"30px",textAlign:"center",color:MUTED,border:`1px dashed ${LINE}`,borderRadius:10,marginBottom:26}}>No book in progress. Add one below and tap "Start reading".</div>)}

          <div className="sans" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:28}}>
            <Stat label="Reading pace" value={pace?`${pace}`:"—"} sub="pages/day"/>
            <Stat label="Books this year" value={`${booksThisYear}`} sub="finished"/>
            <Stat label="On the shelf" value={`${books.length}`} sub="total"/>
          </div>

          {readingList.length>0&&<Shelf title="Currently reading" books={readingList} accent={ACCENT} onFinish={b=>updateBook(b.id,{status:"finished",finishedOn:date})} onRemove={removeBook} updateBook={updateBook}/>}
          {wantList.length>0&&<Shelf title="Want to read" books={wantList} accent={MUTED} onStart={b=>updateBook(b.id,{status:"reading"})} onRemove={removeBook}/>}
          {finishedList.length>0&&<Shelf title="Finished" books={finishedList} accent={GREEN} onRemove={removeBook} finished/>}

          <div style={{border:`1px solid ${LINE}`,borderRadius:10,padding:"14px 16px",background:"#fff",marginTop:20}}>
            <div className="sans" style={{fontSize:13,fontWeight:600,marginBottom:10}}>Add a book</div>
            <div className="sans" style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              <input value={nb.title} onChange={e=>setNb({...nb,title:e.target.value})} placeholder="Title" style={{flex:"2 1 160px",padding:"8px 10px",borderRadius:8,border:`1px solid ${LINE}`,fontSize:13}}/>
              <select value={nb.lang} onChange={e=>setNb({...nb,lang:e.target.value})} style={{padding:"8px 10px",borderRadius:8,border:`1px solid ${LINE}`,fontSize:13,background:PAPER}}><option>English</option><option>Arabic</option></select>
              <input type="number" value={nb.total} onChange={e=>setNb({...nb,total:e.target.value})} placeholder="Pages" style={{width:80,padding:"8px 10px",borderRadius:8,border:`1px solid ${LINE}`,fontSize:13}}/>
              <button onClick={addBook} style={{padding:"8px 18px",borderRadius:8,border:"none",background:INK,color:PAPER,fontSize:13}}>Add</button>
            </div>
          </div>
        </>)}

        {/* ============ WORKOUT TAB ============ */}
        {tab==="workout"&&(<>
          <div style={{marginBottom:24}}>
            <h2 style={{margin:"0 0 6px",fontSize:22}}>Log {fmtDate(date)}</h2>
            <p className="sans" style={{margin:"0 0 12px",fontSize:12,color:MUTED}}>Pick a resistance or cardio type. Tap the same one again to clear the day.</p>
            <div className="sans" style={{marginBottom:12}}>
              <div style={{fontSize:12,color:MUTED,marginBottom:6}}>💪 Resistance</div>
              <div style={{display:"flex",gap:8}}>
                {RES_TYPES.map(tp=>{const on=wKind(date)==="resistance"&&wType(date)===tp;return(<button key={tp} onClick={()=>setWorkoutFull(date,"resistance",tp)} style={{flex:1,padding:"14px 8px",borderRadius:10,fontSize:14,border:`1px solid ${on?ACCENT:LINE}`,background:on?ACCENT:"#fff",color:on?"#fff":INK}}>{tp}</button>);})}
              </div>
            </div>
            <div className="sans">
              <div style={{fontSize:12,color:MUTED,marginBottom:6}}>🏃 Cardio</div>
              <div style={{display:"flex",gap:8}}>
                {CARDIO_TYPES.map(tp=>{const on=wKind(date)==="cardio"&&wType(date)===tp;return(<button key={tp} onClick={()=>setWorkoutFull(date,"cardio",tp)} style={{flex:1,padding:"14px 8px",borderRadius:10,fontSize:14,border:`1px solid ${on?RED:LINE}`,background:on?RED:"#fff",color:on?"#fff":INK}}>{tp}</button>);})}
              </div>
            </div>
            {workouts[date]&&<button onClick={()=>clearWorkout(date)} className="sans" style={{marginTop:10,fontSize:12,color:MUTED,background:"none",border:"none",textDecoration:"underline"}}>clear this day</button>}
          </div>
          <div style={{marginBottom:28}}>
            <h2 style={{margin:"0 0 12px",fontSize:22}}>This week's goal</h2>
            <div className="sans" style={{display:"grid",gap:14}}>
              <Goal label="Resistance" have={thisWeekWorkouts.resistance} want={4} color={ACCENT}/>
              <Goal label="Cardio" have={thisWeekWorkouts.cardio} want={2} color={RED}/>
            </div>
            {thisWeekWorkouts.resistance>=4&&thisWeekWorkouts.cardio>=2&&(<p className="sans" style={{marginTop:12,fontSize:13,color:GREEN,fontWeight:600}}>✓ Weekly goal complete — nice work.</p>)}
          </div>
          <div>
            <h2 style={{margin:"0 0 12px",fontSize:22}}>{monthKey(date)} · gym days</h2>
            <div className="sans" style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5,maxWidth:360}}>
              {["M","T","W","T","F","S","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,color:MUTED,paddingBottom:2}}>{d}</div>)}
              {monthCalendar.map((k,i)=>{
                const kind=k&&wKind(k);const tp=k&&wType(k);
                let bg="transparent"; if(kind==="resistance")bg=ACCENT; else if(kind==="cardio")bg=RED; else if(k)bg="#fff";
                const ttl=k?(kind?`${k} · ${kind}${tp?" ("+tp+")":""}`:k):"";
                const letter=tp?tp[0]:"";
                return(<div key={i} onClick={()=>{if(k)setDate(k);}} title={ttl} style={{aspectRatio:"1",borderRadius:6,border:k?`1px solid ${LINE}`:"none",background:bg,color:kind?"#fff":MUTED,fontSize:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:k?"pointer":"default",lineHeight:1}}>{k?Number(k.slice(8)):""}{letter&&<span style={{fontSize:7,opacity:0.9}}>{letter}</span>}</div>);
              })}
            </div>
            <p className="sans" style={{marginTop:10,fontSize:11,color:MUTED}}><span style={{color:ACCENT}}>■</span> resistance &nbsp; <span style={{color:RED}}>■</span> cardio · {monthWorkoutDays.length} gym days this month · tap a date to open it and set the type</p>
          </div>
        </>)}

        {/* ============ PROTEIN TAB ============ */}
        {tab==="protein"&&(<>
          <div style={{marginBottom:28}}>
            <h2 style={{margin:"0 0 6px",fontSize:22}}>Protein · {fmtDate(date)}</h2>
            <p className="sans" style={{margin:"0 0 14px",fontSize:12,color:MUTED}}>Type today's total grams. The bar fills and colors by your thresholds (min {pMin}g, target {pTarget}g).</p>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <input type="number" min="0" value={protein[date]??""} placeholder="grams" onChange={e=>setProtein(p=>{const v=e.target.value;const next={...p};if(v==="")delete next[date];else next[date]=Number(v);return next;})} className="sans" style={{width:110,padding:"10px 12px",fontSize:18,borderRadius:8,border:`1px solid ${LINE}`}}/>
              <span className="sans" style={{fontSize:13,color:proteinColor(protein[date]),fontWeight:600}}>{protein[date]==null?"—":protein[date]<pMin?"below minimum":protein[date]>=pTarget?"on target":"getting there"}</span>
            </div>
            <div style={{height:22,borderRadius:11,background:LINE,overflow:"hidden",position:"relative"}}>
              <div style={{width:`${Math.min(100,((protein[date]||0)/Math.max(pTarget*1.3,1))*100)}%`,height:"100%",background:proteinColor(protein[date]),borderRadius:11,transition:"width .3s, background .3s"}}/>
            </div>
            <div className="sans" style={{display:"flex",justifyContent:"space-between",fontSize:10,color:MUTED,marginTop:4}}><span>0</span><span>min {pMin}</span><span>target {pTarget}</span></div>
          </div>
          <div>
            <h2 style={{margin:"0 0 12px",fontSize:22}}>{monthKey(date)} · daily intake</h2>
            {monthProtein.length===0?(<div className="sans" style={{padding:"30px",textAlign:"center",color:MUTED,border:`1px dashed ${LINE}`,borderRadius:10}}>No protein logged this month yet.</div>):(
              <div style={{height:280}}><ResponsiveContainer><LineChart data={monthProtein} margin={{left:0,right:16,top:10}}><XAxis dataKey="day" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip formatter={v=>`${v} g`} labelFormatter={l=>`Day ${l}`}/><ReferenceLine y={pMin} stroke={RED} strokeDasharray="4 4" label={{value:"min",fontSize:10,fill:RED}}/><ReferenceLine y={pTarget} stroke={GREEN} strokeDasharray="4 4" label={{value:"target",fontSize:10,fill:GREEN}}/><Line type="monotone" dataKey="grams" stroke={ACCENT} strokeWidth={2} dot={{r:3}}/></LineChart></ResponsiveContainer></div>
            )}
          </div>
        </>)}

        {/* ============ CYCLE TAB ============ */}
        {tab==="cycle"&&(<>
          <div style={{marginBottom:20}}>
            <h2 style={{margin:"0 0 6px",fontSize:22}}>Period tracker</h2>
            <p className="sans" style={{margin:"0 0 6px",fontSize:12,color:MUTED,lineHeight:1.5}}>Tap the days you're on your period. The estimate below is a rough average of your logged cycles — helpful for awareness, but not a medical or contraceptive predictor. For anything health-related, check with a doctor.</p>
          </div>
          <button onClick={()=>togglePeriod(date)} className="sans" style={{padding:"16px",width:"100%",borderRadius:10,fontSize:15,marginBottom:24,border:`1px solid ${periods[date]?ROSE:LINE}`,background:periods[date]?ROSE:"#fff",color:periods[date]?"#fff":INK}}>{periods[date]?"● On period this day (tap to remove)":"○ Mark this day as period"}</button>
          {cycleInfo&&cycleInfo.avg&&(
            <div className="sans" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
              <div style={{border:`1px solid ${LINE}`,borderRadius:10,padding:"14px",background:"#fff"}}><div style={{fontSize:11,color:MUTED}}>Average cycle</div><div style={{fontSize:26}}>{cycleInfo.avg} <span style={{fontSize:13,color:MUTED}}>days</span></div></div>
              <div style={{border:`1px solid ${LINE}`,borderRadius:10,padding:"14px",background:"#fff"}}><div style={{fontSize:11,color:MUTED}}>Est. next start</div><div style={{fontSize:16,marginTop:4}}>{fmtDate(cycleInfo.next)}</div></div>
            </div>
          )}
          <div>
            <h2 style={{margin:"0 0 12px",fontSize:22}}>{monthKey(date)}</h2>
            <div className="sans" style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5,maxWidth:360}}>
              {["M","T","W","T","F","S","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,color:MUTED,paddingBottom:2}}>{d}</div>)}
              {monthCalendar.map((k,i)=>{
                const on=k&&periods[k];const isNext=k&&cycleInfo?.next===k;
                let brd="none"; if(isNext)brd=`2px dashed ${ROSE}`; else if(k)brd=`1px solid ${LINE}`;
                let bg="transparent"; if(on)bg=ROSE; else if(k)bg="#fff";
                return(<div key={i} onClick={()=>k&&togglePeriod(k)} title={k||""} style={{aspectRatio:"1",borderRadius:6,border:brd,background:bg,color:on?"#fff":MUTED,fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:k?"pointer":"default"}}>{k?Number(k.slice(8)):""}</div>);
              })}
            </div>
            <p className="sans" style={{marginTop:10,fontSize:11,color:MUTED}}><span style={{color:ROSE}}>■</span> period day &nbsp; <span style={{border:`1px dashed ${ROSE}`,padding:"0 4px"}}>┈</span> estimated next start</p>
          </div>
        </>)}

        <p className="sans" style={{marginTop:44,fontSize:11,color:MUTED,borderTop:`1px solid ${LINE}`,paddingTop:16,lineHeight:1.6}}>Data saves automatically in this browser. Tap <strong>Backup</strong> now and then to save a file; <strong>Restore</strong> brings it back on a new phone or after clearing your browser.</p>
      </div>
    </div>
  );
}

function Goal({label,have,want,color}){
  const pct=Math.min(100,(have/want)*100);
  return(<div><div style={{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:5}}><span>{label}</span><span className="mono" style={{color:have>=want?"#5C8001":MUTED}}>{have} / {want}</span></div><div style={{height:10,borderRadius:6,background:LINE,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:6,transition:"width .3s"}}/></div></div>);
}
function Stat({label,value,sub}){
  return(<div style={{border:`1px solid ${LINE}`,borderRadius:10,padding:"12px 10px",background:"#fff",textAlign:"center"}}><div style={{fontSize:10,color:MUTED}}>{label}</div><div style={{fontSize:22,margin:"2px 0"}}>{value}</div><div style={{fontSize:10,color:MUTED}}>{sub}</div></div>);
}
function Shelf({title,books,accent,onStart,onFinish,onRemove,updateBook,finished}){
  return(<div style={{marginBottom:22}}>
    <h3 className="sans" style={{margin:"0 0 8px",fontSize:14,color:accent}}>{title} · {books.length}</h3>
    <div style={{display:"grid",gap:8}}>
      {books.map(b=>{const pct=b.total?Math.min(100,Math.round((b.page/b.total)*100)):0;return(
        <div key={b.id} className="sans" style={{border:`1px solid ${LINE}`,borderRadius:9,padding:"10px 12px",background:"#fff"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b.title}</div>
              <div style={{fontSize:11,color:MUTED}}>{b.lang}{finished?` · ${b.total||b.page} pages`:b.total?` · page ${b.page}/${b.total} · ${pct}%`:` · ${b.page} pages`}</div>
            </div>
            {onStart&&<button onClick={()=>onStart(b)} style={{padding:"5px 10px",fontSize:12,borderRadius:6,border:`1px solid ${LINE}`,background:"#fff"}}>Start</button>}
            {onFinish&&<button onClick={()=>onFinish(b)} style={{padding:"5px 10px",fontSize:12,borderRadius:6,border:`1px solid ${LINE}`,background:"#fff"}}>Finish</button>}
            <button onClick={()=>onRemove(b.id)} aria-label="Remove" style={{padding:"5px 8px",fontSize:12,borderRadius:6,border:`1px solid ${LINE}`,background:"#fff",color:MUTED}}>✕</button>
          </div>
          {!finished&&b.total>0&&(<div style={{height:7,borderRadius:5,background:LINE,overflow:"hidden",marginTop:8}}><div style={{width:`${pct}%`,height:"100%",background:GREEN,borderRadius:5,transition:"width .3s"}}/></div>)}
        </div>
      );})}
    </div>
  </div>);
}
const linkBtn={background:"none",border:"none",color:"#3D5A80",fontSize:12,textDecoration:"underline",padding:0};
const navBtn={width:40,height:40,borderRadius:10,border:"1px solid #E4E0D6",background:"#fff",fontSize:18,color:"#1B1B29",display:"flex",alignItems:"center",justifyContent:"center"};
