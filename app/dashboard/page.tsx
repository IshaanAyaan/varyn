"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import UploadAnalyze from "../../components/UploadAnalyze";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
type Metrics = {
  lesionAreaCm2: number;
  rednessLevel: number;
  scalingLevel: number;
  textureScore: number;
  colorVariationPct: number;
  severityScore: number;
  ambientTempC: number;
  humidityPct: number;
  skinHydrationAU: number;
};
type Result = { at: string; label?: string; text: string; metrics?: Metrics; disclaimer?: string; recommendations?: string };
export default function DashboardPage(){
  const router=useRouter(); const [user,setUser]=useState<{email:string,name?:string}|null>(null);
  const [results,setResults]=useState<Result[]>([]);
  const [apiReady,setApiReady]=useState<boolean|null>(null);
  useEffect(()=>{const u=typeof window!=="undefined" ? sessionStorage.getItem("varyn_user") : null; if(!u){router.replace("/login"); return;} setUser(JSON.parse(u));},[router]);
  useEffect(()=>{ (async()=>{ try{ const r=await fetch('/api/status'); if(r.ok){ const j=await r.json(); setApiReady(!!j.hasKey);} else { setApiReady(false);} }catch{ setApiReady(false);} })(); },[]);
  const byDay=useMemo(()=>{const m=new Map<string,number>(); for(const r of results){const day=r.at.slice(0,10); m.set(day,(m.get(day)??0)+1);} return Array.from(m.entries()).map(([day,count])=>({day,count})).sort((a,b)=>a.day.localeCompare(b.day));},[results]);
  const byLabel=useMemo(()=>{const m=new Map<string,number>(); for(const r of results){const label=r.label??"Unknown"; m.set(label,(m.get(label)??0)+1);} return Array.from(m.entries()).map(([label,count])=>({label,count}));},[results]);
  if(!user) return null;
  const colors = ["#7c3aed", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#14b8a6", "#a78bfa", "#f472b6"];
  return (<div className="grid gap-6">
    <div className="card"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><h1 className="text-xl font-semibold">Dashboard</h1><div className="text-sm text-gray-600">Signed in as {user.email}</div></div>
      <button className="btn ghost" onClick={()=>{sessionStorage.removeItem("varyn_user"); window.location.href="/login";}}>Sign out</button>
    </div></div>
    <div className="grid" style={{gap:"1rem"}}>
      <div className="card" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div className="font-semibold">System Status</div>
          <div className="text-sm text-gray-600">Gemini API key</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
          <span style={{display:'inline-block',width:10,height:10,borderRadius:9999,background: apiReady? '#22c55e' : apiReady===false? '#ef4444' : '#f59e0b'}} />
          <span className="text-sm">{apiReady===null? 'Checking…' : apiReady? 'Ready' : 'Unavailable'}</span>
        </div>
      </div>
      <UploadAnalyze onResult={(data)=>{
        setResults(prev=>[
          { at: new Date().toISOString(), label: data.label, text: data.text, metrics: data.metrics, disclaimer: data.disclaimer, recommendations: data.recommendations },
          ...prev
        ]);
      }}/>
    </div>
    {results.length>0 && results[0].metrics && (
      <div className="card">
        <h3 className="font-semibold mb-2">Latest Scan Metrics</h3>
        {/* Chart first, then count to place graph above number of metrics */}
        <div style={{overflowX:'auto'}}>
          <BarChart width={760} height={300} data={[
            {name:'Lesion Area (cm²)', value: results[0].metrics!.lesionAreaCm2},
            {name:'Redness (0-10)', value: results[0].metrics!.rednessLevel*10},
            {name:'Scaling (0-10)', value: results[0].metrics!.scalingLevel*10},
            {name:'Texture (0-10)', value: results[0].metrics!.textureScore*10},
            {name:'Color Variation (%)', value: results[0].metrics!.colorVariationPct},
            {name:'Severity (0-100)', value: results[0].metrics!.severityScore},
            {name:'Ambient Temp (°C)', value: results[0].metrics!.ambientTempC},
            {name:'Humidity (%)', value: results[0].metrics!.humidityPct},
            {name:'Skin Hydration (AU)', value: results[0].metrics!.skinHydrationAU},
          ]}>
            <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={80}/>
            <YAxis/>
            <Tooltip/>
            <Bar dataKey="value" fill="#0ea5e9"/>
          </BarChart>
        </div>
        <div className="text-sm text-gray-600" style={{marginTop:'.5rem'}}>
          9 metrics
        </div>
      </div>
    )}
    <div className="card"><h2 className="font-semibold mb-2">Session Results</h2>
      {results.length===0 ? (<p className="text-sm text-gray-600">No results yet.</p>) : (
        <div className="grid" style={{gap:"0.75rem"}}>
          {results.map((r,i)=>{
            const sev = r.metrics?.severityScore ?? 0;
            const sevLabel = r.label ?? (sev >= 70 ? 'Severe' : sev >= 30 ? 'Moderate' : 'No issues');
            const sevColor = sev >= 70 ? '#ef4444' : sev >= 30 ? '#f59e0b' : '#22c55e';
            return (
              <div key={i} className="text-sm" style={{display:'grid', gap: '.5rem'}}>
                <div style={{color:"#666"}}>{new Date(r.at).toLocaleString()}</div>
                {/* Severity box */}
                <div className="severity-card">
                  <div className="severity-header">
                    <div style={{display:'flex', alignItems:'center', gap:'.5rem'}}>
                      <span className="severity-badge" style={{color: sevColor}}>{sevLabel}</span>
                      <span style={{fontWeight:600}}>Severity Score: {Math.round(sev)}</span>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'.5rem'}}>
                      <span style={{fontSize:12, color:'#64748b'}}>Low</span>
                      <div className="severity-gauge" style={{width:180}}>
                        <span className="severity-pointer" style={{left: `${Math.max(0, Math.min(100, sev))}%`, background: sevColor}} />
                      </div>
                      <span style={{fontSize:12, color:'#64748b'}}>High</span>
                    </div>
                  </div>
                </div>

                {/* Medical advice (caution) */}
                {(r.recommendations || r.disclaimer) && (
                  <div className="caution-card">
                    <div className="caution-title">
                      <span role="img" aria-label="caution">⚠️</span>
                      Medical Advice
                    </div>
                    {r.recommendations && (
                      <div style={{marginTop:'.35rem'}}>{r.recommendations}</div>
                    )}
                    {r.disclaimer && (
                      <div className="caution-subtle" style={{marginTop:'.35rem'}}>{r.disclaimer}</div>
                    )}
                  </div>
                )}

                {/* Raw analysis text */}
                <pre style={{whiteSpace:"pre-wrap"}}>{r.text}</pre>
              </div>
            );
          })}
        </div>
      )}
    </div>
  <div className="grid grid-2">
      <div className="card"><h3 className="font-semibold mb-2">Analyses per day</h3>
        <BarChart width={520} height={280} data={byDay}><XAxis dataKey="day"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count" fill="#7c3aed"/></BarChart>
      </div>
      <div className="card"><h3 className="font-semibold mb-2">Labels distribution</h3>
        <PieChart width={520} height={280}><Pie data={byLabel} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={100}>{byLabel.map((_,idx)=>(<Cell key={idx} fill={colors[idx % colors.length]}/>))}</Pie><Tooltip/><Legend/></PieChart>
      </div>
    </div>
  </div>); }
