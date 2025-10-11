"use client";
import { useState } from "react";

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
type AnalyzeResponse = {
  text: string;
  label: "No issues" | "Moderate" | "Severe";
  metrics: Metrics;
  recommendations?: string;
  disclaimer: string;
};

export default function UploadAnalyze({ onResult }: { onResult: (data: AnalyzeResponse)=>void }){
  const [file,setFile]=useState<File|null>(null); const [prompt,setPrompt]=useState("Notes (optional)"); const [loading,setLoading]=useState(false); const [error,setError]=useState<string|null>(null);
  async function onSubmit(e:React.FormEvent){ e.preventDefault(); setError(null); if(!file){ setError("Please choose an image."); return; } setLoading(true); const base64=await toBase64(file);
    try{ const res=await fetch("/api/analyze",{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ imageBase64: base64.split(',')[1], mimeType: file.type || "image/jpeg", prompt }) });
      if(!res.ok) throw new Error(await res.text()); const data: AnalyzeResponse = await res.json(); onResult(data);
    }catch(e:any){ setError(e.message || "Failed to analyze"); } finally{ setLoading(false); } }
  function toBase64(file:File){ return new Promise<string>((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result as string); r.onerror=reject; r.readAsDataURL(file); }); }
  return (<form onSubmit={onSubmit} className="card grid gap-3">
    <div><label className="label">Choose or capture photo</label><input className="input" type="file" accept="image/*" capture="environment" onChange={(e)=>setFile(e.target.files?.[0]??null)}/></div>
    <div><label className="label">Analysis notes</label><textarea className="input" rows={3} value={prompt} onChange={e=>setPrompt(e.target.value)}/></div>
    <button className="btn" disabled={loading||!file}>{loading?"Analyzing...":"Upload & Analyze"}</button>
    {error && <p className="text-sm" style={{color:"crimson"}}>{error}</p>}
  </form>); }
