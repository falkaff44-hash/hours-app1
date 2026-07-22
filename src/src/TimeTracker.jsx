import React, { useState, useMemo, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const INK="#1B1B29", PAPER="#FAF8F3", LINE="#E4E0D6", ACCENT="#3D5A80", MUTED="#8A8577";
const CAT_COLORS=["#3D5A80","#98C1D9","#EE6C4D","#8AA399","#C9A227","#6D6875","#B5838D","#5C8001","#E29578","#606C38","#9D8189","#457B9D","#BC6C25","#7D8597"];
const STARTER_CATS=["Sleep","University","Reading","Transportation","Work / Internship","Exercise","Meals","Social / Family","Prayer / Reflection","Chores / Errands","Entertainment","Applications / Career"];
const STORE_KEY="hours-tracker-v1";

const pad=n=>String(n).padStart(2,"0");
function buildSlots(startHour){
  return Array.from({length:48},(_,i)=>{
    const totalMin=startHour*60+i*30;
    const sH=Math.floor(totalMin/60)%24,sM=totalMin%60;
    const eMin=totalMin+30,eH=Math.floor(eMin/60)%24,eM=eMin%60;
    return `${pad(sH)}:${pad(sM)}-${pad(eH)}:${pad(eM)}`;
  });
}
const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};
const fmtDate=k=>{const[y,m,dd]=k.split("-").map(Number);return new Date(y,m-1,dd).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});};
const weekStartKey=k=>{const[y,m,dd]=k.split("-").map(Number);const d=new Date(y,m-1,dd);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};
const monthKey=k=>k.slice(0,7);
const addDaysKey=(k,n)=>{const[y,m,dd]=k.split("-").map(Number);const d=new Date(y,m-1,dd+n);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};

function loadStore(){
  try{const raw=localStorage.getItem(STORE_KEY);if(!raw)return null;return JSON.parse(raw);}catch{return null;}
}

export default function TimeTracker(){
  const saved=typeof window!=="undefined"?loadStore():null;
  const [cats,setCats]=useState(saved?.cats||STARTER_CATS);
  const [log,setLog]=useState(saved?.log||{});
  const [goals,setGoals]=useState(saved?.goals||{});
  const [startHour,setStartHour]=useState(typeof saved?.startHour==="number"?saved.startHour:23);
  const [date,setDate]=useState(todayKey());
  const [active,setActive]=useState((saved?.cats||STARTER_CATS)[0]);
  const [newCat,setNewCat]=useState("");
  const [range,setRange]=useState("day");
  const [showSettings,setShowSettings]=useState(false);
  const [savedFlash,setSavedFlash]=useState(false);
  const fileRef=useRef();

  // auto-save on any change
  useEffect(()=>{
    try{
      localStorage.setItem(STORE_KEY,JSON.stringify({cats,log,goals,startHour}));
      setSavedFlash(true);const t=setTimeout(()=>setSavedFlash(false),900);
      return ()=>clearTimeout(t);
    }catch{}
  },[cats,log,goals,startHour]);

  const SLOTS=useMemo(()=>buildSlots(startHour),[startHour]);
  const dayLog=log[date]||{};
  const logged=Object.keys(dayLog).length;

  const setSlot=slot=>setLog(prev=>{const day={...(prev[date]||{})};if(day[slot]===active)delete day[slot];else day[slot]=active;const next={...prev,[date]:day};if(Object.keys(day).length===0)delete next[date];return next;});
  const addCat=()=>{const c=newCat.trim();if(c&&!cats.includes(c)){setCats([...cats,c]);setActive(c);}setNewCat("");};
  const catColor=n=>CAT_COLORS[cats.indexOf(n)%CAT_COLORS.length];
  const shiftDate=n=>setDate(addDaysKey(date,n));

  const loggedDates=useMemo(()=>Object.keys(log).filter(d=>Object.keys(log[d]).length>0).sort(),[log]);
  const daysLogged=loggedDates.length;
  const streak=useMemo(()=>{
    if(!loggedDates.length)return 0;
    const set=new Set(loggedDates);
    let cur=set.has(todayKey())?todayKey():loggedDates[loggedDates.length-1];
    let n=0;while(set.has(cur)){n++;cur=addDaysKey(cur,-1);}return n;
  },[loggedDates]);

  const totals=useMemo(()=>{
    const acc={};
    const inRange=k=>range==="day"?k===date:range==="week"?weekStartKey(k)===weekStartKey(date):monthKey(k)===monthKey(date);
    Object.entries(log).forEach(([k,day])=>{if(!inRange(k))return;Object.values(day).forEach(c=>acc[c]=(acc[c]||0)+0.5);});
    return Object.entries(acc).map(([name,hours])=>({name,hours})).sort((a,b)=>b.hours-a.hours);
  },[log,range,date]);
  const totalHours=totals.reduce((s,t)=>s+t.hours,0);

  const weekHours=useMemo(()=>{
    const acc={};const ws=weekStartKey(date);
    Object.entries(log).forEach(([k,day])=>{if(weekStartKey(k)!==ws)return;Object.values(day).forEach(c=>acc[c]=(acc[c]||0)+0.5);});
    return acc;
  },[log,date]);

  const weeklyTrend=useMemo(()=>{
    const byWeek={};
    Object.entries(log).forEach(([k,day])=>{if(monthKey(k)!==monthKey(date))return;const w=weekStartKey(k);
      Object.values(day).forEach(c=>{byWeek[w]=byWeek[w]||{};byWeek[w][c]=(byWeek[w][c]||0)+0.5;});});
    return Object.entries(byWeek).sort().map(([w,obj])=>({week:fmtDate(w).replace(/^\w+, /,""),...obj}));
  },[log,date]);

  const exportData=()=>{
    const blob=new Blob([JSON.stringify({cats,log,goals,startHour},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");
    a.href=url;a.download=`hours-backup-${todayKey()}.json`;a.click();URL.revokeObjectURL(url);
  };
  const importData=e=>{
    const f=e.target.files?.[0];if(!f)return;const r=new FileReader();
    r.onload=()=>{try{const p=JSON.parse(r.result);
      if(p.cats)setCats(p.cats);if(p.log)setLog(p.log);if(p.goals)setGoals(p.goals);
      if(typeof p.startHour==="number")setStartHour(p.startHour);
    }catch{alert("That file couldn't be read. Pick an Hours backup file.");}};
    r.readAsText(f);e.target.value="";
  };

  const goalCats=cats.filter(c=>goals[c]>0);

  return(
    <div style={{minHeight:"100vh",background:PAPER,color:INK,fontFamily:"'Georgia',serif"}}>
      <style>{`
        *{box-sizing:border-box;}
        .sans{font-family:-apple-system,'Segoe UI',system-ui,sans-serif;}
        .mono{font-family:'Courier New',monospace;}
        button{cursor:pointer;font-family:inherit;}
        .slot{transition:background .12s;}
        .slot:focus-visible,.chip:focus-visible{outline:2px solid ${ACCENT};outline-offset:2px;}
        input:focus-visible,select:focus-visible{outline:2px solid ${ACCENT};}
        @media(prefers-reduced-motion:reduce){.slot{transition:none;}}
      `}</style>
      <div style={{maxWidth:920,margin:"0 auto",padding:"28px 20px 60px"}}>
        <header style={{borderBottom:`1px solid ${LINE}`,paddingBottom:18,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",flexWrap:"wrap",gap:10}}>
            <h1 style={{margin:0,fontSize:30,letterSpacing:"-0.02em"}}>Hours <span className="sans" style={{fontSize:11,color:savedFlash?ACCENT:"transparent",transition:"color .3s",verticalAlign:"middle"}}>· saved</span></h1>
            <div className="sans" style={{fontSize:12,color:MUTED,display:"flex",gap:14}}>
              <button onClick={()=>setShowSettings(s=>!s)} style={linkBtn}>Settings</button>
              <button onClick={exportData} style={linkBtn}>Backup</button>
              <button onClick={()=>fileRef.current?.click()} style={linkBtn}>Restore</button>
              <input ref={fileRef} type="file" accept="application/json" onChange={importData} style={{display:"none"}}/>
            </div>
          </div>
          <div className="sans" style={{marginTop:10,display:"flex",gap:18,fontSize:12,color:MUTED,flexWrap:"wrap"}}>
            <span><strong style={{color:INK}}>{daysLogged}</strong> {daysLogged===1?"day":"days"} logged</span>
            <span><strong style={{color:INK}}>{streak}</strong>-day streak</span>
            <span>day starts <strong style={{color:INK}}>{pad(startHour)}:00</strong></span>
          </div>
        </header>
        {showSettings&&(
          <div className="sans" style={{border:`1px solid ${LINE}`,borderRadius:10,padding:"16px 18px",marginBottom:22,background:"#fff"}}>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:13,fontWeight:600}}>Day starts at</label>
              <div style={{fontSize:11,color:MUTED,margin:"3px 0 8px"}}>Set this to when you go to sleep, so one night stays in one day.</div>
              <select value={startHour} onChange={e=>setStartHour(Number(e.target.value))}
                style={{padding:"7px 10px",borderRadius:8,border:`1px solid ${LINE}`,fontSize:13,background:PAPER}}>
                {Array.from({length:24},(_,h)=><option key={h} value={h}>{pad(h)}:00</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:13,fontWeight:600}}>Weekly goals (hours)</label>
              <div style={{fontSize:11,color:MUTED,margin:"3px 0 10px"}}>Optional. Progress shows below — a nudge, not a rule.</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8}}>
                {cats.map(c=>(
                  <div key={c} style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:catColor(c),flexShrink:0}}/>
                    <span style={{fontSize:12,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c}</span>
                    <input type="number" min="0" step="0.5" value={goals[c]||""} placeholder="—"
                      onChange={e=>setGoals(g=>({...g,[c]:Number(e.target.value)}))}
                      style={{width:52,padding:"4px 6px",borderRadius:6,border:`1px solid ${LINE}`,fontSize:12}}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <p className="sans" style={{margin:"0 0 20px",fontSize:13,color:MUTED,maxWidth:560,lineHeight:1.5}}>
          Tap a category, then tap the half-hours you spent on it. Tap a filled slot again to clear it. Log honestly, not aspirationally — the point is to see where time actually goes.
        </p>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <button onClick={()=>shiftDate(-1)} style={navBtn} aria-label="Previous day">←</button>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:20}}>{fmtDate(date)}</div>
            <div className="mono" style={{fontSize:11,color:MUTED,marginTop:2}}>{logged}/48 slots · {(logged*0.5).toFixed(1)}h</div>
          </div>
          <button onClick={()=>shiftDate(1)} style={navBtn} aria-label="Next day">→</button>
        </div>
        <div className="sans" style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:18}}>
          {cats.map(c=>(
            <button key={c} className="chip" onClick={()=>setActive(c)}
              style={{padding:"6px 12px",borderRadius:20,fontSize:13,border:`1px solid ${active===c?INK:LINE}`,
                background:active===c?INK:"transparent",color:active===c?PAPER:INK,display:"flex",alignItems:"center",gap:7}}>
              <span style={{width:9,height:9,borderRadius:"50%",background:catColor(c),display:"inline-block"}}/>{c}
            </button>
          ))}
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <input value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCat()}
              placeholder="add category" className="sans"
              style={{padding:"6px 10px",borderRadius:20,fontSize:13,border:`1px dashed ${LINE}`,background:"transparent",color:INK,width:130}}/>
            <button onClick={addCat} style={{...navBtn,width:32,height:32,fontSize:18,borderRadius:"50%"}} aria-label="Add category">+</button>
          </div>
        </div>
        <div style={{border:`1px solid ${LINE}`,borderRadius:10,overflow:"hidden",marginBottom:30,background:"#fff"}}>
          {Array.from({length:24},(_,row)=>{
            const s1=SLOTS[row*2],s2=SLOTS[row*2+1];
            const c1=dayLog[s1],c2=dayLog[s2];
            const label=s1.split("-")[0];
            return(
              <div key={row} style={{display:"grid",gridTemplateColumns:"58px 1fr 1fr",borderTop:row?`1px solid ${LINE}`:"none"}}>
                <div className="mono" style={{fontSize:11,color:MUTED,display:"flex",alignItems:"center",justifyContent:"center",background:PAPER}}>{label}</div>
                {[[s1,c1],[s2,c2]].map(([slot,c])=>(
                  <button key={slot} className="slot" onClick={()=>setSlot(slot)} title={`${slot}${c?` · ${c}`:""}`}
                    style={{border:"none",borderLeft:`1px solid ${LINE}`,height:34,background:c?catColor(c):"transparent",
                      color:c?"#fff":"transparent",fontSize:11,fontFamily:"-apple-system,sans-serif",textAlign:"left",
                      padding:"0 10px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c||"·"}</button>
                ))}
              </div>
            );
          })}
        </div>
        {goalCats.length>0&&(
          <div style={{marginBottom:34}}>
            <h2 style={{margin:"0 0 14px",fontSize:22}}>This week's goals</h2>
            <div className="sans" style={{display:"grid",gap:12}}>
              {goalCats.map(c=>{
                const have=weekHours[c]||0,want=goals[c],pct=Math.min(100,(have/want)*100);
                return(
                  <div key={c}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}>
                      <span style={{display:"flex",alignItems:"center",gap:7}}>
                        <span style={{width:9,height:9,borderRadius:"50%",background:catColor(c)}}/>{c}
                      </span>
                      <span className="mono" style={{color:MUTED}}>{have.toFixed(1)} / {want}h</span>
                    </div>
                    <div style={{height:8,borderRadius:5,background:LINE,overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",background:catColor(c),borderRadius:5,transition:"width .3s"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
          <h2 style={{margin:0,fontSize:22}}>Where the time went</h2>
          <div className="sans" style={{display:"flex",gap:6}}>
            {["day","week","month"].map(r=>(
              <button key={r} onClick={()=>setRange(r)}
                style={{padding:"5px 12px",fontSize:12,borderRadius:6,textTransform:"capitalize",
                  border:`1px solid ${range===r?ACCENT:LINE}`,background:range===r?ACCENT:"transparent",color:range===r?"#fff":INK}}>{r}</button>
            ))}
          </div>
        </div>
        {totalHours===0?(
          <div className="sans" style={{padding:"40px 20px",textAlign:"center",color:MUTED,border:`1px dashed ${LINE}`,borderRadius:10}}>
            Nothing logged for this {range} yet. Tap some slots above to begin.
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:24}}>
            <div style={{height:260}}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={totals} dataKey="hours" nameKey="name" innerRadius={45} outerRadius={90} paddingAngle={1}>
                    {totals.map((t,i)=><Cell key={i} fill={catColor(t.name)}/>)}
                  </Pie>
                  <Tooltip formatter={v=>`${v}h`}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{height:260}}>
              <ResponsiveContainer>
                <BarChart data={totals} layout="vertical" margin={{left:8,right:16}}>
                  <XAxis type="number" tick={{fontSize:11,fontFamily:"sans-serif"}}/>
                  <YAxis type="category" dataKey="name" width={110} tick={{fontSize:11,fontFamily:"sans-serif"}}/>
                  <Tooltip formatter={v=>`${v}h`}/>
                  <Bar dataKey="hours" radius={[0,4,4,0]}>{totals.map((t,i)=><Cell key={i} fill={catColor(t.name)}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {weeklyTrend.length>1&&(
          <div style={{marginTop:36}}>
            <h2 style={{margin:"0 0 14px",fontSize:22}}>Weekly trend · {monthKey(date)}</h2>
            <div style={{height:280}}>
              <ResponsiveContainer>
                <BarChart data={weeklyTrend} margin={{left:0,right:16}}>
                  <XAxis dataKey="week" tick={{fontSize:11,fontFamily:"sans-serif"}}/>
                  <YAxis tick={{fontSize:11,fontFamily:"sans-serif"}}/>
                  <Tooltip formatter={v=>`${v}h`}/>
                  <Legend wrapperStyle={{fontSize:11,fontFamily:"sans-serif"}}/>
                  {cats.map(c=><Bar key={c} dataKey={c} stackId="a" fill={catColor(c)}/>)}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        <p className="sans" style={{marginTop:40,fontSize:11,color:MUTED,borderTop:`1px solid ${LINE}`,paddingTop:16,lineHeight:1.6}}>
          Your data saves automatically in this browser. Use <strong>Backup</strong> now and then to save a file — if you clear your browser or switch phones, <strong>Restore</strong> brings it back.
        </p>
      </div>
    </div>
  );
}
const linkBtn={background:"none",border:"none",color:"#3D5A80",fontSize:12,textDecoration:"underline",padding:0};
const navBtn={width:40,height:40,borderRadius:10,border:"1px solid #E4E0D6",background:"#fff",fontSize:18,color:"#1B1B29",display:"flex",alignItems:"center",justifyContent:"center"};
